import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/cards";
import { SignInButton } from "@/components/auth-button";
import { getAuthState } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getAuthState();

  return (
    <AppShell eyebrow="Acceso" title="Ingreso con Google Workspace para operar con permisos por área y rol.">
      <div className="mx-auto max-w-3xl">
        <SectionCard
          title="Entrar al sistema"
          description="Cuando Supabase está configurado, el login usa Google y la sesión queda disponible en el servidor para SSR y políticas RLS."
        >
          <div className="space-y-4 text-sm text-brand-ink/75">
            <p>
              Estado de configuración:{" "}
              <strong>{auth.isConfigured ? "Supabase detectado" : "faltan variables de entorno"}</strong>
            </p>
            <p>
              Estado de sesión: <strong>{auth.user ? `conectado como ${auth.user.email}` : "sin sesión"}</strong>
            </p>
            {auth.isConfigured ? <SignInButton /> : null}
            {!auth.isConfigured ? (
              <p>
                Completa primero `.env.local` o las variables del proyecto en Vercel. El detalle quedó documentado en{" "}
                <Link href="/settings" className="font-semibold text-brand-wine underline underline-offset-4">
                  Gobernanza
                </Link>
                .
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
