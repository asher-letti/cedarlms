import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmtDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r === 0 ? `${m}m` : `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

const isPdfPath = (p: string | null | undefined) =>
  !!p && /\.pdf($|\?|#)/i.test(p);

export default async function TimeOnMaterials({ courseId }: { courseId: string }) {
  const supabase = await createClient();

  const [lessonsRes, assignmentsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, content_type, storage_path, position, week_number")
      .eq("course_id", courseId)
      .order("week_number", { ascending: true, nullsFirst: false })
      .order("position", { ascending: true }),
    supabase
      .from("assignments")
      .select("id, title, deadline")
      .eq("course_id", courseId)
      .order("created_at"),
    supabase
      .from("enrollments")
      .select("user_id, profiles:user_id(full_name)")
      .eq("course_id", courseId),
  ]);

  const lessons = (lessonsRes.data ?? []) as any[];
  const assignments = (assignmentsRes.data ?? []) as any[];
  const enrollments = (enrollmentsRes.data ?? []) as any[];
  const lessonIds = lessons.map((l) => l.id);
  const assignmentIds = assignments.map((a) => a.id);

  const [lessonSessionsRes, assignmentSessionsRes, submissionsRes] = await Promise.all([
    lessonIds.length
      ? supabase
          .from("material_sessions")
          .select("user_id, lesson_id, duration_seconds, ended_at, started_at")
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as any[] }),
    assignmentIds.length
      ? supabase
          .from("material_sessions")
          .select("user_id, assignment_id, duration_seconds, ended_at, started_at")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as any[] }),
    assignmentIds.length
      ? supabase
          .from("submissions")
          .select("user_id, assignment_id, submitted_at")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const lessonSessions = (lessonSessionsRes.data ?? []) as any[];
  const assignmentSessions = (assignmentSessionsRes.data ?? []) as any[];
  const submissions = (submissionsRes.data ?? []) as any[];

  const userName = new Map<string, string>();
  enrollments.forEach((e: any) => userName.set(e.user_id, e.profiles?.full_name ?? "Learner"));

  // Aggregate lesson sessions: (user_id, lesson_id) → total seconds + last opened
  type Agg = {
    userId: string;
    name: string;
    targetId: string;
    target: string;
    isPdf: boolean;
    isAssignment: boolean;
    totalSec: number;
    lastEnded: string | null;
    sessionCount: number;
  };
  const map = new Map<string, Agg>();

  for (const s of lessonSessions) {
    const lesson = lessons.find((l) => l.id === s.lesson_id);
    if (!lesson) continue;
    const k = `L|${s.user_id}|${s.lesson_id}`;
    const cur = map.get(k) ?? {
      userId: s.user_id,
      name: userName.get(s.user_id) ?? "Learner",
      targetId: s.lesson_id,
      target: lesson.title,
      isPdf: lesson.content_type === "document" && isPdfPath(lesson.storage_path),
      isAssignment: false,
      totalSec: 0,
      lastEnded: null,
      sessionCount: 0,
    };
    cur.totalSec += Number(s.duration_seconds || 0);
    cur.sessionCount += 1;
    const t = s.ended_at ?? s.started_at;
    if (t && (!cur.lastEnded || t > cur.lastEnded)) cur.lastEnded = t;
    map.set(k, cur);
  }

  for (const s of assignmentSessions) {
    const a = assignments.find((x) => x.id === s.assignment_id);
    if (!a) continue;
    const k = `A|${s.user_id}|${s.assignment_id}`;
    const cur = map.get(k) ?? {
      userId: s.user_id,
      name: userName.get(s.user_id) ?? "Learner",
      targetId: s.assignment_id,
      target: a.title,
      isPdf: false,
      isAssignment: true,
      totalSec: 0,
      lastEnded: null,
      sessionCount: 0,
    };
    cur.totalSec += Number(s.duration_seconds || 0);
    cur.sessionCount += 1;
    const t = s.ended_at ?? s.started_at;
    if (t && (!cur.lastEnded || t > cur.lastEnded)) cur.lastEnded = t;
    map.set(k, cur);
  }

  const rows = Array.from(map.values()).sort((a, b) => {
    if (b.totalSec !== a.totalSec) return b.totalSec - a.totalSec;
    return a.name.localeCompare(b.name);
  });

  // Per-material aggregates: average across students
  const lessonAgg = new Map<string, { total: number; count: number; title: string; isPdf: boolean }>();
  for (const l of lessons) {
    lessonAgg.set(l.id, {
      total: 0,
      count: 0,
      title: l.title,
      isPdf: l.content_type === "document" && isPdfPath(l.storage_path),
    });
  }
  for (const r of rows) {
    if (r.isAssignment) continue;
    const e = lessonAgg.get(r.targetId);
    if (!e) continue;
    e.total += r.totalSec;
    e.count += 1;
  }
  const lessonAggRows = Array.from(lessonAgg.entries())
    .map(([id, v]) => ({
      id, ...v,
      avgSec: v.count > 0 ? v.total / v.count : 0,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avgSec - a.avgSec);

  // Assignment-specific tracking: time before deadline + writing time
  type AssignmentTiming = {
    userId: string;
    name: string;
    assignmentId: string;
    title: string;
    deadline: string | null;
    submittedAt: string | null;
    openedBeforeDeadlineMs: number | null;
    writingSec: number | null;
  };
  const assignmentTimings: AssignmentTiming[] = [];
  for (const a of assignments) {
    const sessions = assignmentSessions.filter((s) => s.assignment_id === a.id);
    if (sessions.length === 0) continue;
    const byUser = new Map<string, { firstStart: string | null; totalSec: number }>();
    for (const s of sessions) {
      const cur = byUser.get(s.user_id) ?? { firstStart: null, totalSec: 0 };
      if (s.started_at && (!cur.firstStart || s.started_at < cur.firstStart)) cur.firstStart = s.started_at;
      cur.totalSec += Number(s.duration_seconds || 0);
      byUser.set(s.user_id, cur);
    }
    for (const [userId, v] of byUser.entries()) {
      const submission = submissions.find((s) => s.user_id === userId && s.assignment_id === a.id);
      const submittedAt = submission?.submitted_at ?? null;
      const openedBeforeDeadlineMs =
        v.firstStart && a.deadline
          ? new Date(a.deadline).getTime() - new Date(v.firstStart).getTime()
          : null;
      assignmentTimings.push({
        userId,
        name: userName.get(userId) ?? "Learner",
        assignmentId: a.id,
        title: a.title,
        deadline: a.deadline,
        submittedAt,
        openedBeforeDeadlineMs,
        writingSec: v.totalSec || null,
      });
    }
  }

  const totalActiveStudents = new Set(rows.map((r) => r.userId)).size;
  const totalSec = rows.reduce((sum, r) => sum + r.totalSec, 0);
  const lowEngagementCount = rows.filter((r) => r.isPdf && r.totalSec < 120).length;

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Active learners" value={totalActiveStudents} sub="Have opened material" />
        <Metric label="Total time logged" value={fmtDuration(totalSec)} sub="Across all sessions" />
        <Metric
          label="Low PDF engagement"
          value={lowEngagementCount}
          sub="Under 2 min on a PDF"
          tone={lowEngagementCount > 0 ? "amber" : "default"}
        />
        <Metric label="Materials tracked" value={lessonAggRows.length} sub="With at least one open" />
      </section>

      {/* Per-material averages */}
      {lessonAggRows.length > 0 && (
        <section>
          <h2 className="h-display text-2xl">Average time per material</h2>
          <div className="card mt-4 overflow-hidden">
            <ul className="divide-y divide-line">
              {lessonAggRows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex items-center gap-2">
                    {r.isPdf && <span className="chip-soft">PDF</span>}
                    <p className="truncate text-sm font-medium text-mocha-900">{r.title}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-muted">
                    <span>{r.count} learner{r.count === 1 ? "" : "s"}</span>
                    <span className="font-medium text-mocha-800 min-w-[60px] text-right">{fmtDuration(r.avgSec)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Per-student per-material rows */}
      <section>
        <h2 className="h-display text-2xl">Per-student detail</h2>
        {rows.length === 0 ? (
          <div className="card mt-4 p-12 text-center">
            <p className="font-display text-xl text-mocha-900">No sessions yet.</p>
            <p className="mt-2 text-muted">Time data appears here as learners open videos, PDFs, and assignments.</p>
          </div>
        ) : (
          <div className="card mt-4 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 border-b border-line bg-cream-50/60 px-5 py-3 text-xs uppercase tracking-wider text-muted">
              <div className="col-span-3">Student</div>
              <div className="col-span-5">Material</div>
              <div className="col-span-2">Time spent</div>
              <div className="col-span-2">Last opened</div>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((r) => {
                const flagged = r.isPdf && r.totalSec < 120;
                const initials = r.name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "L";
                return (
                  <li
                    key={`${r.userId}-${r.targetId}-${r.isAssignment ? "A" : "L"}`}
                    className={`grid md:grid-cols-12 gap-3 md:gap-4 px-5 py-4 transition ${
                      flagged ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-cream-50/60"
                    }`}
                  >
                    <div className="md:col-span-3 flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mocha-100 text-mocha-800 text-xs font-semibold">
                        {initials}
                      </span>
                      <p className="font-medium text-sm text-mocha-900 truncate">{r.name}</p>
                    </div>
                    <div className="md:col-span-5 min-w-0 flex items-center gap-2">
                      <span className="chip-soft shrink-0">
                        {r.isAssignment ? "Assignment" : r.isPdf ? "PDF" : "Lesson"}
                      </span>
                      <span className="truncate text-sm text-mocha-800">{r.target}</span>
                    </div>
                    <div className="md:col-span-2 text-sm">
                      <span className={`font-semibold ${flagged ? "text-amber-700" : "text-mocha-900"}`}>
                        {fmtDuration(r.totalSec)}
                      </span>
                      <span className="ml-1 text-xs text-muted">
                        ({r.sessionCount} session{r.sessionCount === 1 ? "" : "s"})
                      </span>
                      {flagged && (
                        <p className="text-[11px] text-amber-700">Under 2 min on a PDF</p>
                      )}
                    </div>
                    <div className="md:col-span-2 text-xs text-muted">{timeAgo(r.lastEnded)}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Assignment-specific timing */}
      {assignmentTimings.length > 0 && (
        <section>
          <h2 className="h-display text-2xl">Assignment timing</h2>
          <p className="mt-1 text-sm text-muted">
            How long before the deadline each learner started — and how much they spent writing.
          </p>
          <div className="card mt-4 overflow-hidden">
            <ul className="divide-y divide-line">
              {assignmentTimings.map((t) => {
                const before = t.openedBeforeDeadlineMs;
                const beforeLabel = before == null
                  ? "—"
                  : before > 0
                    ? `${fmtDuration(Math.floor(before / 1000))} before deadline`
                    : `${fmtDuration(Math.floor(-before / 1000))} after deadline`;
                return (
                  <li key={`${t.userId}-${t.assignmentId}`} className="grid md:grid-cols-12 gap-3 md:gap-4 px-5 py-4">
                    <div className="md:col-span-3 text-sm font-medium text-mocha-900 truncate">{t.name}</div>
                    <div className="md:col-span-4 text-sm text-mocha-800 truncate">{t.title}</div>
                    <div className="md:col-span-3 text-xs text-muted">
                      Opened {beforeLabel}
                    </div>
                    <div className="md:col-span-2 text-xs text-mocha-800">
                      Writing: <span className="font-medium">{t.writingSec ? fmtDuration(t.writingSec) : "—"}</span>
                      {t.submittedAt
                        ? <span className="ml-2 text-emerald-700">submitted</span>
                        : <span className="ml-2 text-amber-700">in progress</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
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
