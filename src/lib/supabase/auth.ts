import { cache } from "react";
import { createClient } from "./server";

// React cache memoizes within a single request — avoids duplicate
// auth + profile round-trips when the layout AND a page both need them.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile };
});
