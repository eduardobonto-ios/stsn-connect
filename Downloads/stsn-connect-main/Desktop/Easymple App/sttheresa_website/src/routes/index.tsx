import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake, Flame, Mountain, ShieldCheck, ArrowRight, GraduationCap, Megaphone, CalendarDays } from "lucide-react";
import heroImg from "@/assets/hero-stsn.jpg";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/PageHero";
import {
  ANNOUNCEMENTS,
  EVENTS,
  PROGRAMS,
  CORE_VALUES,
  SCHOOL_EVENTS,
  PHOTOS,
  SITE,
} from "@/lib/site-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "St. Theresa's School of Novaliches | Shaping Future Leaders" },
      { name: "description", content: "Quality Catholic education from Preschool to Senior High. Excellence in Education, Values Formation, and Faith. Enroll now for SY 2026–2027." },
      { property: "og:title", content: "St. Theresa's School of Novaliches" },
      { property: "og:description", content: "Shaping Future Leaders — Excellence in Education, Values Formation, and Faith." },
    ],
  }),
  component: Home,
});

const VALUE_ICONS = { HeartHandshake, Flame, Mountain, ShieldCheck } as const;

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden">
        <img src={heroImg} alt="Theresian students celebrating" className="absolute inset-0 -z-10 size-full object-cover animate-slow-zoom" width={1920} height={1080} />
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center text-primary-foreground sm:px-6 lg:px-8">
          <Reveal>
            <span className="inline-block rounded-full border border-gold/50 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-gold backdrop-blur-sm">
              Est. 1989 · Novaliches, Quezon City
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              Shaping Future Leaders
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/85">{SITE.tagline}</p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/enroll">Enroll Now <ArrowRight /></Link>
              </Button>
              <Button asChild variant="outlineLight" size="xl">
                <Link to="/about">Discover STSN</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Announcements + Events */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div className="h-full rounded-2xl border bg-card p-8 shadow-soft">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-brown text-primary-foreground"><Megaphone className="size-5" /></span>
                <div>
                  <h2 className="font-display text-2xl font-semibold">Announcements</h2>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Latest Updates</p>
                </div>
              </div>
              <ul className="mt-5 divide-y">
                {ANNOUNCEMENTS.map((a) => (
                  <li key={a.title} className="py-4">
                    <h3 className="font-semibold text-gold-foreground"><span className="text-gradient-gold">{a.title}</span></h3>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-2xl border bg-card p-8 shadow-soft">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-gold text-gold-foreground"><CalendarDays className="size-5" /></span>
                <div>
                  <h2 className="font-display text-2xl font-semibold">Upcoming Events</h2>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">School Activities</p>
                </div>
              </div>
              <ul className="mt-5 space-y-4">
                {EVENTS.map((e) => (
                  <li key={e.title} className="flex items-center gap-4">
                    <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-gradient-brown py-2 text-primary-foreground">
                      <span className="text-[11px] font-semibold uppercase">{e.mon}</span>
                      <span className="font-display text-xl font-bold leading-none">{e.day}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{e.title}</h3>
                      <p className="text-sm text-muted-foreground">{e.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Welcome */}
      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div className="overflow-hidden rounded-3xl shadow-elegant">
              <img src={PHOTOS.welcome} alt="St. Theresa's School of Novaliches" className="aspect-[4/3] w-full object-cover" loading="lazy" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Welcome Theresian!</span>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">A community where dreams turn into reality</h2>
              <div className="mt-5 space-y-4 text-muted-foreground">
                <p>Welcome to St. Theresa's School of Novaliches, home of learners, leaders, and dreams turning into reality. Here, we ensure that every student receives quality education, modern facilities, and a supportive community dedicated to helping them grow.</p>
                <p>At STSN, we don't just teach — we create opportunities. Through every classroom, project, and program, our goal is to develop the skills and confidence students need to succeed in the real world.</p>
                <p className="font-semibold text-foreground">Welcome to St. Theresa's School of Novaliches — Your journey starts here!</p>
              </div>
              <Button asChild variant="brown" className="mt-7">
                <Link to="/about">Read Our Story <ArrowRight /></Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Programs */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Academics" title="Our Programs" subtitle="A complete learning journey from early childhood to senior high school." /></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.title} delay={i * 90}>
                <article className="group h-full overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-elegant">
                  <div className="overflow-hidden">
                    <img src={p.img} alt={p.title} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="font-display text-xl font-semibold text-gradient-gold">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
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

      {/* School events */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Community Life" title="School Events" subtitle="Celebrating faith, talent, and Theresian spirit all year round." /></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SCHOOL_EVENTS.map((e, i) => (
              <Reveal key={e.title} delay={i * 90}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
                  <div className="overflow-hidden">
                    <img src={e.img} alt={e.title} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="flex flex-1 flex-col p-6 text-center">
                    <h3 className="font-display text-lg font-semibold text-gradient-gold">{e.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{e.desc}</p>
                    <Button asChild variant="gold" size="sm" className="mt-4 self-center">
                      <Link to="/gallery">View Gallery</Link>
                    </Button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-brown py-20 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <GraduationCap className="mx-auto size-12 text-gold" />
            <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">Begin your Theresian journey today</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Admissions for School Year 2026–2027 are now open for New Students, Continuing Students, Returnees, and Transferees.</p>
            <Button asChild variant="hero" size="xl" className="mt-8">
              <Link to="/enroll">Start Online Enrollment <ArrowRight /></Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
