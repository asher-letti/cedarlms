import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/auth";
import ProgressBar from "@/components/ProgressBar";

export const dynamic = "force-dynamic";

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 0)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function AllStudentsPage() {
  const { user } = await getSession();
  const supabase = await createClient();

  // All my courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("instructor_id", user!.id);
  const myCourses = (courses ?? []) as any[];
  const courseIds = myCourses.map((c) => c.id);

  if (courseIds.length === 0) {
    return (
      <div className="space-y-10">
        <header>
          <span className="chip">Students</span>
          <h1 className="h-display mt-3 text-4xl">All students</h1>
          <p className="mt-2 text-muted">Everyone enrolled across your courses.</p>
        </header>
        <div className="card p-12 text-center">
          <p className="font-display text-xl text-mocha-900">No courses yet.</p>
          <p className="mt-2 text-muted">Create a course first; enrolled learners show up here.</p>
          <Link href="/instructor/courses/new" className="btn-primary mt-5 inline-flex">Create a course</Link>
        </div>
      </div>
    );
  }

  // Lessons + assignments per course
  const [lessonsRes, assignmentsRes, enrollmentsRes] = await Promise.all([
    supabase.from("lessons").select("id, course_id").in("course_id", courseIds),
    supabase.from("assignments").select("id, course_id").in("course_id", courseIds),
    supabase
      .from("enrollments")
      .select("user_id, course_id, enrolled_at, profiles:user_id(full_name)")
      .in("course_id", courseIds),
  ]);

  const lessons = (lessonsRes.data ?? []) as any[];
  const assignments = (assignmentsRes.data ?? []) as any[];
  const enrollments = (enrollmentsRes.data ?? []) as any[];

  const lessonIds = lessons.map((l) => l.id);
  const assignmentIds = assignments.map((a) => a.id);

  const [progressRes, attemptsRes, submissionsRes] = await Promise.all([
    lessonIds.length
      ? supabase.from("lesson_progress")
          .select("user_id, lesson_id, completed, completed_at")
          .eq("completed", true).in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as any[] }),
    lessonIds.length
      ? supabase.from("quiz_attempts")
          .select("user_id, lesson_id, score, total, attempted_at")
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as any[] }),
    assignmentIds.length
      ? supabase.from("submissions")
          .select("user_id, grade, submitted_at, graded_at")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const progress = (progressRes.data ?? []) as any[];
  const attempts = (attemptsRes.data ?? []) as any[];
  const submissions = (submissionsRes.data ?? []) as any[];

  // Build per-user aggregate. A user can be enrolled in multiple of my courses.
  type UserAgg = {
    userId: string;
    name: string;
    coursesEnrolled: number;
    totalLessonsAcrossCourses: number;
    completedLessons: number;
    avgProgressPct: number;
    quizAvgPct: number | null;
    submissions: number;
    avgGrade: number | null;
    lastActive: string | null;
  };

  const lessonsByCourse = new Map<string, string[]>();
  lessons.forEach((l) => {
    const arr = lessonsByCourse.get(l.course_id) ?? [];
    arr.push(l.id);
    lessonsByCourse.set(l.course_id, arr);
  });

  const userIds = Array.from(new Set(enrollments.map((e) => e.user_id)));
  const userMap = new Map<string, UserAgg>();
  enrollments.forEach((e) => {
    const cur = userMap.get(e.user_id);
    if (cur) {
      cur.coursesEnrolled += 1;
      cur.totalLessonsAcrossCourses += (lessonsByCourse.get(e.course_id) ?? []).length;
    } else {
      userMap.set(e.user_id, {
        userId: e.user_id,
        name: e.profiles?.full_name ?? "Learner",
        coursesEnrolled: 1,
        totalLessonsAcrossCourses: (lessonsByCourse.get(e.course_id) ?? []).length,
        completedLessons: 0,
        avgProgressPct: 0,
        quizAvgPct: null,
        submissions: 0,
        avgGrade: null,
        lastActive: e.enrolled_at,
      });
    }
  });

  userIds.forEach((uid) => {
    const u = userMap.get(uid)!;
    const userProgress = progress.filter((p) => p.user_id === uid);
    u.completedLessons = userProgress.length;
    u.avgProgressPct = u.totalLessonsAcrossCourses > 0
      ? (u.completedLessons / u.totalLessonsAcrossCourses) * 100
      : 0;

    const bestByLesson = new Map<string, number>();
    attempts.filter((a) => a.user_id === uid).forEach((a) => {
      const pct = a.total > 0 ? (a.score / a.total) * 100 : 0;
      const cur = bestByLesson.get(a.lesson_id) ?? -1;
      if (pct > cur) bestByLesson.set(a.lesson_id, pct);
    });
    u.quizAvgPct = bestByLesson.size === 0 ? null
      : Array.from(bestByLesson.values()).reduce((a, b) => a + b, 0) / bestByLesson.size;

    const userSubs = submissions.filter((s) => s.user_id === uid);
    u.submissions = userSubs.length;
    const graded = userSubs.filter((s) => s.grade != null);
    u.avgGrade = graded.length === 0 ? null
      : graded.reduce((a, b) => a + Number(b.grade), 0) / graded.length;

    const dates: string[] = [
      u.lastActive,
      ...userProgress.map((p) => p.completed_at).filter(Boolean),
      ...attempts.filter((a) => a.user_id === uid).map((a) => a.attempted_at),
      ...userSubs.map((s) => s.submitted_at),
    ].filter(Boolean) as string[];
    u.lastActive = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : u.lastActive;
  });

  const rows = Array.from(userMap.values()).sort((a, b) => b.avgProgressPct - a.avgProgressPct);

  return (
    <div className="space-y-10">
      <header>
        <span className="chip">Students</span>
        <h1 className="h-display mt-3 text-4xl">All students</h1>
        <p className="mt-2 text-muted">{rows.length} unique learners across {myCourses.length} course{myCourses.length === 1 ? "" : "s"}.</p>
      </header>

      {rows.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-xl text-mocha-900">No enrollments yet.</p>
          <p className="mt-2 text-muted">When learners enroll, they'll appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b border-line bg-cream-50/60 px-5 py-3 text-xs uppercase tracking-wider text-muted">
            <div className="col-span-4">Student</div>
            <div className="col-span-1">Courses</div>
            <div className="col-span-3">Progress</div>
            <div className="col-span-1">Quiz avg</div>
            <div className="col-span-1">Subs</div>
            <div className="col-span-2">Last active</div>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const initials = r.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "L";
              const status =
                r.avgProgressPct === 100 ? { label: "Complete", cls: "bg-emerald-50 text-emerald-700 ring-emerald-100" } :
                r.avgProgressPct >= 50 ? { label: "On track", cls: "bg-cream-100 text-mocha-700 ring-mocha-100" } :
                { label: "At risk", cls: "bg-amber-50 text-amber-800 ring-amber-100" };
              return (
                <li key={r.userId} className="grid md:grid-cols-12 gap-3 md:gap-4 px-5 py-4 hover:bg-cream-50/60 transition">
                  <div className="md:col-span-4 flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mocha-100 text-mocha-800 text-xs font-semibold">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-mocha-900 truncate">{r.name}</p>
                      <span className={`chip mt-0.5 ${status.cls}`}>{status.label}</span>
                    </div>
                  </div>
                  <div className="md:col-span-1 text-sm text-mocha-800">{r.coursesEnrolled}</div>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.avgProgressPct} className="flex-1" />
                      <span className="text-xs font-medium text-mocha-800 min-w-[36px] text-right">{Math.round(r.avgProgressPct)}%</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{r.completedLessons}/{r.totalLessonsAcrossCourses} lessons</p>
                  </div>
                  <div className="md:col-span-1 text-sm text-mocha-800">
                    {r.quizAvgPct == null ? <span className="text-muted">—</span> : `${Math.round(r.quizAvgPct)}%`}
                  </div>
                  <div className="md:col-span-1 text-sm text-mocha-800">
                    {r.submissions}
                    {r.avgGrade != null && <span className="ml-1 text-xs text-muted">({Math.round(r.avgGrade)})</span>}
                  </div>
                  <div className="md:col-span-2 text-xs text-muted">{timeAgo(r.lastActive)}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
