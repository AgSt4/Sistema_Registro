"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirmando acceso...");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/login");
      return;
    }

    const supabase = createClient();

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setMessage(`No fue posible completar el ingreso: ${error.message}`);
        return;
      }

      router.replace("/dashboard/personas");
      router.refresh();
    });
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="rounded-3xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-600 shadow-sm">
        {message}
      </div>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-cream px-6">
          <div className="rounded-3xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-600 shadow-sm">
            Confirmando acceso...
          </div>
        </main>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
