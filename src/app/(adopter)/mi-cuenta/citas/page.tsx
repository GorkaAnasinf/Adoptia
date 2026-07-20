import { CalendarCheck, Check, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CancelarCitaButton } from "@/components/citas/CancelarCitaButton";
import { Reveal } from "@/components/ui/Reveal";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("citasTitle") };
}

type Media = { url: string; is_cover: boolean; sort_order: number };
type Cita = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "done" | "no_show";
  starts_at: string;
  cancel_reason: string | null;
  adoption_requests: {
    animals: {
      name: string;
      slug: string;
      animal_media: Media[] | null;
      shelters: { name: string; slug: string } | null;
    } | null;
  } | null;
};

const CLAVE_ESTADO: Record<Cita["status"], string> = {
  pending: "estadoPendiente",
  confirmed: "estadoConfirmada",
  cancelled: "estadoCancelada",
  done: "estadoRealizada",
  no_show: "estadoNoShow",
};
const BADGE_ESTADO: Record<Cita["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-700",
  done: "bg-sky-100 text-sky-800",
  no_show: "bg-rose-100 text-rose-800",
};

/** Estilos de botón de acción (misma jerarquía que en "mis solicitudes"). */
const ACCION_BASE =
  "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const ACCION_OUTLINE = `${ACCION_BASE} border border-border hover:bg-accent`;
const ACCION_GHOST = `${ACCION_BASE} px-4 text-primary hover:bg-primary/5`;

function portadaDe(media: Media[] | null): string | null {
  const orden = (media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = orden[0]?.url ?? null;
  return esImagenValida(url) ? url : null;
}

function esProxima(c: Cita): boolean {
  return ["pending", "confirmed"].includes(c.status) && Date.now() < new Date(c.starts_at).getTime();
}

/** Citas del adoptante (RLS: solo las suyas). */
export default async function MisCitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("account");
  const tCitas = await getTranslations("citas");
  const format = await getFormatter();

  const { data } = await supabase
    .from("appointments")
    .select(
      `id, status, starts_at, cancel_reason,
       adoption_requests (animals (name, slug,
         animal_media (url, is_cover, sort_order),
         shelters (name, slug)))`,
    )
    .order("starts_at", { ascending: true });
  const citas = (data as unknown as Cita[] | null) ?? [];

  const proximas = citas.filter(esProxima);
  // Las pasadas (o resueltas) más recientes primero.
  const pasadas = citas
    .filter((c) => !esProxima(c))
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  if (citas.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <Cabecera titulo={t("citasTitle")} subtitulo={t("citasSubtitle")} />
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-soft">
          <span aria-hidden="true" className="text-4xl">
            🐾
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold">{t("citasEmptyTitle")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("citasEmptyText")}</p>
          <Link
            href="/mi-cuenta/solicitudes"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            {t("citasEmptyCta")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <Cabecera titulo={t("citasTitle")} subtitulo={t("citasSubtitle")} />

      {/* Próximas */}
      <h2 className="mt-8 font-heading text-xl font-semibold">{t("citasProximas")}</h2>
      {proximas.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
          {t("citasSinProximas")}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {proximas.map((c, i) => (
            <li key={c.id}>
              <Reveal delayMs={Math.min(i, 3) * 80}>
                <CitaCard cita={c} tCitas={tCitas} t={t} format={format} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}

      {/* Consejos: solo relevantes si hay una visita a la vista */}
      {proximas.length > 0 && (
        <Reveal className="mt-6">
          <aside className="rounded-2xl border border-primary/15 bg-primary/5 p-6">
            <h2 className="font-heading text-lg font-semibold text-primary">
              {t("citasConsejosTitulo")}
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-on-surface-variant">
              {[t("citasConsejo1"), t("citasConsejo2"), t("citasConsejo3")].map((consejo) => (
                <li key={consejo} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{consejo}</span>
                </li>
              ))}
            </ul>
          </aside>
        </Reveal>
      )}

      {/* Pasadas */}
      {pasadas.length > 0 && (
        <>
          <h2 className="mt-10 font-heading text-xl font-semibold">{t("citasPasadas")}</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {pasadas.map((c, i) => (
              <li key={c.id}>
                <Reveal delayMs={Math.min(i, 3) * 80}>
                  <CitaCard cita={c} tCitas={tCitas} t={t} format={format} apagada />
                </Reveal>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Ayuda */}
      <Reveal className="mt-10">
        <aside className="flex flex-col gap-4 rounded-2xl bg-surface-container p-6 sm:flex-row sm:items-center sm:gap-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <CalendarCheck className="size-7" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-semibold text-secondary">
              {t("citasAyudaTitulo")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("citasAyudaTexto")}</p>
          </div>
          <Link
            href="/guias"
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-secondary/40 px-5 text-sm font-semibold text-secondary hover:bg-secondary/10"
          >
            {t("citasAyudaCta")}
          </Link>
        </aside>
      </Reveal>
    </section>
  );
}

function Cabecera({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">{titulo}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{subtitulo}</p>
    </div>
  );
}

function CitaCard({
  cita,
  tCitas,
  t,
  format,
  apagada = false,
}: {
  cita: Cita;
  tCitas: Awaited<ReturnType<typeof getTranslations>>;
  t: Awaited<ReturnType<typeof getTranslations>>;
  format: Awaited<ReturnType<typeof getFormatter>>;
  apagada?: boolean;
}) {
  const animal = cita.adoption_requests?.animals;
  const shelter = animal?.shelters;
  const portada = portadaDe(animal?.animal_media ?? null);
  const activa = esProxima(cita);
  const inicio = new Date(cita.starts_at);

  return (
    <article
      className={cn(
        "flex h-full overflow-hidden rounded-2xl border border-border",
        apagada ? "bg-muted/40" : "bg-card shadow-soft",
      )}
    >
      {/* Foto con el chip de estado superpuesto */}
      <div className="relative w-28 shrink-0 bg-muted sm:w-32">
        {portada ? (
          <Image
            src={portada}
            alt=""
            fill
            sizes="128px"
            className={cn("object-cover", apagada && "grayscale")}
          />
        ) : (
          <span aria-hidden="true" className="flex h-full items-center justify-center text-3xl">
            🐾
          </span>
        )}
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex w-24 justify-center rounded-full px-2 py-0.5 text-center text-xs font-semibold shadow-sm ring-1 ring-black/5",
            BADGE_ESTADO[cita.status],
          )}
        >
          {tCitas(CLAVE_ESTADO[cita.status])}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-0.5">
          {animal ? (
            <Link
              href={`/animales/${animal.slug}`}
              className="font-heading text-xl font-semibold hover:underline"
            >
              {animal.name}
            </Link>
          ) : (
            <span className="font-heading text-xl font-semibold">—</span>
          )}
          {shelter && (
            <Link
              href={`/protectoras/${shelter.slug}`}
              className="w-fit text-sm text-muted-foreground hover:underline"
            >
              {shelter.name}
            </Link>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
          <span className="inline-flex items-center gap-1.5 capitalize text-secondary">
            <CalendarCheck className="size-4" aria-hidden="true" />
            {format.dateTime(inicio, {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "Europe/Madrid",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5 text-secondary">
            <Clock className="size-4" aria-hidden="true" />
            {format.dateTime(inicio, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Madrid",
            })}
          </span>
        </div>

        {cita.cancel_reason && (
          <p className="text-sm text-muted-foreground">{cita.cancel_reason}</p>
        )}

        {/* Acciones */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {activa && <CancelarCitaButton citaId={cita.id} />}
          {shelter && (
            <Link href={`/protectoras/${shelter.slug}`} className={ACCION_OUTLINE}>
              {t("solicitudContactarRefugio")}
            </Link>
          )}
          {animal && (
            <Link href={`/animales/${animal.slug}`} className={ACCION_GHOST}>
              {t("solicitudVerDetalles")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
