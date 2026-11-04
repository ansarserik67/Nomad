"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { Globe2, MapPin, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export type MapMarker = {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  label?: string;
};

export function WorldMap({
  token,
  markers,
  className,
  height = 330,
}: {
  token: string | null;
  markers: MapMarker[];
  className?: string;
  height?: number;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">(
    token ? "loading" : "ready",
  );

  useEffect(() => {
    if (!token || !containerRef.current) return;

    let disposed = false;
    let map: import("mapbox-gl").Map | null = null;

    async function init() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (disposed || !containerRef.current) return;
        mapboxgl.accessToken = token as string;

        const valid = markers.filter(
          (marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng),
        );

        map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: valid[0] ? [valid[0].lng, valid[0].lat] : [10, 26],
          zoom: valid.length > 1 ? 1.45 : valid.length === 1 ? 3.6 : 1.3,
          attributionControl: false,
          projection: "globe",
          logoPosition: "bottom-left",
        });

        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }),
          "bottom-right",
        );

        map.on("load", () => {
          if (!map || disposed) return;
          try {
            map.setFog({
              color: "rgba(8, 13, 24, 0.85)",
              "high-color": "#101a2b",
              "horizon-blend": 0.12,
              "space-color": "#080d18",
              "star-intensity": 0.15,
            });
          } catch {
            // Globe fog is cosmetic; ignore if the style version differs.
          }

          for (const marker of valid) {
            const element = document.createElement("button");
            element.type = "button";
            element.setAttribute("aria-label", `${marker.city}, ${marker.country}`);
            element.style.width = "14px";
            element.style.height = "14px";
            element.style.borderRadius = "999px";
            element.style.border = "2px solid rgba(8,13,24,0.9)";
            element.style.background = "#8b9dff";
            element.style.boxShadow = "0 0 0 5px rgba(139,157,255,0.16)";
            element.style.cursor = "pointer";

            const popupContent = document.createElement("div");
            popupContent.style.padding = "2px 2px 4px";
            const city = document.createElement("p");
            city.textContent = marker.city;
            city.style.margin = "0";
            city.style.fontFamily = "Manrope, sans-serif";
            city.style.fontWeight = "600";
            city.style.fontSize = "13px";
            city.style.color = "#f4f6fc";
            const country = document.createElement("p");
            country.textContent = marker.label ?? marker.country;
            country.style.margin = "2px 0 0";
            country.style.fontSize = "11px";
            country.style.color = "#9ba9c1";
            popupContent.appendChild(city);
            popupContent.appendChild(country);

            const popup = new mapboxgl.Popup({
              offset: 16,
              closeButton: false,
              className: "nomad-map-popup",
            }).setDOMContent(popupContent);

            new mapboxgl.Marker({ element }).setLngLat([marker.lng, marker.lat]).setPopup(popup).addTo(map);
          }

          setState("ready");
        });

        map.on("error", (event) => {
          // Style/tile errors surface here; report a usable state instead of a
          // blank canvas that pretends to be a working map.
          if (event?.error) {
            console.error("Mapbox error", event.error.message);
            if (!map || disposed) return;
            setState("error");
          }
        });
      } catch (error) {
        console.error("Mapbox failed to initialise", error);
        if (!disposed) setState("error");
      }
    }

    void init();

    return () => {
      disposed = true;
      map?.remove();
      map = null;
    };
    // Markers are server-provided and stable for the lifetime of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div
        className={cn(
          "relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[18px] border border-line bg-panel p-5",
          className,
        )}
        style={{ height }}
      >
        <WorldGrid />
        <div className="relative z-10 max-w-[260px]">
          <p className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-2">
            <Globe2 className="size-3.5" /> {t.dashboard.interactiveMap}
          </p>
          <p className="mt-2 font-display text-[17px] font-semibold leading-snug">
            {markers.length > 0
              ? format(
                  markers.length === 1 ? t.dashboard.tripOnMap : t.dashboard.tripsOnMap,
                  { count: markers.length },
                )
              : t.dashboard.mapReady}
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-2">
            {t.dashboard.addMapboxToken}
          </p>
        </div>

        {markers.length > 0 ? (
          <ul className="relative z-10 flex flex-wrap gap-1.5">
            {markers.slice(0, 4).map((marker) => (
              <li
                key={marker.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10.5px] text-muted"
              >
                <MapPin className="size-3 text-accent" />
                {marker.city}
              </li>
            ))}
          </ul>
        ) : (
          <p className="relative z-10 text-[10.5px] text-muted-2">
            {t.dashboard.mapNotConfigured}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[18px]", className)} style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" aria-label={t.dashboard.whereJourneys} />
      {state === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-panel">
          <span className="skeleton size-8 rounded-full" />
        </div>
      ) : null}
      {state === "error" ? (
        <div className="absolute inset-0 grid place-items-center bg-panel/95 p-6 text-center">
          <div>
            <TriangleAlert className="mx-auto size-5 text-warning" />
            <p className="mt-2 text-[12.5px] font-medium text-paper">
              {t.dashboard.mapCouldNotLoad}
            </p>
            <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-muted-2">
              {t.dashboard.mapErrorDescription}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WorldGrid() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full opacity-70"
      viewBox="0 0 600 300"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke="rgba(255,255,255,0.055)" strokeWidth="1">
        {Array.from({ length: 9 }, (_, index) => (
          <path key={index} d={`M0 ${index * 34 + 12} H600`} />
        ))}
        {Array.from({ length: 15 }, (_, index) => (
          <path key={index} d={`M${index * 42 + 6} 0 V300`} />
        ))}
      </g>
      <g fill="rgba(139,157,255,0.55)">
        {[
          [92, 92],
          [130, 110],
          [168, 164],
          [214, 118],
          [250, 96],
          [290, 142],
          [332, 108],
          [366, 180],
          [404, 96],
          [452, 132],
          [492, 172],
          [530, 210],
        ].map(([cx, cy], index) => (
          <circle key={index} cx={cx} cy={cy} r={index % 3 === 0 ? 2.4 : 1.5} />
        ))}
      </g>
      <path
        d="M168 164 Q262 82 404 96"
        stroke="rgba(101,214,206,0.4)"
        strokeWidth="1.2"
        strokeDasharray="4 6"
      />
      <path
        d="M168 164 Q320 206 492 172"
        stroke="rgba(139,157,255,0.35)"
        strokeWidth="1.2"
        strokeDasharray="4 6"
      />
      <circle cx="168" cy="164" r="4" fill="#65d6ce" />
      <circle cx="404" cy="96" r="4" fill="#8b9dff" />
      <circle cx="492" cy="172" r="3" fill="#8b9dff" />
    </svg>
  );
}
