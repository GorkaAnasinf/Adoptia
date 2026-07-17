---
id: FEATURE-029
tipo: feature
titulo: Propuestas de acogida estructuradas con trazabilidad
estado: listo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-029 — Propuestas de acogida estructuradas con trazabilidad

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Hoy «Proponer acogida» (`/panel/acogida`, FEATURE-016) dispara un email genérico al acogedor y no deja rastro: el aviso no se persiste (solo rate-limit en memoria y estado «Contactado» local del navegador), así que al recargar la protectora puede reenviar avisos infinitos y pierde toda trazabilidad de qué animales dejó en acogida y con quién. Se pide:

1. **Formulario previo al aviso**: al proponer, la protectora indica animal (de los suyos, opcional), duración estimada y mensaje. El email al acogedor incluye esos datos.
2. **Persistencia**: nueva tabla `foster_proposals` (protectora, acogedor, animal opcional, duración, mensaje, estado `enviada` → `aceptada` / `rechazada` / `finalizada`, timestamps). RLS: la protectora ve las suyas; el acogedor, las dirigidas a él.
3. **Fin del reenvío infinito**: con propuesta abierta, `/panel/acogida` muestra el estado («Propuesta enviada el X») en lugar del botón; reenvío bloqueado mientras haya propuesta activa con ese acogedor.
4. **Trazabilidad**: la protectora actualiza el estado desde su panel (aceptada / rechazada / finalizada) y conserva el historial de acogidas propuestas y realizadas.
5. El acogedor ve sus propuestas recibidas en `/acogida`.

Fase futura (item aparte si se decide): aceptar/rechazar por el acogedor dentro de la plataforma y enlace con el estado `fostered` del animal.

## Contexto / impacto

Las protectoras necesitan saber qué animales tienen en acogida, con quién y hasta cuándo; hoy esa información muere en un email genérico sin datos del animal. El reenvío ilimitado además puede quemar a los acogedores (spam) y erosionar la confianza en la plataforma. Afecta a protectoras (trazabilidad, gestión) y acogedores (propuestas claras, sin avisos duplicados).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md), [API_CONTRACTS](../../technical/API_CONTRACTS.md), migración `20260711230000_feature016_acogida.sql` (patrones de `foster_homes` y del RPC).
- Skills `adoptia-database`, `adoptia-security`, `adoptia-backend`, `adoptia-frontend`, `adoptia-testing`.

### Seguridad

- Tabla nueva `foster_proposals` con RLS: la protectora dueña ve y actualiza SOLO sus propuestas; el acogedor ve SOLO las dirigidas a él; terceros nada. El insert va por el handler, que revalida el alcance contra `foster_homes_nearby` (como hoy) y que el animal, si se indica, es de la propia protectora.
- Privacidad intacta: la propuesta nunca expone email/coordenadas del acogedor; el acogedor ve datos públicos de la protectora.
- Zod compartido en `src/lib/schemas/`; rate-limit del handler se mantiene.
- **Decisión (a DECISIONS.md)**: baja del acogedor = supresión real — sus propuestas caen en cascada (coherente con la baja de FEATURE-016). La protectora pierde ese historial; RGPD gana a la trazabilidad.

### Modelo de datos

Migración nueva `feature029_foster_proposals`:

- `foster_proposals`: `id` uuid pk, `shelter_id` fk shelters (cascade), `foster_user_id` fk profiles (cascade), `animal_id` fk animals **nullable** (set null), `duracion` text not null (≤120), `mensaje` text not null (≤1000), `status` check `enviada|aceptada|rechazada|finalizada` default `enviada`, `created_at`/`updated_at` (trigger `set_updated_at`).
- **Índice único parcial** `(shelter_id, foster_user_id) where status in ('enviada','aceptada')` — el bloqueo de reenvío vive en BD, no solo en UI.
- Políticas: select (protectora dueña o acogedor), insert (dueño de protectora verificada, `shelter_id` propio), update solo protectora dueña (cambio de estado), delete solo admin.

### API

- `POST /api/acogida/contactar` **modificado**: body `{ foster_user_id, animal_id?, duracion, mensaje }` (Zod). Valida alcance (RPC) y animal propio; inserta la propuesta (409 `proposal_exists` si el índice único salta) y envía el email ampliado. Actualizar API_CONTRACTS.
- Cambio de estado: sin endpoint — update directo con el cliente del usuario amparado por RLS (patrón `AcogidaForm`).

### Frontend

- `ContactarAcogedorButton` → **`ProponerAcogidaDialog`**: formulario con select de animales publicados de la protectora (opcional), duración y mensaje.
- `/panel/acogida`: acogedor con propuesta activa muestra chip de estado + fecha en vez del botón; historial de propuestas con acciones aceptada/rechazada/finalizada.
- `/acogida` y `/mi-cuenta/acogida`: bloque «Propuestas recibidas» (protectora, animal, duración, mensaje, estado) — componente compartido.
- `plantillaContactoAcogida` ampliada con animal, duración y mensaje; textos nuevos en `es.json`.

### Tareas TDD

1. Test RLS: acogedor solo SUS propuestas, protectora solo las suyas, tercero nada → migración + políticas.
2. Test RLS: protectora actualiza estado de lo suyo; ni las ajenas ni el acogedor pueden update.
3. Test BD: segunda propuesta activa (enviada/aceptada) misma protectora+acogedor falla; tras rechazada/finalizada se permite otra.
4. Test handler: 422 sin duración/mensaje; 404 animal ajeno; 409 propuesta activa; camino feliz crea fila + email con animal/duración/mensaje (mock Resend).
5. Test plantilla de email: incluye animal/duración/mensaje.
6. Test `ProponerAcogidaDialog`: validación y payload correcto.
7. Test `/panel/acogida`: propuesta activa → chip de estado sin botón; historial con cambio de estado.
8. Test bloque «Propuestas recibidas» (compartido por `/acogida` y `/mi-cuenta/acogida`) + estado vacío.
9. Suite completa (con Supabase local para RLS) + lint + `tsc`.

### Dependencias

- FEATURE-016 e IMPROVEMENT-025 (ambas `hecho`).

## Criterios de aceptación / Casuística a cubrir

- [ ] Proponer acogida exige el formulario (duración y mensaje; animal opcional de la propia protectora) y el email al acogedor incluye esos datos.
- [ ] La propuesta queda persistida con estado; con propuesta abierta no se puede reenviar a ese acogedor — bloqueado en UI y en BD (índice único parcial), probado.
- [ ] La protectora consulta y actualiza el estado de sus propuestas (historial incluido); nunca ve datos de contacto del acogedor que hoy no ve.
- [ ] El acogedor ve sus propuestas recibidas en `/acogida` y `/mi-cuenta/acogida`.
- [ ] RLS probada: protectora solo sus propuestas; acogedor solo las suyas; terceros nada; update solo de la protectora dueña.
- [ ] Baja del acogedor: sus propuestas desaparecen en cascada (supresión real, decisión registrada en DECISIONS.md), probado.
- [ ] Estados vacíos cuidados (sin propuestas en panel y en acogedor); animal borrado → propuesta conserva historial con animal nulo.
