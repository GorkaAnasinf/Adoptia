import { Building2, Mars, Venus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { edadAproximada, esImagenValida } from "@/lib/animal-search";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { AnimalStatusBadge } from "./AnimalStatusBadge";
import { FavoritoButton } from "./FavoritoButton";

/** Fila que devuelve el RPC animals_search. */
export interface AnimalSearchResult {
  id: string;
  name: string;
  slug: string;
  species: "dog" | "cat" | "other";
  sex: "male" | "female" | "unknown";
  size: "small" | "medium" | "large" | null;
  birth_date_approx: string | null;
  status: AnimalStatus;
  published_at: string;
  shelter_name: string;
  shelter_slug: string;
  city: string | null;
  province: string | null;
  distance_m: number | null;
  cover_url: string | null;
  total_count: number;
}

const CLAVE_TAMANO = { small: "sizeSmall", medium: "sizeMedium", large: "sizeLarge" } as const;

const DIAS_NUEVO = 14;

function esRecienLlegado(publishedAt: string | null): boolean {
  if (!publishedAt) return false;
  const publicado = new Date(publishedAt).getTime();
  return Number.isFinite(publicado) && Date.now() - publicado < DIAS_NUEVO * 86_400_000;
}

export function AnimalCard({
  animal,
  conCta = false,
  conFavorito = false,
}: {
  animal: AnimalSearchResult;
  conCta?: boolean;
  conFavorito?: boolean;
}) {
  const t = useTranslations("busqueda");
  const tAnimal = useTranslations("animales");

  const edad = edadAproximada(animal.birth_date_approx);
  const datos = [
    edad ? t(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n }) : null,
    animal.size ? tAnimal(CLAVE_TAMANO[animal.size]) : null,
    animal.distance_m !== null ? t("distanciaDe", { km: Math.round(animal.distance_m / 1000) }) : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/animales/${animal.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {esImagenValida(animal.cover_url) ? (
          <Image
            src={animal.cover_url}
            alt={animal.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("sinFoto")}
          </div>
        )}
        {animal.status !== "available" ? (
          <div className="absolute left-2 top-2">
            <AnimalStatusBadge status={animal.status} />
          </div>
        ) : (
          esRecienLlegado(animal.published_at) && (
            <span className="absolute bottom-2 left-2 rounded-full bg-primary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              {t("badgeNuevo")}
            </span>
          )
        )}
      </div>
      {conFavorito && (
        // Corta el clic hacia el Link: marcar favorito no debe navegar a la ficha
        <div
          className="absolute right-2 top-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <FavoritoButton animalId={animal.id} />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="flex items-center gap-1.5 font-heading text-base font-semibold text-primary">
          {animal.name}
          {animal.sex === "male" && (
            <Mars className="size-4 text-secondary" aria-label={tAnimal("sexMale")} role="img" />
          )}
          {animal.sex === "female" && (
            <Venus className="size-4 text-secondary" aria-label={tAnimal("sexFemale")} role="img" />
          )}
        </h3>
        {datos.length > 0 && <p className="text-sm text-muted-foreground">{datos.join(" · ")}</p>}
        <p className="mt-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{animal.shelter_name}</span>
        </p>
        {conCta && (
          <span
            aria-hidden="true"
            className="mt-2 rounded-full border border-primary px-4 py-1.5 text-center text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          >
            {t("ctaAdoptar")}
          </span>
        )}
      </div>
    </Link>
  );
}
