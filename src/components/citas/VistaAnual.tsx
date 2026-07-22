"use client";

import { celdasMes, fechaISO, type EstadoDia } from "@/lib/agenda";
import { cn } from "@/lib/utils";
import type { EstadoCalendario } from "./CalendarioMensual";

const COLOR_ESTADO: Record<EstadoDia["tipo"], string> = {
  cerrado: "bg-destructive/40",
  especial: "bg-secondary/50",
  patron: "bg-tertiary/40",
  sin_configurar: "bg-border/60",
};

/**
 * Vista anual de la agenda (FEATURE-055): 12 mini-meses tipo heatmap. Cada día
 * se colorea por su estado y muestra un punto si tiene citas; al pulsarlo se
 * salta a la vista mensual en esa fecha. El estado lo resuelve el padre.
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
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, month) => {
          const mesLabel = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(
            new Date(year, month, 1),
          );
          return (
            <div key={month}>
              <p className="mb-1 text-sm font-semibold capitalize">{mesLabel}</p>
              <div role="grid" className="grid grid-cols-7 gap-0.5">
                {celdasMes(year, month).map((dia, i) => {
                  if (dia === null) return <span key={`e${i}`} aria-hidden="true" />;
                  const iso = fechaISO(year, month, dia);
                  const estado = estadoDe(iso);
                  return (
                    <button
                      type="button"
                      key={iso}
                      role="gridcell"
                      aria-label={iso}
                      data-estado={estado.tipo}
                      data-citas={estado.conCitas}
                      onClick={() => onIrADia(iso)}
                      title={`${dia}`}
                      className={cn(
                        "relative aspect-square rounded-[3px] text-[0.6rem] leading-none transition-transform hover:scale-125",
                        COLOR_ESTADO[estado.tipo],
                        iso === todayISO && "ring-1 ring-primary",
                      )}
                    >
                      {estado.conCitas && (
                        <span className="absolute bottom-0 right-0 size-1 rounded-full bg-primary" />
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
