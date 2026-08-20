# Seed demo autenticable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir los seeds mezclados de producción por un único seed comercial con 18 cuentas de Supabase Auth autenticables y un perfil admin bloqueado.

**Architecture:** Un validador estático probado por Vitest vigila el contrato de los SQL manuales. Un limpiador transaccional bloquea `auth.users` y elimina solo los tres dominios de prueba. La convergencia soportada es limpiador + seed: el seed hace preflight antes de mutar, normaliza 18 cuentas con login, bloquea el admin y aborta antes del commit si sus invariantes no se cumplen.

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
  if (!/extensions\.crypt\(c\.demo_password,\s*u\.encrypted_password\)/is.test(sql)) errors.push("faltan aserciones de autenticación");
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

El SQL debe bloquear `auth.users` con `SHARE ROW EXCLUSIVE` y capturar el
allowlist en `seed_user_ids ON COMMIT DROP`, usando una condición equivalente a:

```sql
lower(email) like '%@adoptiademo.com'
or lower(email) like '%@circuito.adoptia.es'
or lower(email) like '%@masivo.adoptia.es'
```

Debe actualizar las referencias blandas, preservar `pg_trigger.tgenabled`,
eliminar `audit_log` con sus triggers de usuario temporalmente deshabilitados y
restaurar exactamente cada estado `O/R/A/D`. El `DELETE` de `auth.users` debe
revalidar ID y dominio. Después volverá a consultar usuarios, perfiles,
protectoras y animales ligados a los IDs capturados, y solo terminará con
`COMMIT` si todos los recuentos son cero.

- [ ] **Step 4: Ejecutar el validador y verificar el verde**

Run: `npx vitest run --config bdseed/vitest.config.ts`

Expected: 1 test PASS del fichero real.

### Task 3: Auth seguro en el seed comercial

**Files:**
- Modify: `bdseed/seed_demo.sql:1-1105`
- Modify: `bdseed/seed-sql-files.test.ts` (local e ignorado junto con los seeds)

**Interfaces:**
- Consumes: esquema migrado de Adoptia y la contraseña demo local, conocida solo por las 18 cuentas shelter/adopter.
- Produces: 19 usuarios y perfiles, 19 identidades email canónicas, 18 cuentas autenticables y un admin bloqueado.

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

- [ ] **Step 3: Normalizar el bloque `auth.users` tras un preflight**

Antes de la primera mutación persistente, validar conflictos por los 19 UUID, emails e identidades canónicas y abortar si quedan datos comerciales que harían insegura una ejecución aislada. Cambiar `DO NOTHING` por un `DO UPDATE` acotado que restablezca `instance_id`, `aud`, `role`, `email`, `encrypted_password`, confirmación, metadata, teléfono, tokens, `deleted_at`, `banned_until`, `is_sso_user`, `is_anonymous` y timestamps. Las 18 cuentas shelter/adopter usan la contraseña demo local; el admin recibe un hash aleatorio no recuperable y queda bloqueado indefinidamente.

- [ ] **Step 4: Crear exactamente una identidad email canónica por cuenta**

```sql
delete from auth.identities i
where i.user_id in (select id from demo_expected_users);

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
join demo_expected_users e
  on e.id = u.id
 and e.email = lower(u.email);
```

Eliminar primero las identidades de los 19 IDs esperados y volver a insertarlas
sin reasignar mediante `ON CONFLICT` una identidad que pudiera pertenecer a otro
usuario. El preflight y las restricciones deben hacer rollback ante colisiones.

- [ ] **Step 5: Añadir aserciones antes del commit**

Un bloque `DO` debe elevar excepciones si no existe el mapeo exacto de 19 UUID/emails, si no hay exactamente 18 cuentas habilitadas con la contraseña demo local y un admin bloqueado con otro hash, o si los recuentos no son exactamente 19 perfiles, 19 identidades totales y canónicas, 8 protectoras y 40 animales.

- [ ] **Step 6: Ejecutar la prueba y verificar el verde**

Run: `npx vitest run bdseed/seed-sql-files.test.ts`

Expected: 2 pruebas locales PASS.

### Task 4: Documentación y verificación final

**Files:**
- Modify: `bdseed/README.md`
- Modify: `docs/planning/items/BUG-012.md`

**Interfaces:**
- Consumes: scripts terminados.
- Produces: instrucciones exactas de borrado, carga, comprobación y login.

- [ ] **Step 1: Documentar el orden operativo**

Documentar `seed_todos_borrar.sql` → comprobar ceros → `seed_demo.sql` → comprobar `19/19/19/8/40` → login de protectora y adoptante. El admin no dispone de password login.

- [ ] **Step 2: Ejecutar verificaciones locales**

```powershell
npx vitest run src/test/seed-sql-validator.test.ts
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: todos los comandos terminan con código 0.

- [ ] **Step 3: Marcar únicamente los criterios automatizados de BUG-012**

Dejar sin marcar la ejecución real contra PostgreSQL, sus recuentos observados y los dos logins reales hasta que el usuario ejecute los scripts en un entorno autorizado.

- [ ] **Step 4: Entregar instrucciones de producción**

No ejecutar comandos remotos. Entregar enlaces locales a los dos SQL y advertir que el primer paso elimina las cuentas que pertenezcan a los tres dominios permitidos y sus datos en cascada. El valor 113 es solo el recuento observado antes de esta corrección, no una garantía.
