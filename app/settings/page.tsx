import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/cards";

const roles = [
  { name: "Administrador", scope: "Observa y modifica todo el sistema, incluyendo parametrización." },
  { name: "Encargado", scope: "Coordina un área, ve su cartera y gestiona personas y datos subordinados." },
  { name: "Subencargado", scope: "Opera subconjuntos dentro de áreas complejas, especialmente formación." },
  { name: "Usuario", scope: "Ve y edita sólo lo que le corresponde por asignación." }
];

export default function SettingsPage() {
  return (
    <AppShell eyebrow="Gobernanza" title="Permisos, auth y criterio de operación para que el sistema escale sin suciedad.">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Roles de acceso" description="Diseñados para que la organización comparta activo de datos sin abrir toda la superficie a todos.">
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.name} className="rounded-3xl border border-brand-ink/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-brand-ink">{role.name}</p>
                  <Badge>{role.name.toUpperCase()}</Badge>
                </div>
                <p className="mt-2 text-sm text-brand-ink/70">{role.scope}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Montaje productivo" description="La app queda preparada para RLS en Supabase y despliegue continuo en Vercel.">
          <div className="space-y-4 text-sm text-brand-ink/75">
            <p>Auth esperado: Google Workspace, con creación de perfil y membresías por área después del login.</p>
            <p>Base de seguridad: RLS por membresía, responsable asignado y excepciones de administrador.</p>
            <p>Modo de crecimiento: primero cargas Excel controladas; después sincronizaciones automáticas con HubSpot o flujos de donaciones.</p>
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
