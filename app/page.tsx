import { SecureShell as AppShell } from "@/components/secure-shell";
import { Badge, MetricCard, SectionCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <AppShell eyebrow="Centro Operativo" title="Error de conexión">
        <div className="p-4 text-red-500">Error: No se pudo conectar con la base de datos.</div>
      </AppShell>
    );
  }

  // 1. Cálculos reales desde la base de datos [cite: 17]
  const { count: countPeople } = await supabase.from("people").select("*", { count: "exact", head: true });
  const { count: countEnRuta } = await supabase.from("people").select("*", { count: "exact", head: true }).eq("funnel_stage", "EN_RUTA");
  const { count: countAttendance } = await supabase.from("attendance_records").select("*", { count: "exact", head: true });
  
  const { data: donationsData } = await supabase.from("donations").select("amount");
  const totalDonations = donationsData?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

  const metrics = [
    { label: "PERSONAS ACTIVAS", value: String(countPeople || 0), detail: "Registros totales en base." },
    { label: "JÓVENES EN RUTA", value: String(countEnRuta || 0), detail: "Etapa formativa activa." },
    { label: "ASISTENCIAS", value: String(countAttendance || 0), detail: "Registros consolidados." },
    { label: "DONACIONES VIGENTES", value: formatCurrency(totalDonations), detail: "Suma total registrada." },
  ];

  const { data: recentPeople } = await supabase
    .from("people")
    .select(`
      id,
      full_name,
      area,
      region_label,
      funnel_stage,
      profiles ( full_name )
    `)
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: recentDonations } = await supabase
    .from("donations")
    .select("id, donor_name, campaign, amount, status")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <AppShell eyebrow="Centro Operativo" title="Una sola capa de operación para personas, formación, donaciones y activación institucional.">
      
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Lectura ejecutiva" description="Activo de datos común para todas las áreas operativas.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-brand-ink p-5 text-brand-sand">
              <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">Formación</p>
              <p className="mt-3 font-serif text-3xl">Directorio Activo</p>
              <p className="mt-3 text-sm text-brand-sand/80">Base lista para seguimiento de hitos y rutas formativas.</p>
            </div>
            <div className="rounded-3xl border border-brand-ink/10 bg-brand-sand p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-brand-wine">Desarrollo y comunicaciones</p>
              <p className="mt-3 text-lg font-semibold text-brand-ink">Consolidación</p>
              <p className="mt-3 text-sm text-brand-ink/75">Exportaciones limpias para segmentación y fidelización.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pipeline de activación" description="Últimos registros detectados en el sistema.">
          <div className="space-y-3">
            {!recentPeople || recentPeople.length === 0 ? (
              <p className="text-sm text-brand-ink/60 p-4">Sin personas registradas.</p>
            ) : (
              recentPeople.map((person) => (
                <div key={person.id} className="rounded-3xl border border-brand-ink/10 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-ink">{person.full_name}</p>
                      <p className="text-sm text-brand-ink/65">
                        {person.area} · {(person.profiles as { full_name?: string } | null)?.full_name ?? "Sin asignar"}
                      </p>
                    </div>
                    <Badge tone={person.funnel_stage === "EN_RUTA" ? "success" : "default"}>{person.funnel_stage}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Donaciones y activación" description="Últimos aportes registrados.">
          <div className="space-y-3">
            {!recentDonations || recentDonations.length === 0 ? (
              <p className="text-sm text-brand-ink/60 p-4">Sin donaciones.</p>
            ) : (
              recentDonations.map((donation) => (
                <div key={donation.id} className="rounded-3xl border border-brand-ink/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-ink">{donation.donor_name}</p>
                      <p className="text-sm text-brand-ink/65">{donation.campaign || "General"}</p>
                    </div>
                    <p className="font-serif text-2xl text-brand-ink">{formatCurrency(Number(donation.amount))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Gobernanza" description="Estado de los módulos operativos.">
          <div className="grid gap-3 md:grid-cols-2">
            {["Personas", "Ingreso Manual", "Políticas RLS", "Base Transaccional"].map((item) => (
              <div key={item} className="rounded-3xl border border-brand-ink/10 bg-brand-sand/65 p-4 text-sm font-medium text-brand-ink">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}