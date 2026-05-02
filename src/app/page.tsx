import Link from "next/link";
import CourseCover from "@/components/CourseCover";

const SHOWCASE = [
  { id: "demo-watercolor", title: "Watercolor Foundations" },
  { id: "demo-product-design", title: "Product Design 101" },
  { id: "demo-mindful-writing", title: "Mindful Writing" },
  { id: "demo-web-dev", title: "Modern Web Development" },
];

export default function Home() {
  return (
    <div className="-mx-6 -my-12 min-h-[calc(100vh-128px)] grid lg:grid-cols-2">
      {/* LEFT — copy & CTAs */}
      <section className="flex flex-col justify-between px-8 sm:px-14 py-16">
        <div className="max-w-md">
          <span className="chip">A new kind of classroom</span>
          <h1 className="h-display mt-6 text-5xl sm:text-6xl leading-[1.02]">
            Learn beautifully.
            <br />
            <span className="italic text-mocha-700">At your own pace.</span>
          </h1>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            Cedar is a warm, distraction-free home for online learning —
            videos, documents, readings and assignments, all in one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary px-7 py-3 text-base">Get started</Link>
            <Link href="/courses" className="btn-secondary px-7 py-3 text-base">Browse courses</Link>
          </div>

          <ul className="mt-10 space-y-3">
            {[
              ["Multi-format", "Videos, PDFs, readings, quizzes & assignments."],
              ["For everyone", "Instructors publish. Learners enroll, submit & track progress."],
              ["Any device", "Responsive on laptop, tablet, or phone — online or off."],
            ].map(([k, v]) => (
              <li key={k} className="flex items-start gap-3 text-sm">
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-mocha-100 text-[10px] text-mocha-700">✓</span>
                <span>
                  <strong className="text-mocha-900">{k}.</strong>{" "}
                  <span className="text-muted">{v}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-mocha-700 underline underline-offset-4">Log in</Link>
        </p>
      </section>

      {/* RIGHT — brand showcase */}
      <section className="relative hidden lg:block overflow-hidden bg-gradient-to-br from-cream-100 via-mocha-50 to-cream-200">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(at 25% 15%, rgba(190,154,107,0.30) 0, transparent 45%), radial-gradient(at 80% 85%, rgba(83,56,32,0.18) 0, transparent 50%)",
          }}
        />
        <div className="relative h-full p-14 flex flex-col justify-between">
          {/* floating course-card mosaic */}
          <div className="relative flex-1">
            <div className="absolute left-2 top-4 w-56 rotate-[-4deg] card overflow-hidden shadow-[0_30px_60px_-20px_rgba(42,27,15,0.30)]">
              <div className="aspect-[16/10]"><CourseCover id={SHOWCASE[0].id} title={SHOWCASE[0].title} /></div>
              <div className="p-3"><p className="font-display text-sm text-mocha-900">{SHOWCASE[0].title}</p></div>
            </div>
            <div className="absolute right-0 top-20 w-60 rotate-[3deg] card overflow-hidden shadow-[0_30px_60px_-20px_rgba(42,27,15,0.30)]">
              <div className="aspect-[16/10]"><CourseCover id={SHOWCASE[1].id} title={SHOWCASE[1].title} /></div>
              <div className="p-3"><p className="font-display text-sm text-mocha-900">{SHOWCASE[1].title}</p></div>
            </div>
            <div className="absolute left-12 bottom-12 w-60 rotate-[2deg] card overflow-hidden shadow-[0_30px_60px_-20px_rgba(42,27,15,0.30)]">
              <div className="aspect-[16/10]"><CourseCover id={SHOWCASE[2].id} title={SHOWCASE[2].title} /></div>
              <div className="p-3"><p className="font-display text-sm text-mocha-900">{SHOWCASE[2].title}</p></div>
            </div>
            <div className="absolute right-8 bottom-0 w-52 rotate-[-3deg] card overflow-hidden shadow-[0_30px_60px_-20px_rgba(42,27,15,0.30)]">
              <div className="aspect-[16/10]"><CourseCover id={SHOWCASE[3].id} title={SHOWCASE[3].title} /></div>
              <div className="p-3"><p className="font-display text-sm text-mocha-900">{SHOWCASE[3].title}</p></div>
            </div>
          </div>

          <p className="relative font-display italic text-mocha-700 text-sm">
            Hand-picked courses · curated for focus.
          </p>
        </div>
      </section>
    </div>
  );
}
