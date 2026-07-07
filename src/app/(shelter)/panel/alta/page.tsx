import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { WizardAlta } from "@/components/shelters/WizardAlta";
import { shelterRowToForm } from "@/lib/shelter-mapping";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

export default async function AltaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <WizardAlta
      ownerId={user.id}
      shelterId={shelter?.id ?? null}
      initial={shelterRowToForm(shelter)}
    />
  );
}
