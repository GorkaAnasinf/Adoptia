# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-022 hecha (con verificación pendiente)** — los avisos de perdidos dejan de ser un tablón de solo lectura: contacto con el autor por relay (nadie ve el correo del otro), avistamientos ciudadanos con pin redondeado a ~200 m, timeline y pines en el mapa de la ficha, teléfono opt-in con aviso de estafa. Antes: IMPROVEMENT-021 (búsqueda por texto en el listado).
- **Siguiente:** **verificar FEATURE-022 en cuanto haya Docker** (ver Bloqueos — es deuda de producción, no de desarrollo) y después FEATURE-023 (ficha identificativa del aviso: raza/sexo/tamaño/chip booleano, `lost_at`, galería y filtros) — está `recibido`, le falta el plan de Snoopy.
- **Bloqueos:** ⚠️ **FEATURE-022 está EN PRODUCCIÓN sin haberse verificado nunca.** La migración `20260715120000` se aplicó el 2026-07-15 (`db push`) sin haber corrido antes en ningún entorno; `main` y `develop` subidas. Los 10 tests RLS de `perdidos-avistamientos` y los 2 E2E siguen **sin ejecutar**: nadie ha comprobado que el trigger de redondeo enganche en `lost_found_sightings` (si falla, se guardan coordenadas exactas de quien reporta y esas filas no se deshacen), ni que la RLS oculte las pistas de avisos archivados. **En cuanto haya Docker:** `npx supabase start` → `supabase db reset` → `npm run test` → `npx playwright test perdidos`, y revisar si producción ya guardó filas afectadas. **Pendiente de despliegue:** nada.
- **Follow-ups abiertos:** **BUG-005** — `npm run test -- --coverage` revienta parseando `globals.css` y las guías `.md` (preexistente, confirmado sobre árbol limpio): los umbrales de cobertura llevan tiempo sin vigilarse. Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Última actualización:** 2026-07-15 (FEATURE-022 cerrada con bloqueo de verificación; FEATURE-023 y BUG-005 abiertos).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (2)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [BUG-005](items/BUG-005.md) | npm run test -- --coverage revienta al parsear globals.css y las guías .md | media | — |
| [FEATURE-023](items/FEATURE-023.md) | Avisos de perdidos — ficha identificativa completa, galería y filtros | media | 0.5 |
<!-- RENDER:END -->
