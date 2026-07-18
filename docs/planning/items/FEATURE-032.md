---
id: FEATURE-032
tipo: feature
titulo: Ofertas de donación de particulares (material para protectoras)
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-18
---

# FEATURE-032 — Ofertas de donación de particulares

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Caso típico: a una persona se le muere su animal y quiere donar sus cosas (comida sin abrir, transportín, camas, juguetes) a una protectora. Se pide:

1. El usuario publica una oferta de donación: categoría, descripción, ciudad + pin redondeado y radio — espejo del patrón de privacidad de `foster_homes` (FEATURE-016).
2. Las protectoras verificadas de la zona ven las ofertas en su panel (RPC de proximidad tipo `foster_homes_nearby`) y contactan → el email va AL DONANTE con los datos de la protectora, nunca al revés.
3. La oferta se marca `entregada` al concretarse, y caduca automáticamente pasado un plazo (evitar tablón zombie).

## Contexto / impacto

Momento emocionalmente delicado (duelo) con voluntad real de ayudar que hoy se pierde o acaba en la basura. Complementa a FEATURE-031: allí la protectora pide, aquí el particular ofrece. Reutiliza en bloque los patrones de privacidad, proximidad y contacto ya probados en acogidas.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`foster_homes` es el espejo exacto), [API_CONTRACTS](../../technical/API_CONTRACTS.md) (`/api/acogida/contactar` y `/api/necesidades/contactar` como referencia de relay), skills `adoptia-database`, `adoptia-backend`, `adoptia-security`, `adoptia-frontend`, `adoptia-testing`.
- Referencias de código: migración `20260711230000_feature016_acogida.sql` (tabla + redondeo + RPC con doble guarda), `src/app/api/acogida/contactar/route.ts` (relay + rate limit), `src/app/api/cron/avisos/route.ts` (caducidad), `MapPinPicker` y `AcogidaForm` (alta con pin), `/panel/necesidades` (página de panel con sidebar).

### Seguridad

- RLS deny-by-default: solo el dueño (o admin) ve/edita/borra sus ofertas; **ninguna lectura pública**. Protectoras solo vía RPC `donation_offers_nearby` (SECURITY DEFINER, doble guarda: caller dueño de la protectora indicada + protectora `verified` + oferta dentro del radio DEL DONANTE).
- Privacidad: `location` redondeada ~200 m por el trigger existente `round_lost_found_location` — la coordenada exacta nunca existe en BD. El RPC no devuelve coordenadas ni email, solo `city` + distancia.
- Contacto relay puro: el email va AL DONANTE con los datos de la protectora; el contacto del donante jamás se devuelve al llamante (se resuelve server-side con `service_role`). Mensaje escapado antes del HTML. Rate limit 10/min por protectora (patrón acogida).
- Anti-abuso: tope de **5 ofertas abiertas** por usuario (trigger en BD, patrón `saved_searches_limit`). Trigger que fuerza `renovada_at = now()` en insert/update (nadie puede fecharse en el futuro para esquivar la caducidad).

### Modelo de datos

Migración `feature032_donation_offers`:

- Tabla `donation_offers`: `id` uuid pk, `user_id → profiles on delete cascade` (borrar cuenta = borrado real), `categoria` check `comida/accesorios/mantas_ropa/juguetes/otros`, `descripcion` 1..1000, `city`, `location geography(point)` + gist + trigger de redondeo, `radius_km` default 25 check 1..200, `status` check `abierta/entregada/caducada` default `abierta`, `renovada_at` (base de la caducidad; trigger la fuerza a `now()`), `created_at/updated_at`.
- RLS: `owner_all` (dueño o admin); grants a `authenticated` + `service_role`. Sin policy de lectura pública.
- RPC `donation_offers_nearby(p_shelter_id)`: devuelve `id, full_name, categoria, descripcion, city, distance_km, radius_km, renovada_at, created_at` de ofertas `abiertas` no caducadas (`renovada_at >= now() - 60 días`, doble red por si el cron va tarde) dentro del radio del donante respecto a la protectora; orden por distancia. `revoke` a public/anon, `grant` a authenticated/service_role.
- Trigger tope 5 abiertas por usuario.

### API

- **POST `/api/donaciones/contactar`** `{ offer_id, mensaje (10..1000) }` — auth: dueño de protectora **verificada**; la oferta debe salir en `donation_offers_nearby` para su protectora (si no: 404). Email al donante con nombre/email/teléfono de la protectora y el mensaje escapado. Relay puro sin persistencia. Errores: 401/403/404/409 `no_email`/422/429/502. Documentar en API_CONTRACTS.
- **Cron**: extender `GET /api/cron/avisos` — además de archivar perdidos, marca `caducada` toda oferta `abierta` con `renovada_at < now() - 60 días` (idempotente; ya corre a diario vía `alertas.yml`).
- CRUD de ofertas sin endpoints: supabase-js directo amparado por RLS (patrón necesidades). «Renovar» = update de `renovada_at` (el trigger la fija a `now()`) + `status` a `abierta` si estaba `caducada`.

### Frontend

- **`/mi-cuenta/donaciones`** (área adoptante): lista de mis ofertas con estado (`abierta/entregada/caducada`), alta y edición con `DonacionForm` (categoría, descripción, ciudad + `MapPinPicker`, radio), acciones «Entregada», «Renovar» (si caducada), «Borrar» (real, con confirmación). Entrada «Donaciones» en la navegación de Mi cuenta y menú del avatar (espejo de «Acogidas», IMPROVEMENT-025).
- **`/panel/donaciones`** (protectora verificada): tablón con las ofertas de la zona vía RPC — tarjeta con categoría, descripción, ciudad, distancia y antigüedad + botón «Contactar» (dialog con mensaje). Entrada en el sidebar del panel (espejo de «Necesidades»). Protectora sin verificar: aviso, sin tablón.
- Textos en `messages/es.json` (namespace `donaciones`), plantilla de email propia `plantillaContactoDonacion`.

### Tareas TDD

1. Test RLS `donation_offers`: dueño CRUD completo; tercero/anon nada; tope de 5 abiertas; redondeo de `location` aplicado; `renovada_at` forzada a now.
2. Test RLS/RPC `donation_offers_nearby`: protectora verificada dentro de radio ve; fuera de radio no; no verificada no; caller que no es dueño de la protectora no; entregadas/caducadas fuera; sin coordenadas ni user_id en la respuesta.
3. Test + implementación schema Zod `contactoDonacionSchema` compartido.
4. Test + implementación `POST /api/donaciones/contactar` (401/403/404/409/422/429/502/200 con email).
5. Test + implementación extensión del cron `avisos` (caduca >60 d; no toca entregadas ni frescas).
6. Test + implementación `plantillaContactoDonacion` (escapado del mensaje).
7. Test + implementación `DonacionForm` + página `/mi-cuenta/donaciones` (alta, editar, entregada, renovar, borrar) + nav.
8. Test + implementación `/panel/donaciones` + `ContactarDonanteDialog` (verificada ve tablón, sin verificar aviso) + sidebar.
9. Migración local (`supabase db push` local) + suite completa + lint + tsc.

### Dependencias

- Ninguna pendiente: FEATURE-016 (patrón foster) y FEATURE-031 (patrón panel/relay) están `hecho`.

## Criterios de aceptación / Casuística a cubrir

- [ ] Alta de oferta con cuenta: categoría, descripción, zona con pin redondeado (~200 m) y radio; sin exponer dirección exacta jamás.
- [ ] Solo protectoras verificadas de la zona ven la oferta (RPC con radio; probado permitido/denegado como en acogidas).
- [ ] Contacto: email al donante con datos de la protectora, nunca al revés; rate-limit por protectora.
- [ ] Donante puede editar, marcar `entregada` o borrar su oferta (borrado real).
- [ ] Caducidad automática pasado el plazo (definir en plan técnico) con posibilidad de renovar.
- [ ] RLS probada: dueño gestiona lo suyo; protectoras solo leen vía RPC; terceros nada.
