import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PawPrint, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import { ESTADOS, type AnimalStatus } from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("animales");
  return { title: t("title") };
}

type MediaRow = { url: string; is_cover: boolean; sort_order: number };
type AnimalRow = {
  id: string;
  name: string;
  slug: string;
  species: "dog" | "cat" | "other";
  status: AnimalStatus;
  published_at: string | null;
  moderation_note: string | null;
  animal_media: MediaRow[];
};

function portada(media: MediaRow[]): string | null {
  if (media.length === 0) return null;
  const cover = media.find((m) => m.is_cover);
  if (cover) return cover.url;
  return [...media].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}

export default async function AnimalesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const t = await getTranslations("animales");
  const tm = await getTranslations("moderacion");
  const { estado } = await searchParams;
  const filtro: AnimalStatus | null = ESTADOS.includes(estado as AnimalStatus)
    ? (estado as AnimalStatus)
    : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let animales: AnimalRow[] = [];
  if (shelter) {
    let q = supabase
      .from("animals")
      .select("id,name,slug,species,status,published_at,moderation_note,animal_media(url,is_cover,sort_order)")
      .eq("shelter_id", shelter.id)
      .order("updated_at", { ascending: false });
    if (filtro) q = q.eq("status", filtro);
    const { data } = await q;
    animales = (data as AnimalRow[] | null) ?? [];
  }

  const filtros: Array<{ key: AnimalStatus | "all"; href: string }> = [
    { key: "all", href: "/panel/animales" },
    ...ESTADOS.map((e) => ({ key: e, href: `/panel/animales?estado=${e}` })),
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/panel/animales/nueva"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("new")}
        </Link>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label={t("colStatus")}>
        {filtros.map(({ key, href }) => {
          const activo = key === "all" ? filtro === null : filtro === key;
          return (
            <Link
              key={key}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                activo
                  ? "border-tertiary/40 bg-tertiary/12 text-tertiary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {key === "all" ? t("filterAll") : t(`status${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
            </Link>
          );
        })}
      </nav>

      {/* Aviso de moderación (FEATURE-011): fichas despublicadas por un admin */}
      {animales
        .filter((a) => a.moderation_note)
        .map((a) => (
          <p
            key={`mod-${a.id}`}
            className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <strong>{a.name}:</strong>{" "}
            {tm("avisoFichaModerada", { motivo: a.moderation_note ?? "" })}
          </p>
        ))}

      {animales.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <PawPrint className="size-10 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href="/panel/animales/nueva"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("count", { count: animales.length })}
          </p>

          {/* Escritorio: tabla */}
          <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("colAnimal")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colSpecies")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colVisibility")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {animales.map((a) => (
                  <tr key={a.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Miniatura url={portada(a.animal_media)} alt={a.name} noCover={t("noCover")} />
                        <span className="font-medium">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t(`species${a.species.charAt(0).toUpperCase()}${a.species.slice(1)}`)}
                    </td>
                    <td className="px-4 py-3">
                      <AnimalStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Visibilidad publicado={a.published_at != null} draft={t("draft")} pub={t("published")} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/panel/animales/${a.id}`}
                        className="font-semibold text-tertiary hover:underline"
                      >
                        {t("edit")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {animales.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/panel/animales/${a.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-accent/40"
                >
                  <Miniatura url={portada(a.animal_media)} alt={a.name} noCover={t("noCover")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`species${a.species.charAt(0).toUpperCase()}${a.species.slice(1)}`)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <AnimalStatusBadge status={a.status} />
                      <Visibilidad publicado={a.published_at != null} draft={t("draft")} pub={t("published")} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Miniatura({ url, alt, noCover }: { url: string | null; alt: string; noCover: string }) {
  if (!url) {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
        {noCover}
      </span>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={48}
      height={48}
      className="size-12 shrink-0 rounded-lg object-cover"
    />
  );
}

function Visibilidad({ publicado, draft, pub }: { publicado: boolean; draft: string; pub: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        publicado ? "bg-tertiary/12 text-tertiary" : "bg-muted text-muted-foreground",
      )}
    >
      {publicado ? pub : draft}
    </span>
  );
}
