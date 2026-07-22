"use client";

import { useTranslations } from "next-intl";
import type { Plantilla } from "@/lib/agenda";

/**
 * Lista de plantillas de horario en la barra de selección (FEATURE-057):
 * aplicar una plantilla a los días seleccionados o borrarla.
 */
export function PlantillasPicker({
  plantillas,
  nSeleccionados,
  guardando,
  onAplicar,
  onBorrar,
}: {
  plantillas: Plantilla[];
  nSeleccionados: number;
  guardando: boolean;
  onAplicar: (plantilla: Plantilla) => void;
  onBorrar: (id: string) => void;
}) {
  const t = useTranslations("agenda");

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <p className="text-sm font-semibold text-foreground">{t("plantillasTitulo")}</p>
      {plantillas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("sinPlantillas")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {plantillas.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm">{p.nombre}</span>
              <button
                type="button"
                onClick={() => onAplicar(p)}
                disabled={guardando || nSeleccionados === 0}
                className="min-h-9 rounded-lg border border-secondary px-3 py-1 text-xs font-semibold text-secondary hover:bg-secondary/10 disabled:opacity-50"
              >
                {t("aplicarPlantilla")}
              </button>
              <button
                type="button"
                aria-label={t("borrarPlantilla")}
                onClick={() => onBorrar(p.id)}
                disabled={guardando}
                className="rounded-full border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
