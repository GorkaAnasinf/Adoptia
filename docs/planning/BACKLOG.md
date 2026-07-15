# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **BUG-005 hecho** — `npm run test -- --coverage` vuelve a pasar (exit 0): `coverage.include` era `src/**` y el proveedor v8 reventaba parseando `globals.css` y las guías `.md`. Sin deuda escondida: los umbrales se cumplen sin tocar tests (80,85% de sentencias, `src/lib` 96,6%). Antes: **FEATURE-022** — los avisos de perdidos dejan de ser un tablón de solo lectura: contacto con el autor por relay (nadie ve el correo del otro), avistamientos ciudadanos con pin redondeado a ~200 m, timeline y pines en el mapa de la ficha, teléfono opt-in con aviso de estafa.
- **Siguiente:** **BUG-006** (alta — el listado sirve la URL de YouTube como imagen de portada cuando el animal no tiene foto de portada; en producción desde el 2026-07-14 por una regresión de IMPROVEMENT-021) y después FEATURE-023 (ficha identificativa del aviso: raza/sexo/tamaño/chip booleano, `lost_at`, galería y filtros). Ambos `recibido`, les falta el plan de Snoopy.
- **Bloqueos:** ninguno. **FEATURE-022 quedó verificada el 2026-07-15**: `db reset` aplica la migración limpia, 9/9 tests RLS y 3/3 E2E en verde — el trigger de redondeo engancha en `lost_found_sightings` (producción no está guardando ubicaciones exactas), la RLS oculta las pistas de avisos archivados y el cron respeta la actividad. Se desplegó antes de verificar y salió bien, pero fue una apuesta. **Pendiente de despliegue:** nada.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Follow-up nuevo (importante):** los tests de RLS **se saltan solos** sin `SUPABASE_TEST_*` (Decisión #17) y no hay carga de `.env` en Vitest — hay que comprobar si CI los ejecuta de verdad o si toda la suite RLS lleva tiempo saltándose ahí. BUG-006 salió a la luz solo al correrlos a mano; el test que debía cazarlo llevaba roto desde que se escribió.
- **Última actualización:** 2026-07-15 (BUG-005 cerrado; FEATURE-022 verificada tras desplegarse; BUG-006 y FEATURE-023 abiertos).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-006](items/BUG-006.md) | El listado sirve la URL de YouTube como imagen de portada cuando el animal no tiene foto de portada | alta | 0.5 |
| [FEATURE-023](items/FEATURE-023.md) | Avisos de perdidos — ficha identificativa completa, galería y filtros | media | 0.5 |
<!-- RENDER:END -->
