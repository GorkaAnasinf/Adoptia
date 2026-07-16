import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { MiniMapa } from "@/components/map/MiniMapa";
import { AvistamientosTimeline } from "@/components/perdidos/AvistamientosTimeline";
import { ContactarAvisoDialog } from "@/components/perdidos/ContactarAvisoDialog";
import { GaleriaAviso } from "@/components/perdidos/GaleriaAviso";
import { NuevoAvistamientoForm } from "@/components/perdidos/NuevoAvistamientoForm";
import { ResolverAvisoButton } from "@/components/perdidos/ResolverAvisoButton";
import type { Avistamiento, FotoAviso } from "@/components/perdidos/tipos";
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
  city: string | null;
  status: "open" | "resolved" | "archived";
  resolution_story: string | null;
  location: unknown;
  created_at: string;
  contact_phone: string | null;
  allow_contact: boolean;
  breed: string | null;
  sex: "male" | "female" | "unknown" | null;
  size: "small" | "medium" | "large" | null;
  color: string | null;
  has_collar: boolean | null;
  collar_description: string | null;
  has_microchip: boolean | null;
  occurred_on: string;
};

/** Detalle de un aviso: ubicación ya redondeada en BD (privacidad). */
export default async function AvisoPage({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getTranslations("perdidos");
  const tAnimales = await getTranslations("animales");
  const format = await getFormatter();

  const supabase = await createClient();
  const [{ data }, { data: auth }, { data: vistos }, { data: fotosData }] = await Promise.all([
    supabase
      .from("lost_found_posts")
      .select(
        "id, user_id, type, species, name, description, city, status, resolution_story, location, created_at, contact_phone, allow_contact, breed, sex, size, color, has_collar, collar_description, has_microchip, occurred_on",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
    supabase.rpc("lost_found_sightings_list", { p_post_id: id }),
    supabase.rpc("lost_found_media_list", { p_post_id: id }),
  ]);
  const aviso = data as Aviso | null;
  const avistamientos = (vistos ?? []) as Avistamiento[];
  const fotos = (fotosData ?? []) as FotoAviso[];

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
  const abierto = aviso.status === "open";
  // Ayudar exige cuenta (anti-spam) y solo tiene sentido en avisos vivos; el
  // autor no se escribe a sí mismo.
  const puedeAyudar = abierto && Boolean(auth.user) && !esAutor;
  const invitarALogin = abierto && !auth.user;
  const ESPECIE: Record<string, string> = {
    dog: tAnimales("speciesDog"),
    cat: tAnimales("speciesCat"),
    other: tAnimales("speciesOther"),
  };
  const SEXO: Record<string, string> = {
    male: tAnimales("sexMale"),
    female: tAnimales("sexFemale"),
    unknown: tAnimales("sexUnknown"),
  };
  const TAMANO: Record<string, string> = {
    small: tAnimales("sizeSmall"),
    medium: tAnimales("sizeMedium"),
    large: tAnimales("sizeLarge"),
  };

  const fechaLarga = (v: string | Date) =>
    format.dateTime(new Date(v), { day: "numeric", month: "long", year: "numeric" });

  // Solo lo que se sabe: un «no lo sé» en pantalla es ruido, no información.
  const senas: { etiqueta: string; valor: string }[] = [
    aviso.breed && { etiqueta: t("datoRaza"), valor: aviso.breed },
    aviso.color && { etiqueta: t("datoColor"), valor: aviso.color },
    aviso.sex && { etiqueta: t("datoSexo"), valor: SEXO[aviso.sex] },
    aviso.size && { etiqueta: t("datoTamano"), valor: TAMANO[aviso.size] },
    aviso.has_collar !== null && {
      etiqueta: t("datoCollar"),
      valor: aviso.has_collar
        ? aviso.collar_description
          ? `${t("datoCollarSi")} — ${aviso.collar_description}`
          : t("datoCollarSi")
        : t("datoCollarNo"),
    },
    aviso.has_microchip !== null && {
      etiqueta: t("datoMicrochip"),
      valor: aviso.has_microchip ? t("datoMicrochipSi") : t("datoMicrochipNo"),
    },
  ].filter(Boolean) as { etiqueta: string; valor: string }[];

  // `occurred_on` es la fecha del suceso; `created_at`, la de publicación. Solo
  // se enseñan las dos cuando difieren: es justo el desfase que este item vino
  // a hacer visible.
  const publicadoEnOtraFecha =
    aviso.occurred_on !== new Date(aviso.created_at).toISOString().slice(0, 10);

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
      <p className="mt-1 text-sm font-medium">
        {t(aviso.type === "lost" ? "ocurrioEl" : "encontradoEl", {
          fecha: fechaLarga(aviso.occurred_on),
        })}
        {aviso.city ? ` · ${aviso.city}` : ""}
      </p>
      {publicadoEnOtraFecha && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("publicadoEl", { fecha: fechaLarga(aviso.created_at) })}
        </p>
      )}

      <GaleriaAviso fotos={fotos} alt={aviso.name ?? t(aviso.type === "lost" ? "tipoLost" : "tipoFound")} />

      <p className="mt-6 whitespace-pre-line leading-relaxed">{aviso.description}</p>

      {senas.length > 0 && (
        <div className="mt-6">
          <h2 className="font-heading text-lg font-semibold">{t("datosTitulo")}</h2>
          <dl className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {senas.map((s) => (
              <div key={s.etiqueta} className="flex gap-2 text-sm">
                <dt className="shrink-0 text-muted-foreground">{s.etiqueta}:</dt>
                <dd className="font-medium">{s.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

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
          <MiniMapa
            lat={punto.lat}
            lng={punto.lng}
            extras={avistamientos.map((a) => ({
              id: a.id,
              lat: a.lat,
              lng: a.lng,
              etiqueta: a.note ?? undefined,
            }))}
          />
        </div>
      )}

      {(puedeAyudar || invitarALogin) && (
        <div className="mt-8 rounded-2xl bg-muted/40 px-5 py-5">
          <h2 className="font-heading text-lg font-semibold">{t("contactoTitulo")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("contactoSubtitulo")}</p>

          {aviso.contact_phone && (
            <div className="mt-4">
              <p className="font-medium">{t("telefonoAutor", { telefono: aviso.contact_phone })}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("telefonoAvisoEstafa")}</p>
            </div>
          )}

          {puedeAyudar ? (
            <div className="mt-4 flex flex-col gap-3">
              <NuevoAvistamientoForm avisoId={aviso.id} userId={auth.user!.id} />
              {aviso.allow_contact && <ContactarAvisoDialog avisoId={aviso.id} />}
            </div>
          ) : (
            <Link
              href={`/login?redirect=${encodeURIComponent(`/perdidos-encontrados/${aviso.id}`)}`}
              className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("entrarParaAyudar")}
            </Link>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-heading text-lg font-semibold">{t("avistamientosTitulo")}</h2>
        <div className="mt-3">
          <AvistamientosTimeline avistamientos={avistamientos} puedeBorrar={esAutor} />
        </div>
      </div>

      {esAutor && abierto && (
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
