"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { DonacionForm, type Donacion } from "./DonacionForm";

const BADGE: Record<Donacion["status"], string> = {
  abierta: "bg-emerald-100 text-emerald-800",
  entregada: "bg-stone-200 text-stone-700",
  caducada: "bg-amber-100 text-amber-800",
};

/** Oferta del donante: editar inline, marcar entregada, renovar o borrar. */
export function DonacionRow({ oferta, userId }: { oferta: Donacion; userId: string }) {
  const t = useTranslations("donaciones");
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function actualizar(cambios: Record<string, unknown>) {
    setGuardando(true);
    const supabase = createClient();
    await supabase.from("donation_offers").update(cambios).eq("id", oferta.id);
    setGuardando(false);
    router.refresh();
  }

  async function borrar() {
    if (!window.confirm(t("borrarConfirm"))) return;
    setGuardando(true);
    const supabase = createClient();
    await supabase.from("donation_offers").delete().eq("id", oferta.id);
    setGuardando(false);
    router.refresh();
  }

  if (editando) {
    return (
      <li>
        <DonacionForm userId={userId} existente={oferta} onCerrar={() => setEditando(false)} />
      </li>
    );
  }

  const estado = `estado${oferta.status.charAt(0).toUpperCase()}${oferta.status.slice(1)}` as
    | "estadoAbierta"
    | "estadoEntregada"
    | "estadoCaducada";

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
        {t(`cat${oferta.categoria.charAt(0).toUpperCase()}${oferta.categoria.slice(1)}`)}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[oferta.status]}`}>
        {t(estado)}
      </span>
      <span className="min-w-0 flex-1">{oferta.descripcion}</span>
      <span className="flex gap-2">
        {oferta.status === "abierta" && (
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
              onClick={() => actualizar({ status: "entregada" })}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {t("entregar")}
            </button>
          </>
        )}
        {oferta.status === "caducada" && (
          <button
            type="button"
            disabled={guardando}
            onClick={() =>
              actualizar({ status: "abierta", renovada_at: new Date().toISOString() })
            }
            className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            {t("renovar")}
          </button>
        )}
        <button
          type="button"
          disabled={guardando}
          onClick={borrar}
          className="rounded-full border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {t("borrar")}
        </button>
      </span>
    </li>
  );
}
