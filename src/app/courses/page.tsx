import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CourseCover from "@/components/CourseCover";
import CatalogControls from "./CatalogControls";
import { CATEGORIES, isCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; cat?: string }>;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const cat = isCategory(params.cat) ? params.cat : null;

  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select(
      "id, title, description, cover_url, category, instructor_id, profiles:instructor_id(full_name)"
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (q) {
    const safe = q.replace(/[%,*]/g, "");
    if (safe.length > 0) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }
  if (cat) query = query.eq("category", cat);

  const { data: courses } = await query;
  const list = (courses ?? []) as any[];
  const filtered = !!q || !!cat;

  // Discover all category values currently in use (canonical + custom).
  // Merged with the canonical list so newly-installed categories show up
  // even before any course exists in them.
  const { data: catRows } = await supabase
    .from("courses")
    .select("category")
    .eq("published", true)
    .not("category", "is", null);
  const seen = new Set<string>();
  for (const c of CATEGORIES) seen.add(c);
  for (const row of (catRows ?? []) as { category: string | null }[]) {
    if (row.category) seen.add(row.category);
  }
  const allCategories = Array.from(seen).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <span className="chip">Catalog</span>
        <h1 className="h-display mt-3 text-3xl sm:text-4xl">Browse courses</h1>
        <p className="mt-2 text-muted">
          A small bookshelf, hand-picked. Find a course you'll actually finish.
        </p>
      </header>

      <CatalogControls categories={allCategories} initialQ={q} initialCat={cat} />

      {list.length === 0 ? (
        <EmptyState filtered={filtered} q={q} cat={cat} />
      ) : (
        <div className="grid gap-6 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: any }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <CourseCover id={course.id} title={course.title} url={course.cover_url} />
        {course.category && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mocha-700 backdrop-blur-sm shadow-[0_1px_2px_rgba(42,27,15,0.10)]">
            {course.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug text-mocha-900 line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted leading-relaxed">
            {course.description}
          </p>
        )}
        <p className="mt-auto pt-4 text-[13px] text-muted">
          By <span className="text-mocha-700">{course.profiles?.full_name ?? "Instructor"}</span>
        </p>
      </div>
    </Link>
  );
}

function EmptyState({
  filtered, q, cat,
}: { filtered: boolean; q: string; cat: string | null }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <BookshelfIllustration />
      <p className="mt-6 font-display text-2xl text-mocha-900">
        {filtered ? "No matches found." : "Nothing here yet."}
      </p>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        {filtered ? (
          <>
            We couldn't find any courses
            {q && <> matching <span className="text-mocha-700">&ldquo;{q}&rdquo;</span></>}
            {cat && <> in <span className="text-mocha-700">{cat}</span></>}.
            <br />
            Try a different search or category.
          </>
        ) : (
          <>Check back soon — we're adding new courses regularly.</>
        )}
      </p>
      {filtered && (
        <Link
          href="/courses"
          className="btn-secondary mt-6 inline-flex"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

function BookshelfIllustration() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
      aria-hidden
    >
      {/* Bottom shelf */}
      <rect x="10" y="80" width="100" height="6" rx="2" fill="#BE9A6B" />
      {/* Middle book stack */}
      <rect x="22" y="56" width="14" height="24" rx="2" fill="#6B4A29" />
      <rect x="38" y="48" width="12" height="32" rx="2" fill="#B45838" />
      <rect x="52" y="60" width="10" height="20" rx="2" fill="#6B7C5C" />
      <rect x="64" y="44" width="14" height="36" rx="2" fill="#C28E2A" />
      <rect x="80" y="54" width="12" height="26" rx="2" fill="#5D4E37" />
      {/* Tilted book on top */}
      <g transform="rotate(-8 50 38)">
        <rect x="38" y="30" width="24" height="8" rx="2" fill="#A07A4C" />
      </g>
      {/* Soft floor shadow */}
      <ellipse cx="60" cy="92" rx="44" ry="3" fill="#EADBC4" opacity="0.6" />
    </svg>
  );
}
