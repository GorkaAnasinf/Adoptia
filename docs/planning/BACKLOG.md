# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **Nueva línea de trabajo: Jornadas de adopción** (eventos presenciales de captación), faseada en F1/F2/F3.
- **Progreso:** **FEATURE-062 hecha — Jornadas de adopción F1** (rama `feature/FEATURE-062-jornadas-adopcion`, circuito Manada completo). Modelo `events`/`event_animals`/`event_attendees` + RLS (dueña verificada gestiona · público ve publicadas no-borrador · cada uno su RSVP, solo la dueña la lista), RPCs `events_upcoming` (listado/proximidad) y `event_detail` (ficha/edición con guarda de visibilidad), bucket `event-posters`. Panel de la protectora con **formulario por secciones** (Datos/Ubicación/Animales/Cartel), borrador vs publicar con gating de ubicación, listado agrupado y rutas `/nueva` y `/[id]`. Cara pública `/jornadas` (listado + mapa Leaflet) y ficha `/jornadas/[id]` a dos columnas con **RSVP** (login gate) y **Compartir** (Web Share + portapapeles). Namespace i18n `jornadas` + nav (panel y pública). **Con migración** (`20260725100000_feature062_events`). QA: **199/199 RLS en DB limpio**, unit verde, cobertura 80.9 %, `tsc` y lint limpios. Decisiones #51-#53. Antes: agenda completa (FEATURE-053→057) y la tanda de rediseño (038–052), todo en producción.
- **Siguiente:** **FEATURE-063 (Jornadas F2 — recordatorios email, aviso a la protectora y avisos por zona)** y luego **FEATURE-064 (F3 — métricas → estadísticas e historias)**, ambas ya planificadas (`estado: listo`). Se abordan cuando el usuario lo indique.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** la migración de **FEATURE-062** (`20260725100000_feature062_events`: tablas `events`/`event_animals`/`event_attendees`, enum `event_status`, RPCs `events_upcoming`/`event_detail`, bucket `event-posters`) está **aplicada solo en local** (`db reset`) — falta `supabase db push` a producción (a cargo del usuario). Ya en `main` y en producción con migraciones aplicadas: agenda completa (FEATURE-053→057), FEATURE-044, gestión de acogidas (FEATURE-058), historias felices Nivel 1 y 2 (FEATURE-035/059), filtro «Apto para piso» (IMPROVEMENT-031) y badge «Urgente» (FEATURE-060). **Nota gitflow:** las ramas se crean **desde `main`** (`develop` está desfasado); la tanda se libera directa a `main`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). **Datos de prueba masivos** (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — **borrarlos (a cargo del usuario)**; ahora más urgente porque la sección «Ya están en casa» (FEATURE-035) muestra en prod cualquier adoptado con foto, incluidos los de prueba. Follow-up futuro de FEATURE-060: caducidad/límite del flag urgente (hoy es manual). Candidatos ya convertidos en items: buscador global (FEATURE-061) y alineación de `/mi-cuenta` (IMPROVEMENT-032).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-25 (**FEATURE-062 — Jornadas de adopción F1** cerrada: modelo + RLS + RPCs, panel por secciones con cartel, cara pública con listado/mapa/ficha/RSVP/compartir. 199/199 RLS verde, cobertura 80.9 %. **Migración pendiente de `db push` a prod.** Quedan abiertas F2 (FEATURE-063) y F3 (FEATURE-064). Antes, 2026-07-25: BUG-010; 2026-07-24: IMPROVEMENT-033 y BUG-009).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-063](items/FEATURE-063.md) | Jornadas de adopción F2 — recordatorios, aviso a la protectora y avisos por zona | media | 0.5 |
| [FEATURE-064](items/FEATURE-064.md) | Jornadas de adopción F3 — cierre con métricas hacia estadísticas e historias | baja | 0.5 |
<!-- RENDER:END -->
