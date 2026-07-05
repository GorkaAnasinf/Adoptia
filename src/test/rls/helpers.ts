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
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (!error.message.includes("already been registered")) throw error;
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email === email);
    if (!existing) throw error;
    return existing.id;
  }
  return data.user.id;
}
