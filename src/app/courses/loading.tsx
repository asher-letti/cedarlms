export default function CoursesLoading() {
  return (
    <div>
      <header className="mb-10">
        <span className="chip">Catalog</span>
        <h1 className="h-display mt-3 text-4xl">Browse courses</h1>
        <p className="mt-2 text-muted">Hand-picked lessons from instructors around the world.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="card overflow-hidden">
            <div className="skeleton aspect-[16/10] w-full !rounded-none" />
            <div className="p-5 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-2/3" />
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-3 w-10" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
