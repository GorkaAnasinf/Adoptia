# Backlog — Adoptia

> **Vista renderizada** desde `items/` con `python scripts/render_planning.py` — **no editar la zona RENDER a mano**.
> El bloque 📍 ESTADO ACTUAL lo mantiene Hachiko al cerrar cada tarea.

## 📍 ESTADO ACTUAL

- **Hito activo:** 0.5 — post-MVP (mantenimiento y features detectadas en pruebas reales; hitos 0.2–0.4 cerrados). **En marcha: tanda de rediseño de pantallas con wireframes Stitch** (`assets/wireframes/<pantalla>/`), cadencia pantalla a pantalla con circuito completo y liberación a producción por cada una.
- **Progreso:** **FEATURE-040 hecha** (rama `feature/FEATURE-040-alertas`) — séptima pantalla de la tanda: `/mi-cuenta/alertas` pasa de filas planas a **rejilla de tarjetas** (`AlertaCard`) con chip por filtro real (especie/tamaño/sexo/distancia o «Toda España»), interruptor Activa/Pausada por RLS, «Ver resultados» al listado con los filtros, «Eliminar» con confirm, tarjeta punteada «Nueva alerta» y aviso honesto (sin el «40% con IA» inventado). Se cae la ficción del mock (miniaturas +N, «último encontrado», chip «Urgente»); `AlertaAcciones` retirado. **Auditoría previa (esta pasada):** los commits de «mis citas» y «mis favoritos» se mergearon sin QA y dejaron la suite en rojo — se añadieron los tests ausentes (tabs/calendario de `MisCitasCliente`, `VaciarFavoritosButton`) y se endureció el guard i18n (regex casaba `=>` con un `<` posterior → 2 falsos positivos). QA: suite unitaria **1025 verde** (RLS de `saved_searches` sin cambios; no re-ejecutados sin supabase local esta pasada), typecheck y lint limpios; sin migraciones. Antes: FEATURE-039, IMPROVEMENT-029, FEATURE-038, IMPROVEMENT-028, FEATURE-037/036/034 (en producción).
- **Siguiente:** **verificación visual de FEATURE-040** (dev local autenticado) y luego siguiente pantalla de la tanda.
- **Bloqueos:** ninguno. **Pendiente de despliegue:** **FEATURE-040** y **FEATURE-039** (sin migraciones). Antes: IMPROVEMENT-029 liberada el 2026-07-20 (release `74f4112`, verificada en `adoptia-eight.vercel.app/perdidos-encontrados`).
- **Follow-ups abiertos:** Re-medir Lighthouse de ficha/listado en producción cuando haya contenido real (ver IMPROVEMENT-012). Datos de prueba masivos (`@masivo.adoptia.es`, slugs `-msv`) cargados en local y en producción el 2026-07-13 — borrarlos al acabar las pruebas. Candidatos a item: badge «Urgente» (requiere campo en BD) y filtro «Apto para piso» en el RPC `animals_search` (mockup de IMPROVEMENT-019); **buscador global en la cabecera del área privada** y **alineación de las seis subpáginas de `/mi-cuenta`** con el lenguaje del dashboard (ambos vistos en FEATURE-039).
- **Nota (2026-07-15):** se corrigió una afirmación errónea de BUG-005: los umbrales de cobertura **sí** se vigilaban en CI — el `RolldownError` era ruido en Linux (exit 0, tabla impresa, umbrales evaluados) y solo tumbaba el proceso en Windows.
- **Cómo correr los E2E en local:** ver `docs/meta/TESTING.md` — hay tres trampas documentadas que cuestan horas si no se conocen (el `npm run dev` zombi que Playwright reutiliza, el `upsert(onConflict: "slug")` que no es idempotente, y el captcha).
- **Última actualización:** 2026-07-20 (FEATURE-040 — «Mis alertas» estrena el diseño Stitch + auditoría de tests de la tanda).

## Items abiertos por estado

Los items `hecho`/`descartado` no aparecen aquí — su histórico vive en [CHANGELOG](CHANGELOG.md) y git.

<!-- RENDER:START -->
### 📥 Recibido (1)

| Item | Título | Prioridad | Hito |
|------|--------|-----------|------|
| [FEATURE-035](items/FEATURE-035.md) | Historias felices — social proof de adopciones en la home | baja | — |
<!-- RENDER:END -->
