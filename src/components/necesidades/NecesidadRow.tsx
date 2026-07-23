"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NecesidadForm, type Necesidad } from "./NecesidadForm";

const BADGE: Record<Necesidad["status"], string> = {
  abierta: "bg-emerald-100 text-emerald-800",
  cubierta: "bg-stone-200 text-stone-700",
};

const ACCION =
  "inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50";
const ACCION_OUTLINE = `${ACCION} border border-border hover:bg-accent`;

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

  const estado = need.status === "abierta" ? "estadoAbierta" : "estadoCubierta";

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {t(`cat${need.categoria.charAt(0).toUpperCase()}${need.categoria.slice(1)}`)}
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", BADGE[need.status])}>
          {t(estado)}
        </span>
        {need.urgencia === "urgente" && need.status === "abierta" && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            {t("urgenteChip")}
          </span>
        )}
      </div>

      <p className="text-sm text-foreground">{need.descripcion}</p>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {need.status === "abierta" ? (
          <>
            <button type="button" onClick={() => setEditando(true)} className={ACCION_OUTLINE}>
              {t("editar")}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => setStatus("cubierta")}
              className={ACCION_OUTLINE}
            >
              {t("cubrir")}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={guardando}
            onClick={() => setStatus("abierta")}
            className={ACCION_OUTLINE}
          >
            {t("reabrir")}
          </button>
        )}
      </div>
    </li>
  );
}
