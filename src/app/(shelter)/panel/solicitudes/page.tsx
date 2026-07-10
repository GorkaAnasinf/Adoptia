import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SolicitudesPanel, type SolicitudRow } from "@/components/panel/SolicitudesPanel";
import type { EstadoSolicitud } from "@/lib/schemas/solicitud";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("solicitudesPanel");
  return { title: t("title") };
}

type FilaAdmin = {
  id: string;
  status: EstadoSolicitud;
  created_at: string;
  message: string | null;
  shelter_notes: string | null;
  questionnaire: Record<string, unknown> | null;
  adopter_id: string;
  animals: { id: string; name: string; slug: string; status: string } | null;
};

export default async function SolicitudesPanelPage() {
  const t = await getTranslations("solicitudesPanel");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let solicitudes: SolicitudRow[] = [];

  if (shelter) {
    // Bypass de RLS deliberado y acotado: `profiles` solo es legible por su
    // dueño, así que la protectora no puede leer el nombre del adoptante vía
    // el cliente normal. Ya verificamos arriba que este usuario es dueño de
    // `shelter`, así que el admin client solo se usa para completar datos de
    // SUS solicitudes (filtradas por shelter_id más abajo).
    const admin = createAdminClient();
    const { data: filas } = await admin
      .from("adoption_requests")
      .select(
        "id, status, created_at, message, shelter_notes, questionnaire, adopter_id, animals!inner(id, name, slug, status, shelter_id)",
      )
      .eq("animals.shelter_id", shelter.id)
      .order("created_at", { ascending: false });

    const adopterIds = [...new Set(((filas as FilaAdmin[] | null) ?? []).map((f) => f.adopter_id))];
    const { data: perfiles } = adopterIds.length
      ? await admin.from("profiles").select("id, full_name").in("id", adopterIds)
      : { data: [] };
    const nombrePorId = new Map(
      ((perfiles as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [p.id, p.full_name]),
    );

    solicitudes = ((filas as FilaAdmin[] | null) ?? [])
      .filter((f) => f.animals)
      .map((f) => ({
        id: f.id,
        status: f.status,
        created_at: f.created_at,
        message: f.message,
        shelter_notes: f.shelter_notes,
        questionnaire: f.questionnaire,
        adopterName: nombrePorId.get(f.adopter_id) || t("unknownAdopter"),
        animal: {
          id: f.animals!.id,
          name: f.animals!.name,
          slug: f.animals!.slug,
          status: f.animals!.status,
        },
      }));
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>
      <SolicitudesPanel solicitudes={solicitudes} />
    </section>
  );
}
