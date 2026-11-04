import type { Metadata } from "next";
import { BedDouble, Compass, ShieldCheck } from "lucide-react";

import { HotelFinder } from "@/components/booking/hotel-finder";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/primitives";
import { getServerDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Find Hotels" };

const NOTES = [
  {
    icon: Compass,
    title: "Real search, no invented results",
    body: "NOMAD builds a genuine Booking.com search link from your brief. Hotels, prices, ratings and availability are shown by Booking.com — never generated here.",
  },
  {
    icon: ShieldCheck,
    title: "Booking happens on Booking.com",
    body: "You review and pay on Booking.com. NOMAD never asks for card details and never stores them.",
  },
  {
    icon: BedDouble,
    title: "Keep the brief",
    body: "Nights, guests and your per-night budget stay on this page, so you can enter the same stay in the Booking Manager afterwards.",
  },
];

export default async function HotelsPage() {
  const { t } = await getServerDictionary();

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.hotels.eyebrow}
        title={t.pages.hotels.title}
        description={t.pages.hotels.description}
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard>
          <CardHeader
            eyebrow={t.pages.hotels.eyebrow}
            title={t.common.destination}
            description={t.pages.hotels.description}
          />
          <div className="mt-5">
            <HotelFinder />
          </div>
        </GlassCard>

        <div className="space-y-4">
          {NOTES.map((note) => (
            <GlassCard key={note.title} tone="subtle">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-accent">
                  <note.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-paper">{note.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{note.body}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
