import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ContactarDonanteButton } from "@/components/donaciones/ContactarDonanteButton";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("donaciones");
  return { title: t("panelTitle") };
}

type OfertaCercana = {
  id: string;
  full_name: string | null;
  categoria: string;
  descripcion: string;
  city: string | null;
  distance_km: number;
  created_at: string;
};

/** Tablón de ofertas de donación de la zona para la protectora (FEATURE-032). */
export default async function DonacionesPanelPage() {
  const t = await getTranslations("donaciones");
  const format = await getFormatter();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };
  const verificada = shelter?.status === "verified";

  let ofertas: OfertaCercana[] = [];
  if (shelter && verificada) {
    const { data } = await supabase.rpc("donation_offers_nearby", {
      p_shelter_id: shelter.id,
    });
    ofertas = (data as OfertaCercana[] | null) ?? [];
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("panelTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("panelSubtitle")}</p>

      {!verificada || !shelter ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("panelSoloVerificadas")}
        </p>
      ) : ofertas.length === 0 ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("tablonEmpty")}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {ofertas.map((o) => (
            <li
              key={o.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {t(`cat${o.categoria.charAt(0).toUpperCase()}${o.categoria.slice(1)}`)}
                </span>
                <span className="font-semibold">
                  {o.full_name ? t("deDonante", { nombre: o.full_name }) : t("donanteAnonimo")}
                </span>
                <span className="text-muted-foreground">
                  {[
                    o.city,
                    t("aKm", { km: o.distance_km }),
                    t("publicadaHace", {
                      fecha: format.dateTime(new Date(o.created_at), {
                        day: "numeric",
                        month: "long",
                      }),
                    }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <p className="text-sm">{o.descripcion}</p>
              <ContactarDonanteButton offerId={o.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
