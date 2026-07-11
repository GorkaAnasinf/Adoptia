"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

/** Retira una solicitud pendiente del propio adoptante (accion: withdraw). */
export function RetirarSolicitudButton({ solicitudId }: { solicitudId: string }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  async function retirar() {
    if (!window.confirm(t("retirarConfirm"))) return;
    setEnviando(true);
    setError(false);
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accion: "withdraw" }),
      });
      if (!res.ok) throw new Error("withdraw_failed");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={retirar}
        disabled={enviando}
        className="rounded-full border border-destructive/40 px-4 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        {t("retirar")}
      </button>
      {error && <p className="text-xs text-destructive">{t("retirarError")}</p>}
    </div>
  );
}
