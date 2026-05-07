"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_SUBMISSION_BYTES, checkSize } from "@/lib/upload";
import MaterialSessionTracker from "@/components/MaterialSessionTracker";

type Assignment = {
  id: string; title: string; description: string | null;
  deadline: string | null; max_points: number | null;
};
type Submission = {
  id: string; assignment_id: string; file_path: string | null;
  text_content: string | null; submitted_at: string;
  grade: number | null; feedback: string | null; graded_at: string | null;
};

export default function AssignmentsLearner({
  assignments, mySubmissions, userId,
}: { assignments: Assignment[]; mySubmissions: Submission[]; userId: string }) {
  const supabase = createClient();
  const [subs, setSubs] = useState<Submission[]>(mySubmissions);
  const subFor = (aid: string) => subs.find(s => s.assignment_id === aid);

  return (
    <ul className="card mt-4 divide-y divide-line overflow-hidden">
      {assignments.map(a => {
        const sub = subFor(a.id);
        const overdue = a.deadline ? new Date(a.deadline) < new Date() : false;
        return (
          <li key={a.id} className="p-5">
            {/* Time-on-assignment tracker for the engagement window */}
            <MaterialSessionTracker assignmentId={a.id} userId={userId} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg text-mocha-900">{a.title}</h3>
                <p className="text-sm text-muted">
                  {a.deadline ? `Due ${new Date(a.deadline).toLocaleString()}` : "No deadline"}
                  {" · "}{a.max_points ?? 100} pts
                  {overdue && !sub && <span className="ml-2 text-red-700">overdue</span>}
                </p>
                {a.description && <p className="mt-2 whitespace-pre-wrap text-sm text-mocha-800">{a.description}</p>}
              </div>
              {sub?.grade != null && (
                <span className="chip bg-emerald-50 text-emerald-700">Graded: {sub.grade}/{a.max_points ?? 100}</span>
              )}
            </div>
            <SubmissionForm
              assignmentId={a.id}
              userId={userId}
              existing={sub}
              supabase={supabase}
              onChange={(s: Submission | null)=>{
                setSubs(prev => {
                  const without = prev.filter(p => p.assignment_id !== a.id);
                  return s ? [...without, s] : without;
                });
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}

function SubmissionForm({
  assignmentId, userId, existing, supabase, onChange,
}: any) {
  const [text, setText] = useState<string>(existing?.text_content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const downloadExisting = async () => {
    if (!existing?.file_path) return;
    const { data } = await supabase.storage.from("submissions").createSignedUrl(existing.file_path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (file) {
      const sizeErr = checkSize(file, MAX_SUBMISSION_BYTES);
      if (sizeErr) return setErr(sizeErr);
    }
    if (!file && !text && !existing) return setErr("Please attach a file or write a note.");
    setBusy(true);
    let file_path: string | null = existing?.file_path ?? null;
    if (file) {
      // remove old
      if (existing?.file_path) await supabase.storage.from("submissions").remove([existing.file_path]);
      const path = `${userId}/${assignmentId}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("submissions").upload(path, file);
      if (up.error) { setBusy(false); return setErr(up.error.message); }
      file_path = path;
    }
    const payload = {
      assignment_id: assignmentId, user_id: userId,
      file_path, text_content: text || null,
      submitted_at: new Date().toISOString(),
    };
    const { data, error } = existing
      ? await supabase.from("submissions").update(payload).eq("id", existing.id).select("*").single()
      : await supabase.from("submissions").insert(payload).select("*").single();
    setBusy(false);
    if (error) return setErr(error.message);
    onChange(data);
    setFile(null);
    setMsg(existing ? "Submission updated." : "Submitted.");
  };

  const withdraw = async () => {
    if (!existing) return;
    if (!confirm("Withdraw your submission?")) return;
    if (existing.file_path) await supabase.storage.from("submissions").remove([existing.file_path]);
    await supabase.from("submissions").delete().eq("id", existing.id);
    onChange(null);
    setText("");
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-line bg-cream-50/60 p-4 space-y-3">
      <p className="text-sm font-medium text-mocha-900">
        {existing ? "Your submission" : "Submit your work"}
      </p>
      {existing && (
        <p className="text-xs text-muted">
          Last submitted {new Date(existing.submitted_at).toLocaleString()}
          {existing.feedback && <> · Feedback: <span className="text-mocha-800">{existing.feedback}</span></>}
        </p>
      )}
      <textarea className="input" rows={3} placeholder="Notes / answer (optional)"
                value={text} onChange={(e)=>setText(e.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0] ?? null)}
               title="Max 25 MB"
               className="block text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-mocha-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-mocha-800 hover:file:bg-mocha-200" />
        {existing?.file_path && (
          <button type="button" onClick={downloadExisting} className="text-sm text-mocha-700 hover:underline underline-offset-4">
            Download current file
          </button>
        )}
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="btn-primary">{busy ? "Saving…" : existing ? "Update submission" : "Submit"}</button>
        {existing && <button type="button" onClick={withdraw} className="btn-danger">Withdraw</button>}
      </div>
    </form>
  );
}
