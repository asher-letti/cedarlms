import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import TimeOnMaterials from "./TimeOnMaterials";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ view?: string }>;

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

export default async function StudentsPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id: courseId } = await params;
  const sp = await searchParams;
  const view = sp.view === "time" ? "time" : "progress";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: course } = await supabase.from("courses")
    .select("id, title, instructor_id").eq("id", courseId).maybeSingle();
  if (!course || course.instructor_id !== user.id) notFound();

  const header = (
    <div>
      <Link href={`/instructor/courses/${course.id}`} className="text-sm text-mocha-700 hover:underline underline-offset-4">← Back to course</Link>
      <span className="chip mt-3 inline-flex">Students</span>
      <h1 className="h-display mt-2 text-4xl">{course.title}</h1>
      <p className="mt-1 text-muted">Track each learner's progress, time spent and submissions.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/instructor/courses/${course.id}/students`}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            view === "progress"
              ? "bg-mocha-700 text-cream-50 shadow-[0_1px_2px_rgba(42,27,15,0.20)]"
              : "bg-white text-mocha-800 ring-1 ring-line hover:ring-mocha-300 hover:bg-cream-50"
          }`}
        >
          Progress
        </Link>
        <Link
          href={`/instructor/courses/${course.id}/students?view=time`}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            view === "time"
              ? "bg-mocha-700 text-cream-50 shadow-[0_1px_2px_rgba(42,27,15,0.20)]"
              : "bg-white text-mocha-800 ring-1 ring-line hover:ring-mocha-300 hover:bg-cream-50"
          }`}
        >
          Time on Materials
        </Link>
      </div>
    </div>
  );

  if (view === "time") {
    return (
      <div className="space-y-10">
        {header}
        <TimeOnMaterials courseId={courseId} />
      </div>
    );
  }

  // Default view: progress (existing behavior)
  const [lessonsRes, assignmentsRes, enrollmentsRes] = await Promise.all([
    supabase.from("lessons").select("id, content_type").eq("course_id", courseId),
    supabase.from("assignments").select("id").eq("course_id", courseId),
    supabase.from("enrollments")
      .select("user_id, enrolled_at, profiles:user_id(full_name)")
      .eq("course_id", courseId),
  ]);
  const lessonIds = (lessonsRes.data ?? []).map((l: any) => l.id);
  const totalLessons = lessonIds.length;
  const assignmentIds = (assignmentsRes.data ?? []).map((a: any) => a.id);
  const enrollments = (enrollmentsRes.data ?? []) as any[];

  const [progressRes, attemptsRes, submissionsRes] = await Promise.all([
    lessonIds.length
      ? supabase.from("lesson_progress")
          .select("user_id, lesson_id, completed, completed_at")
          .eq("completed", true)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as any[] }),
    lessonIds.length
      ? supabase.from("quiz_attempts")
          .select("user_id, lesson_id, score, total, attempted_at")
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as any[] }),
    assignmentIds.length
      ? supabase.from("submissions")
          .select("user_id, grade, graded_at, submitted_at, assignment_id")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const progressRows = (progressRes.data ?? []) as any[];
  const attempts = (attemptsRes.data ?? []) as any[];
  const submissions = (submissionsRes.data ?? []) as any[];

  type Row = {
    userId: string;
    name: string;
    enrolledAt: string;
    completedLessons: number;
    progressPct: number;
    quizAvgPct: number | null;
    submissions: number;
    avgGrade: number | null;
    lastActive: string | null;
  };

  const rows: Row[] = enrollments.map((e: any) => {
    const userId = e.user_id;
    const completed = progressRows.filter(p => p.user_id === userId).length;
    const progressPct = totalLessons > 0 ? (completed / totalLessons) * 100 : 0;

    const bestByLesson = new Map<string, number>();
    attempts.filter(a => a.user_id === userId).forEach(a => {
      const pct = a.total > 0 ? (a.score / a.total) * 100 : 0;
      const cur = bestByLesson.get(a.lesson_id) ?? -1;
      if (pct > cur) bestByLesson.set(a.lesson_id, pct);
    });
    const quizAvgPct = bestByLesson.size === 0
      ? null
      : Array.from(bestByLesson.values()).reduce((a, b) => a + b, 0) / bestByLesson.size;

    const userSubs = submissions.filter(s => s.user_id === userId);
    const graded = userSubs.filter(s => s.grade != null);
    const avgGrade = graded.length === 0
      ? null
      : graded.reduce((a, b) => a + Number(b.grade), 0) / graded.length;

    const dates: string[] = [
      e.enrolled_at,
      ...progressRows.filter(p => p.user_id === userId).map(p => p.completed_at).filter(Boolean),
      ...attempts.filter(a => a.user_id === userId).map(a => a.attempted_at),
      ...userSubs.map(s => s.submitted_at),
    ].filter(Boolean) as string[];
    const lastActive = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;

    return {
      userId,
      name: e.profiles?.full_name ?? "Learner",
      enrolledAt: e.enrolled_at,
      completedLessons: completed,
      progressPct,
      quizAvgPct,
      submissions: userSubs.length,
      avgGrade,
      lastActive,
    };
  }).sort((a, b) => b.progressPct - a.progressPct);

  const avgProgressAll = rows.length === 0 ? 0 : rows.reduce((a, b) => a + b.progressPct, 0) / rows.length;
  const studentCount = rows.length;
  const completedCount = rows.filter(r => r.progressPct === 100).length;
  const ungraded = submissions.filter(s => !s.graded_at).length;

  return (
    <div className="space-y-10">
      {header}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Enrolled" value={studentCount} sub="Active learners" />
        <Metric label="Avg. progress" value={`${Math.round(avgProgressAll)}%`} sub={`${totalLessons} lessons total`} />
        <Metric label="Completed" value={completedCount} sub="Finished the course" />
        <Metric label="To grade" value={ungraded} sub="Pending feedback" tone={ungraded > 0 ? "amber" : "default"} />
      </section>

      <section>
        <h2 className="h-display text-2xl">Progress by student</h2>
        {rows.length === 0 ? (
          <div className="card mt-4 p-12 text-center">
            <p className="font-display text-xl text-mocha-900">No students enrolled yet.</p>
            <p className="mt-2 text-muted">Once people enroll they'll appear here with their progress.</p>
          </div>
        ) : (
          <div className="card mt-4 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 border-b border-line bg-cream-50/60 px-5 py-3 text-xs uppercase tracking-wider text-muted">
              <div className="col-span-4">Student</div>
              <div className="col-span-3">Progress</div>
              <div className="col-span-2">Quiz avg</div>
              <div className="col-span-1">Subs</div>
              <div className="col-span-2">Last active</div>
            </div>
            <ul className="divide-y divide-line">
              {rows.map(r => {
                const initials = r.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "L";
                return (
                  <li key={r.userId} className="grid md:grid-cols-12 gap-3 md:gap-4 px-5 py-4 hover:bg-cream-50/60 transition">
                    <div className="md:col-span-4 flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mocha-100 text-mocha-800 text-xs font-semibold">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-mocha-900 truncate">{r.name}</p>
                        <p className="text-xs text-muted">Enrolled {new Date(r.enrolledAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.progressPct} className="flex-1" />
                        <span className="text-xs font-medium text-mocha-800 min-w-[36px] text-right">{Math.round(r.progressPct)}%</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{r.completedLessons}/{totalLessons} lessons</p>
                    </div>
                    <div className="md:col-span-2 text-sm text-mocha-800">
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
      </section>
    </div>
  );
}

function Metric({
  label, value, sub, tone = "default",
}: { label: string; value: number | string; sub?: string; tone?: "default" | "amber" }) {
  const accent = tone === "amber" ? "text-amber-700" : "text-mocha-900";
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 font-display text-4xl ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
