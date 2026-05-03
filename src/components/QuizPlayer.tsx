"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Q = { id: string; position: number; question: string; options: { text: string }[] };
type ResultItem = { question_id: string; chosen: number | null; correct: boolean; correct_index: number };
type Result = { score: number; total: number; results: ResultItem[] };

export default function QuizPlayer({ lessonId }: { lessonId: string }) {
  const supabase = createClient();
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_quiz_questions", { p_lesson_id: lessonId });
      setLoading(false);
      if (error) return setErr(error.message);
      setQuestions((data ?? []) as Q[]);
    })();
    // eslint-disable-next-line
  }, [lessonId]);

  const submit = async () => {
    setErr(null);
    if (Object.keys(answers).length < questions.length) {
      return setErr("Please answer every question before submitting.");
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_quiz", {
      p_lesson_id: lessonId,
      p_answers: answers,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (row) setResult(row as Result);
  };

  const retake = () => {
    setAnswers({});
    setResult(null);
    setErr(null);
  };

  if (loading) return <p className="text-sm text-muted">Loading quiz…</p>;
  if (err && !questions.length) return <p className="text-sm text-red-700">{err}</p>;
  if (!questions.length) return <p className="text-sm text-muted">No questions in this quiz yet.</p>;

  const passed = result ? result.total > 0 && result.score / result.total >= 0.5 : false;
  const pct = result && result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {result && (
        <div className={`rounded-xl border p-4 ${passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <p className={`font-display text-2xl ${passed ? "text-emerald-800" : "text-amber-800"}`}>
            {result.score} / {result.total} ({pct}%)
          </p>
          <p className={`mt-1 text-sm ${passed ? "text-emerald-800" : "text-amber-800"}`}>
            {passed ? "Well done — you passed this quiz." : "Review the material and try again."}
          </p>
          <button onClick={retake} className="btn-secondary mt-3 text-xs px-3 py-1.5">Retake</button>
        </div>
      )}

      <ol className="space-y-4">
        {questions.map((q, idx) => {
          const r = result?.results.find(x => x.question_id === q.id);
          return (
            <li key={q.id} className="rounded-xl border border-line bg-white p-4">
              <p className="font-medium text-mocha-900">
                <span className="text-mocha-600">{idx + 1}.</span> {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((o, i) => {
                  const isChosen = answers[q.id] === i;
                  let stateClasses = "border-line hover:border-mocha-300";
                  if (result) {
                    if (i === r?.correct_index) stateClasses = "border-emerald-300 bg-emerald-50 text-emerald-900";
                    else if (i === r?.chosen && i !== r?.correct_index) stateClasses = "border-red-300 bg-red-50 text-red-900";
                    else stateClasses = "border-line opacity-70";
                  } else if (isChosen) {
                    stateClasses = "border-mocha-400 bg-mocha-50 text-mocha-900";
                  }
                  return (
                    <button key={i} disabled={!!result}
                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${stateClasses}`}>
                      <span className="mr-2 font-display text-xs text-mocha-600">{String.fromCharCode(65 + i)}</span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {!result && (
        <>
          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy ? "Submitting…" : "Submit answers"}
          </button>
        </>
      )}
    </div>
  );
}
