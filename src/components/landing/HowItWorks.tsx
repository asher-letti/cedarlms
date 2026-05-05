const STEPS = [
  {
    n: "01",
    title: "Sign up free",
    body: "Pick instructor or learner. Confirm your email. You're in — no payment details, no demo call.",
  },
  {
    n: "02",
    title: "Build your course",
    body: "Upload videos, attach PDFs, draft quizzes, set assignment deadlines. Cover image optional — we'll generate a beautiful one.",
  },
  {
    n: "03",
    title: "Share the link",
    body: "Students enroll, learn at their pace, and submit work. You grade. Progress climbs. Done.",
  },
];

export default function HowItWorks() {
  return (
    <section className="band-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <span className="chip">How it works</span>
          <h2 className="h-display mt-3 text-2xl sm:text-3xl lg:text-4xl leading-tight">
            Tonight, not next quarter.
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted leading-relaxed">
            Most instructors have a course online inside an hour. No onboarding sessions required.
          </p>
        </div>

        <ol className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n} className="card p-6 sm:p-7 relative overflow-hidden">
              <span className="font-display text-4xl sm:text-5xl text-mocha-200">{s.n}</span>
              <h3 className="mt-3 font-display text-lg sm:text-xl text-mocha-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              {i < STEPS.length - 1 && (
                <span className="hidden md:block absolute right-4 top-9 text-mocha-200" aria-hidden>→</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
