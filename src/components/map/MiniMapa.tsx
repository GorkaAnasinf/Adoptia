"use client";

import dynamic from "next/dynamic";

// Leaflet toca `window`: dynamic import sin SSR (Decisión #8).
const Inner = dynamic(() => import("./MiniMapaInner"), {
  ssr: false,
  loading: () => <div className="h-44 w-full animate-pulse rounded-xl bg-muted" />,
});

/** Mapa estático de solo lectura (ficha del animal / protectora). */
export function MiniMapa({ lat, lng }: { lat: number; lng: number }) {
  return <Inner lat={lat} lng={lng} />;
}
