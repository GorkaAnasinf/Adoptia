import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel");
  return { title: t("title") };
}

export default async function PanelPage() {
  const t = await getTranslations("panel");
  const to = await getTranslations("onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase
        .from("shelters")
        .select("status, verification_note")
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      {shelter?.status === "pending" && (
        <div
          role="status"
          className="mb-6 flex flex-col gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{to("bannerPending")}</span>
          <Link
            href="/panel/alta"
            className="shrink-0 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
          >
            {to("bannerPendingEdit")}
          </Link>
        </div>
      )}
      {shelter?.status === "suspended" && (
        <p
          role="alert"
          className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {to("bannerSuspended", { motivo: shelter.verification_note ?? "—" })}
        </p>
      )}

      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("placeholder")}</p>
    </section>
  );
}
