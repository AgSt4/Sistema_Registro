import Link from "next/link";
import type { Route } from "next";
import { Building2, Database, Download, GitMerge, LayoutDashboard, Route as RouteIcon, Shield } from "lucide-react";
import { SignOutButton } from "@/components/auth-button";
import { requireUser } from "@/lib/guards";

const nav = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/people", label: "Personas", icon: Building2 },
  { href: "/formation", label: "Formación", icon: RouteIcon },
  { href: "/activities", label: "Actividades", icon: Database },
  { href: "/imports", label: "Cargas y Excel", icon: Download },
  { href: "/dedupe", label: "Deduplicación", icon: GitMerge },
  { href: "/settings", label: "Gobernanza", icon: Shield }
] satisfies Array<{ href: Route; label: string; icon: React.ComponentType<{ className?: string }> }>;

export async function SecureShell({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  const auth = await requireUser();

  return (
    <div className="grain min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-8 px-5 py-8 lg:px-8">
        <aside className="hidden w-80 shrink-0 rounded-[34px] border border-brand-ink/10 bg-white/92 p-7 shadow-card backdrop-blur lg:block">
          <div className="mb-10">
            <p className="font-serif text-4xl font-semibold tracking-tight text-brand-ink">IdeaPaís</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-brand-ink/68">
              Sistema interno para seguimiento, coordinación y resguardo del activo de datos.
            </p>
          </div>
          <nav className="space-y-3">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-medium text-brand-ink transition hover:bg-brand-sand"
                >
                  <Icon className="h-4 w-4 text-brand-wine" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-10 rounded-[28px] border border-brand-ink/10 bg-brand-sand/60 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-wine">Sesión</p>
            <p className="mt-2 break-all text-sm leading-6 text-brand-ink/80">{auth.user.email}</p>
            <div className="mt-5">
              <SignOutButton />
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-[38px] border border-brand-ink/10 bg-white/92 p-6 shadow-card backdrop-blur lg:p-10">
          <header className="mb-10 flex flex-col gap-6 border-b border-brand-ink/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-brand-wine">{eyebrow}</p>
              <h1 className="mt-3 max-w-5xl font-serif text-4xl font-semibold leading-tight tracking-tight text-brand-ink lg:text-6xl">
                {title}
              </h1>
            </div>
            <div className="rounded-full border border-brand-ink/10 bg-brand-sand px-5 py-3 text-sm font-medium text-brand-ink/80">
              Operación interna
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
