import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

/**
 * Shell autenticado de la protectora. El gate de onboarding vive en el
 * middleware; aquí solo se alimenta el shell (nombre, estado, si está en
 * onboarding) para cabecera y sidebar.
 */
export default async function ShelterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase
        .from("shelters")
        .select("name, status, submitted_at")
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  const onboarding = !shelter || shelter.submitted_at == null;

  return (
    <AppShell
      role="shelter"
      onboarding={onboarding}
      status={shelter?.status ?? null}
      shelterName={shelter?.name}
    >
      {children}
    </AppShell>
  );
}
