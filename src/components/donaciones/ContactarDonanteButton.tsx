"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * «Contactar» (FEATURE-032): mensaje de la protectora al donante vía
 * plataforma (relay — el donante recibe los datos de la protectora, no al
 * revés).
 */
export function ContactarDonanteButton({ offerId }: { offerId: string }) {
  const t = useTranslations("donaciones");
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  if (estado === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        {t("contactarOk")}
      </span>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-9 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {t("contactar")}
      </button>
    );
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (mensaje.trim().length < 10) {
      setError(t("contactarCorto"));
      return;
    }
    setError(undefined);
    setEstado("enviando");
    try {
      const res = await fetch("/api/donaciones/contactar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offer_id: offerId, mensaje: mensaje.trim() }),
      });
      if (!res.ok) throw new Error("contactar");
      setEstado("ok");
    } catch {
      setError(t("contactarError"));
      setEstado("idle");
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="flex w-full flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm"
    >
      <label className="flex flex-col gap-1 font-medium">
        {t("contactarMensaje")}
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={2}
          maxLength={1000}
          className="rounded-lg border border-input bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </label>
      <p className="text-xs text-muted-foreground">{t("contactarAviso")}</p>
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="inline-flex min-h-9 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("contactarEnviando") : t("contactarEnviar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="inline-flex min-h-9 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-accent"
        >
          {t("cancelarEdicion")}
        </button>
      </div>
    </form>
  );
}
