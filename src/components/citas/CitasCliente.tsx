"use client";

import { Clock, PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CitaAccionesPanel } from "@/components/citas/CitaAccionesPanel";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export type CitaVista = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "done" | "no_show";
  starts_at: string;
  cancel_reason: string | null;
  adopterName: string | null;
  animal: { name: string; slug: string; cover: string | null } | null;
};

const CLAVE_ESTADO: Record<CitaVista["status"], string> = {
  pending: "estadoPendiente",
  confirmed: "estadoConfirmada",
  cancelled: "estadoCancelada",
  done: "estadoRealizada",
  no_show: "estadoNoShow",
};
const BADGE_ESTADO: Record<CitaVista["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-secondary-container text-on-secondary-container",
  cancelled: "bg-stone-200 text-stone-700",
  done: "bg-sky-100 text-sky-800",
  no_show: "bg-rose-100 text-rose-800",
};

const HORA = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
const DIA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const YMD = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Madrid" });

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).slice(0, 2);
  return p.map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

export function CitasCliente({ proximas, pasadas }: { proximas: CitaVista[]; pasadas: CitaVista[] }) {
  const t = useTranslations("citas");
  const [tab, setTab] = useState<"proximas" | "pasadas">("proximas");
  const lista = tab === "proximas" ? proximas : pasadas;

  // Etiqueta Hoy/Mañana/fecha corta + hora (Europe/Madrid).
  function cuando(startsAt: string): string {
    const d = new Date(startsAt);
    const hoy = YMD.format(new Date());
    const manana = YMD.format(new Date(Date.now() + 86_400_000));
    const dia = YMD.format(d);
    const etiqueta = dia === hoy ? t("hoy") : dia === manana ? t("manana") : DIA.format(d);
    return `${etiqueta}, ${HORA.format(d)}`;
  }

  return (
    <div>
      <div role="tablist" className="flex gap-6 border-b border-border">
        {(["proximas", "pasadas"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px border-b-2 px-1 py-2.5 text-sm font-semibold transition-colors",
              tab === k
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(k)}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {tab === "proximas" ? t("dashboardEmpty") : t("sinPasadas")}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {lista.map((c, i) => {
            const activa = c.status === "pending" || c.status === "confirmed";
            return (
              <li key={c.id}>
                <Reveal delayMs={Math.min(i, 8) * 60}>
                  <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition duration-300 hover:shadow-md sm:flex-row">
                    <div className="relative aspect-video w-full shrink-0 bg-muted sm:aspect-square sm:w-44">
                      {c.animal?.cover ? (
                        <Image
                          src={c.animal.cover}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 11rem"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <PawPrint className="size-8" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-heading text-lg font-semibold">
                          {c.animal ? (
                            <Link href={`/animales/${c.animal.slug}`} className="hover:underline">
                              {t("cardTitle", { nombre: c.animal.name })}
                            </Link>
                          ) : (
                            t("cardTitle", { nombre: "—" })
                          )}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_ESTADO[c.status]}`}
                        >
                          {t(CLAVE_ESTADO[c.status])}
                        </span>
                      </div>
                      {c.adopterName && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {iniciales(c.adopterName)}
                          </span>
                          {t("conQuien", { nombre: c.adopterName })}
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-primary" aria-hidden="true" />
                        {cuando(c.starts_at)}
                      </p>
                      {activa ? (
                        <div className="mt-1">
                          <CitaAccionesPanel citaId={c.id} />
                        </div>
                      ) : (
                        c.cancel_reason && <p className="text-xs text-muted-foreground">{c.cancel_reason}</p>
                      )}
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
