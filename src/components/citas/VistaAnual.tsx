"use client";

import { celdasMes, fechaISO, type EstadoDia } from "@/lib/agenda";
import { cn } from "@/lib/utils";
import type { EstadoCalendario } from "./CalendarioMensual";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

/** Fondo de cada día según su estado (tinte suave; el número se lee encima). */
const COLOR_ESTADO: Record<EstadoDia["tipo"], string> = {
  cerrado: "bg-destructive/15 text-destructive",
  especial: "bg-secondary/15 text-foreground",
  patron: "bg-tertiary/15 text-foreground",
  sin_configurar: "bg-transparent text-muted-foreground",
};

/**
 * Vista anual de la agenda (FEATURE-055): 12 mini-meses como calendarios. Cada
 * día muestra su número, se tinta por estado y lleva un punto si tiene citas; al
 * pulsarlo se abre la vista diaria de esa fecha. El estado lo resuelve el padre.
 */
export function VistaAnual({
  year,
  todayISO,
  estadoDe,
  onIrADia,
}: {
  year: number;
  todayISO: string | null;
  estadoDe: (iso: string) => EstadoCalendario;
  onIrADia: (iso: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <h2 className="font-heading text-2xl font-bold">{year}</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, month) => {
          const mesLabel = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(
            new Date(year, month, 1),
          );
          return (
            <div key={month}>
              <p className="mb-2 text-sm font-semibold capitalize">{mesLabel}</p>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {DIAS_SEMANA.map((d, i) => (
                  <span
                    key={`h${i}`}
                    aria-hidden="true"
                    className={cn(
                      "pb-1 text-[0.65rem] font-semibold",
                      i >= 5 ? "text-destructive/60" : "text-muted-foreground",
                    )}
                  >
                    {d}
                  </span>
                ))}
                {celdasMes(year, month).map((dia, i) => {
                  if (dia === null) return <span key={`e${i}`} aria-hidden="true" />;
                  const iso = fechaISO(year, month, dia);
                  const estado = estadoDe(iso);
                  const esHoy = iso === todayISO;
                  return (
                    <button
                      type="button"
                      key={iso}
                      role="gridcell"
                      aria-label={iso}
                      data-estado={estado.tipo}
                      data-citas={estado.conCitas}
                      onClick={() => onIrADia(iso)}
                      className={cn(
                        "relative mx-auto flex size-7 items-center justify-center rounded-full text-xs tabular-nums transition-transform hover:scale-110",
                        COLOR_ESTADO[estado.tipo],
                        esHoy && "font-bold ring-2 ring-primary",
                      )}
                    >
                      {dia}
                      {estado.conCitas && (
                        <span
                          className="absolute bottom-0.5 size-1 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
