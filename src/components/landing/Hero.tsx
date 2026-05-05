import Link from "next/link";
import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  return (
    <section className="band-cream relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 mx-auto h-[420px] max-w-3xl rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(190,154,107,0.45) 0%, rgba(234,219,196,0) 70%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Copy */}
          <div className="max-w-xl">
            <span className="chip animate-fade-up">Built for educators across Africa</span>
            <h1 className="h-display animate-fade-up delay-1 mt-4 text-[2.25rem] sm:text-5xl lg:text-6xl leading-[1.05] sm:leading-[1.02]">
              Run your classroom online —{" "}
              <span className="italic text-mocha-700">without the chaos.</span>
            </h1>
            <p className="animate-fade-up delay-2 mt-5 sm:mt-6 text-base sm:text-lg text-muted leading-relaxed">
              Cedar is the calmest way for schools, training centers and independent instructors
              to deliver courses, track progress and grade work — from any device, online or off.
            </p>

            <div className="animate-fade-up delay-3 mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="btn-primary w-full sm:w-auto justify-center px-7 py-3.5 text-base"
              >
                Get started free
                <span aria-hidden className="text-cream-50/80">→</span>
              </Link>
              <Link
                href="#preview"
                className="btn-secondary w-full sm:w-auto justify-center px-7 py-3.5 text-base"
              >
                <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-mocha-700 text-cream-50 text-[10px]">▶</span>
                Watch the demo
              </Link>
            </div>

            <p className="animate-fade-up delay-4 mt-5 text-xs text-muted">
              Free for instructors · No credit card · Set up in 5 minutes
            </p>
          </div>

          {/* Preview — pushed below copy on mobile, right-aligned on desktop */}
          <div
            id="preview"
            className="lg:justify-self-end animate-fade-up delay-2 scroll-mt-24 -mx-2 sm:mx-0"
          >
            <DashboardPreview tilt />
          </div>
        </div>
      </div>
    </section>
  );
}
