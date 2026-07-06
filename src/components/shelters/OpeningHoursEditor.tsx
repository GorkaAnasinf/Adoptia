"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { OpeningHours } from "@/lib/schemas/shelter";

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
    <fieldset className="flex flex-col gap-3">
      <legend className="font-medium text-foreground">{t("hoursTitle")}</legend>
      <p className="text-sm text-muted-foreground">{t("hoursHelp")}</p>

      <div className="flex flex-col gap-3">
        {DIAS.map((dia) => {
          const franjas = franjasDe(dia);
          return (
            <div
              key={dia}
              role="group"
              aria-label={t(`days.${dia}`)}
              className="flex flex-col gap-2 rounded-xl border-2 border-border p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t(`days.${dia}`)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => añadir(dia)}
                >
                  <Plus className="size-4" /> {t("addSlot")}
                </Button>
              </div>

              {franjas.map((f, i) => {
                const invalida = Boolean(f.open) && Boolean(f.close) && f.open >= f.close;
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${dia}-${i}-open`} className="sr-only">
                        {t("from")} — {t(`days.${dia}`)} apertura
                      </Label>
                      <input
                        id={`${dia}-${i}-open`}
                        type="time"
                        value={f.open}
                        aria-invalid={invalida}
                        onChange={(e) => editar(dia, i, "open", e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      />
                      <span className="text-muted-foreground">{t("to")}</span>
                      <Label htmlFor={`${dia}-${i}-close`} className="sr-only">
                        {t("to")} — {t(`days.${dia}`)} cierre
                      </Label>
                      <input
                        id={`${dia}-${i}-close`}
                        type="time"
                        value={f.close}
                        aria-invalid={invalida}
                        onChange={(e) => editar(dia, i, "close", e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("removeSlot")}
                        onClick={() => eliminar(dia, i)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    {invalida && (
                      <p className="text-sm text-destructive">{t("slotError")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
