"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { createClient } from "@/lib/supabase/client";

export type FosterHome = {
  user_id: string;
  city: string | null;
  radius_km: number;
  condiciones: Record<string, unknown>;
  active: boolean;
};

const RADIOS = [10, 25, 50, 100];
const ESPECIES = ["dog", "cat", "other"] as const;

/** Alta y gestión del registro de casa de acogida (una pantalla, <2 min). */
export function AcogidaForm({ userId, existente }: { userId: string; existente: FosterHome | null }) {
  const t = useTranslations("acogida");
  const router = useRouter();

  const [especies, setEspecies] = useState<string[]>(
    (existente?.condiciones.especies as string[] | undefined) ?? ["dog"],
  );
  const [vivienda, setVivienda] = useState(
    (existente?.condiciones.vivienda as string | undefined) ?? "piso",
  );
  const [jardin, setJardin] = useState(Boolean(existente?.condiciones.jardin));
  const [otros, setOtros] = useState((existente?.condiciones.otros_animales as string) ?? "");
  const [notas, setNotas] = useState((existente?.condiciones.notas as string) ?? "");
  const [ciudad, setCiudad] = useState(existente?.city ?? "");
  const [radio, setRadio] = useState(existente?.radius_km ?? 25);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [consent, setConsent] = useState(Boolean(existente));
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok">("idle");
  const [error, setError] = useState<string>();

  function alternarEspecie(e: string) {
    setEspecies((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!consent) {
      setError(t("consentRequerido"));
      return;
    }
    if (!existente && !pin) {
      setError(t("faltaPin"));
      return;
    }
    setError(undefined);
    setEstado("guardando");
    const supabase = createClient();
    const fila: Record<string, unknown> = {
      user_id: userId,
      city: ciudad.trim() || null,
      radius_km: radio,
      condiciones: {
        especies,
        vivienda,
        jardin,
        otros_animales: otros.trim(),
        notas: notas.trim(),
      },
      active: true,
      consent_at: new Date().toISOString(),
    };
    if (pin) fila.location = `POINT(${pin.lng} ${pin.lat})`;
    const { error: err } = await supabase.from("foster_homes").upsert(fila);
    if (err) {
      setError(t("error"));
      setEstado("idle");
      return;
    }
    setEstado("ok");
    router.refresh();
  }

  async function setActivo(activo: boolean) {
    const supabase = createClient();
    await supabase.from("foster_homes").update({ active: activo }).eq("user_id", userId);
    router.refresh();
  }

  async function darseDeBaja() {
    if (!window.confirm(t("bajaConfirm"))) return;
    const supabase = createClient();
    await supabase.from("foster_homes").delete().eq("user_id", userId);
    router.refresh();
  }

  if (estado === "ok") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span aria-hidden className="text-6xl">
          🏡
        </span>
        <h2 className="font-heading text-2xl font-bold">{t("okTitle")}</h2>
        <p className="max-w-md text-muted-foreground">{t("okText")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {existente && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <span className="font-semibold">{t("yaRegistradoTitle")}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              existente.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
            }`}
          >
            {existente.active ? t("estadoActivo") : t("estadoPausado")}
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActivo(!existente.active)}
              className="rounded-full border border-border px-3 py-1 text-sm hover:bg-accent"
            >
              {existente.active ? t("pausar") : t("reactivar")}
            </button>
            <button
              type="button"
              onClick={darseDeBaja}
              className="rounded-full border border-destructive/40 px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
            >
              {t("baja")}
            </button>
          </span>
        </div>
      )}

      <form onSubmit={guardar} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("fEspecies")}</legend>
          <div className="flex flex-wrap gap-2">
            {ESPECIES.map((e) => (
              <label
                key={e}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium ${
                  especies.includes(e)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={especies.includes(e)}
                  onChange={() => alternarEspecie(e)}
                  className="sr-only"
                />
                {t(`especie${e.charAt(0).toUpperCase()}${e.slice(1)}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("fVivienda")}
            <select
              value={vivienda}
              onChange={(e) => setVivienda(e.target.value)}
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              <option value="piso">{t("viviendaPiso")}</option>
              <option value="casa">{t("viviendaCasa")}</option>
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={jardin}
              onChange={(e) => setJardin(e.target.checked)}
              className="size-4"
            />
            {t("fJardin")}
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fOtros")}
          <input
            value={otros}
            onChange={(e) => setOtros(e.target.value)}
            maxLength={300}
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fNotas")}
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={t("fNotasHelp")}
            className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("fCiudad")}
            <input
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              maxLength={120}
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("fRadio")}
            <select
              value={radio}
              onChange={(e) => setRadio(Number(e.target.value))}
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              {RADIOS.map((km) => (
                <option key={km} value={km}>
                  {t("radioKm", { km })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("fPin")}</p>
          <MapPinPicker value={pin ?? { lat: 40.4168, lng: -3.7038 }} onChange={(c) => setPin(c)} />
          <p className="text-xs text-muted-foreground">{t("fPinHelp")}</p>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4"
          />
          {t("consent")}
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={estado === "guardando"}
            className="rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {estado === "guardando" ? t("guardando") : t("registrar")}
          </button>
        </div>
      </form>
    </div>
  );
}
