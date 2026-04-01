import { SecureShell as AppShell } from "@/components/secure-shell";
import { Badge, SectionCard } from "@/components/cards";
// 1. Importamos el cliente real de Supabase en lugar del 'mock' de datos
import { createClient } from "@/lib/supabase/server";

export default async function PeoplePage() {
  // 2. Iniciamos la conexión segura usando la sesión del usuario actual
  const supabase = createClient();

  // 3. Hacemos la consulta SQL real a tu tabla 'people'.
  // Hacemos un join automático con 'profiles' para traer el nombre del responsable.
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

  // Si la tabla está vacía o hay error, evitamos que la página se rompa
  const peopleList = people || [];

  return (
    <AppShell eyebrow="CRM" title="Directorio central de personas, instituciones y responsables operativos.">
      <SectionCard title="Personas" description="Base operativa. Los registros visibles dependen de tu área y rol.">
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
                      {/* Supabase devuelve el objeto anidado al hacer el join */}
                      {person.profiles?.full_name ?? "Sin asignar"}
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