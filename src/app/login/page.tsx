"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-8">
        <h1 className="h-display text-3xl">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to keep learning.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1.5" type="email" placeholder="you@example.com"
                   value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input mt-1.5" type="password" placeholder="••••••••"
                   value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </div>
          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          <button disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="text-right text-xs">
            <Link href="/forgot" className="text-mocha-700 hover:underline underline-offset-4">Forgot password?</Link>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New to Cedar? <Link href="/signup" className="text-mocha-700 underline-offset-4 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
