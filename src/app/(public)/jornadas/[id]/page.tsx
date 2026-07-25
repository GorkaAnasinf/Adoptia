import { CalendarClock, MapPin, PawPrint, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CompartirEventoButton } from "@/components/jornadas/CompartirEventoButton";
import { RsvpButton } from "@/components/jornadas/RsvpButton";
import { MiniMapa } from "@/components/map/MiniMapa";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";

type EventoDetalle = {
  id: string;
  shelter_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  address: string | null;
  city: string | null;
  poster_url: string | null;
  capacity: number | null;
  status: "draft" | "published" | "cancelled" | "finished";
  lat: number | null;
  lng: number | null;
  shelter_name: string;
  shelter_slug: string;
  attendee_count: number;
};

type AnimalVinculado = { id: string; name: string; slug: string };

async function cargar(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.rpc("event_detail", { p_id: id });
  const evento = ((data as EventoDetalle[] | null) ?? [])[0];
  if (!evento || evento.status === "draft") return null;

  const { data: vinculos } = await supabase
    .from("event_animals")
    .select("animals(id, name, slug)")
    .eq("event_id", id);
  const animales = ((vinculos as { animals: AnimalVinculado | null }[] | null) ?? [])
    .map((v) => v.animals)
    .filter((a): a is AnimalVinculado => a != null);

  let asiste = false;
  if (user) {
    const { data: fila } = await supabase
      .from("event_attendees")
      .select("user_id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    asiste = fila != null;
  }

  return { evento, animales, userId: user?.id ?? null, asiste };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const datos = await cargar(id);
  if (!datos) return {};
  return { title: datos.evento.title, description: datos.evento.description || undefined };
}

export default async function JornadaFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("jornadas");
  const format = await getFormatter();
  const datos = await cargar(id);
  if (!datos) notFound();

  const { evento, animales, userId, asiste } = datos;
  const cuando = format.dateTime(new Date(evento.starts_at), {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/jornadas" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← {t("volver")}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Columna principal */}
        <div className="flex flex-col gap-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-muted shadow-soft">
            {esImagenValida(evento.poster_url) ? (
              <Image src={evento.poster_url!} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
            ) : (
              <span aria-hidden className="flex h-full items-center justify-center text-6xl">
                🐾
              </span>
            )}
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">{evento.title}</h1>
            <Link
              href={`/protectoras/${evento.shelter_slug}`}
              className="mt-1 inline-block text-sm font-semibold text-foreground underline-offset-2 hover:underline"
            >
              {t("organiza")}: {evento.shelter_name}
            </Link>
          </div>

          {evento.status === "cancelled" && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {t("cancelada")}
            </p>
          )}
          {evento.status === "finished" && (
            <p className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground">
              {t("finalizada")}
            </p>
          )}

          {evento.description && (
            <p className="whitespace-pre-line text-muted-foreground">{evento.description}</p>
          )}

          {animales.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
                <PawPrint className="size-5 text-primary" aria-hidden="true" />
                {t("animalesQueVan")}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {animales.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/animales/${a.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:border-primary/50"
                    >
                      <span aria-hidden>🐾</span>
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <aside className="flex flex-col gap-5">
          <dl className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("cuando")}
                </dt>
                <dd className="text-sm font-medium first-letter:uppercase">{cuando}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("donde")}
                </dt>
                <dd className="text-sm font-medium">
                  {[evento.address, evento.city].filter(Boolean).join(", ") || evento.shelter_name}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("organiza")}
                </dt>
                <dd className="text-sm font-medium">
                  {t("asistentesResumen", { count: evento.attendee_count })}
                  {evento.capacity != null && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {t("aforoInfo", { count: evento.capacity })}
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </dl>

          {evento.status === "published" && (
            <RsvpButton eventId={evento.id} userId={userId} asisteInicial={asiste} />
          )}
          <CompartirEventoButton titulo={evento.title} />

          {evento.lat != null && evento.lng != null && (
            <div className="overflow-hidden rounded-2xl shadow-soft">
              <MiniMapa lat={evento.lat} lng={evento.lng} />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
