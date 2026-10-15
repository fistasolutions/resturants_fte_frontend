/** Frontend SPEC-384 — delivery maps' pure half. */
import { describe, expect, it } from "vitest";

import {
  addCorner,
  ageLabel,
  boundsOf,
  centreOf,
  distanceKm,
  formatKm,
  isDrawable,
  isFresh,
  navigationLink,
  shouldReport,
  toPair,
  undoCorner,
} from "@/lib/geo-map";

describe("delivery maps (SPEC-384)", () => {
  it("frames points", () => {
    expect(boundsOf([])).toBeNull();
    const pts = [
      { lat: 40, lng: -74 },
      { lat: 40.2, lng: -73.8 },
    ];
    expect(boundsOf(pts)).toEqual({ south: 40, west: -74, north: 40.2, east: -73.8 });
    expect(centreOf(pts)).toEqual({ lat: 40.1, lng: -73.9 });
  });

  it("draws a zone corner by corner", () => {
    let c = addCorner([], { lat: 40.0000004, lng: -74 });
    expect(c).toEqual([[40, -74]]);
    c = addCorner(c, { lat: 40, lng: -74 }); // the same corner twice is one corner
    expect(c).toHaveLength(1);
    c = addCorner(addCorner(c, { lat: 40, lng: -73.9 }), { lat: 40.1, lng: -73.9 });
    expect(isDrawable(c)).toBe(true);
    expect(isDrawable(undoCorner(c))).toBe(false);
    expect(isDrawable([[0, 0], [1, 1], [2, 2]])).toBe(false);
    expect(toPair({ lat: 1.23456789, lng: 2 })).toEqual([1.234568, 2]);
  });

  it("measures and words distances", () => {
    expect(distanceKm({ lat: 40.7128, lng: -74.006 }, { lat: 34.0522, lng: -118.2437 })).toBeCloseTo(3936, -1);
    expect(formatKm(0.42)).toBe("420 m");
    expect(formatKm(3.26)).toBe("3.3 km");
    expect(formatKm(12.6)).toBe("13 km");
  });

  it("opens navigation by point, else by address", () => {
    expect(navigationLink({ lat: 40.1, lng: -74.2 })).toBe("https://www.google.com/maps/dir/?api=1&destination=40.1,-74.2");
    expect(navigationLink(null, "1 Main St, Springfield")).toBe("https://www.google.com/maps/dir/?api=1&destination=1%20Main%20St%2C%20Springfield");
    expect(navigationLink(null, " ")).toBeNull();
  });

  it("paces a phone's reports and words their age", () => {
    expect(shouldReport(null, 1000)).toBe(true);
    expect(shouldReport(1000, 10_000)).toBe(false);
    expect(shouldReport(1000, 16_000)).toBe(true);
    const now = Date.parse("2026-10-16T12:00:00Z");
    expect(isFresh("2026-10-16T11:58:30Z", now)).toBe(true);
    expect(isFresh("2026-10-16T11:50:00Z", now)).toBe(false);
    expect(isFresh(null, now)).toBe(false);
    expect(ageLabel("2026-10-16T11:59:50Z", now)).toBe("Just now");
    expect(ageLabel("2026-10-16T11:55:00Z", now)).toBe("5 min ago");
    expect(ageLabel("2026-10-16T09:00:00Z", now)).toBe("3 h ago");
    expect(ageLabel(null, now)).toBe("No position yet");
  });
});
