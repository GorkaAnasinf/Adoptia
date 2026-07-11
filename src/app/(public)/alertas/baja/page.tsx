import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("alertaBaja");
  return { title: t("okTitle"), robots: { index: false } };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Baja de una alerta en un clic desde el email, sin sesión: el token de baja
 * (uuid aleatorio, único por alerta) actúa como capacidad. Solo desactiva
 * (no borra): el usuario puede reactivarla desde su cuenta.
 */
export default async function BajaAlertaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getTranslations("alertaBaja");

  let ok = false;
  if (token && UUID_RE.test(token)) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("saved_searches")
      .update({ active: false })
      .eq("unsubscribe_token", token)
      .select("id");
    ok = (data ?? []).length > 0;
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span aria-hidden="true" className="text-6xl">
        {ok ? "🔕" : "🤔"}
      </span>
      <h1 className="font-heading text-2xl font-bold">{ok ? t("okTitle") : t("koTitle")}</h1>
      <p className="text-muted-foreground">{ok ? t("okText") : t("koText")}</p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90"
      >
        {t("volver")}
      </Link>
    </main>
  );
}
