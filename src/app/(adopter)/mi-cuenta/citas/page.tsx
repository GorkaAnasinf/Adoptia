import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CancelarCitaButton } from "@/components/citas/CancelarCitaButton";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("citasTitle") };
}

type Cita = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "done" | "no_show";
  starts_at: string;
  cancel_reason: string | null;
  adoption_requests: {
    animals: { name: string; slug: string; shelters: { name: string; slug: string } | null } | null;
  } | null;
};

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
      "id, status, starts_at, cancel_reason, adoption_requests(animals(name, slug, shelters(name, slug)))",
    )
    .order("starts_at", { ascending: false });
  const citas = (data as unknown as Cita[] | null) ?? [];

  const CLAVE: Record<Cita["status"], string> = {
    pending: "estadoConfirmada",
    confirmed: "estadoConfirmada",
    cancelled: "estadoCancelada",
    done: "estadoRealizada",
    no_show: "estadoNoShow",
  };
  const BADGE: Record<Cita["status"], string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-stone-200 text-stone-700",
    done: "bg-sky-100 text-sky-800",
    no_show: "bg-rose-100 text-rose-800",
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("citasTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("citasSubtitle")}</p>

      {citas.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold">{t("citasEmptyTitle")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("citasEmptyText")}</p>
          <Link
            href="/mi-cuenta/solicitudes"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            {t("citasEmptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {citas.map((c) => {
            const animal = c.adoption_requests?.animals;
            const activa =
              ["pending", "confirmed"].includes(c.status) &&
              Date.now() < new Date(c.starts_at).getTime();
            return (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold capitalize">
                    {format.dateTime(new Date(c.starts_at), {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Madrid",
                    })}
                  </span>
                  {animal && (
                    <Link href={`/animales/${animal.slug}`} className="text-primary hover:underline">
                      {animal.name}
                    </Link>
                  )}
                  {animal?.shelters && (
                    <span className="text-muted-foreground">{animal.shelters.name}</span>
                  )}
                  <span
                    className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[c.status]}`}
                  >
                    {tCitas(CLAVE[c.status])}
                  </span>
                </div>
                {c.cancel_reason && (
                  <p className="text-sm text-muted-foreground">{c.cancel_reason}</p>
                )}
                {activa && <CancelarCitaButton citaId={c.id} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
