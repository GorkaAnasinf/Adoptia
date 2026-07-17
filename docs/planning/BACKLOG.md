# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-028 hecha** — rediseño del perfil público de protectora según mockup del usuario: hero con portada (uploader nuevo en el editor) + badge verificada + Contactar (mailto)/Donar, franja de métricas (RPC `shelter_public_stats`, security definer, cuenta adoptados despublicados; «años de labor» con el campo nuevo `founded_year`), dos columnas con servicios y horario/ubicación con mini-mapa, y grid de animales con las tarjetas estándar de la búsqueda (raza nueva en `AnimalCard`) más buscador y filtros de especie/edad client-side. QA Scooby 13/13; suite 974/974 con RLS, cobertura 82,0 % / 96,7 % `src/lib`. Antes: FEATURE-025/026/027 (rediseño de perdidos, en producción), FEATURE-024.
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando. IMPROVEMENT-024 (fallbacks con huella) **hecha** en `feature/IMPROVEMENT-024-pulido-fallbacks`, mergeada en develop y **pendiente de liberar a producción** (sin migración: solo UI).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — la migración `20260717090000_feature028_perfil_publico.sql` **aplicada en producción el 2026-07-17** (dry-run previo, confirmada con `migration list --linked`) y el release `0aface2` desplegado en Vercel (READY) y verificado en real sobre `/protectoras/<slug>`.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-17 (IMPROVEMENT-024 cerrada — huella como fallback de avatar y tarjetas; en develop, pendiente de release. Antes el mismo día: FEATURE-028 liberada a producción y **verificada en real por el usuario**, portada y año de fundación funcionando).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### ✅ Listo para desarrollo (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-025](items/IMPROVEMENT-025.md) | Acogidas visibles en la navegación del usuario | media | 0.5 |

### 📥 Recibido (5)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-029](items/FEATURE-029.md) | Propuestas de acogida estructuradas con trazabilidad | media | — |
| [FEATURE-030](items/FEATURE-030.md) | Relevo de acogida (emergencias del acogedor) | media | — |
| [FEATURE-031](items/FEATURE-031.md) | Tablón de necesidades de protectoras (pedir ayuda material) | media | — |
| [FEATURE-032](items/FEATURE-032.md) | Ofertas de donación de particulares (material para protectoras) | media | — |
| [FEATURE-033](items/FEATURE-033.md) | Alertas de búsqueda guardada (avisos de nuevos animales) | media | — |
<!-- RENDER:END -->
