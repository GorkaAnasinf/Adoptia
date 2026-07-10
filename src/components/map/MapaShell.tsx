"use client";

import { useState } from "react";
import type { SheltersSearch } from "@/lib/shelters-search";
import { ListaProtectoras, type ShelterMapResult } from "./ListaProtectoras";
import { MapaFiltros } from "./MapaFiltros";
import { MapaProtectoras } from "./MapaProtectoras";
import { MapaVacio } from "./MapaVacio";

export function MapaShell({
  shelters,
  search,
}: {
  shelters: ShelterMapResult[];
  search: SheltersSearch;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const panel = (
    <div className="space-y-4">
      <MapaFiltros search={search} />
      {shelters.length === 0 ? (
        <MapaVacio />
      ) : (
        <ListaProtectoras shelters={shelters} selectedId={selectedId} onSelect={setSelectedId} />
      )}
    </div>
  );

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full lg:grid lg:grid-cols-[360px_1fr]">
      <aside
        aria-label="Filtros y listado de protectoras"
        className="hidden h-full overflow-y-auto border-r border-black/5 bg-white p-4 lg:block"
      >
        {panel}
      </aside>

      <div className="h-full w-full">
        <MapaProtectoras shelters={shelters} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[45vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-black/10" aria-hidden="true" />
        {panel}
      </div>
    </div>
  );
}
