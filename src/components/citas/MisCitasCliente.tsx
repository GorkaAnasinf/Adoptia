"use client";

import { CalendarCheck, Check, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CancelarCitaButton } from "@/components/citas/CancelarCitaButton";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export type CitaVista = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "done" | "no_show";
  starts_at: string;
  cancel_reason: string | null;
  animalName: string | null;
  animalSlug: string | null;
  portada: string | null;
  shelterName: string | null;
  shelterSlug: string | null;
};

const CLAVE_ESTADO: Record<CitaVista["status"], string> = {
  pending: "estadoPendiente",
  confirmed: "estadoConfirmada",
  cancelled: "estadoCancelada",
  done: "estadoRealizada",
  no_show: "estadoNoShow",
};
const BADGE_ESTADO: Record<CitaVista["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-700",
  done: "bg-sky-100 text-sky-800",
  no_show: "bg-rose-100 text-rose-800",
};

const ACCION_BASE =
  "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const ACCION_OUTLINE = `${ACCION_BASE} border border-border hover:bg-accent`;
const ACCION_GHOST = `${ACCION_BASE} px-4 text-primary hover:bg-primary/5`;

function esProxima(c: CitaVista): boolean {
  return ["pending", "confirmed"].includes(c.status) && Date.now() < new Date(c.starts_at).getTime();
}

/** Clave de día en horario local: y-m-d. Sirve para agrupar y comparar. */
function claveDia(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function MisCitasCliente({ citas }: { citas: CitaVista[] }) {
  const t = useTranslations("account");
  const format = useFormatter();

  const proximas = useMemo(
    () =>
      citas
        .filter(esProxima)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [citas],
  );
  const pasadas = useMemo(
    () =>
      citas
        .filter((c) => !esProxima(c))
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()),
    [citas],
  );

  const [tab, setTab] = useState<"proximas" | "pasadas">(
    proximas.length > 0 ? "proximas" : "pasadas",
  );
  const [dia, setDia] = useState<string | null>(null);
  const primerMes = proximas[0] ? new Date(proximas[0].starts_at) : new Date();
  const [mes, setMes] = useState(() => new Date(primerMes.getFullYear(), primerMes.getMonth(), 1));

  const diasConCita = useMemo(
    () => new Set(proximas.map((c) => claveDia(new Date(c.starts_at)))),
    [proximas],
  );

  const lista =
    tab === "proximas"
      ? proximas.filter((c) => !dia || claveDia(new Date(c.starts_at)) === dia)
      : pasadas;

  function seleccionarDia(clave: string) {
    setTab("proximas");
    setDia((actual) => (actual === clave ? null : clave));
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Columna principal: pestañas + lista */}
        <div>
          <div role="tablist" className="flex gap-2 border-b border-border">
            <TabBoton activa={tab === "proximas"} onClick={() => { setTab("proximas"); setDia(null); }}>
              {t("citasProximas")}
            </TabBoton>
            <TabBoton activa={tab === "pasadas"} onClick={() => { setTab("pasadas"); setDia(null); }}>
              {t("citasPasadas")}
            </TabBoton>
          </div>

          {tab === "proximas" && dia && (
            <FiltroDia
              texto={t("citasFiltroTitulo", { fecha: etiquetaDia(dia) })}
              quitar={t("citasQuitarFiltro")}
              onQuitar={() => setDia(null)}
            />
          )}

          {lista.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
              {tab === "pasadas"
                ? t("citasSinPasadas")
                : dia
                  ? t("citasSinCitasEseDia")
                  : t("citasSinProximas")}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {lista.map((c, i) => (
                <li key={c.id}>
                  <Reveal delayMs={Math.min(i, 3) * 80}>
                    <CitaCard cita={c} apagada={tab === "pasadas"} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Columna lateral: calendario + consejos */}
        <div className="flex flex-col gap-6">
          <Calendario
            mes={mes}
            diasConCita={diasConCita}
            diaSeleccionado={dia}
            onDia={seleccionarDia}
            onMes={setMes}
          />
          {proximas.length > 0 && <Consejos />}
        </div>
      </div>

      {/* Ayuda */}
      <Reveal className="mt-10">
        <aside className="flex flex-col gap-4 rounded-2xl bg-surface-container p-6 sm:flex-row sm:items-center sm:gap-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <CalendarCheck className="size-7" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-semibold text-secondary">
              {t("citasAyudaTitulo")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("citasAyudaTexto")}</p>
          </div>
          <Link
            href="/guias"
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-secondary/40 px-5 text-sm font-semibold text-secondary hover:bg-secondary/10"
          >
            {t("citasAyudaCta")}
          </Link>
        </aside>
      </Reveal>
    </>
  );

  /** Etiqueta legible de una clave de día para el chip de filtro. */
  function etiquetaDia(clave: string): string {
    const [y, m, d] = clave.split("-").map(Number);
    return format.dateTime(new Date(y, m, d), { day: "numeric", month: "long" });
  }
}

function TabBoton({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
        activa
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FiltroDia({
  texto,
  quitar,
  onQuitar,
}: {
  texto: string;
  quitar: string;
  onQuitar: () => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-2 text-sm">
      <span className="font-medium text-secondary">{texto}</span>
      <button
        type="button"
        onClick={onQuitar}
        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 font-semibold text-muted-foreground hover:bg-accent"
      >
        <X className="size-3.5" aria-hidden="true" />
        {quitar}
      </button>
    </div>
  );
}

function Consejos() {
  const t = useTranslations("account");
  return (
    <aside className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
      <h2 className="font-heading text-lg font-semibold text-primary">{t("citasConsejosTitulo")}</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-on-surface-variant">
        {[t("citasConsejo1"), t("citasConsejo2"), t("citasConsejo3")].map((consejo) => (
          <li key={consejo} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{consejo}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function CitaCard({ cita, apagada }: { cita: CitaVista; apagada: boolean }) {
  const t = useTranslations("account");
  const tCitas = useTranslations("citas");
  const format = useFormatter();
  const activa = esProxima(cita);
  const inicio = new Date(cita.starts_at);

  return (
    <article
      className={cn(
        "flex h-full overflow-hidden rounded-2xl border border-border",
        apagada ? "bg-muted/40" : "bg-card shadow-soft",
      )}
    >
      <div className="relative w-28 shrink-0 bg-muted sm:w-32">
        {cita.portada ? (
          <Image
            src={cita.portada}
            alt=""
            fill
            sizes="128px"
            className={cn("object-cover", apagada && "grayscale")}
          />
        ) : (
          <span aria-hidden="true" className="flex h-full items-center justify-center text-3xl">
            🐾
          </span>
        )}
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex w-24 justify-center rounded-full px-2 py-0.5 text-center text-xs font-semibold shadow-sm ring-1 ring-black/5",
            BADGE_ESTADO[cita.status],
          )}
        >
          {tCitas(CLAVE_ESTADO[cita.status])}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-0.5">
          {cita.animalSlug ? (
            <Link
              href={`/animales/${cita.animalSlug}`}
              className="font-heading text-xl font-semibold hover:underline"
            >
              {cita.animalName}
            </Link>
          ) : (
            <span className="font-heading text-xl font-semibold">—</span>
          )}
          {cita.shelterSlug && cita.shelterName && (
            <Link
              href={`/protectoras/${cita.shelterSlug}`}
              className="w-fit text-sm text-muted-foreground hover:underline"
            >
              {cita.shelterName}
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-secondary">
          <span className="inline-flex items-center gap-1.5 capitalize">
            <CalendarCheck className="size-4" aria-hidden="true" />
            {format.dateTime(inicio, {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "Europe/Madrid",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            {format.dateTime(inicio, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}
          </span>
        </div>

        {cita.cancel_reason && <p className="text-sm text-muted-foreground">{cita.cancel_reason}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {activa && <CancelarCitaButton citaId={cita.id} />}
          {cita.shelterSlug && (
            <Link href={`/protectoras/${cita.shelterSlug}`} className={ACCION_OUTLINE}>
              {t("solicitudContactarRefugio")}
            </Link>
          )}
          {cita.animalSlug && (
            <Link href={`/animales/${cita.animalSlug}`} className={ACCION_GHOST}>
              {t("solicitudVerDetalles")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Rejilla mensual con lunes primero; marca hoy y los días con cita programada. */
function Calendario({
  mes,
  diasConCita,
  diaSeleccionado,
  onDia,
  onMes,
}: {
  mes: Date;
  diasConCita: Set<string>;
  diaSeleccionado: string | null;
  onDia: (clave: string) => void;
  onMes: (mes: Date) => void;
}) {
  const t = useTranslations("account");
  const tCitas = useTranslations("citas");
  const format = useFormatter();

  const anio = mes.getFullYear();
  const mesNum = mes.getMonth();
  const diasEnMes = new Date(anio, mesNum + 1, 0).getDate();
  // getDay(): 0=Domingo. Queremos lunes primero → offset 0..6.
  const offset = (new Date(anio, mesNum, 1).getDay() + 6) % 7;
  const hoy = claveDia(new Date());

  const celdas: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  // Cabeceras Lu..Do a partir de los nombres localizados (dia1..dia6, dia0).
  const cabeceras = [1, 2, 3, 4, 5, 6, 0].map((n) => tCitas(`dia${n}`).slice(0, 2));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="font-heading font-semibold capitalize">
          {format.dateTime(mes, { month: "long", year: "numeric" })}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label={t("citasMesAnterior")}
            onClick={() => onMes(new Date(anio, mesNum - 1, 1))}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={t("citasMesSiguiente")}
            onClick={() => onMes(new Date(anio, mesNum + 1, 1))}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
        {cabeceras.map((c, i) => (
          <span key={i} className="uppercase">
            {c}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
        {celdas.map((n, i) => {
          if (n === null) return <span key={`v${i}`} />;
          const clave = `${anio}-${mesNum}-${n}`;
          const conCita = diasConCita.has(clave);
          const esHoy = clave === hoy;
          const seleccionado = clave === diaSeleccionado;
          return (
            <button
              key={clave}
              type="button"
              disabled={!conCita}
              aria-pressed={seleccionado}
              onClick={() => onDia(clave)}
              className={cn(
                "relative mx-auto flex size-9 items-center justify-center rounded-full transition-colors",
                seleccionado
                  ? "bg-primary font-semibold text-primary-foreground"
                  : esHoy
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-foreground",
                conCita ? "cursor-pointer hover:bg-primary/15" : "text-muted-foreground/50",
              )}
            >
              {n}
              {conCita && !seleccionado && (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary/40" aria-hidden="true" />
          {t("citasCalendarioHoy")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          {t("citasCalendarioProgramada")}
        </span>
      </div>
    </div>
  );
}
