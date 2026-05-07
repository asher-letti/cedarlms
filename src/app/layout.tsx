import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/supabase/auth";
import SignOutButton from "@/components/SignOutButton";
import { PHProvider } from "./providers/PostHogProvider";
import PostHogPageView from "./components/PostHogPageView";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: "Cedar — Learn beautifully",
  description: "A warm, modern learning platform.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSession();

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
        <header className="sticky top-0 z-30 glass">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 py-3.5">
            <Link
              href="/"
              className="font-display text-2xl text-mocha-900 tracking-tight transition-opacity duration-200 hover:opacity-80"
            >
              Cedar
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/courses" className="nav-link">Browse</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="nav-link">Dashboard</Link>
                  <div className="ml-2 hidden items-center gap-2 rounded-full border border-line/80 bg-white/70 backdrop-blur-md pl-2 pr-1 py-1 shadow-[0_1px_2px_rgba(42,27,15,0.04)] sm:flex">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-mocha-100 to-mocha-200 text-mocha-800 text-xs font-semibold ring-1 ring-mocha-200/60">
                      {(profile?.full_name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </span>
                    <span className="hidden md:inline text-xs text-muted capitalize">{profile?.role ?? "user"}</span>
                    <SignOutButton />
                  </div>
                  <div className="sm:hidden"><SignOutButton /></div>
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-link">Log in</Link>
                  <Link href="/signup" className="btn-primary">Get started</Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">{children}</main>

        <footer className="bg-neutral-900 text-neutral-400">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 py-12 sm:py-16">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div>
                <Link href="/" className="font-display text-2xl text-white tracking-tight">Cedar</Link>
                <p className="mt-3 text-sm leading-relaxed">A calmer way for schools and instructors to teach online.</p>
              </div>

              {/* Product */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Product</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="/courses" className="transition-colors duration-200 hover:text-white">Browse courses</Link></li>
                  <li><Link href="/signup" className="transition-colors duration-200 hover:text-white">Sign up</Link></li>
                  <li><Link href="/login" className="transition-colors duration-200 hover:text-white">Log in</Link></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Company</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="#" className="transition-colors duration-200 hover:text-white">About</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Legal</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="#" className="transition-colors duration-200 hover:text-white">Privacy policy</Link></li>
                  <li><Link href="#" className="transition-colors duration-200 hover:text-white">Terms</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-6 text-xs">
              <p>© {new Date().getFullYear()} Cedar Learning</p>
              <p className="font-display italic text-neutral-500">Crafted with care.</p>
            </div>
          </div>
        </footer>
        </PHProvider>
      </body>
    </html>
  );
}
