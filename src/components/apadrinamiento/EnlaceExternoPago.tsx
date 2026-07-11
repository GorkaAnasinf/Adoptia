"use client";

import { useState } from "react";

/**
 * Botón que abre un enlace de pago externo mostrando ANTES un aviso claro de
 * que el pago es directo con la protectora (criterio FEATURE-013). Si se pasa
 * `registrarUrl`, registra la intención (métrica, best-effort).
 */
export function EnlaceExternoPago({
  href,
  cta,
  aviso,
  continuar,
  cancelar,
  registrarUrl,
  variante = "primary",
}: {
  href: string;
  cta: string;
  aviso: string;
  continuar: string;
  cancelar: string;
  registrarUrl?: string;
  variante?: "primary" | "secondary";
}) {
  const [confirmando, setConfirmando] = useState(false);

  function abrir() {
    if (registrarUrl) {
      // Métrica best-effort: no bloquea la salida al enlace
      void fetch(registrarUrl, { method: "POST" }).catch(() => undefined);
    }
    window.open(href, "_blank", "noopener,noreferrer");
    setConfirmando(false);
  }

  const color =
    variante === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground";

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className={`rounded-full px-6 py-2.5 font-semibold hover:opacity-90 ${color}`}
      >
        {cta}
      </button>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{aviso}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={abrir}
          className={`rounded-full px-5 py-2 text-sm font-semibold hover:opacity-90 ${color}`}
        >
          {continuar}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent"
        >
          {cancelar}
        </button>
      </div>
    </div>
  );
}
