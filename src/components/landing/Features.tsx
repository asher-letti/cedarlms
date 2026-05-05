type Feature = { glyph: string; title: string; body: string };

const FEATURES: Feature[] = [
  {
    glyph: "▤",
    title: "Publish a course in minutes",
    body: "Drag in your videos, PDFs and readings. Add a quiz. Hit publish. Your students enroll with a link — no IT ticket, no setup call.",
  },
  {
    glyph: "✎",
    title: "Quizzes that grade themselves",
    body: "Multiple choice with instant scoring and automatic completion tracking. Spend the saved hours teaching, not marking.",
  },
  {
    glyph: "⊞",
    title: "Assignments with proper feedback",
    body: "Students upload their work; you leave grades and comments. Everyone sees one clean record — no more chasing email threads.",
  },
  {
    glyph: "▦",
    title: "See who's actually keeping up",
    body: "Live progress bars for every learner. Quiz averages. Last-active timestamps. Catch the at-risk students before they drop off.",
  },
];

export default function Features() {
  return (
    <section className="band-cream">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <span className="chip">What's inside</span>
          <h2 className="h-display mt-3 text-2xl sm:text-3xl lg:text-4xl leading-tight">
            Everything you need to teach.{" "}
            <span className="italic text-mocha-700">Nothing you don't.</span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted leading-relaxed">
            Cedar replaces the WhatsApp groups, the half-finished Google Drives, and the spreadsheets you secretly hate.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 grid gap-4 sm:gap-5 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="card card-hover p-6 sm:p-7 group">
              <div className="flex items-start justify-between">
                <span aria-hidden className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl bg-mocha-50 text-mocha-700 font-display text-lg ring-1 ring-mocha-100 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                  {f.glyph}
                </span>
                <span className="font-display text-xs text-mocha-300">0{i + 1}</span>
              </div>
              <h3 className="mt-4 sm:mt-5 font-display text-lg sm:text-xl text-mocha-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
