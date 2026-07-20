# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-039 hecha** (rama `feature/FEATURE-039-dashboard-mi-cuenta`) — `/mi-cuenta` deja de ser una página muerta (cartel fijo, cero consultas) y pasa a ser el panel de inicio del adoptante: hero de bienvenida, métricas de favoritos/solicitudes en curso/citas próximas, solicitudes recientes con su estado real, tira de favoritos, panel «Tu aportación», **Recordatorios** (cita próxima, propuesta de acogida sin responder y solicitud aprobada **sin visita reservada**, que era la acción que se perdía) y el animal que más lleva esperando. Lo que el wireframe pedía y el modelo no tiene (euros/kilos donados, niveles de usuario, mensajería) se sustituye por datos reales — ver decisiones 43-45 de DECISIONS. Scooby rechazó la primera pasada: `foster_proposals` se leía sin filtrar por destinatario (RLS también deja verla a la protectora que la envía) y el estado vacío ignoraba acogida/alertas/donaciones; ambos corregidos con test rojo previo. QA: suite **1183/1183 con RLS**, sin migraciones. Antes: IMPROVEMENT-029, FEATURE-038, IMPROVEMENT-028, FEATURE-037/036/034 e IMPROVEMENT-027 (en producción).
- **Siguiente:** siguiente pantalla de la tanda (con wireframe en `assets/wireframes/<pantalla>/` o instrucción directa como el mapa).
- **Bloqueos:** ninguno. **Pendiente de despliegue:** **FEATURE-039** (sin migraciones). Antes: IMPROVEMENT-029 liberada el 2026-07-20 (release `74f4112`, verificada en `adoptia-eight.vercel.app/perdidos-encontrados`).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019); **buscador global en la cabecera del área privada** y **alineación de las seis subpáginas de `/mi-cuenta`** con el lenguaje del dashboard (ambos vistos en FEATURE-039).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-20 (FEATURE-039 — «Mi cuenta» se convierte en el dashboard del adoptante).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->
