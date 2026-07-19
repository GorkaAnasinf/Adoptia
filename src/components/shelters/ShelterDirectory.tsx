"use client";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Map,
  MapPin,
  PawPrint,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { esImagenValida } from "@/lib/animal-search";
import { cn } from "@/lib/utils";

/** Entrada del directorio público de protectoras (solo campos públicos). */
export interface ShelterDirectoryEntry {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  province: string | null;
  description: string | null;
  available_count: number;
  adopted_count: number;
}

const POR_PAGINA = 12;

function ubicacion(shelter: ShelterDirectoryEntry): string | null {
  return [shelter.city, shelter.province].filter(Boolean).join(", ") || null;
}

function TarjetaProtectora({ shelter }: { shelter: ShelterDirectoryEntry }) {
  const t = useTranslations("protectorasDir");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-1">
      <div className="relative aspect-video bg-surface-container-high">
        {esImagenValida(shelter.cover_url) ? (
          <Image
            src={shelter.cover_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center" aria-hidden="true">
            <Building2 className="size-10 text-primary/40" />
          </div>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-tertiary px-2.5 py-1 text-[11px] font-semibold text-tertiary-foreground">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          {t("verificada")}
        </span>
        <span className="absolute -bottom-6 left-5 flex size-14 items-center justify-center overflow-hidden rounded-full bg-surface-container-lowest ring-4 ring-surface-container-lowest">
          {esImagenValida(shelter.logo_url) ? (
            <Image
              src={shelter.logo_url}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <PawPrint className="size-6 text-primary" aria-hidden="true" />
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 pt-9">
        <div>
          <h2 className="truncate font-heading text-lg font-semibold text-foreground">
            {shelter.name}
          </h2>
          {ubicacion(shelter) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{ubicacion(shelter)}</span>
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 divide-x divide-border border-y border-border/60 py-3 text-center">
          <div className="px-2">
            <dd className="font-heading text-2xl font-bold text-primary">
              {shelter.available_count}
            </dd>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("statsAnimales")}
            </dt>
          </div>
          <div className="px-2">
            <dd className="font-heading text-2xl font-bold text-primary">
              {shelter.adopted_count}
            </dd>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("statsAdopciones")}
            </dt>
          </div>
        </dl>

        <Link
          href={`/protectoras/${shelter.slug}`}
          aria-label={t("verPerfilDe", { name: shelter.name })}
          className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
        >
          {t("verPerfil")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function ShelterDirectory({ shelters }: { shelters: ShelterDirectoryEntry[] }) {
  const t = useTranslations("protectorasDir");
  const [busqueda, setBusqueda] = useState("");
  const [soloConAnimales, setSoloConAnimales] = useState(false);
  const [pagina, setPagina] = useState(1);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return shelters.filter((s) => {
      if (soloConAnimales && s.available_count === 0) return false;
      if (!q) return true;
      return [s.name, s.city, s.province].some((v) => v?.toLowerCase().includes(q));
    });
  }, [shelters, busqueda, soloConAnimales]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  if (shelters.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container-lowest px-6 py-16 text-center shadow-soft">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <PawPrint className="size-7 text-primary" aria-hidden="true" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{t("vacioTitulo")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t("vacioTexto")}</p>
        <Link
          href="/animales"
          className="mt-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
        >
          {t("vacioCta")}
        </Link>
      </div>
    );
  }

  const claseChip = (activo: boolean) => {
    return cn(
      "min-h-10 rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95",
      activo
        ? "bg-primary font-semibold text-primary-foreground"
        : "bg-surface-container-high text-foreground hover:bg-surface-container-highest",
    );
  };

  const claseFlecha =
    "flex size-10 items-center justify-center rounded-full border border-input bg-surface-container-lowest hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <div className="space-y-5">
      {/* Buscador + Ver mapa */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-h-12 flex-1 items-center gap-2 rounded-2xl bg-surface-container-low px-4 shadow-soft">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">{t("buscarLabel")}</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder={t("buscarPlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <Link
          href="/mapa"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 font-semibold text-secondary-foreground shadow-lg shadow-secondary/20 transition hover:bg-secondary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary motion-safe:active:scale-95"
        >
          <Map className="size-5" aria-hidden="true" />
          {t("verMapa")}
        </Link>
      </div>

      {/* Chips de filtro */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={!soloConAnimales}
          onClick={() => {
            setSoloConAnimales(false);
            setPagina(1);
          }}
          className={claseChip(!soloConAnimales)}
        >
          {t("chipTodas")}
        </button>
        <button
          type="button"
          aria-pressed={soloConAnimales}
          onClick={() => {
            setSoloConAnimales(true);
            setPagina(1);
          }}
          className={claseChip(soloConAnimales)}
        >
          {t("chipConAnimales")}
        </button>
      </div>

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container-lowest px-6 py-16 text-center shadow-soft">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Search className="size-7 text-primary" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t("vacioBusquedaTitulo")}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">{t("vacioBusquedaTexto")}</p>
          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setSoloConAnimales(false);
              setPagina(1);
            }}
            className="mt-2 rounded-2xl border-2 border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
          >
            {t("limpiarBusqueda")}
          </button>
        </div>
      ) : (
        <>
          <ul aria-live="polite" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((shelter, i) => (
              <li key={shelter.id}>
                <Reveal delayMs={(i % 3) * 100} className="h-full">
                  <TarjetaProtectora shelter={shelter} />
                </Reveal>
              </li>
            ))}
          </ul>

          {totalPaginas > 1 && (
            <nav
              aria-label={t("paginaDe", { actual: paginaActual, total: totalPaginas })}
              className="flex items-center justify-center gap-4 pt-2"
            >
              {paginaActual > 1 ? (
                <button
                  type="button"
                  aria-label={t("paginaAnterior")}
                  onClick={() => setPagina(paginaActual - 1)}
                  className={claseFlecha}
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
              ) : (
                <span className="size-10" aria-hidden="true" />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {t("paginaDe", { actual: paginaActual, total: totalPaginas })}
              </span>
              {paginaActual < totalPaginas ? (
                <button
                  type="button"
                  aria-label={t("paginaSiguiente")}
                  onClick={() => setPagina(paginaActual + 1)}
                  className={claseFlecha}
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              ) : (
                <span className="size-10" aria-hidden="true" />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
