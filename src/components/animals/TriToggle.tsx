"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Valor = boolean | null;

/** Toggle tri-estado: Sí / No / No sabemos (true / false / null). */
export function TriToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Valor;
  onChange: (v: Valor) => void;
}) {
  const t = useTranslations("animales");
  const opciones: Array<{ v: Valor; label: string }> = [
    { v: true, label: t("triYes") },
    { v: false, label: t("triNo") },
    { v: null, label: t("triUnknown") },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="inline-flex w-fit rounded-lg border border-border p-0.5" role="group" aria-label={label}>
        {opciones.map(({ v, label: l }) => {
          const activo = value === v;
          return (
            <button
              key={String(v)}
              type="button"
              aria-pressed={activo}
              onClick={() => onChange(v)}
              className={cn(
                "min-w-16 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activo ? "bg-tertiary text-tertiary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
