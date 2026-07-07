---
id: IMPROVEMENT-005
tipo: improvement
titulo: Editar los datos de la protectora mientras el alta está en revisión
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-07
actualizado: 2026-07-07
---

# IMPROVEMENT-005 — Editar el alta mientras está en revisión

## Descripción

Cuando una protectora envía el alta, queda en estado **"En revisión"** (`pending`) y hoy
**no puede corregir sus datos**: el gate de onboarding la expulsa del wizard. Se habilita un
flujo de edición: desde el banner "En revisión" del panel, un enlace "Editar datos" reabre
el asistente ya relleno para modificar y volver a guardar, sin cambiar el estado.

## Contexto / impacto

Es un hueco real detectado en pruebas. Si una protectora se equivoca (CIF, dirección,
horarios) tras enviar, queda bloqueada hasta que un admin actúe. Poder autocorregir mientras
espera reduce rechazos y fricción de soporte. Adelanta parte de [[FEATURE-004]] (perfil de
protectora) con el mínimo imprescindible.

## Plan de desarrollo

### Comportamiento (decisión de diseño)

- El gate `decideOnboardingGate` hoy trata el alta como **de un solo uso**: enviada
  (`submitted_at != null`) → el wizard redirige al panel ([onboarding.ts:28](../../src/lib/onboarding.ts#L28)).
- **Cambio:** el wizard `/panel/alta` es **accesible cuando `status === 'pending'`**. En
  estado `verified` sigue siendo de un solo uso (wizard → panel). Se añade `status` a los
  parámetros del gate.
  - `pending`: nunca redirige (puede estar en panel o en el wizard-edición).
  - `verified`: wizard → panel (comportamiento actual).
  - `suspended`: **fuera de alcance** de este item (ver Preguntas abiertas).
- Reenviar desde el wizard en modo edición **no cambia `status`** (sigue `pending`); solo
  actualiza los datos y refresca `submitted_at`. La política RLS ya permite al dueño
  actualizar sus campos y un trigger `BEFORE UPDATE` bloquea el cambio de `status`
  (Decisión de seguridad de FEATURE-002) — **verificar con test que la edición en `pending`
  no puede colar un `status`**.

### Seguridad

- Sin nueva superficie de datos. Reusa el `upsert` existente del wizard, protegido por RLS.
- **Test RLS clave:** el dueño en `pending` puede actualizar name/address/horarios pero NO
  `status`/`verification_note` (el trigger lo impide). Reafirma la garantía de FEATURE-002.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios (reusa `supabase.upsert` cliente + `/api/protectoras/geocode`).

### Frontend

- **`onboarding.ts`**: `decideOnboardingGate` acepta `status`; lógica arriba.
- **`middleware.ts`**: pasar `status` (ya lee `shelters`; añadir la columna al `select`).
- **`panel/page.tsx`**: en el banner `pending`, añadir enlace **"Editar datos"** → `/panel/alta`.
- **`panel/alta/page.tsx` + `WizardAlta`**: detectar modo edición (`status === 'pending'` con
  alta ya enviada) para:
  - Título/subtítulo contextual ("Edita los datos de tu protectora").
  - Pantalla final: "Cambios guardados" en vez de "¡Solicitud enviada!".
  - Botón final: "Guardar cambios" en vez de "Enviar a revisión".
- i18n: claves nuevas en `onboarding` para los textos de modo edición.

### Tareas TDD

1. **`decideOnboardingGate`** (unit): en `pending`, el wizard NO redirige; en `verified`,
   wizard → panel; sin ficha/borrador, fuerza wizard (regresión). → implementar `status`.
2. **RLS** (test real): dueño en `pending` actualiza datos ✅ pero intento de cambiar
   `status` ❌ (trigger). 
3. **Banner del panel**: test "en `pending` aparece el enlace Editar datos a /panel/alta".
4. **WizardAlta modo edición**: test "con alta pending muestra copy de edición y botón
   'Guardar cambios'; al guardar no marca status".
5. Verificación manual (`verify`): protectora pending edita CIF/horarios, guarda, sigue
   pending, cambios persisten; una verificada no puede reabrir el wizard.

### Dependencias

- [[FEATURE-002]] (`hecho`) — alta + verificación admin.
- [[IMPROVEMENT-002]] (`hecho`) — wizard sobre el shell (se reutiliza).

## Preguntas abiertas (para aprobación)

1. **¿Incluir `suspended`?** Una protectora suspendida (o alta rechazada) ¿debería poder
   editar y reenviar? Propongo **dejarlo fuera** de este item y tratarlo con la moderación de
   [[FEATURE-011]], salvo que lo quieras aquí.
2. **¿Reenvío explícito o autoguardado?** Propongo botón explícito "Guardar cambios" (no
   auto-submit) para que el gesto de reenviar sea consciente.

## Criterios de aceptación / Casuística a cubrir

- [x] Una protectora en `pending` puede reabrir el wizard desde el banner y editar sus datos.
- [x] Al guardar en modo edición, los cambios persisten y el estado sigue `pending` (no se
      auto-verifica ni cambia `status`).
- [x] Una protectora `verified` NO puede reabrir el wizard (sigue redirigiendo al panel).
- [x] RLS: el dueño no puede alterar `status`/`verification_note` ni en modo edición.
- [x] Copy del wizard adaptado al modo edición (título, pantalla final, botón).
- [x] Sin textos hardcodeados; responsive; sin regresión del flujo de alta inicial.
