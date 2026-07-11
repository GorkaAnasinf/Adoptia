import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ContactarAcogedorButton } from "@/components/acogida/ContactarAcogedorButton";
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

/** Acogedores disponibles para la protectora (RPC: verificada + radio). */
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
  const verificada = shelter?.status === "verified";
  if (shelter && verificada) {
    const { data } = await supabase.rpc("foster_homes_nearby", { p_shelter_id: shelter.id });
    acogedores = (data as Acogedor[] | null) ?? [];
  }

  const ESPECIE: Record<string, string> = {
    dog: tAnimales("speciesDog"),
    cat: tAnimales("speciesCat"),
    other: tAnimales("speciesOther"),
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("panelTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("panelSubtitle")}</p>

      {!verificada ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("panelSoloVerificadas")}
        </p>
      ) : acogedores.length === 0 ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("panelEmpty")}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {acogedores.map((a) => (
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
                  {format.dateTime(new Date(a.created_at), { day: "numeric", month: "short" })}
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
                  {[a.condiciones.otros_animales, a.condiciones.notas].filter(Boolean).join(" · ")}
                </p>
              )}
              <ContactarAcogedorButton fosterUserId={a.user_id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
