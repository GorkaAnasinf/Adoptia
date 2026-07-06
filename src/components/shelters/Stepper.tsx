import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  pasos: string[];
  actual: number; // índice 0-based del paso activo
};

export function Stepper({ pasos, actual }: Props) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progreso del alta">
      {pasos.map((etiqueta, i) => {
        const completado = i < actual;
        const activo = i === actual;
        return (
          <li key={etiqueta} className="flex flex-1 items-center gap-2">
            <span
              aria-current={activo ? "step" : undefined}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                activo && "border-primary bg-primary text-primary-foreground",
                completado && "border-primary bg-primary/10 text-primary",
                !activo && !completado && "border-border text-muted-foreground",
              )}
            >
              {completado ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                activo ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {etiqueta}
            </span>
            {i < pasos.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
