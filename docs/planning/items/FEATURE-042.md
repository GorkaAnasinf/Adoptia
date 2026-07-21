---
id: FEATURE-042
tipo: feature
titulo: Rediseño de "Mis acogidas" en dos pestañas (registro / propuestas)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-21
actualizado: 2026-07-21
---

> **Cierre (2026-07-21):** hecho en `feature/FEATURE-042-acogidas-pestanas`. Nuevo
> `MisAcogidasCliente` divide la vista en dos pestañas (patrón de `MisCitasCliente`):
> **Propuestas recibidas** (badge "N nuevas" = `enviada`; sin registro, invita a
> registrarse) y **Mi registro de acogida** (`AcogidaForm`). Por defecto: registrado
> → Propuestas; sin registrar → Registro. `PropuestasRecibidas` pasa a client, se
> restila a tarjetas de la tanda y estrena **"Contactar refugio"** → `/protectoras/[slug]`
> (se añadió `slug` al select en ambas páginas de acogida, privada y pública). El h2
> del título se movió al llamador (la pública lo conserva sobre la lista). Modelo sin
> cambios (el form ya cubría todos los campos del wireframe). QA: suite **1038 verde**
> (0 fallos), typecheck y lint limpios; sin migraciones. **Pendiente:** despliegue.

# FEATURE-042 — Mis acogidas (/mi-cuenta/acogida) en dos pestañas

## Descripción

Octava pantalla de la tanda Stitch (wireframe en `assets/wireframes/usuarioacogidas/`).
Hoy `/mi-cuenta/acogida` apila en una sola columna: subtítulo, aviso de privacidad,
el bloque de **propuestas recibidas** y debajo el **formulario de alta** de casa de
acogida. La petición: **dividir la vista en dos pestañas** (mismo patrón que "mis
citas" Próximas/Pasadas): una para el **alta/registro de datos de acogida** y otra
para la **lista de propuestas de acogida** recibidas. Basarse en el wireframe pero
con este giro, y mantener la coherencia visual de lo ya construido.

## Contexto / impacto

Afecta al adoptante que se ofrece como casa de acogida. Hoy el formulario y las
propuestas compiten por la misma columna; separarlos en pestañas aclara el "doy mis
datos" vs. "gestiono lo que me llega". El modelo ya tiene todos los campos del
wireframe (no hay ficción que sustituir).

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md`, `adoptia-testing.md`.
- Precedente de pestañas: `MisCitasCliente` (FEATURE-037/tanda) — `role="tablist"`,
  `role="tab"`, `aria-selected`, render solo del panel activo.
- FEATURE-029 (propuestas), FEATURE-030 (relevo), IMPROVEMENT-026 (sync acogida).

### Seguridad

- Sin cambios. Sigue leyendo/escribiendo `foster_homes` (dueño) y `foster_proposals`
  (destinatario) bajo RLS existente. Sin sesión → `/login`.

### Modelo de datos

- **Sin cambios.** `foster_homes` (user_id, city, radius_km, condiciones jsonb con
  especies/vivienda/jardin/otros_animales/notas, active, location) y
  `foster_proposals`. El formulario actual ya cubre todos los campos del wireframe.

### API

- Sin cambios.

### Frontend

- **Nuevo client component** `MisAcogidasCliente` (espejo de `MisCitasCliente`):
  recibe `userId`, `existente` (FosterHome|null) y `propuestas`. Renderiza cabecera +
  **dos pestañas**:
  - **"Propuestas recibidas"** — la lista (mueve `PropuestasRecibidas` dentro; pasa a
    client). Badge **"N nuevas"** = propuestas con `status === "enviada"`. Si no hay
    registro aún, estado vacío que invita a rellenar la otra pestaña.
  - **"Mi registro de acogida"** — el `AcogidaForm` (alta/edición, pausar/baja).
  - **Pestaña por defecto:** registrado → "Propuestas"; sin registrar → "Mi registro".
- **Restyle a la coherencia de la tanda** (no ficción nueva): tarjetas `rounded-2xl`
  con `shadow-soft`/`border-border`, chips tonales, botón primario granate, aviso de
  privacidad conservado. El wireframe añade **"Contactar refugio"** en la tarjeta de
  propuesta → enlace al perfil `/protectoras/[slug]` (se añade `slug` al select de
  `shelters`). "Necesito relevo" (RelevoAcogidaButton) se conserva en las aceptadas.
- **Página** `acogida/page.tsx`: misma carga de datos; envuelve todo en
  `MisAcogidasCliente`. El `select` de `foster_proposals` añade `shelters (name, slug)`.
- Textos nuevos a `messages/es.json` (`acogida.*`): etiquetas de pestañas, badge de
  nuevas, "Contactar refugio", estado vacío de propuestas sin registro.

### Tareas TDD

1. `MisAcogidasCliente.test.tsx`: sin registro arranca en "Mi registro" (botón
   registrar visible); con registro arranca en "Propuestas" y muestra la lista +
   badge de nuevas; cambiar a "Mi registro" muestra pausar/baja; "Contactar refugio"
   apunta a `/protectoras/[slug]`.
2. Ampliar `acogida/page.test.tsx` al nuevo árbol de pestañas (redirect sin sesión,
   registro vs. propuestas por pestaña).
3. Verificación visual contra `screen.png` + `tsc` + lint + suite.

### Dependencias

- Ninguna.

## Criterios de aceptación / Casuística a cubrir

- [ ] Dos pestañas accesibles (tablist/tab/aria-selected), solo el panel activo renderiza.
- [ ] Sin registro: por defecto "Mi registro"; la pestaña de propuestas explica que hay que registrarse.
- [ ] Con registro: por defecto "Propuestas"; badge "N nuevas" = `enviada`.
- [ ] "Mi registro" conserva alta/edición, pausar/reactivar y baja con confirm.
- [ ] Propuesta aceptada conserva "Necesito relevo"; toda propuesta ofrece "Contactar refugio".
- [ ] Sin sesión: redirige a /login.
- [ ] Coherencia visual con la tanda (tokens, tarjetas, granate/teal); sin datos inventados.
