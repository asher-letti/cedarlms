"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

/**
 * Captures a $pageview event on every route change. Mounted inside a
 * Suspense boundary in the root layout because useSearchParams suspends.
 */
export default function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    if (typeof window === "undefined") return;

    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;

    try {
      posthog.capture("$pageview", { $current_url: url });
    } catch {
      // analytics down — never break navigation
    }
  }, [pathname, searchParams]);

  return null;
}
