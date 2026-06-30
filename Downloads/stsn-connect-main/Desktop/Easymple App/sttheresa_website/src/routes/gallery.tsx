import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { GALLERY_TABS } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery | St. Theresa's School of Novaliches" },
      { name: "description", content: "Photo highlights from STSN events — Foundation Day, Recognition Day, Sports Festival, Fire Drill, Living Rosary, and Feast Day." },
      { property: "og:title", content: "Gallery — St. Theresa's School of Novaliches" },
      { property: "og:description", content: "Moments and memories from Theresian school life." },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const [active, setActive] = useState(GALLERY_TABS[0].id);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const tab = GALLERY_TABS.find((t) => t.id === active)!;

  return (
    <>
      <PageHero eyebrow="Memories" title="Gallery" subtitle="Capturing the spirit of Theresian life, one event at a time." />

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          {/* Tabs */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-row flex-wrap gap-2 lg:flex-col">
              {GALLERY_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-left text-sm font-medium transition-all",
                    active === t.id
                      ? "bg-gradient-brown text-primary-foreground shadow-soft"
                      : "border bg-card text-foreground hover:border-gold/50 hover:text-gold-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Photos */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-gradient-gold">{tab.label}</h2>
            <div className="mt-6 columns-2 gap-4 sm:columns-3 [&>button]:mb-4">
              {tab.photos.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setLightbox(src)}
                  className="block w-full overflow-hidden rounded-xl border bg-muted shadow-soft transition-transform hover:scale-[1.02]"
                >
                  <img
                    src={src}
                    alt={`${tab.label} photo ${i + 1}`}
                    loading="lazy"
                    className="w-full object-cover"
                    onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <X />
          </button>
          <img src={lightbox} alt="Enlarged" className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-elegant" />
        </div>
      )}
    </>
  );
}
