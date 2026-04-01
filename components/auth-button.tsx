"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function SignInButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback`;

        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "consent"
            }
          }
        });
      }}
      className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
    >
      <LogIn className="h-4 w-4" />
      {loading ? "Redirigiendo..." : "Ingresar con Google"}
    </button>
  );
}

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
      className="inline-flex items-center gap-2 rounded-full border border-brand-ink/15 px-4 py-2 text-sm font-semibold text-brand-ink disabled:opacity-70"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
