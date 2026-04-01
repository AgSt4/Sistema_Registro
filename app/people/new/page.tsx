import { SecureShell as AppShell } from "@/components/secure-shell";
import { SectionCard } from "@/components/cards";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function NewPersonPage() {
  // Esta función "Server Action" se ejecuta de forma segura en el servidor
  async function createPerson(formData: FormData) {
    "use server";
    const supabase = await createClient();

    if (!supabase) {
      throw new Error("No se pudo inicializar la conexión con Supabase.");
    }

    // 1. Recolectamos lo que el usuario escribió en el formulario
    const rawData = {
      full_name: formData.get("full_name") as string,
      rut: (formData.get("rut") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      area: formData.get("area") as string,
      funnel_stage: "CAPTACION", // Todos entran por defecto en esta etapa
    };

    // 2. Lo insertamos en la base de datos
    const { error } = await supabase.from("people").insert(rawData);

    if (error) {
      // Si hay error (ej. email duplicado), lo mostramos en la consola del servidor
      console.error("Error guardando persona:", error.message);
      throw new Error("No se pudo guardar la persona. Revisa la consola.");
    }

    // 3. Si sale bien, lo devolvemos a la tabla principal
    redirect("/people");
  }

  return (
    <AppShell eyebrow="CRM" title="Ingreso Operativo">
      <div className="mb-4">
        <Link href="/people" className="text-sm text-brand-ink/60 hover:text-brand-ink underline">
          ← Volver al directorio
        </Link>
      </div>

      <SectionCard title="Nueva Persona" description="Ingresa los datos básicos. El sistema normalizará el RUT y el correo automáticamente gracias a las reglas de la base de datos.">
        {/* El formulario ejecuta la función createPerson al hacer submit */}
        <form action={createPerson} className="flex flex-col gap-5 max-w-xl mt-4">
          
          <div>
            <label className="block text-sm font-medium text-brand-ink/80 mb-1">Nombre Completo *</label>
            <input required type="text" name="full_name" placeholder="Ej: Catalina Rojas" 
                   className="block w-full rounded-md border border-brand-ink/20 px-3 py-2 text-sm focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-ink/80 mb-1">RUT</label>
              <input type="text" name="rut" placeholder="Ej: 19876543-2" 
                     className="block w-full rounded-md border border-brand-ink/20 px-3 py-2 text-sm focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-ink/80 mb-1">Teléfono</label>
              <input type="text" name="phone" placeholder="Ej: +56912345678" 
                     className="block w-full rounded-md border border-brand-ink/20 px-3 py-2 text-sm focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink/80 mb-1">Correo Electrónico</label>
            <input type="email" name="email" placeholder="catalina@ejemplo.com" 
                   className="block w-full rounded-md border border-brand-ink/20 px-3 py-2 text-sm focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink" />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink/80 mb-1">Área de Captación *</label>
            <select required name="area" 
                    className="block w-full rounded-md border border-brand-ink/20 px-3 py-2 text-sm focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-brand-ink bg-white">
              <option value="FORMACION">Formación</option>
              <option value="COMUNICACIONES">Comunicaciones</option>
              <option value="DESARROLLO">Desarrollo</option>
              <option value="ESTUDIOS">Estudios</option>
              <option value="INTERNACIONAL">Internacional</option>
              <option value="EDITORIAL">Editorial</option>
            </select>
          </div>

          <div className="pt-4 border-t border-brand-ink/10 mt-2">
            <button type="submit" 
                    className="bg-brand-ink text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-black transition-colors w-full sm:w-auto">
              Guardar en base de datos
            </button>
          </div>
          
        </form>
      </SectionCard>
    </AppShell>
  );
}