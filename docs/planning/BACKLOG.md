# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-032 hecha** (rama `feature/FEATURE-032-donaciones-particulares`) — donaciones de particulares: `donation_offers` (espejo de `foster_homes`: pin redondeado ~200 m, radio del donante, RLS solo-dueño) + RPC `donation_offers_nearby` (doble guarda, sin coordenadas ni `user_id`), handler «Contactar» (relay AL DONANTE, 10/min), caducidad a 60 días en el cron de avisos con `renovada_at` no manipulable (decisión #42), `/mi-cuenta/donaciones` (alta/editar/entregar/renovar/borrar) y tablón `/panel/donaciones`, con entradas de navegación. QA: suite **1098/1098 con RLS**, cobertura 82,4 % / 96,6 % `src/lib`, lint y tsc limpios. Antes: FEATURE-031 (tablón de necesidades, en producción).
- **Siguiente:** sin items en curso — el backlog abierto queda en ideas/candidatos. Probar en real el tablón de necesidades y las donaciones con las cuentas de prueba. FEATURE-033 **descartada como duplicado de FEATURE-010** (2026-07-18): las alertas ya están en producción desde el hito 0.3; deltas menores anotados en el item (editar alerta, matching por edad).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260718100000_feature031_shelter_needs.sql` **aplicada en producción el 2026-07-18** (dry-run previo, confirmada) y el release `2091ba0` desplegado en Vercel (READY).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-18 (FEATURE-032 hecha — donaciones de particulares. Antes el mismo día: FEATURE-033 descartada como duplicado de FEATURE-010 y FEATURE-031 **liberada a producción**).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
_No hay items abiertos._
<!-- RENDER:END -->
