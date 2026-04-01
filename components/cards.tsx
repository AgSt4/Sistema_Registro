import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-brand-ink/10 bg-white p-5 shadow-card">
      <p className="text-sm uppercase tracking-[0.22em] text-brand-wine">{label}</p>
      <p className="mt-3 font-serif text-4xl font-semibold text-brand-ink">{value}</p>
      <p className="mt-3 text-sm text-brand-ink/70">{detail}</p>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[28px] border border-brand-ink/10 bg-white p-5 shadow-card", className)}>
      <div className="mb-4">
        <h2 className="font-serif text-2xl font-semibold text-brand-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-brand-ink/70">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "default"
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "bg-brand-fog text-brand-ink",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800"
  };

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
