"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; glyph: string };
type Section = { section: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    section: "Workspace",
    items: [
      { href: "/instructor", label: "Dashboard", glyph: "▦" },
      { href: "/instructor/courses", label: "Courses", glyph: "▤" },
    ],
  },
  {
    section: "People",
    items: [
      { href: "/instructor/students", label: "Students", glyph: "♟" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/instructor") return pathname === "/instructor";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function InstructorSidebar({ instructorName }: { instructorName?: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-line bg-cream-50/60 backdrop-blur-sm">
      <div className="px-5 py-5 border-b border-line">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Teaching</p>
        <p className="mt-0.5 font-display text-base text-mocha-900 truncate">
          {instructorName ?? "Instructor"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {SECTIONS.map((s) => (
          <div key={s.section} className="mb-4">
            <p className="px-5 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">{s.section}</p>
            <ul>
              {s.items.map((it) => {
                const active = isActive(pathname, it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={`flex items-center gap-3 px-5 py-2 text-sm transition border-l-2 ${
                        active
                          ? "border-mocha-700 bg-cream-100 text-mocha-900 font-medium"
                          : "border-transparent text-mocha-700 hover:bg-cream-100/70 hover:text-mocha-900"
                      }`}
                    >
                      <span aria-hidden className="text-mocha-500 w-4 text-center">{it.glyph}</span>
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <Link
          href="/instructor/courses/new"
          className="btn-primary w-full text-xs"
        >
          + New course
        </Link>
      </div>
    </aside>
  );
}

/**
 * Mobile-only horizontal scroll tab strip (sidebar collapses on small screens).
 */
export function InstructorMobileNav() {
  const pathname = usePathname();
  const items = SECTIONS.flatMap((s) => s.items);
  return (
    <nav className="lg:hidden flex gap-1 overflow-x-auto border-b border-line bg-cream-50/80 px-4 py-2 -mx-6">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
              active ? "bg-mocha-700 text-cream-50" : "text-mocha-700 hover:bg-cream-100"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
