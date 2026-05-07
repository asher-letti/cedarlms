"use client";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHContext } from "posthog-js/react";

/**
 * Initializes PostHog on the client and exposes the React context so any
 * component can call `usePostHog()`. Page views are captured manually by
 * <PostHogPageView /> (we set capture_pageview=false here).
 */
export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return; // no key configured → analytics quietly disabled
    if ((posthog as { __loaded?: boolean }).__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,        // we capture manually on route changes
      capture_pageleave: true,
      person_profiles: "identified_only",
      loaded: (ph) => {
        (ph as { __loaded?: boolean }).__loaded = true;
      },
    });
  }, []);

  return <PHContext client={posthog}>{children}</PHContext>;
}
