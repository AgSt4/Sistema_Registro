import { SecureShell as AppShell } from "@/components/secure-shell";
import { Badge, SectionCard } from "@/components/cards";
import { getSnapshot } from "@/lib/data";

export default async function ActivitiesPage() {
  const snapshot = await getSnapshot();

  return (
    <AppShell eyebrow="Actividades" title="Calendario operativo para formación, seminarios, internacional y seguimiento de asistencia.">
      <div className="grid gap-4 lg:grid-cols-3">
        {snapshot.activities.map((activity) => (
          <SectionCard key={activity.id} title={activity.title} description={`${activity.area} · ${activity.dateLabel} · ${activity.modality}`}>
            <div className="space-y-3 text-sm text-brand-ink/75">
              <p>Sesiones: {activity.sessions}</p>
              <p>Umbral de aprobación: {activity.approvalThreshold}</p>
              <p>Asistentes registrados: {activity.attendees}</p>
              <div>
                <Badge tone={activity.specialApproval ? "warning" : "success"}>
                  {activity.specialApproval ? "Requiere validación especial" : "Aprobación por asistencia"}
                </Badge>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}
