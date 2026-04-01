import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/cards";
import { AttendanceBoard } from "@/components/attendance-board";
import { getSnapshot } from "@/lib/data";

const statusTone = {
  AL_DIA: "success",
  EN_RIESGO: "warning",
  REQUIERE_CONTACTO: "danger"
} as const;

export default async function FormationPage() {
  const snapshot = await getSnapshot();
  const primaryRoute = snapshot.routes[0];

  return (
    <AppShell eyebrow="Formación" title="Rutas formativas con hitos, seguimiento semestral y operación colaborativa.">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title={primaryRoute.name} description="Lectura tipo kanban: cada columna representa un hito y permite trabajo distribuido entre encargado y subencargados.">
          <div className="grid gap-4 xl:grid-cols-4">
            {primaryRoute.milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-[28px] border border-brand-ink/10 bg-brand-sand/65 p-4">
                <p className="font-semibold text-brand-ink">{milestone.label}</p>
                <p className="mt-1 text-sm text-brand-ink/70">{milestone.description}</p>
                <div className="mt-4 space-y-3">
                  {snapshot.routeBoard.filter((card) => card.currentMilestoneId === milestone.id).map((card) => (
                    <div key={card.personId} className="rounded-3xl bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-brand-ink">{card.personName}</p>
                        <Badge tone={statusTone[card.status]}>{card.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-brand-ink/70">{card.nextAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Lógica de aprobación" description="Ejemplo visual para la carga bonita de asistencias y validación de requisitos.">
          <AttendanceBoard />
        </SectionCard>
      </section>
    </AppShell>
  );
}
