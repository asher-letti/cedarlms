"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  lesson_id: string;
  position: number;
  question: string;
  options: { text: string }[];
  correct_index: number;
};

export default function QuizManager({ lessonId }: { lessonId: string }) {
  const supabase = createClient();
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // new question form
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("position");
    setLoading(false);
    if (error) return setErr(error.message);
    setItems((data ?? []) as Question[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [lessonId]);

  const reset = () => {
    setQ(""); setOpts(["", "", "", ""]); setCorrect(0);
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!q.trim()) return setErr("Question text is required.");
    const filled = opts.map(o => o.trim()).filter(Boolean);
    if (filled.length < 2) return setErr("Provide at least 2 options.");
    if (correct >= filled.length) return setErr("Correct answer must be one of the filled options.");
    setBusy(true);
    const { data, error } = await supabase.from("quiz_questions").insert({
      lesson_id: lessonId,
      position: items.length,
      question: q.trim(),
      options: filled.map(t => ({ text: t })),
      correct_index: correct,
    }).select("*").single();
    setBusy(false);
    if (error) return setErr(error.message);
    setItems([...items, data as Question]);
    reset();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("quiz_questions").delete().eq("id", id);
    setItems(items.filter(x => x.id !== id));
  };

  const saveEdit = async (item: Question) => {
    const filled = item.options.map(o => o.text.trim()).filter(Boolean);
    if (filled.length < 2) return setErr("Provide at least 2 options.");
    await supabase.from("quiz_questions").update({
      question: item.question,
      options: item.options.filter(o => o.text.trim()),
      correct_index: item.correct_index,
    }).eq("id", item.id);
    setEditingId(null);
    load();
  };

  return (
    <div className="mt-3 rounded-xl border border-line bg-cream-50/40 p-4">
      <p className="text-xs uppercase tracking-wider text-mocha-600 mb-3">Quiz questions ({items.length})</p>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No questions yet — add the first one below.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((it, idx) => (
            <li key={it.id} className="rounded-lg border border-line bg-white p-3">
              {editingId === it.id ? (
                <EditRow item={it} setItem={(next) => setItems(items.map(x => x.id === it.id ? next : x))}
                         onSave={() => saveEdit(items.find(x => x.id === it.id)!)}
                         onCancel={() => { setEditingId(null); load(); }} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-mocha-900"><span className="text-mocha-600">{idx + 1}.</span> {it.question}</p>
                    <span className="flex gap-3 text-xs">
                      <button onClick={() => setEditingId(it.id)} className="text-mocha-700 hover:underline underline-offset-4">Edit</button>
                      <button onClick={() => deleteQuestion(it.id)} className="text-red-700 hover:underline underline-offset-4">Delete</button>
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {it.options.map((o, i) => (
                      <li key={i} className={`flex items-center gap-2 ${i === it.correct_index ? "text-emerald-700 font-medium" : "text-mocha-800"}`}>
                        <span className="w-5 text-center">{i === it.correct_index ? "✓" : "·"}</span>
                        {o.text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={addQuestion} className="mt-4 space-y-3 rounded-lg border border-dashed border-line bg-white p-4">
        <p className="text-sm font-medium text-mocha-900">Add a question</p>
        <input className="input" placeholder="Question" value={q} onChange={(e)=>setQ(e.target.value)} />
        <div className="grid grid-cols-1 gap-2">
          {opts.map((o, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} />
              <input className="input" placeholder={`Option ${String.fromCharCode(65 + i)}`}
                     value={o} onChange={(e)=> setOpts(opts.map((x, j) => j === i ? e.target.value : x))} />
            </label>
          ))}
        </div>
        <p className="text-xs text-muted">Tick the radio next to the correct option. Empty options will be ignored.</p>
        {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        <div>
          <button disabled={busy} className="btn-primary text-xs px-4 py-2">
            {busy ? "Adding…" : "Add question"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditRow({
  item, setItem, onSave, onCancel,
}: { item: Question; setItem: (q: Question) => void; onSave: () => void; onCancel: () => void }) {
  const setOpt = (i: number, text: string) => {
    const next = [...item.options];
    while (next.length <= i) next.push({ text: "" });
    next[i] = { text };
    setItem({ ...item, options: next });
  };
  const ensure4 = [0, 1, 2, 3].map(i => item.options[i]?.text ?? "");

  return (
    <div className="space-y-3">
      <input className="input" value={item.question}
             onChange={(e)=>setItem({ ...item, question: e.target.value })} />
      <div className="grid grid-cols-1 gap-2">
        {ensure4.map((text, i) => (
          <label key={i} className="flex items-center gap-2">
            <input type="radio" checked={item.correct_index === i}
                   onChange={() => setItem({ ...item, correct_index: i })} />
            <input className="input" placeholder={`Option ${String.fromCharCode(65 + i)}`}
                   value={text} onChange={(e)=> setOpt(i, e.target.value)} />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="btn-primary text-xs px-3 py-1.5">Save</button>
        <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
      </div>
    </div>
  );
}
