"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function EmailPasswordForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        window.location.href = "/";
      }}
    >
      <label className="block text-sm text-brand-ink/75">
        Correo
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-brand-ink/15 bg-white px-4 text-brand-ink"
          placeholder="nombre@ideapais.cl"
        />
      </label>

      <label className="block text-sm text-brand-ink/75">
        Contraseña
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-brand-ink/15 bg-white px-4 text-brand-ink"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-4 text-sm font-semibold text-white disabled:opacity-70"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
