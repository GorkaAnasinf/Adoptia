"use client";

import dynamic from "next/dynamic";
import type { JornadaMapa } from "./tipos";

// Leaflet toca `window`: dynamic import sin SSR (Decisión #8).
const Inner = dynamic(() => import("./MapaJornadasInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-muted" aria-hidden />,
});

export function MapaJornadas({ jornadas }: { jornadas: JornadaMapa[] }) {
  return <Inner jornadas={jornadas} />;
}
