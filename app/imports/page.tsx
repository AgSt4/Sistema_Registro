import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/cards";
import { ExportButtons } from "@/components/export-buttons";
import { getSnapshot } from "@/lib/data";

export default async function ImportsPage() {
  const snapshot = await getSnapshot();

  return (
    <AppShell eyebrow="Excel y Cargas" title="Cargas masivas seguras para que la operación no dependa de copiar y pegar sin estructura.">
      <SectionCard title="Centro de exportación" description="Desde aquí se pueden bajar datasets operativos o plantillas limpias para volver a subir información.">
        <ExportButtons snapshot={snapshot} />
      </SectionCard>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="Comunicaciones" description="Segmentación y preparación para HubSpot.">
          <p className="text-sm text-brand-ink/75">Se exportan personas por área, etapa, institución, región o tags, evitando manipulación manual de columnas sensibles.</p>
        </SectionCard>
        <SectionCard title="Desarrollo" description="Cargas simples de donaciones y directorio.">
          <p className="text-sm text-brand-ink/75">El sistema puede validar transacciones, estados y responsables antes de consolidar los datos.</p>
        </SectionCard>
        <SectionCard title="Formación" description="Asistencias con estructura controlada.">
          <p className="text-sm text-brand-ink/75">Una plantilla por actividad permite cargar sesiones, umbrales y aprobación especial sin romper rutas ni hitos.</p>
        </SectionCard>
      </section>
    </AppShell>
  );
}
