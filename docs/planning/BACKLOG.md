# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **BUG-006 hecho** — el listado ya no sirve la URL de un vídeo como imagen de portada: IMPROVEMENT-021 había perdido el filtro `type='photo'` de `animals_search` y se restaura. Suite entera (RLS incluida) en verde por primera vez: **882/882**. Antes: BUG-005 (informe de cobertura recuperado) y **FEATURE-022** (contacto por relay y avistamientos en los avisos de perdidos).
- **Siguiente:** **BUG-007** (alta — CI no ejecuta los tests de RLS; es el agujero por el que se coló BUG-006 hasta producción) y después FEATURE-023 (ficha identificativa del aviso: raza/sexo/tamaño/chip booleano, `lost_at`, galería y filtros). Ambos `recibido`, les falta el plan de Snoopy.
- **Bloqueos:** ninguno. FEATURE-022 quedó verificada el 2026-07-15 (`db reset` limpio, 9/9 RLS y 3/3 E2E; el trigger de redondeo engancha, así que producción no guarda ubicaciones exactas). Se desplegó antes de verificar y salió bien, pero fue una apuesta. **Pendiente de despliegue:** nada — la migración `20260715160000_bug006_cover_url_solo_fotos` **aplicada en producción el 2026-07-15**, esta vez verificada ANTES (`db reset` + 882/882 en verde) y confirmada con `migration list --linked`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Comprobado (2026-07-15):** CI **no ejecuta ni un solo test de RLS** — `ci.yml` no levanta Supabase ni define `SUPABASE_TEST_*`, así que los 122 se saltan en verde en cada push (log del run `29410086226`). Abierto como **BUG-007** (alta). De paso se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux y solo tumbaba el proceso en Windows.
- **Última actualización:** 2026-07-15 (BUG-006 cerrado y desplegado; BUG-007 abierto — CI no corre los tests de RLS).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-007](items/BUG-007.md) | CI no ejecuta ni un solo test de RLS — 122 tests se saltan en silencio en cada push | alta | 0.5 |
| [FEATURE-023](items/FEATURE-023.md) | Avisos de perdidos — ficha identificativa completa, galería y filtros | media | 0.5 |
<!-- RENDER:END -->
