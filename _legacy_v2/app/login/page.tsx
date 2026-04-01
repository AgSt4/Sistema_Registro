import { Building2 } from "lucide-react";

import { LoginRedirectGate } from "@/components/login-redirect-gate";
import { LoginButton } from "@/components/login-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <LoginRedirectGate />
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-card">
        <div className="mb-8 flex items-center gap-3 text-navy">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-2xl leading-none">IdeaPaís</p>
            <p className="text-sm text-stone-500">Plataforma interna</p>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-heading text-3xl text-navy">IdeaPaís | Backoffice</h1>
          <p className="text-base text-stone-600">
            Ingresa con tu correo corporativo para acceder al CRM analítico.
          </p>
        </div>

        <div className="mt-8">
          <LoginButton />
        </div>
      </section>
    </main>
  );
}
