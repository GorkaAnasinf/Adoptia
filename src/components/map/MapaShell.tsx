"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { SheltersSearch } from "@/lib/shelters-search";
import { cn } from "@/lib/utils";
import { ListaProtectoras, type ShelterMapResult } from "./ListaProtectoras";
import { MapaFiltros } from "./MapaFiltros";
import { MapaProtectoras } from "./MapaProtectoras";
import { MapaVacio } from "./MapaVacio";

// Umbral (px) para distinguir un tap de un arrastre real, y arrastre mínimo
// para que cuente como gesto de abrir/cerrar (evita cierres accidentales).
const UMBRAL_TAP = 10;
const UMBRAL_ARRASTRE = 40;

export function MapaShell({
  shelters,
  search,
}: {
  shelters: ShelterMapResult[];
  search: SheltersSearch;
}) {
  const t = useTranslations("mapa");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sheetAbierto, setSheetAbierto] = useState(true);
  const arrastre = useRef<{ startY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    arrastre.current = { startY: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!arrastre.current) return;
    const deltaY = e.clientY - arrastre.current.startY;
    arrastre.current = null;

    if (Math.abs(deltaY) < UMBRAL_TAP) {
      setSheetAbierto((abierto) => !abierto);
    } else if (deltaY > UMBRAL_ARRASTRE) {
      setSheetAbierto(false);
    } else if (deltaY < -UMBRAL_ARRASTRE) {
      setSheetAbierto(true);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSheetAbierto((abierto) => !abierto);
    }
  };

  const panel = (
    <div className="space-y-4">
      <MapaFiltros search={search} />
      {shelters.length === 0 ? (
        <MapaVacio />
      ) : (
        <ListaProtectoras
          shelters={shelters}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      )}
    </div>
  );

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full lg:grid lg:grid-cols-[360px_1fr]">
      <aside
        aria-label={t("panelLabel")}
        className="hidden h-full overflow-y-auto border-r border-border/60 bg-surface-container-low p-4 lg:block"
      >
        {panel}
      </aside>

      <div className="h-full w-full">
        <MapaProtectoras
          shelters={shelters}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>

      <div
        data-testid="bottom-sheet"
        data-state={sheetAbierto ? "open" : "collapsed"}
        className={cn(
          "absolute inset-x-0 bottom-0 z-1000 touch-none rounded-t-3xl bg-surface-container-low p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-[max-height] duration-300 ease-out lg:hidden",
          sheetAbierto ? "max-h-[45vh] overflow-y-auto" : "max-h-14 overflow-hidden",
        )}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={sheetAbierto}
          aria-label={t("bottomSheetToggle")}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          className="mx-auto mb-2 h-1.5 w-10 cursor-grab touch-none rounded-full bg-black/20 focus-visible:outline-2 focus-visible:outline-primary"
        />
        {panel}
      </div>
    </div>
  );
}
