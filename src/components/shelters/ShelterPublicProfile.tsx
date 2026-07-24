"use client";

import { BadgeCheck, Globe, HandHeart, Home, Mail, MapPin, PawPrint } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { EnlaceExternoPago } from "@/components/apadrinamiento/EnlaceExternoPago";
import { MiniMapa } from "@/components/map/MiniMapa";
import { AyudarNecesidadButton } from "@/components/necesidades/AyudarNecesidadButton";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { parsePoint } from "@/lib/shelter-mapping";
import { ShelterAnimalsGrid } from "./ShelterAnimalsGrid";
import type { OpeningHours, SocialLinks } from "@/lib/schemas/shelter";

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
  // FEATURE-028: datos de la tarjeta y filtros del grid (opcionales para
  // no romper contextos que aún no los seleccionan, como la preview del panel).
  species?: "dog" | "cat" | "other" | null;
  sex?: "male" | "female" | "unknown" | null;
  size?: "small" | "medium" | "large" | null;
  breed?: string | null;
  birth_date_approx?: string | null;
  published_at?: string | null;
  animal_media: { url: string; is_cover: boolean; sort_order: number }[];
};

const REDES: { key: keyof SocialLinks; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
];

export type ShelterStats = { adopciones: number; disponibles: number };

export type PublicNeed = {
  id: string;
  categoria: string;
  descripcion: string;
  urgencia: string;
};

export function ShelterPublicProfile({
  shelter,
  animals = [],
  photos = [],
  stats,
  needs = [],
  autenticado = false,
}: {
  shelter: PublicShelter;
  animals?: PublicAnimal[];
  photos?: { id: string; url: string }[];
  stats?: ShelterStats | null;
  needs?: PublicNeed[];
  autenticado?: boolean;
}) {
  const t = useTranslations("shelterPublic");
  const tn = useTranslations("necesidades");
  const ubicacion = [shelter.city, shelter.province].filter(Boolean).join(", ");
  const redes = REDES.filter((r) => {
    return Boolean(shelter.social_links?.[r.key]);
  });
  const punto = parsePoint(shelter.location);

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
                <span
                  role="img"
                  aria-label={shelter.name}
                  className="flex size-20 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-primary sm:size-24"
                >
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

      {/* Necesidades abiertas (FEATURE-031) */}
      {needs.length > 0 && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">{tn("perfilTitulo")}</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {needs.map((n) => (
              <li key={n.id} className="flex flex-col gap-2 rounded-xl bg-muted/40 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {tn(`cat${n.categoria.charAt(0).toUpperCase()}${n.categoria.slice(1)}`)}
                  </span>
                  {n.urgencia === "urgente" && (
                    <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      {tn("urgenteChip")}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">{n.descripcion}</span>
                </div>
                <AyudarNecesidadButton needId={n.id} autenticado={autenticado} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Dos columnas: sobre nosotros + servicios | horario y ubicación (FEATURE-028) */}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
        {(shelter.description ||
          shelter.accepts_volunteers ||
          shelter.accepts_fostering ||
          shelter.website ||
          redes.length > 0) && (
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 lg:col-span-2">
            <h2 className="font-heading text-lg font-semibold">{t("aboutTitle")}</h2>
            {shelter.description && (
              <p className="mt-2 whitespace-pre-line text-foreground/90">{shelter.description}</p>
            )}
            {(shelter.accepts_volunteers || shelter.accepts_fostering || shelter.website) && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("servicesTitle")}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
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
              </div>
            )}
            {redes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("contact")}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
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
              </div>
            )}
          </section>
        )}

        {(punto || shelter.address) && (
          <aside className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">{t("locationTitle")}</h2>
            {punto && (
              <div className="mt-4 overflow-hidden rounded-xl">
                <MiniMapa lat={punto.lat} lng={punto.lng} />
              </div>
            )}
            {shelter.address && (
              <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {[shelter.address, shelter.city].filter(Boolean).join(", ")}
              </p>
            )}
          </aside>
        )}
      </div>

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

      {/* Animales en adopción (FEATURE-028): buscador + filtros client-side */}
      <ShelterAnimalsGrid animals={animals} shelterName={shelter.name} />
    </div>
  );
}
