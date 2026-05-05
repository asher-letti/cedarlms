/**
 * Inline dashboard mock — purely visual, mirrors the real instructor dashboard.
 * No live data; entirely styled with our mocha palette.
 */
export default function DashboardPreview({ tilt = false }: { tilt?: boolean }) {
  return (
    <div
      className={`relative w-full max-w-[640px] ${tilt ? "lg:rotate-[1.5deg]" : ""}`}
      aria-hidden
    >
      {/* Browser chrome */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-cream-100/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[10px] font-mono text-muted">
            cedarlms.app/instructor
          </span>
        </div>

        <div className="p-5 sm:p-6 bg-cream-50">
          {/* Eyebrow + heading */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mocha-600">
            Dashboard
          </p>
          <h3 className="mt-1.5 font-display text-2xl text-mocha-900">Welcome, Amara</h3>

          {/* Metric tiles */}
          <div className="mt-5 grid grid-cols-4 gap-2.5">
            {[
              { label: "Courses", value: "6" },
              { label: "Students", value: "142" },
              { label: "To grade", value: "8", tone: "amber" as const },
              { label: "Activity", value: "23" },
            ].map((m) => (
              <div
                key={m.label}
                className={`rounded-lg border border-line bg-white p-2.5 ${
                  m.tone === "amber" ? "ring-1 ring-amber-100" : ""
                }`}
              >
                <p className="text-[9px] uppercase tracking-wider text-muted">{m.label}</p>
                <p className={`mt-0.5 font-display text-xl ${m.tone === "amber" ? "text-amber-700" : "text-mocha-900"}`}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Two-column area */}
          <div className="mt-5 grid grid-cols-5 gap-3">
            {/* Course card */}
            <div className="col-span-3 rounded-xl border border-line bg-white overflow-hidden">
              <div
                className="aspect-[16/8] w-full"
                style={{
                  background:
                    "linear-gradient(135deg, #6B4A29 0%, #C9A47A 100%)",
                }}
              />
              <div className="p-3">
                <p className="font-display text-sm text-mocha-900">Business Communication</p>
                <p className="mt-0.5 text-[10px] text-muted">8 lessons · 14 enrolled</p>
                <div className="mt-2 h-1.5 rounded-full bg-cream-200">
                  <div className="h-full w-[72%] rounded-full bg-mocha-700" />
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div className="col-span-2 rounded-xl border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-mocha-700">Activity</p>
                <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              <ul className="divide-y divide-line text-[10px]">
                {[
                  { i: "AK", n: "Amara K.", t: "submitted Quiz 3", a: "now", grade: false },
                  { i: "JO", n: "James O.", t: "submitted Memo", a: "5m", grade: false },
                  { i: "FW", n: "Faith W.", t: "passed Quiz 2", a: "1h", grade: true, score: 88 },
                ].map((r, i) => (
                  <li key={i} className="flex items-start gap-2 p-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mocha-100 text-mocha-800 text-[9px] font-semibold">
                      {r.i}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-mocha-900"><strong>{r.n}</strong> <span className="text-muted">{r.t}</span></p>
                      <p className="mt-0.5 text-muted">{r.a} ago</p>
                    </div>
                    {r.grade ? (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                        {r.score}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                        Grade
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Floating accent card */}
      <div className="absolute -bottom-8 -left-6 hidden md:block animate-float-slow">
        <div className="card px-4 py-3 shadow-[0_30px_60px_-20px_rgba(42,27,15,0.30)]">
          <p className="text-[10px] uppercase tracking-wider text-mocha-600">Average progress</p>
          <p className="mt-1 font-display text-2xl text-mocha-900">68%</p>
          <div className="mt-2 h-1.5 w-32 rounded-full bg-cream-200">
            <div className="h-full w-[68%] rounded-full bg-mocha-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
