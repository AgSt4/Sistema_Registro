import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/cards";
import { SignInButton } from "@/components/auth-button";
import { LoginSessionGate } from "@/components/login-session-gate";
import { getAuthState } from "@/lib/auth";

export default async function LoginPage() {
  const auth = (await getAuthState()) as
    | { isConfigured: boolean; user: { email?: string | null }; profile: unknown }
    | { isConfigured: boolean; user: null; profile: unknown };

  if (auth.user) {
    redirect("/");
  }

  return (
    <main className="grain flex min-h-screen items-center justify-center px-6 py-12">
      <LoginSessionGate />
      <section className="w-full max-w-xl rounded-[36px] border border-brand-ink/10 bg-white/92 p-8 shadow-card lg:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-brand-wine">Acceso</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-brand-ink lg:text-5xl">
          Ingreso seguro al sistema interno.
        </h1>
        <p className="mt-4 text-sm leading-7 text-brand-ink/72">
          El acceso está restringido a usuarios autorizados mediante Google Workspace y permisos por área.
        </p>
        <div className="mt-8 rounded-[28px] border border-brand-ink/10 bg-brand-sand/60 p-6">
          {auth.isConfigured ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-brand-ink/75">
                La autenticación está habilitada. Ingresa con tu cuenta institucional para continuar.
              </p>
              <SignInButton />
            </div>
          ) : (
            <p className="text-sm leading-6 text-brand-ink/75">
              Faltan variables de Supabase en el proyecto. Configúralas en Vercel antes de habilitar el acceso.
            </p>
          )}
        </div>
      </section>
    </main>
  );

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
              Estado de sesión: <strong>{auth.user ? `conectado como ${auth.user?.email ?? ""}` : "sin sesión"}</strong>
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

