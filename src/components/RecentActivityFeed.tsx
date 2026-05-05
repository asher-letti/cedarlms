"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type ActivityItem = {
  id: string;
  submitted_at: string;
  grade: number | null;
  graded_at: string | null;
  assignment_id: string;
  profiles: { full_name: string | null } | null;
  assignments: {
    id: string;
    title: string;
    course_id: string;
    courses: { id: string; title: string } | null;
  } | null;
};

const SELECT_JOIN =
  "id, submitted_at, grade, graded_at, assignment_id, profiles:user_id(full_name), assignments(id, title, course_id, courses(id, title))";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function RecentActivityFeed({ initial }: { initial: ActivityItem[] }) {
  const [items, setItems] = useState<ActivityItem[]>(initial);
  const [live, setLive] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  // ticker forces re-render every 60s so timeAgo refreshes
  const [, setTick] = useState(0);
  const idsRef = useRef(new Set(initial.map((i) => i.id)));

  useEffect(() => {
    const supabase = createClient();

    const fetchOne = async (id: string) => {
      // RLS filters: an instructor only gets back rows for their own courses,
      // even if the realtime payload contained an unrelated row.
      const { data } = await supabase
        .from("submissions")
        .select(SELECT_JOIN)
        .eq("id", id)
        .maybeSingle();
      return data as unknown as ActivityItem | null;
    };

    const channel = supabase
      .channel("instructor-activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        async (payload) => {
          const id = (payload.new as { id?: string })?.id;
          if (!id || idsRef.current.has(id)) return;
          const row = await fetchOne(id);
          if (!row) return; // RLS blocked: not one of our courses
          idsRef.current.add(row.id);
          setItems((prev) => [row, ...prev].slice(0, 10));
          setFlashId(row.id);
          setTimeout(() => setFlashId((cur) => (cur === row.id ? null : cur)), 2200);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "submissions" },
        async (payload) => {
          const id = (payload.new as { id?: string })?.id;
          if (!id) return;
          const row = await fetchOne(id);
          if (!row) return;
          setItems((prev) => prev.map((p) => (p.id === row.id ? row : p)));
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    const tick = setInterval(() => setTick((t) => t + 1), 60_000);

    return () => {
      clearInterval(tick);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line p-5">
        <h2 className="h-display text-xl">Recent activity</h2>
        <div className="flex items-center gap-2">
          <span className="chip">{items.length}</span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              live ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-cream-100 text-muted"
            }`}
            title={live ? "Realtime connected" : "Connecting…"}
          >
            <span
              className={`relative flex h-1.5 w-1.5 ${live ? "" : "opacity-50"}`}
              aria-hidden
            >
              {live && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-muted"}`} />
            </span>
            Live
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted">
          No submissions yet. They'll appear here as students send work in.
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((s) => {
            const studentName = s.profiles?.full_name ?? "A learner";
            const courseTitle = s.assignments?.courses?.title ?? "course";
            const assignmentTitle = s.assignments?.title ?? "an assignment";
            const courseId = s.assignments?.courses?.id;
            const isGraded = !!s.graded_at;
            const isFlashing = flashId === s.id;
            return (
              <li
                key={s.id}
                className={`p-4 transition-colors duration-700 ${
                  isFlashing ? "bg-emerald-50" : "hover:bg-cream-50/60"
                }`}
              >
                <Link href={courseId ? `/instructor/courses/${courseId}` : "#"} className="block">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mocha-100 text-mocha-800 text-xs font-semibold">
                      {studentName
                        .split(" ")
                        .slice(0, 2)
                        .map((w: string) => w[0]?.toUpperCase())
                        .join("") || "L"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-mocha-900">
                        <strong className="font-semibold">{studentName}</strong>{" "}
                        <span className="text-muted">submitted</span>{" "}
                        <span className="font-medium">{assignmentTitle}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted truncate">
                        in <span className="text-mocha-700">{courseTitle}</span> · {timeAgo(s.submitted_at)}
                        {isFlashing && <span className="ml-2 text-emerald-700 font-semibold">· new</span>}
                      </p>
                    </div>
                    <span
                      className={`chip shrink-0 ${
                        isGraded
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          : "bg-amber-50 text-amber-800 ring-amber-100"
                      }`}
                    >
                      {isGraded ? `${s.grade ?? ""}` : "Grade"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
