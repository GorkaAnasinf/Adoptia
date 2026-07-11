import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Comprueba que la sesión actual es de un admin. Devuelve su id o null.
 * La RLS sigue siendo la red final; esto corta antes con un 403 claro.
 */
export async function usuarioAdminId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? user.id : null;
}

/** Deja constancia inmutable de una acción de admin (tabla audit_log). */
export async function auditar(
  supabase: SupabaseClient,
  entrada: {
    admin_id: string;
    action: string;
    target_type: "animal" | "shelter" | "user" | "report";
    target_id: string;
    reason?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert(entrada);
  if (error) {
    // La acción principal ya se aplicó; un fallo de auditoría se registra
    // fuerte en logs para investigación, sin tumbar la respuesta.
    console.error("FALLO DE AUDITORÍA:", entrada, error.message);
  }
}
