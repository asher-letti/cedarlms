"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Supabase's recovery link delivers the user a session via URL hash.
    // The supabase-js client picks it up automatically on load.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setReady(true);
      else setErr("This reset link is invalid or has expired. Please request a new one.");
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-8">
        <h1 className="h-display text-3xl">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted">Set a strong password — at least 8 characters.</p>

        {!ready ? (
          <p className="mt-6 text-sm text-red-700">{err ?? "Verifying link…"}</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">New password</label>
              <input className="input mt-1.5" type="password" minLength={8}
                     value={password} onChange={(e)=>setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="input mt-1.5" type="password" minLength={8}
                     value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
            </div>
            {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
