"use client";

import { cn } from "@/lib/utils";

export type SegmentOption = { value: string; label: string };

/**
 * Selector segmentado (una sola opción) en forma de píldora. Para conjuntos
 * pequeños y excluyentes (p. ej. Piso / Casa). Patrón base de formularios.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-full border border-border bg-surface-container-low p-1",
        className,
      )}
    >
      {options.map((op) => {
        const activo = op.value === value;
        return (
          <button
            key={op.value}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(op.value)}
            className={cn(
              "min-h-9 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activo
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
