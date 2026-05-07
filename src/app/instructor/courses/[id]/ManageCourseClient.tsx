"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignmentsInstructor from "./AssignmentsInstructor";
import QuizManager from "@/components/QuizManager";
import EnrollmentKeyCard from "./EnrollmentKeyCard";
import { MAX_LESSON_BYTES, checkSize } from "@/lib/upload";

type Course = {
  id: string; title: string; description: string | null;
  cover_url: string | null; published: boolean; instructor_id: string;
  requires_enrollment_key: boolean;
};
type Lesson = {
  id: string; title: string; position: number;
  content_type: "video" | "document" | "quiz" | "text";
  storage_path: string | null; body: string | null;
  duration_minutes: number | null;
};
type Assignment = {
  id: string; course_id: string; title: string;
  description: string | null; deadline: string | null; max_points: number | null;
};

export default function ManageCourseClient({
  course, initialLessons, initialAssignments,
}: {
  course: Course; initialLessons: Lesson[]; initialAssignments: Assignment[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [published, setPublished] = useState(course.published);

  // new lesson state
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<Lesson["content_type"]>("video");
  const [file, setFile] = useState<File | null>(null);
  const [body, setBody] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // editing existing lesson
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editDuration, setEditDuration] = useState<string>("");
  const [openQuizId, setOpenQuizId] = useState<string | null>(null);

  const togglePublish = async () => {
    const next = !published;
    const { error } = await supabase.from("courses").update({ published: next }).eq("id", course.id);
    if (!error) setPublished(next);
  };

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (title.trim().length < 3) return setErr("Lesson title must be at least 3 characters.");
    if ((contentType === "video" || contentType === "document") && !file) return setErr("Please choose a file.");
    if (file) {
      const sizeErr = checkSize(file, MAX_LESSON_BYTES);
      if (sizeErr) return setErr(sizeErr);
    }
    setBusy(true);
    let storage_path: string | null = null;
    if ((contentType === "video" || contentType === "document") && file) {
      const path = `${course.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("course-content").upload(path, file);
      if (up.error) { setBusy(false); return setErr(up.error.message); }
      storage_path = path;
    }
    const position = lessons.length;
    const durationVal = duration.trim() === "" ? null : Math.max(0, Math.round(Number(duration)));
    const { data, error } = await supabase.from("lessons").insert({
      course_id: course.id, title, position, content_type: contentType,
      storage_path, body: contentType === "text" ? body : null,
      duration_minutes: durationVal,
    }).select("*").single();
    setBusy(false);
    if (error) return setErr(error.message);
    setLessons([...lessons, data as Lesson]);
    setTitle(""); setFile(null); setBody(""); setDuration("");
  };

  const startEdit = (l: Lesson) => {
    setEditingId(l.id);
    setEditTitle(l.title);
    setEditBody(l.body ?? "");
    setEditDuration(l.duration_minutes != null ? String(l.duration_minutes) : "");
  };
  const saveEdit = async () => {
    if (!editingId) return;
    const lesson = lessons.find(l => l.id === editingId);
    const patch: Partial<Lesson> = {
      title: editTitle,
      duration_minutes: editDuration.trim() === "" ? null : Math.max(0, Math.round(Number(editDuration))),
    };
    if (lesson?.content_type === "text") patch.body = editBody;
    await supabase.from("lessons").update(patch).eq("id", editingId);
    setLessons(lessons.map(l => l.id === editingId ? { ...l, ...patch } as Lesson : l));
    setEditingId(null);
  };

  const deleteLesson = async (id: string, path: string | null) => {
    if (!confirm("Delete this lesson?")) return;
    if (path) await supabase.storage.from("course-content").remove([path]);
    await supabase.from("lessons").delete().eq("id", id);
    setLessons(lessons.filter(l => l.id !== id));
  };

  const deleteCourse = async () => {
    if (!confirm("Delete this entire course? This cannot be undone.")) return;
    await supabase.from("courses").delete().eq("id", course.id);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className={`chip ${published ? "bg-emerald-50 text-emerald-700" : ""}`}>
            {published ? "Published" : "Draft"}
          </span>
          <h1 className="h-display mt-3 text-4xl">{course.title}</h1>
          <p className="mt-2 text-muted">Manage your curriculum, assignments and visibility.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/instructor/courses/${course.id}/students`} className="btn-secondary">Students</Link>
          <Link href={`/instructor/courses/${course.id}/edit`} className="btn-secondary">Edit details</Link>
          <button onClick={togglePublish} className={published ? "btn-secondary" : "btn-primary"}>
            {published ? "Unpublish" : "Publish"}
          </button>
          <button onClick={deleteCourse} className="btn-danger">Delete</button>
        </div>
      </header>

      {/* LESSONS */}
      <section>
        <h2 className="h-display text-2xl">Lessons</h2>
        <ul className="card mt-4 divide-y divide-line overflow-hidden">
          {lessons.map(l => (
            <li key={l.id} className="p-5 hover:bg-cream-50/60 transition">
              {editingId === l.id ? (
                <div className="space-y-3">
                  <input className="input" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} />
                  <div>
                    <label className="text-xs text-muted">Duration (minutes, optional)</label>
                    <input className="input mt-1" type="number" min={0} value={editDuration}
                           onChange={(e)=>setEditDuration(e.target.value)} placeholder="e.g. 15" />
                  </div>
                  {l.content_type === "text" && (
                    <textarea className="input" rows={4} value={editBody} onChange={(e)=>setEditBody(e.target.value)} />
                  )}
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="btn-primary">Save</button>
                    <button onClick={()=>setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="chip">{l.content_type}</span>
                      <span className="font-medium text-mocha-900 truncate">{l.title}</span>
                      {l.duration_minutes != null && (
                        <span className="text-xs text-muted whitespace-nowrap">{l.duration_minutes} min</span>
                      )}
                    </span>
                    <span className="flex gap-3 text-sm">
                      {l.content_type === "quiz" && (
                        <button onClick={() => setOpenQuizId(openQuizId === l.id ? null : l.id)}
                                className="text-mocha-700 hover:underline underline-offset-4">
                          {openQuizId === l.id ? "Hide questions" : "Manage questions"}
                        </button>
                      )}
                      <button onClick={() => startEdit(l)} className="text-mocha-700 hover:underline underline-offset-4">Edit</button>
                      <button onClick={() => deleteLesson(l.id, l.storage_path)} className="text-red-700 hover:underline underline-offset-4">Delete</button>
                    </span>
                  </div>
                  {l.content_type === "quiz" && openQuizId === l.id && (
                    <QuizManager lessonId={l.id} />
                  )}
                </>
              )}
            </li>
          ))}
          {!lessons.length && <li className="p-8 text-center text-muted">No lessons yet — add the first one below.</li>}
        </ul>
      </section>

      <section className="card p-8">
        <h2 className="h-display text-2xl">Add a lesson</h2>
        <form onSubmit={addLesson} className="mt-6 space-y-5">
          <div>
            <label className="label">Lesson title</label>
            <input className="input mt-1.5" value={title} onChange={(e)=>setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label">Content type</label>
            <select className="input mt-1.5" value={contentType}
                    onChange={(e)=>setContentType(e.target.value as Lesson["content_type"])}>
              <option value="video">Video (upload)</option>
              <option value="document">Document (PDF / docx / etc.)</option>
              <option value="text">Text / reading</option>
              <option value="quiz">Quiz (placeholder)</option>
            </select>
            {(contentType === "video" || contentType === "document") && (
              <p className="mt-2 text-xs text-muted">Max file size: 100 MB.</p>
            )}
          </div>
          {(contentType === "video" || contentType === "document") && (
            <div>
              <label className="label">File</label>
              <input type="file" onChange={(e)=>setFile(e.target.files?.[0] ?? null)}
                     accept={contentType === "video" ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx,.txt"} required
                     title="Maximum file size: 100 MB"
                     className="mt-1.5 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-mocha-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-mocha-800 hover:file:bg-mocha-200" />
            </div>
          )}
          {contentType === "text" && (
            <div>
              <label className="label">Lesson content</label>
              <textarea className="input mt-1.5" rows={6} value={body} onChange={(e)=>setBody(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">Duration <span className="text-muted font-normal">(minutes, optional)</span></label>
            <input className="input mt-1.5" type="number" min={0} value={duration}
                   onChange={(e)=>setDuration(e.target.value)} placeholder="e.g. 15" />
            <p className="mt-1 text-xs text-muted">Helps learners plan; sums into a total course duration.</p>
          </div>

          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          <div>
            <button disabled={busy} className="btn-primary">{busy ? "Adding…" : "Add lesson"}</button>
          </div>
        </form>
      </section>

      {/* ASSIGNMENTS */}
      <AssignmentsInstructor courseId={course.id} initial={initialAssignments} />

      {/* ENROLLMENT KEY */}
      <EnrollmentKeyCard
        courseId={course.id}
        initiallyRequires={course.requires_enrollment_key}
      />
    </div>
  );
}
