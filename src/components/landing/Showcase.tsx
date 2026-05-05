import DashboardPreview from "./DashboardPreview";

const BENEFITS: { title: string; body: string }[] = [
  {
    title: "A live activity feed of every submission",
    body: "Work appears the moment a student hits send. No refreshing, no chasing.",
  },
  {
    title: "Per-student progress, across every course",
    body: "One glance tells you who's flying, who's stuck, and who hasn't logged in this week.",
  },
  {
    title: "Pending grading flagged, never forgotten",
    body: "Amber chips on anything ungraded. Drop one, and it'll quietly nag you.",
  },
  {
    title: "Auto-complete done right",
    body: "Videos finish? Lesson ticks. Quiz passed? Lesson ticks. Manual override always available.",
  },
];

export default function Showcase() {
  return (
    <section className="band-mocha relative overflow-hidden border-y border-line">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Copy is FIRST in DOM (mobile reads top-down: heading → mockup) */}
          <div className="lg:order-2 max-w-xl">
            <span className="chip">For instructors</span>
            <h2 className="h-display mt-3 text-2xl sm:text-3xl lg:text-4xl leading-tight">
              One dashboard. Every learner.{" "}
              <span className="italic text-mocha-700">No more guesswork.</span>
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted leading-relaxed">
              Stop reconstructing "who watched what" from screenshots. Cedar shows you exactly
              where each student is — and where they're stuck — in real time.
            </p>

            <ul className="mt-7 sm:mt-8 space-y-4 sm:space-y-5">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-start gap-3">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mocha-700 text-cream-50 text-[11px]">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-mocha-900">{b.title}</p>
                    <p className="mt-0.5 text-sm text-muted leading-relaxed">{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup is SECOND in DOM, but pushed left on lg+ via order-1 */}
          <div className="lg:order-1 justify-self-center lg:justify-self-start -mx-2 sm:mx-0">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
