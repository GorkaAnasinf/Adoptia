"use client";

import {
  AlertTriangle,
  Bone,
  HeartHandshake,
  Package,
  Pill,
  Shirt,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChipGroup, type ChipOption } from "@/components/ui/ChipGroup";
import { FormSection } from "@/components/ui/FormSection";
import { CATEGORIAS_NECESIDAD, type CategoriaNecesidad } from "@/lib/schemas/necesidades";
import { createClient } from "@/lib/supabase/client";

const ICONO_CAT: Record<CategoriaNecesidad, LucideIcon> = {
  comida: Bone,
  mantas_ropa: Shirt,
  medicinas: Pill,
  transporte: Truck,
  otros: Package,
};

export type Necesidad = {
  id: string;
  categoria: CategoriaNecesidad;
  descripcion: string;
  urgencia: "normal" | "urgente";
  status: "abierta" | "cubierta";
  created_at: string;
};

/** Alta o edición de una necesidad de la protectora (RLS: dueña verificada). */
export function NecesidadForm({
  shelterId,
  existente,
  onCerrar,
}: {
  shelterId: string;
  existente?: Necesidad | null;
  onCerrar?: () => void;
}) {
  const t = useTranslations("necesidades");
  const router = useRouter();
  const [categoria, setCategoria] = useState<CategoriaNecesidad>(
    existente?.categoria ?? "comida",
  );
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? "");
  const [urgente, setUrgente] = useState(existente?.urgencia === "urgente");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();

  const CATEGORIAS: ChipOption[] = CATEGORIAS_NECESIDAD.map((c) => ({
    value: c,
    label: t(`cat${c.charAt(0).toUpperCase()}${c.slice(1)}`),
    icon: ICONO_CAT[c],
  }));

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!descripcion.trim()) {
      setError(t("faltaDescripcion"));
      return;
    }
    setError(undefined);
    setGuardando(true);
    const supabase = createClient();
    const fila = {
      categoria,
      descripcion: descripcion.trim(),
      urgencia: urgente ? "urgente" : "normal",
    };
    const { error: err } = existente
      ? await supabase.from("shelter_needs").update(fila).eq("id", existente.id)
      : await supabase.from("shelter_needs").insert({ ...fila, shelter_id: shelterId });
    setGuardando(false);
    if (err) {
      setError(t("errorGuardar"));
      return;
    }
    if (!existente) {
      setDescripcion("");
      setUrgente(false);
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
          <HeartHandshake className="size-5" aria-hidden="true" />
          {t("editarTitulo")}
        </div>
      )}

      <div className="divide-y divide-border">
        <FormSection icon={HeartHandshake} title={t("secQueTitulo")} description={t("secQueDesc")}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-sm font-medium">
              {t("fCategoria")}
              <ChipGroup
                ariaLabel={t("fCategoria")}
                options={CATEGORIAS}
                value={categoria}
                onChange={(v) => setCategoria(v as CategoriaNecesidad)}
              />
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("fDescripcion")}
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t("fDescripcionHelp")}
                className="rounded-lg border border-input bg-white px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>

            <button
              type="button"
              aria-pressed={urgente}
              onClick={() => setUrgente((v) => !v)}
              className={
                urgente
                  ? "inline-flex w-fit items-center gap-2 rounded-full border border-destructive bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors"
                  : "inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-destructive/40"
              }
            >
              <AlertTriangle className="size-4" aria-hidden="true" />
              {t("fUrgente")}
            </button>
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
