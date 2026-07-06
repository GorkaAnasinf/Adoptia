import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { decideOnboardingGate } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate de onboarding: una protectora sin alta enviada queda confinada al
 * wizard `/panel/alta`. La decisión vive en `decideOnboardingGate` (testeada).
 */
export default async function ShelterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-pathname") ?? "/panel";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("submitted_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  const destino = decideOnboardingGate({
    submittedAt: shelter?.submitted_at ?? null,
    hasShelter: Boolean(shelter),
    pathname,
  });
  if (destino) redirect(destino);

  return <>{children}</>;
}
