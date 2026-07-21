"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChipOption = { value: string; label: string; icon?: LucideIcon };

type BaseProps = {
  options: ChipOption[];
  ariaLabel: string;
  className?: string;
};

type Props =
  | (BaseProps & { multiple: true; value: string[]; onChange: (next: string[]) => void })
  | (BaseProps & { multiple?: false; value: string; onChange: (next: string) => void });

/**
 * Grupo de chips seleccionables (terracota al seleccionar). Con `multiple`
 * funcionan como checkboxes; si no, como radios. Cada chip envuelve un input
 * real (accesible) oculto visualmente. Patrón base para formularios de alta.
 */
export function ChipGroup(props: Props) {
  const { options, ariaLabel, className } = props;
  const multiple = props.multiple ?? false;

  function seleccionado(value: string): boolean {
    return multiple ? (props.value as string[]).includes(value) : props.value === value;
  }

  function alternar(value: string) {
    if (props.multiple) {
      const actual = props.value;
      props.onChange(
        actual.includes(value) ? actual.filter((v) => v !== value) : [...actual, value],
      );
    } else {
      props.onChange(value);
    }
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((op) => {
        const activo = seleccionado(op.value);
        const Icon = op.icon;
        return (
          <label
            key={op.value}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activo
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={ariaLabel}
              checked={activo}
              onChange={() => alternar(op.value)}
              className="sr-only"
            />
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            {op.label}
          </label>
        );
      })}
    </div>
  );
}
