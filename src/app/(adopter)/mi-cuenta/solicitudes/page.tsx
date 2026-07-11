import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { RetirarSolicitudButton } from "@/components/solicitudes/RetirarSolicitudButton";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";

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
  const format = await getFormatter();

  const { data } = await supabase
    .from("adoption_requests")
    .select(
      `id, status, created_at, message,
       animals (name, slug, published_at,
         animal_media (url, is_cover, sort_order),
         shelters (name, slug))`,
    )
    .order("created_at", { ascending: false });
  const solicitudes = (data as unknown as Solicitud[] | null) ?? [];

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("solicitudesTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("solicitudesSubtitle")}</p>

      {solicitudes.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold">{t("solicitudesEmptyTitle")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("solicitudesEmptyText")}</p>
          <Link
            href="/animales"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            {t("solicitudesEmptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {solicitudes.map((solicitud) => {
            const animal = solicitud.animals;
            const portada = portadaDe(solicitud);
            return (
              <li
                key={solicitud.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
                  {portada ? (
                    <Image
                      src={portada}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
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
                    {animal ? (
                      <Link
                        href={`/animales/${animal.slug}`}
                        className="font-heading text-lg font-semibold hover:underline"
                      >
                        {animal.name}
                      </Link>
                    ) : (
                      <span className="font-heading text-lg font-semibold">—</span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_POR_ESTADO[solicitud.status]}`}
                    >
                      {t(CLAVE_POR_ESTADO[solicitud.status])}
                    </span>
                  </div>
                  {animal?.shelters && (
                    <Link
                      href={`/protectoras/${animal.shelters.slug}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {animal.shelters.name}
                    </Link>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {t("solicitudEnviadaEl", {
                      fecha: format.dateTime(new Date(solicitud.created_at), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    })}
                  </p>
                  {animal && !animal.published_at && (
                    <p className="text-sm text-muted-foreground">
                      {t("solicitudAnimalNoDisponible")}
                    </p>
                  )}
                </div>

                {solicitud.status === "pending" && (
                  <RetirarSolicitudButton solicitudId={solicitud.id} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
