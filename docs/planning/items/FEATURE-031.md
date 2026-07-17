---
id: FEATURE-031
tipo: feature
titulo: Tablón de necesidades de protectoras (pedir ayuda material)
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-031 — Tablón de necesidades de protectoras

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Las protectoras piden ayuda material constantemente (comida, mantas/ropa, medicinas, transporte…) y hoy lo hacen a gritos en redes. Se pide:

1. La protectora publica necesidades: categoría (comida, mantas/ropa, medicinas, transporte, otros), descripción, urgencia y estado (`abierta` / `cubierta`).
2. Las necesidades se ven en su perfil público y en un tablón general filtrable por zona (reutiliza la búsqueda por proximidad existente).
3. Un usuario pulsa «Puedo ayudar» → contacto vía plataforma (patrón del contacto de acogida: sin exponer emails).
4. Solo protectoras verificadas publican (anti-spam).

## Contexto / impacto

Canaliza la voluntad de ayudar de gente que no puede adoptar ni acoger pero sí donar; da a las protectoras un canal propio y ordenado en vez de depender del alcance de sus redes. Refuerza el valor de la plataforma para ambos lados.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_(pendiente de promover — lo completa Snoopy)_

## Criterios de aceptación / Casuística a cubrir

- [ ] Protectora verificada crea/edita/cierra necesidades; no verificada, no.
- [ ] Necesidades `abiertas` visibles en el perfil público de la protectora y en el tablón general con filtro por zona/categoría/urgencia.
- [ ] «Puedo ayudar» exige cuenta y contacta vía plataforma sin exponer el email del usuario; rate-limit anti-spam.
- [ ] Necesidad `cubierta` desaparece del tablón pero queda en el historial de la protectora.
- [ ] Estados vacíos (protectora sin necesidades, tablón sin resultados en la zona) cuidados.
- [ ] RLS probada: escritura solo dueño de la protectora; lectura pública solo de `abiertas` de protectoras verificadas.
