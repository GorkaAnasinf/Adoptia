"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { NecesidadForm, type Necesidad } from "./NecesidadForm";

/** Fila de necesidad en el panel: editar inline, cubrir o reabrir. */
export function NecesidadRow({ need, shelterId }: { need: Necesidad; shelterId: string }) {
  const t = useTranslations("necesidades");
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function setStatus(status: "abierta" | "cubierta") {
    setGuardando(true);
    const supabase = createClient();
    await supabase.from("shelter_needs").update({ status }).eq("id", need.id);
    setGuardando(false);
    router.refresh();
  }

  if (editando) {
    return (
      <li>
        <NecesidadForm shelterId={shelterId} existente={need} onCerrar={() => setEditando(false)} />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
        {t(`cat${need.categoria.charAt(0).toUpperCase()}${need.categoria.slice(1)}`)}
      </span>
      {need.urgencia === "urgente" && need.status === "abierta" && (
        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          {t("urgenteChip")}
        </span>
      )}
      <span className="min-w-0 flex-1">{need.descripcion}</span>
      <span className="flex gap-2">
        {need.status === "abierta" ? (
          <>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
            >
              {t("editar")}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => setStatus("cubierta")}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {t("cubrir")}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={guardando}
            onClick={() => setStatus("abierta")}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            {t("reabrir")}
          </button>
        )}
      </span>
    </li>
  );
}
