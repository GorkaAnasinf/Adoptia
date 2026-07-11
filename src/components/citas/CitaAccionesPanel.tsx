"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CancelarCitaButton } from "./CancelarCitaButton";

/** Acciones de la protectora sobre una cita activa: realizada, no-show, cancelar. */
export function CitaAccionesPanel({ citaId }: { citaId: string }) {
  const t = useTranslations("citas");
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  async function marcar(accion: "done" | "no_show") {
    setEnviando(true);
    setError(false);
    try {
      const res = await fetch(`/api/citas/${citaId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      if (!res.ok) throw new Error("action_failed");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={enviando}
        onClick={() => marcar("done")}
        className="rounded-full border border-secondary/50 px-4 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/10 disabled:opacity-50"
      >
        {t("marcarRealizada")}
      </button>
      <button
        type="button"
        disabled={enviando}
        onClick={() => marcar("no_show")}
        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
      >
        {t("marcarNoShow")}
      </button>
      <CancelarCitaButton citaId={citaId} />
      {error && <p className="text-xs text-destructive">{t("errorCancelar")}</p>}
    </div>
  );
}
