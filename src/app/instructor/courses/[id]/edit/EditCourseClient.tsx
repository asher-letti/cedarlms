"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CourseCover from "@/components/CourseCover";
import { MAX_COVER_BYTES, checkSize } from "@/lib/upload";
import { CATEGORIES, isCanonicalCategory } from "@/lib/categories";

type Course = {
  id: string; title: string; description: string | null;
  cover_url: string | null; published: boolean; instructor_id: string;
  category: string | null;
  course_start_date: string | null;
};

export default function EditCourseClient({ course }: { course: Course }) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");
  const initialCategory = course.category ?? "General";
  const initialIsCustom = course.category != null && !isCanonicalCategory(course.category);
  const [category, setCategory] = useState<string>(initialIsCustom ? "__other__" : initialCategory);
  const [customCategory, setCustomCategory] = useState<string>(initialIsCustom ? initialCategory : "");
  const isCustom = category === "__other__";
  const [startDate, setStartDate] = useState<string>(course.course_start_date ?? "");
  const [cover, setCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState(course.cover_url);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (title.trim().length < 3) return setErr("Title must be at least 3 characters.");
    const finalCategory = isCustom ? customCategory.trim() : category;
    if (isCustom && finalCategory.length < 2) return setErr("Custom category must be at least 2 characters.");
    if (finalCategory.length > 40) return setErr("Category name is too long.");
    if (cover) {
      const sizeErr = checkSize(cover, MAX_COVER_BYTES);
      if (sizeErr) return setErr(sizeErr);
    }
    setBusy(true);
    const supabase = createClient();
    let nextCoverUrl = coverUrl;
    if (cover) {
      const path = `${course.instructor_id}/${Date.now()}-${cover.name}`;
      const up = await supabase.storage.from("course-covers").upload(path, cover);
      if (up.error) { setBusy(false); return setErr(up.error.message); }
      nextCoverUrl = supabase.storage.from("course-covers").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("courses")
      .update({
        title, description, category: finalCategory,
        cover_url: nextCoverUrl,
        course_start_date: startDate || null,
      })
      .eq("id", course.id);
    setBusy(false);
    if (error) return setErr(error.message);
    setCoverUrl(nextCoverUrl);
    setMsg("Saved.");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/instructor/courses/${course.id}`} className="text-sm text-mocha-700 hover:underline underline-offset-4">← Back to course</Link>
      <h1 className="h-display mt-3 text-4xl">Edit course</h1>

      <form onSubmit={onSubmit} className="card mt-6 p-8 space-y-5">
        <div>
          <label className="label">Title</label>
          <input className="input mt-1.5" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input mt-1.5" rows={6} value={description} onChange={(e)=>setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input mt-1.5" value={category} onChange={(e)=>setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__other__">Other (type your own)…</option>
          </select>
          {isCustom && (
            <input
              className="input mt-2"
              placeholder="e.g. Beekeeping for beginners"
              value={customCategory}
              onChange={(e)=>setCustomCategory(e.target.value)}
              maxLength={40}
            />
          )}
        </div>
        <div>
          <label className="label">Course start date <span className="text-muted font-normal">(optional)</span></label>
          <input type="date" className="input mt-1.5" value={startDate}
                 onChange={(e)=>setStartDate(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Lessons with a Week number unlock weekly from this date.</p>
        </div>
        <div>
          <label className="label">Cover image</label>
          <div className="mt-2 h-40 w-full overflow-hidden rounded-xl border border-line">
            <CourseCover id={course.id} title={course.title} url={coverUrl} />
          </div>
          <input type="file" accept="image/*" onChange={(e)=>setCover(e.target.files?.[0] ?? null)}
                 className="mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-mocha-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-mocha-800 hover:file:bg-mocha-200" />
        </div>
        {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        {msg && <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{msg}</p>}
        <div className="flex gap-3 pt-2">
          <button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save changes"}</button>
          <Link href={`/instructor/courses/${course.id}`} className="btn-secondary">Done</Link>
        </div>
      </form>
    </div>
  );
}
