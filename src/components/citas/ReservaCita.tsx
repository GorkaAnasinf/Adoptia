"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export type Hueco = { starts_at: string; ends_at: string };

type Props = {
  requestId: string;
  huecos: Hueco[];
};

const TZ = "Europe/Madrid";

/** Selector de hueco: tira de días + pills de hora + confirmación. */
export function ReservaCita({ requestId, huecos }: Props) {
  const t = useTranslations("citas");
  const format = useFormatter();
  const router = useRouter();

  const dias = useMemo(() => {
    const porDia = new Map<string, Hueco[]>();
    for (const h of huecos) {
      const clave = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(h.starts_at));
      porDia.set(clave, [...(porDia.get(clave) ?? []), h]);
    }
    return [...porDia.entries()];
  }, [huecos]);

  const [diaActivo, setDiaActivo] = useState(0);
  const [seleccion, setSeleccion] = useState<Hueco | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<"ok" | "slot_taken" | "error" | null>(null);

  async function confirmar() {
    if (!seleccion) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ request_id: requestId, starts_at: seleccion.starts_at }),
      });
      if (res.status === 201) {
        setResultado("ok");
      } else if (res.status === 409) {
        setResultado("slot_taken");
        setSeleccion(null);
        router.refresh();
      } else {
        setResultado("error");
      }
    } catch {
      setResultado("error");
    } finally {
      setEnviando(false);
    }
  }

  if (resultado === "ok") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span aria-hidden="true" className="text-6xl">
          🗓️
        </span>
        <h2 className="font-heading text-2xl font-bold">{t("reservadaTitle")}</h2>
        <p className="max-w-md text-muted-foreground">{t("reservadaBody")}</p>
        <Button asChild size="lg">
          <Link href="/mi-cuenta/solicitudes">{t("verMisSolicitudes")}</Link>
        </Button>
      </div>
    );
  }

  if (dias.length === 0) {
    return <p className="py-8 text-muted-foreground">{t("sinHuecos")}</p>;
  }

  const [, huecosDelDia] = dias[Math.min(diaActivo, dias.length - 1)];

  return (
    <div className="flex flex-col gap-6">
      {/* Tira de días */}
      <div role="tablist" aria-label={t("franjaDia")} className="flex gap-2 overflow-x-auto pb-1">
        {dias.map(([clave, hs], i) => {
          const fecha = new Date(hs[0].starts_at);
          return (
            <button
              key={clave}
              role="tab"
              aria-selected={i === diaActivo}
              onClick={() => {
                setDiaActivo(i);
                setSeleccion(null);
              }}
              className={`flex min-w-20 flex-col items-center rounded-2xl border px-4 py-2.5 text-sm ${
                i === diaActivo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span className="font-semibold capitalize">
                {format.dateTime(fecha, { weekday: "short", timeZone: TZ })}
              </span>
              <span>{format.dateTime(fecha, { day: "numeric", month: "short", timeZone: TZ })}</span>
            </button>
          );
        })}
      </div>

      {/* Pills de hora */}
      <div className="flex flex-wrap gap-2">
        {huecosDelDia.map((h) => {
          const activo = seleccion?.starts_at === h.starts_at;
          return (
            <button
              key={h.starts_at}
              type="button"
              aria-pressed={activo}
              onClick={() => setSeleccion(h)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                activo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {format.dateTime(new Date(h.starts_at), {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: TZ,
              })}
            </button>
          );
        })}
      </div>

      {resultado === "slot_taken" && <p className="text-sm text-destructive">{t("huecoOcupado")}</p>}
      {resultado === "error" && <p className="text-sm text-destructive">{t("errorReserva")}</p>}

      <div>
        <Button size="lg" disabled={!seleccion || enviando} onClick={confirmar}>
          {enviando ? t("reservando") : t("confirmar")}
        </Button>
      </div>
    </div>
  );
}
