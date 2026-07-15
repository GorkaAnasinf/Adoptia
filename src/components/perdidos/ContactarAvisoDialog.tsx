"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Mensaje de un vecino al autor del aviso. El correo del autor no llega nunca
 * al navegador: el relay lo resuelve el servidor. Sí se advierte de que el
 * correo del remitente se comparte (es lo que permite la respuesta).
 */
export function ContactarAvisoDialog({ avisoId }: { avisoId: string }) {
  const t = useTranslations("perdidos");
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (mensaje.trim().length < 10) {
      setError(t("contactarCorto"));
      return;
    }
    setError(undefined);
    setEstado("enviando");
    try {
      const res = await fetch(`/api/perdidos/${avisoId}/contactar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensaje: mensaje.trim() }),
      });
      if (!res.ok) {
        const codigo = await res
          .json()
          .then((b) => b?.error?.code as string | undefined)
          .catch(() => undefined);
        setError(
          res.status === 429
            ? t("contactarLimite")
            : codigo === "contacto_cerrado"
              ? t("contactarCerrado")
              : t("contactarError"),
        );
        setEstado("idle");
        return;
      }
      setEstado("ok");
    } catch {
      setError(t("contactarError"));
      setEstado("idle");
    }
  }

  if (estado === "ok") {
    return <p className="rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-900">{t("contactarOk")}</p>;
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent"
      >
        {t("contactar")}
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-border p-5">
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={`mensaje-${avisoId}`}>
        {t("contactarMensaje")}
        <textarea
          id={`mensaje-${avisoId}`}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={t("contactarMensajeHelp")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </label>
      <p className="text-xs text-muted-foreground">{t("contactarCesion")}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("contactarEnviando") : t("contactarEnviar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-accent"
        >
          {t("contactarCancelar")}
        </button>
      </div>
    </form>
  );
}
