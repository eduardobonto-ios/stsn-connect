import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock } from "lucide-react";
import crest from "@/assets/stsn-crest.png";
import { NAV, SITE } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="bg-gradient-brown text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-primary-foreground/95">
              <img src={crest} alt="STSN crest" className="size-10 object-contain" width={48} height={48} loading="lazy" />
            </span>
            <span className="font-display text-lg font-semibold leading-tight">
              St. Theresa's School<br />of Novaliches
            </span>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/70">{SITE.tagline}</p>
          <div className="mt-5 flex gap-3">
            <a href={SITE.social.facebook} aria-label="Facebook" className="grid size-9 place-items-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-gold hover:text-gold-foreground">
              <Facebook className="size-4" />
            </a>
            <a href={SITE.social.instagram} aria-label="Instagram" className="grid size-9 place-items-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-gold hover:text-gold-foreground">
              <Instagram className="size-4" />
            </a>
            <a href={SITE.social.youtube} aria-label="YouTube" className="grid size-9 place-items-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-gold hover:text-gold-foreground">
              <Youtube className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Contact Information</h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-3"><Mail className="size-4 shrink-0 text-gold" /> {SITE.email}</li>
            <li className="flex gap-3"><Phone className="size-4 shrink-0 text-gold" /> {SITE.phone}</li>
            <li className="flex gap-3"><MapPin className="size-4 shrink-0 text-gold" /> {SITE.address}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Office Hours</h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            {SITE.hours.map((h) => (
              <li key={h.label} className="flex items-start gap-3">
                <Clock className="size-4 shrink-0 text-gold" />
                <span><span className="block font-medium text-primary-foreground">{h.label}</span>{h.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Quick Links</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-primary-foreground/80 transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/enroll" className="text-primary-foreground/80 transition-colors hover:text-gold">
                Online Enrollment
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 py-5 text-center text-sm text-primary-foreground/70">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
