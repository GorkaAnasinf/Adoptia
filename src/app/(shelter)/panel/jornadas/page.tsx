import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { JornadaRow, type JornadaResumen } from "@/components/jornadas/JornadaRow";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jornadas");
  return { title: t("panelTitle") };
}

type FilaEvento = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: JornadaResumen["status"];
  city: string | null;
  event_animals: { count: number }[];
  event_attendees: { count: number }[];
};

/** Panel de jornadas de la protectora: crear, editar, cancelar (FEATURE-062). */
export default async function JornadasPanelPage() {
  const t = await getTranslations("jornadas");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };
  const verificada = shelter?.status === "verified";

  let jornadas: JornadaResumen[] = [];
  if (shelter && verificada) {
    const { data } = await supabase
      .from("events")
      .select("id, title, starts_at, ends_at, status, city, event_animals(count), event_attendees(count)")
      .eq("shelter_id", shelter.id)
      .order("starts_at", { ascending: true });
    jornadas = ((data as FilaEvento[] | null) ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      status: e.status,
      city: e.city,
      animal_count: e.event_animals[0]?.count ?? 0,
      attendee_count: e.event_attendees[0]?.count ?? 0,
    }));
  }

  const ahora = Date.now();
  const borradores = jornadas.filter((j) => j.status === "draft");
  const proximas = jornadas.filter((j) => j.status !== "draft" && Date.parse(j.ends_at) >= ahora);
  const pasadas = jornadas.filter((j) => j.status !== "draft" && Date.parse(j.ends_at) < ahora);

  const bloque = (titulo: string, items: JornadaResumen[]) =>
    items.length > 0 && (
      <section className="mt-8">
        <h2 className="font-heading text-xl font-bold">{titulo}</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((j) => (
            <JornadaRow key={j.id} jornada={j} />
          ))}
        </ul>
      </section>
    );

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("panelTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("panelSubtitle")}</p>
        </div>
        {verificada && shelter && (
          <Link
            href="/panel/jornadas/nueva"
            className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
          >
            {t("nuevaCta")}
          </Link>
        )}
      </div>

      {!verificada || !shelter ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("panelSoloVerificadas")}
        </p>
      ) : jornadas.length === 0 ? (
        <p className="mt-8 rounded-2xl border-2 border-dashed border-border p-10 text-center text-muted-foreground">
          {t("listaEmpty")}
        </p>
      ) : (
        <>
          {bloque(t("listaProximas"), proximas)}
          {bloque(t("listaBorradores"), borradores)}
          {bloque(t("listaPasadas"), pasadas)}
        </>
      )}
    </section>
  );
}
