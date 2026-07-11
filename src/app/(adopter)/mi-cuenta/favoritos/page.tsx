import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";
import { QuitarFavoritoButton } from "@/components/animals/QuitarFavoritoButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("favoritosTitle") };
}

type Favorito = {
  animal_id: string;
  animals: {
    name: string;
    slug: string;
    status: string;
    published_at: string | null;
    animal_media: { url: string; is_cover: boolean; sort_order: number }[] | null;
    shelters: { name: string } | null;
  } | null;
};

function portadaDe(f: Favorito): string | null {
  const media = (f.animals?.animal_media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = media[0]?.url ?? null;
  return esImagenValida(url) ? url : null;
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
       animals (name, slug, status, published_at,
         animal_media (url, is_cover, sort_order),
         shelters (name))`,
    )
    .order("created_at", { ascending: false });
  const favoritos = ((data as unknown as Favorito[] | null) ?? []).filter((f) => {
    return f.animals !== null;
  });

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("favoritosTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("favoritosSubtitle")}</p>

      {favoritos.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold">{t("favoritosEmptyTitle")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("favoritosEmptyText")}</p>
          <Link
            href="/animales"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            {t("favoritosEmptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {favoritos.map((f) => {
            const animal = f.animals!;
            const portada = portadaDe(f);
            const adoptado = animal.status === "adopted";
            return (
              <li
                key={f.animal_id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {portada ? (
                    <Image src={portada} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-full items-center justify-center text-3xl"
                    >
                      🐾
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/animales/${animal.slug}`}
                      className="font-heading text-lg font-semibold hover:underline"
                    >
                      {animal.name}
                    </Link>
                    {adoptado && (
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                        {t("favoritoAdoptado")}
                      </span>
                    )}
                  </div>
                  {animal.shelters && (
                    <p className="text-sm text-muted-foreground">{animal.shelters.name}</p>
                  )}
                  <div className="mt-auto">
                    <QuitarFavoritoButton animalId={f.animal_id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
