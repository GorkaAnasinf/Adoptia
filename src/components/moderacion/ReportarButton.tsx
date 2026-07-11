"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { RAZONES_REPORTE, type RazonReporte } from "@/lib/schemas/moderacion";

/** Botón discreto de "reportar ficha" con formulario en línea. */
export function ReportarButton({ animalId }: { animalId: string }) {
  const t = useTranslations("moderacion");
  const [abierto, setAbierto] = useState(false);
  const [razon, setRazon] = useState<RazonReporte>("contenido_inapropiado");
  const [detalles, setDetalles] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "login" | "limite" | "error">(
    "idle",
  );

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const res = await fetch("/api/reportes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ animal_id: animalId, reason: razon, details: detalles || undefined }),
      });
      if (res.status === 201) setEstado("ok");
      else if (res.status === 401) setEstado("login");
      else if (res.status === 429) setEstado("limite");
      else setEstado("error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return <p className="text-sm text-muted-foreground">{t("reporteOk")}</p>;
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <Flag className="size-3.5" aria-hidden="true" />
        {t("reportar")}
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="flex max-w-sm flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <p className="font-medium">{t("reportarTitle")}</p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("razon")}
        <select
          value={razon}
          onChange={(e) => setRazon(e.target.value as RazonReporte)}
          className="rounded-lg border border-input bg-white px-3 py-2"
        >
          {RAZONES_REPORTE.map((r) => (
            <option key={r} value={r}>
              {t(`razon${r.charAt(0).toUpperCase()}${r.slice(1)}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("detalles")}
        <textarea
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
          rows={2}
          maxLength={2000}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </label>
      {estado === "login" && <p className="text-sm text-destructive">{t("reporteLogin")}</p>}
      {estado === "limite" && <p className="text-sm text-destructive">{t("reporteLimite")}</p>}
      {estado === "error" && <p className="text-sm text-destructive">{t("reporteError")}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("enviando") : t("enviarReporte")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent"
        >
          {t("cancelar")}
        </button>
      </div>
    </form>
  );
}
