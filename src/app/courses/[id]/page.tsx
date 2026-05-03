import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EnrollButton from "./EnrollButton";
import LessonItem from "./LessonItem";
import AssignmentsLearner from "./AssignmentsLearner";
import CourseCover from "@/components/CourseCover";
import ProgressBar from "@/components/ProgressBar";
import { fmtDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, cover_url, instructor_id, published, profiles:instructor_id(full_name)")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, position, content_type, storage_path, body, duration_minutes")
    .eq("course_id", id)
    .order("position");

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

  const lessonIds = (lessons ?? []).map(l => l.id);
  const { data: myProgress } = enrolled && !isInstructor && user && lessonIds.length
    ? await supabase.from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
    : { data: null };

  const completedSet = new Set(((myProgress as any[]) ?? []).filter(p => p.completed).map(p => p.lesson_id));
  const totalLessons = lessons?.length ?? 0;
  const completedLessons = completedSet.size;
  const progressPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const totalDurationMin = (lessons ?? []).reduce(
    (sum, l: any) => sum + (l.duration_minutes ?? 0), 0
  );
  const totalDurationLabel = fmtDuration(totalDurationMin);

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
        <ul className="card mt-4 divide-y divide-line overflow-hidden">
          {lessons?.length ? lessons.map((l: any, i: number) => (
            <LessonItem
              key={l.id}
              lesson={l}
              canAccess={canAccess}
              index={i + 1}
              initiallyComplete={completedSet.has(l.id)}
              userId={enrolled && !isInstructor ? user?.id ?? null : null}
            />
          )) : <li className="p-8 text-muted text-center">No lessons yet.</li>}
        </ul>

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
                <EnrollButton courseId={course.id} enrolled={enrolled} />
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
