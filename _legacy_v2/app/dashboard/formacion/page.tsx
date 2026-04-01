import Link from "next/link";
import { ArrowRight, ClipboardCheck, KanbanSquare } from "lucide-react";

export default function FormacionPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-navy">Área Formación</h1>
        <p className="max-w-3xl text-base text-stone-600">Módulo central para asistencia rápida y avance por rutas.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            href: "/dashboard/formacion/asistencia",
            title: "Toma de Asistencia",
            description: "Checklist rápido con guardado inmediato.",
            icon: ClipboardCheck
          },
          {
            href: "/dashboard/formacion/rutas/demo",
            title: "Rutas Formativas",
            description: "Tablero del funnel para mover personas de etapa.",
            icon: KanbanSquare
          }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-heading text-2xl text-navy">{item.title}</h2>
              <p className="mt-2 text-sm text-stone-600">{item.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy">
                Abrir
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
