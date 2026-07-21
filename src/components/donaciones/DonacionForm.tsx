"use client";

import { Blocks, Bone, Gift, MapPin, Package, Shirt, ShoppingBag, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { ChipGroup, type ChipOption } from "@/components/ui/ChipGroup";
import { FormSection } from "@/components/ui/FormSection";
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

const ICONO_CAT: Record<CategoriaDonacion, LucideIcon> = {
  comida: Bone,
  accesorios: ShoppingBag,
  mantas_ropa: Shirt,
  juguetes: Blocks,
  otros: Package,
};

const RADIOS = [10, 25, 50, 100];

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

  const CATEGORIAS: ChipOption[] = CATEGORIAS_DONACION.map((c) => ({
    value: c,
    label: t(`cat${c.charAt(0).toUpperCase()}${c.slice(1)}`),
    icon: ICONO_CAT[c],
  }));

  // Presets de distancia + el valor actual de la oferta si no es un preset,
  // para no pisar radios existentes al editar.
  const radios = RADIOS.includes(radio) ? RADIOS : [...RADIOS, radio].sort((a, b) => a - b);

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
      className="rounded-2xl border border-border bg-card px-5 shadow-soft sm:px-8"
    >
      {existente && (
        <div className="flex items-center gap-2 pt-6 font-heading text-lg font-semibold text-primary">
          <Gift className="size-5" aria-hidden="true" />
          {t("editarTitulo")}
        </div>
      )}

      <div className="divide-y divide-border">
        <FormSection icon={Gift} title={t("secQueTitulo")} description={t("secQueDesc")}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-sm font-medium">
              {t("fCategoria")}
              <ChipGroup
                ariaLabel={t("fCategoria")}
                options={CATEGORIAS}
                value={categoria}
                onChange={(v) => setCategoria(v as CategoriaDonacion)}
              />
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("fDescripcion")}
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder={t("fDescripcionHelp")}
                className="rounded-lg border border-input bg-white px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
          </div>
        </FormSection>

        <FormSection icon={MapPin} title={t("secDondeTitulo")} description={t("secDondeDesc")}>
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fCiudad")}
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={120}
                  className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
              <div className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fRadio")}
                <ChipGroup
                  ariaLabel={t("fRadio")}
                  options={radios.map((km) => ({ value: String(km), label: t("radioKm", { km }) }))}
                  value={String(radio)}
                  onChange={(v) => setRadio(Number(v))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("fPin")}</p>
              <MapPinPicker value={pin ?? { lat: 40.4168, lng: -3.7038 }} onChange={(c) => setPin(c)} />
              <span className="text-xs text-muted-foreground">{t("fPinHelp")}</span>
            </div>
          </div>
        </FormSection>

        <div className="flex flex-col gap-4 py-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {guardando ? t("guardando") : existente ? t("guardar") : t("publicar")}
            </button>
            {onCerrar && (
              <button
                type="button"
                onClick={onCerrar}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-semibold hover:bg-accent"
              >
                {t("cancelarEdicion")}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
