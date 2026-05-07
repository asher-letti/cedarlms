"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (key: string) => void | Promise<void>;
};

export default function EnrollKeyModal({ open, busy, error, onClose, onSubmit }: Props) {
  const [key, setKey] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setKey("");
      // give the dialog a frame to mount, then focus
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-key-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
    >
      <div
        className="absolute inset-0 bg-mocha-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-[0_30px_60px_-20px_rgba(42,27,15,0.40)] p-6">
        <h2 id="enroll-key-title" className="font-display text-2xl text-mocha-900">
          Enrollment key required
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          This course is private. Ask your instructor for the enrollment key.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && key.trim().length > 0) onSubmit(key);
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="label">Enrollment key</label>
            <input
              ref={inputRef}
              className="input mt-1.5"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••"
              autoComplete="one-time-code"
              spellCheck={false}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={busy || !key.trim()} className="btn-primary">
              {busy ? "Verifying…" : "Enroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
