import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContactoAdoptante = { email: string | null; fullName: string | null };

/**
 * Resuelve el contacto de un adoptante: email (vive en `auth.users`, solo
 * accesible vía Admin API) y nombre (`profiles.full_name`). Requiere un
 * cliente con `service_role` porque `profiles` solo es legible por su dueño
 * bajo RLS (minimización: la protectora no ve datos de contacto salvo cuando
 * el propio servidor los necesita para enviar un email).
 */
export async function obtenerContactoAdoptante(
  admin: SupabaseClient,
  adopterId: string,
): Promise<ContactoAdoptante> {
  const [{ data: authData }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(adopterId),
    admin.from("profiles").select("full_name").eq("id", adopterId).maybeSingle(),
  ]);
  return {
    email: authData?.user?.email ?? null,
    fullName: (profile?.full_name as string | null) ?? null,
  };
}
