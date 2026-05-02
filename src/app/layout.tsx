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
        <header className="sticky top-0 z-30 backdrop-blur-md bg-cream-50/80 border-b border-line/70">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-mocha-600 to-mocha-800 text-cream-50 font-display text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(42,27,15,0.25)]">
                C
              </span>
              <span className="font-display text-xl text-mocha-900 tracking-tight">Cedar</span>
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <Link href="/courses" className="px-3 py-2 rounded-full text-mocha-800 hover:bg-cream-100 transition">Browse</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="px-3 py-2 rounded-full text-mocha-800 hover:bg-cream-100 transition">Dashboard</Link>
                  <div className="ml-2 hidden items-center gap-2 rounded-full border border-line bg-white pl-2 pr-1 py-1 sm:flex">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-mocha-100 text-mocha-800 text-xs font-semibold">
                      {(profile?.full_name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </span>
                    <span className="hidden md:inline text-xs text-muted capitalize">{profile?.role ?? "user"}</span>
                    <SignOutButton />
                  </div>
                  <div className="sm:hidden"><SignOutButton /></div>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-3 py-2 rounded-full text-mocha-800 hover:bg-cream-100 transition">Log in</Link>
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
