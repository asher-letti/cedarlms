import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-display text-7xl text-mocha-300">404</p>
      <h1 className="h-display mt-2 text-3xl">We couldn't find that page.</h1>
      <p className="mt-3 text-muted">
        It may have been moved, deleted, or the link is wrong.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Back home</Link>
        <Link href="/courses" className="btn-secondary">Browse courses</Link>
      </div>
    </div>
  );
}
