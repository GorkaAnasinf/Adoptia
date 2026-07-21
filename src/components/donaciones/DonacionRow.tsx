"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Donacion } from "./DonacionForm";

const BADGE: Record<Donacion["status"], string> = {
  abierta: "bg-emerald-100 text-emerald-800",
  entregada: "bg-stone-200 text-stone-700",
  caducada: "bg-amber-100 text-amber-800",
};

const ACCION = "inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50";
const ACCION_OUTLINE = `${ACCION} border border-border hover:bg-accent`;
const ACCION_BORRAR = `${ACCION} border border-destructive/40 text-destructive hover:bg-destructive/10`;

/** Oferta del donante: editar (reutiliza el formulario), entregar, renovar o borrar. */
export function DonacionRow({
  oferta,
  onEditar,
}: {
  oferta: Donacion;
  onEditar: (oferta: Donacion) => void;
}) {
  const t = useTranslations("donaciones");
  const router = useRouter();
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

  const estado = `estado${oferta.status.charAt(0).toUpperCase()}${oferta.status.slice(1)}` as
    | "estadoAbierta"
    | "estadoEntregada"
    | "estadoCaducada";

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {t(`cat${oferta.categoria.charAt(0).toUpperCase()}${oferta.categoria.slice(1)}`)}
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", BADGE[oferta.status])}>
          {t(estado)}
        </span>
        {oferta.city && <span className="text-xs text-muted-foreground">{oferta.city}</span>}
      </div>

      <p className="text-sm text-foreground">{oferta.descripcion}</p>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {oferta.status === "abierta" && (
          <>
            <button type="button" onClick={() => onEditar(oferta)} className={ACCION_OUTLINE}>
              {t("editar")}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => actualizar({ status: "entregada" })}
              className={ACCION_OUTLINE}
            >
              {t("entregar")}
            </button>
          </>
        )}
        {oferta.status === "caducada" && (
          <button
            type="button"
            disabled={guardando}
            onClick={() => actualizar({ status: "abierta", renovada_at: new Date().toISOString() })}
            className={ACCION_OUTLINE}
          >
            {t("renovar")}
          </button>
        )}
        <button type="button" disabled={guardando} onClick={borrar} className={ACCION_BORRAR}>
          {t("borrar")}
        </button>
      </div>
    </li>
  );
}
