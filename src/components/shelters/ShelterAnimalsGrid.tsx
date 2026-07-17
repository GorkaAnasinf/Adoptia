"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { EDADES, type EdadBucket, edadEnBucket } from "@/lib/animal-search";
import { ESPECIES } from "@/lib/schemas/animal";
import type { PublicAnimal } from "./ShelterPublicProfile";

const CLAVE_ESPECIE = { dog: "speciesDog", cat: "speciesCat", other: "speciesOther" } as const;
const CLAVE_EDAD: Record<EdadBucket, string> = {
  cachorro: "edadCachorro",
  joven: "edadJoven",
  adulto: "edadAdulto",
  senior: "edadSenior",
};

/** Búsqueda insensible a mayúsculas y acentos. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function portada(media: PublicAnimal["animal_media"]): string | null {
  if (media.length === 0) return null;
  return (media.find((m) => m.is_cover) ?? [...media].sort((a, b) => a.sort_order - b.sort_order)[0])
    .url;
}

function aTarjeta(a: PublicAnimal, shelterName: string): AnimalSearchResult {
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    species: a.species ?? "other",
    sex: a.sex ?? "unknown",
    size: a.size ?? null,
    breed: a.breed ?? null,
    birth_date_approx: a.birth_date_approx ?? null,
    status: a.status,
    published_at: a.published_at ?? "",
    shelter_name: shelterName,
    shelter_slug: "",
    city: null,
    province: null,
    distance_m: null,
    cover_url: portada(a.animal_media),
    total_count: 0,
  };
}

/**
 * Grid de animales del perfil público (FEATURE-028): contador, buscador por
 * nombre y filtros de especie/edad client-side (el volumen por protectora es
 * pequeño; no hay paginación). Apadrinables destacados primero.
 */
export function ShelterAnimalsGrid({
  animals,
  shelterName,
}: {
  animals: PublicAnimal[];
  shelterName: string;
}) {
  const t = useTranslations("shelterPublic");
  const tb = useTranslations("busqueda");
  const tAnimal = useTranslations("animales");

  const [busqueda, setBusqueda] = useState("");
  const [especie, setEspecie] = useState("");
  const [edad, setEdad] = useState("");

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda);
    return [...animals]
      .filter((a) => !q || normalizar(a.name).includes(q))
      .filter((a) => !especie || (a.species ?? "other") === especie)
      .filter((a) => !edad || edadEnBucket(a.birth_date_approx, edad as EdadBucket))
      .sort((a, b) => Number(b.sponsorable ?? false) - Number(a.sponsorable ?? false));
  }, [animals, busqueda, especie, edad]);

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-xl font-semibold">
          {t("animalsTitle")}{" "}
          <span className="text-primary">({filtrados.length})</span>
        </h2>
        {animals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={t("animalsSearchPlaceholder")}
                aria-label={tb("texto")}
                className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm sm:w-44"
              />
            </div>
            <label className="sr-only" htmlFor="grid-especie">
              {tb("especie")}
            </label>
            <select
              id="grid-especie"
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
              className="h-10 rounded-full border border-border bg-background px-3 text-sm"
            >
              <option value="">{tb("especie")}</option>
              {ESPECIES.map((e) => (
                <option key={e} value={e}>
                  {tAnimal(CLAVE_ESPECIE[e])}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="grid-edad">
              {tb("edad")}
            </label>
            <select
              id="grid-edad"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              className="h-10 rounded-full border border-border bg-background px-3 text-sm"
            >
              <option value="">{tb("edad")}</option>
              {EDADES.map((e) => (
                <option key={e} value={e}>
                  {tb(CLAVE_EDAD[e])}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {animals.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{t("noAnimals")}</p>
      ) : filtrados.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
          {t("noAnimalsFiltered")}
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((a) => (
            <li key={a.id}>
              <AnimalCard animal={aTarjeta(a, shelterName)} conCta conFavorito />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
