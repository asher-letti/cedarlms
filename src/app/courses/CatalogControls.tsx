"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  categories: readonly string[];
  initialQ: string;
  initialCat: string | null;
};

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-5-5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function CatalogControls({ categories, initialQ, initialCat }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [, startTransition] = useTransition();
  const firstRender = useRef(true);

  // Debounced URL sync for the search query
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = q.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    }, 280);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setCategory = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("cat", cat);
    else params.delete("cat");
    const qs = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  };

  const allActive = !initialCat;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xl">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mocha-500">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses by title or topic…"
          className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-10 text-sm text-ink placeholder:text-muted/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:border-mocha-200 focus:outline-none focus:border-mocha-400 focus:ring-4 focus:ring-mocha-200/40"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full text-mocha-500 transition-colors hover:bg-cream-100 hover:text-mocha-800"
            aria-label="Clear search"
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {/* Filter pills — horizontal scroll on mobile */}
      <div className="-mx-5 sm:mx-0 overflow-x-auto">
        <div className="flex w-max items-center gap-2 px-5 sm:px-0 sm:w-full sm:flex-wrap">
          <PillButton active={allActive} onClick={() => setCategory(null)}>
            All
          </PillButton>
          {categories.map((c) => (
            <PillButton
              key={c}
              active={initialCat === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  );
}

function PillButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer ${
        active
          ? "bg-mocha-700 text-cream-50 shadow-[0_1px_2px_rgba(42,27,15,0.20),inset_0_1px_0_rgba(255,255,255,0.10)]"
          : "bg-white text-mocha-800 ring-1 ring-line hover:ring-mocha-300 hover:bg-cream-50"
      }`}
    >
      {children}
    </button>
  );
}
