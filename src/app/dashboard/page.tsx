import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/auth";
import CourseCover from "@/components/CourseCover";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login");

  // Instructors get the dedicated app shell
  if (profile?.role === "instructor" || profile?.role === "admin") {
    redirect("/instructor");
  }

  const supabase = await createClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, description, cover_url)")
    .eq("user_id", user.id);

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

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="h-display text-2xl">My courses</h2>
          <Link href="/courses" className="text-sm text-mocha-700 hover:underline underline-offset-4">Browse all →</Link>
        </div>

        {!enrollments?.length ? (
          <div className="card mt-4 p-12 text-center">
            <p className="font-display text-xl text-mocha-900">You're not enrolled in anything yet.</p>
            <p className="mt-2 text-muted">Find a course to get started.</p>
            <Link href="/courses" className="btn-primary mt-5 inline-flex">Find something to learn</Link>
          </div>
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
    </div>
  );
}
