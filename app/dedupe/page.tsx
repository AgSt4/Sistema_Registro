import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/cards";
import { getSnapshot } from "@/lib/data";

function confidenceTone(confidence: number) {
  if (confidence >= 0.99) return "success" as const;
  if (confidence >= 0.85) return "warning" as const;
  return "danger" as const;
}

export default async function DedupePage() {
  const snapshot = await getSnapshot();

  return (
    <AppShell
      eyebrow="Calidad de Datos"
      title="Deduplicación permanente con cascada automática y callback humano para los casos ambiguos."
    >
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Regla de identidad"
          description="El sistema compara en cascada RUT, email, teléfono y nombre completo normalizado."
        >
          <div className="space-y-3 text-sm text-brand-ink/75">
            <p>1. Si coincide RUT, el match es canónico.</p>
            <p>2. Si no coincide RUT, se evalúa email normalizado.</p>
            <p>3. Luego se evalúa teléfono normalizado.</p>
            <p>4. Si sólo coincide nombre y apellido, el caso queda para revisión humana.</p>
            <p>5. Todo merge automático debe quedar auditable para corregir errores posteriores.</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Resumen operativo"
          description="Primera bandeja para confirmar o rechazar fusiones antes de contaminar la base."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-brand-sand/70 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-brand-wine">Casos totales</p>
              <p className="mt-2 font-serif text-3xl text-brand-ink">{snapshot.dedupeCases.length}</p>
            </div>
            <div className="rounded-3xl bg-brand-sand/70 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-brand-wine">Pendientes</p>
              <p className="mt-2 font-serif text-3xl text-brand-ink">
                {snapshot.dedupeCases.filter((item) => item.status === "PENDING_REVIEW").length}
              </p>
            </div>
            <div className="rounded-3xl bg-brand-sand/70 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-brand-wine">Auto merge</p>
              <p className="mt-2 font-serif text-3xl text-brand-ink">
                {snapshot.dedupeCases.filter((item) => item.status === "AUTO_MERGED").length}
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      <SectionCard
        className="mt-6"
        title="Bandeja de revisión"
        description="Cada fila representa un posible merge. La idea es que aquí luego confirmemos, rechacemos o deshagamos merges."
      >
        <div className="space-y-4">
          {snapshot.dedupeCases.length === 0 ? (
            <p className="text-sm text-brand-ink/70">No hay casos de deduplicación detectados todavía.</p>
          ) : (
            snapshot.dedupeCases.map((dedupeCase) => (
              <div key={dedupeCase.id} className="rounded-[28px] border border-brand-ink/10 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {dedupeCase.primaryName} <span className="text-brand-ink/50">vs</span> {dedupeCase.candidateName}
                    </p>
                    <p className="mt-1 text-sm text-brand-ink/70">{dedupeCase.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={confidenceTone(dedupeCase.confidence)}>
                      Confianza {Math.round(dedupeCase.confidence * 100)}%
                    </Badge>
                    <Badge tone={dedupeCase.status === "PENDING_REVIEW" ? "warning" : "success"}>
                      {dedupeCase.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {dedupeCase.matchedSignals.map((signal) => (
                    <span key={signal} className="rounded-full bg-brand-fog px-3 py-1 text-xs font-semibold text-brand-ink">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
