import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CourseCover from "@/components/CourseCover";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, cover_url, instructor_id, profiles:instructor_id(full_name)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <header className="mb-10">
        <span className="chip">Catalog</span>
        <h1 className="h-display mt-3 text-4xl">Browse courses</h1>
        <p className="mt-2 text-muted">Hand-picked lessons from instructors around the world.</p>
      </header>

      {!courses?.length && (
        <div className="card p-12 text-center">
          <p className="font-display text-xl text-mocha-900">Nothing here yet.</p>
          <p className="mt-2 text-muted">No published courses — check back soon.</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((c: any) => (
          <Link key={c.id} href={`/courses/${c.id}`}
            className="card card-hover group overflow-hidden flex flex-col">
            <div className="aspect-[16/10] w-full overflow-hidden">
              <CourseCover id={c.id} title={c.title} url={c.cover_url} />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-display text-lg text-mocha-900 leading-snug">{c.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted">{c.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <p className="text-xs uppercase tracking-wider text-mocha-600">
                  By {c.profiles?.full_name ?? "Instructor"}
                </p>
                <span className="text-xs text-mocha-700 font-medium opacity-0 group-hover:opacity-100 transition">View →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
