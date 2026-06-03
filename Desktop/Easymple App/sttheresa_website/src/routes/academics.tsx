import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { PROGRAMS } from "@/lib/site-data";

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title: "Academics | St. Theresa's School of Novaliches" },
      { name: "description", content: "Explore STSN's academic programs from Preschool to Senior High, designed for excellence, discipline, and character formation." },
      { property: "og:title", content: "Academics — St. Theresa's School of Novaliches" },
      { property: "og:description", content: "Preschool, Elementary, Junior High, and Senior High programs." },
    ],
  }),
  component: Academics,
});

const DETAILS = [
  "Faith-integrated curriculum aligned with the DepEd K–12 framework.",
  "Values formation rooted in humility, fortitude, perseverance, and integrity.",
  "Dedicated, licensed faculty and a supportive learning community.",
  "Holistic activities: academics, sports, arts, and Christian living.",
];

function Academics() {
  return (
    <>
      <PageHero eyebrow="Learning Pathways" title="Academics" subtitle="A continuous journey of excellence from early years to senior high." />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Levels Offered" title="Our Programs" /></Reveal>
          <div className="mt-12 grid gap-8">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <article className={`grid items-center gap-8 overflow-hidden rounded-3xl border bg-card shadow-soft md:grid-cols-2 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}>
                  <div className="overflow-hidden">
                    <img src={p.img} alt={p.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-8">
                    <h3 className="font-display text-2xl font-semibold text-gradient-gold">{p.title}</h3>
                    <p className="mt-3 text-muted-foreground">{p.desc}</p>
                    <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                      {DETAILS.slice(0, 3).map((d) => (
                        <li key={d} className="flex gap-2"><span className="text-gold">◆</span> {d}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="The STSN Difference" title="Why families choose STSN" /></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {DETAILS.map((d, i) => (
              <Reveal key={d} delay={i * 80}>
                <div className="flex gap-3 rounded-2xl border bg-card p-6 shadow-soft">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-gold font-display font-bold text-gold-foreground">{i + 1}</span>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
