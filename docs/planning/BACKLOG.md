# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados).
- **Progreso:** **FEATURE-028 hecha** — rediseño del perfil público de protectora según mockup del usuario: hero con portada (uploader nuevo en el editor) + badge verificada + Contactar (mailto)/Donar, franja de métricas (RPC `shelter_public_stats`, security definer, cuenta adoptados despublicados; «años de labor» con el campo nuevo `founded_year`), dos columnas con servicios y horario/ubicación con mini-mapa, y grid de animales con las tarjetas estándar de la búsqueda (raza nueva en `AnimalCard`) más buscador y filtros de especie/edad client-side. QA Scooby 13/13; suite 974/974 con RLS, cobertura 82,0 % / 96,7 % `src/lib`. Antes: FEATURE-025/026/027 (rediseño de perdidos, en producción), FEATURE-024.
- **Siguiente:** nada en cola — lo que entre por la pasarela del analista o se detecte probando. Abierto: IMPROVEMENT-024 (pulido menor de fallbacks del perfil, prioridad baja).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** la migración `20260717090000_feature028_perfil_publico.sql` (cover_url, founded_year, RPC de métricas) está aplicada **solo en local** — hace falta `supabase db push` antes de liberar la rama a producción.
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-17 (FEATURE-028 cerrada en `feature/FEATURE-028-perfil-publico-protectora` — rediseño del perfil público de protectora; **migración pendiente de producción**).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [IMPROVEMENT-024](items/IMPROVEMENT-024.md) | Pulido menor del perfil público de protectora (fallbacks del hero y de las tarjetas) | baja | — |
<!-- RENDER:END -->
