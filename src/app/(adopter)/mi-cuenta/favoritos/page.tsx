import { BellPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { VaciarFavoritosButton } from "@/components/animals/VaciarFavoritosButton";
import { Reveal } from "@/components/ui/Reveal";
import { esImagenValida } from "@/lib/animal-search";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("favoritosTitle") };
}

type Media = { url: string; is_cover: boolean; sort_order: number };
type Favorito = {
  animal_id: string;
  animals: {
    id: string;
    name: string;
    slug: string;
    status: AnimalStatus;
    species: "dog" | "cat" | "other" | null;
    sex: "male" | "female" | "unknown" | null;
    size: "small" | "medium" | "large" | null;
    breed: string | null;
    birth_date_approx: string | null;
    published_at: string | null;
    animal_media: Media[] | null;
    shelters: { name: string; slug: string } | null;
  } | null;
};

function portadaDe(media: Media[] | null): string | null {
  const orden = (media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = orden[0]?.url ?? null;
  return esImagenValida(url) ? url : null;
}

/** Adapta una fila de favoritos al formato de tarjeta compartido con el listado. */
function aTarjeta(f: Favorito): AnimalSearchResult {
  const a = f.animals!;
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
    shelter_name: a.shelters?.name ?? "",
    shelter_slug: a.shelters?.slug ?? "",
    city: null,
    province: null,
    distance_m: null,
    cover_url: portadaDe(a.animal_media),
    total_count: 0,
  };
}

/** Favoritos del adoptante (RLS: solo los suyos). */
export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("account");
  const { data } = await supabase
    .from("favorites")
    .select(
      `animal_id,
       animals (id, name, slug, status, species, sex, size, breed, birth_date_approx, published_at,
         animal_media (url, is_cover, sort_order),
         shelters (name, slug))`,
    )
    .order("created_at", { ascending: false });
  const favoritos = ((data as unknown as Favorito[] | null) ?? []).filter((f) => f.animals !== null);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("favoritosTitle")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("favoritosSubtitle")}</p>
        </div>
        {favoritos.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {t("favoritosCount", { n: favoritos.length })}
            </span>
            <VaciarFavoritosButton />
          </div>
        )}
      </div>

      {favoritos.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-soft">
          <span aria-hidden="true" className="text-4xl">
            🐾
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold">{t("favoritosEmptyTitle")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("favoritosEmptyText")}</p>
          <Link
            href="/animales"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            {t("favoritosEmptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {favoritos.map((f, i) => (
            <li key={f.animal_id}>
              <Reveal delayMs={(i % 4) * 80} className="h-full">
                <AnimalCard animal={aTarjeta(f)} conFavorito />
              </Reveal>
            </li>
          ))}
        </ul>
      )}

      {favoritos.length > 0 && (
        <Reveal className="mt-10">
          <aside className="flex flex-col gap-4 rounded-2xl bg-surface-container p-6 sm:flex-row sm:items-center sm:gap-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <BellPlus className="size-7" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-semibold text-secondary">
                {t("favoritosAlertaTitulo")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("favoritosAlertaTexto")}</p>
            </div>
            <Link
              href="/animales"
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-secondary/40 px-5 text-sm font-semibold text-secondary hover:bg-secondary/10"
            >
              {t("favoritosAlertaCta")}
            </Link>
          </aside>
        </Reveal>
      )}
    </section>
  );
}
