"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Args = {
  lessonId?: string;
  assignmentId?: string;
  enabled?: boolean;
};

/**
 * Tracks how long a learner is actively viewing a piece of material.
 *
 * - Inserts a row in material_sessions on mount, updates duration on a 15s
 *   heartbeat, on visibility change, and on cleanup (close/navigate away).
 * - Time only accrues while document.visibilityState === 'visible' so that
 *   tab-switching pauses the timer.
 * - One row per mount; if the learner re-opens the same material later,
 *   that's a new row (sessions are summed by the instructor view).
 */
export function useMaterialSession({ lessonId, assignmentId, enabled = true }: Args) {
  const sessionIdRef = useRef<string | null>(null);
  const accumRef = useRef<number>(0);          // total seconds counted so far
  const lastTickRef = useRef<number | null>(null); // ms timestamp of last visible-state mark

  useEffect(() => {
    if (!enabled) return;
    if (!lessonId && !assignmentId) return;
    if (typeof document === "undefined") return;

    const supabase = createClient();
    let mounted = true;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const tickAccum = () => {
      if (lastTickRef.current !== null && document.visibilityState === "visible") {
        const delta = (Date.now() - lastTickRef.current) / 1000;
        if (delta > 0) accumRef.current += delta;
        lastTickRef.current = Date.now();
      }
    };

    const flush = async () => {
      tickAccum();
      if (!sessionIdRef.current) return;
      try {
        await supabase
          .from("material_sessions")
          .update({
            duration_seconds: Math.round(accumRef.current),
            ended_at: new Date().toISOString(),
          })
          .eq("id", sessionIdRef.current);
      } catch { /* tab closing — best effort */ }
    };

    const start = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!mounted || !userData.user) return;
      const { data, error } = await supabase
        .from("material_sessions")
        .insert({
          user_id: userData.user.id,
          lesson_id: lessonId ?? null,
          assignment_id: assignmentId ?? null,
          started_at: new Date().toISOString(),
          duration_seconds: 0,
        })
        .select("id")
        .single();
      if (!mounted || error) return;
      sessionIdRef.current = data.id;
      lastTickRef.current = document.visibilityState === "visible" ? Date.now() : null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
        lastTickRef.current = null;
      } else {
        lastTickRef.current = Date.now();
      }
    };

    const onPageHide = () => { flush(); };

    void start();
    heartbeat = setInterval(flush, 15000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      mounted = false;
      if (heartbeat) clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, assignmentId, enabled]);
}
