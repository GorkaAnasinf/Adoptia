"use client";

import dynamic from "next/dynamic";
import type { PuntoExtra } from "./MiniMapaInner";

// Leaflet toca `window`: dynamic import sin SSR (Decisión #8).
const Inner = dynamic(() => import("./MiniMapaInner"), {
  ssr: false,
  loading: () => <div className="h-44 w-full animate-pulse rounded-xl bg-muted" />,
});

/**
 * Mapa estático de solo lectura (ficha del animal / protectora). Con `extras`
 * pinta puntos adicionales (avistamientos) y se vuelve navegable.
 */
export function MiniMapa({
  lat,
  lng,
  extras,
}: {
  lat: number;
  lng: number;
  extras?: PuntoExtra[];
}) {
  return <Inner lat={lat} lng={lng} extras={extras} />;
}
