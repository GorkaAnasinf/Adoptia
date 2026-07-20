import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MisCitasCliente, type CitaVista } from "@/components/citas/MisCitasCliente";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("citasTitle") };
}

type Media = { url: string; is_cover: boolean; sort_order: number };
type Cita = {
  id: string;
  status: CitaVista["status"];
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

function portadaDe(media: Media[] | null): string | null {
  const orden = (media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = orden[0]?.url ?? null;
  return esImagenValida(url) ? url : null;
}

/** Citas del adoptante (RLS: solo las suyas). */
export default async function MisCitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("account");

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

  const vistas: CitaVista[] = citas.map((c) => {
    const animal = c.adoption_requests?.animals ?? null;
    return {
      id: c.id,
      status: c.status,
      starts_at: c.starts_at,
      cancel_reason: c.cancel_reason,
      animalName: animal?.name ?? null,
      animalSlug: animal?.slug ?? null,
      portada: portadaDe(animal?.animal_media ?? null),
      shelterName: animal?.shelters?.name ?? null,
      shelterSlug: animal?.shelters?.slug ?? null,
    };
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t("citasTitle")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("citasSubtitle")}</p>
      </div>

      {vistas.length === 0 ? (
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
      ) : (
        <div className="mt-8">
          <MisCitasCliente citas={vistas} />
        </div>
      )}
    </section>
  );
}
