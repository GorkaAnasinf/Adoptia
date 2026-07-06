import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShelterActions } from "@/components/admin/AdminShelterActions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("sheltersTitle") };
}

export default async function AdminProtectorasPage() {
  const t = await getTranslations("admin");
  const supabase = await createClient();

  // El admin lee protectoras pending vía RLS (is_admin()).
  const { data: pendientes } = await supabase
    .from("shelters")
    .select("id, name, cif, city, submitted_at")
    .eq("status", "pending")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: true });

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-6 font-heading text-3xl font-bold">{t("sheltersTitle")}</h1>

      {!pendientes || pendientes.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("sheltersEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pendientes.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-3 rounded-xl border-2 border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-muted-foreground">
                  {t("colCif")}: {s.cif ?? "—"} · {t("colCity")}: {s.city ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("colDate")}: {new Date(s.submitted_at as string).toLocaleDateString("es-ES")}
                </p>
              </div>
              <AdminShelterActions shelterId={s.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
