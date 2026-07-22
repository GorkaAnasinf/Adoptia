"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Barra de utilidades masivas sobre el calendario de la agenda (FEATURE-054):
 * activar la selección múltiple de días y abrir el diálogo de cierre por rango.
 */
export function UtilidadesBar({
  modoSeleccion,
  onToggleSeleccion,
  onAbrirRango,
  onCerrarFestivos,
}: {
  modoSeleccion: boolean;
  onToggleSeleccion: () => void;
  onAbrirRango: () => void;
  onCerrarFestivos: () => void;
}) {
  const t = useTranslations("agenda");
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onToggleSeleccion}
        aria-pressed={modoSeleccion}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
          modoSeleccion
            ? "border-secondary bg-secondary text-secondary-foreground"
            : "border-border text-foreground hover:bg-accent",
        )}
      >
        {modoSeleccion ? t("salirSeleccion") : t("seleccionarDias")}
      </button>
      <button
        type="button"
        onClick={onAbrirRango}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
      >
        {t("cerrarRangoAccion")}
      </button>
      <button
        type="button"
        onClick={onCerrarFestivos}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
      >
        {t("cerrarFestivos")}
      </button>
    </div>
  );
}
