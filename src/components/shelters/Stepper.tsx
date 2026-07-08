import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  pasos: string[];
  actual: number; // índice 0-based del paso activo
  label: string;
  /** Índice máximo al que se puede saltar (pasos ya visitados). */
  maxAlcanzable?: number;
  /** Si se pasa, los números de pasos alcanzables son clicables. */
  onStepClick?: (i: number) => void;
};

export function Stepper({ pasos, actual, label, maxAlcanzable, onStepClick }: Props) {
  const tope = maxAlcanzable ?? actual;
  return (
    <ol className="flex items-center" aria-label={label}>
      {pasos.map((etiqueta, i) => {
        const completado = i < actual;
        const activo = i === actual;
        const ultimo = i === pasos.length - 1;
        const clicable = Boolean(onStepClick) && i <= tope && i !== actual;

        const circulo = (
          <span
            data-completado={completado ? "true" : undefined}
            aria-current={activo ? "step" : undefined}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
              activo && "border-primary bg-primary text-primary-foreground",
              completado && "border-secondary bg-secondary text-secondary-foreground",
              !activo && !completado && "border-border text-muted-foreground",
              clicable && "cursor-pointer hover:border-primary hover:text-primary",
            )}
          >
            {completado ? <Check className="size-5" aria-hidden="true" /> : i + 1}
          </span>
        );

        return (
          <li key={etiqueta} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className="flex items-center gap-2">
              {clicable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(i)}
                  aria-label={`${etiqueta} — paso ${i + 1}`}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {circulo}
                </button>
              ) : (
                circulo
              )}
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  activo && "font-semibold text-primary",
                  completado && "font-medium text-foreground",
                  !activo && !completado && "text-muted-foreground",
                )}
              >
                {etiqueta}
              </span>
            </span>
            {!ultimo && (
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  completado ? "bg-secondary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
