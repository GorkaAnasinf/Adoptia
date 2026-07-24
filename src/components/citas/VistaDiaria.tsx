"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CitaAgenda, EstadoDia } from "@/lib/agenda";
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
  pending: "border-l-primary bg-surface-container-high",
  confirmed: "border-l-secondary bg-secondary/10",
  cancelled: "border-l-destructive bg-destructive/10",
  done: "border-l-tertiary bg-tertiary/10",
  no_show: "border-l-destructive bg-destructive/10",
};

const ESTADO_CHIP: Record<string, string> = {
  pending: "bg-surface-container-high text-foreground",
  confirmed: "bg-secondary/15 text-secondary",
  cancelled: "bg-destructive/10 text-destructive",
  done: "bg-tertiary/15 text-tertiary",
  no_show: "bg-destructive/10 text-destructive",
};

const HORA_PX = 64; // alto de cada hora en el timeline
const HORA_MIN = 8; // ventana por defecto: siempre se pinta 08:00–21:00…
const HORA_MAX = 21; // …y se amplía si hay franjas o citas fuera de ese rango.

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutosDeCita(startsAt: string): number {
  return aMinutos(HORA.format(new Date(startsAt)));
}

/**
 * Vista diaria de la agenda (FEATURE-055): agenda tipo timeline del día. Pinta
 * la rejilla completa de horas con las franjas de apertura resaltadas al fondo y
 * coloca cada cita en su hueco (animal, adoptante, estado). La cita enlaza con
 * la bandeja de citas para gestionarla. Navegable entre días desde el padre.
 */
export function VistaDiaria({
  fecha,
  estado,
  citas,
  esHoy = false,
  onPrev,
  onNext,
  onHoy,
}: {
  fecha: string | null;
  estado?: EstadoDia;
  citas: CitaAgenda[];
  esHoy?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onHoy?: () => void;
}) {
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

  const cerrado = estado?.tipo === "cerrado";
  const franjas =
    estado && (estado.tipo === "patron" || estado.tipo === "especial") ? estado.franjas : [];

  // Ventana horaria: siempre 08:00–21:00, ampliada para cubrir franjas y citas.
  const minutosCitas = citas.map((c) => minutosDeCita(c.starts_at));
  const inicios = [...franjas.map((f) => aMinutos(f.start)), ...minutosCitas];
  const fines = [...franjas.map((f) => aMinutos(f.end)), ...minutosCitas.map((m) => m + 30)];
  const horaInicio = inicios.length ? Math.min(HORA_MIN, Math.floor(Math.min(...inicios) / 60)) : HORA_MIN;
  const horaFin = fines.length ? Math.max(HORA_MAX, Math.ceil(Math.max(...fines) / 60)) : HORA_MAX;
  const horas = Array.from({ length: horaFin - horaInicio + 1 }, (_, i) => horaInicio + i);
  const alto = (horaFin - horaInicio) * HORA_PX;
  const topDe = (min: number) => ((min - horaInicio * 60) / 60) * HORA_PX;

  // Duración de una cita: el tamaño de turno de la franja que la contiene, o 30.
  const duracionCita = (min: number) =>
    franjas.find((f) => aMinutos(f.start) <= min && min < aMinutos(f.end))?.minutes ?? 30;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      {/* Cabecera con navegación entre días */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              aria-label={t("diaAnterior")}
              className="flex size-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label={t("diaSiguiente")}
              className="flex size-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-accent"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          )}
          <h2 className="ml-1 font-heading text-xl font-bold capitalize sm:text-2xl">{fechaLarga}</h2>
        </div>
        {onHoy && !esHoy && (
          <button
            type="button"
            onClick={onHoy}
            className="inline-flex min-h-9 items-center rounded-full border border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {t("irHoy")}
          </button>
        )}
      </div>

      {/* Resumen de disponibilidad del día (evita solapar texto en el timeline) */}
      {cerrado ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
          {t("cerrado")}
          {estado?.tipo === "cerrado" && estado.note ? ` · ${estado.note}` : ""}
        </p>
      ) : franjas.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {franjas.map((f) => (
            <span
              key={`${f.start}-${f.end}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-tertiary/40 bg-tertiary/10 px-3 py-1 text-xs font-medium text-tertiary"
            >
              {t("abierto")} · {f.start}–{f.end} · {t("diariaTurnos", { min: f.minutes })}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t("diariaSinHorario")}</p>
      )}

      {citas.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">{t("sinCitasDia")}</p>
      )}

      {/* Timeline: rejilla completa de horas + franjas al fondo + citas encima */}
      <div className="relative mt-5" style={{ height: alto }}>
        {horas.map((h) => (
          <div
            key={h}
            className="absolute inset-x-0 border-t border-border/60"
            style={{ top: (h - horaInicio) * HORA_PX }}
          >
            <span className="absolute -top-2.5 left-0 w-12 pr-2 text-right text-xs tabular-nums text-muted-foreground">
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        ))}

        <div className="absolute inset-y-0 left-14 right-0">
          {/* Franjas de apertura: fondo en color, sin texto (va en el resumen) */}
          {franjas.map((f) => (
            <div
              key={`${f.start}-${f.end}`}
              aria-hidden="true"
              className="absolute inset-x-0 rounded-lg border-l-4 border-tertiary/60 bg-tertiary/10"
              style={{
                top: topDe(aMinutos(f.start)),
                height: ((aMinutos(f.end) - aMinutos(f.start)) / 60) * HORA_PX,
              }}
            />
          ))}

          {/* Citas: sobre las franjas, clicables hacia la bandeja de citas */}
          {citas.map((c) => {
            const min = minutosDeCita(c.starts_at);
            const dur = duracionCita(min);
            return (
              <Link
                key={c.id}
                href="/panel/citas"
                title={t("verEnCitas")}
                className={cn(
                  "absolute left-1 right-1 z-10 flex flex-col gap-0.5 overflow-hidden rounded-lg border border-border border-l-4 px-2.5 py-1 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  ESTADO_COLOR[c.status] ?? "border-l-primary bg-surface-container-high",
                )}
                style={{ top: topDe(min), height: Math.max((dur / 60) * HORA_PX, 44) }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-bold tabular-nums">
                    {HORA.format(new Date(c.starts_at))}
                  </span>
                  <span className="truncate text-sm font-semibold">{c.animalName ?? "—"}</span>
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                      ESTADO_CHIP[c.status] ?? "bg-surface-container-high text-foreground",
                    )}
                  >
                    {tc(ESTADO_KEY[c.status] ?? "estadoPendiente")}
                  </span>
                </div>
                {c.adopterName && (
                  <span className="truncate text-xs text-muted-foreground">{c.adopterName}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
