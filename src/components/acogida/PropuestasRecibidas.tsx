"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { RelevoAcogidaButton } from "./RelevoAcogidaButton";

export type PropuestaRecibida = {
  id: string;
  duracion: string;
  mensaje: string;
  status: string;
  created_at: string;
  relevo_pedido_at?: string | null;
  relevo_motivo?: string | null;
  relevo_fecha_limite?: string | null;
  shelters: { name: string; slug: string } | null;
  animals: { name: string } | null;
};

const ESTADO_CHIP: Record<string, string> = {
  enviada: "bg-primary/10 text-primary",
  aceptada: "bg-emerald-100 text-emerald-800",
  rechazada: "bg-stone-200 text-stone-700",
  finalizada: "bg-sky-100 text-sky-800",
};

/** Lista de propuestas de acogida recibidas por el acogedor (FEATURE-029). */
export function PropuestasRecibidas({ propuestas }: { propuestas: PropuestaRecibida[] }) {
  const t = useTranslations("acogida");
  const format = useFormatter();

  const ESTADO_TEXTO: Record<string, string> = {
    enviada: t("estadoPropuestaEnviada"),
    aceptada: t("estadoPropuestaAceptada"),
    rechazada: t("estadoPropuestaRechazada"),
    finalizada: t("estadoPropuestaFinalizada"),
  };

  if (propuestas.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t("recibidasEmpty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {propuestas.map((p) => (
        <li
          key={p.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft"
        >
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold">
                {t("recibidaDe", { nombre: p.shelters?.name ?? "—" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {p.animals?.name ?? t("sinAnimalConcreto")} · {p.duracion}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CHIP[p.status]}`}
            >
              {ESTADO_TEXTO[p.status]}
            </span>
            <span className="w-full text-right text-xs text-muted-foreground sm:w-auto">
              {format.dateTime(new Date(p.created_at), { day: "numeric", month: "short" })}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">{p.mensaje}</p>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {p.status === "aceptada" && (
              <RelevoAcogidaButton
                proposalId={p.id}
                relevo={
                  p.relevo_pedido_at && p.relevo_fecha_limite
                    ? { motivo: p.relevo_motivo ?? "", fechaLimite: p.relevo_fecha_limite }
                    : null
                }
              />
            )}
            {p.shelters?.slug && (
              <Link
                href={`/protectoras/${p.shelters.slug}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {t("contactarRefugio")}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
