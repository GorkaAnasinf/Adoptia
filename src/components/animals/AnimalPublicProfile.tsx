"use client";

import { MapPin, PawPrint, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MiniMapa } from "@/components/map/MiniMapa";
import { edadAproximada, esImagenValida } from "@/lib/animal-search";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { AnimalGallery, type AnimalMedia } from "./AnimalGallery";
import { FavoritoButton } from "./FavoritoButton";
import { InterestButton } from "./InterestButton";

export type PublicAnimalFull = {
  id: string;
  name: string;
  slug: string;
  species: "dog" | "cat" | "other";
  breed: string | null;
  sex: "male" | "female" | "unknown";
  size: "small" | "medium" | "large" | null;
  birth_date_approx: string | null;
  weight_kg: number | null;
  status: AnimalStatus;
  description: string | null;
  good_with_kids: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  apartment_suitable: boolean | null;
  energy_level: "low" | "medium" | "high" | null;
  special_needs: string | null;
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
  health_notes: string | null;
  adoption_fee: number | null;
  media: AnimalMedia[];
  shelter: {
    name: string;
    slug: string;
    city: string | null;
    province: string | null;
    logo_url: string | null;
    lat: number | null;
    lng: number | null;
  };
};

const CLAVE_ESPECIE = { dog: "speciesDog", cat: "speciesCat", other: "speciesOther" } as const;
const CLAVE_SEXO = { male: "sexMale", female: "sexFemale", unknown: "sexUnknown" } as const;
const CLAVE_TAMANO = { small: "sizeSmall", medium: "sizeMedium", large: "sizeLarge" } as const;
const CLAVE_ENERGIA = { low: "energyLow", medium: "energyMedium", high: "energyHigh" } as const;

function FilaTri({ etiqueta, valor }: { etiqueta: string; valor: boolean | null }) {
  const tAnimal = useTranslations("animales");
  const texto = valor === null ? tAnimal("triUnknown") : valor ? tAnimal("triYes") : tAnimal("triNo");
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
      <dt className="font-medium">{etiqueta}</dt>
      <dd className={valor === null ? "text-muted-foreground" : "text-foreground"}>{texto}</dd>
    </div>
  );
}

export function AnimalPublicProfile({
  animal,
  shareUrl,
}: {
  animal: PublicAnimalFull;
  shareUrl: string;
}) {
  const t = useTranslations("ficha");
  const tAnimal = useTranslations("animales");
  const tBusqueda = useTranslations("busqueda");

  const edad = edadAproximada(animal.birth_date_approx);
  const rasgos: [string, string][] = [
    [tAnimal("fSpecies"), tAnimal(CLAVE_ESPECIE[animal.species])],
    ...(animal.breed ? ([[t("raza"), animal.breed]] as [string, string][]) : []),
    [tAnimal("fSex"), tAnimal(CLAVE_SEXO[animal.sex])],
    ...(animal.size ? ([[tAnimal("fSize"), tAnimal(CLAVE_TAMANO[animal.size])]] as [string, string][]) : []),
    ...(edad
      ? ([[t("edad"), tBusqueda(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n })]] as [string, string][])
      : []),
    ...(animal.weight_kg ? ([[t("peso"), t("pesoKg", { kg: animal.weight_kg })]] as [string, string][]) : []),
    ...(animal.energy_level
      ? ([[t("energia"), tAnimal(CLAVE_ENERGIA[animal.energy_level])]] as [string, string][])
      : []),
  ];

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    t("compartirTexto", { nombre: animal.name, url: shareUrl }),
  )}`;
  const disponible = animal.status === "available";
  const ubicacion = [animal.shelter.city, animal.shelter.province].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-28 lg:pb-8">
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <AnimalGallery name={animal.name} media={animal.media} />
        </div>

        <div className="space-y-5">
          <header>
            <h1 className="font-heading text-3xl font-bold">{animal.name}</h1>
            {ubicacion && (
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {ubicacion}
              </p>
            )}
          </header>

          {animal.status === "adopted" && (
            <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 font-medium text-primary">
              {t("adoptedNotice", { nombre: animal.name })}
            </p>
          )}
          {animal.status === "reserved" && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-medium text-amber-800">
              {t("reservedNotice", { nombre: animal.name })}
            </p>
          )}

          <dl className="flex flex-wrap gap-2">
            {rasgos.map(([etiqueta, valor]) => (
              <div
                key={etiqueta}
                className="rounded-full border border-input bg-white px-3 py-1.5 text-sm"
              >
                <dt className="sr-only">{etiqueta}</dt>
                <dd>
                  <span className="text-muted-foreground">{etiqueta}: </span>
                  <span className="font-medium">{valor}</span>
                </dd>
              </div>
            ))}
          </dl>

          {/* Acciones (desktop) */}
          <div className="hidden items-center gap-3 lg:flex">
            {disponible && <InterestButton slug={animal.slug} />}
            <FavoritoButton animalId={animal.id} />
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-white px-5 py-2.5 text-sm font-medium hover:border-primary/50"
            >
              <Share2 className="size-4" aria-hidden="true" />
              {t("compartir")}
            </a>
          </div>

          {animal.adoption_fee !== null && (
            <p className="text-sm text-muted-foreground">
              {t("fee")}: <span className="font-semibold text-foreground">{animal.adoption_fee} €</span>
            </p>
          )}

          {/* Convivencia */}
          <section>
            <h2 className="font-heading text-lg font-semibold">{t("compatTitle")}</h2>
            <dl className="mt-2 divide-y divide-border rounded-xl border border-border bg-white">
              <FilaTri etiqueta={tAnimal("compatKids")} valor={animal.good_with_kids} />
              <FilaTri etiqueta={tAnimal("compatDogs")} valor={animal.good_with_dogs} />
              <FilaTri etiqueta={tAnimal("compatCats")} valor={animal.good_with_cats} />
              <FilaTri etiqueta={t("aptoPiso")} valor={animal.apartment_suitable} />
            </dl>
          </section>

          {/* Salud */}
          <section>
            <h2 className="font-heading text-lg font-semibold">{t("healthTitle")}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  [t("vacunado"), animal.vaccinated],
                  [t("esterilizado"), animal.sterilized],
                  [t("microchip"), animal.microchipped],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([etiqueta]) => (
                  <li
                    key={etiqueta}
                    className="rounded-full border border-tertiary/40 bg-tertiary/10 px-3 py-1 text-sm font-medium text-tertiary"
                  >
                    {etiqueta}
                  </li>
                ))}
            </ul>
            {animal.special_needs && (
              <p className="mt-2 text-sm">
                <span className="font-medium">{t("necesidades")}: </span>
                {animal.special_needs}
              </p>
            )}
            {animal.health_notes && (
              <p className="mt-2 text-sm">
                <span className="font-medium">{t("notasSalud")}: </span>
                {animal.health_notes}
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Historia */}
      {animal.description && (
        <section className="mt-10 max-w-3xl">
          <h2 className="font-heading text-xl font-semibold">{t("historiaTitle")}</h2>
          <p className="mt-2 whitespace-pre-line text-foreground/90">{animal.description}</p>
        </section>
      )}

      {/* Protectora */}
      <section className="mt-10 max-w-3xl">
        <h2 className="font-heading text-xl font-semibold">{t("shelterTitle")}</h2>
        <div className="mt-3 rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center gap-3">
            {esImagenValida(animal.shelter.logo_url) ? (
              <Image
                src={animal.shelter.logo_url}
                alt={animal.shelter.name}
                width={56}
                height={56}
                className="size-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PawPrint className="size-7" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{animal.shelter.name}</p>
              {ubicacion && <p className="truncate text-sm text-muted-foreground">{ubicacion}</p>}
            </div>
            <Link
              href={`/protectoras/${animal.shelter.slug}`}
              className="ml-auto shrink-0 rounded-full border border-input px-4 py-2 text-sm font-medium hover:border-primary/50"
            >
              {t("verProtectora")}
            </Link>
          </div>
          {animal.shelter.lat !== null && animal.shelter.lng !== null && (
            <div className="mt-4">
              <MiniMapa lat={animal.shelter.lat} lng={animal.shelter.lng} />
            </div>
          )}
        </div>
      </section>

      {/* Barra sticky (móvil) */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {disponible ? (
          <div className="flex-1">
            <InterestButton slug={animal.slug} />
          </div>
        ) : (
          <span className="flex-1" />
        )}
        <FavoritoButton animalId={animal.id} />
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("compartir")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-input bg-white"
        >
          <Share2 className="size-5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
