"use client";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QuizPlayer from "@/components/QuizPlayer";
import MaterialSessionTracker from "@/components/MaterialSessionTracker";
import { fmtDuration } from "@/lib/format";
import {
  effectiveUnlockDate,
  fmtUnlockDate,
  isScheduledLocked,
} from "@/lib/scheduling";

type Lesson = {
  id: string;
  title: string;
  position: number;
  content_type: "video" | "document" | "quiz" | "text";
  storage_path: string | null;
  body: string | null;
  duration_minutes: number | null;
  week_number: number | null;
  available_from: string | null;
};

const isPdf = (path: string | null) => !!path && /\.pdf($|\?)/i.test(path);

const TYPE_GLYPH: Record<Lesson["content_type"], string> = {
  video: "▶",
  document: "❏",
  text: "✎",
  quiz: "?",
};

type Props = {
  lesson: Lesson;
  /** True when the user is enrolled (or instructor); independent of weekly schedule. */
  canAccess: boolean;
  index: number;
  initiallyComplete?: boolean;
  userId?: string | null;
  isInstructor?: boolean;
  courseStartDate?: string | null;
  /** Highlights this lesson if it's in the learner's current week. */
  isCurrentWeek?: boolean;
};

const blockContextMenu = (e: React.MouseEvent) => e.preventDefault();

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function LessonItem({
  lesson, canAccess, index, initiallyComplete, userId,
  isInstructor, courseStartDate, isCurrentWeek,
}: Props) {
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(!!initiallyComplete);
  const [marking, setMarking] = useState(false);
  const [autoCompleteToast, setAutoCompleteToast] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  const unlockDate = useMemo(
    () => effectiveUnlockDate(lesson.week_number, lesson.available_from, courseStartDate),
    [lesson.week_number, lesson.available_from, courseStartDate]
  );
  const scheduledLocked = !isInstructor && isScheduledLocked(unlockDate);
  const showMarkComplete = userId != null && lesson.content_type !== "quiz" && !scheduledLocked;
  const durationLabel = fmtDuration(lesson.duration_minutes);
  const unlockLabel = fmtUnlockDate(unlockDate);

  const onClickRow = async () => {
    if (!canAccess) return;
    if (scheduledLocked) {
      setLockMessage(
        `This lesson opens ${unlockLabel ? `on ${unlockLabel}` : "later in the course"}.`
      );
      setTimeout(() => setLockMessage(null), 5000);
      return;
    }
    if (!lesson.storage_path || signedUrl) return setOpen(!open);
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.storage.from("course-content")
      .createSignedUrl(lesson.storage_path, 60 * 60);
    setSignedUrl(data?.signedUrl ?? null);
    setLoading(false);
    setOpen(true);
  };

  const setComplete = async (next: boolean) => {
    if (!userId) return;
    const supabase = createClient();
    if (next) {
      await supabase.from("lesson_progress").upsert({
        user_id: userId, lesson_id: lesson.id,
        completed: true, completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" });
    } else {
      await supabase.from("lesson_progress").update({
        completed: false, completed_at: null,
      }).eq("user_id", userId).eq("lesson_id", lesson.id);
    }
    setCompleted(next);
  };

  const toggleComplete = async () => {
    if (!userId || marking) return;
    setMarking(true);
    await setComplete(!completed);
    setMarking(false);
  };

  const onVideoEnded = async () => {
    if (!userId || completed) return;
    await setComplete(true);
    setAutoCompleteToast(true);
    setTimeout(() => setAutoCompleteToast(false), 4000);
  };

  return (
    <li
      className={`relative transition ${
        scheduledLocked ? "opacity-90" : "hover:bg-cream-50/60"
      } ${isCurrentWeek && !completed ? "bg-mocha-50/30" : ""}`}
    >
      {isCurrentWeek && !completed && !scheduledLocked && (
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-0.5 bg-mocha-700" />
      )}
      <button onClick={onClickRow} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="flex items-center gap-4 min-w-0">
          {completed ? (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 text-sm ring-1 ring-emerald-200">✓</span>
          ) : scheduledLocked ? (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100 text-mocha-500 ring-1 ring-line">
              <LockIcon />
            </span>
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mocha-50 text-mocha-700 font-display text-sm ring-1 ring-mocha-100">
              {String(index).padStart(2, "0")}
            </span>
          )}
          <span className="min-w-0">
            <span className={`block truncate font-medium ${scheduledLocked ? "text-mocha-700" : "text-mocha-900"}`}>
              {lesson.title}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <span aria-hidden>{TYPE_GLYPH[lesson.content_type]}</span>
              <span className="capitalize">{lesson.content_type}</span>
              {durationLabel && <span aria-hidden>·</span>}
              {durationLabel && <span>{durationLabel}</span>}
              {scheduledLocked && lesson.week_number != null && (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-mocha-700 font-medium">
                    Opens Week {lesson.week_number}{unlockLabel ? ` — ${unlockLabel}` : ""}
                  </span>
                </>
              )}
              {completed && <span className="text-emerald-700">· Completed</span>}
            </span>
          </span>
        </span>
        {!canAccess
          ? <span className="chip-soft">Locked</span>
          : scheduledLocked
            ? <span className="chip-soft inline-flex items-center gap-1"><LockIcon />Locked</span>
            : <span className="text-xs font-medium text-mocha-700">{open ? "Hide" : "Open"}</span>}
      </button>

      {scheduledLocked && lockMessage && (
        <p className="px-5 pb-4 -mt-1 text-sm text-mocha-700">
          {lockMessage}
        </p>
      )}

      {open && canAccess && !scheduledLocked && (
        <div
          className="material-viewer px-5 pb-5 -mt-1 space-y-3"
          onContextMenu={blockContextMenu}
        >
          {/* Time-on-material tracker — only mounted while content is open */}
          {!isInstructor && userId && (
            <MaterialSessionTracker lessonId={lesson.id} userId={userId} />
          )}

          {loading && <p className="text-sm text-muted">Loading…</p>}

          {lesson.content_type === "video" && signedUrl && (
            <>
              <video
                src={signedUrl}
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={blockContextMenu}
                onEnded={onVideoEnded}
                className="w-full rounded-xl border border-line bg-black"
              />
              {autoCompleteToast && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  ✓ Marked complete — nice work!
                </p>
              )}
            </>
          )}

          {lesson.content_type === "document" && signedUrl && (
            <>
              {isPdf(lesson.storage_path) ? (
                <iframe
                  src={`${signedUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-[70vh] rounded-xl border border-line bg-white"
                  onContextMenu={blockContextMenu}
                  title={lesson.title}
                />
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  This file type can't be previewed inline. Please use a video or PDF lesson, or contact your instructor.
                </p>
              )}
            </>
          )}

          {lesson.content_type === "text" && (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-xl bg-cream-50/60 p-4 text-mocha-800">
              {lesson.body}
            </div>
          )}

          {lesson.content_type === "quiz" && (
            <QuizPlayer lessonId={lesson.id} />
          )}

          {showMarkComplete && (
            <div className="pt-2 border-t border-line">
              <button onClick={toggleComplete} disabled={marking}
                className={completed ? "btn-secondary text-xs px-3 py-1.5" : "btn-primary text-xs px-3 py-1.5"}>
                {marking ? "Saving…" : completed ? "Mark as incomplete" : "Mark as complete"}
              </button>
              {!completed && lesson.content_type === "video" && (
                <p className="mt-2 text-xs text-muted">Tip: this lesson auto-completes when the video reaches the end.</p>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
