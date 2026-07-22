"use client";

import { useTranslations } from "next-intl";
import { celdasMes, fechaISO, type EstadoDia } from "@/lib/agenda";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export type EstadoCalendario = { tipo: EstadoDia["tipo"]; conCitas: boolean };

/** Colores de fondo/borde de cada celda según el estado del día. */
const ESTILO_ESTADO: Record<EstadoDia["tipo"], string> = {
  cerrado: "border-destructive/30 bg-destructive/10 text-destructive",
  especial: "border-secondary/40 bg-secondary/10 text-foreground",
  patron: "border-tertiary/40 bg-tertiary/5 text-foreground",
  sin_configurar: "border-border bg-card text-muted-foreground",
};

/**
 * Calendario mensual interactivo de la agenda (FEATURE-053). Presentacional +
 * navegación y selección por callbacks; el estado de cada día lo resuelve el
 * padre con `resolverDiaAgenda`.
 */
export function CalendarioMensual({
  year,
  month,
  todayISO,
  seleccionadoISO,
  estadoDe,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  month: number; // 0-indexado
  todayISO: string | null;
  seleccionadoISO: string | null;
  estadoDe: (iso: string) => EstadoCalendario;
  onSelect: (iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("agenda");
  const celdas = celdasMes(year, month);
  const mesLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold capitalize">{mesLabel}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label={t("mesAnterior")}
            className="flex size-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-accent"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={t("mesSiguiente")}
            className="flex size-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-accent"
          >
            ›
          </button>
        </div>
      </div>

      <div role="grid" className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {DIAS_SEMANA.map((d, i) => (
          <span
            key={d}
            className={cn(
              "py-1 text-center text-xs font-semibold",
              i >= 5 ? "text-destructive/70" : "text-muted-foreground",
            )}
          >
            {d}
          </span>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <span key={`e${i}`} aria-hidden="true" />;
          const iso = fechaISO(year, month, dia);
          const estado = estadoDe(iso);
          const esHoy = iso === todayISO;
          const seleccionado = iso === seleccionadoISO;
          return (
            <button
              type="button"
              key={iso}
              role="gridcell"
              aria-label={String(dia)}
              aria-selected={seleccionado}
              data-estado={estado.tipo}
              data-citas={estado.conCitas}
              onClick={() => onSelect(iso)}
              className={cn(
                "relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl border text-sm transition-colors",
                ESTILO_ESTADO[estado.tipo],
                seleccionado && "ring-2 ring-primary ring-offset-1",
                esHoy && "font-bold",
              )}
            >
              <span>{dia}</span>
              {esHoy && (
                <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-primary">
                  {t("hoy")}
                </span>
              )}
              {estado.conCitas && (
                <span
                  className="absolute bottom-1.5 size-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-tertiary/60" /> {t("leyendaDisponible")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" /> {t("leyendaConCitas")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/60" /> {t("leyendaCerrado")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-border" /> {t("leyendaSinConfigurar")}
        </li>
      </ul>
    </div>
  );
}
