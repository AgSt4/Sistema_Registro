import Link from "next/link";
import type { Route } from "next";
import { Building2, Database, Download, LayoutDashboard, Route as RouteIcon, Shield } from "lucide-react";
import { SignInButton, SignOutButton } from "@/components/auth-button";
import { getAuthState } from "@/lib/auth";

const nav = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/people", label: "Personas", icon: Building2 },
  { href: "/formation", label: "Formación", icon: RouteIcon },
  { href: "/activities", label: "Actividades", icon: Database },
  { href: "/imports", label: "Cargas y Excel", icon: Download },
  { href: "/settings", label: "Gobernanza", icon: Shield }
] satisfies Array<{ href: Route; label: string; icon: React.ComponentType<{ className?: string }> }>;

export async function AppShell({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  const auth = await getAuthState();

  return (
    <div className="grain min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-brand-ink/10 bg-white/80 p-6 shadow-card backdrop-blur lg:block">
          <div className="mb-8">
            <p className="font-serif text-3xl font-semibold tracking-tight text-brand-ink">IdeaPaís</p>
            <p className="mt-2 text-sm text-brand-ink/70">
              ERP + CRM operativo para formación, desarrollo y continuidad institucional.
            </p>
          </div>
          <nav className="space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-brand-ink transition hover:bg-brand-sand"
                >
                  <Icon className="h-4 w-4 text-brand-wine" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-3xl bg-brand-ink p-5 text-sm text-brand-sand">
            <p className="font-semibold">Modo listo para Vercel + Supabase</p>
            <p className="mt-2 text-brand-sand/80">
              Si faltan variables de entorno, la app usa datos demo para no frenar diseño ni validación.
            </p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-[32px] border border-brand-ink/10 bg-white/85 p-5 shadow-card backdrop-blur lg:p-8">
          <header className="mb-8 flex flex-col gap-4 border-b border-brand-ink/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-wine">{eyebrow}</p>
              <h1 className="mt-2 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-brand-ink">
                {title}
              </h1>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="rounded-2xl border border-brand-gold/40 bg-brand-sand px-4 py-3 text-sm text-brand-ink/80">
                {auth.isConfigured
                  ? auth.user
                    ? `Sesión activa: ${auth.user.email}`
                    : "Supabase conectado: falta iniciar sesión con Google."
                  : "Modo demo: faltan variables de Supabase."}
              </div>
              <div className="flex flex-wrap gap-3">
                {auth.isConfigured ? (
                  auth.user ? (
                    <SignOutButton />
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-full border border-brand-ink/15 px-4 py-2 text-sm font-semibold text-brand-ink"
                      >
                        Ir al login
                      </Link>
                      <SignInButton />
                    </>
                  )
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-ink/15 px-4 py-2 text-sm font-semibold text-brand-ink"
                  >
                    Ver configuración
                  </Link>
                )}
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
