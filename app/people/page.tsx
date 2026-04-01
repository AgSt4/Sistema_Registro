import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/cards";
import { getSnapshot } from "@/lib/data";

export default async function PeoplePage() {
  const snapshot = await getSnapshot();

  return (
    <AppShell eyebrow="CRM" title="Directorio central de personas, instituciones y responsables operativos.">
      <SectionCard title="Personas" description="Cada fila puede quedar asignada a un área, responsable, ruta y etapa del funnel.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-brand-ink/65">
              <tr className="border-b border-brand-ink/10">
                <th className="px-3 py-3">Nombre</th>
                <th className="px-3 py-3">Área</th>
                <th className="px-3 py-3">Región</th>
                <th className="px-3 py-3">Etapa</th>
                <th className="px-3 py-3">Responsable</th>
                <th className="px-3 py-3">Institución</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.people.map((person) => (
                <tr key={person.id} className="border-b border-brand-ink/5">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-brand-ink">{person.fullName}</p>
                    <p className="text-brand-ink/60">{person.email}</p>
                  </td>
                  <td className="px-3 py-4">{person.area}</td>
                  <td className="px-3 py-4">{person.region}</td>
                  <td className="px-3 py-4">
                    <Badge tone={person.funnelStage === "EN_RUTA" ? "success" : "default"}>{person.funnelStage}</Badge>
                  </td>
                  <td className="px-3 py-4">{person.assignedTo}</td>
                  <td className="px-3 py-4">{person.institution ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
