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

  const { data: memberships } = await supabase
    .from("area_memberships")
    .select("id, area, role, region_label, can_export")
    .eq("profile_id", user.id);

  return {
    isConfigured: true,
    user,
    profile: profile ?? null,
    memberships: memberships ?? []
  };
});
