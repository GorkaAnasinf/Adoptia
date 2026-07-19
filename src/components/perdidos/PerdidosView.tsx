"use client";

import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { esImagenValida } from "@/lib/animal-search";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { MapaAvisos } from "./MapaAvisos";
import type { AvisoMapa, Especie, Tamano } from "./tipos";

type Filtro = "all" | "lost" | "found";
type FiltroEspecie = "all" | Especie;
type FiltroTamano = "all" | Tamano;
type FiltroFecha = "all" | "7" | "30";

/** Tarjetas visibles antes de pulsar «Ver más avisos» (FEATURE-025). */
const RECIENTES = 8;

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
  // FEATURE-025: los selects viven tras «Más filtros» (colapsados por defecto)
  // y la lista enseña los 8 más recientes hasta pulsar «Ver más avisos».
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [verTodos, setVerTodos] = useState(false);

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
  const tarjetas = verTodos ? visibles : visibles.slice(0, RECIENTES);
  // Fuera del JSX: el `>` de la comparación confunde al linter de i18n (la
  // misma lección de FEATURE-024).
  const hayMasAvisos = !verTodos && visibles.length > RECIENTES;

  const chips: { key: Filtro; etiqueta: string }[] = [
    { key: "all", etiqueta: t("filtroTodos") },
    { key: "lost", etiqueta: t("filtroLost") },
    { key: "found", etiqueta: t("filtroFound") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("title")}>
          {chips.map(({ key, etiqueta }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filtro === key}
              onClick={() => setFiltro(key)}
              className={cn(
                "min-h-9 rounded-full px-4 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95",
                filtro === key
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "bg-surface-container-high text-foreground hover:bg-surface-container-highest",
              )}
            >
              {etiqueta}
            </button>
          ))}
          {/* Sin esto, un lector de pantalla no se entera de que filtrar cambió
              la lista (detalle añadido en FEATURE-038). */}
          <p aria-live="polite" className="ml-1 text-sm font-medium text-primary">
            {t("contadorAvisos", { count: visibles.length })}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={filtrosAbiertos}
          aria-controls="perdidos-mas-filtros"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          className="min-h-9 rounded-full bg-surface-container-high px-4 py-1.5 text-sm text-foreground transition hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
        >
          {t("masFiltros")}
        </button>
      </div>

      {filtrosAbiertos && (
        <div
          id="perdidos-mas-filtros"
          className="flex flex-wrap gap-4 rounded-3xl bg-surface-container-low p-4 shadow-soft"
        >
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
      )}

      <div className="relative h-[400px] overflow-hidden rounded-3xl shadow-soft">
        <MapaAvisos avisos={visibles} />
        {/* Overlay del wireframe: la nota RGPD vive dentro del mapa, siempre
            legible y sin bloquear la interacción (z sobre los panes de
            Leaflet). */}
        <p className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-background/90 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
          {t("avisoPrivacidad")}
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-3xl bg-surface-container-low px-6 py-10 text-center text-muted-foreground shadow-soft">
          {/* No es lo mismo «no hay avisos» (ojalá) que «tus filtros no dejan
              ver ninguno» (quita alguno). */}
          {hayFiltros && avisos.length > 0 ? t("vacioFiltros") : t("vacio")}
        </p>
      ) : (
        <section aria-label={t("recientesTitulo")} className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-bold">{t("recientesTitulo")}</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {tarjetas.map((a, i) => {
              const titulo = a.name ?? t(a.type === "lost" ? "tipoLost" : "tipoFound");
              return (
                <li
                  key={a.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft transition focus-within:ring-2 focus-within:ring-primary hover:shadow-soft-lg motion-safe:hover:-translate-y-1"
                >
                  <Reveal delayMs={(i % 4) * 60} className="flex h-full flex-col">
                    <div className="relative aspect-square bg-muted">
                      {esImagenValida(a.cover_url) ? (
                        <Image
                          src={a.cover_url!}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <span aria-hidden className="flex h-full items-center justify-center text-4xl">
                          🐾
                        </span>
                      )}
                      <span
                        className={cn(
                          "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                          a.type === "lost"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {t(a.type === "lost" ? "tipoLost" : "tipoFound")}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      {/* Enlace extendido: toda la tarjeta lleva a la ficha sin
                          duplicar enlaces para el lector de pantalla. */}
                      <Link
                        href={`/perdidos-encontrados/${a.id}`}
                        className="font-heading text-lg font-semibold after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
                      >
                        {titulo}
                      </Link>
                      {a.city && (
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin aria-hidden className="h-4 w-4 shrink-0" />
                          <span>{a.city}</span>
                        </p>
                      )}
                      {(a.breed || a.color) && (
                        <p className="truncate text-sm text-muted-foreground">
                          {[a.breed, a.color].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-auto pt-1 text-xs text-muted-foreground">
                        {t(a.type === "lost" ? "perdidoEl" : "encontradoEl", {
                          fecha: format.dateTime(new Date(a.occurred_on), {
                            day: "numeric",
                            month: "long",
                          }),
                        })}
                      </p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
          {hayMasAvisos && (
            <button
              type="button"
              onClick={() => setVerTodos(true)}
              className="self-center rounded-full border-2 border-primary/30 px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
            >
              {t("verTodosAvisos")}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
