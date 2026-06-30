import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileCheck2, UserCheck, CalendarCheck, ArrowRight } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admission")({
  head: () => ({
    meta: [
      { title: "Admission | St. Theresa's School of Novaliches" },
      { name: "description", content: "How to enroll at St. Theresa's School of Novaliches for SY 2026–2027 — requirements, steps, and student categories." },
      { property: "og:title", content: "Admission — St. Theresa's School of Novaliches" },
      { property: "og:description", content: "Requirements and steps for New Students, Continuing Students, Returnees, and Transferees." },
    ],
  }),
  component: Admission,
});

const STEPS = [
  { icon: ClipboardList, title: "Submit Online Form", desc: "Complete the online enrollment form with the student's information." },
  { icon: FileCheck2, title: "Prepare Requirements", desc: "Gather report card, PSA birth certificate, Good Moral, and 2x2 photos." },
  { icon: UserCheck, title: "Assessment & Interview", desc: "Attend the scheduling for assessment and a brief family interview." },
  { icon: CalendarCheck, title: "Payment & Confirmation", desc: "Settle fees to confirm the slot and receive the official enrollment notice." },
];

const REQUIREMENTS = [
  "Latest Report Card (Form 138) / Progress Report",
  "PSA / NSO Birth Certificate (photocopy)",
  "Certificate of Good Moral Character",
  "Two (2) recent 2x2 ID photos",
  "Photocopy of parent/guardian valid ID",
  "Learner Reference Number (LRN), if available",
];

const CATEGORIES = [
  { title: "New Student", desc: "First time to enroll at STSN." },
  { title: "Continuing Student", desc: "Currently enrolled and moving to the next level." },
  { title: "Returnee", desc: "Previously studied at STSN and coming back." },
  { title: "Transferee", desc: "Transferring from another school." },
];

function Admission() {
  return (
    <>
      <PageHero eyebrow="Join the Theresian Family" title="Admission" subtitle="Admissions for School Year 2026–2027 are now open." />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Process" title="How to Enroll" subtitle="Four simple steps to secure your child's slot." /></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                <div className="relative h-full rounded-2xl border bg-card p-7 shadow-soft">
                  <span className="absolute right-5 top-5 font-display text-4xl font-bold text-muted/60">{i + 1}</span>
                  <span className="grid size-12 place-items-center rounded-xl bg-gradient-brown text-primary-foreground"><s.icon className="size-5" /></span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border bg-card p-8 shadow-soft">
              <SectionHeading align="left" eyebrow="Checklist" title="Requirements" />
              <ul className="mt-6 space-y-3">
                {REQUIREMENTS.map((r) => (
                  <li key={r} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <FileCheck2 className="mt-0.5 size-4 shrink-0 text-gold" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-2xl border bg-card p-8 shadow-soft">
              <SectionHeading align="left" eyebrow="Who can apply" title="Student Categories" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <div key={c.title} className="rounded-xl border bg-muted/40 p-4">
                    <h3 className="font-semibold text-gradient-gold">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                  </div>
                ))}
              </div>
              <Button asChild variant="brown" className="mt-7">
                <Link to="/enroll">Start Online Enrollment <ArrowRight /></Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
