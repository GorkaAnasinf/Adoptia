import { Building2, Mars, PawPrint, Venus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { edadAproximada, esImagenValida } from "@/lib/animal-search";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { AnimalStatusBadge } from "./AnimalStatusBadge";
import { FavoritoOverlay } from "./FavoritoOverlay";
import { FotoCarrusel } from "./FotoCarrusel";

/** Fila que devuelve el RPC animals_search. */
export interface AnimalSearchResult {
  id: string;
  name: string;
  slug: string;
  species: "dog" | "cat" | "other";
  sex: "male" | "female" | "unknown";
  size: "small" | "medium" | "large" | null;
  /** Solo llega en contextos con select propio (perfil de protectora); el RPC no la devuelve. */
  breed?: string | null;
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
    animal.breed || null,
    edad ? t(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n }) : null,
    animal.size ? tAnimal(CLAVE_TAMANO[animal.size]) : null,
    animal.distance_m !== null ? t("distanciaDe", { km: Math.round(animal.distance_m / 1000) }) : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/animales/${animal.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-low shadow-soft transition duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary motion-safe:hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {esImagenValida(animal.cover_url) ? (
          <FotoCarrusel
            animalId={animal.id}
            coverUrl={animal.cover_url}
            alt={animal.name}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div
            role="img"
            aria-label={t("sinFoto")}
            className="flex h-full items-center justify-center text-muted-foreground"
          >
            <PawPrint className="size-10" aria-hidden="true" />
          </div>
        )}
        {animal.status !== "available" ? (
          <div className="absolute left-2 top-2">
            <AnimalStatusBadge status={animal.status} />
          </div>
        ) : (
          esRecienLlegado(animal.published_at) && (
            <span className="absolute left-3 top-3 rounded-full bg-primary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary-container shadow-sm">
              {t("badgeNuevo")}
            </span>
          )
        )}
      </div>
      {conFavorito && <FavoritoOverlay animalId={animal.id} />}
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
            className="mt-2 rounded-2xl border-2 border-primary px-4 py-1.5 text-center text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          >
            {t("ctaAdoptar")}
          </span>
        )}
      </div>
    </Link>
  );
}
