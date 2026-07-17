"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * El acogedor pide (o cancela) el relevo de su acogida aceptada (FEATURE-030).
 * El animal es de la protectora: aquí solo se avisa; el relevo lo gestiona ella.
 */
export function RelevoAcogidaButton({
  proposalId,
  relevo,
}: {
  proposalId: string;
  relevo: { motivo: string; fechaLimite: string } | null;
}) {
  const t = useTranslations("acogida");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  async function llamar(body: Record<string, unknown>) {
    setEnviando(true);
    setError(undefined);
    try {
      const res = await fetch("/api/acogida/relevo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("relevo");
      router.refresh();
    } catch {
      setError(t("relevoError"));
    } finally {
      setEnviando(false);
    }
  }

  if (relevo) {
    return (
      <span className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          {t("relevoPedido", { fecha: relevo.fechaLimite })}
        </span>
        <button
          type="button"
          disabled={enviando}
          onClick={() => llamar({ proposal_id: proposalId, cancelar: true })}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {t("relevoCancelar")}
        </button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </span>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="self-start rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
      >
        {t("relevoNecesito")}
      </button>
    );
  }

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!motivo.trim() || !fecha) {
          setError(t("relevoFaltanCampos"));
          return;
        }
        void llamar({ proposal_id: proposalId, motivo: motivo.trim(), fecha_limite: fecha });
      }}
      className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm"
    >
      <label className="flex flex-col gap-1 font-medium">
        {t("relevoMotivo")}
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          maxLength={500}
          className="rounded-lg border border-input bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        {t("relevoFecha")}
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-lg border border-input bg-white px-3 py-2"
        />
      </label>
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
        >
          {enviando ? t("relevoEnviando") : t("relevoEnviar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-4 py-1.5 text-xs hover:bg-accent"
        >
          {t("relevoCancelarForm")}
        </button>
      </div>
    </form>
  );
}
