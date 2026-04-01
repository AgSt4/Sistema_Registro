import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const getAuthState = cache(async () => {
  if (!hasSupabaseEnv()) {
    return {
      isConfigured: false,
      user: null,
      profile: null
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      isConfigured: true,
      user: null,
      profile: null
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isConfigured: true,
      user: null,
      profile: null
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, default_role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isConfigured: true,
    user,
    profile: profile ?? null
  };
});
