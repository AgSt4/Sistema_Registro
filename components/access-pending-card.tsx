export function AccessPendingCard({
  email
}: {
  email: string;
}) {
  return (
    <section className="w-full max-w-2xl rounded-[32px] border border-brand-ink/10 bg-white/95 p-8 shadow-card lg:p-10">
      <p className="text-sm uppercase tracking-[0.28em] text-brand-wine">Acceso pendiente</p>
      <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-brand-ink">
        Tu cuenta existe, pero todavía no tiene habilitación operativa.
      </h1>
      <p className="mt-4 text-sm leading-7 text-brand-ink/72">
        El sistema requiere que un administrador asigne rol y área antes de mostrar módulos sensibles del negocio.
      </p>
      <div className="mt-8 rounded-[24px] border border-brand-ink/10 bg-brand-sand/60 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-wine">Cuenta detectada</p>
        <p className="mt-2 text-sm leading-6 text-brand-ink/82">{email}</p>
      </div>
    </section>
  );
}
