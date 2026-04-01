import { Building2, Network, Users } from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { createClient } from "@/lib/supabase/server";

export default async function EstudiosPage() {
  const supabase = await createClient();

  const [{ count: institucionesCount }, { count: conexionesCount }, { count: personasCount }] = await Promise.all([
    supabase.from("dim_instituciones").select("*", { count: "exact", head: true }),
    supabase.from("rel_conexiones").select("*", { count: "exact", head: true }),
    supabase.from("dim_personas").select("*", { count: "exact", head: true })
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-navy">Estudios y Redes</h1>
        <p className="max-w-3xl text-base text-stone-600">
          Base para cartografías institucionales, relaciones orgánicas y análisis de nodos.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          label="Instituciones"
          value={institucionesCount ?? 0}
          description="Organizaciones mapeadas en la dimensión institucional."
          icon={<Building2 className="h-5 w-5" />}
        />
        <DashboardStatCard
          label="Conexiones"
          value={conexionesCount ?? 0}
          description="Relaciones registradas en la tabla rel_conexiones."
          icon={<Network className="h-5 w-5" />}
          accent="amber"
        />
        <DashboardStatCard
          label="Personas"
          value={personasCount ?? 0}
          description="Nodos personales disponibles para cruces y clusters."
          icon={<Users className="h-5 w-5" />}
          accent="forest"
        />
      </section>
    </div>
  );
}
