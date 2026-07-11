import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("moderacion");
  return { title: t("auditTitle") };
}

type Entrada = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
};

/** Log de auditoría (solo lectura; la RLS limita a admins). */
export default async function AuditoriaPage() {
  const t = await getTranslations("moderacion");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, admin_id, action, target_type, target_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const entradas = (data as Entrada[] | null) ?? [];

  // Nombres de los admins (profiles solo es legible por su dueño → admin client
  // acotado: solo ids que ya aparecen en el log que la RLS nos dejó leer).
  let nombres = new Map<string, string | null>();
  if (entradas.length > 0) {
    const admin = createAdminClient();
    const ids = [...new Set(entradas.map((e) => e.admin_id))];
    const { data: perfiles } = await admin.from("profiles").select("id, full_name").in("id", ids);
    nombres = new Map(
      ((perfiles as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [
        p.id,
        p.full_name,
      ]),
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("auditTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("auditSubtitle")}</p>

      {entradas.length === 0 ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("auditEmpty")}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("auditCuando")}</th>
                <th className="px-4 py-3 font-medium">{t("auditQuien")}</th>
                <th className="px-4 py-3 font-medium">{t("auditAccion")}</th>
                <th className="px-4 py-3 font-medium">{t("auditMotivo")}</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {format.dateTime(new Date(e.created_at), {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">{nombres.get(e.admin_id) ?? e.admin_id.slice(0, 8)}</td>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.action}</code>{" "}
                    <span className="text-muted-foreground">
                      {e.target_type} {e.target_id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
