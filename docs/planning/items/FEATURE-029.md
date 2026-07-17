---
id: FEATURE-029
tipo: feature
titulo: Propuestas de acogida estructuradas con trazabilidad
estado: recibido
prioridad: media
hito: null
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

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_(pendiente de promover — lo completa Snoopy)_

## Criterios de aceptación / Casuística a cubrir

- [ ] Proponer acogida exige el formulario (duración y mensaje; animal opcional de la propia protectora) y el email al acogedor incluye esos datos.
- [ ] La propuesta queda persistida con estado; con propuesta abierta no se puede reenviar a ese acogedor (UI y servidor).
- [ ] La protectora consulta y actualiza el estado de sus propuestas (historial incluido); nunca ve datos de contacto del acogedor que hoy no ve.
- [ ] El acogedor ve sus propuestas recibidas en `/acogida`.
- [ ] RLS probada: protectora solo sus propuestas; acogedor solo las suyas; terceros nada.
- [ ] Baja del acogedor: sus propuestas no rompen el historial de la protectora (decidir anonimizar vs. cascada en el plan técnico).
