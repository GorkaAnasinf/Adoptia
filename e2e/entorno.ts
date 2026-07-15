/**
 * Entorno compartido de los E2E que necesitan sembrar datos con `service_role`
 * contra el stack local (`npx supabase start`).
 *
 * En local, saltarse estos tests es lo correcto: no todo el mundo tiene Docker
 * levantado. En CI **no**: un test saltado se ve igual de verde que uno que
 * pasa, y por ese agujero llegó BUG-006 a producción (BUG-007 aplicó el mismo
 * criterio a los tests de RLS).
 */
export const TEST_URL = process.env.SUPABASE_TEST_URL ?? "";
export const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "";

export const e2eDisponible = Boolean(TEST_URL && SERVICE_KEY);

if (process.env.CI && !e2eDisponible) {
  throw new Error(
    "Los E2E con datos sembrados no pueden saltarse en CI: faltan " +
      "SUPABASE_TEST_URL / SUPABASE_TEST_SERVICE_ROLE_KEY. Levanta el stack " +
      "(`npx supabase start`) y expórtalas desde `npx supabase status -o env`.",
  );
}

/** Motivo del salto, único para todos los specs. */
export const MOTIVO_SALTO = "Requiere npx supabase start + variables SUPABASE_TEST_*";
