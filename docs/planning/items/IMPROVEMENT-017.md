---
id: IMPROVEMENT-017
tipo: improvement
titulo: Rediseño del dashboard de protectora (tarjetas de color y próximas citas)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-13
actualizado: 2026-07-13
---

# IMPROVEMENT-017 — Rediseño del dashboard de protectora (tarjetas de color y próximas citas)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Rediseñar `/panel` (dashboard de la protectora) según mockup aportado por el usuario:

- Cabecera: «Bienvenido, {protectora}» + subtítulo motivacional + botón granate «Publicar mascota» arriba a la derecha.
- Fila de 3 tarjetas de métricas con color:
  1. **Solicitudes pendientes** — tarjeta coral con corazón decorativo, número grande y delta semanal («+N% desde la última semana»).
  2. **Citas hoy** — tarjeta verde oscuro (teal) con número de citas de hoy y hora de la próxima.
  3. **Perfiles activos** — tarjeta clara con número de animales publicados y pila de avatares (fotos de portada) con «+N».
- Sección **Próximas Citas**: lista con bloque de fecha (mes/día), «{adoptante} - {animal} ({raza})», franja horaria y enlace «Ver todo el calendario».
- SIN columna de «Tareas Urgentes» del mockup.
- Fondo crema cálido (ya es el `--background` global).

## Contexto / impacto

El dashboard actual es funcional pero gris (tarjetas blancas uniformes). El mockup da identidad visual con la paleta ya existente (terracota/coral/teal/crema) y prioriza lo accionable: solicitudes y citas. Afecta solo a protectoras.

<!-- ============ PLANO 2: PLAN TÉCNICO ============ -->

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md` (tokens, tipografías, patrones de tarjeta)
- `.claude/commands/adoptia-testing.md` (tests de Server Components con mock de Supabase)
- `docs/technical/DESIGN.md`

### Seguridad

- Sin RLS nueva. El nombre del adoptante en «Próximas Citas» se lee con el cliente admin (mismo patrón documentado en `/panel/citas/page.tsx:60`): solo se expone `full_name` de adoptantes con cita en ESTA protectora.
- Ninguna superficie nueva (solo lectura en Server Component ya autenticado por layout `(shelter)`).

### Modelo de datos

- Sin cambios.

### API

- Sin cambios (todo en el Server Component).

### Frontend

Solo `src/app/(shelter)/panel/page.tsx` (+ textos y tests):

- **Cabecera**: ya existe; botón pasa a texto «Publicar mascota» (clave i18n nueva), estilo primary granate (ya lo es).
- **Tarjeta Solicitudes pendientes** (coral `bg-primary-container`, texto blanco): número grande = solicitudes `pending`; delta semanal = comparación de solicitudes creadas en los últimos 7 días vs los 7 anteriores (`+N%` / `−N%` / «sin cambios»); icono corazón decorativo grande semitransparente. Enlaza a `/panel/solicitudes`.
- **Tarjeta Citas hoy** (teal `bg-secondary`, texto blanco): citas `pending|confirmed` con `starts_at` hoy (Europe/Madrid); subtítulo «Próxima a las HH:MM» o «Sin citas hoy». Enlaza a `/panel/citas`.
- **Tarjeta Perfiles activos** (blanca/crema): animales con `published_at` y estado `available|reserved`; pila de hasta 4 avatares con foto de portada + chip «+N» restantes. Enlaza a `/panel/animales`.
- **Próximas Citas**: sustituye la tarjeta lateral actual — lista (máx. 4) con bloque de fecha (MES/día), línea «{adoptante} - {animal} ({raza})», franja «HH:MM - HH:MM», chevron; enlace «Ver todo el calendario» → `/panel/citas`.
- Se conservan: banners de estado pending/suspended, «Primeros pasos» si no hay animales, lista de animales recientes y solicitudes recientes (reorganizadas bajo las tarjetas).
- Textos nuevos en `messages/es.json` (namespace `panel` / `citas`).

### Tareas TDD

1. Test: tarjeta de solicitudes muestra número pendiente y delta semanal (casos +%, −%, sin datos previos) → implementar consulta de dos ventanas de 7 días + render.
2. Test: tarjeta de citas hoy muestra recuento y hora de la próxima; caso «sin citas hoy» → implementar consulta y render.
3. Test: tarjeta de perfiles activos cuenta publicados disponibles y renderiza pila de avatares con «+N» → implementar.
4. Test: sección Próximas Citas renderiza fecha, «adoptante - animal (raza)» y franja horaria; caso vacío → implementar (join + admin client para nombres).
5. Test de regresión: banners y «Primeros pasos» intactos → ajustar layout final.

### Dependencias

- Ninguna (FEATURE-004 y FEATURE-009 ya `hecho`).

## Criterios de aceptación / Casuística a cubrir

- [ ] Cabecera con saludo, subtítulo y botón «Publicar mascota» granate.
- [ ] Tarjeta coral de solicitudes con número y delta semanal correcto (sube, baja, sin histórico → oculta o «—»).
- [ ] Tarjeta teal con citas de HOY (zona Europe/Madrid) y hora de la próxima; estado sin citas.
- [ ] Tarjeta de perfiles activos con recuento y avatares (animales sin foto → placeholder huella).
- [ ] Próximas Citas con nombre de adoptante, animal, raza y franja; estado vacío con mensaje.
- [ ] Sin columna de Tareas Urgentes.
- [ ] Banners pending/suspended y Primeros Pasos siguen funcionando.
- [ ] Textos en `messages/es.json`, nada hardcodeado.
- [ ] `npm run lint`, `npx tsc --noEmit` y tests en verde.
