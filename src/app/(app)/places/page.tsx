import type { Metadata } from "next";

import { PlacesExplorer } from "@/components/places/places-explorer";
import { getServerDictionary } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/primitives";
import { DESTINATIONS } from "@/lib/destinations";
import { mapboxToken } from "@/lib/env";

export const metadata: Metadata = { title: "Places" };

export default async function PlacesPage() {
  const { t } = await getServerDictionary();
  const cities = DESTINATIONS.map((destination) => ({
    id: destination.id,
    city: destination.city,
    country: destination.country,
    lat: destination.lat,
    lng: destination.lng,
  }));

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.places.eyebrow}
        title={t.pages.places.title}
        description={t.pages.places.description}
      />

      <div className="mt-6">
        <PlacesExplorer token={mapboxToken} cities={cities} />
      </div>
    </div>
  );
}
