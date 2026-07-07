import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  pasos: string[];
  actual: number; // índice 0-based del paso activo
};

export function Stepper({ pasos, actual }: Props) {
  return (
    <ol className="flex items-center" aria-label="Progreso del alta">
      {pasos.map((etiqueta, i) => {
        const completado = i < actual;
        const activo = i === actual;
        const ultimo = i === pasos.length - 1;
        return (
          <li key={etiqueta} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className="flex items-center gap-2">
              <span
                data-completado={completado ? "true" : undefined}
                aria-current={activo ? "step" : undefined}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  activo && "border-primary bg-primary text-primary-foreground",
                  completado && "border-secondary bg-secondary text-secondary-foreground",
                  !activo && !completado && "border-border text-muted-foreground",
                )}
              >
                {completado ? <Check className="size-5" aria-hidden="true" /> : i + 1}
              </span>
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
