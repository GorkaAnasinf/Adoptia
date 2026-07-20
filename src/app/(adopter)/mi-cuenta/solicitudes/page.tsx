import { ArrowRight, BookOpen, CalendarCheck, CalendarPlus, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CancelarCitaButton } from "@/components/citas/CancelarCitaButton";
import { RetirarSolicitudButton } from "@/components/solicitudes/RetirarSolicitudButton";
import { Reveal } from "@/components/ui/Reveal";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("solicitudesTitle") };
}

type Media = { url: string; is_cover: boolean; sort_order: number };

type Solicitud = {
  id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn" | "completed";
  created_at: string;
  message: string | null;
  animals: {
    name: string;
    slug: string;
    published_at: string | null;
    animal_media: Media[] | null;
    shelters: { name: string; slug: string } | null;
  } | null;
};

/** Chip de estado (mismos tonos que el dashboard, para coherencia visual). */
const BADGE_POR_ESTADO: Record<Solicitud["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  withdrawn: "bg-stone-200 text-stone-700",
  completed: "bg-sky-100 text-sky-800",
};

const CLAVE_POR_ESTADO: Record<Solicitud["status"], string> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
  withdrawn: "statusWithdrawn",
  completed: "statusCompleted",
};

/** Estados que se muestran "apagados": ya no hay nada que hacer en ellos. */
const APAGADOS: Solicitud["status"][] = ["rejected", "withdrawn"];

/** Estilos de botón de acción (jerarquía compartida en toda la tarjeta). */
const ACCION_BASE =
  "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const ACCION_PRIMARIA = `${ACCION_BASE} bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90`;
const ACCION_OUTLINE = `${ACCION_BASE} border border-border hover:bg-accent`;
const ACCION_GHOST = `${ACCION_BASE} px-4 text-primary hover:bg-primary/5`;

function portadaDe(solicitud: Solicitud): string | null {
  const media = (solicitud.animals?.animal_media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = media[0]?.url ?? null;
  return esImagenValida(url) ? url : null;
}

/** Solicitudes del adoptante: RLS limita la lectura a las suyas. */
export default async function MisSolicitudesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("account");
  const tCitas = await getTranslations("citas");
  const format = await getFormatter();

  const [{ data }, { data: citasData }] = await Promise.all([
    supabase
      .from("adoption_requests")
      .select(
        `id, status, created_at, message,
         animals (name, slug, published_at,
           animal_media (url, is_cover, sort_order),
           shelters (name, slug))`,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, request_id, starts_at, status")
      .in("status", ["pending", "confirmed"]),
  ]);
  const solicitudes = (data as unknown as Solicitud[] | null) ?? [];
  const citaPorSolicitud = new Map(
    (
      (citasData as { id: string; request_id: string; starts_at: string; status: string }[] | null) ??
      []
    ).map((c) => [c.request_id, c]),
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("solicitudesTitle")}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t("solicitudesSubtitle")}</p>

      {solicitudes.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-soft">
          <span aria-hidden="true" className="text-4xl">
            🐾
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold">
            {t("solicitudesEmptyTitle")}
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("solicitudesEmptyText")}</p>
          <Link
            href="/animales"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            {t("solicitudesEmptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {solicitudes.map((solicitud, i) => {
            const animal = solicitud.animals;
            const portada = portadaDe(solicitud);
            const cita = citaPorSolicitud.get(solicitud.id);
            const apagada = APAGADOS.includes(solicitud.status);
            const nombreAnimal = animal?.name ?? t("animalSinNombre");

            // Mensaje contextual según el estado (y si ya hay cita agendada).
            const mensaje =
              solicitud.status === "approved"
                ? cita
                  ? t("solicitudMsgApprovedCita", { animal: nombreAnimal })
                  : t("solicitudMsgApproved")
                : solicitud.status === "pending"
                  ? t("solicitudMsgPending", { animal: nombreAnimal })
                  : solicitud.status === "rejected"
                    ? t("solicitudMsgRejected")
                    : solicitud.status === "withdrawn"
                      ? t("solicitudMsgWithdrawn")
                      : t("solicitudMsgCompleted", { animal: nombreAnimal });

            return (
              <li key={solicitud.id} className="h-full">
                <Reveal delayMs={(i % 2) * 80} className="h-full">
                  <article
                    className={cn(
                      "flex h-full overflow-hidden rounded-2xl border border-border",
                      apagada ? "bg-muted/40" : "bg-card shadow-soft",
                    )}
                  >
                    {/* Franja de foto con el chip de estado superpuesto */}
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
                        <span
                          aria-hidden="true"
                          className="flex h-full items-center justify-center text-3xl"
                        >
                          🐾
                        </span>
                      )}
                      {/* Ancho fijo e igual para todos los estados: coherencia visual */}
                      <span
                        className={cn(
                          "absolute left-2 top-2 inline-flex w-24 justify-center rounded-full px-2 py-0.5 text-center text-xs font-semibold shadow-sm ring-1 ring-black/5",
                          BADGE_POR_ESTADO[solicitud.status],
                        )}
                      >
                        {solicitud.status === "completed"
                          ? t("statusCompletedChip")
                          : t(CLAVE_POR_ESTADO[solicitud.status])}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-3">
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
                        <span className="shrink-0 whitespace-nowrap pt-1 text-xs text-muted-foreground">
                          {t("solicitudEnviadaEl", {
                            fecha: format.dateTime(new Date(solicitud.created_at), {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                          })}
                        </span>
                      </div>

                      {animal?.shelters && (
                        <Link
                          href={`/protectoras/${animal.shelters.slug}`}
                          className="-mt-2 w-fit text-sm text-muted-foreground hover:underline"
                        >
                          {animal.shelters.name}
                        </Link>
                      )}

                      {/* Cita confirmada: destaca fecha y hora en chip teal */}
                      {solicitud.status === "approved" && cita && (
                        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary/15 px-3 py-1.5 text-sm font-semibold text-secondary">
                          <CalendarCheck className="size-4" aria-hidden="true" />
                          {format.dateTime(new Date(cita.starts_at), {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Madrid",
                          })}
                        </p>
                      )}

                      <p className="text-sm text-muted-foreground">{mensaje}</p>

                      {animal && !animal.published_at && (
                        <p className="text-sm text-muted-foreground">
                          {t("solicitudAnimalNoDisponible")}
                        </p>
                      )}

                      {/* Acciones según estado. Jerarquía: acción principal
                          rellena, secundarias outline, "Ver detalles" en ghost. */}
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                        {solicitud.status === "approved" &&
                          (cita ? (
                            <>
                              <CancelarCitaButton citaId={cita.id} />
                              {animal?.shelters && (
                                <Link
                                  href={`/protectoras/${animal.shelters.slug}`}
                                  className={ACCION_OUTLINE}
                                >
                                  <MessageCircle className="size-4" aria-hidden="true" />
                                  {t("solicitudContactarRefugio")}
                                </Link>
                              )}
                            </>
                          ) : (
                            <Link
                              href={`/mi-cuenta/citas/nueva/${solicitud.id}`}
                              className={ACCION_PRIMARIA}
                            >
                              <CalendarPlus className="size-4" aria-hidden="true" />
                              {tCitas("reservarVisita")}
                            </Link>
                          ))}

                        {solicitud.status === "pending" && (
                          <RetirarSolicitudButton solicitudId={solicitud.id} />
                        )}

                        {animal && (
                          <Link href={`/animales/${animal.slug}`} className={ACCION_GHOST}>
                            {t("solicitudVerDetalles")}
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}

      {solicitudes.length > 0 && (
        <Reveal className="mt-10">
          <aside className="flex flex-col gap-4 rounded-2xl bg-surface-container p-6 sm:flex-row sm:items-center sm:gap-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <BookOpen className="size-7" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-semibold text-secondary">
                {t("solicitudAyudaTitulo")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("solicitudAyudaTexto")}</p>
            </div>
            <Link
              href="/guias"
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-secondary/40 px-5 text-sm font-semibold text-secondary hover:bg-secondary/10"
            >
              {t("solicitudAyudaCta")}
            </Link>
          </aside>
        </Reveal>
      )}
    </section>
  );
}
