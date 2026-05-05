const POINTS: { title: string; body: string }[] = [
  {
    title: "100% free for instructors",
    body: "No per-seat fees. No 14-day trials. Just teach.",
  },
  {
    title: "Mobile-first by design",
    body: "Your learners are on phones. Every screen feels native, not shrunk.",
  },
  {
    title: "Works on patchy connections",
    body: "Lessons load fast, files download for offline study, no buffering loops.",
  },
];

export default function StatsBanner() {
  return (
    <section className="band-white border-y border-line">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-12 sm:py-14 lg:py-16">
        <ul className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.title} className="flex items-start gap-3 md:block">
              <span aria-hidden className="md:hidden mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mocha-100 text-mocha-700 text-[11px]">✓</span>
              <div>
                <p className="font-display text-xl sm:text-2xl text-mocha-900">{p.title}</p>
                <p className="mt-1.5 sm:mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
