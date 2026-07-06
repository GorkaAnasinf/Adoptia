# Runbooks — Adoptia

Procedimientos paso a paso ante incidencias. Añadir uno nuevo tras cada incidente real (post-mortem ligero).

## RB-01 — Producción caída

1. ¿Build o runtime? Vercel dashboard → Deployments. Si el último deploy falló, producción sigue con el anterior (no es caída).
2. Runtime: revisar Sentry (errores) y status de Vercel/Supabase (status.vercel.com, status.supabase.com).
3. Deploy roto: `Redeploy` del último deployment verde en Vercel (rollback en 1 clic).
4. Si es Supabase pausado → RB-02.

## RB-02 — Supabase pausado (free tier)

1. Dashboard Supabase → proyecto → botón "Restore".
2. Espera ~2 min; verificar con la home.
3. Comprobar que `keepalive.yml` corrió (Actions); si falló, revisar secrets.

## RB-03 — Clave filtrada (anon/service_role/SMTP)

1. **Rotar inmediatamente** en el proveedor (Supabase: Settings → API → regenerate; Gmail: revocar la app password en myaccount.google.com/apppasswords y generar otra).
2. Actualizar en: Vercel env (Prod+Preview) + GitHub secrets + `.env.local` propio.
3. Redeploy de producción.
4. `service_role` filtrada: además, revisar logs de Supabase por accesos anómalos y registrar en [SECURITY](SECURITY.md).
5. Actualizar `.secrets.baseline` si detect-secrets marcó el incidente.

## RB-04 — Cuota de email agotada / emails no salen (Gmail SMTP)

Email por **SMTP de Gmail + plantillas propias** (Decisión #22), ~500 envíos/día.

1. Revisar **Vercel → Deployment → Logs** por errores `SMTP` (auth, timeout).
2. Causas típicas: 2FA de la cuenta desactivado, `SMTP_PASS` con espacios, o app password revocada → ver RB-08.
3. Cuota diaria superada: esperar 24 h o cambiar a otra cuenta remitente; recurrente → reducir/agrupar notificaciones o pasar a un proveedor con dominio verificado (revisar Decisión #22).

## RB-05 — Storage lleno (1 GB)

1. Supabase → Storage: identificar mayores objetos (`animal-media`).
2. Verificar que la compresión cliente está activa (fotos deben ser ≤300 KB).
3. Borrar media huérfana (query de `animal_media` sin animal publicado).
4. Persistente: migrar media a Cloudinary free (ver ruta de escalado en [OPERATIONS](OPERATIONS.md)).

## RB-06 — Restaurar backup de BD

1. Localizar último artefacto de `backup.yml` en GitHub Actions.
2. `psql $DATABASE_URL < backup.sql` contra proyecto nuevo/restaurado (nunca contra producción sin confirmar alcance).
3. Verificar contadores básicos (shelters, animals) contra los últimos conocidos.

## RB-07 — Solicitud RGPD (supresión/acceso)

Ver procedimiento completo en [PRIVACY](../meta/PRIVACY.md#derechos-del-interesado). Resumen: verificar identidad → exportar/suprimir datos del usuario (`profiles` cascada + Storage) → responder en <30 días → registrar la solicitud.

## RB-08 — Configurar el email transaccional (Gmail SMTP)

Necesario para que salgan los emails de verificación/rechazo de protectoras (FEATURE-002) y futuras notificaciones. Variables definidas en [ENVIRONMENT](ENVIRONMENT.md).

**1. Contraseña de aplicación de Gmail (una vez):**
1. La cuenta debe tener **verificación en 2 pasos** activada (myaccount.google.com/security).
2. Ir a **myaccount.google.com/apppasswords** → nombre `Adoptia` → generar.
3. Copiar los **16 caracteres sin espacios** (no se vuelve a mostrar).

**2. Variables en Vercel** (Settings → Environment Variables, marcar **Production** y **Preview**):

| Key | Value |
|-----|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `tucuenta@gmail.com` |
| `SMTP_PASS` | app password de 16, sin espacios (marcar Sensitive) |
| `MAIL_FROM` | `Adoptia <tucuenta@gmail.com>` |

Comprobar además que `SUPABASE_SERVICE_ROLE_KEY` existe (la usa el geocode). Nunca con prefijo `NEXT_PUBLIC_`.

**3. Redeploy** — las env nuevas no aplican a deploys existentes: Deployments → último → `···` → **Redeploy** (o `git push` a producción).

**4. Verificar** — verificar/rechazar una protectora de prueba desde `/admin/protectoras` y confirmar que llega el email. Si falla → RB-04.
