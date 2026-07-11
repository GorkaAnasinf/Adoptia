"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

/** Acciones de admin sobre un reporte: despublicar la ficha, revisar, descartar. */
export function ReporteAcciones({
  reporteId,
  animalId,
  publicada,
}: {
  reporteId: string;
  animalId: string;
  publicada: boolean;
}) {
  const t = useTranslations("moderacion");
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  async function llamar(url: string, body: unknown) {
    setEnviando(true);
    setError(false);
    try {
      const res = await fetch(url, {
        method: url.includes("/reportes/") ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("accion_fallida");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  async function despublicar() {
    if (!motivo.trim()) return;
    // Despublica la ficha Y marca el reporte como revisado
    await llamar(`/api/admin/animales/${animalId}/moderar`, {
      accion: "unpublish",
      motivo: motivo.trim(),
    });
    await llamar(`/api/admin/reportes/${reporteId}`, { accion: "reviewed" });
  }

  if (pidiendoMotivo) {
    return (
      <div className="flex w-full flex-col gap-2">
        <label className="text-sm font-medium" htmlFor={`motivo-${reporteId}`}>
          {t("motivoDespublicar")}
        </label>
        <textarea
          id={`motivo-${reporteId}`}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-destructive">{t("errorAccion")}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={despublicar}
            disabled={enviando || !motivo.trim()}
            className="rounded-full bg-destructive px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {t("despublicar")}
          </button>
          <button
            type="button"
            onClick={() => setPidiendoMotivo(false)}
            className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent"
          >
            {t("cancelar")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {publicada && (
        <button
          type="button"
          onClick={() => setPidiendoMotivo(true)}
          disabled={enviando}
          className="rounded-full border border-destructive/40 px-4 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {t("despublicar")}
        </button>
      )}
      <button
        type="button"
        onClick={() => llamar(`/api/admin/reportes/${reporteId}`, { accion: "reviewed" })}
        disabled={enviando}
        className="rounded-full border border-secondary/50 px-4 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/10 disabled:opacity-50"
      >
        {t("marcarRevisado")}
      </button>
      <button
        type="button"
        onClick={() => llamar(`/api/admin/reportes/${reporteId}`, { accion: "dismissed" })}
        disabled={enviando}
        className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
      >
        {t("descartar")}
      </button>
      {error && <p className="text-xs text-destructive">{t("errorAccion")}</p>}
    </div>
  );
}
