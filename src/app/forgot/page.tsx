"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg("If an account exists for that email, we've sent a reset link.");
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-8">
        <h1 className="h-display text-3xl">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">We'll email you a link to set a new password.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1.5" type="email" placeholder="you@example.com"
                   value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          {msg && <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{msg}</p>}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Remembered it? <Link href="/login" className="text-mocha-700 underline-offset-4 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
