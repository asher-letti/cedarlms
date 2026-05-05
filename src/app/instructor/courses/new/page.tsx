"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MAX_COVER_BYTES, checkSize } from "@/lib/upload";
import { CATEGORIES } from "@/lib/categories";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCover = (f: File | null) => {
    if (f) {
      const sizeErr = checkSize(f, MAX_COVER_BYTES);
      if (sizeErr) { setErr(sizeErr); setCover(null); setCoverPreview(null); return; }
    }
    setErr(null);
    setCover(f);
    setCoverPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (title.trim().length < 3) return setErr("Title must be at least 3 characters.");
    if (title.length > 120) return setErr("Title is too long.");
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return setErr("Not authenticated"); }

    let cover_url: string | null = null;
    if (cover) {
      const path = `${user.id}/${Date.now()}-${cover.name}`;
      const up = await supabase.storage.from("course-covers").upload(path, cover);
      if (up.error) { setLoading(false); return setErr(up.error.message); }
      cover_url = supabase.storage.from("course-covers").getPublicUrl(path).data.publicUrl;
    }

    const { data: course, error } = await supabase.from("courses").insert({
      title, description, category, cover_url, instructor_id: user.id,
    }).select("id").single();

    setLoading(false);
    if (error) return setErr(error.message);
    router.push(`/instructor/courses/${course!.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm text-mocha-700 hover:underline underline-offset-4">← Back to dashboard</Link>
      <span className="chip mt-4 inline-flex">New course</span>
      <h1 className="h-display mt-3 text-4xl">Create a course</h1>
      <p className="mt-2 text-muted">Give it a title, a short description, and a cover. You can add lessons next.</p>

      <form onSubmit={onSubmit} className="card mt-8 p-8 space-y-6">
        {coverPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPreview} alt="" className="h-44 w-full rounded-xl border border-line object-cover" />
        )}
        <div>
          <label className="label">Title</label>
          <input className="input mt-1.5" placeholder="Introduction to Watercolor"
                 value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input mt-1.5" rows={5} placeholder="What will students learn?"
                    value={description} onChange={(e)=>setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input mt-1.5" value={category} onChange={(e)=>setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cover image <span className="text-muted font-normal">(optional, max 5 MB — we'll generate a beautiful one if not)</span></label>
          <input type="file" accept="image/*" onChange={(e)=>handleCover(e.target.files?.[0] ?? null)}
                 className="mt-2 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-mocha-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-mocha-800 hover:file:bg-mocha-200" />
        </div>
        {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex gap-3 pt-2">
          <button disabled={loading} className="btn-primary">{loading ? "Creating…" : "Create course"}</button>
          <button type="button" onClick={()=>router.back()} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
