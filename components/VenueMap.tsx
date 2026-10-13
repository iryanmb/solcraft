"use client";

// The Discover map: OpenFreeMap's dark style drawn by MapLibre, with a sun pin per venue.
// Loaded only when someone opens the map (next/dynamic in the Discover page), so the
// list stays fast. Map data © OpenStreetMap contributors (shown on the map).

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import { SUN_POINTS } from "@/components/SunMark";

// MapLibre draws in a background worker. scripts/copy-map-worker.ts puts its files in public/.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const STYLE_URL = "https://tiles.openfreemap.org/styles/dark"; // free, no key (openfreemap.org)
const ATLANTA: [number, number] = [-84.37, 33.77]; // [lng, lat]

export type MapPin = { id: string; name: string; lat: number; lng: number; count: number };

type VenueMapProps = {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (venueId: string) => void;
};

const sunSvg = `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${SUN_POINTS}" fill="var(--color-sun)" stroke="var(--color-ink)" stroke-width="6" stroke-linejoin="round"/></svg>`;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export default function VenueMap({ pins, selectedId, onSelect }: VenueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, { marker: Marker; element: HTMLButtonElement }>());
  // The pins' click handlers read the latest onSelect through this ref.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: ATLANTA,
      zoom: 11,
      attributionControl: { compact: true },
    });
    // Tint the map's background and water with Solcraft's night colors.
    map.on("load", () => {
      map.setPaintProperty("background", "background-color", token("--color-bg"));
      if (map.getLayer("water")) map.setPaintProperty("water", "fill-color", token("--color-surface"));
    });
    // Tile or style failures show up in the browser console instead of failing silently.
    map.on("error", (event) => console.error("Map error:", event.error?.message ?? event));
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)place the pins whenever the list changes, and fit the view around them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const { marker } of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const pin of pins) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "map-pin";
      element.setAttribute("aria-label", pin.count > 1 ? `${pin.name}, ${pin.count} gatherings` : pin.name);
      element.innerHTML = sunSvg;
      element.addEventListener("click", () => onSelectRef.current(pin.id));
      const marker = new Marker({ element }).setLngLat([pin.lng, pin.lat]).addTo(map);
      markersRef.current.set(pin.id, { marker, element });
    }

    if (pins.length > 0) {
      const bounds = new LngLatBounds();
      for (const pin of pins) bounds.extend([pin.lng, pin.lat]);
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: reducedMotion() ? 0 : 600 });
    }
  }, [pins]);

  // Highlight the chosen pin.
  useEffect(() => {
    for (const [id, { element }] of markersRef.current) {
      element.classList.toggle("selected", id === selectedId);
      element.setAttribute("aria-pressed", String(id === selectedId));
    }
  }, [selectedId, pins]);

  return <div ref={containerRef} className="map-box" role="region" aria-label="Map of gatherings" />;
}
