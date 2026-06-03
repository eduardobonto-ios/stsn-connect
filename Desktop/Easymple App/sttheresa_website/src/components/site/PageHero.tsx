export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-brown text-primary-foreground">
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
        {eyebrow && (
          <span className="inline-block rounded-full border border-gold/40 bg-primary-foreground/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            {eyebrow}
          </span>
        )}
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">{subtitle}</p>
        )}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</span>
      )}
      <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
