"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/**
 * La protectora hace avanzar el estado de su propuesta (RLS: solo la dueña).
 * enviada → aceptada/rechazada; aceptada → finalizada; los estados cerrados
 * no ofrecen acciones.
 */
export function PropuestaEstadoActions({
  proposalId,
  status,
}: {
  proposalId: string;
  status: string;
}) {
  const t = useTranslations("acogida");
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  async function marcar(nuevo: "aceptada" | "rechazada" | "finalizada") {
    setGuardando(true);
    const supabase = createClient();
    await supabase.from("foster_proposals").update({ status: nuevo }).eq("id", proposalId);
    setGuardando(false);
    router.refresh();
  }

  const acciones =
    status === "enviada"
      ? ([
          ["aceptada", t("marcarAceptada")],
          ["rechazada", t("marcarRechazada")],
        ] as const)
      : status === "aceptada"
        ? ([["finalizada", t("marcarFinalizada")]] as const)
        : ([] as const);

  if (acciones.length === 0) return null;

  return (
    <span className="flex flex-wrap gap-2">
      {acciones.map(([estado, etiqueta]) => (
        <button
          key={estado}
          type="button"
          disabled={guardando}
          onClick={() => marcar(estado)}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {etiqueta}
        </button>
      ))}
    </span>
  );
}
