import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { MiniMapa } from "@/components/map/MiniMapa";
import { ResolverAvisoButton } from "@/components/perdidos/ResolverAvisoButton";
import { esImagenValida } from "@/lib/animal-search";
import { parsePoint } from "@/lib/shelter-mapping";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations("perdidos");
  void (await params);
  return { title: t("title"), robots: { index: false } };
}

type Aviso = {
  id: string;
  user_id: string;
  type: "lost" | "found";
  species: "dog" | "cat" | "other";
  name: string | null;
  description: string;
  photo_url: string | null;
  city: string | null;
  status: "open" | "resolved" | "archived";
  resolution_story: string | null;
  location: unknown;
  created_at: string;
};

/** Detalle de un aviso: ubicación ya redondeada en BD (privacidad). */
export default async function AvisoPage({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getTranslations("perdidos");
  const tAnimales = await getTranslations("animales");
  const format = await getFormatter();

  const supabase = await createClient();
  const [{ data }, { data: auth }] = await Promise.all([
    supabase
      .from("lost_found_posts")
      .select(
        "id, user_id, type, species, name, description, photo_url, city, status, resolution_story, location, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const aviso = data as Aviso | null;

  if (!aviso) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <span aria-hidden className="text-6xl">
          🤔
        </span>
        <h1 className="font-heading text-2xl font-bold">{t("noEncontrado")}</h1>
        <Link href="/perdidos-encontrados" className="text-primary underline-offset-4 hover:underline">
          {t("volverMapa")}
        </Link>
      </section>
    );
  }

  const punto = parsePoint(aviso.location);
  const esAutor = auth.user?.id === aviso.user_id;
  const ESPECIE: Record<string, string> = {
    dog: tAnimales("speciesDog"),
    cat: tAnimales("speciesCat"),
    other: tAnimales("speciesOther"),
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            aviso.type === "lost" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {t(aviso.type === "lost" ? "tipoLost" : "tipoFound")}
        </span>
        {aviso.status === "resolved" && (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">
            {t("resueltoBadge")}
          </span>
        )}
        <span className="text-sm text-muted-foreground">{ESPECIE[aviso.species]}</span>
      </div>

      <h1 className="mt-3 font-heading text-3xl font-bold">
        {aviso.name ?? t(aviso.type === "lost" ? "tipoLost" : "tipoFound")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("publicadoEl", {
          fecha: format.dateTime(new Date(aviso.created_at), { day: "numeric", month: "long", year: "numeric" }),
        })}
        {aviso.city ? ` · ${aviso.city}` : ""}
      </p>

      {esImagenValida(aviso.photo_url) && (
        <div className="relative mt-6 aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted">
          <Image src={aviso.photo_url!} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}

      <p className="mt-6 whitespace-pre-line leading-relaxed">{aviso.description}</p>

      {aviso.status === "resolved" && aviso.resolution_story && (
        <div className="mt-6 rounded-2xl bg-sky-50 px-5 py-4">
          <h2 className="font-heading font-semibold text-sky-900">{t("resueltoHistoria")}</h2>
          <p className="mt-1 whitespace-pre-line text-sky-900">{aviso.resolution_story}</p>
        </div>
      )}

      {punto && (
        <div className="mt-6">
          <h2 className="font-heading text-lg font-semibold">{t("zona")}</h2>
          <p className="mb-2 text-xs text-muted-foreground">{t("avisoPrivacidad")}</p>
          <MiniMapa lat={punto.lat} lng={punto.lng} />
        </div>
      )}

      {esAutor && aviso.status === "open" && (
        <div className="mt-8">
          <ResolverAvisoButton avisoId={aviso.id} />
        </div>
      )}

      <div className="mt-10">
        <Link href="/perdidos-encontrados" className="text-primary underline-offset-4 hover:underline">
          {t("volverMapa")}
        </Link>
      </div>
    </section>
  );
}
