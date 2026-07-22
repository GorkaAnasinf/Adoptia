"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { rangoCierreSchema, type RangoCierreInput } from "@/lib/schemas/agenda";

const CLAVE_ERROR: Record<string, string> = {
  rango_invertido: "rangoInvertido",
  rango_largo: "rangoLargo",
  fecha_invalida: "rangoInvertido",
  nota_larga: "rangoLargo",
};

/**
 * Diálogo de cierre por rango de fechas (FEATURE-054). Valida con
 * `rangoCierreSchema` y solo emite `onConfirmar` con datos válidos.
 */
export function RangoCierreDialog({
  abierto,
  guardando,
  errorGuardar = false,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  guardando: boolean;
  errorGuardar?: boolean;
  onConfirmar: (datos: RangoCierreInput) => void;
  onCerrar: () => void;
}) {
  const t = useTranslations("agenda");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!abierto) return null;

  function confirmar() {
    const parsed = rangoCierreSchema.safeParse({
      desde,
      hasta,
      nota: nota.trim() || undefined,
    });
    if (!parsed.success) {
      const code = parsed.error.issues[0]?.message ?? "rango_invertido";
      setError(CLAVE_ERROR[code] ?? "rangoInvertido");
      return;
    }
    setError(null);
    onConfirmar(parsed.data);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("rangoTitulo")}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-heading text-xl font-bold">{t("rangoTitulo")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("rangoDesde")}
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setError(null);
              }}
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("rangoHasta")}
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setError(null);
              }}
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium">
          {t("rangoNota")}
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
        </label>
        {error && <p className="mt-3 text-sm text-destructive">{t(error)}</p>}
        {errorGuardar && <p className="mt-3 text-sm text-destructive">{t("errorBatch")}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            {t("cancelar")}
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={guardando}
            className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {guardando ? t("guardando") : t("rangoConfirmar")}
          </button>
        </div>
      </div>
    </div>
  );
}
