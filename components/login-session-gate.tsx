"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function LoginSessionGate() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function bootstrap() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
        router.refresh();
      }
    }

    bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
