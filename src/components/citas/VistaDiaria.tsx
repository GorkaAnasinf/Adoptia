"use client";

import { useTranslations } from "next-intl";
import type { CitaAgenda } from "@/lib/agenda";
import { cn } from "@/lib/utils";

const HORA = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

const ESTADO_KEY: Record<string, string> = {
  pending: "estadoPendiente",
  confirmed: "estadoConfirmada",
  cancelled: "estadoCancelada",
  done: "estadoRealizada",
  no_show: "estadoNoShow",
};

const ESTADO_COLOR: Record<string, string> = {
  pending: "bg-surface-container-high text-foreground",
  confirmed: "bg-secondary/15 text-secondary",
  cancelled: "bg-destructive/10 text-destructive",
  done: "bg-tertiary/15 text-tertiary",
  no_show: "bg-destructive/10 text-destructive",
};

/**
 * Vista diaria de la agenda (FEATURE-055): timeline de las citas del día
 * seleccionado. Las citas llegan ya filtradas por el padre.
 */
export function VistaDiaria({ fecha, citas }: { fecha: string | null; citas: CitaAgenda[] }) {
  const t = useTranslations("agenda");
  const tc = useTranslations("citas");

  if (!fecha) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground shadow-soft">
        {t("diariaSinDia")}
      </div>
    );
  }

  const fechaLarga = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${fecha}T00:00:00`));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="font-heading text-2xl font-bold capitalize">{fechaLarga}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("diariaTitulo")}</p>

      {citas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          {t("sinCitasDia")}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {citas.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
              <span className="font-heading text-lg font-bold tabular-nums">
                {HORA.format(new Date(c.starts_at))}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.animalName ?? "—"}</p>
                {c.adopterName && (
                  <p className="truncate text-sm text-muted-foreground">{c.adopterName}</p>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  ESTADO_COLOR[c.status] ?? "bg-surface-container-high text-foreground",
                )}
              >
                {tc(ESTADO_KEY[c.status] ?? "estadoPendiente")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
