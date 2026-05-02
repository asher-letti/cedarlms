"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"learner" | "instructor">("learner");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (fullName.trim().length < 2) return setErr("Please enter your full name.");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } },
    });
    setLoading(false);
    if (error) return setErr(error.message);
    if (!data.session) {
      setMsg("Check your email to confirm your account.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-8">
        <h1 className="h-display text-3xl">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Start learning — or start teaching.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input mt-1.5" placeholder="Ada Lovelace"
                   value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input mt-1.5" type="email" placeholder="you@example.com"
                   value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input mt-1.5" type="password" placeholder="At least 8 characters"
                   value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} />
          </div>

          <div>
            <label className="label">I'm joining to…</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["learner","instructor"] as const).map((r) => (
                <button key={r} type="button" onClick={()=>setRole(r)}
                  className={`rounded-xl border px-4 py-3 text-sm text-left transition ${
                    role === r
                      ? "border-mocha-400 bg-mocha-50 text-mocha-900"
                      : "border-line bg-white text-muted hover:border-mocha-200"
                  }`}>
                  <div className="font-medium capitalize text-mocha-900">{r === "learner" ? "Learn" : "Teach"}</div>
                  <div className="text-xs">{r === "learner" ? "Take courses & track progress" : "Publish courses & reach students"}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Your role is set at signup and can only be changed by an admin afterward.</p>
          </div>

          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          {msg && <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{msg}</p>}

          <button disabled={loading} className="btn-primary w-full">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Have an account? <Link href="/login" className="text-mocha-700 underline-offset-4 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
