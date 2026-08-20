# Diseño — reinicio seguro de seeds y cuentas demo autenticables

## Contexto y causa

Producción contiene 13 cuentas de `@circuito.adoptia.es` y 100 de
`@masivo.adoptia.es`, pero ninguna de `@adoptiademo.com`. El login del seed
comercial responde `invalid_credentials` porque esas cuentas no existen.

El `seed_demo.sql` actual inserta directamente en `auth.users`, no crea la
identidad de email asociada en `auth.identities` y resuelve conflictos por ID
con `DO NOTHING`. Por tanto, una repetición puede conservar credenciales
antiguas y el resumen final no demuestra que las cuentas sean autenticables.

## Alcance

Se modificarán únicamente los artefactos manuales de `bdseed/`:

- un script nuevo que elimine los datos de los tres seeds conocidos;
- `seed_demo.sql`, para crear un estado convergente y verificable;
- la documentación de uso de `bdseed/`.

La limpieza solo alcanzará cuentas cuyos emails terminen en:

- `@adoptiademo.com`;
- `@circuito.adoptia.es`;
- `@masivo.adoptia.es`.

Nunca se borrarán cuentas o datos reales ajenos a esos dominios.

## Diseño de la limpieza

El script de reinicio ejecutará una transacción explícita. Antes de borrar
usuarios, eliminará o desvinculará las referencias que impiden la cascada:

1. poner a `NULL` `appointments.cancelled_by` y `reports.reviewed_by` cuando
   apunten a una cuenta sembrada;
2. desactivar temporalmente solo los triggers de usuario de `audit_log`, borrar
   sus filas vinculadas a administradores sembrados y reactivar los triggers;
3. borrar de `auth.users` exclusivamente los tres dominios permitidos;
4. comprobar que no quedan usuarios de seed ni contenido identificable de esos
   conjuntos;
5. abortar la transacción si cualquier comprobación devuelve restos.

El script terminará en `COMMIT` únicamente después de superar las aserciones.

## Diseño del seed comercial

`seed_demo.sql` también será transaccional. Su bloque de autenticación:

- insertará los 19 usuarios esperados;
- actualizará en conflicto los campos necesarios para login, incluida la
  contraseña conocida, en vez de conservar silenciosamente valores antiguos;
- mantendrá el rol de JWT como `authenticated` y el rol de negocio solamente
  en `public.profiles`;
- creará de forma idempotente la identidad `email` en `auth.identities` para
  cada usuario;
- conservará el trigger existente que crea `profiles`, promoviendo después el
  perfil administrativo como ya hace el seed.

No se usarán claves `service_role` ni secretos adicionales.

## Validación y errores

Antes del `COMMIT`, el seed abortará si no se cumplen todos estos invariantes:

- 19 usuarios `@adoptiademo.com`;
- 19 IDs y emails únicos;
- 19 contraseñas que validan contra `A.doptia!Demo`;
- 19 correos confirmados y filas Auth habilitadas para password login;
- 19 identidades de proveedor `email`;
- 19 perfiles, 8 protectoras y 40 animales del seed comercial.

Además, una prueba estática automatizada vigilará que ambos scripts mantengan
la transacción, los dominios permitidos, el upsert de credenciales, la creación
de identidades y las aserciones finales. La prueba deberá fallar contra el seed
actual antes de implementar la corrección.

## Operación en producción

El operador ejecutará manualmente, en este orden:

1. el script unificado de borrado;
2. su verificación final de ceros;
3. el `seed_demo.sql` corregido;
4. su resumen y aserciones finales;
5. un login real con una cuenta de protectora y otro con una cuenta adoptante.

La ejecución destructiva seguirá siendo manual en Supabase SQL Editor; el
trabajo local no borrará ni modificará datos de producción.
