"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lesson = {
  id: string;
  title: string;
  position: number;
  content_type: "video" | "document" | "quiz" | "text";
  storage_path: string | null;
  body: string | null;
};

const isPdf = (path: string | null) => !!path && /\.pdf($|\?)/i.test(path);

const TYPE_GLYPH: Record<Lesson["content_type"], string> = {
  video: "▶",
  document: "❏",
  text: "✎",
  quiz: "?",
};

export default function LessonItem({
  lesson, canAccess, index,
}: { lesson: Lesson; canAccess: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const download = () => {
    if (!signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = lesson.storage_path?.split("/").pop() ?? lesson.title;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <li className="hover:bg-cream-50/60 transition">
      <button onClick={loadContent} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="flex items-center gap-4 min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mocha-50 text-mocha-700 font-display text-sm ring-1 ring-mocha-100">
            {String(index).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-mocha-900">{lesson.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <span aria-hidden>{TYPE_GLYPH[lesson.content_type]}</span>
              <span className="capitalize">{lesson.content_type}</span>
            </span>
          </span>
        </span>
        {!canAccess
          ? <span className="chip-soft">Locked</span>
          : <span className="text-xs font-medium text-mocha-700">{open ? "Hide" : "Open"}</span>}
      </button>

      {open && canAccess && (
        <div className="px-5 pb-5 -mt-1 space-y-3">
          {loading && <p className="text-sm text-muted">Loading…</p>}

          {lesson.content_type === "video" && signedUrl && (
            <>
              <video src={signedUrl} controls className="w-full rounded-xl border border-line bg-black" />
              <button onClick={download} className="btn-secondary text-xs px-3 py-1.5">Download video</button>
            </>
          )}

          {lesson.content_type === "document" && signedUrl && (
            <>
              {isPdf(lesson.storage_path) ? (
                <iframe src={signedUrl} className="w-full h-[70vh] rounded-xl border border-line bg-white" />
              ) : (
                <p className="text-sm text-muted">Preview not available for this file type. Use the download button below.</p>
              )}
              <div className="flex gap-2">
                <a href={signedUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs px-3 py-1.5">Open in new tab</a>
                <button onClick={download} className="btn-primary text-xs px-3 py-1.5">Download</button>
              </div>
            </>
          )}

          {lesson.content_type === "text" && (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-xl bg-cream-50/60 p-4 text-mocha-800">
              {lesson.body}
            </div>
          )}

          {lesson.content_type === "quiz" && (
            <p className="text-sm text-muted">Quiz player coming soon.</p>
          )}
        </div>
      )}
    </li>
  );
}
