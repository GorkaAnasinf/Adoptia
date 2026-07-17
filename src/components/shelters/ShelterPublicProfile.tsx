"use client";

import { BadgeCheck, Globe, HandHeart, Home, Mail, MapPin, PawPrint } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import { EnlaceExternoPago } from "@/components/apadrinamiento/EnlaceExternoPago";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { resumenHorario, tieneHorario } from "@/lib/opening-hours";
import type { OpeningHours, SocialLinks } from "@/lib/schemas/shelter";
import { cn } from "@/lib/utils";

export type PublicShelter = {
  name: string;
  logo_url?: string | null;
  cover_url?: string | null;
  founded_year?: number | null;
  email?: string | null;
  address?: string | null;
  location?: unknown;
  description?: string | null;
  city?: string | null;
  province?: string | null;
  website?: string | null;
  social_links?: SocialLinks | null;
  opening_hours?: OpeningHours | null;
  accepts_volunteers?: boolean;
  accepts_fostering?: boolean;
  status?: string | null;
  donation_link?: string | null;
};

export type PublicAnimal = {
  id: string;
  name: string;
  slug: string;
  status: AnimalStatus;
  sponsorable?: boolean;
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

export type ShelterStats = { adopciones: number; disponibles: number };

export function ShelterPublicProfile({
  shelter,
  animals = [],
  photos = [],
  stats,
}: {
  shelter: PublicShelter;
  animals?: PublicAnimal[];
  photos?: { id: string; url: string }[];
  stats?: ShelterStats | null;
}) {
  const t = useTranslations("shelterPublic");
  const td = useTranslations("onboarding");
  const ubicacion = [shelter.city, shelter.province].filter(Boolean).join(", ");
  const redes = REDES.filter((r) => {
    return Boolean(shelter.social_links?.[r.key]);
  });
  const horario = resumenHorario(shelter.opening_hours);

  // Métricas (FEATURE-028): cada tile solo con dato real; nada de «0 años».
  const anios = shelter.founded_year ? new Date().getFullYear() - shelter.founded_year : 0;
  const metricas: { valor: number; etiqueta: string }[] = [
    ...(stats && stats.adopciones > 0
      ? [{ valor: stats.adopciones, etiqueta: t("metricsAdoptions") }]
      : []),
    ...(stats && stats.disponibles > 0
      ? [{ valor: stats.disponibles, etiqueta: t("metricsAnimals") }]
      : []),
    ...(anios >= 1 ? [{ valor: anios, etiqueta: t("metricsYears") }] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero: portada + avatar + identidad + CTAs (FEATURE-028) */}
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-40 w-full sm:h-56">
          {shelter.cover_url ? (
            <Image
              src={shelter.cover_url}
              alt={t("coverAlt", { name: shelter.name })}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
              priority
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full bg-linear-to-br from-primary/80 via-primary-container/70 to-secondary/60"
            />
          )}
        </div>
        <div className="relative flex flex-col gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:text-left">
            <div className="-mt-10 shrink-0 sm:-mt-12">
              {shelter.logo_url ? (
                <Image
                  src={shelter.logo_url}
                  alt={shelter.name}
                  width={96}
                  height={96}
                  className="size-20 rounded-full border-4 border-card bg-card object-cover sm:size-24"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-primary sm:size-24">
                  <PawPrint className="size-10" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl">{shelter.name}</h1>
                {shelter.status === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/15 px-2.5 py-0.5 text-xs font-semibold text-tertiary">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    {t("verified")}
                  </span>
                )}
              </div>
              {ubicacion && (
                <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <MapPin className="size-4" aria-hidden="true" />
                  {ubicacion}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:justify-end">
            {shelter.email && (
              <a
                href={`mailto:${shelter.email}`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90"
              >
                <Mail className="size-4" aria-hidden="true" />
                {t("contactCta")}
              </a>
            )}
            {shelter.donation_link && (
              <EnlaceExternoPago
                href={shelter.donation_link}
                cta={t("donarCta")}
                aviso={t("donarAviso")}
                continuar={t("donarContinuar")}
                cancelar={t("donarCancelar")}
                variante="secondary"
              />
            )}
          </div>
        </div>
      </header>

      {/* Franja de métricas (FEATURE-028) */}
      {metricas.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-3">
          {metricas.map((m) => (
            <div
              key={m.etiqueta}
              className="flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-card px-3 py-4"
            >
              <dd className="font-heading text-2xl font-bold text-primary sm:text-3xl">
                {m.valor}
              </dd>
              <dt className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {m.etiqueta}
              </dt>
            </div>
          ))}
        </dl>
      )}

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

      {/* Animales en adopción (apadrinables destacados primero) */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold">{t("animalsTitle")}</h2>
        {animals.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t("noAnimals")}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[...animals]
              .sort((a, b) => Number(b.sponsorable ?? false) - Number(a.sponsorable ?? false))
              .map((a) => {
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
                    <span className="flex shrink-0 items-center gap-1">
                      {a.sponsorable && (
                        <span className="rounded-full bg-tertiary/15 px-2 py-0.5 text-xs font-semibold text-tertiary">
                          {t("sponsorBadge")}
                        </span>
                      )}
                      <AnimalStatusBadge status={a.status} />
                    </span>
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
