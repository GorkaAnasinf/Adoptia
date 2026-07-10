import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { edadAproximada, esImagenValida } from "@/lib/animal-search";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { AnimalStatusBadge } from "./AnimalStatusBadge";

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

const CLAVE_ESPECIE = { dog: "speciesDog", cat: "speciesCat", other: "speciesOther" } as const;
const CLAVE_SEXO = { male: "sexMale", female: "sexFemale", unknown: "sexUnknown" } as const;

export function AnimalCard({ animal }: { animal: AnimalSearchResult }) {
  const t = useTranslations("busqueda");
  const tAnimal = useTranslations("animales");

  const edad = edadAproximada(animal.birth_date_approx);
  const rasgos = [
    tAnimal(CLAVE_ESPECIE[animal.species]),
    tAnimal(CLAVE_SEXO[animal.sex]),
    edad ? t(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n }) : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/animales/${animal.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
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
        {animal.status !== "available" && (
          <div className="absolute left-2 top-2">
            <AnimalStatusBadge status={animal.status} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-heading text-base font-semibold text-foreground">{animal.name}</h3>
        <p className="text-sm text-muted-foreground">{rasgos.join(" · ")}</p>
        {(animal.city || animal.distance_m !== null) && (
          <p className="mt-auto pt-1 text-sm text-muted-foreground">
            {animal.city}
            {animal.distance_m !== null && (
              <span className="ml-1 font-medium text-secondary">
                {t("distanciaDe", { km: Math.round(animal.distance_m / 1000) })}
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
