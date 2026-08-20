# Seed demo autenticable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir los seeds mezclados de producción por un único seed comercial con 19 cuentas de Supabase Auth autenticables y verificadas.

**Architecture:** Un validador estático probado por Vitest vigila el contrato de los SQL manuales. Un limpiador transaccional elimina solo los tres dominios de prueba; el seed comercial hace upsert convergente de usuarios e identidades y aborta antes del commit si sus invariantes no se cumplen.

**Decisión de revisión:** El validador estático es una alarma de regresión sobre los scripts mantenidos por el proyecto, no una frontera de seguridad ni un parser de SQL hostil. La garantía destructiva se evalúa revisando directamente `seed_todos_borrar.sql` y sus predicados cerrados.

**Tech Stack:** TypeScript, Vitest, PostgreSQL 17, Supabase Auth/GoTrue, SQL Editor.

## Global Constraints

- La limpieza solo puede afectar `@adoptiademo.com`, `@circuito.adoptia.es` y `@masivo.adoptia.es`.
- No se usa ni se expone `SUPABASE_SERVICE_ROLE_KEY`.
- Toda escritura en producción se ejecuta manualmente por el usuario en SQL Editor.
- TDD obligatorio: la prueba debe fallar contra los SQL actuales antes de corregirlos.
- Se conservan intactos los cambios locales ajenos a BUG-012.

---

### Task 1: Validador del contrato de los seeds

**Files:**
- Create: `scripts/validate-seed-sql.ts`
- Create: `src/test/seed-sql-validator.test.ts`

**Interfaces:**
- Consumes: texto de `seed_demo.sql` y `seed_todos_borrar.sql`.
- Produces: `validateDemoSeed(sql: string): string[]` y `validateCleanupSeed(sql: string): string[]`; una lista vacía significa contrato válido.

- [ ] **Step 1: Escribir pruebas rojas con fixtures mínimos**

```ts
import { describe, expect, it } from "vitest";
import { validateCleanupSeed, validateDemoSeed } from "../../scripts/validate-seed-sql";

describe("contrato SQL de los seeds", () => {
  it("rechaza un seed demo que no crea identidades ni valida credenciales", () => {
    const errors = validateDemoSeed("insert into auth.users values (...); on conflict (id) do nothing;");
    expect(errors).toContain("falta una transacción explícita");
    expect(errors).toContain("falta el upsert de credenciales");
    expect(errors).toContain("faltan identidades email");
    expect(errors).toContain("faltan aserciones de autenticación");
  });

  it("rechaza una limpieza que no contiene exactamente los tres dominios", () => {
    expect(validateCleanupSeed("delete from auth.users where true"))
      .toContain("la limpieza no está limitada a los tres dominios de seed");
  });
});
```

- [ ] **Step 2: Ejecutar la prueba y verificar el rojo**

Run: `npx vitest run src/test/seed-sql-validator.test.ts`

Expected: FAIL porque `scripts/validate-seed-sql.ts` todavía no existe.

- [ ] **Step 3: Implementar el validador mínimo**

```ts
const DOMAINS = ["@adoptiademo.com", "@circuito.adoptia.es", "@masivo.adoptia.es"];

export function validateDemoSeed(sql: string): string[] {
  const errors: string[] = [];
  if (!/^\s*begin;/im.test(sql) || !/commit;\s*$/im.test(sql)) errors.push("falta una transacción explícita");
  if (!/on conflict\s*\(id\)\s*do update/is.test(sql)) errors.push("falta el upsert de credenciales");
  if (!/insert into auth\.identities/is.test(sql)) errors.push("faltan identidades email");
  if (!/extensions\.crypt\('A\.doptia!Demo',\s*u\.encrypted_password\)/is.test(sql)) errors.push("faltan aserciones de autenticación");
  return errors;
}

export function validateCleanupSeed(sql: string): string[] {
  const errors: string[] = [];
  if (!/^\s*begin;/im.test(sql) || !/commit;\s*$/im.test(sql)) errors.push("falta una transacción explícita");
  const exactDomains = DOMAINS.every((domain) => sql.includes(domain));
  if (!exactDomains || /delete\s+from\s+auth\.users\s+where\s+true/i.test(sql)) {
    errors.push("la limpieza no está limitada a los tres dominios de seed");
  }
  return errors;
}
```

- [ ] **Step 4: Ejecutar la prueba y verificar el verde**

Run: `npx vitest run src/test/seed-sql-validator.test.ts`

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add scripts/validate-seed-sql.ts src/test/seed-sql-validator.test.ts
git commit -m "test(seed): valida el contrato de los SQL de demo"
```

### Task 2: Limpieza unificada y acotada

**Files:**
- Create: `bdseed/seed_todos_borrar.sql`
- Create: `bdseed/seed-sql-files.test.ts` (local e ignorado junto con los seeds)
- Create: `bdseed/vitest.config.ts` (configuración local para descubrir pruebas ignoradas)

**Interfaces:**
- Consumes: cuentas pertenecientes a los tres dominios permitidos.
- Produces: cero usuarios de seed y cero perfiles/shelters dependientes, sin afectar cuentas reales.

- [ ] **Step 1: Añadir una prueba que valide el fichero real**

```ts
it("el limpiador real cumple el contrato destructivo acotado", () => {
  const sql = readFileSync(resolve(process.cwd(), "bdseed/seed_todos_borrar.sql"), "utf8");
  expect(validateCleanupSeed(sql)).toEqual([]);
});
```

- [ ] **Step 2: Ejecutar la prueba y verificar el rojo**

Run: `npx vitest run --config bdseed/vitest.config.ts`

Expected: FAIL con `ENOENT` porque el limpiador aún no existe.

- [ ] **Step 3: Crear el limpiador transaccional**

El SQL debe construir una CTE/condición reutilizable equivalente a:

```sql
lower(email) like '%@adoptiademo.com'
or lower(email) like '%@circuito.adoptia.es'
or lower(email) like '%@masivo.adoptia.es'
```

Debe actualizar las referencias blandas, eliminar `audit_log` con sus triggers de usuario temporalmente deshabilitados, borrar `auth.users`, comprobar mediante un bloque `DO` que el recuento final es cero y terminar con `COMMIT`.

- [ ] **Step 4: Ejecutar el validador y verificar el verde**

Run: `npx vitest run --config bdseed/vitest.config.ts`

Expected: 3 tests PASS.

### Task 3: Auth convergente en el seed comercial

**Files:**
- Modify: `bdseed/seed_demo.sql:1-1105`
- Modify: `bdseed/seed-sql-files.test.ts` (local e ignorado junto con los seeds)

**Interfaces:**
- Consumes: esquema migrado de Adoptia y contraseña fija `A.doptia!Demo`.
- Produces: 19 usuarios, 19 perfiles y 19 identidades email autenticables.

- [ ] **Step 1: Añadir la prueba del fichero real**

```ts
it("el seed demo real cumple el contrato de autenticación", () => {
  const sql = readFileSync(resolve(process.cwd(), "bdseed/seed_demo.sql"), "utf8");
  expect(validateDemoSeed(sql)).toEqual([]);
});
```

- [ ] **Step 2: Ejecutar la prueba y verificar el rojo**

Run: `npx vitest run bdseed/seed-sql-files.test.ts`

Expected: FAIL informando transacción, upsert, identidades y aserciones ausentes.

- [ ] **Step 3: Hacer convergente el bloque `auth.users`**

Cambiar `DO NOTHING` por un `DO UPDATE` que restablezca `aud`, `role`, `email`, `encrypted_password`, confirmación, metadata, tokens vacíos, `is_sso_user = false` y `updated_at` desde `excluded` o literales seguros.

- [ ] **Step 4: Crear identidades email idempotentes**

```sql
insert into auth.identities
  (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
select
  extensions.uuid_generate_v4(),
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now()
from auth.users u
where lower(u.email) like '%@adoptiademo.com'
on conflict (provider_id, provider) do update
set identity_data = excluded.identity_data,
    user_id = excluded.user_id,
    updated_at = excluded.updated_at;
```

- [ ] **Step 5: Añadir aserciones antes del commit**

Un bloque `DO` debe elevar excepciones si los recuentos no son exactamente 19 usuarios, 19 contraseñas válidas, 19 perfiles, 19 identidades email, 8 protectoras o 40 animales.

- [ ] **Step 6: Ejecutar la prueba y verificar el verde**

Run: `npx vitest run bdseed/seed-sql-files.test.ts`

Expected: 4 tests PASS.

### Task 4: Documentación y verificación final

**Files:**
- Modify: `bdseed/README.md`
- Modify: `docs/planning/items/BUG-012.md`

**Interfaces:**
- Consumes: scripts terminados.
- Produces: instrucciones exactas de borrado, carga, comprobación y login.

- [ ] **Step 1: Documentar el orden operativo**

Documentar `seed_todos_borrar.sql` → comprobar ceros → `seed_demo.sql` → comprobar 19/8/40 → login de protectora y adoptante.

- [ ] **Step 2: Ejecutar verificaciones locales**

```powershell
npx vitest run src/test/seed-sql-validator.test.ts
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: todos los comandos terminan con código 0.

- [ ] **Step 3: Marcar los criterios automatizados de BUG-012**

Dejar sin marcar únicamente los dos logins reales hasta que el usuario ejecute los scripts en producción.

- [ ] **Step 4: Entregar instrucciones de producción**

No ejecutar comandos remotos. Entregar enlaces locales a los dos SQL y advertir que el primer paso elimina 113 cuentas de prueba y sus datos en cascada.
