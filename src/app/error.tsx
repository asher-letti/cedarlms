"use client";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <span className="chip">Something went wrong</span>
      <h1 className="h-display mt-4 text-4xl">An unexpected error occurred.</h1>
      <p className="mt-3 text-muted">
        {error.message || "Please try again, or head back home."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-secondary">Back home</Link>
      </div>
    </div>
  );
}
