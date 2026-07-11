"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

/** Cancela una cita (adoptante o protectora) pidiendo el motivo en línea. */
export function CancelarCitaButton({ citaId }: { citaId: string }) {
  const t = useTranslations("citas");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  async function cancelar() {
    if (!motivo.trim()) {
      setError(t("motivoRequerido"));
      return;
    }
    setEnviando(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/citas/${citaId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accion: "cancel", motivo: motivo.trim() }),
      });
      if (!res.ok) throw new Error("cancel_failed");
      setAbierto(false);
      router.refresh();
    } catch {
      setError(t("errorCancelar"));
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full border border-destructive/40 px-4 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
      >
        {t("cancelarCita")}
      </button>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <label className="text-sm font-medium" htmlFor={`motivo-${citaId}`}>
        {t("motivoCancelacion")}
      </label>
      <textarea
        id={`motivo-${citaId}`}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={2}
        className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancelar}
          disabled={enviando}
          className="rounded-full bg-destructive px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t("confirmarCancelacion")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-accent"
        >
          {t("volver")}
        </button>
      </div>
    </div>
  );
}
