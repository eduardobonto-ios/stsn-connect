import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock, Send, Facebook, Instagram, Youtube } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SITE } from "@/lib/site-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | St. Theresa's School of Novaliches" },
      { name: "description", content: "Reach St. Theresa's School of Novaliches — email, phone, address in Novaliches, Quezon City, office hours, and social media." },
      { property: "og:title", content: "Contact — St. Theresa's School of Novaliches" },
      { property: "og:description", content: "Get in touch with the STSN community." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sending, setSending] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    }, 700);
  };

  return (
    <>
      <PageHero eyebrow="We'd love to hear from you" title="Contact Us" subtitle="Questions about admission, programs, or visits? Get in touch." />

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <Reveal>
            <div className="h-full rounded-2xl border bg-card p-7 shadow-soft">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-brown text-primary-foreground"><Phone className="size-5" /></span>
              <h3 className="mt-4 font-display text-lg font-semibold">Contact Information</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3"><Mail className="size-4 shrink-0 text-gold" /> {SITE.email}</li>
                <li className="flex gap-3"><Phone className="size-4 shrink-0 text-gold" /> {SITE.phone}</li>
                <li className="flex gap-3"><MapPin className="size-4 shrink-0 text-gold" /> {SITE.address}</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full rounded-2xl border bg-card p-7 shadow-soft">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-gold text-gold-foreground"><Clock className="size-5" /></span>
              <h3 className="mt-4 font-display text-lg font-semibold">Office Hours</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {SITE.hours.map((h) => (
                  <li key={h.label}><span className="block font-medium text-foreground">{h.label}</span>{h.value}</li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="h-full rounded-2xl border bg-card p-7 shadow-soft">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-brown text-primary-foreground"><Send className="size-5" /></span>
              <h3 className="mt-4 font-display text-lg font-semibold">Get in Touch</h3>
              <p className="mt-4 text-sm text-muted-foreground">Follow us on our social media:</p>
              <div className="mt-4 flex gap-3">
                <a href={SITE.social.facebook} aria-label="Facebook" className="grid size-10 place-items-center rounded-full bg-muted transition-colors hover:bg-gold hover:text-gold-foreground"><Facebook className="size-4" /></a>
                <a href={SITE.social.instagram} aria-label="Instagram" className="grid size-10 place-items-center rounded-full bg-muted transition-colors hover:bg-gold hover:text-gold-foreground"><Instagram className="size-4" /></a>
                <a href={SITE.social.youtube} aria-label="YouTube" className="grid size-10 place-items-center rounded-full bg-muted transition-colors hover:bg-gold hover:text-gold-foreground"><Youtube className="size-4" /></a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border bg-card p-8 shadow-soft">
              <SectionHeading align="left" eyebrow="Send a message" title="Get in Touch" />
              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" required maxLength={100} placeholder="Juan Dela Cruz" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required maxLength={255} placeholder="you@email.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" required maxLength={150} placeholder="Inquiry about admission" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required maxLength={1000} rows={5} placeholder="How can we help you?" />
                </div>
                <Button type="submit" variant="brown" size="lg" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"} <Send />
                </Button>
              </form>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-2xl border shadow-soft">
              <iframe
                title="STSN Location Map"
                src="https://www.google.com/maps?q=St.+Theresa's+School+of+Novaliches+Kaligayahan+Quezon+City&output=embed"
                className="h-full min-h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
