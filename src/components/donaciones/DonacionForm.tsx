"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { CATEGORIAS_DONACION, type CategoriaDonacion } from "@/lib/schemas/donaciones";
import { createClient } from "@/lib/supabase/client";

export type Donacion = {
  id: string;
  categoria: CategoriaDonacion;
  descripcion: string;
  city: string | null;
  radius_km: number;
  status: "abierta" | "entregada" | "caducada";
  renovada_at: string;
  created_at: string;
};

/**
 * Alta o edición de una oferta de donación (FEATURE-032). El pin se redondea
 * ~200 m en BD: la dirección exacta nunca se guarda. En edición el pin es
 * opcional (sin tocarlo, se conserva la zona anterior).
 */
export function DonacionForm({
  userId,
  existente,
  onCerrar,
}: {
  userId: string;
  existente?: Donacion | null;
  onCerrar?: () => void;
}) {
  const t = useTranslations("donaciones");
  const router = useRouter();
  const [categoria, setCategoria] = useState<CategoriaDonacion>(existente?.categoria ?? "comida");
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? "");
  const [city, setCity] = useState(existente?.city ?? "");
  const [radio, setRadio] = useState(existente?.radius_km ?? 25);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!descripcion.trim()) {
      setError(t("faltaDescripcion"));
      return;
    }
    if (!city.trim()) {
      setError(t("faltaCiudad"));
      return;
    }
    if (!existente && !pin) {
      setError(t("faltaPin"));
      return;
    }
    setError(undefined);
    setGuardando(true);
    const supabase = createClient();
    const fila: Record<string, unknown> = {
      categoria,
      descripcion: descripcion.trim(),
      city: city.trim(),
      radius_km: radio,
    };
    if (pin) fila.location = `POINT(${pin.lng} ${pin.lat})`;
    const { error: err } = existente
      ? await supabase.from("donation_offers").update(fila).eq("id", existente.id)
      : await supabase.from("donation_offers").insert({ ...fila, user_id: userId });
    setGuardando(false);
    if (err) {
      setError(err.message.includes("donation_offers_limit") ? t("errorLimite") : t("errorGuardar"));
      return;
    }
    if (!existente) {
      setDescripcion("");
      setPin(null);
    }
    onCerrar?.();
    router.refresh();
  }

  return (
    <form
      onSubmit={guardar}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fCategoria")}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaDonacion)}
            className="rounded-lg border border-input bg-white px-3 py-2"
          >
            {CATEGORIAS_DONACION.map((c) => (
              <option key={c} value={c}>
                {t(`cat${c.charAt(0).toUpperCase()}${c.slice(1)}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fCiudad")}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={120}
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("fDescripcion")}
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder={t("fDescripcionHelp")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("fRadio")}
        <input
          type="number"
          min={1}
          max={200}
          value={radio}
          onChange={(e) => setRadio(Number(e.target.value))}
          className="w-32 rounded-lg border border-input bg-white px-3 py-2"
        />
        <span className="text-xs font-normal text-muted-foreground">{t("fRadioHelp")}</span>
      </label>

      <div className="flex flex-col gap-1 text-sm font-medium">
        {t("fPin")}
        <MapPinPicker value={pin ?? { lat: 40.4168, lng: -3.7038 }} onChange={(c) => setPin(c)} />
        <span className="text-xs font-normal text-muted-foreground">{t("fPinHelp")}</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? t("guardando") : existente ? t("guardar") : t("publicar")}
        </button>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent"
          >
            {t("cancelarEdicion")}
          </button>
        )}
      </div>
    </form>
  );
}
