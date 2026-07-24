import { PawPrint, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { HistoriaModeracionActions } from "@/components/historias/HistoriaModeracionActions";
import { Reveal } from "@/components/ui/Reveal";
import { esImagenValida } from "@/lib/animal-search";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("historias");
  return { title: t("panelTitle") };
}

type Media = { url: string; is_cover: boolean; sort_order: number };
type Historia = {
  id: string;
  adopter_id: string;
  quote: string;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  animals: { name: string; slug: string; animal_media: Media[] | null } | null;
};

const CHIP: Record<Historia["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-tertiary/15 text-tertiary",
  rejected: "bg-muted text-muted-foreground",
};

function portada(h: Historia): string | null {
  if (esImagenValida(h.photo_url)) return h.photo_url;
  const media = (h.animals?.animal_media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = media[0]?.url ?? null;
  return esImagenValida(url) ? url : null;
}

/** Cola de moderación de testimonios de la protectora dueña (FEATURE-059). */
export default async function HistoriasPanelPage() {
  const t = await getTranslations("historias");
  const format = await getFormatter();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let historias: Historia[] = [];
  const nombres = new Map<string, string | null>();
  if (shelter) {
    const { data } = await supabase
      .from("adoption_stories")
      .select(
        "id, adopter_id, quote, photo_url, status, created_at, animals (name, slug, animal_media (url, is_cover, sort_order))",
      )
      .eq("shelter_id", shelter.id)
      .order("created_at", { ascending: false });
    historias = (data as unknown as Historia[] | null) ?? [];

    // El nombre del adoptante vive en profiles (RLS: solo su dueño). Mismo bypass
    // acotado que la agenda: solo el nombre, nunca el contacto.
    const ids = [...new Set(historias.map((h) => h.adopter_id))];
    if (ids.length) {
      const { data: perfiles } = await createAdminClient()
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of (perfiles as { id: string; full_name: string | null }[] | null) ?? []) {
        nombres.set(p.id, p.full_name);
      }
    }
  }

  const pendientes = historias.filter((h) => h.status === "pending");
  const revisadas = historias.filter((h) => h.status !== "pending");

  const fecha = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  function Card({ h, moderable }: { h: Historia; moderable: boolean }) {
    const foto = portada(h);
    const nombre = nombres.get(h.adopter_id) ?? t("sinNombre");
    return (
      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all motion-safe:duration-300 hover:shadow-md sm:flex">
        <div className="relative aspect-4/3 shrink-0 bg-muted sm:aspect-auto sm:w-44">
          {foto ? (
            <Image src={foto} alt="" fill sizes="180px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center py-10 text-muted-foreground">
              <PawPrint className="size-8" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading font-semibold">{t("deLabel", { nombre })}</span>
            {h.animals && (
              <span className="text-sm text-muted-foreground">
                {t("sobreAnimal", { animal: h.animals.name })}
              </span>
            )}
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", CHIP[h.status])}>
              {h.status === "approved"
                ? t("estadoAprobada")
                : h.status === "rejected"
                  ? t("estadoRechazada")
                  : t("estadoPendiente")}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{fecha(h.created_at)}</span>
          </div>
          <blockquote className="border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground">
            {h.quote}
          </blockquote>
          {moderable && <HistoriaModeracionActions historiaId={h.id} />}
        </div>
      </article>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("panelTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("panelSubtitle")}</p>

      {historias.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-border p-10 text-center shadow-soft">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-muted-foreground">{t("panelEmpty")}</p>
        </div>
      ) : (
        <>
          {pendientes.length > 0 && (
            <>
              <h2 className="mt-8 font-heading text-xl font-bold">{t("pendientesTitulo")}</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {pendientes.map((h, i) => (
                  <li key={h.id}>
                    <Reveal delayMs={Math.min(i, 6) * 70}>
                      <Card h={h} moderable />
                    </Reveal>
                  </li>
                ))}
              </ul>
            </>
          )}

          {revisadas.length > 0 && (
            <>
              <h2 className="mt-10 font-heading text-xl font-bold">{t("revisadasTitulo")}</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {revisadas.map((h, i) => (
                  <li key={h.id}>
                    <Reveal delayMs={Math.min(i, 6) * 70}>
                      <Card h={h} moderable={false} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
