"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  courseId: string;
  initiallyRequires: boolean;
};

function genKey(len = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit 0/O/1/I
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function EnrollmentKeyCard({ courseId, initiallyRequires }: Props) {
  const supabase = createClient();
  const [enabled, setEnabled] = useState(initiallyRequires);
  const [key, setKey] = useState<string>("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!initiallyRequires);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load existing key from server when card mounts (instructor only via RPC).
  useEffect(() => {
    if (!initiallyRequires) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_enrollment_key", { p_course_id: courseId });
      if (cancelled) return;
      if (!error && typeof data === "string") setKey(data);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const onToggle = (next: boolean) => {
    setErr(null); setMsg(null);
    setEnabled(next);
    if (next && !key) setKey(genKey());
  };

  const onSave = async () => {
    setBusy(true); setErr(null); setMsg(null);
    const finalKey = enabled ? key.trim() : null;
    if (enabled && (!finalKey || finalKey.length < 4)) {
      setBusy(false);
      setErr("Key must be at least 4 characters.");
      return;
    }
    const { error } = await supabase.rpc("set_enrollment_key", {
      p_course_id: courseId,
      p_key: finalKey,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg(enabled ? "Enrollment key saved." : "Enrollment is now open to anyone.");
    setTimeout(() => setMsg(null), 4000);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  return (
    <section className="card p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="h-display text-2xl">Enrollment key</h2>
          <p className="mt-1 text-sm text-muted leading-relaxed">
            Restrict enrollment to learners who know a key. Share it privately with the right cohort.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
            enabled ? "bg-mocha-700" : "bg-cream-200"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
          <span className="sr-only">{enabled ? "Disable enrollment key" : "Enable enrollment key"}</span>
        </button>
      </div>

      {enabled && (
        <div className="mt-5 space-y-3">
          <label className="label">Key</label>
          <div className="flex flex-wrap items-stretch gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type={reveal ? "text" : "password"}
                value={loaded ? key : ""}
                onChange={(e) => setKey(e.target.value)}
                disabled={!loaded}
                spellCheck={false}
                autoComplete="off"
                className="input pr-10 font-mono tracking-wider"
                placeholder={loaded ? "" : "Loading…"}
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full text-mocha-600 transition-colors hover:bg-cream-100 hover:text-mocha-800"
                aria-label={reveal ? "Hide key" : "Show key"}
              >
                <EyeIcon open={reveal} />
              </button>
            </div>
            <button
              type="button"
              onClick={onCopy}
              disabled={!key}
              className="btn-secondary text-xs"
              title="Copy to clipboard"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => { setKey(genKey()); setReveal(true); }}
              className="btn-secondary text-xs"
              title="Generate a new random key"
            >
              Regenerate
            </button>
          </div>
          <p className="text-xs text-muted">
            4–32 characters. Avoid spaces. Share this privately — anyone with the key can enroll.
          </p>
        </div>
      )}

      {!enabled && (
        <p className="mt-5 rounded-xl bg-cream-50 p-4 text-sm text-muted">
          Enrollment is open. Anyone signed in can join this course.
        </p>
      )}

      {err && (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
      )}
      {msg && (
        <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button onClick={onSave} disabled={busy} className="btn-primary text-sm">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}
