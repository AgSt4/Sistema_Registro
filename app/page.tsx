import { AppShell } from "@/components/app-shell";
import { Badge, MetricCard, SectionCard } from "@/components/cards";
import { getSnapshot } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const snapshot = await getSnapshot();

  return (
    <AppShell eyebrow="Centro Operativo" title="Una sola capa de operación para personas, formación, donaciones y activación institucional.">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Lectura ejecutiva" description="Base inicial pensada para que cada área vea sólo su parcela, pero opere sobre un activo de datos común.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-brand-ink p-5 text-brand-sand">
              <p className="text-sm uppercase tracking-[0.2em] text-brand-gold">Formación</p>
              <p className="mt-3 font-serif text-3xl">Kanban de hitos + asistencias aprobatorias</p>
              <p className="mt-3 text-sm text-brand-sand/80">Cada joven puede avanzar por ruta, cumplir hitos y quedar trazado para fidelización, donaciones o vocerías.</p>
            </div>
            <div className="rounded-3xl border border-brand-ink/10 bg-brand-sand p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-brand-wine">Desarrollo y comunicaciones</p>
              <p className="mt-3 text-lg font-semibold text-brand-ink">Excel sigue existiendo, pero ya no manda.</p>
              <p className="mt-3 text-sm text-brand-ink/75">El sistema genera plantillas, valida estructura y permite exportaciones limpias para segmentación y cargas externas.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pipeline de activación" description="Ejemplo de cómo una persona puede moverse desde captación hasta activación institucional.">
          <div className="space-y-3">
            {snapshot.people.slice(0, 4).map((person) => (
              <div key={person.id} className="rounded-3xl border border-brand-ink/10 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-ink">{person.fullName}</p>
                    <p className="text-sm text-brand-ink/65">{person.area} · {person.region} · Responsable: {person.assignedTo}</p>
                  </div>
                  <Badge tone={person.funnelStage === "EN_RUTA" ? "success" : "default"}>{person.funnelStage}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {person.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-brand-fog px-3 py-1 text-xs font-semibold text-brand-ink">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Donaciones y activación" description="Vista resumida del directorio de desarrollo.">
          <div className="space-y-3">
            {snapshot.donations.map((donation) => (
              <div key={donation.id} className="rounded-3xl border border-brand-ink/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-ink">{donation.donor}</p>
                    <p className="text-sm text-brand-ink/65">{donation.campaign}</p>
                  </div>
                  <p className="font-serif text-2xl text-brand-ink">{formatCurrency(donation.amount)}</p>
                </div>
                <div className="mt-3">
                  <Badge tone={donation.status === "PAGADA" ? "success" : donation.status === "COMPROMETIDA" ? "warning" : "danger"}>
                    {donation.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Módulos cubiertos en esta primera versión" description="Priorizados según lo que describiste para que el sistema sea útil desde ya.">
          <div className="grid gap-3 md:grid-cols-2">
            {["Personas y hoja de vida", "Roles por área y responsable", "Rutas formativas y hitos", "Actividades y asistencias", "Donaciones y directorio", "Instituciones y funding", "Plantillas y exportación Excel", "Onboarding productivo en Supabase"].map((item) => (
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
