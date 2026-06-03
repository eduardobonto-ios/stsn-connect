import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import crest from "@/assets/stsn-crest.png";
import { NAV, SITE } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-gradient-brown text-primary-foreground transition-shadow",
        scrolled && "shadow-elegant",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-primary-foreground/95 shadow-soft">
            <img src={crest} alt="STSN crest" className="size-10 object-contain" width={48} height={48} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold sm:text-xl">{SITE.short}</span>
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-primary-foreground/70 sm:block">
              School of Novaliches
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary-foreground"
                    : "text-primary-foreground/75 hover:text-primary-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="gold" size="default" className="hidden sm:inline-flex">
            <Link to="/enroll">Enroll Now</Link>
          </Button>
          <button
            className="grid size-10 place-items-center rounded-md text-primary-foreground/90 hover:bg-primary-foreground/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-primary-foreground/10 bg-gradient-brown lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/85 hover:bg-primary-foreground/10"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild variant="gold" className="mt-2">
              <Link to="/enroll">Enroll Now</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
