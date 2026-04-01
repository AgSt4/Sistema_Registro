"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookUser, DoorOpen, GraduationCap, LayoutDashboard, LogOut, UserCog } from "lucide-react";

import { AccessPendingCard } from "@/components/access-pending-card";
import { hydrateSessionFromUrl } from "@/lib/supabase/client-auth";
import { createClient } from "@/lib/supabase/client";

type DashboardLayoutProps = {
  children: ReactNode;
};

type ProfileRecord = {
  id: string;
  email: string;
  nombre_completo: string;
  rol: string;
  activo: boolean | null;
  area_id: string | null;
  sede_id: string | null;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function bootstrap() {
      await hydrateSessionFromUrl(supabase).catch(() => false);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("perfiles_usuarios")
        .select("id, email, nombre_completo, rol, activo, area_id, sede_id")
        .or(`id.eq.${user.id},email.eq.${user.email ?? ""}`)
        .limit(1)
        .maybeSingle();

      setProfile((data as ProfileRecord | null) ?? null);
      setLoading(false);
    }

    bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const navigation = useMemo(
    () => [
      { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
      { href: "/dashboard/personas", label: "Directorio", icon: BookUser },
      { href: "/dashboard/formacion", label: "Formación", icon: GraduationCap },
      { href: "/dashboard/usuarios", label: "Usuarios", icon: UserCog }
    ],
    []
  );

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6">
        <div className="rounded-3xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-600 shadow-sm">
          Cargando sesión...
        </div>
      </main>
    );
  }

  if (!profile || !profile.activo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
        <AccessPendingCard email={email} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col bg-navy px-6 py-8 text-stone-100">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-2xl">IdeaPaís</p>
              <p className="text-sm text-stone-300">Backoffice</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="font-semibold text-white">{profile.nombre_completo}</p>
            <p className="text-stone-300">{profile.email}</p>
            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{profile.rol}</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? "bg-white/15 text-white" : "text-stone-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-auto inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-stone-200 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </aside>

        <main className="px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
