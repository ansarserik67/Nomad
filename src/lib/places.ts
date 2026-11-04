/**
 * Mapbox Search Box API — places search for NOMAD.
 *
 * Everything here is a thin, typed wrapper around real Mapbox endpoints:
 *   GET /search/searchbox/v1/suggest        autocomplete (no coordinates)
 *   GET /search/searchbox/v1/retrieve/{id}  full place record (GeoJSON)
 *   GET /search/searchbox/v1/category/{id}  nearby places of one category
 *   GET /directions/v5/mapbox/driving/...   route line between two points
 *
 * Nothing is invented: every name, address, coordinate and rating comes from
 * Mapbox. An empty response is surfaced as an empty state, never as fake data.
 *
 * The public token is used from the browser, which is how Mapbox Search is
 * designed to be called. No server secret is involved.
 */

export const SEARCHBOX_BASE = "https://api.mapbox.com/search/searchbox/v1";
export const DIRECTIONS_BASE = "https://api.mapbox.com/directions/v5/mapbox";

/**
 * Canonical category IDs, taken from Mapbox's own taxonomy
 * (GET /search/searchbox/v1/list/category) rather than guessed.
 * `shopping` is Mapbox's parent "Shopping" category — the closest real match
 * for a generic "Stores" filter.
 */
export const PLACE_CATEGORIES = [
  { id: "shopping_mall", label: "Shopping malls" },
  { id: "shopping", label: "Stores" },
  { id: "restaurant", label: "Restaurants" },
  { id: "cafe", label: "Cafes" },
  { id: "hotel", label: "Hotels" },
  { id: "hospital", label: "Hospitals" },
  { id: "pharmacy", label: "Pharmacies" },
  { id: "gas_station", label: "Gas stations" },
  { id: "tourist_attraction", label: "Attractions" },
] as const;

export type PlaceCategoryId = (typeof PLACE_CATEGORIES)[number]["id"];

export type LngLat = { lng: number; lat: number };

export type Place = {
  id: string;
  name: string;
  address: string | null;
  categories: string[];
  lng: number;
  lat: number;
  distanceMeters: number | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  hours: string[];
  wheelchairAccessible: boolean | null;
};

export type PlaceSuggestion = {
  id: string;
  name: string;
  placeFormatted: string | null;
  featureType: string | null;
  categories: string[];
};

export type PlaceFailure = {
  status: number;
  message: string;
  hint: string | null;
};

export type PlaceResult<T> = { ok: true; data: T } | { ok: false; error: PlaceFailure };

export type RouteLine = {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
};

/** A session groups up to 50 suggest calls with one retrieve (Mapbox billing unit). */
export function createSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hintForStatus(status: number): string | null {
  if (status === 401) {
    return "Mapbox rejected the token. Check the token value and that it has search access.";
  }
  if (status === 403) {
    return "This token is restricted to other URLs. Allow this domain in Mapbox → Account → Tokens, or use an unrestricted public token.";
  }
  if (status === 422) return "Mapbox could not understand the search query.";
  if (status === 429) return "Too many searches at once. Wait a moment and try again.";
  return null;
}

async function requestJson(url: string, signal?: AbortSignal): Promise<PlaceResult<unknown>> {
  try {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        error: {
          status: response.status,
          message: body?.message || `Mapbox returned HTTP ${response.status}.`,
          hint: hintForStatus(response.status),
        },
      };
    }

    return { ok: true, data: body };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return {
      ok: false,
      error: {
        status: 0,
        message: "The Mapbox request could not be completed.",
        hint: "Check the network connection and try again.",
      },
    };
  }
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

type FeatureProperties = Record<string, unknown>;

function placeFromFeature(
  properties: FeatureProperties,
  geometry: unknown,
  fallbackId: string,
): Place | null {
  const coords = (properties.coordinates ?? {}) as Record<string, unknown>;
  const geo = (geometry ?? {}) as { coordinates?: unknown };
  const ring = Array.isArray(geo.coordinates) ? geo.coordinates : null;

  const lng = asNumber(coords.longitude) ?? (ring ? asNumber(ring[0]) : null);
  const lat = asNumber(coords.latitude) ?? (ring ? asNumber(ring[1]) : null);
  const name = asString(properties.name);

  if (!name || lng === null || lat === null) return null;

  const metadata = (properties.metadata ?? {}) as Record<string, unknown>;
  const openHours = (metadata.open_hours ?? {}) as Record<string, unknown>;
  const weekdayText = Array.isArray(openHours.weekday_text)
    ? openHours.weekday_text.filter((entry): entry is string => typeof entry === "string")
    : [];

  const categories = Array.isArray(properties.poi_category)
    ? properties.poi_category.filter((entry): entry is string => typeof entry === "string")
    : [];

  return {
    id: asString(properties.mapbox_id) ?? fallbackId,
    name,
    address: asString(properties.full_address) ?? asString(properties.place_formatted),
    categories,
    lng,
    lat,
    distanceMeters: asNumber(properties.distance),
    phone: asString(metadata.phone),
    website: asString(metadata.website),
    rating: asNumber(metadata.rating),
    hours: weekdayText,
    wheelchairAccessible:
      typeof metadata.wheelchair_accessible === "boolean"
        ? metadata.wheelchair_accessible
        : null,
  };
}

function proximityParam(center: LngLat | null): string | null {
  return center ? `${center.lng},${center.lat}` : null;
}

/** Autocomplete suggestions. Text only — Mapbox returns no coordinates here. */
export async function fetchSuggestions(options: {
  query: string;
  token: string;
  center: LngLat | null;
  sessionToken: string;
  language: string;
  signal?: AbortSignal;
}): Promise<PlaceResult<PlaceSuggestion[]>> {
  const params = new URLSearchParams({
    q: options.query.slice(0, 256),
    session_token: options.sessionToken,
    language: options.language,
    limit: "8",
    types: "poi",
    access_token: options.token,
  });

  const proximity = proximityParam(options.center);
  if (proximity) params.set("proximity", proximity);

  const result = await requestJson(`${SEARCHBOX_BASE}/suggest?${params}`, options.signal);
  if (!result.ok) return result;

  const suggestions = ((result.data as { suggestions?: unknown[] })?.suggestions ?? [])
    .map((entry): PlaceSuggestion | null => {
      const item = entry as Record<string, unknown>;
      const id = asString(item.mapbox_id);
      const name = asString(item.name);
      if (!id || !name) return null;
      return {
        id,
        name,
        placeFormatted: asString(item.place_formatted),
        featureType: asString(item.feature_type),
        categories: Array.isArray(item.poi_category)
          ? item.poi_category.filter((value): value is string => typeof value === "string")
          : [],
      };
    })
    .filter((entry): entry is PlaceSuggestion => entry !== null);

  return { ok: true, data: suggestions };
}

/** Full record for one suggestion, including coordinates and venue details. */
export async function retrievePlace(options: {
  mapboxId: string;
  token: string;
  sessionToken: string;
  center: LngLat | null;
  language: string;
  signal?: AbortSignal;
}): Promise<PlaceResult<Place>> {
  const params = new URLSearchParams({
    session_token: options.sessionToken,
    language: options.language,
    attribute_sets: "venue,visit",
    access_token: options.token,
  });

  const proximity = proximityParam(options.center);
  if (proximity) params.set("proximity", proximity);

  const result = await requestJson(
    `${SEARCHBOX_BASE}/retrieve/${encodeURIComponent(options.mapboxId)}?${params}`,
    options.signal,
  );
  if (!result.ok) return result;

  const feature = ((result.data as { features?: unknown[] })?.features ?? [])[0] as
    | { properties?: FeatureProperties; geometry?: unknown }
    | undefined;

  const place = feature?.properties
    ? placeFromFeature(feature.properties, feature.geometry, options.mapboxId)
    : null;

  if (!place) {
    return {
      ok: false,
      error: {
        status: 404,
        message: "This place has no location data.",
        hint: "Try another suggestion.",
      },
    };
  }

  return { ok: true, data: place };
}

/** Nearby places of one canonical category, around a centre point. */
export async function fetchCategoryPlaces(options: {
  category: string;
  token: string;
  center: LngLat;
  language: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<PlaceResult<Place[]>> {
  const params = new URLSearchParams({
    language: options.language,
    limit: String(Math.min(Math.max(options.limit ?? 12, 1), 25)),
    proximity: proximityParam(options.center) as string,
    access_token: options.token,
  });

  const result = await requestJson(
    `${SEARCHBOX_BASE}/category/${encodeURIComponent(options.category)}?${params}`,
    options.signal,
  );
  if (!result.ok) return result;

  const places = ((result.data as { features?: unknown[] })?.features ?? [])
    .map((entry) => {
      const feature = entry as { properties?: FeatureProperties; geometry?: unknown };
      return feature.properties
        ? placeFromFeature(feature.properties, feature.geometry, "")
        : null;
    })
    .filter((entry): entry is Place => entry !== null);

  return { ok: true, data: places };
}

/** Driving route between two points, as a GeoJSON-ready coordinate list. */
export async function fetchRoute(options: {
  from: LngLat;
  to: LngLat;
  token: string;
  profile?: "driving" | "walking" | "cycling";
  signal?: AbortSignal;
}): Promise<PlaceResult<RouteLine>> {
  const profile = options.profile ?? "driving";
  const coords = `${options.from.lng},${options.from.lat};${options.to.lng},${options.to.lat}`;
  const params = new URLSearchParams({
    geometries: "geojson",
    overview: "full",
    access_token: options.token,
  });

  const result = await requestJson(
    `${DIRECTIONS_BASE}/${profile}/${coords}?${params}`,
    options.signal,
  );
  if (!result.ok) return result;

  const body = result.data as {
    routes?: { distance?: number; duration?: number; geometry?: { coordinates?: unknown } }[];
    message?: string;
  };

  const route = body.routes?.[0];
  const coordinates = route?.geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return {
      ok: false,
      error: {
        status: 404,
        message: body.message || "No route was found between these points.",
        hint: "Try a different travel point.",
      },
    };
  }

  return {
    ok: true,
    data: {
      coordinates: coordinates as [number, number][],
      distanceMeters: route?.distance ?? 0,
      durationSeconds: route?.duration ?? 0,
    },
  };
}

export function formatDistance(meters: number | null): string | null {
  if (meters === null || !Number.isFinite(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Straight-line distance between two points, in metres. */
export function distanceBetweenMeters(a: LngLat, b: LngLat): number {
  const R = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
