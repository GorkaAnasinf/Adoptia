"use client";

import { BadgeCheck, Globe, HandHeart, Home, MapPin, PawPrint } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { resumenHorario, tieneHorario } from "@/lib/opening-hours";
import type { OpeningHours, SocialLinks } from "@/lib/schemas/shelter";
import { cn } from "@/lib/utils";

export type PublicShelter = {
  name: string;
  logo_url?: string | null;
  description?: string | null;
  city?: string | null;
  province?: string | null;
  website?: string | null;
  social_links?: SocialLinks | null;
  opening_hours?: OpeningHours | null;
  accepts_volunteers?: boolean;
  accepts_fostering?: boolean;
  status?: string | null;
};

export type PublicAnimal = {
  id: string;
  name: string;
  slug: string;
  status: AnimalStatus;
  animal_media: { url: string; is_cover: boolean; sort_order: number }[];
};

const REDES: { key: keyof SocialLinks; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
];

function portada(media: PublicAnimal["animal_media"]): string | null {
  if (media.length === 0) return null;
  return (media.find((m) => m.is_cover) ?? [...media].sort((a, b) => a.sort_order - b.sort_order)[0]).url;
}

export function ShelterPublicProfile({
  shelter,
  animals = [],
  photos = [],
}: {
  shelter: PublicShelter;
  animals?: PublicAnimal[];
  photos?: { id: string; url: string }[];
}) {
  const t = useTranslations("shelterPublic");
  const td = useTranslations("onboarding");
  const ubicacion = [shelter.city, shelter.province].filter(Boolean).join(", ");
  const redes = REDES.filter((r) => {
    return Boolean(shelter.social_links?.[r.key]);
  });
  const horario = resumenHorario(shelter.opening_hours);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Cabecera */}
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
        {shelter.logo_url ? (
          <Image
            src={shelter.logo_url}
            alt={shelter.name}
            width={88}
            height={88}
            className="size-22 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <span className="flex size-22 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PawPrint className="size-10" aria-hidden="true" />
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-bold">{shelter.name}</h1>
          {ubicacion && (
            <p className="flex items-center justify-center gap-1.5 text-muted-foreground sm:justify-start">
              <MapPin className="size-4" aria-hidden="true" />
              {ubicacion}
            </p>
          )}
          {shelter.status === "verified" && (
            <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-tertiary sm:justify-start">
              <BadgeCheck className="size-4" aria-hidden="true" />
              {t("verified")}
            </p>
          )}
        </div>
      </header>

      {/* Colaboración + web */}
      {(shelter.accepts_volunteers || shelter.accepts_fostering || shelter.website) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {shelter.accepts_volunteers && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-tertiary/40 bg-tertiary/10 px-3 py-1 text-sm font-medium text-tertiary">
              <HandHeart className="size-4" aria-hidden="true" />
              {t("volunteers")}
            </span>
          )}
          {shelter.accepts_fostering && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary-foreground">
              <Home className="size-4" aria-hidden="true" />
              {t("fostering")}
            </span>
          )}
          {shelter.website && (
            <a
              href={shelter.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm font-medium hover:bg-accent"
            >
              <Globe className="size-4" aria-hidden="true" />
              {t("website")}
            </a>
          )}
        </div>
      )}

      {/* Sobre nosotros */}
      {shelter.description && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">{t("aboutTitle")}</h2>
          <p className="mt-2 whitespace-pre-line text-foreground/90">{shelter.description}</p>
        </section>
      )}

      {/* Instalaciones */}
      {photos.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">{t("facilitiesTitle")}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl border border-border">
                <Image
                  src={p.url}
                  alt=""
                  width={280}
                  height={210}
                  className="aspect-4/3 w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {/* Horario */}
        {tieneHorario(shelter.opening_hours) && (
          <section>
            <h2 className="font-heading text-lg font-semibold">{t("hoursTitle")}</h2>
            <dl className="mt-3 divide-y divide-border rounded-xl border border-border">
              {horario.map(({ dia, franjas }) => (
                <div key={dia} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <dt className="font-medium">{td(`days.${dia}`)}</dt>
                  <dd className={cn("tabular-nums", franjas ? "text-foreground" : "text-muted-foreground")}>
                    {franjas ?? t("closed")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Redes */}
        {redes.length > 0 && (
          <section>
            <h2 className="font-heading text-lg font-semibold">{t("contact")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {redes.map((r) => (
                <a
                  key={r.key}
                  href={shelter.social_links![r.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                  {r.label}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Animales en adopción */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold">{t("animalsTitle")}</h2>
        {animals.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t("noAnimals")}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {animals.map((a) => {
              const url = portada(a.animal_media);
              return (
                <li key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  {url ? (
                    <Image
                      src={url}
                      alt={a.name}
                      width={240}
                      height={180}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-muted-foreground">
                      <PawPrint className="size-8" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="min-w-0 truncate font-medium">{a.name}</span>
                    <AnimalStatusBadge status={a.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
