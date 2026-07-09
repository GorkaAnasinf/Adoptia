import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Tests de RLS contra el stack local (`npx supabase start`).
 * Se saltan si SUPABASE_TEST_URL no está definida (p. ej. unit tests rápidos).
 */
export const TEST_URL = process.env.SUPABASE_TEST_URL ?? "";
export const ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY ?? "";
export const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "";

export const rlsDisponible = Boolean(TEST_URL && ANON_KEY && SERVICE_KEY);

export function anonClient(): SupabaseClient {
  return createClient(TEST_URL, ANON_KEY);
}

export function adminClient(): SupabaseClient {
  return createClient(TEST_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function signInAs(email: string, password: string) {
  const client = createClient(TEST_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`No se pudo iniciar sesión como ${email}: ${error.message}`);
  return client;
}

/** Crea (o reutiliza) un usuario de test confirmado y devuelve su id. */
export async function ensureUser(email: string, password: string) {
  const admin = adminClient();
  // createUser puede devolver { error } o rechazar directamente si el email ya
  // existe; en ambos casos reutilizamos el usuario existente.
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (!error) return data.user.id;
    if (!error.message.includes("already been registered")) throw error;
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes("already been registered")) throw e;
  }
  // Puede haber más usuarios de test que una página: paginamos hasta hallarlo.
  for (let page = 1; page <= 50; page++) {
    const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const existing = list.users.find((u) => u.email === email);
    if (existing) return existing.id;
    if (list.users.length < 200) break;
  }
  throw new Error(`No se encontró el usuario ${email}`);
}
