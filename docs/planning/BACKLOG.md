# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-043 hecha** (rama `feature/FEATURE-043-form-alta-base`) — ajustes sobre «mis acogidas» + rediseño del formulario de alta como **patrón base**: ancho a `max-w-6xl`, pestañas reordenadas (registro→propuestas), botones de propuesta coherentes (relevo outline granate + contactar filled), y `AcogidaForm` en **tarjeta por secciones** (`FormSection` icono+título+ayuda) con **chips/segmented** (especies, distancia, vivienda). Nacen 3 primitivos reutilizables en `src/components/ui/`: `FormSection`, `ChipGroup`, `SegmentedControl`. Sin cambios de modelo. QA: suite verde. **Además esta sesión:** se puso **verde el CI de main** (fallaba en `npm audit` por `brace-expansion` high, arreglado con `npm audit fix`; y en el E2E de citas, cuyo assert `Visita:` quedó obsoleto tras el rediseño de solicitudes — otro daño sin QA — corregido a comprobar «Cancelar cita» + clave huérfana `citaProxima` eliminada). Antes: **FEATURE-042 hecha** (rama `feature/FEATURE-042-acogidas-pestanas`) — octava pantalla de la tanda: `/mi-cuenta/acogida` se divide en dos pestañas (patrón `MisCitasCliente`) con nuevo `MisAcogidasCliente`: **Propuestas recibidas** (badge «N nuevas» = `enviada`; sin registro invita a registrarse) y **Mi registro de acogida** (`AcogidaForm`). Defecto: registrado → Propuestas; sin registrar → Registro. `PropuestasRecibidas` pasa a client, restilado a la tanda + **«Contactar refugio»** → `/protectoras/[slug]` (slug añadido al select en acogida privada y pública; el h2 del título se movió al llamador). Modelo sin cambios. QA: suite **1038 verde**, typecheck y lint limpios; sin migraciones. Antes: **FEATURE-041** (crear alerta desde listado, release `c9c510f` 2026-07-21), **FEATURE-040** (mis alertas, `4bd0cc7`), FEATURE-039, IMPROVEMENT-029, FEATURE-038/037/036 (en producción).
- **Siguiente:** desplegar FEATURE-043 y luego siguiente pantalla de la tanda. **Verificación visual pendiente** de FEATURE-040/041/042/043 (dev local autenticado).
- **Bloqueos:** ninguno. **CI de main:** verde desde `07eb469` (2026-07-21). **Pendiente de despliegue:** **FEATURE-043** (sin migraciones). FEATURE-042 liberada el 2026-07-21 (release `67cb00e`), FEATURE-041 (`c9c510f`), FEATURE-040 (`4bd0cc7`). Antes: IMPROVEMENT-029 (`74f4112`).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019); **buscador global en la cabecera del área privada** y **alineación de las seis subpáginas de `/mi-cuenta`** con el lenguaje del dashboard (ambos vistos en FEATURE-039).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-21 (FEATURE-043 — formulario de alta como patrón base + ajustes de mis acogidas; CI de main verde).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->
