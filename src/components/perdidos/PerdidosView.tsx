"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { esImagenValida } from "@/lib/animal-search";
import { MapaAvisos } from "./MapaAvisos";
import type { AvisoMapa, Especie, Tamano } from "./tipos";

type Filtro = "all" | "lost" | "found";
type FiltroEspecie = "all" | Especie;
type FiltroTamano = "all" | Tamano;
type FiltroFecha = "all" | "7" | "30";

/**
 * Mapa + listado con filtros combinables. Se filtra EN CLIENTE a propósito: el
 * RPC ya trae los abiertos (máx. 500) y el mapa necesita los puntos igualmente,
 * así que filtrar en servidor sería un ida y vuelta por chip y arriesgaría
 * desincronizar mapa y lista. Si el volumen crece, se mueve a parámetros del
 * RPC como hizo IMPROVEMENT-021 con `animals_search`.
 */
export function PerdidosView({ avisos }: { avisos: AvisoMapa[] }) {
  const t = useTranslations("perdidos");
  const tAnimales = useTranslations("animales");
  const format = useFormatter();
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [especie, setEspecie] = useState<FiltroEspecie>("all");
  const [tamano, setTamano] = useState<FiltroTamano>("all");
  const [fecha, setFecha] = useState<FiltroFecha>("all");

  const visibles = useMemo(() => {
    const limite =
      fecha === "all" ? null : new Date(Date.now() - Number(fecha) * 86_400_000);
    return avisos.filter((a) => {
      if (filtro !== "all" && a.type !== filtro) return false;
      if (especie !== "all" && a.species !== especie) return false;
      if (tamano !== "all" && a.size !== tamano) return false;
      // Por la fecha del SUCESO, no la de publicación: publicar tarde no debe
      // hacer que un aviso viejo parezca reciente (es el bug que arregla este
      // item).
      if (limite && new Date(a.occurred_on) < limite) return false;
      return true;
    });
  }, [avisos, filtro, especie, tamano, fecha]);

  const hayFiltros = filtro !== "all" || especie !== "all" || tamano !== "all" || fecha !== "all";

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

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filtro-especie">
            {t("filtroEspecie")}
          </label>
          <select
            id="filtro-especie"
            value={especie}
            onChange={(e) => setEspecie(e.target.value as FiltroEspecie)}
            className="rounded-lg border border-input bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">{t("filtroCualquiera")}</option>
            <option value="dog">{tAnimales("speciesDog")}</option>
            <option value="cat">{tAnimales("speciesCat")}</option>
            <option value="other">{tAnimales("speciesOther")}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filtro-tamano">
            {t("filtroTamano")}
          </label>
          <select
            id="filtro-tamano"
            value={tamano}
            onChange={(e) => setTamano(e.target.value as FiltroTamano)}
            className="rounded-lg border border-input bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">{t("filtroCualquiera")}</option>
            <option value="small">{tAnimales("sizeSmall")}</option>
            <option value="medium">{tAnimales("sizeMedium")}</option>
            <option value="large">{tAnimales("sizeLarge")}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filtro-fecha">
            {t("filtroFecha")}
          </label>
          <select
            id="filtro-fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value as FiltroFecha)}
            className="rounded-lg border border-input bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">{t("filtroFechaTodas")}</option>
            <option value="7">{t("filtroFecha7")}</option>
            <option value="30">{t("filtroFecha30")}</option>
          </select>
        </div>
      </div>

      <div className="h-[420px]">
        <MapaAvisos avisos={visibles} />
      </div>
      <p className="text-xs text-muted-foreground">{t("avisoPrivacidad")}</p>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-muted-foreground">
          {/* No es lo mismo «no hay avisos» (ojalá) que «tus filtros no dejan
              ver ninguno» (quita alguno). */}
          {hayFiltros && avisos.length > 0 ? t("vacioFiltros") : t("vacio")}
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
                  {t(a.type === "lost" ? "ocurrioEl" : "encontradoEl", {
                    fecha: format.dateTime(new Date(a.occurred_on), {
                      day: "numeric",
                      month: "long",
                    }),
                  })}
                </p>
                {(a.breed || a.color) && (
                  <p className="truncate text-sm">
                    {[a.breed, a.color].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
