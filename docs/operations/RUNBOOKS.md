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

## RB-03 — Clave filtrada (anon/service_role/Resend)

1. **Rotar inmediatamente** en el proveedor (Supabase: Settings → API → regenerate; Resend: nueva key y borrar la vieja).
2. Actualizar en: Vercel env (Prod+Preview) + GitHub secrets + `.env.local` propio.
3. Redeploy de producción.
4. `service_role` filtrada: además, revisar logs de Supabase por accesos anómalos y registrar en [SECURITY](SECURITY.md).
5. Actualizar `.secrets.baseline` si detect-secrets marcó el incidente.

## RB-04 — Cuota Resend agotada (emails no salen)

1. Verificar en dashboard Resend (100/día free).
2. Emails críticos pendientes (confirmaciones de cita): reintentarán al día siguiente vía cron — comunicarlo si afecta a citas de <24 h.
3. Recurrente: reducir alertas (agrupación) o plan de pago.

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
