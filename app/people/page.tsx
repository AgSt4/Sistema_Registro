import { SecureShell as AppShell } from "@/components/secure-shell";
import { Badge, SectionCard } from "@/components/cards";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PeoplePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <AppShell eyebrow="CRM" title="Directorio central de personas">
        <div className="p-4 text-red-500">Error: No se pudo conectar con la base de datos.</div>
      </AppShell>
    );
  }

  const { data: people, error } = await supabase
    .from("people")
    .select(`
      id,
      full_name,
      email,
      area,
      region_label,
      funnel_stage,
      institution_name,
      profiles ( full_name )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar personas desde Supabase:", error.message);
  }

  const peopleList = people || [];

  return (
    <AppShell eyebrow="CRM" title="Directorio central de personas, instituciones y responsables operativos.">
      <SectionCard title="Personas" description="Base operativa. Los registros visibles dependen de tu área y rol.">
        
        <div className="mb-4 flex justify-end">
          <Link href="/people/new" className="bg-brand-ink text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors">
            + Nueva Persona
          </Link>
        </div>

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
              {peopleList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-brand-ink/60">
                    No hay personas registradas o no tienes permisos para verlas.
                  </td>
                </tr>
              ) : (
                peopleList.map((person) => (
                  <tr key={person.id} className="border-b border-brand-ink/5 hover:bg-black/5 transition-colors">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-brand-ink">{person.full_name}</p>
                      <p className="text-brand-ink/60">{person.email}</p>
                    </td>
                    <td className="px-3 py-4">{person.area}</td>
                    <td className="px-3 py-4">{person.region_label ?? "-"}</td>
                    <td className="px-3 py-4">
                      <Badge tone={person.funnel_stage === "EN_RUTA" ? "success" : "default"}>
                        {person.funnel_stage}
                      </Badge>
                    </td>
                    <td className="px-3 py-4">
                      {/* Le decimos a TypeScript que trate el dato como 'any' para evitar que asuma que es un Array */}
                      {(person.profiles as any)?.full_name ?? "Sin asignar"}
                    </td>
                    <td className="px-3 py-4">{person.institution_name ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}