"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QuizPlayer from "@/components/QuizPlayer";
import { fmtDuration } from "@/lib/format";

type Lesson = {
  id: string;
  title: string;
  position: number;
  content_type: "video" | "document" | "quiz" | "text";
  storage_path: string | null;
  body: string | null;
  duration_minutes: number | null;
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
  canAccess: boolean;
  index: number;
  initiallyComplete?: boolean;
  userId?: string | null;
};

const blockContextMenu = (e: React.MouseEvent) => e.preventDefault();

export default function LessonItem({
  lesson, canAccess, index, initiallyComplete, userId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(!!initiallyComplete);
  const [marking, setMarking] = useState(false);
  const [autoCompleteToast, setAutoCompleteToast] = useState(false);
  const showMarkComplete = userId != null && lesson.content_type !== "quiz";
  const durationLabel = fmtDuration(lesson.duration_minutes);

  const loadContent = async () => {
    if (!canAccess) return;
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
    <li className="hover:bg-cream-50/60 transition">
      <button onClick={loadContent} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="flex items-center gap-4 min-w-0">
          {completed ? (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 text-sm ring-1 ring-emerald-200">✓</span>
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mocha-50 text-mocha-700 font-display text-sm ring-1 ring-mocha-100">
              {String(index).padStart(2, "0")}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium text-mocha-900">{lesson.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <span aria-hidden>{TYPE_GLYPH[lesson.content_type]}</span>
              <span className="capitalize">{lesson.content_type}</span>
              {durationLabel && <span aria-hidden>·</span>}
              {durationLabel && <span>{durationLabel}</span>}
              {completed && <span className="text-emerald-700">· Completed</span>}
            </span>
          </span>
        </span>
        {!canAccess
          ? <span className="chip-soft">Locked</span>
          : <span className="text-xs font-medium text-mocha-700">{open ? "Hide" : "Open"}</span>}
      </button>

      {open && canAccess && (
        <div
          className="material-viewer px-5 pb-5 -mt-1 space-y-3"
          onContextMenu={blockContextMenu}
        >
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
