/**
 * City → IANA timezone lookup for audit booking.
 *
 * Primary: Open-Meteo Geocoding (free, no key) — city search + timezone.
 * Auto-detect: browser Intl + ip-api.com (city/country/lat/lon).
 * Optional: NEXT_PUBLIC_TIMEZONE_API_KEY (TimeZoneDB) validates timezone by coordinates.
 */

export type CityTimezone = {
  id: string;
  name: string;
  label: string;
  timezone: string;
  country: string;
  countryCode?: string;
  region?: string;
  lat?: number;
  lon?: number;
};

const OPEN_METEO = "https://geocoding-api.open-meteo.com/v1/search";
const IP_API = "https://ip-api.com/json/?fields=status,message,country,countryCode,city,lat,lon,timezone,query";

function safeTimezone(tz: string | undefined | null): string | null {
  const value = (tz || "").trim();
  if (!value) return null;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return value;
  } catch {
    return null;
  }
}

export function detectBrowserTimezone(): string {
  try {
    return safeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";
  } catch {
    return "UTC";
  }
}

function buildCityLabel(parts: {
  name: string;
  region?: string;
  country?: string;
}): string {
  const bits = [parts.name, parts.region, parts.country].filter(Boolean);
  return bits.join(", ");
}

/** Friendly label for an IANA zone (e.g. "Pakistan Standard Time"). */
export function formatTimezoneLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      timeZoneName: "longGeneric",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    return name || timeZone.replace(/_/g, " ");
  } catch {
    return timeZone.replace(/_/g, " ");
  }
}

async function optionalTimeZoneDbValidate(
  lat: number,
  lon: number,
  expectedZone: string,
): Promise<string> {
  const key = (process.env.NEXT_PUBLIC_TIMEZONE_API_KEY || "").trim();
  if (!key) return expectedZone;

  try {
    const url = new URL("https://api.timezonedb.com/v2.1/get-time-zone");
    url.searchParams.set("key", key);
    url.searchParams.set("format", "json");
    url.searchParams.set("by", "position");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lon));
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return expectedZone;
    const data = (await res.json()) as { zoneName?: string; status?: string };
    if (data.status === "OK" && data.zoneName) {
      return safeTimezone(data.zoneName) || expectedZone;
    }
  } catch {
    // Open-Meteo result is fine without validation.
  }
  return expectedZone;
}

/** Search cities worldwide; returns IANA timezone per result. */
export async function searchCities(query: string): Promise<CityTimezone[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(OPEN_METEO);
  url.searchParams.set("name", q);
  url.searchParams.set("count", "12");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("City search failed. Try again.");
  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      timezone: string;
      country: string;
      country_code?: string;
      admin1?: string;
    }>;
  };

  const rows = data.results || [];
  const out: CityTimezone[] = [];

  for (const row of rows) {
    const tz = safeTimezone(row.timezone);
    if (!tz) continue;
    out.push({
      id: String(row.id),
      name: row.name,
      label: buildCityLabel({
        name: row.name,
        region: row.admin1,
        country: row.country,
      }),
      timezone: tz,
      country: row.country,
      countryCode: row.country_code,
      region: row.admin1,
      lat: row.latitude,
      lon: row.longitude,
    });
  }
  return out;
}

/** Re-validate timezone when user picks a city (optional TimeZoneDB key). */
export async function refineCityTimezone(city: CityTimezone): Promise<CityTimezone> {
  if (typeof city.lat !== "number" || typeof city.lon !== "number") return city;
  const tz = await optionalTimeZoneDbValidate(city.lat, city.lon, city.timezone);
  return { ...city, timezone: tz };
}

/** Best-effort city from visitor IP (no key). Falls back to browser timezone only. */
export async function detectCityFromIp(): Promise<CityTimezone | null> {
  try {
    const res = await fetch(IP_API, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      city?: string;
      country?: string;
      countryCode?: string;
      lat?: number;
      lon?: number;
      timezone?: string;
    };
    if (data.status !== "success") return null;

    const tz =
      safeTimezone(data.timezone) ||
      (typeof data.lat === "number" && typeof data.lon === "number"
        ? await optionalTimeZoneDbValidate(data.lat, data.lon, detectBrowserTimezone())
        : detectBrowserTimezone());

    const name = (data.city || "").trim() || "Your location";
    return {
      id: `ip-${data.countryCode || "xx"}-${name}`,
      name,
      label: buildCityLabel({ name, country: data.country }),
      timezone: tz,
      country: data.country || "",
      countryCode: data.countryCode,
      lat: data.lat,
      lon: data.lon,
    };
  } catch {
    return null;
  }
}

/** Default city from IP, else browser timezone with generic label. */
export async function resolveDefaultCity(): Promise<CityTimezone> {
  const fromIp = await detectCityFromIp();
  if (fromIp) return fromIp;

  const tz = detectBrowserTimezone();
  return {
    id: `browser-${tz}`,
    name: "Your location",
    label: formatTimezoneLabel(tz),
    timezone: tz,
    country: "",
  };
}
