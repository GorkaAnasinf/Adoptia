import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import {
  AnimalPublicProfile,
  type PublicAnimalFull,
} from "@/components/animals/AnimalPublicProfile";
import { parsePoint } from "@/lib/shelter-mapping";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ slug: string }>;

const CAMPOS = `id, name, slug, species, breed, sex, size, birth_date_approx, weight_kg,
  status, description, good_with_kids, good_with_dogs, good_with_cats, apartment_suitable,
  energy_level, special_needs, vaccinated, sterilized, microchipped, health_notes,
  adoption_fee, published_at, sponsorable, sponsor_link, sponsor_note,
  animal_media (url, is_cover, sort_order),
  shelters (name, slug, city, province, logo_url, location, status)`;

async function cargarAnimal(slug: string): Promise<PublicAnimalFull | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("animals").select(CAMPOS).eq("slug", slug).maybeSingle();
  if (!data) return null;

  const fila = data as Record<string, unknown>;
  const shelter = fila.shelters as {
    name: string;
    slug: string;
    city: string | null;
    province: string | null;
    logo_url: string | null;
    location: unknown;
  } | null;
  if (!shelter) return null;

  const punto = parsePoint(shelter.location);
  return {
    ...(fila as unknown as Omit<PublicAnimalFull, "media" | "shelter">),
    media: (fila.animal_media as PublicAnimalFull["media"]) ?? [],
    shelter: {
      name: shelter.name,
      slug: shelter.slug,
      city: shelter.city,
      province: shelter.province,
      logo_url: shelter.logo_url,
      lat: punto?.lat ?? null,
      lng: punto?.lng ?? null,
    },
  };
}

async function cargarSugerencias(): Promise<AnimalSearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("animals_search", { p_limit: 4 });
  if (error || !data) return [];
  return data as AnimalSearchResult[];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("ficha");
  const animal = await cargarAnimal(slug);
  if (!animal) {
    return { title: t("notFoundTitle"), robots: { index: false } };
  }
  const titulo = t("metaTitle", { nombre: animal.name });
  const descripcion = animal.description?.slice(0, 160) ?? undefined;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/animales/${animal.slug}` },
    openGraph: {
      title: titulo,
      description: descripcion,
      type: "website",
      url: `/animales/${animal.slug}`,
      images: [`/api/og/${animal.slug}`],
    },
    twitter: { card: "summary_large_image" },
  };
}

/** JSON-LD (schema.org) de la ficha: el animal como Product ofrecido por la protectora. */
function jsonLdAnimal(animal: PublicAnimalFull, url: string) {
  const portada = animal.media.find((m) => m.is_cover) ?? animal.media[0];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: animal.name,
    description: animal.description ?? undefined,
    image: portada?.url ? [portada.url] : undefined,
    url,
    offers: {
      "@type": "Offer",
      availability:
        animal.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      price: animal.adoption_fee ?? 0,
      priceCurrency: "EUR",
      offeredBy: {
        "@type": "Organization",
        name: animal.shelter.name,
        address: animal.shelter.city ?? undefined,
      },
    },
  };
}

export default async function AnimalPublicoPage({ params }: { params: Params }) {
  const { slug } = await params;
  const animal = await cargarAnimal(slug);

  // Página amable para despublicados/inexistentes: sugerencias, no 404 seco.
  if (!animal) {
    const t = await getTranslations("ficha");
    const sugerencias = await cargarSugerencias();
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("notFoundText")}</p>
        </div>
        {sugerencias.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {sugerencias.map((a) => (
              <li key={a.id}>
                <AnimalCard animal={a} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 text-center">
          <Link
            href="/animales"
            className="inline-flex rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
          >
            {t("verTodos")}
          </Link>
        </div>
      </main>
    );
  }

  // Métrica de visitas (FEATURE-014): agregado anónimo por día, best-effort.
  try {
    const supabase = await createClient();
    await supabase.rpc("registrar_visita", { p_animal_id: animal.id });
  } catch {
    // Sin BD o sin RPC: la ficha se sirve igual.
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/animales/${animal.slug}`;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdAnimal(animal, shareUrl)) }}
      />
      <AnimalPublicProfile animal={animal} shareUrl={shareUrl} />
    </>
  );
}
