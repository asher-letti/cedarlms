import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/auth";
import CourseCover from "@/components/CourseCover";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
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

export default async function InstructorDashboard() {
  const { user, profile } = await getSession();
  const supabase = await createClient();

  const [coursesRes, recentSubsRes, ungradedCountRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, published, cover_url, description")
      .eq("instructor_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("submissions")
      .select("id, submitted_at, grade, graded_at, assignment_id, profiles:user_id(full_name), assignments(id, title, course_id, courses(id, title))")
      .order("submitted_at", { ascending: false })
      .limit(10),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .is("graded_at", null),
  ]);

  const teaching = coursesRes.data ?? [];
  const recentSubs = (recentSubsRes.data ?? []) as any[];
  const ungradedCount = ungradedCountRes.count ?? 0;

  const courseIds = teaching.map((c: any) => c.id);
  let studentCount = 0;
  let totalSubmissions = 0;
  if (courseIds.length) {
    const [enrCount, subsCount] = await Promise.all([
      supabase.from("enrollments").select("user_id", { count: "exact", head: true }).in("course_id", courseIds),
      supabase.from("submissions").select("id", { count: "exact", head: true }),
    ]);
    studentCount = enrCount.count ?? 0;
    totalSubmissions = subsCount.count ?? 0;
  }

  const publishedCount = teaching.filter((c: any) => c.published).length;

  return (
    <div className="space-y-10">
      <header>
        <span className="chip">Dashboard</span>
        <h1 className="h-display mt-3 text-4xl">Welcome, {profile?.full_name ?? "instructor"}</h1>
        <p className="mt-2 text-muted">Here's what's happening across your courses.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Active courses" value={publishedCount} sub={`${teaching.length} total`} />
        <Metric label="Students" value={studentCount} sub="Across your courses" />
        <Metric label="To grade" value={ungradedCount} sub="Pending feedback" tone={ungradedCount > 0 ? "amber" : "default"} />
        <Metric label="Submissions" value={totalSubmissions} sub="All-time" />
      </section>

      <div className="grid gap-8 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="h-display text-2xl">Recent courses</h2>
            <Link href="/instructor/courses" className="text-sm text-mocha-700 hover:underline underline-offset-4">View all →</Link>
          </div>
          {!teaching.length ? (
            <div className="card mt-4 p-12 text-center">
              <p className="font-display text-xl text-mocha-900">No courses yet.</p>
              <p className="mt-2 text-muted">Create your first course to start teaching.</p>
              <Link href="/instructor/courses/new" className="btn-primary mt-5 inline-flex">Create a course</Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {teaching.slice(0, 4).map((c: any) => (
                <Link key={c.id} href={`/instructor/courses/${c.id}`}
                  className="card card-hover group overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <CourseCover id={c.id} title={c.title} url={c.cover_url} />
                    <span className={`absolute left-3 top-3 chip ${c.published ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : ""}`}>
                      {c.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-mocha-900">{c.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">{c.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="h-display text-xl">Recent activity</h2>
              <span className="chip">{recentSubs.length}</span>
            </div>
            {recentSubs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">
                No submissions yet. They'll appear here as students send work in.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {recentSubs.map((s) => {
                  const studentName = s.profiles?.full_name ?? "A learner";
                  const courseTitle = s.assignments?.courses?.title ?? "course";
                  const assignmentTitle = s.assignments?.title ?? "an assignment";
                  const courseId = s.assignments?.courses?.id;
                  const isGraded = !!s.graded_at;
                  return (
                    <li key={s.id} className="p-4 hover:bg-cream-50/60 transition">
                      <Link href={courseId ? `/instructor/courses/${courseId}` : "#"} className="block">
                        <div className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mocha-100 text-mocha-800 text-xs font-semibold">
                            {studentName.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "L"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-mocha-900">
                              <strong className="font-semibold">{studentName}</strong>{" "}
                              <span className="text-muted">submitted</span>{" "}
                              <span className="font-medium">{assignmentTitle}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted truncate">
                              in <span className="text-mocha-700">{courseTitle}</span> · {timeAgo(s.submitted_at)}
                            </p>
                          </div>
                          <span className={`chip shrink-0 ${isGraded ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-800 ring-amber-100"}`}>
                            {isGraded ? `${s.grade ?? ""}` : "Grade"}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
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
