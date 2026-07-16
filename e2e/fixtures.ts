import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Siembra de datos para los E2E, con `service_role`.
 *
 * **Por qué existe**: `upsert(..., { onConflict: "slug" })` NO es idempotente en
 * este proyecto. El trigger de de-duplicación de slugs (IMPROVEMENT-001)
 * reescribe el slug ANTES de que Postgres evalúe el `on conflict`, así que
 * nunca hay conflicto: cada ejecución inserta una fila nueva (`-2`, `-3`, `-4`…).
 * Los E2E llevaban acumulando protectoras y animales duplicados en cada
 * ejecución, y los selectores por nombre acababan encontrando 4 y 5 elementos
 * (BUG-008).
 *
 * `src/test/rls/helpers.ts` ya resolvió esto para los tests de RLS con
 * `upsertShelterFixture`; esto es lo mismo para los E2E: buscar por slug,
 * actualizar si existe, insertar si no.
 */

/** Upsert real por `slug`, inmune al trigger de de-duplicación. */
export async function sembrarPorSlug(
  admin: SupabaseClient,
  tabla: "shelters" | "animals",
  fila: Record<string, unknown>,
) {
  const { data: existente } = await admin
    .from(tabla)
    .select("id")
    .eq("slug", fila.slug as string)
    .maybeSingle();

  const res = existente
    ? await admin.from(tabla).update(fila).eq("id", existente.id).select().single()
    : await admin.from(tabla).insert(fila).select().single();

  // Un fixture que falla en silencio se disfraza de aserción rota y cuesta
  // horas de depuración (lección de BUG-006).
  if (res.error) {
    throw new Error(`No se pudo sembrar en ${tabla} (${fila.slug}): ${res.error.message}`);
  }
  return res.data;
}

/** Crea el usuario del seed o reutiliza el existente. Devuelve su id. */
export async function asegurarUsuario(
  admin: SupabaseClient,
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (!error) return data.user.id;

  // Ya existía: lo buscamos paginando (puede haber muchos usuarios de test).
  for (let page = 1; page <= 50; page++) {
    const { data: lista } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const encontrado = lista.users.find((u) => u.email === email);
    if (encontrado) return encontrado.id;
    if (lista.users.length < 200) break;
  }
  throw new Error(`No se pudo crear ni encontrar el usuario del seed ${email}: ${error.message}`);
}
