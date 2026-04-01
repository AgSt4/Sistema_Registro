import { redirect } from "next/navigation";
import { EmailPasswordForm } from "@/components/email-password-form";
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
          El acceso esta restringido a usuarios autorizados con credenciales internas y permisos por area.
        </p>
        <div className="mt-8 rounded-[28px] border border-brand-ink/10 bg-brand-sand/60 p-6">
          {auth.isConfigured ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-brand-ink/75">
                La autenticacion esta habilitada. Ingresa con tu correo y contrasena para continuar.
              </p>
              <EmailPasswordForm />
            </div>
          ) : (
            <p className="text-sm leading-6 text-brand-ink/75">
              Faltan variables de Supabase en el proyecto. Configuralas en Vercel antes de habilitar el acceso.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
