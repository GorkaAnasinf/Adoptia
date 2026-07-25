# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **Nueva línea de trabajo: Jornadas de adopción** (eventos presenciales de captación), faseada en F1/F2/F3.
- **Progreso:** **FEATURE-062 hecha — Jornadas de adopción F1** (rama `feature/FEATURE-062-jornadas-adopcion`, circuito Manada completo). Modelo `events`/`event_animals`/`event_attendees` + RLS (dueña verificada gestiona · público ve publicadas no-borrador · cada uno su RSVP, solo la dueña la lista), RPCs `events_upcoming` (listado/proximidad) y `event_detail` (ficha/edición con guarda de visibilidad), bucket `event-posters`. Panel de la protectora con **formulario por secciones** (Datos/Ubicación/Animales/Cartel), borrador vs publicar con gating de ubicación, listado agrupado y rutas `/nueva` y `/[id]`. Cara pública `/jornadas` (listado + mapa Leaflet) y ficha `/jornadas/[id]` a dos columnas con **RSVP** (login gate) y **Compartir** (Web Share + portapapeles). Namespace i18n `jornadas` + nav (panel y pública). **Con migración** (`20260725100000_feature062_events`). QA: **199/199 RLS en DB limpio**, unit verde, cobertura 80.9 %, `tsc` y lint limpios. Decisiones #51-#53. Antes: agenda completa (FEATURE-053→057) y la tanda de rediseño (038–052), todo en producción.
- **FEATURE-063 hecha — Jornadas F2 (avisos)** (rama `feature/FEATURE-063-jornadas-avisos`): cron `/api/cron/jornadas` con recordatorio 24 h a asistentes, resumen a la protectora y aviso de jornada cercana por zona (RPC `event_zone_matches` con la zona de `saved_searches`); columnas de idempotencia `reminded_at`/`reminder_sent_at`/`zone_notified_at` + 3 plantillas de email. Decisiones #54-#55. RLS eventos 10/10, cron 4/4. **Con migración** `20260725160000_feature063_event_notifications`.
- **Siguiente:** **FEATURE-064 (Jornadas F3 — métricas → estadísticas e historias)**, ya planificada. **Ojo CI:** el job E2E lleva rojo crónico (**BUG-011**, ajeno a jornadas: onboarding + citas) — hay que arreglarlo para reactivar "main verde para cerrar".
- **Bloqueos:** ninguno. **Pendiente de despliegue:** la migración de **FEATURE-063** (`20260725160000_feature063_event_notifications`: columnas de idempotencia + RPC `event_zone_matches`) falta aplicar a prod (`supabase db push`) y **dar de alta el cron `/api/cron/jornadas`** en el scheduler externo (como el resto de `/api/cron/*`). La de **FEATURE-062** quedó **aplicada en producción el 2026-07-25**. Ya en `main` y en producción con migraciones aplicadas: agenda completa (FEATURE-053→057), FEATURE-044, gestión de acogidas (FEATURE-058), historias felices Nivel 1 y 2 (FEATURE-035/059), filtro «Apto para piso» (IMPROVEMENT-031) y badge «Urgente» (FEATURE-060). **Nota gitflow:** las ramas se crean **desde `main`** (`develop` está desfasado); la tanda se libera directa a `main`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). **Datos de prueba masivos** (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — **borrarlos (a cargo del usuario)**; ahora más urgente porque la sección «Ya están en casa» (FEATURE-035) muestra en prod cualquier adoptado con foto, incluidos los de prueba. Follow-up futuro de FEATURE-060: caducidad/límite del flag urgente (hoy es manual). Candidatos ya convertidos en items: buscador global (FEATURE-061) y alineación de `/mi-cuenta` (IMPROVEMENT-032).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-25 (**FEATURE-063 — Jornadas F2 (avisos)** cerrada: cron de recordatorios/resumen/zona + RPC `event_zone_matches`. **Migración F2 pendiente de `db push` a prod + alta del cron.** También hoy: FEATURE-062 F1 (en prod), BUG-011 abierto (CI E2E rojo crónico). Queda F3 (FEATURE-064). Capturas del manual de jornadas generadas).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-064](items/FEATURE-064.md) | Jornadas de adopción F3 — cierre con métricas hacia estadísticas e historias | baja | 0.5 |

### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-011](items/BUG-011.md) | CI en rojo crónico — el job E2E falla en onboarding y citas (main lleva rojo varias features) | alta | 0.5 |
<!-- RENDER:END -->
