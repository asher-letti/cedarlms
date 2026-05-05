"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Mobile-only sticky bottom CTA. Fades in after the hero scrolls out of view
 * so it doesn't compete with the in-hero "Get started free" button.
 */
export default function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after the user has scrolled past ~50% of the viewport.
      setVisible(window.scrollY > window.innerHeight * 0.45);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="glass-strong px-4 py-3">
        <Link
          href="/signup"
          className="btn-primary w-full justify-center py-3.5 text-base"
        >
          Get started free
          <span aria-hidden className="text-cream-50/80 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
