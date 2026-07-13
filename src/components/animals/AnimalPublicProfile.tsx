"use client";

import {
  Bird,
  Cake,
  Check,
  Dog,
  Mars,
  MapPin,
  PawPrint,
  Ruler,
  Share2,
  User,
  Venus,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { MiniMapa } from "@/components/map/MiniMapa";
import { EnlaceExternoPago } from "@/components/apadrinamiento/EnlaceExternoPago";
import { ReportarButton } from "@/components/moderacion/ReportarButton";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import { edadAproximada, esImagenValida } from "@/lib/animal-search";
import { fechaRelativa } from "@/lib/fecha-relativa";
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
  published_at?: string | null;
  description: string | null;
  good_with_kids: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  apartment_suitable: boolean | null;
  energy_level: "low" | "medium" | "high" | null;
  special_needs: string | null;
  sponsorable?: boolean;
  sponsor_link?: string | null;
  sponsor_note?: string | null;
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

const CLAVE_SEXO = { male: "sexMale", female: "sexFemale", unknown: "sexUnknown" } as const;
const CLAVE_TAMANO = { small: "sizeSmall", medium: "sizeMedium", large: "sizeLarge" } as const;
const CLAVE_ENERGIA = { low: "energyLow", medium: "energyMedium", high: "energyHigh" } as const;
const ICONO_ESPECIE = { dog: Dog, cat: PawPrint, other: Bird } as const;

type Icono = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/** Rasgo con icono en la fila inline bajo el nombre. */
function RasgoInline({ icono: Icono, texto }: { icono: Icono; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground/80">
      <Icono className="size-4 shrink-0 text-primary" aria-hidden={true} />
      {texto}
    </span>
  );
}

/** Pill de compatibilidad con color e icono según el valor (sí / no / desconocido). */
function PillCompat({ etiqueta, valor }: { etiqueta: string; valor: boolean | null }) {
  const estado = valor === null ? "unknown" : valor ? "si" : "no";
  const estilos = {
    si: "border-tertiary/40 bg-tertiary/10 text-tertiary",
    no: "border-destructive/30 bg-destructive/10 text-destructive",
    unknown: "border-border bg-muted text-muted-foreground",
  }[estado];
  return (
    <span
      data-compat={estado}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${estilos}`}
    >
      {estado === "no" ? (
        <X className="size-4 shrink-0" aria-hidden={true} />
      ) : (
        <Check className="size-4 shrink-0" aria-hidden={true} />
      )}
      {etiqueta}
    </span>
  );
}

/** Check verde de salud. */
function CheckSalud({ etiqueta }: { etiqueta: string }) {
  return (
    <li className="inline-flex items-center gap-2 text-sm">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tertiary/15 text-tertiary">
        <Check className="size-4" aria-hidden={true} />
      </span>
      {etiqueta}
    </li>
  );
}

/** Avatares genéricos (privacidad) + conteo real de interesados. */
function AvataresInteresados({ n }: { n: number }) {
  const t = useTranslations("ficha");
  return (
    <div className="flex items-center gap-2">
      {n > 0 && (
        <div className="flex -space-x-2" aria-hidden="true">
          {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
            <span
              key={i}
              className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-primary"
            >
              <User className="size-4" />
            </span>
          ))}
        </div>
      )}
      <span className="text-sm text-muted-foreground">{t("interesados", { n })}</span>
    </div>
  );
}

/** Tarjeta verde con los pasos del proceso de adopción. */
function ProcesoAdopcion() {
  const t = useTranslations("ficha");
  const pasos = [t("procesoPaso1"), t("procesoPaso2"), t("procesoPaso3"), t("procesoPaso4")];
  return (
    <section className="rounded-2xl border border-tertiary/30 bg-tertiary/10 p-5">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-tertiary">
        <PawPrint className="size-5" aria-hidden={true} />
        {t("procesoTitle")}
      </h2>
      <ol className="mt-3 space-y-2.5">
        {pasos.map((paso, i) => (
          <li key={paso} className="flex items-center gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tertiary/20 text-xs font-semibold text-tertiary">
              {i + 1}
            </span>
            {paso}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AnimalPublicProfile({
  animal,
  shareUrl,
  interesados = 0,
}: {
  animal: PublicAnimalFull;
  shareUrl: string;
  interesados?: number;
}) {
  const t = useTranslations("ficha");
  const tGuias = useTranslations("guias");
  const tAnimal = useTranslations("animales");
  const tBusqueda = useTranslations("busqueda");

  const edad = edadAproximada(animal.birth_date_approx);
  const IconoSexo = animal.sex === "female" ? Venus : Mars;
  const IconoEspecie = ICONO_ESPECIE[animal.species];

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    t("compartirTexto", { nombre: animal.name, url: shareUrl }),
  )}`;
  const disponible = animal.status === "available";
  const ubicacion = [animal.shelter.city, animal.shelter.province].filter(Boolean).join(", ");
  const publicado = animal.published_at ? fechaRelativa(animal.published_at) : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 lg:pb-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Columna de contenido */}
        <div className="space-y-6">
          <AnimalGallery name={animal.name} media={animal.media} />

          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <AnimalStatusBadge status={animal.status} />
              {publicado && <span>· {t("publicadoHace", { rel: publicado })}</span>}
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary">{animal.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {edad && (
                <RasgoInline
                  icono={Cake}
                  texto={tBusqueda(edad.unidad === "anios" ? "edadAnios" : "edadMeses", {
                    n: edad.n,
                  })}
                />
              )}
              <RasgoInline icono={IconoSexo} texto={tAnimal(CLAVE_SEXO[animal.sex])} />
              {animal.size && (
                <RasgoInline
                  icono={Ruler}
                  texto={
                    animal.weight_kg
                      ? `${tAnimal(CLAVE_TAMANO[animal.size])} (${t("pesoKg", { kg: animal.weight_kg })})`
                      : tAnimal(CLAVE_TAMANO[animal.size])
                  }
                />
              )}
              {animal.breed && <RasgoInline icono={IconoEspecie} texto={animal.breed} />}
            </div>
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

          {/* Compatibilidad */}
          <section>
            <h2 className="font-heading text-lg font-semibold">{t("compatTitle")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <PillCompat etiqueta={tAnimal("compatKids")} valor={animal.good_with_kids} />
              <PillCompat etiqueta={tAnimal("compatDogs")} valor={animal.good_with_dogs} />
              <PillCompat etiqueta={tAnimal("compatCats")} valor={animal.good_with_cats} />
              <PillCompat etiqueta={t("aptoPiso")} valor={animal.apartment_suitable} />
              {animal.energy_level && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
                  <Zap className="size-4 shrink-0" aria-hidden={true} />
                  {tAnimal(CLAVE_ENERGIA[animal.energy_level])}
                </span>
              )}
            </div>
          </section>

          {/* Salud */}
          <section>
            <h2 className="font-heading text-lg font-semibold">{t("healthTitle")}</h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {(
                [
                  [t("vacunado"), animal.vaccinated],
                  [t("esterilizado"), animal.sterilized],
                  [t("microchip"), animal.microchipped],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([etiqueta]) => (
                  <CheckSalud key={etiqueta} etiqueta={etiqueta} />
                ))}
            </ul>
            {animal.special_needs && (
              <p className="mt-3 text-sm">
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
            {animal.adoption_fee !== null && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("fee")}:{" "}
                <span className="font-semibold text-foreground">{animal.adoption_fee} €</span>
              </p>
            )}
          </section>

          {/* Historia */}
          {animal.description && (
            <section>
              <h2 className="font-heading text-xl font-semibold">{t("historiaTitle")}</h2>
              <p className="mt-2 whitespace-pre-line text-foreground/90">{animal.description}</p>
            </section>
          )}

          {/* Protectora */}
          <section>
            <h2 className="font-heading text-xl font-semibold">{t("shelterTitle")}</h2>
            <div className="mt-3 rounded-2xl border border-border bg-card p-4">
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
                    <PawPrint className="size-7" aria-hidden={true} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{animal.shelter.name}</p>
                  {ubicacion && (
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden={true} />
                      {ubicacion}
                    </p>
                  )}
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

          {/* Apadrinamiento (FEATURE-013) */}
          {animal.sponsorable && animal.sponsor_link && (
            <section className="rounded-2xl bg-tertiary/10 px-6 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-tertiary/20 px-3 py-1 text-sm font-semibold text-tertiary">
                  {t("sponsorBadge")}
                </span>
                <h2 className="font-heading text-xl font-semibold">
                  {t("sponsorTitle", { nombre: animal.name })}
                </h2>
              </div>
              {animal.sponsor_note && (
                <p className="mt-2 max-w-2xl text-muted-foreground">{animal.sponsor_note}</p>
              )}
              <div className="mt-4">
                <EnlaceExternoPago
                  href={animal.sponsor_link}
                  cta={t("sponsorCta")}
                  aviso={t("sponsorAviso")}
                  continuar={t("sponsorContinuar")}
                  cancelar={t("sponsorCancelar")}
                  registrarUrl={`/api/apadrinar/${animal.id}`}
                />
              </div>
            </section>
          )}

          {/* Guías (FEATURE-015) + Reportar (FEATURE-011) */}
          <div className="flex flex-col gap-3">
            <Link href="/guias" className="text-sm text-primary underline-offset-4 hover:underline">
              {tGuias("fichaCta")}
            </Link>
            <ReportarButton animalId={animal.id} />
          </div>
        </div>

        {/* Columna de acción (sticky en desktop) */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">{t("enamoradoTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("enamoradoText", { nombre: animal.name })}
            </p>
            <div className="mt-4 space-y-2.5">
              {disponible && <InterestButton slug={animal.slug} full />}
              <FavoritoButton animalId={animal.id} variant="wide" />
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-input bg-card px-5 py-2.5 text-sm font-medium hover:border-primary/50"
              >
                <Share2 className="size-4" aria-hidden={true} />
                {t("compartir")}
              </a>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <AvataresInteresados n={interesados} />
            </div>
          </section>

          <ProcesoAdopcion />
        </aside>
      </div>

      {/* Barra sticky (móvil) */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        {disponible ? (
          <div className="flex-1">
            <InterestButton slug={animal.slug} full />
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
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-input bg-card"
        >
          <Share2 className="size-5" aria-hidden={true} />
        </a>
      </div>
    </div>
  );
}
