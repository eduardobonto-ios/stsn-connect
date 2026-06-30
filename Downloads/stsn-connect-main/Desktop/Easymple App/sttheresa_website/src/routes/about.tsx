import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, Flame, Mountain, ShieldCheck, Eye, Target } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { CORE_VALUES, PHOTOS } from "@/lib/site-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About STSN | St. Theresa's School of Novaliches" },
      { name: "description", content: "Established in 1989, St. Theresa's School of Novaliches has grown into a full Catholic basic-education institution committed to faith, excellence, and Filipino values." },
      { property: "og:title", content: "About St. Theresa's School of Novaliches" },
      { property: "og:description", content: "Our history, mission, vision, and core values." },
    ],
  }),
  component: About,
});

const VALUE_ICONS = { HeartHandshake, Flame, Mountain, ShieldCheck } as const;

const HISTORY = [
  "The St. Theresa's School of Novaliches was established in 1989 as a modest response to the needs of the times. It started as a pre-school with only one classroom each for the Nursery, Kinder I and Kinder II levels. It gained government recognition for official pre-school operation on July 30, 1991.",
  "With an initial workforce of three teachers and three administrative personnel looking after the welfare of about thirty students, it steadily grew to be a full-pledged elementary school with a well-staffed administration, faculty and non-teaching personnel as well. The government officially recognized it as such on April 6, 1993.",
  "As the school has been consistent in providing its resident students with continuity in the pursuit of quality education within the community, it also opened its doors and accepted students in the secondary level of education. Government recognition for this level was granted in June 16, 1997.",
  "Since then, St. Theresa's School of Novaliches has grown in magnitude and in its quest for excellence for academics and other fields of endeavor but has remained faithful to the task of molding individuals in the Christian faith who are proud of their national heritage, are responsive and productive members of the family and society and are worthy and deserving of their special place in the Theresian community which includes parents, guardians, teachers and families.",
  "The St. Theresa's School of Novaliches commits itself to the integral formation of its students as it provides and nurtures a Christian environment where each individual discovers himself in various settings, explores his talents, masters his strengths, overcomes his weaknesses, gets to know his land and his people, responds to the needs of the times and learns to emulate, in thoughts, words and deeds, the virtues of humility and fortitude which St. Teresa De Avila exemplified as a true child of God.",
];

function About() {
  return (
    <>
      <PageHero eyebrow="Who We Are" title="About STSN" subtitle="A Christian, Filipino institution forming learners since 1989." />

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
          <Reveal>
            <div className="overflow-hidden rounded-3xl shadow-elegant lg:sticky lg:top-28">
              <img src={PHOTOS.welcome} alt="St. Theresa's School of Novaliches campus" className="aspect-[3/4] w-full object-cover" loading="lazy" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <SectionHeading align="left" eyebrow="Our Heritage" title="The Theresian Story" />
              <div className="mt-6 space-y-4 text-muted-foreground">
                {HISTORY.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="mt-8 space-y-4 rounded-2xl border bg-muted/40 p-6">
                <p className="text-sm italic text-muted-foreground">As a Christian school, the STSN upholds the Church's philosophy of education expressed in the Declaration on Christian Education of Vatican II: "…a true education aims at the formation of the human person in pursuit of his ultimate end and the good of the societies of which he is a member."</p>
                <p className="text-sm italic text-muted-foreground">As a Filipino school, the STSN upholds the educational provisions of the Philippine Constitution: "…all educational institutions shall aim to inculcate love of country, teach the duties of citizenship, and develop moral character, personal discipline and scientific, technological and vocational efficiency."</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="bg-gradient-brown py-20 text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div className="h-full rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-8 backdrop-blur-sm">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground"><Eye className="size-6" /></span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-gold">Our Vision</h2>
              <p className="mt-3 text-primary-foreground/85">Enrich lives by providing, creatively enhancing, and sustaining quality education in a relevant collaborative global environment.</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-8 backdrop-blur-sm">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground"><Target className="size-6" /></span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-gold">Our Mission</h2>
              <p className="mt-3 text-primary-foreground/85">Develop learners for global citizenship and leadership and the highest fulfillment of human potential through education and character formation.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Core values */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="What we stand for" title="Our Core Values" /></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((v, i) => {
              const Icon = VALUE_ICONS[v.icon as keyof typeof VALUE_ICONS];
              return (
                <Reveal key={v.title} delay={i * 90}>
                  <div className="h-full rounded-2xl border bg-card p-7 text-center shadow-soft">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-brown text-primary-foreground"><Icon className="size-6" /></span>
                    <h3 className="mt-5 font-display text-xl font-semibold text-gradient-gold">{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
