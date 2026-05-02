"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Assignment = {
  id: string; course_id: string; title: string;
  description: string | null; deadline: string | null; max_points: number | null;
};
type Submission = {
  id: string; assignment_id: string; user_id: string;
  file_path: string | null; text_content: string | null;
  submitted_at: string; grade: number | null; feedback: string | null;
  graded_at: string | null;
  profiles?: { full_name: string | null } | null;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AssignmentsInstructor({
  courseId, initial,
}: { courseId: string; initial: Assignment[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Assignment[]>(initial);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [openSubsId, setOpenSubsId] = useState<string | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { data, error } = await supabase.from("assignments").insert({
      course_id: courseId, title, description,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      max_points: maxPoints,
    }).select("*").single();
    setBusy(false);
    if (error) return setErr(error.message);
    setItems([...items, data as Assignment]);
    setTitle(""); setDescription(""); setDeadline(""); setMaxPoints(100);
  };

  const saveEdit = async (a: Assignment) => {
    await supabase.from("assignments").update({
      title: a.title, description: a.description,
      deadline: a.deadline ? new Date(a.deadline).toISOString() : null,
      max_points: a.max_points,
    }).eq("id", a.id);
    setEditingId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this assignment? Submissions will be removed too.")) return;
    await supabase.from("assignments").delete().eq("id", id);
    setItems(items.filter(a => a.id !== id));
  };

  const openSubs = async (id: string) => {
    if (openSubsId === id) { setOpenSubsId(null); return; }
    setOpenSubsId(id); setSubsLoading(true);
    const { data } = await supabase
      .from("submissions")
      .select("*, profiles:user_id(full_name)")
      .eq("assignment_id", id)
      .order("submitted_at", { ascending: false });
    setSubs((data as Submission[]) ?? []);
    setSubsLoading(false);
  };

  const grade = async (sub: Submission, gradeVal: string, fb: string) => {
    const grade = gradeVal === "" ? null : Number(gradeVal);
    await supabase.from("submissions").update({
      grade, feedback: fb, graded_at: new Date().toISOString(),
    }).eq("id", sub.id);
    setSubs(subs.map(s => s.id === sub.id ? { ...s, grade, feedback: fb, graded_at: new Date().toISOString() } : s));
  };

  const downloadSub = async (path: string) => {
    const { data } = await supabase.storage.from("submissions").createSignedUrl(path, 60 * 10);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <section>
      <h2 className="h-display text-2xl">Assignments</h2>

      <ul className="card mt-4 divide-y divide-line overflow-hidden">
        {items.map(a => {
          const isEditing = editingId === a.id;
          const localItem = items.find(x => x.id === a.id)!;
          return (
            <li key={a.id} className="p-5">
              {isEditing ? (
                <div className="space-y-3">
                  <input className="input" value={localItem.title}
                    onChange={(e)=>setItems(items.map(x => x.id === a.id ? { ...x, title: e.target.value } : x))} />
                  <textarea className="input" rows={3} value={localItem.description ?? ""}
                    onChange={(e)=>setItems(items.map(x => x.id === a.id ? { ...x, description: e.target.value } : x))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Deadline</label>
                      <input type="datetime-local" className="input mt-1.5" value={toLocalInput(localItem.deadline)}
                        onChange={(e)=>setItems(items.map(x => x.id === a.id ? { ...x, deadline: e.target.value ? new Date(e.target.value).toISOString() : null } : x))} />
                    </div>
                    <div>
                      <label className="label">Max points</label>
                      <input type="number" className="input mt-1.5" value={localItem.max_points ?? 100}
                        onChange={(e)=>setItems(items.map(x => x.id === a.id ? { ...x, max_points: Number(e.target.value) } : x))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>saveEdit(localItem)} className="btn-primary">Save</button>
                    <button onClick={()=>setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg text-mocha-900">{a.title}</h3>
                      <p className="text-sm text-muted">
                        {a.deadline ? `Due ${new Date(a.deadline).toLocaleString()}` : "No deadline"}
                        {" · "}{a.max_points ?? 100} pts
                      </p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <button onClick={()=>openSubs(a.id)} className="text-mocha-700 hover:underline underline-offset-4">
                        {openSubsId === a.id ? "Hide submissions" : "View submissions"}
                      </button>
                      <button onClick={()=>setEditingId(a.id)} className="text-mocha-700 hover:underline underline-offset-4">Edit</button>
                      <button onClick={()=>remove(a.id)} className="text-red-700 hover:underline underline-offset-4">Delete</button>
                    </div>
                  </div>
                  {a.description && <p className="mt-2 text-sm text-mocha-800 whitespace-pre-wrap">{a.description}</p>}

                  {openSubsId === a.id && (
                    <div className="mt-4 rounded-xl border border-line bg-cream-50/60 p-4">
                      {subsLoading ? <p className="text-sm text-muted">Loading…</p> :
                        subs.length === 0 ? <p className="text-sm text-muted">No submissions yet.</p> :
                        <ul className="space-y-3">
                          {subs.map(s => (
                            <SubmissionRow key={s.id} sub={s}
                              onDownload={()=> s.file_path && downloadSub(s.file_path)}
                              onGrade={(g, fb)=>grade(s, g, fb)} />
                          ))}
                        </ul>}
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
        {!items.length && <li className="p-8 text-center text-muted">No assignments yet.</li>}
      </ul>

      <form onSubmit={create} className="card mt-6 p-8 space-y-5">
        <h3 className="h-display text-xl">New assignment</h3>
        <div>
          <label className="label">Title</label>
          <input className="input mt-1.5" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input mt-1.5" rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Deadline</label>
            <input type="datetime-local" className="input mt-1.5" value={deadline} onChange={(e)=>setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="label">Max points</label>
            <input type="number" className="input mt-1.5" value={maxPoints} onChange={(e)=>setMaxPoints(Number(e.target.value))} />
          </div>
        </div>
        {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        <div>
          <button disabled={busy} className="btn-primary">{busy ? "Adding…" : "Add assignment"}</button>
        </div>
      </form>
    </section>
  );
}

function SubmissionRow({
  sub, onDownload, onGrade,
}: { sub: Submission; onDownload: () => void; onGrade: (g: string, fb: string) => void }) {
  const [g, setG] = useState(sub.grade?.toString() ?? "");
  const [fb, setFb] = useState(sub.feedback ?? "");
  return (
    <li className="rounded-lg border border-line bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-mocha-900">{sub.profiles?.full_name ?? "Learner"}</p>
          <p className="text-xs text-muted">Submitted {new Date(sub.submitted_at).toLocaleString()}</p>
        </div>
        {sub.file_path && <button onClick={onDownload} className="btn-secondary text-xs px-3 py-1.5">Download file</button>}
      </div>
      {sub.text_content && <p className="mt-2 whitespace-pre-wrap text-sm text-mocha-800">{sub.text_content}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <input className="input" placeholder="Grade" value={g} onChange={(e)=>setG(e.target.value)} type="number" />
        <input className="input" placeholder="Feedback" value={fb} onChange={(e)=>setFb(e.target.value)} />
      </div>
      <button onClick={()=>onGrade(g, fb)} className="btn-primary mt-3 text-xs px-3 py-1.5">
        {sub.graded_at ? "Update grade" : "Save grade"}
      </button>
    </li>
  );
}
