"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { OpeningHours } from "@/lib/schemas/shelter";
import { cn } from "@/lib/utils";

const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;
type Dia = (typeof DIAS)[number];
type Franja = { open: string; close: string };

type Props = {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
};

export function OpeningHoursEditor({ value, onChange }: Props) {
  const t = useTranslations("onboarding");

  function franjasDe(dia: Dia): Franja[] {
    return (value[dia] as Franja[] | undefined) ?? [];
  }

  function actualizar(dia: Dia, franjas: Franja[]) {
    const siguiente = { ...value };
    if (franjas.length === 0) {
      delete siguiente[dia];
    } else {
      siguiente[dia] = franjas;
    }
    onChange(siguiente);
  }

  function añadir(dia: Dia) {
    actualizar(dia, [...franjasDe(dia), { open: "10:00", close: "14:00" }]);
  }

  function editar(dia: Dia, i: number, campo: keyof Franja, valor: string) {
    const franjas = franjasDe(dia).map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f));
    actualizar(dia, franjas);
  }

  function eliminar(dia: Dia, i: number) {
    actualizar(dia, franjasDe(dia).filter((_, idx) => idx !== i));
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium text-foreground">{t("hoursTitle")}</legend>
      <p className="text-sm text-muted-foreground">{t("hoursHelp")}</p>

      <div className="divide-y divide-border rounded-xl border border-border">
        {DIAS.map((dia) => {
          const franjas = franjasDe(dia);
          return (
            <div
              key={dia}
              role="group"
              aria-label={t(`days.${dia}`)}
              className="flex items-start gap-3 px-3 py-2"
            >
              <span className="w-9 shrink-0 pt-1.5 text-sm font-semibold" title={t(`days.${dia}`)}>
                {t(`daysShort.${dia}`)}
              </span>

              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                {franjas.length === 0 && (
                  <span className="py-1 text-sm text-muted-foreground">{t("closed")}</span>
                )}

                {franjas.map((f, i) => {
                  const invalida = Boolean(f.open) && Boolean(f.close) && f.open >= f.close;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted px-1.5 py-1"
                    >
                      <Label htmlFor={`${dia}-${i}-open`} className="sr-only">
                        {t("from")} — {t(`days.${dia}`)} apertura
                      </Label>
                      <input
                        id={`${dia}-${i}-open`}
                        type="time"
                        value={f.open}
                        aria-invalid={invalida}
                        onChange={(e) => editar(dia, i, "open", e.target.value)}
                        className="w-22 rounded-md border border-border bg-background px-1.5 py-0.5 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">{t("to")}</span>
                      <Label htmlFor={`${dia}-${i}-close`} className="sr-only">
                        {t("to")} — {t(`days.${dia}`)} cierre
                      </Label>
                      <input
                        id={`${dia}-${i}-close`}
                        type="time"
                        value={f.close}
                        aria-invalid={invalida}
                        onChange={(e) => editar(dia, i, "close", e.target.value)}
                        className={cn(
                          "w-22 rounded-md border border-border bg-background px-1.5 py-0.5 text-sm",
                          invalida && "border-destructive",
                        )}
                      />
                      <button
                        type="button"
                        aria-label={t("removeSlot")}
                        title={t("removeSlot")}
                        onClick={() => eliminar(dia, i)}
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  );
                })}

                <button
                  type="button"
                  aria-label={`${t("addSlot")} — ${t(`days.${dia}`)}`}
                  title={t("addSlot")}
                  onClick={() => añadir(dia)}
                  className="flex size-7 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Plus className="size-4" />
                </button>

                {franjas.some((f) => Boolean(f.open) && Boolean(f.close) && f.open >= f.close) && (
                  <p className="w-full text-sm text-destructive">{t("slotError")}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
