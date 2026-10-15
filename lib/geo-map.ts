/**
 * Delivery maps' pure half (frontend SPEC-384 over backend SPEC-400): the tile source, bounds and
 * centre, drawing a zone corner by corner, distances, the navigation link, and how often a driver's
 * phone reports. Which zone holds a point is the backend's to say.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Raster tiles. A brand sets its own provider for production; OpenStreetMap is the default. */
export const MAP_TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** A driver's phone reports at most this often. */
export const LOCATION_EVERY_MS = 15_000;
/** A position older than this is not shown as "now". */
export const FRESH_MS = 3 * 60_000;

export function toPoint(pair: number[]): LatLng {
  return { lat: pair[0], lng: pair[1] };
}

export function toPair(point: LatLng): [number, number] {
  return [round6(point.lat), round6(point.lng)];
}

function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** The box around every point, or null when there are none. */
export function boundsOf(points: LatLng[]): { south: number; west: number; north: number; east: number } | null {
  if (points.length === 0) return null;
  return {
    south: Math.min(...points.map((p) => p.lat)),
    west: Math.min(...points.map((p) => p.lng)),
    north: Math.max(...points.map((p) => p.lat)),
    east: Math.max(...points.map((p) => p.lng)),
  };
}

export function centreOf(points: LatLng[]): LatLng | null {
  const box = boundsOf(points);
  return box ? { lat: (box.south + box.north) / 2, lng: (box.west + box.east) / 2 } : null;
}

// ── drawing a zone ───────────────────────────────────────────────────────────

export const MAX_CORNERS = 200;

export function addCorner(corners: [number, number][], point: LatLng): [number, number][] {
  if (corners.length >= MAX_CORNERS) return corners;
  const next = toPair(point);
  const last = corners[corners.length - 1];
  if (last && last[0] === next[0] && last[1] === next[1]) return corners;
  return [...corners, next];
}

export function undoCorner(corners: [number, number][]): [number, number][] {
  return corners.slice(0, -1);
}

/** Whether a drawn shape can be saved: three corners or more that do not lie on one line. */
export function isDrawable(corners: [number, number][]): boolean {
  if (corners.length < 3) return false;
  let area = 0;
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length];
    area += a[1] * b[0] - b[1] * a[0];
  });
  return Math.abs(area) > 1e-12;
}

// ── distances, navigation, freshness ─────────────────────────────────────────

const EARTH_KM = 6371.0088;

export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/** Turn-by-turn in the phone's own maps app. */
export function navigationLink(point: LatLng | null, address?: string | null): string | null {
  if (point) return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
  if (address && address.trim()) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
  return null;
}

/** Whether a phone should report now, `lastAt` being when it last did (ms since epoch). */
export function shouldReport(lastAt: number | null, now: number): boolean {
  return lastAt == null || now - lastAt >= LOCATION_EVERY_MS;
}

export function isFresh(locatedAt: string | null | undefined, now: number): boolean {
  if (!locatedAt) return false;
  const at = Date.parse(locatedAt);
  return Number.isFinite(at) && now - at <= FRESH_MS;
}

/** "2 min ago" for a driver's last position. */
export function ageLabel(locatedAt: string | null | undefined, now: number): string {
  if (!locatedAt) return "No position yet";
  const minutes = Math.max(0, Math.round((now - Date.parse(locatedAt)) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : "Over a day ago";
}
