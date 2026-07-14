import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/components/layout/UserMenu";

/**
 * Lee el rol del usuario autenticado (`profiles.role`) con el cliente Supabase
 * dado. Solo consulta el propio perfil del usuario logueado — nunca el de
 * terceros. La RLS de `profiles` es la red final; esto es descubribilidad de
 * navegación, no autorización (el gate real vive en `src/middleware.ts`).
 */
export async function getUserRole(supabase: SupabaseClient): Promise<UserRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  return role === "adopter" || role === "shelter" || role === "admin" ? role : null;
}
