# Diseño — reinicio seguro de seeds y cuentas demo autenticables

## Contexto y causa

Producción contiene 13 cuentas de `@circuito.adoptia.es` y 100 de
`@masivo.adoptia.es`, pero ninguna de `@adoptiademo.com`. El login del seed
comercial responde `invalid_credentials` porque esas cuentas no existen.

El `seed_demo.sql` anterior insertaba directamente en `auth.users`, no creaba
la identidad de email asociada en `auth.identities` y resolvía conflictos por
ID con `DO NOTHING`. Una repetición podía conservar credenciales antiguas y el
resumen final no demostraba que las cuentas fueran autenticables.

## Alcance y secuencia soportada

Los artefactos manuales de `bdseed/` incorporan un limpiador único y un seed
comercial verificable. También existe un validador rastreado que comprueba los
patrones SQL mantenidos sin intentar interpretar SQL arbitrario.

La única secuencia soportada para converger es:

1. ejecutar `seed_todos_borrar.sql`;
2. comprobar que los tres dominios quedan a cero;
3. ejecutar `seed_demo.sql`;
4. comprobar sus invariantes finales;
5. probar login con una protectora y un adoptante.

Ejecutar únicamente `seed_demo.sql` sobre restos comerciales no es una ruta de
convergencia: el preflight aborta antes de la primera mutación persistente para
evitar duplicar medios, estadísticas o datos dependientes.

## Diseño de la limpieza

La limpieza solo alcanza cuentas cuyos emails terminan en:

- `@adoptiademo.com`;
- `@circuito.adoptia.es`;
- `@masivo.adoptia.es`.

El script abre una transacción y toma un lock `SHARE ROW EXCLUSIVE` sobre
`auth.users` antes de capturar los IDs en una tabla temporal `ON COMMIT DROP`.
Ese lock impide que inserciones, cambios de email o borrados invaliden el
snapshot mientras se limpian sus dependencias.

Antes de borrar usuarios, el script:

1. pone a `NULL` `appointments.cancelled_by` y `reports.reviewed_by` cuando
   apuntan a una cuenta capturada;
2. guarda `pg_trigger.tgenabled` para cada trigger de usuario de `audit_log`;
3. deshabilita los que estaban activos, borra las filas de auditoría vinculadas
   y restaura exactamente cada estado `O`, `R`, `A` o `D`;
4. borra de `auth.users` por ID y vuelve a validar el dominio en el propio
   `DELETE`;
5. vuelve a consultar usuarios de los dominios y perfiles, protectoras y
   animales ligados a los IDs capturados.

Cualquier diferencia entre los IDs capturados y borrados, o cualquier resto,
eleva una excepción y revierte la transacción.

## Diseño del seed comercial

Antes de escribir datos persistentes, `seed_demo.sql` declara el mapeo exacto
de 19 UUID/emails y comprueba colisiones por UUID, email e identidad canónica.
También rechaza restos comerciales que harían insegura una ejecución aislada.

El bloque Auth:

- reinicia de forma explícita el estado completo de las 18 cuentas con login
  (8 protectoras y 10 adoptantes), incluida la contraseña demo local;
- mantiene el rol JWT como `authenticated` y el rol de negocio únicamente en
  `public.profiles`;
- conserva el perfil admin para moderación y auditoría, pero le asigna un hash
  aleatorio no recuperable y `banned_until = 'infinity'`, por lo que no dispone
  de credencial compartida ni puede iniciar sesión;
- elimina las identidades previas de esos 19 IDs y crea exactamente una
  identidad canónica de proveedor `email` por cuenta.

No se usan claves `service_role` ni secretos adicionales.

## Validación final

Antes del `COMMIT`, el seed aborta salvo que se cumplan todos estos invariantes:

- el dominio demo contiene exactamente el mapeo de 19 UUID/emails esperado;
- las 18 cuentas de protectora/adoptante validan la contraseña demo local y
  tienen Auth confirmado, habilitado y normalizado;
- el admin está bloqueado y su hash no valida la contraseña compartida;
- hay exactamente 19 perfiles y 19 identidades totales, todas canónicas;
- hay exactamente 8 protectoras y 40 animales ligados al mapeo esperado.

Las pruebas estáticas vigilan la estructura de ambos scripts, el lock, la
revalidación del allowlist, la restauración de triggers, el preflight y las
aserciones finales. Estas pruebas no sustituyen una ejecución real contra
PostgreSQL ni una prueba de login.

## Operación en producción

La ejecución destructiva sigue siendo manual en Supabase SQL Editor. El trabajo
local no borra ni modifica datos de producción. Hasta ejecutar la secuencia en
un PostgreSQL compatible y probar ambos logins, esas verificaciones permanecen
pendientes en `BUG-012`.
