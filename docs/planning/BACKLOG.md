# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-037 hecha** (rama `feature/FEATURE-037-rediseno-protectoras`) — rediseño del directorio /protectoras: cabecera centrada, buscador por nombre/ciudad/provincia, chips Todas/Con animales (`aria-pressed`), tarjetas con cover + «Verificada» + contadores reales de animales y adopciones (embeds con alias, sin migración), «Ver perfil», paginación 12 «Página X de N» y vacío de búsqueda con limpiar. QA: suite **1128/1128 con RLS**, E2E 4/4. Antes: FEATURE-036 y FEATURE-034/IMPROVEMENT-027 (en producción).
- **Siguiente:** siguiente wireframe de la tanda de rediseño (el usuario los trae uno a uno; los deja en `assets/wireframes/<pantalla>/` con `code.html` + `DESIGN.md` + `screen.png`). Componentes compartidos y de efectos ya alineados.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** nada — FEATURE-037 **liberada a producción el 2026-07-19** (release `f120b08`, verificado en `adoptia-eight.vercel.app/protectoras`: cabecera, chips y contadores servidos; sin migraciones).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-19 (FEATURE-037 — rediseño del directorio de protectoras, tercera pantalla de la tanda Stitch).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->
