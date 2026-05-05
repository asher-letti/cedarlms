export default function CourseDetailLoading() {
  return (
    <article className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="card overflow-hidden mb-8">
          <div className="skeleton aspect-[16/7] w-full !rounded-none" />
        </div>

        <div className="skeleton h-5 w-20" />
        <div className="skeleton mt-3 h-10 w-2/3" />
        <div className="skeleton mt-2 h-3 w-40" />

        <div className="mt-6 space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-11/12" />
          <div className="skeleton h-3 w-3/4" />
        </div>

        <div className="divider my-12" />

        <div className="flex items-baseline justify-between">
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-3 w-24" />
        </div>

        <ul className="card mt-4 divide-y divide-line overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="skeleton-circle h-9 w-9" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
              <div className="skeleton h-6 w-14 rounded-full" />
            </li>
          ))}
        </ul>
      </div>

      <aside>
        <div className="card p-6 space-y-4 sticky top-24">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-11 w-full" />
          <div className="space-y-2 pt-4">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        </div>
      </aside>
    </article>
  );
}
