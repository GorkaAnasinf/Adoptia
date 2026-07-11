import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CitaAccionesPanel } from "@/components/citas/CitaAccionesPanel";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("citas");
  return { title: t("agendaTitle") };
}

type Cita = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "done" | "no_show";
  starts_at: string;
  cancel_reason: string | null;
  adopter_id: string;
  adoption_requests: { animals: { name: string; slug: string } | null } | null;
};

const CLAVE_ESTADO: Record<Cita["status"], string> = {
  pending: "estadoConfirmada",
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

/** Agenda de citas de la protectora: próximas con acciones + historial. */
export default async function CitasPanelPage() {
  const t = await getTranslations("citas");
  const format = await getFormatter();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let citas: (Cita & { adopterName: string | null })[] = [];
  if (shelter) {
    const { data } = await supabase
      .from("appointments")
      .select("id, status, starts_at, cancel_reason, adopter_id, adoption_requests(animals(name, slug))")
      .eq("shelter_id", shelter.id)
      .order("starts_at", { ascending: true });
    const filas = (data as unknown as Cita[] | null) ?? [];

    // El nombre del adoptante vive en profiles (RLS: solo su dueño); mismo
    // bypass acotado que en la bandeja de solicitudes.
    const admin = createAdminClient();
    const ids = [...new Set(filas.map((c) => c.adopter_id))];
    const { data: perfiles } = ids.length
      ? await admin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] };
    const nombres = new Map(
      ((perfiles as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [
        p.id,
        p.full_name,
      ]),
    );
    citas = filas.map((c) => ({ ...c, adopterName: nombres.get(c.adopter_id) ?? null }));
  }

  const ahora = Date.now();
  const activa = (c: Cita) => ["pending", "confirmed"].includes(c.status);
  const proximas = citas.filter((c) => activa(c) && new Date(c.starts_at).getTime() >= ahora);
  const historial = citas
    .filter((c) => !activa(c) || new Date(c.starts_at).getTime() < ahora)
    .reverse();

  const fechaDe = (c: Cita) =>
    format.dateTime(new Date(c.starts_at), {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    });

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("agendaTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("agendaSubtitle")}</p>
        </div>
        <Link
          href="/panel/agenda"
          className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {t("disponibilidadTitle")}
        </Link>
      </div>

      {citas.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-14 text-center text-muted-foreground">
          {t("agendaEmpty")}
        </div>
      ) : (
        <>
          <h2 className="mt-8 font-heading text-xl font-semibold">{t("proximas")}</h2>
          {proximas.length === 0 ? (
            <p className="mt-3 text-muted-foreground">{t("dashboardEmpty")}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {proximas.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold capitalize">{fechaDe(c)}</span>
                    {c.adoption_requests?.animals && (
                      <Link
                        href={`/animales/${c.adoption_requests.animals.slug}`}
                        className="text-primary hover:underline"
                      >
                        {c.adoption_requests.animals.name}
                      </Link>
                    )}
                    {c.adopterName && (
                      <span className="text-muted-foreground">
                        {t("conQuien", { nombre: c.adopterName })}
                      </span>
                    )}
                  </div>
                  <CitaAccionesPanel citaId={c.id} />
                </li>
              ))}
            </ul>
          )}

          {historial.length > 0 && (
            <>
              <h2 className="mt-10 font-heading text-xl font-semibold">{t("historial")}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {historial.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span className="capitalize">{fechaDe(c)}</span>
                    <span>{c.adoption_requests?.animals?.name}</span>
                    {c.adopterName && (
                      <span className="text-muted-foreground">
                        {t("conQuien", { nombre: c.adopterName })}
                      </span>
                    )}
                    <span
                      className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_ESTADO[c.status]}`}
                    >
                      {t(CLAVE_ESTADO[c.status])}
                    </span>
                    {c.cancel_reason && (
                      <span className="w-full text-xs text-muted-foreground">{c.cancel_reason}</span>
                    )}
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
