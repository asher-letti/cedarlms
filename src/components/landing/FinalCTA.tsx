import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="band-cream">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="card overflow-hidden relative">
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(190,154,107,0.45) 0%, rgba(234,219,196,0) 70%)",
            }}
            aria-hidden
          />
          <div className="relative grid items-center gap-7 p-7 sm:p-10 lg:p-14 md:grid-cols-2">
            <div>
              <h2 className="h-display text-2xl sm:text-3xl lg:text-4xl leading-tight">
                Your next cohort is one click from a real classroom.
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted leading-relaxed">
                Free for instructors. No credit card. Get your first course online tonight —
                and never run a class through a chat group again.
              </p>
            </div>

            <div className="md:justify-self-end w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="btn-primary w-full sm:w-auto justify-center px-7 py-3.5 text-base"
                >
                  Create your account
                  <span aria-hidden className="text-cream-50/80">→</span>
                </Link>
                <Link
                  href="/courses"
                  className="btn-secondary w-full sm:w-auto justify-center px-7 py-3.5 text-base"
                >
                  See the catalog
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted text-center sm:text-right">
                Or <Link href="/login" className="underline underline-offset-4 hover:text-mocha-700">log in</Link> if you already have an account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
