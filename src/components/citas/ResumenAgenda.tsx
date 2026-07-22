"use client";

import { useTranslations } from "next-intl";

const YMD = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Madrid",
});
const HORA = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});
const DIA_MES = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
});

/** ISO "YYYY-MM-DD" del día siguiente a `iso`. */
function manana(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Tarjetas de resumen de la agenda (FEATURE-055): capacidad (huecos libres),
 * citas pendientes de hoy y próxima disponibilidad. Datos calculados en el
 * servidor; aquí solo se formatean.
 */
export function ResumenAgenda({
  capacidad,
  citasPendientesHoy,
  proximaISO,
  hoyISO,
}: {
  capacidad: number;
  citasPendientesHoy: number;
  proximaISO: string | null;
  hoyISO: string;
}) {
  const t = useTranslations("agenda");

  function proximaTexto(): string {
    if (!proximaISO) return t("sinDatos");
    const d = new Date(proximaISO);
    const dia = YMD.format(d);
    const hora = HORA.format(d);
    if (dia === hoyISO) return t("proximaHoy", { hora });
    if (dia === manana(hoyISO)) return t("proximaManana", { hora });
    return `${DIA_MES.format(d)} ${hora}`;
  }

  const tarjetas = [
    { etiqueta: t("resumenCapacidad"), valor: t("resumenHuecos", { n: capacidad }) },
    { etiqueta: t("resumenCitasPendientes"), valor: t("resumenCitasHoy", { n: citasPendientesHoy }) },
    { etiqueta: t("resumenProxima"), valor: proximaTexto() },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tarjetas.map((c) => (
        <div key={c.etiqueta} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {c.etiqueta}
          </p>
          <p className="mt-1 font-heading text-xl font-bold">{c.valor}</p>
        </div>
      ))}
    </div>
  );
}
