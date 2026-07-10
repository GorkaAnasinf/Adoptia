"use client";

import dynamic from "next/dynamic";
import type { ShelterMapResult } from "./ListaProtectoras";

const MapaProtectorasInner = dynamic(() => import("./MapaProtectorasInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/5" />,
});

export function MapaProtectoras(props: {
  shelters: ShelterMapResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return <MapaProtectorasInner {...props} />;
}
