"use client";
import posthog from "posthog-js";

type Props = Record<string, unknown>;

/**
 * Thin wrappers around the PostHog client. All calls are no-ops when:
 *   - we're rendering on the server (no window)
 *   - PostHog wasn't initialized (no NEXT_PUBLIC_POSTHOG_KEY in env)
 *   - the call throws for any reason
 *
 * This means tracking can never break user-facing flows.
 */

function safe<T>(fn: () => T): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return fn();
  } catch {
    return undefined;
  }
}

export function track(event: string, props?: Props) {
  safe(() => posthog.capture(event, props));
}

export function identifyUser(id: string, props?: Props) {
  safe(() => posthog.identify(id, props));
}

export function resetAnalytics() {
  safe(() => posthog.reset());
}
