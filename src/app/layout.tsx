import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/supabase/auth";
import SignOutButton from "@/components/SignOutButton";

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
        <header className="sticky top-0 z-30 glass">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 py-3.5">
            <Link href="/" className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]">
              <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-mocha-500 via-mocha-700 to-mocha-900 text-cream-50 font-display text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_-2px_rgba(42,27,15,0.35)] ring-1 ring-mocha-900/10">
                C
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </span>
              <span className="font-display text-xl text-mocha-900 tracking-tight">Cedar</span>
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <Link href="/courses" className="px-3 py-2 rounded-full text-mocha-800 hover:bg-cream-100/80 transition-colors duration-200">Browse</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="px-3 py-2 rounded-full text-mocha-800 hover:bg-cream-100/80 transition-colors duration-200">Dashboard</Link>
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
                  <Link href="/login" className="px-3 py-2 rounded-full text-mocha-800 hover:bg-cream-100/80 transition-colors duration-200">Log in</Link>
                  <Link href="/signup" className="btn-primary ml-2">Get started</Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">{children}</main>

        <footer className="border-t border-line/70 bg-cream-50/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-muted">
            <p>© {new Date().getFullYear()} Cedar Learning</p>
            <p className="font-display italic text-mocha-700">Crafted with care.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
