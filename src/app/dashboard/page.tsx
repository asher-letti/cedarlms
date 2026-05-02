import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/auth";
import CourseCover from "@/components/CourseCover";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const isTeacher = profile?.role === "instructor" || profile?.role === "admin";

  // Run all data queries in parallel
  const [enrollmentsRes, teachingRes] = await Promise.all([
    supabase
      .from("enrollments")
      .select("course_id, courses(id, title, description, cover_url)")
      .eq("user_id", user.id),
    isTeacher
      ? supabase
          .from("courses")
          .select("id, title, published, cover_url, description")
          .eq("instructor_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null as any }),
  ]);

  const enrollments = enrollmentsRes.data;
  const teaching = teachingRes.data;

  return (
    <div className="space-y-14">
      <header className="card overflow-hidden">
        <div className="relative p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mocha-100/60 blur-2xl" />
          <span className="chip">Dashboard</span>
          <h1 className="h-display mt-3 text-4xl">Welcome, {profile?.full_name ?? "learner"}</h1>
          <p className="mt-2 text-muted capitalize">Signed in as {profile?.role}</p>
        </div>
      </header>

      {!isTeacher && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="h-display text-2xl">My courses</h2>
            <Link href="/courses" className="text-sm text-mocha-700 hover:underline underline-offset-4">Browse all →</Link>
          </div>

          {!enrollments?.length ? (
            <EmptyState
              title="You're not enrolled in anything yet."
              hint="Find a course to get started."
              cta={{ href: "/courses", label: "Find something to learn" }}
            />
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((e: any) => (
                <Link key={e.course_id} href={`/courses/${e.courses.id}`}
                  className="card card-hover group overflow-hidden">
                  <div className="aspect-[16/10] overflow-hidden">
                    <CourseCover id={e.courses.id} title={e.courses.title} url={e.courses.cover_url} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-mocha-900">{e.courses.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">{e.courses.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {isTeacher && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="h-display text-2xl">Courses I teach</h2>
            <Link href="/instructor/courses/new" className="btn-primary text-xs px-4 py-2">+ New course</Link>
          </div>
          {!teaching?.length ? (
            <EmptyState
              title="No courses yet."
              hint="Create your first course to start teaching."
              cta={{ href: "/instructor/courses/new", label: "Create a course" }}
            />
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teaching.map((c: any) => (
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
                    <p className="mt-3 text-xs font-medium text-mocha-700">Manage lessons & students →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EmptyState({ title, hint, cta }: { title: string; hint: string; cta: { href: string; label: string } }) {
  return (
    <div className="card mt-4 p-12 text-center">
      <p className="font-display text-xl text-mocha-900">{title}</p>
      <p className="mt-2 text-muted">{hint}</p>
      <Link href={cta.href} className="btn-primary mt-5 inline-flex">{cta.label}</Link>
    </div>
  );
}
