"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { resetAnalytics } from "@/lib/analytics";

export default function SignOutButton() {
  const router = useRouter();
  const onClick = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetAnalytics();
    router.push("/");
    router.refresh();
  };
  return (
    <button onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-medium text-mocha-800 hover:bg-cream-100 transition">
      Sign out
    </button>
  );
}
