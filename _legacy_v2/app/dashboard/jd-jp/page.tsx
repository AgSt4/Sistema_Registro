import { AlertTriangle, GitBranch, ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { EmptyStateCard } from "@/components/empty-state-card";
import { canReviewIdentity, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type PendingRawRecord = {
  id: string;
  fuente: string;
  created_at: string | null;
  nombres_ingresados: string | null;
  apellido_1_ingresados: string | null;
  apellido_2_ingresados: string | null;
  email_ingresado: string | null;
  rut_ingresado: string | null;
  dim_persona_id: string | null;
};

export default async function IdentityResolutionPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (!canReviewIdentity(profile.rol)) {
    return (
      <EmptyStateCard
        title="Módulo restringido"
        description="La resolución de identidades está reservada para perfiles administrativos o encargados."
        icon={<ShieldAlert className="h-6 w-6" />}
      />
    );
  }

  const supabase = await createClient();
  const [{ count: pendientesCount }, { count: consolidadasCount }, { data }] = await Promise.all([
    supabase.from("personas_raw").select("*", { head: true, count: "exact" }).eq("procesado", false),
    supabase.from("dim_personas").select("*", { head: true, count: "exact" }),
    supabase
      .from("personas_raw")
      .select(
        "id, fuente, created_at, nombres_ingresados, apellido_1_ingresados, apellido_2_ingresados, email_ingresado, rut_ingresado, dim_persona_id"
      )
      .eq("procesado", false)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const rows = (data ?? []) as PendingRawRecord[];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-navy">Resolución JD-JP</h1>
        <p className="max-w-3xl text-base text-stone-600">
          Cola operativa para revisar identidades agrupadas por la IA y confirmar la consolidación sobre
          <code> dim_personas</code>.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          label="Pendientes"
          value={pendientesCount ?? 0}
          description="Registros crudos sin procesar que requieren criterio administrativo."
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="amber"
        />
        <DashboardStatCard
          label="Golden Records"
          value={consolidadasCount ?? 0}
          description="Base maestra disponible para los módulos analíticos."
          icon={<GitBranch className="h-5 w-5" />}
        />
        <DashboardStatCard
          label="Reversibilidad"
          value="Activa"
          description="La desvinculación puede modelarse como operación administrativa posterior."
          icon={<ShieldAlert className="h-5 w-5" />}
          accent="forest"
        />
      </section>

      {rows.length === 0 ? (
        <EmptyStateCard
          title="No hay pendientes"
          description="No existen filas en personas_raw con procesado = false. La cola de revisión está al día."
          icon={<GitBranch className="h-6 w-6" />}
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.6fr_1fr_1.3fr_1fr_1fr] gap-4 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            <span>Registro</span>
            <span>Fuente</span>
            <span>Email</span>
            <span>RUT</span>
            <span>Vínculo actual</span>
          </div>
          {rows.map((row) => {
            const fullName = [row.nombres_ingresados, row.apellido_1_ingresados, row.apellido_2_ingresados]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={row.id}
                className="grid grid-cols-[1.6fr_1fr_1.3fr_1fr_1fr] gap-4 border-t border-stone-200 px-6 py-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-navy">{fullName || "Sin nombre"}</p>
                  <p className="text-xs text-stone-500">{row.created_at ? new Date(row.created_at).toLocaleString("es-CL") : "Sin fecha"}</p>
                </div>
                <span className="text-stone-700">{row.fuente}</span>
                <span className="truncate text-stone-700">{row.email_ingresado ?? "Sin email"}</span>
                <span className="text-stone-700">{row.rut_ingresado ?? "Sin RUT"}</span>
                <span className="text-stone-700">{row.dim_persona_id ? "Asociado" : "Sin vínculo"}</span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
