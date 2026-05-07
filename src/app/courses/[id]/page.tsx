import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EnrollButton from "./EnrollButton";
import LessonItem from "./LessonItem";
import AssignmentsLearner from "./AssignmentsLearner";
import CourseCover from "@/components/CourseCover";
import ProgressBar from "@/components/ProgressBar";
import { fmtDuration } from "@/lib/format";
import {
  currentWeekNumber,
  effectiveUnlockDate,
  fmtUnlockDate,
} from "@/lib/scheduling";

export const dynamic = "force-dynamic";

type Lesson = {
  id: string;
  title: string;
  position: number;
  content_type: "video" | "document" | "quiz" | "text";
  storage_path: string | null;
  body: string | null;
  duration_minutes: number | null;
  week_number: number | null;
  available_from: string | null;
};

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, cover_url, instructor_id, published, requires_enrollment_key, course_start_date, profiles:instructor_id(full_name)")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const { data: lessonsRaw } = await supabase
    .from("lessons")
    .select("id, title, position, content_type, storage_path, body, duration_minutes, week_number, available_from")
    .eq("course_id", id)
    .order("week_number", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true });

  const lessons = (lessonsRaw ?? []) as Lesson[];

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, course_id, title, description, deadline, max_points")
    .eq("course_id", id)
    .order("created_at");

  const { data: { user } } = await supabase.auth.getUser();
  let enrolled = false;
  let role: string | null = null;
  if (user) {
    const { data: e } = await supabase.from("enrollments").select("id")
      .eq("course_id", id).eq("user_id", user.id).maybeSingle();
    enrolled = !!e;
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = prof?.role ?? null;
  }
  const isInstructor = user?.id === course.instructor_id;
  const canAccess = enrolled || isInstructor;

  const { data: mySubs } = canAccess && !isInstructor && user
    ? await supabase.from("submissions")
        .select("id, assignment_id, file_path, text_content, submitted_at, grade, feedback, graded_at")
        .eq("user_id", user.id)
    : { data: null };

  const lessonIds = lessons.map((l) => l.id);
  const { data: myProgress } = enrolled && !isInstructor && user && lessonIds.length
    ? await supabase.from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
    : { data: null };

  const completedSet = new Set(((myProgress as any[]) ?? []).filter(p => p.completed).map(p => p.lesson_id));
  const totalLessons = lessons.length;
  const completedLessons = completedSet.size;
  const progressPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const totalDurationMin = lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);
  const totalDurationLabel = fmtDuration(totalDurationMin);

  // Group lessons by week (null → "Unscheduled" at the end)
  const groups = (() => {
    const map = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const k = l.week_number != null ? String(l.week_number) : "unscheduled";
      const arr = map.get(k) ?? [];
      arr.push(l);
      map.set(k, arr);
    }
    const order = Array.from(map.keys())
      .filter((k) => k !== "unscheduled")
      .map(Number)
      .sort((a, b) => a - b)
      .map(String);
    if (map.has("unscheduled")) order.push("unscheduled");
    return order.map((k) => ({ key: k, items: map.get(k)! }));
  })();

  const currWeek = currentWeekNumber(course.course_start_date);

  // Continuous index across groups so LessonItem indices stay sequential.
  let runningIndex = 0;

  return (
    <article className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="card overflow-hidden mb-8">
          <div className="aspect-[16/7] w-full">
            <CourseCover id={course.id} title={course.title} url={course.cover_url} />
          </div>
        </div>

        <span className="chip">Course</span>
        <h1 className="h-display mt-3 text-4xl">{course.title}</h1>
        <p className="mt-2 text-sm uppercase tracking-wider text-mocha-600">
          By {(course.profiles as any)?.full_name ?? "Instructor"}
          {course.course_start_date && (
            <> · Starts {fmtUnlockDate(new Date(`${course.course_start_date}T00:00:00`))}</>
          )}
        </p>
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-mocha-800">{course.description}</p>

        <div className="divider my-12" />

        <div className="flex items-baseline justify-between">
          <h2 className="h-display text-2xl">Curriculum</h2>
          <span className="text-xs uppercase tracking-wider text-muted">
            {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
            {totalDurationLabel && <> · {totalDurationLabel}</>}
          </span>
        </div>

        {totalLessons === 0 ? (
          <div className="card mt-4 p-8 text-center text-muted">No lessons yet.</div>
        ) : (
          <div className="mt-4 space-y-6">
            {groups.map((g) => {
              const isUnscheduled = g.key === "unscheduled";
              const weekNum = isUnscheduled ? null : Number(g.key);
              const unlock = isUnscheduled
                ? null
                : effectiveUnlockDate(weekNum, null, course.course_start_date);
              const isCurrent = !isUnscheduled && currWeek != null && weekNum === currWeek;

              return (
                <div key={g.key}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-lg text-mocha-900">
                      {isUnscheduled ? "Unscheduled" : `Week ${weekNum}`}
                      {isCurrent && (
                        <span className="ml-2 align-middle inline-flex items-center rounded-full bg-mocha-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cream-50">
                          This week
                        </span>
                      )}
                    </h3>
                    {!isUnscheduled && unlock && (
                      <span className="text-xs uppercase tracking-wider text-muted">
                        {unlock.getTime() <= Date.now() ? "Open" : "Opens"} {fmtUnlockDate(unlock)}
                      </span>
                    )}
                  </div>
                  <ul className="card mt-2 divide-y divide-line overflow-hidden">
                    {g.items.map((l) => {
                      runningIndex += 1;
                      return (
                        <LessonItem
                          key={l.id}
                          lesson={l}
                          canAccess={canAccess}
                          index={runningIndex}
                          initiallyComplete={completedSet.has(l.id)}
                          userId={enrolled && !isInstructor ? user?.id ?? null : null}
                          isInstructor={isInstructor}
                          courseId={course.id}
                          courseStartDate={course.course_start_date ?? null}
                          isCurrentWeek={isCurrent}
                        />
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {assignments && assignments.length > 0 && (
          <>
            <div className="divider my-12" />
            <div className="flex items-baseline justify-between">
              <h2 className="h-display text-2xl">Assignments</h2>
              <span className="text-xs uppercase tracking-wider text-muted">{assignments.length} total</span>
            </div>
            {isInstructor ? (
              <div className="card mt-4 p-6">
                <p className="text-sm text-muted">Manage assignments and view submissions on the instructor page.</p>
                <Link href={`/instructor/courses/${course.id}`} className="btn-secondary mt-3">Open management</Link>
              </div>
            ) : canAccess && user ? (
              <AssignmentsLearner
                assignments={assignments as any}
                mySubmissions={(mySubs as any) ?? []}
                userId={user.id}
                courseId={course.id}
              />
            ) : (
              <div className="card mt-4 p-6">
                <p className="text-sm text-muted">Enroll to see and submit assignments.</p>
              </div>
            )}
          </>
        )}
      </div>

      <aside>
        <div className="card p-6 sticky top-24">
          {enrolled && !isInstructor && totalLessons > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-mocha-600">Your progress</p>
              <p className="mt-1 font-display text-3xl text-mocha-900">{Math.round(progressPct)}%</p>
              <p className="mt-1 text-sm text-muted">{completedLessons} of {totalLessons} lessons completed</p>
              <div className="mt-3"><ProgressBar value={progressPct} /></div>
              <div className="my-5 h-px bg-line" />
            </>
          )}

          <p className="text-xs uppercase tracking-wider text-mocha-600">Enrollment</p>
          <p className="mt-1 font-display text-3xl text-mocha-900">Free</p>
          <p className="mt-2 text-sm text-muted">Lifetime access · learn at your pace.</p>

          <div className="mt-5">
            {user ? (
              isInstructor ? (
                <Link href={`/instructor/courses/${course.id}`} className="btn-primary w-full">Manage course</Link>
              ) : role === "instructor" ? (
                <p className="rounded-xl bg-cream-100 p-3 text-xs text-muted">Instructors browse but don't enroll.</p>
              ) : (
                <EnrollButton
                  courseId={course.id}
                  courseTitle={course.title}
                  enrolled={enrolled}
                  requiresKey={!!course.requires_enrollment_key}
                />
              )
            ) : (
              <Link href="/login" className="btn-primary w-full">Sign in to enroll</Link>
            )}
          </div>

          <ul className="mt-6 space-y-2.5 text-sm text-mocha-800">
            <li className="flex items-center gap-2"><Dot/> {totalLessons} lessons</li>
            {totalDurationLabel && <li className="flex items-center gap-2"><Dot/> {totalDurationLabel} of content</li>}
            <li className="flex items-center gap-2"><Dot/> {assignments?.length ?? 0} assignments</li>
            <li className="flex items-center gap-2"><Dot/> Videos, documents & readings</li>
            <li className="flex items-center gap-2"><Dot/> Access on any device</li>
          </ul>
        </div>
      </aside>
    </article>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-mocha-400 inline-block" />;
}
