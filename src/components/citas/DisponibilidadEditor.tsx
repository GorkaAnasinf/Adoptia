"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export type Franja = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  active: boolean;
};

const DURACIONES = [15, 30, 45, 60];

/** CRUD de franjas semanales de disponibilidad (RLS: solo la dueña). */
export function DisponibilidadEditor({
  shelterId,
  franjas,
}: {
  shelterId: string;
  franjas: Franja[];
}) {
  const t = useTranslations("citas");
  const router = useRouter();
  const [weekday, setWeekday] = useState(6);
  const [inicio, setInicio] = useState("10:00");
  const [fin, setFin] = useState("13:00");
  const [duracion, setDuracion] = useState(30);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(false);
    const supabase = createClient();
    const { error: err } = await supabase.from("availability_slots").insert({
      shelter_id: shelterId,
      weekday,
      start_time: inicio,
      end_time: fin,
      slot_minutes: duracion,
    });
    setGuardando(false);
    if (err) {
      setError(true);
      return;
    }
    router.refresh();
  }

  async function alternar(franja: Franja) {
    const supabase = createClient();
    await supabase
      .from("availability_slots")
      .update({ active: !franja.active })
      .eq("id", franja.id);
    router.refresh();
  }

  async function borrar(franja: Franja) {
    const supabase = createClient();
    await supabase.from("availability_slots").delete().eq("id", franja.id);
    router.refresh();
  }

  function hora(v: string) {
    return v.slice(0, 5);
  }

  return (
    <div className="flex flex-col gap-6">
      {franjas.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-muted-foreground">
          {t("sinFranjas")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {franjas.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="min-w-24 font-semibold">{t(`dia${f.weekday}`)}</span>
              <span>
                {hora(f.start_time)}–{hora(f.end_time)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("minutos", { n: f.slot_minutes })}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  f.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
                }`}
              >
                {f.active ? t("franjaActiva") : t("franjaInactiva")}
              </span>
              <span className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => alternar(f)}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:bg-accent"
                >
                  {f.active ? t("pausarFranja") : t("activarFranja")}
                </button>
                <button
                  type="button"
                  onClick={() => borrar(f)}
                  className="rounded-full border border-destructive/40 px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
                >
                  {t("borrarFranja")}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">{t("avisoCitas")}</p>

      <form
        onSubmit={crear}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-heading text-lg font-semibold">{t("nuevaFranja")}</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("franjaDia")}
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {t(`dia${d}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("franjaInicio")}
            <input
              type="time"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              required
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("franjaFin")}
            <input
              type="time"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              required
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("franjaDuracion")}
            <select
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              {DURACIONES.map((d) => (
                <option key={d} value={d}>
                  {t("minutos", { n: d })}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{t("errFranja")}</p>}
        <div>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {t("guardarFranja")}
          </button>
        </div>
      </form>
    </div>
  );
}
