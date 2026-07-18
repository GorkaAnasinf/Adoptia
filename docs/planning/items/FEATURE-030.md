---
id: FEATURE-030
tipo: feature
titulo: Relevo de acogida (emergencias del acogedor)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-030 — Relevo de acogida (emergencias del acogedor)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Una casa de acogida con animales acogidos puede necesitar dejar de acogerlos temporalmente (inundación, obras en casa, hospitalización…). El animal es de la protectora: el acogedor no lo recoloca por su cuenta, **avisa** y la protectora gestiona el relevo.

1. El acogedor con acogida activa marca «Necesito relevo» desde `/acogida`, indicando motivo y fecha límite.
2. La protectora recibe el aviso; en su panel la acogida pasa a estado `relevo_pedido`.
3. La protectora propone la acogida a otros acogedores de la zona reutilizando el flujo de propuestas (FEATURE-029).
4. Al aceptarse el relevo, la acogida original pasa a `finalizada` y se abre la nueva: el historial refleja la cadena completa.

## Contexto / impacto

Sin este mecanismo, el acogedor en apuros resuelve por WhatsApp o abandona la acogida sin rastro, y la protectora pierde el control del animal justo en el peor momento. Da red de seguridad al acogedor (acoger no es una trampa) y trazabilidad continua a la protectora.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- FEATURE-029 e IMPROVEMENT-026 (cierres), migraciones `20260717150000` y `20260717200000`, [API_CONTRACTS](../../technical/API_CONTRACTS.md); skills `adoptia-database`, `adoptia-security`, `adoptia-backend`, `adoptia-frontend`, `adoptia-testing`.

### Decisiones de diseño

- **El relevo son columnas de la propuesta aceptada, no un estado nuevo**: `relevo_pedido_at`, `relevo_motivo` (≤500), `relevo_fecha_limite` (date). El `status` sigue `aceptada` (el animal sigue acogido), así que ni el índice único ni el trigger de sincronización cambian de semántica. El chip «Relevo pedido» sale de `relevo_pedido_at is not null`.
- **El acogedor no gana update sobre la tabla** (la RLS de update es solo de la protectora y así se queda): pide y cancela el relevo vía **RPC `security definer`** (`pedir_relevo`, `cancelar_relevo`) que exigen `auth.uid() = foster_user_id` y `status = 'aceptada'`.

### Seguridad

- RPCs con doble guarda (destinatario + propuesta aceptada); `revoke` de execute a anon. Handler con auth + Zod + rate limit. El email va a la protectora con sus propios datos de contexto — sin exponer nada nuevo del acogedor (motivo lo escribe él conscientemente).

### Modelo de datos

- Migración: 3 columnas nuevas en `foster_proposals` + RPCs `pedir_relevo`/`cancelar_relevo`.
- **Arreglo del trigger** (edge detectado al planificar): con DOS propuestas `aceptada` sobre el mismo animal (relevo en marcha), finalizar la original NO debe devolver el animal a `available` — el trigger solo revierte si no queda otra `aceptada` viva con ese animal.

### API

- `POST /api/acogida/relevo` (nuevo): body `{ proposal_id, motivo, fecha_limite }` — auth acogedor, valida vía RPC y envía email a la protectora (motivo, fecha, animal). `DELETE` (o `POST` con `cancelar: true`) para retirar la petición. Documentar en API_CONTRACTS.

### Frontend

- Acogedor (`PropuestasRecibidas`): en propuesta `aceptada`, botón «Necesito relevo» → mini-formulario (motivo + fecha límite); con relevo pedido, aviso visible + «Cancelar relevo».
- Protectora (`/panel/acogida`): chip «Relevo pedido hasta {fecha}» + motivo en el historial y en la tarjeta del acogedor afectado; desde ahí propone a otros acogedores con el flujo existente y, cerrado el relevo, finaliza la original (acción existente).
- Textos en `es.json`; plantilla de email nueva.

### Tareas TDD

1. Test RPC `pedir_relevo`: el acogedor destinatario sí (campos escritos); sobre `enviada`/`finalizada` no; protectora/terceros no.
2. Test RPC `cancelar_relevo`: limpia los campos; solo el acogedor destinatario.
3. Test trigger: dos `aceptada` sobre el mismo animal → finalizar la original mantiene `fostered`; finalizar la última lo devuelve a `available`.
4. Test handler: 401 sin sesión; 422 inválido; 404 propuesta ajena o no aceptada; feliz → email a la protectora con motivo/fecha/animal (mock Resend); cancelar.
5. Test UI acogedor: botón solo en `aceptada`; formulario valida; estado «relevo pedido» + cancelar.
6. Test UI panel: chips de relevo en historial y tarjeta del acogedor.
7. Suite completa (RLS incluidos) + lint + `tsc`.

### Dependencias

- FEATURE-029 e IMPROVEMENT-026 (ambas `hecho`, en producción).

## Criterios de aceptación / Casuística a cubrir

- [x] Acogedor con acogida `aceptada` pide relevo (motivo + fecha límite) y puede cancelarlo; sin acogida aceptada, la opción no existe.
- [x] La protectora recibe email y ve el relevo (chip + motivo + fecha) en su panel.
- [x] Solo el acogedor destinatario puede pedir/cancelar su relevo (RPC probado permitido/denegado); la tabla no gana permisos de update para él.
- [x] Relevo cerrado: aceptada la nueva propuesta y finalizada la original, el animal sigue `fostered` (trigger corregido, probado con dos aceptadas del mismo animal).
- [x] Estados vacíos y textos en `es.json`; suite completa verde, lint y `tsc` limpios.

## Cierre (2026-07-17)

- **BD** (migración `20260717210000`): columnas `relevo_pedido_at/motivo/fecha_limite` en `foster_proposals` + RPCs `pedir_relevo`/`cancelar_relevo` (security definer, doble guarda: destinatario Y propuesta aceptada; la RLS de update sigue siendo solo de la protectora, probado). Trigger de sincronización corregido: con dos `aceptada` del mismo animal (relevo en marcha), finalizar una no lo devuelve a `available` — solo cuando no queda ninguna viva. 6 tests contra Postgres real.
- **API**: `POST /api/acogida/relevo` (pedir/cancelar) con email best-effort a la protectora (acogedor, animal, motivo, fecha límite). Contrato en API_CONTRACTS.
- **UI**: `RelevoAcogidaButton` en las propuestas aceptadas del acogedor (`/acogida` y `/mi-cuenta/acogida`); chips ámbar de relevo (fecha + motivo) en la tarjeta del acogedor y el historial de `/panel/acogida`. El relevo se resuelve con el flujo existente: la protectora propone a otro acogedor y finaliza la original.
- QA Scooby 5/5. Suite 1033/1033 con RLS, lint y `tsc` limpios, cobertura 82,6 % / 96,7 % `src/lib`.
- **Producción (2026-07-18)**: migración aplicada con dry-run previo y confirmada (`migration list --linked`); release `4a0f794` desplegado en Vercel (READY).

## Criterios de aceptación / Casuística a cubrir

- [ ] Acogedor con acogida activa puede pedir relevo (motivo + fecha límite); sin acogida activa, la opción no existe.
- [ ] La protectora recibe aviso (email + estado visible en su panel) y puede lanzar propuestas de relevo a otros acogedores de su zona.
- [ ] Cerrado el relevo, la acogida original queda `finalizada` y la nueva `aceptada`; el historial conserva la cadena.
- [ ] Cancelación: el acogedor puede retirar la petición de relevo si su situación se resuelve.
- [ ] RLS: solo protectora y acogedor implicados ven la petición.

### Dependencias

- FEATURE-029 (propuestas de acogida con trazabilidad) debe estar `hecho`.
