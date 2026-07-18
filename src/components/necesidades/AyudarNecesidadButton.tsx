"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * «Puedo ayudar» (FEATURE-031): mensaje del usuario a la protectora vía
 * plataforma (relay con Reply-To — se avisa de que al responder verán su email).
 */
export function AyudarNecesidadButton({
  needId,
  autenticado,
}: {
  needId: string;
  autenticado: boolean;
}) {
  const t = useTranslations("necesidades");
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  if (!autenticado) {
    return (
      <Link
        href="/login"
        className="self-start rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
      >
        {t("ayudar")}
      </Link>
    );
  }

  if (estado === "ok") {
    return <span className="text-sm font-medium text-secondary">{t("ayudarOk")}</span>;
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="self-start rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
      >
        {t("ayudar")}
      </button>
    );
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (mensaje.trim().length < 10) {
      setError(t("ayudarCorto"));
      return;
    }
    setError(undefined);
    setEstado("enviando");
    try {
      const res = await fetch("/api/necesidades/contactar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ need_id: needId, mensaje: mensaje.trim() }),
      });
      if (!res.ok) throw new Error("ayudar");
      setEstado("ok");
    } catch {
      setError(t("ayudarError"));
      setEstado("idle");
    }
  }

  return (
    <form onSubmit={enviar} className="flex w-full flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm">
      <label className="flex flex-col gap-1 font-medium">
        {t("ayudarMensaje")}
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={2}
          maxLength={1000}
          className="rounded-lg border border-input bg-white px-3 py-2"
        />
      </label>
      <p className="text-xs text-muted-foreground">{t("ayudarAviso")}</p>
      {error && <p className="text-destructive">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("ayudarEnviando") : t("ayudarEnviar")}
        </button>
      </div>
    </form>
  );
}
