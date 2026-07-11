"use client";

import dynamic from "next/dynamic";
import type { AvisoMapa } from "./tipos";

// Leaflet toca `window`: dynamic import sin SSR (Decisión #8).
const Inner = dynamic(() => import("./MapaAvisosInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-muted" aria-hidden />,
});

export function MapaAvisos({ avisos }: { avisos: AvisoMapa[] }) {
  return <Inner avisos={avisos} />;
}
