"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export type AnimalPropuesta = { id: string; name: string };

/**
 * La protectora propone una acogida con formulario (animal opcional, duración
 * y mensaje). La propuesta se persiste en el servidor y el aviso llega al
 * acogedor por email (FEATURE-029).
 */
export function ProponerAcogidaDialog({
  fosterUserId,
  animales,
}: {
  fosterUserId: string;
  animales: AnimalPropuesta[];
}) {
  const t = useTranslations("acogida");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [animalId, setAnimalId] = useState("");
  const [duracion, setDuracion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!duracion.trim() || !mensaje.trim()) {
      setError(t("proponerFaltanCampos"));
      return;
    }
    setError(undefined);
    setEstado("enviando");
    try {
      const res = await fetch("/api/acogida/contactar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          foster_user_id: fosterUserId,
          ...(animalId ? { animal_id: animalId } : {}),
          duracion: duracion.trim(),
          mensaje: mensaje.trim(),
        }),
      });
      if (res.ok) {
        setEstado("ok");
        router.refresh();
        return;
      }
      const cuerpo = (await res.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      setError(
        cuerpo?.error?.code === "proposal_exists" ? t("propuestaExiste") : t("errorContactar"),
      );
      setEstado("idle");
    } catch {
      setError(t("errorContactar"));
      setEstado("idle");
    }
  }

  if (estado === "ok") {
    return <span className="text-sm font-medium text-secondary">{t("contactado")}</span>;
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="self-start rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
      >
        {t("contactar")}
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("proponerAnimal")}
        <select
          value={animalId}
          onChange={(e) => setAnimalId(e.target.value)}
          className="rounded-lg border border-input bg-white px-3 py-2"
        >
          <option value="">{t("proponerAnimalNinguno")}</option>
          {animales.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("proponerDuracion")}
        <input
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          maxLength={120}
          placeholder={t("proponerDuracionPlaceholder")}
          className="rounded-lg border border-input bg-white px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("proponerMensaje")}
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={3}
          maxLength={1000}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("proponerEnviando") : t("proponerEnviar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent"
        >
          {t("proponerCancelar")}
        </button>
      </div>
    </form>
  );
}
