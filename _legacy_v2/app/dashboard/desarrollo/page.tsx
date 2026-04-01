import { HeartHandshake, MessageSquareMore, Wallet } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { createClient } from "@/lib/supabase/server";

export default async function DesarrolloPage() {
  const supabase = await createClient();

  const [{ count: donantesCount }, { count: interaccionesCount }, { count: tareasCount }] = await Promise.all([
    supabase.from("dim_personas").select("*", { count: "exact", head: true }).eq("es_donante", true),
    supabase.from("fact_interacciones").select("*", { count: "exact", head: true }),
    supabase.from("tareas").select("*", { count: "exact", head: true }).eq("estado", "Pendiente")
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-navy">Desarrollo y Comunicaciones</h1>
        <p className="max-w-3xl text-base text-stone-600">
          Vista operativa para segmentación, vínculos y pipeline de activación institucional.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          label="Donantes"
          value={donantesCount ?? 0}
          description="Personas con atributo de donación activo."
          icon={<Wallet className="h-5 w-5" />}
          accent="forest"
        />
        <DashboardStatCard
          label="Interacciones"
          value={interaccionesCount ?? 0}
          description="Registro histórico de reuniones, correos, llamadas y entrevistas."
          icon={<MessageSquareMore className="h-5 w-5" />}
        />
        <DashboardStatCard
          label="Tareas pendientes"
          value={tareasCount ?? 0}
          description="Seguimientos abiertos sobre personas y equipos."
          icon={<HeartHandshake className="h-5 w-5" />}
          accent="amber"
        />
      </section>
    </div>
  );
}
