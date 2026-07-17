import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ProponerAcogidaDialog } from "@/components/acogida/ProponerAcogidaDialog";
import { PropuestaEstadoActions } from "@/components/acogida/PropuestaEstadoActions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acogida");
  return { title: t("panelTitle") };
}

type Acogedor = {
  user_id: string;
  full_name: string | null;
  city: string | null;
  distance_km: number;
  radius_km: number;
  condiciones: {
    especies?: string[];
    vivienda?: string;
    jardin?: boolean;
    otros_animales?: string;
    notas?: string;
  };
  created_at: string;
};

type Propuesta = {
  id: string;
  foster_user_id: string;
  duracion: string;
  mensaje: string;
  status: string;
  created_at: string;
  animals: { name: string } | null;
};

const ESTADO_CHIP: Record<string, string> = {
  enviada: "bg-primary/10 text-primary",
  aceptada: "bg-emerald-100 text-emerald-800",
  rechazada: "bg-stone-200 text-stone-700",
  finalizada: "bg-sky-100 text-sky-800",
};

/** Acogedores disponibles + propuestas enviadas de la protectora (FEATURE-029). */
export default async function AcogidaPanelPage() {
  const t = await getTranslations("acogida");
  const tAnimales = await getTranslations("animales");
  const format = await getFormatter();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let acogedores: Acogedor[] = [];
  let animales: { id: string; name: string }[] = [];
  let propuestas: Propuesta[] = [];
  const verificada = shelter?.status === "verified";
  if (shelter && verificada) {
    const { data } = await supabase.rpc("foster_homes_nearby", { p_shelter_id: shelter.id });
    acogedores = (data as Acogedor[] | null) ?? [];

    const { data: dataAnimales } = await supabase
      .from("animals")
      .select("id, name")
      .eq("shelter_id", shelter.id)
      .not("published_at", "is", null)
      .order("name");
    animales = (dataAnimales as { id: string; name: string }[] | null) ?? [];

    const { data: dataPropuestas } = await supabase
      .from("foster_proposals")
      .select("id, foster_user_id, duracion, mensaje, status, created_at, animals (name)")
      .eq("shelter_id", shelter.id)
      .order("created_at", { ascending: false });
    propuestas = (dataPropuestas as unknown as Propuesta[] | null) ?? [];
  }

  // Propuesta abierta (enviada/aceptada) por acogedor: sustituye al botón.
  const activaPorAcogedor = new Map<string, Propuesta>();
  for (const p of propuestas) {
    if (p.status === "enviada" || p.status === "aceptada") {
      activaPorAcogedor.set(p.foster_user_id, p);
    }
  }
  const nombrePorAcogedor = new Map(acogedores.map((a) => [a.user_id, a.full_name]));

  const ESPECIE: Record<string, string> = {
    dog: tAnimales("speciesDog"),
    cat: tAnimales("speciesCat"),
    other: tAnimales("speciesOther"),
  };

  const ESTADO_TEXTO: Record<string, string> = {
    enviada: t("estadoPropuestaEnviada"),
    aceptada: t("estadoPropuestaAceptada"),
    rechazada: t("estadoPropuestaRechazada"),
    finalizada: t("estadoPropuestaFinalizada"),
  };

  const fecha = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short" });

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("panelTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("panelSubtitle")}</p>

      {!verificada ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("panelSoloVerificadas")}
        </p>
      ) : (
        <>
          {acogedores.length === 0 ? (
            <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
              {t("panelEmpty")}
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {acogedores.map((a) => {
                const activa = activaPorAcogedor.get(a.user_id);
                return (
                  <li
                    key={a.user_id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-semibold">{a.full_name ?? "—"}</span>
                      {a.city && <span className="text-muted-foreground">{a.city}</span>}
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {t("aKm", { km: a.distance_km })}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {fecha(a.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {(a.condiciones.especies ?? []).map((e) => (
                        <span key={e} className="rounded-full bg-muted px-2.5 py-0.5">
                          {ESPECIE[e] ?? e}
                        </span>
                      ))}
                      {a.condiciones.vivienda && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5">
                          {a.condiciones.vivienda === "casa" ? t("viviendaCasa") : t("viviendaPiso")}
                        </span>
                      )}
                      {a.condiciones.jardin && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5">{t("jardin")}</span>
                      )}
                    </div>
                    {(a.condiciones.otros_animales || a.condiciones.notas) && (
                      <p className="text-sm text-muted-foreground">
                        {[a.condiciones.otros_animales, a.condiciones.notas]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {activa ? (
                      <span className="flex flex-wrap items-center gap-2 text-sm">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CHIP[activa.status]}`}
                        >
                          {ESTADO_TEXTO[activa.status]}
                        </span>
                        {t("propuestaEnviadaEl", { fecha: fecha(activa.created_at) })}
                      </span>
                    ) : (
                      <ProponerAcogidaDialog fosterUserId={a.user_id} animales={animales} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <h2 className="mt-10 font-heading text-xl font-bold">{t("historialTitulo")}</h2>
          {propuestas.length === 0 ? (
            <p className="mt-3 rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("historialEmpty")}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {propuestas.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm"
                >
                  <span className="font-medium">
                    {nombrePorAcogedor.get(p.foster_user_id) ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {p.animals?.name ?? t("sinAnimalConcreto")} · {p.duracion}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CHIP[p.status]}`}
                  >
                    {ESTADO_TEXTO[p.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{fecha(p.created_at)}</span>
                  <span className="ml-auto">
                    <PropuestaEstadoActions proposalId={p.id} status={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
