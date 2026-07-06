import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("verifiedTitle") };
}

export default async function CorreoVerificadoPage() {
  const t = await getTranslations("auth");

  // El callback ya creó la sesión: enrutamos "Continuar" según el rol.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destino = "/login";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    destino = profile?.role === "shelter" ? "/panel" : "/";
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6 text-center">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        {t("verifiedTitle")}
      </h1>
      <p className="text-muted-foreground">{t("verifiedBody")}</p>
      <Button asChild size="lg">
        <Link href={destino}>{t("verifiedContinue")}</Link>
      </Button>
    </div>
  );
}
