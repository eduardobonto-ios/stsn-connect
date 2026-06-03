import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, CheckCircle2, UserPlus, RefreshCw, Repeat, ArrowLeftRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/enroll")({
  head: () => ({
    meta: [
      { title: "Online Enrollment | St. Theresa's School of Novaliches" },
      { name: "description", content: "Enroll online at St. Theresa's School of Novaliches for SY 2026–2027. Open for New Students, Continuing Students, Returnees, and Transferees." },
      { property: "og:title", content: "Online Enrollment — St. Theresa's School of Novaliches" },
      { property: "og:description", content: "Secure your slot for School Year 2026–2027." },
    ],
  }),
  component: Enroll,
});

const STATUSES = [
  { id: "Continuing Student", icon: RefreshCw },
  { id: "New Student", icon: UserPlus },
  { id: "Returnee", icon: Repeat },
  { id: "Transferee", icon: ArrowLeftRight },
];

const LEVELS = [
  "Nursery", "Kinder I", "Kinder II",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  "Grade 11", "Grade 12",
];

function Field({ id, label, children, required }: { id: string; label: string; children?: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

function Enroll() {
  const [status, setStatus] = useState("New Student");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Enrollment form submitted successfully!");
    }, 800);
  };

  if (submitted) {
    return (
      <>
        <PageHero eyebrow="Thank you!" title="Application Received" />
        <section className="py-24">
          <div className="mx-auto max-w-xl px-4 text-center">
            <CheckCircle2 className="mx-auto size-16 text-gold" />
            <h2 className="mt-6 font-display text-2xl font-semibold">We've received your enrollment</h2>
            <p className="mt-3 text-muted-foreground">Our admissions office will contact you within 3–5 working days regarding the next steps, assessment schedule, and requirements.</p>
            <Button variant="brown" size="lg" className="mt-8" onClick={() => setSubmitted(false)}>Submit Another Form</Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Admissions Open · SY 2026–2027" title="Online Enrollment" subtitle="Complete the form below to begin your Theresian journey." />

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Student status */}
            <Reveal>
              <fieldset className="rounded-2xl border bg-card p-7 shadow-soft">
                <legend className="flex items-center gap-2 px-2 font-display text-lg font-semibold">
                  <GraduationCap className="size-5 text-gold" /> Student Status
                </legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {STATUSES.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-sm font-medium transition-all",
                        status === s.id
                          ? "border-transparent bg-gradient-brown text-primary-foreground shadow-soft"
                          : "bg-card hover:border-gold/60",
                      )}
                    >
                      <s.icon className="size-5" />
                      {s.id}
                    </button>
                  ))}
                </div>
              </fieldset>
            </Reveal>

            {/* Student info */}
            <Reveal delay={80}>
              <fieldset className="rounded-2xl border bg-card p-7 shadow-soft">
                <legend className="px-2 font-display text-lg font-semibold">Student Information</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field id="lname" label="Last Name" required><Input id="lname" required maxLength={60} /></Field>
                  <Field id="fname" label="First Name" required><Input id="fname" required maxLength={60} /></Field>
                  <Field id="mname" label="Middle Name"><Input id="mname" maxLength={60} /></Field>
                  <Field id="suffix" label="Suffix (Jr., III)"><Input id="suffix" maxLength={10} /></Field>
                  <Field id="dob" label="Date of Birth" required><Input id="dob" type="date" required /></Field>
                  <Field id="pob" label="Place of Birth"><Input id="pob" maxLength={120} /></Field>
                  <Field id="sex" label="Sex" required>
                    <Select required>
                      <SelectTrigger id="sex"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="religion" label="Religion"><Input id="religion" maxLength={60} /></Field>
                  <Field id="lrn" label="Learner Reference No. (LRN)"><Input id="lrn" maxLength={20} inputMode="numeric" /></Field>
                  <Field id="nationality" label="Nationality"><Input id="nationality" maxLength={60} defaultValue="Filipino" /></Field>
                </div>
                <div className="mt-4">
                  <Field id="address" label="Home Address" required><Textarea id="address" required maxLength={250} rows={2} /></Field>
                </div>
              </fieldset>
            </Reveal>

            {/* Academic */}
            <Reveal delay={120}>
              <fieldset className="rounded-2xl border bg-card p-7 shadow-soft">
                <legend className="px-2 font-display text-lg font-semibold">Academic Details</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field id="level" label="Grade/Level Applying For" required>
                    <Select required>
                      <SelectTrigger id="level"><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="sy" label="School Year"><Input id="sy" defaultValue="2026–2027" maxLength={20} /></Field>
                  <Field id="prevschool" label="Previous School"><Input id="prevschool" maxLength={150} /></Field>
                  <Field id="prevschooladdr" label="Previous School Address"><Input id="prevschooladdr" maxLength={150} /></Field>
                </div>
              </fieldset>
            </Reveal>

            {/* Parent / guardian */}
            <Reveal delay={160}>
              <fieldset className="rounded-2xl border bg-card p-7 shadow-soft">
                <legend className="px-2 font-display text-lg font-semibold">Parent / Guardian Information</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field id="father" label="Father's Name"><Input id="father" maxLength={120} /></Field>
                  <Field id="father_occ" label="Father's Occupation"><Input id="father_occ" maxLength={120} /></Field>
                  <Field id="mother" label="Mother's Name"><Input id="mother" maxLength={120} /></Field>
                  <Field id="mother_occ" label="Mother's Occupation"><Input id="mother_occ" maxLength={120} /></Field>
                  <Field id="guardian" label="Guardian (if applicable)"><Input id="guardian" maxLength={120} /></Field>
                  <Field id="relation" label="Relationship to Student"><Input id="relation" maxLength={60} /></Field>
                  <Field id="contact" label="Contact Number" required><Input id="contact" required maxLength={20} inputMode="tel" /></Field>
                  <Field id="pemail" label="Email Address" required><Input id="pemail" type="email" required maxLength={255} /></Field>
                </div>
              </fieldset>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex flex-col items-center gap-3 text-center">
                <Button type="submit" variant="hero" size="xl" disabled={busy} className="w-full sm:w-auto">
                  {busy ? "Submitting..." : "Submit Enrollment"}
                </Button>
                <p className="text-xs text-muted-foreground">By submitting, you agree to be contacted by the STSN Admissions Office regarding your application.</p>
              </div>
            </Reveal>
          </form>
        </div>
      </section>
    </>
  );
}
