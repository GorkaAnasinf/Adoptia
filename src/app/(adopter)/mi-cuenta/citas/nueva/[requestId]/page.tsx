import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ReservaCita, type Hueco } from "@/components/citas/ReservaCita";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ requestId: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("citas");
  return { title: t("reservarTitle") };
}

type Solicitud = {
  id: string;
  status: string;
  adopter_id: string;
  animals: {
    name: string;
    shelter_id: string;
    shelters: { name: string } | null;
  } | null;
};

/** Reserva de cita para una solicitud aprobada del propio adoptante. */
export default async function ReservarCitaPage({ params }: { params: Params }) {
  const { requestId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("adoption_requests")
    .select("id, status, adopter_id, animals(name, shelter_id, shelters(name))")
    .eq("id", requestId)
    .maybeSingle();
  const solicitud = data as unknown as Solicitud | null;
  if (!solicitud || !solicitud.animals || solicitud.adopter_id !== user.id) notFound();
  if (solicitud.status !== "approved") redirect("/mi-cuenta/solicitudes");

  const t = await getTranslations("citas");
  const { data: huecos } = await supabase.rpc("appointment_free_slots", {
    p_shelter_id: solicitud.animals.shelter_id,
    p_days: 30,
  });

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("reservarTitle")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("reservarSubtitle", {
          nombre: solicitud.animals.name,
          protectora: solicitud.animals.shelters?.name ?? "",
        })}
      </p>
      <div className="mt-8">
        <ReservaCita requestId={solicitud.id} huecos={(huecos as Hueco[] | null) ?? []} />
      </div>
    </section>
  );
}
