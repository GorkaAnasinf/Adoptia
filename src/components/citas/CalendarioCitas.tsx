import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Mini-calendario del mes indicado (presentacional). `todayDay` marca el día de
 * hoy si el mes mostrado es el actual; `diasConCitas` pinta un punto en los días
 * con alguna cita. Sin navegación ni interacción.
 */
export function CalendarioCitas({
  year,
  month,
  todayDay,
  diasConCitas,
}: {
  year: number;
  month: number;
  todayDay: number | null;
  diasConCitas: number[];
}) {
  const conCita = new Set(diasConCitas);
  const primero = new Date(year, month, 1);
  const desplazamiento = (primero.getDay() + 6) % 7; // Lunes = 0
  const totalDias = new Date(year, month + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(desplazamiento).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const mesLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(primero);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">{mesLabel}</p>
      <div role="grid" className="grid grid-cols-7 gap-1 text-center text-xs">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="py-1 font-semibold text-muted-foreground">
            {d}
          </span>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <span key={`e${i}`} aria-hidden="true" />;
          const esHoy = dia === todayDay;
          return (
            <span
              key={dia}
              role="gridcell"
              aria-label={String(dia)}
              aria-current={esHoy ? "date" : undefined}
              className={cn(
                "relative mx-auto flex size-8 items-center justify-center rounded-full text-sm",
                esHoy ? "bg-primary font-bold text-primary-foreground" : "text-foreground",
              )}
            >
              {dia}
              {conCita.has(dia) && (
                <span
                  data-cita
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    esHoy ? "bg-primary-foreground" : "bg-primary",
                  )}
                  aria-hidden="true"
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
