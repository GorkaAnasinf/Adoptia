"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CATEGORIAS_NECESIDAD, type CategoriaNecesidad } from "@/lib/schemas/necesidades";
import { createClient } from "@/lib/supabase/client";

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
    <form onSubmit={guardar} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fCategoria")}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaNecesidad)}
            className="rounded-lg border border-input bg-white px-3 py-2"
          >
            {CATEGORIAS_NECESIDAD.map((c) => (
              <option key={c} value={c}>
                {t(`cat${c.charAt(0).toUpperCase()}${c.slice(1)}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={urgente}
            onChange={(e) => setUrgente(e.target.checked)}
            className="size-4"
          />
          {t("fUrgente")}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("fDescripcion")}
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t("fDescripcionHelp")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </label>

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
