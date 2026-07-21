"use client";

import { CalendarClock, Cat, Dog, Home, MapPin, PawPrint, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { ChipGroup, type ChipOption } from "@/components/ui/ChipGroup";
import { FormSection } from "@/components/ui/FormSection";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { createClient } from "@/lib/supabase/client";

export type FosterHome = {
  user_id: string;
  city: string | null;
  radius_km: number;
  condiciones: Record<string, unknown>;
  active: boolean;
};

const RADIOS = [10, 25, 50, 100];

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

  const ESPECIES: ChipOption[] = [
    { value: "dog", label: t("especieDog"), icon: Dog },
    { value: "cat", label: t("especieCat"), icon: Cat },
    { value: "other", label: t("especieOther"), icon: PawPrint },
  ];

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
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-16 text-center shadow-soft">
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
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-soft">
          <span
            className={`size-2.5 shrink-0 rounded-full ${existente.active ? "bg-emerald-500" : "bg-stone-400"}`}
            aria-hidden="true"
          />
          <span className="font-heading font-semibold">{t("yaRegistradoTitle")}</span>
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
              className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-accent"
            >
              {existente.active ? t("pausar") : t("reactivar")}
            </button>
            <button
              type="button"
              onClick={darseDeBaja}
              className="inline-flex min-h-11 items-center rounded-full border border-destructive/40 px-5 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              {t("baja")}
            </button>
          </span>
        </div>
      )}

      <form
        onSubmit={guardar}
        className="rounded-2xl border border-border bg-card px-5 shadow-soft sm:px-8"
      >
        <div className="divide-y divide-border">
          <FormSection icon={PawPrint} title={t("fEspecies")} description={t("secAcogerDesc")}>
            <ChipGroup
              multiple
              ariaLabel={t("fEspecies")}
              options={ESPECIES}
              value={especies}
              onChange={setEspecies}
            />
          </FormSection>

          <FormSection icon={Home} title={t("secViviendaTitle")} description={t("secViviendaDesc")}>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fVivienda")}
                <SegmentedControl
                  ariaLabel={t("fVivienda")}
                  options={[
                    { value: "piso", label: t("viviendaPiso") },
                    { value: "casa", label: t("viviendaCasa") },
                  ]}
                  value={vivienda}
                  onChange={setVivienda}
                />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={jardin}
                  onChange={(e) => setJardin(e.target.checked)}
                  className="size-4 accent-primary"
                />
                {t("fJardin")}
              </label>
            </div>
          </FormSection>

          <FormSection
            icon={Users}
            title={t("secConvivenciaTitle")}
            description={t("secConvivenciaDesc")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fOtros")}
                <input
                  value={otros}
                  onChange={(e) => setOtros(e.target.value)}
                  maxLength={300}
                  className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fNotas")}
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder={t("fNotasHelp")}
                  className="rounded-lg border border-input bg-white px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
            </div>
          </FormSection>

          <FormSection icon={MapPin} title={t("secZonaTitle")} description={t("secZonaDesc")}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  {t("fCiudad")}
                  <input
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    maxLength={120}
                    className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </label>
                <div className="flex flex-col gap-1.5 text-sm font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
                    {t("fRadio")}
                  </span>
                  <ChipGroup
                    ariaLabel={t("fRadio")}
                    options={RADIOS.map((km) => ({ value: String(km), label: t("radioKm", { km }) }))}
                    value={String(radio)}
                    onChange={(v) => setRadio(Number(v))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">{t("fPin")}</p>
                <MapPinPicker
                  value={pin ?? { lat: 40.4168, lng: -3.7038 }}
                  onChange={(c) => setPin(c)}
                />
                <p className="text-xs text-muted-foreground">{t("fPinHelp")}</p>
              </div>
            </div>
          </FormSection>

          <div className="flex flex-col gap-4 py-6">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              {t("consent")}
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={estado === "guardando"}
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {estado === "guardando" ? t("guardando") : t("registrar")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
