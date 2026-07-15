# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **BUG-006 hecho** — el listado ya no sirve la URL de un vídeo como imagen de portada: IMPROVEMENT-021 había perdido el filtro `type='photo'` de `animals_search` y se restaura. Suite entera (RLS incluida) en verde por primera vez: **882/882**. Antes: BUG-005 (informe de cobertura recuperado) y **FEATURE-022** (contacto por relay y avistamientos en los avisos de perdidos).
- **Siguiente:** FEATURE-023 (ficha identificativa del aviso: raza/sexo/tamaño/chip booleano, `lost_at`, galería y filtros) — `recibido`, le falta el plan de Snoopy.
- **Bloqueos:** ninguno. FEATURE-022 quedó verificada el 2026-07-15 (`db reset` limpio, 9/9 RLS y 3/3 E2E; el trigger de redondeo engancha, así que producción no guarda ubicaciones exactas). Se desplegó antes de verificar y salió bien, pero fue una apuesta. **Pendiente de despliegue:** nada — la migración `20260715160000_bug006_cover_url_solo_fotos` **aplicada en producción el 2026-07-15**, esta vez verificada ANTES (`db reset` + 882/882 en verde) y confirmada con `migration list --linked`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Follow-up nuevo (importante):** los tests de RLS **se saltan solos** sin `SUPABASE_TEST_*` (Decisión #17) y no hay carga de `.env` en Vitest — hay que comprobar si CI los ejecuta de verdad o si toda la suite RLS lleva tiempo saltándose ahí. BUG-006 salió a la luz solo al correrlos a mano; el test que debía cazarlo llevaba roto desde que se escribió.
- **Última actualización:** 2026-07-15 (BUG-006 cerrado — portada solo de fotos; suite 882/882 en verde; pendiente `db push` de su migración).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-023](items/FEATURE-023.md) | Avisos de perdidos — ficha identificativa completa, galería y filtros | media | 0.5 |
<!-- RENDER:END -->
