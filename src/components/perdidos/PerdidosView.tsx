"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { esImagenValida } from "@/lib/animal-search";
import { MapaAvisos } from "./MapaAvisos";
import type { AvisoMapa } from "./tipos";

type Filtro = "all" | "lost" | "found";

/** Mapa + listado de avisos con filtro perdido/encontrado. */
export function PerdidosView({ avisos }: { avisos: AvisoMapa[] }) {
  const t = useTranslations("perdidos");
  const format = useFormatter();
  const [filtro, setFiltro] = useState<Filtro>("all");

  const visibles = useMemo(
    () => (filtro === "all" ? avisos : avisos.filter((a) => a.type === filtro)),
    [avisos, filtro],
  );

  const chips: { key: Filtro; etiqueta: string }[] = [
    { key: "all", etiqueta: t("filtroTodos") },
    { key: "lost", etiqueta: t("filtroLost") },
    { key: "found", etiqueta: t("filtroFound") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("title")}>
        {chips.map(({ key, etiqueta }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filtro === key}
            onClick={() => setFiltro(key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              filtro === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="h-[420px]">
        <MapaAvisos avisos={visibles} />
      </div>
      <p className="text-xs text-muted-foreground">{t("avisoPrivacidad")}</p>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-muted-foreground">
          {t("vacio")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visibles.map((a) => (
            <li key={a.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {esImagenValida(a.photo_url) ? (
                  <Image src={a.photo_url!} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <span aria-hidden className="flex h-full items-center justify-center text-3xl">
                    🐾
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      a.type === "lost" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {t(a.type === "lost" ? "tipoLost" : "tipoFound")}
                  </span>
                  <Link
                    href={`/perdidos-encontrados/${a.id}`}
                    className="font-heading font-semibold hover:underline"
                  >
                    {a.name ?? t(a.type === "lost" ? "tipoLost" : "tipoFound")}
                  </Link>
                </div>
                {a.city && <p className="text-sm text-muted-foreground">{a.city}</p>}
                <p className="text-sm text-muted-foreground">
                  {t("publicadoEl", {
                    fecha: format.dateTime(new Date(a.created_at), { day: "numeric", month: "long" }),
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
