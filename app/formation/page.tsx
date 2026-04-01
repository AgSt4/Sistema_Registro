import { SecureShell as AppShell } from "@/components/secure-shell";
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
      <section className="grid gap-8 xl:grid-cols-[1.35fr_0.9fr]">
        <SectionCard
          className="p-7 lg:p-8"
          title={primaryRoute?.name ?? "Sin rutas cargadas"}
          description="Cada columna representa una etapa operativa. La lectura debe permitir ubicar personas, alertas y siguiente acción sin saturar la pantalla."
        >
          {primaryRoute ? (
            <div className="grid gap-5 xl:grid-cols-4">
              {primaryRoute.milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-[30px] border border-brand-ink/10 bg-brand-sand/65 p-5">
                <p className="text-lg font-semibold leading-snug text-brand-ink">{milestone.label}</p>
                <p className="mt-2 text-sm leading-6 text-brand-ink/70">{milestone.description}</p>
                <div className="mt-5 space-y-4">
                  {snapshot.routeBoard.filter((card) => card.currentMilestoneId === milestone.id).map((card) => (
                    <div key={card.personId} className="rounded-[24px] bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3">
                        <p className="text-base font-semibold text-brand-ink">{card.personName}</p>
                        <Badge tone={statusTone[card.status]}>{card.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-brand-ink/70">{card.nextAction}</p>
                    </div>
                  ))}
                </div>
              </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-brand-ink/70">
              Cuando conectes las rutas formativas en Supabase, aquí aparecerá el tablero por hitos.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Lógica de aprobación" description="Ejemplo visual para la carga bonita de asistencias y validación de requisitos.">
          <AttendanceBoard />
        </SectionCard>
      </section>
    </AppShell>
  );
}
