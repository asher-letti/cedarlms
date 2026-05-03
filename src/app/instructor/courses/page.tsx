import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/auth";
import CourseCover from "@/components/CourseCover";

export const dynamic = "force-dynamic";

export default async function InstructorCoursesIndex() {
  const { user } = await getSession();
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, cover_url, published, created_at")
    .eq("instructor_id", user!.id)
    .order("created_at", { ascending: false });

  const list = courses ?? [];
  const published = list.filter((c: any) => c.published);
  const drafts = list.filter((c: any) => !c.published);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">Courses</span>
          <h1 className="h-display mt-3 text-4xl">My courses</h1>
          <p className="mt-2 text-muted">{list.length} total · {published.length} published · {drafts.length} draft</p>
        </div>
        <Link href="/instructor/courses/new" className="btn-primary">+ New course</Link>
      </header>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-xl text-mocha-900">You haven't created any courses yet.</p>
          <p className="mt-2 text-muted">Start by giving your first course a title and a cover.</p>
          <Link href="/instructor/courses/new" className="btn-primary mt-5 inline-flex">Create a course</Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c: any) => (
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
                <p className="mt-3 text-xs font-medium text-mocha-700">Manage course →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
