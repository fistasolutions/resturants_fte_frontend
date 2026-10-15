"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

import { MAP_ATTRIBUTION, MAP_TILE_URL, boundsOf, type LatLng } from "@/lib/geo-map";
import { cn } from "@/lib/utils";

export interface MapPolygon {
  id: string;
  points: [number, number][];
  label?: string;
  tone?: "zone" | "draft" | "muted";
}

export interface MapMarker {
  id: string;
  point: LatLng;
  kind: "branch" | "order" | "driver" | "home";
  label?: string;
  title?: string;
}

const POLYGON_CLASS: Record<NonNullable<MapPolygon["tone"]>, string> = {
  zone: "stroke-primary fill-primary",
  draft: "stroke-warning fill-warning",
  muted: "stroke-muted-foreground fill-muted-foreground",
};

const MARKER_CLASS: Record<MapMarker["kind"], string> = {
  branch: "bg-card text-foreground ring-2 ring-foreground",
  order: "bg-primary text-primary-foreground",
  driver: "bg-success text-background",
  home: "bg-card text-foreground ring-2 ring-primary",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/**
 * A map (SPEC-384): zones as polygons, the branch, orders, drivers and a guest's home as markers,
 * and clicks reported for drawing. Leaflet runs in the browser only; markers are styled with tokens.
 * The view fits everything shown whenever `fitKey` changes.
 */
export function GeoMap({
  polygons = [],
  markers = [],
  fallbackCentre,
  onMapClick,
  fitKey,
  className,
  label,
}: {
  polygons?: MapPolygon[];
  markers?: MapMarker[];
  fallbackCentre?: LatLng | null;
  onMapClick?: (point: LatLng) => void;
  fitKey?: string;
  className?: string;
  label: string;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const click = useRef(onMapClick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    click.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !host.current || map.current) return;
      leaflet.current = L;
      const instance = L.map(host.current, { zoomControl: true, attributionControl: true });
      L.tileLayer(MAP_TILE_URL, { attribution: MAP_ATTRIBUTION, maxZoom: 19 }).addTo(instance);
      instance.on("click", (event) => click.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
      layer.current = L.layerGroup().addTo(instance);
      map.current = instance;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    const group = layer.current;
    if (!ready || !L || !group) return;
    group.clearLayers();
    for (const polygon of polygons) {
      if (polygon.points.length === 0) continue;
      const tone = polygon.tone ?? "zone";
      const shape =
        polygon.points.length >= 3
          ? L.polygon(polygon.points, { className: POLYGON_CLASS[tone], weight: 2, fillOpacity: 0.12 })
          : L.polyline(polygon.points, { className: POLYGON_CLASS[tone], weight: 2, dashArray: "4 4" });
      if (polygon.label) shape.bindTooltip(polygon.label, { sticky: true });
      shape.addTo(group);
      if (tone === "draft") {
        for (const corner of polygon.points) {
          L.circleMarker(corner, { radius: 4, className: POLYGON_CLASS.draft, fillOpacity: 1 }).addTo(group);
        }
      }
    }
    for (const marker of markers) {
      const text = escapeHtml(marker.label ?? "");
      const icon = L.divIcon({
        className: "",
        html: `<span class="${cn(
          "flex min-h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow-sm",
          MARKER_CLASS[marker.kind],
        )}">${text || "&nbsp;"}</span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const placed = L.marker([marker.point.lat, marker.point.lng], { icon, keyboard: false, title: marker.title ?? marker.label ?? "" });
      if (marker.title) placed.bindTooltip(marker.title);
      placed.addTo(group);
    }
  }, [ready, polygons, markers]);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const points = [...polygons.flatMap((p) => p.points.map(([lat, lng]) => ({ lat, lng }))), ...markers.map((m) => m.point)];
    const box = boundsOf(points);
    if (box && (box.north - box.south > 1e-6 || box.east - box.west > 1e-6)) {
      instance.fitBounds(
        [
          [box.south, box.west],
          [box.north, box.east],
        ],
        { padding: [24, 24], maxZoom: 16 },
      );
    } else if (points.length === 1) {
      instance.setView([points[0].lat, points[0].lng], 15);
    } else if (fallbackCentre) {
      instance.setView([fallbackCentre.lat, fallbackCentre.lng], 12);
    } else {
      instance.setView([20, 0], 2);
    }
    // Fit only when the caller says the content changed in a way worth re-framing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitKey]);

  return (
    <div
      ref={host}
      role="region"
      aria-label={label}
      className={cn("relative isolate z-0 h-72 w-full overflow-hidden rounded-xl border border-border bg-muted", onMapClick ? "cursor-crosshair" : "", className)}
    />
  );
}
