import { ArrowRight, CheckCircle2, FileText, PawPrint, Plus, Send, Sprout } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel");
  return { title: t("title") };
}

type MediaRow = { url: string; is_cover: boolean; sort_order: number };
type AnimalRow = {
  id: string;
  name: string;
  slug: string;
  status: AnimalStatus;
  published_at: string | null;
  updated_at: string;
  animal_media: MediaRow[];
};
type RequestRow = {
  id: string;
  created_at: string;
  animal: { name: string; slug: string } | null;
};

function portada(media: MediaRow[]): string | null {
  if (media.length === 0) return null;
  return (media.find((m) => m.is_cover) ?? [...media].sort((a, b) => a.sort_order - b.sort_order)[0]).url;
}

export default async function PanelPage() {
  const t = await getTranslations("panel");
  const to = await getTranslations("onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase
        .from("shelters")
        .select("id, name, status, verification_note, description")
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  let animals: AnimalRow[] = [];
  let pendingCount = 0;
  let recentRequests: RequestRow[] = [];

  if (shelter) {
    const { data: a } = await supabase
      .from("animals")
      .select("id,name,slug,status,published_at,updated_at,animal_media(url,is_cover,sort_order)")
      .eq("shelter_id", shelter.id)
      .order("updated_at", { ascending: false });
    animals = (a as AnimalRow[] | null) ?? [];

    const { count } = await supabase
      .from("adoption_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;

    const { data: r } = await supabase
      .from("adoption_requests")
      .select("id,created_at,animal:animals(name,slug)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);
    recentRequests = (r as RequestRow[] | null) ?? [];
  }

  const anyoActual = new Date().getFullYear();
  const publicados = animals.filter((x) => x.published_at != null).length;
  const borradores = animals.filter((x) => x.published_at == null).length;
  const adoptados = animals.filter((x) => {
    return x.status === "adopted" && new Date(x.updated_at).getFullYear() === anyoActual;
  }).length;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      {shelter?.status === "pending" && (
        <div
          role="status"
          className="mb-6 flex flex-col gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{to("bannerPending")}</span>
          <Link
            href="/panel/alta"
            className="shrink-0 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
          >
            {to("bannerPendingEdit")}
          </Link>
        </div>
      )}
      {shelter?.status === "suspended" && (
        <p
          role="alert"
          className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {to("bannerSuspended", { motivo: shelter.verification_note ?? "—" })}
        </p>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            {shelter?.name ? t("greeting", { name: shelter.name }) : t("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/panel/animales/nueva"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("addAnimal")}
        </Link>
      </header>

      {animals.length === 0 ? (
        <PrimerosPasos
          perfilListo={Boolean(shelter?.description)}
          t={t}
        />
      ) : (
        <>
          {/* Stat tiles */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={PawPrint} valor={publicados} label={t("statPublished")} href="/panel/animales" />
            <StatTile icon={FileText} valor={borradores} label={t("statDrafts")} href="/panel/animales" />
            <StatTile icon={Send} valor={pendingCount} label={t("statPending")} />
            <StatTile icon={CheckCircle2} valor={adoptados} label={t("statAdopted")} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
            {/* Animales recientes */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">{t("recentAnimals")}</h2>
                <Link href="/panel/animales" className="text-sm font-semibold text-tertiary hover:underline">
                  {t("viewAll")}
                </Link>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {animals.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/panel/animales/${a.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent/40"
                    >
                      <Miniatura url={portada(a.animal_media)} alt={a.name} />
                      <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
                      <AnimalStatusBadge status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solicitudes recientes */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-lg font-semibold">{t("recentRequests")}</h2>
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRequests")}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {recentRequests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                      <span className="min-w-0 truncate font-medium">{r.animal?.name ?? "—"}</span>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {t("requestPending")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function StatTile({
  icon: Icon,
  valor,
  label,
  href,
}: {
  icon: typeof PawPrint;
  valor: number;
  label: string;
  href?: string;
}) {
  const contenido = (
    <>
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="mt-3 block font-heading text-3xl font-bold tabular-nums">{valor}</span>
      <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
        {label}
        {href && <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />}
      </span>
    </>
  );
  const clase = "group rounded-2xl border border-border bg-card p-4";
  return href ? (
    <Link href={href} className={cn(clase, "transition-colors hover:border-primary/40 hover:bg-accent/30")}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

function Miniatura({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <PawPrint className="size-5" aria-hidden="true" />
      </span>
    );
  }
  return <Image src={url} alt={alt} width={40} height={40} className="size-10 shrink-0 rounded-lg object-cover" />;
}

function PrimerosPasos({
  perfilListo,
  t,
}: {
  perfilListo: boolean;
  t: Awaited<ReturnType<typeof getTranslations<"panel">>>;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sprout className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-heading text-xl font-semibold">{t("firstStepsTitle")}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{t("firstStepsText")}</p>
      </div>
      <ol className="mx-auto mt-6 flex max-w-md flex-col gap-3">
        <PasoLink
          hecho={perfilListo}
          href="/panel/perfil"
          label={perfilListo ? t("stepProfileDone") : t("stepProfile")}
        />
        <PasoLink hecho={false} href="/panel/animales/nueva" label={t("stepAnimal")} />
      </ol>
    </div>
  );
}

function PasoLink({ hecho, href, label }: { hecho: boolean; href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors",
          hecho
            ? "border-tertiary/40 bg-tertiary/5 text-muted-foreground"
            : "border-border hover:border-primary/40 hover:bg-accent/30",
        )}
      >
        {hecho ? (
          <CheckCircle2 className="size-5 shrink-0 text-tertiary" aria-hidden="true" />
        ) : (
          <span className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
        )}
        <span className="flex-1">{label}</span>
        {!hecho && <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />}
      </Link>
    </li>
  );
}
