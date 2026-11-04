"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  BedDouble,
  Building2,
  Coffee,
  Fuel,
  Hospital,
  Landmark,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { GlassCard } from "@/components/ui/glass-card";
import {
  createSessionToken,
  distanceBetweenMeters,
  fetchCategoryPlaces,
  fetchRoute,
  fetchSuggestions,
  formatDistance,
  formatDuration,
  PLACE_CATEGORIES,
  retrievePlace,
  type LngLat,
  type Place,
  type PlaceFailure,
  type PlaceSuggestion,
  type RouteLine,
} from "@/lib/places";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  shopping_mall: ShoppingBag,
  shopping: Store,
  restaurant: ShoppingCart,
  cafe: Coffee,
  hotel: BedDouble,
  hospital: Hospital,
  pharmacy: Pill,
  gas_station: Fuel,
  tourist_attraction: Landmark,
};

const DEFAULT_CENTER: LngLat = { lng: 76.8897, lat: 43.2389 };

type CityOption = { id: string; city: string; country: string; lat: number; lng: number };

function categoryLabel(id: string | null): string {
  return PLACE_CATEGORIES.find((category) => category.id === id)?.label ?? "Places";
}

export function PlacesExplorer({
  token,
  cities,
}: {
  token: string | null;
  cities: CityOption[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const markersRef = useRef<import("mapbox-gl").Marker[]>([]);
  const sessionRef = useRef<string>(createSessionToken());
  const controllerRef = useRef<AbortController | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [center, setCenter] = useState<LngLat>(DEFAULT_CENTER);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [error, setError] = useState<PlaceFailure | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [route, setRoute] = useState<RouteLine | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  /* ---------------------------------- map --------------------------------- */

  useEffect(() => {
    if (!token || !containerRef.current) return;

    let disposed = false;
    let map: import("mapbox-gl").Map | null = null;

    async function init() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (disposed || !containerRef.current) return;

        mapboxgl.accessToken = token as string;

        map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
          zoom: 12,
          attributionControl: false,
          logoPosition: "bottom-left",
        });

        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: false }),
          "bottom-right",
        );

        map.on("load", () => {
          if (disposed) return;
          setMapReady(true);
        });

        map.on("error", () => {
          if (!disposed) setMapFailed(true);
        });

        map.on("moveend", () => {
          if (!map || disposed) return;
          const current = map.getCenter();
          setCenter({ lng: current.lng, lat: current.lat });
        });

        mapRef.current = map;
      } catch {
        if (!disposed) setMapFailed(true);
      }
    }

    void init();

    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [token]);

  /* -------------------------------- markers ------------------------------- */

  useEffect(() => {
    if (!mapReady) return;

    let cancelled = false;

    async function draw() {
      const map = mapRef.current;
      if (!map) return;

      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      for (const place of places) {
        const isSelected = selected?.id === place.id;
        const element = document.createElement("button");
        element.type = "button";
        element.setAttribute("aria-label", place.name);
        element.className = cn(
          "grid size-8 place-items-center rounded-full border transition-transform hover:scale-110",
          isSelected
            ? "border-teal bg-teal text-[#062321] shadow-[0_0_0_6px_rgba(101,214,206,0.18)]"
            : "border-white/60 bg-[#0b1424] text-teal shadow-[0_6px_18px_-6px_rgba(0,0,0,0.8)]",
        );
        element.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

        const marker = new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat([place.lng, place.lat])
          .addTo(map);

        element.addEventListener("click", () => {
          setSelected(place);
          setRoute(null);
          setRouteError(null);
        });

        markersRef.current.push(marker);
      }

      if (places.length === 1) {
        map.flyTo({ center: [places[0].lng, places[0].lat], zoom: 15, essential: true });
      } else if (places.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        places.forEach((place) => bounds.extend([place.lng, place.lat]));
        map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 700 });
      }
    }

    void draw();

    return () => {
      cancelled = true;
    };
  }, [places, selected, mapReady]);

  /* --------------------------------- route -------------------------------- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const source = map.getSource("nomad-route") as import("mapbox-gl").GeoJSONSource | undefined;

    if (!route) {
      if (map.getLayer("nomad-route-line")) map.removeLayer("nomad-route-line");
      if (source) map.removeSource("nomad-route");
      return;
    }

    const data = {
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates: route.coordinates },
      properties: {},
    };

    if (source) {
      source.setData(data);
    } else {
      map.addSource("nomad-route", { type: "geojson", data });
      map.addLayer({
        id: "nomad-route-line",
        type: "line",
        source: "nomad-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#65d6ce",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    }

    let minLng = route.coordinates[0][0];
    let maxLng = route.coordinates[0][0];
    let minLat = route.coordinates[0][1];
    let maxLat = route.coordinates[0][1];

    for (const [lng, lat] of route.coordinates) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    try {
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, duration: 700 },
      );
    } catch {
      // Bounds can be degenerate for a zero-length route.
    }
  }, [route, mapReady]);

  /* -------------------------------- actions ------------------------------- */

  const runCategory = useCallback(
    async (category: string) => {
      if (!token) return;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setActiveCategory(category);
      setQuery("");
      setSuggestions([]);
      setSelected(null);
      setRoute(null);
      setRouteError(null);
      setError(null);
      setNotice(null);
      setLoadingPlaces(true);

      const result = await fetchCategoryPlaces({
        category,
        token,
        center,
        language: "en",
        limit: 12,
        signal: controller.signal,
      }).catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return null;
        throw caught;
      });

      if (!result) return;
      setLoadingPlaces(false);

      if (!result.ok) {
        setError(result.error);
        setPlaces([]);
        return;
      }

      setPlaces(result.data);
      if (result.data.length === 0) {
        setNotice(`No ${categoryLabel(category).toLowerCase()} found near the map centre.`);
      }
    },
    [center, token],
  );

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!token || trimmed.length < 2) {
      setNotice("Type at least two characters, or pick a category.");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setSuggesting(true);
    setError(null);
    setNotice(null);
    setActiveCategory(null);
    setRoute(null);

    const result = await fetchSuggestions({
      query: trimmed,
      token,
      center,
      sessionToken: sessionRef.current,
      language: "en",
      signal: controller.signal,
    }).catch((caught) => {
      if (caught instanceof DOMException && caught.name === "AbortError") return null;
      throw caught;
    });

    if (!result) return;
    setSuggesting(false);

    if (!result.ok) {
      setError(result.error);
      setSuggestions([]);
      return;
    }

    setSuggestions(result.data);
    if (result.data.length === 0) {
      setNotice(`Nothing on Mapbox matches “${trimmed}”.`);
    }
  }

  async function chooseSuggestion(suggestion: PlaceSuggestion) {
    if (!token) return;
    setSuggesting(true);
    setSuggestions([]);
    setError(null);
    setNotice(null);

    const result = await retrievePlace({
      mapboxId: suggestion.id,
      token,
      sessionToken: sessionRef.current,
      center,
      language: "en",
    });

    setSuggesting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSelected(result.data);
    setPlaces([result.data]);
    setQuery(result.data.name);
    setRoute(null);
    setRouteError(null);
    // A retrieve closes the Mapbox search session; the next search starts a new one.
    sessionRef.current = createSessionToken();
  }

  async function showRoute() {
    if (!token || !selected) return;

    // Avoid a degenerate request when the place sits on the map centre.
    const metresAway = distanceBetweenMeters(center, { lng: selected.lng, lat: selected.lat });
    if (metresAway < 50) {
      setRouteError("This place is at the map centre — move the map, then ask for a route.");
      return;
    }

    setRouteLoading(true);
    setRouteError(null);

    const result = await fetchRoute({
      from: center,
      to: { lng: selected.lng, lat: selected.lat },
      token,
    });

    setRouteLoading(false);

    if (!result.ok) {
      setRouteError(result.error.message);
      return;
    }

    setRoute(result.data);
  }

  function jumpToCity(cityId: string) {
    const city = cities.find((entry) => entry.id === cityId);
    const map = mapRef.current;
    if (!city || !map) return;
    map.flyTo({ center: [city.lng, city.lat], zoom: 12.5, essential: true });
    setCenter({ lng: city.lng, lat: city.lat });
    setPlaces([]);
    setSelected(null);
    setSuggestions([]);
    setRoute(null);
    setNotice(null);
  }

  function resetAll() {
    setQuery("");
    setSuggestions([]);
    setPlaces([]);
    setSelected(null);
    setRoute(null);
    setRouteError(null);
    setActiveCategory(null);
    setError(null);
    setNotice(null);
  }

  const selectedDistance = useMemo(
    () => (selected ? formatDistance(selected.distanceMeters) : null),
    [selected],
  );

  if (!token) {
    return (
      <GlassCard tone="subtle">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <p className="text-[13.5px] font-medium text-paper">Mapbox is not connected</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              Add <code className="text-paper">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to
              <code className="ml-1 text-paper">.env.local</code> and restart the dev server.
              Place search stays disabled until a token with search access is present.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Map + search */}
      <GlassCard padded={false} className="overflow-hidden">
        <div className="space-y-3 border-b border-line p-4">
          <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Input
                aria-label="Search places"
                placeholder="Search a place by name — MEGA, Sairan, Abay Avenue…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                leadingIcon={<Search className="size-4" />}
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={suggesting} className="shrink-0">
              {suggesting ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Search near city"
              defaultValue=""
              onChange={(event) => {
                jumpToCity(event.target.value);
                event.currentTarget.value = "";
              }}
              className="glass-field h-9 cursor-pointer rounded-full px-3 text-[12.5px] text-muted outline-none"
            >
              <option value="" disabled>
                Search near…
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.city}, {city.country}
                </option>
              ))}
            </select>
            <span className="text-[11.5px] text-muted-2">
              or move the map — searches use the centre
            </span>
            {places.length > 0 || selected ? (
              <button
                type="button"
                onClick={resetAll}
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11.5px] text-muted hover:text-paper"
              >
                <X className="size-3" />
                Clear
              </button>
            ) : null}
          </div>

          {suggestions.length > 0 ? (
            <ul className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-[#0a1220]">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => void chooseSuggestion(suggestion)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <MapPin className="size-3.5 shrink-0 text-accent" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-paper">
                        {suggestion.name}
                      </span>
                      {suggestion.placeFormatted ? (
                        <span className="block truncate text-[11.5px] text-muted-2">
                          {suggestion.placeFormatted}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="relative">
          <div ref={containerRef} className="h-[380px] w-full sm:h-[460px] lg:h-[560px]" />
          {!mapReady ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#080d18]/60 text-[12.5px] text-muted">
              {mapFailed ? "The map could not load. Check the Mapbox token." : "Loading map…"}
            </div>
          ) : null}
          <p className="pointer-events-none absolute bottom-1 right-16 text-[10px] text-white/35">
            © Mapbox © OpenStreetMap
          </p>
        </div>
      </GlassCard>

      {/* Filters, results, card */}
      <div className="space-y-3">
        <GlassCard tone="subtle" padded={false} className="p-3">
          <p className="label-eyebrow mb-2">Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {PLACE_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id] ?? Building2;
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => void runCategory(category.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] transition-colors",
                    active
                      ? "border-teal/40 bg-teal/15 text-paper"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-paper",
                  )}
                >
                  <Icon className="size-3.5" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {error ? (
          <GlassCard tone="subtle" className="border-danger/25 bg-danger/[0.06]">
            <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-danger">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {error.message}
                {error.hint ? <span className="mt-1 block text-danger/80">{error.hint}</span> : null}
              </span>
            </p>
          </GlassCard>
        ) : null}

        {notice ? (
          <GlassCard tone="subtle">
            <p className="text-[12.5px] leading-relaxed text-muted">{notice}</p>
          </GlassCard>
        ) : null}

        {selected ? (
          <GlassCard className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-[16px] font-semibold leading-snug text-paper">
                  {selected.name}
                </p>
                {selected.address ? (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{selected.address}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setRoute(null);
                  setRouteError(null);
                }}
                aria-label="Close place card"
                className="rounded-full border border-line p-1 text-muted hover:text-paper"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selected.categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
                >
                  {category}
                </span>
              ))}
              {selected.rating !== null ? (
                <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                  ★ {selected.rating.toFixed(1)}
                </span>
              ) : null}
              {selectedDistance ? (
                <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                  {selectedDistance} from centre
                </span>
              ) : null}
            </div>

            {selected.phone || selected.website ? (
              <div className="space-y-1 text-[12px] text-muted">
                {selected.phone ? (
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center gap-1.5 hover:text-paper"
                  >
                    <Phone className="size-3" />
                    {selected.phone}
                  </a>
                ) : null}
                {selected.website ? (
                  <a
                    href={selected.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1.5 truncate hover:text-paper"
                  >
                    <Navigation className="size-3" />
                    {selected.website.replace(/^https?:\/\//, "").slice(0, 42)}
                  </a>
                ) : null}
              </div>
            ) : null}

            {selected.hours.length > 0 ? (
              <details className="rounded-[12px] border border-line bg-surface-1 px-3 py-2">
                <summary className="cursor-pointer text-[12px] text-muted">Opening hours</summary>
                <ul className="mt-2 space-y-0.5 text-[11.5px] text-muted-2">
                  {selected.hours.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </details>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={route ? "secondary" : "teal"}
                onClick={() => {
                  if (route) {
                    setRoute(null);
                    setRouteError(null);
                    return;
                  }
                  void showRoute();
                }}
                loading={routeLoading}
              >
                <Navigation className="size-3.5" />
                {route ? "Hide route" : "Route from map centre"}
              </Button>
              <a
                href={`https://www.mapbox.com/directions/?origin=${center.lng},${center.lat}&destination=${selected.lng},${selected.lat}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3.5 text-[13px] text-paper hover:bg-surface-3"
              >
                Open in Mapbox
              </a>
            </div>

            {route ? (
              <p className="rounded-[12px] border border-teal/25 bg-teal/10 px-3 py-2 text-[12px] text-paper">
                {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)} by
                car from the map centre
              </p>
            ) : null}
            {routeError ? <p className="text-[12px] text-danger">{routeError}</p> : null}
          </GlassCard>
        ) : null}

        {places.length > 0 && !selected ? (
          <GlassCard tone="subtle" padded={false} className="overflow-hidden">
            <p className="label-eyebrow px-3 pt-3">
              {categoryLabel(activeCategory)} · {places.length} found
            </p>
            <ul className="mt-1 max-h-[360px] divide-y divide-line overflow-y-auto">
              {places.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(place);
                      setRoute(null);
                      setRouteError(null);
                    }}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-teal" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-paper">{place.name}</span>
                      <span className="block truncate text-[11.5px] text-muted-2">
                        {place.address ?? "Address not provided"}
                        {place.distanceMeters !== null
                          ? ` · ${formatDistance(place.distanceMeters)}`
                          : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>
        ) : null}

        {loadingPlaces ? (
          <GlassCard tone="subtle">
            <p className="flex items-center gap-2 text-[12.5px] text-muted">
              <Loader2 className="size-3.5 animate-spin" />
              Searching {categoryLabel(activeCategory).toLowerCase()} near the map centre…
            </p>
          </GlassCard>
        ) : null}
      </div>
    </div>
  );
}
