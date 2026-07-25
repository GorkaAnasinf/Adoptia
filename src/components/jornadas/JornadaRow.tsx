"use client";

import { CalendarClock, MapPin, PawPrint, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export type JornadaResumen = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: "draft" | "published" | "cancelled" | "finished";
  city: string | null;
  animal_count: number;
  attendee_count: number;
};

const ESTADO_ESTILO: Record<JornadaResumen["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  finished: "bg-accent text-accent-foreground",
};

/** Fila de una jornada en el panel de la protectora (FEATURE-062/064). */
export function JornadaRow({ jornada }: { jornada: JornadaResumen }) {
  const t = useTranslations("jornadas");
  const router = useRouter();
  const [cancelando, setCancelando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [guardandoFin, setGuardandoFin] = useState(false);
  const [adopciones, setAdopciones] = useState("");
  const [asistentes, setAsistentes] = useState(String(jornada.attendee_count));

  const fecha = new Date(jornada.starts_at).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Se puede finalizar una jornada publicada cuya hora de fin ya pasó.
  const finalizable = jornada.status === "published" && Date.parse(jornada.ends_at) < Date.now();

  async function cancelar() {
    setCancelando(true);
    const supabase = createClient();
    await supabase.from("events").update({ status: "cancelled" }).eq("id", jornada.id);
    setCancelando(false);
    router.refresh();
  }

  async function guardarResultado() {
    setGuardandoFin(true);
    const supabase = createClient();
    const nAdop = adopciones.trim() === "" ? null : Math.max(0, Math.trunc(Number(adopciones)));
    const nAsis = asistentes.trim() === "" ? null : Math.max(0, Math.trunc(Number(asistentes)));
    await supabase
      .from("events")
      .update({ status: "finished", adoptions_count: nAdop, attended_count: nAsis })
      .eq("id", jornada.id);
    setGuardandoFin(false);
    setFinalizando(false);
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-lg font-semibold">{jornada.title}</h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_ESTILO[jornada.status]}`}
            >
              {t(`estado${jornada.status.charAt(0).toUpperCase()}${jornada.status.slice(1)}`)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-4" aria-hidden="true" />
              {fecha}
            </span>
            {jornada.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {jornada.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <PawPrint className="size-4" aria-hidden="true" />
              {t("rowAnimales", { count: jornada.animal_count })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-4" aria-hidden="true" />
              {t("rowAsistentes", { count: jornada.attendee_count })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {jornada.status === "published" && (
            <Link
              href={`/jornadas/${jornada.id}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold hover:bg-accent"
            >
              {t("rowVer")}
            </Link>
          )}
          {finalizable && (
            <button
              type="button"
              onClick={() => setFinalizando((v) => !v)}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("finalizarJornada")}
            </button>
          )}
          <Link
            href={`/panel/jornadas/${jornada.id}`}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold hover:bg-accent"
          >
            {t("rowEditar")}
          </Link>
          {(jornada.status === "published" || jornada.status === "draft") && (
            <button
              type="button"
              onClick={cancelar}
              disabled={cancelando}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {t("rowCancelarJornada")}
            </button>
          )}
        </div>
      </div>

      {finalizando && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void guardarResultado();
          }}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface-container-low p-4"
        >
          <p className="font-heading text-sm font-semibold">{t("finalizarTitulo")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="fin-adopciones" className="text-sm font-medium">
                {t("fAdopciones")}
              </label>
              <input
                id="fin-adopciones"
                type="number"
                min={0}
                value={adopciones}
                onChange={(e) => setAdopciones(e.target.value)}
                aria-describedby="fin-adop-help"
                className="rounded-lg border border-input bg-white px-3 py-2 font-normal"
              />
              <span id="fin-adop-help" className="text-xs font-normal text-muted-foreground">
                {t("fAdopcionesHelp")}
              </span>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("fAsistentes")}
              <input
                type="number"
                min={0}
                value={asistentes}
                onChange={(e) => setAsistentes(e.target.value)}
                className="rounded-lg border border-input bg-white px-3 py-2 font-normal"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={guardandoFin}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {guardandoFin ? t("finalizando") : t("finalizarConfirmar")}
            </button>
            <button
              type="button"
              onClick={() => setFinalizando(false)}
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-accent"
            >
              {t("cancelarFinalizar")}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
