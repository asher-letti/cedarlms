import Link from "next/link";

const INSTRUCTOR_INCLUDES = [
  "Publish unlimited courses",
  "Unlimited learners per course",
  "Videos, PDFs, quizzes & assignments",
  "Real-time progress tracking, grading & dashboards",
];

const LEARNER_INCLUDES = [
  "Enroll in any published course",
  "Stream videos, download PDFs, take quizzes",
  "Submit assignments and receive feedback",
  "Track your progress across every course",
];

type Tone = "emerald" | "neutral";
type Badge = { label: string; tone: Tone };

const TONE: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
  neutral: "bg-cream-100 text-mocha-700 ring-1 ring-inset ring-mocha-100",
};

function Card({
  role,
  badge,
  includes,
  cta,
}: {
  role: string;
  badge: Badge;
  includes: string[];
  cta: { label: string; href: string };
}) {
  return (
    <div className="card rounded-2xl p-8 transition-shadow duration-300 hover:shadow-[0_4px_8px_rgba(42,27,15,0.05),0_24px_48px_-22px_rgba(42,27,15,0.20)]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl text-mocha-900">{role}</p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${TONE[badge.tone]}`}
        >
          {badge.label}
        </span>
      </div>

      <ul className="mt-6 space-y-3">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-mocha-800">
            <span
              aria-hidden
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mocha-50 text-mocha-700 text-[10px] ring-1 ring-mocha-100"
            >
              ✓
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 pt-6 border-t border-line">
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-mocha-700 transition-colors hover:text-mocha-900"
        >
          {cta.label}
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="band-cream">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <span className="chip">Pricing</span>
          <h2 className="h-display mt-3 text-2xl sm:text-3xl lg:text-4xl leading-tight">
            Simple, honest pricing.
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted leading-relaxed">
            No per-seat fees. No hidden charges. Just teaching.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 grid gap-5 md:grid-cols-2 max-w-4xl">
          <Card
            role="Instructors"
            badge={{ label: "Free forever", tone: "emerald" }}
            includes={INSTRUCTOR_INCLUDES}
            cta={{ label: "Start teaching", href: "/signup" }}
          />
          <Card
            role="Students"
            badge={{ label: "Free", tone: "neutral" }}
            includes={LEARNER_INCLUDES}
            cta={{ label: "Browse courses", href: "/courses" }}
          />
        </div>
      </div>
    </section>
  );
}
