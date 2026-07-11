---
id: FEATURE-016
tipo: feature
titulo: Registro de casas de acogida
estado: hecho
prioridad: baja
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
---

# FEATURE-016 — Registro de casas de acogida

## Descripción

Personas dispuestas a acoger temporalmente se registran indicando su zona y condiciones (tipo de vivienda, especies, disponibilidad). Cada protectora ve los acogedores interesados de su zona y puede contactarlos. (Ref: P11)

## Contexto / impacto

Las casas de acogida son una necesidad constante de las protectoras (cachorros, postoperatorios, saturación). Hoy se buscan a gritos en redes.

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md), FEATURE-006 (patrones de proximidad), skill `adoptia-database`

### Seguridad

- Datos del acogedor visibles SOLO para protectoras verificadas de su zona (RLS con distancia); contacto inicial vía plataforma, no email expuesto.
- Consentimiento explícito del acogedor para ser contactado.

### Modelo de datos

- Nueva `foster_homes`: user_id, location (redondeada en lecturas), radius_km, condiciones jsonb, active.

### API

- RPC `foster_homes_nearby(shelter_id)`; handler de primer contacto con notificación.

### Frontend

- Formulario "Quiero acoger" (público, requiere cuenta); lista de acogedores en panel de protectora con filtros.

### Tareas TDD

1. Test RLS: solo protectoras verificadas ven acogedores, y solo de su radio.
2. Test contacto: acogedor recibe notificación con datos de la protectora, no al revés.
3. Test baja del acogedor: desaparece de todas las listas.

### Dependencias

- FEATURE-006, FEATURE-011.

## Criterios de aceptación / Casuística a cubrir

- [x] Alta de acogedor en <2 min con consentimiento explícito (una pantalla en `/acogida`: especies, vivienda, jardín, notas, ciudad, pin y radio; checkbox de consentimiento obligatorio con `consent_at` en BD).
- [x] La protectora ve zona aproximada y condiciones, nunca dirección exacta (redondeo ~200 m al guardar —la exacta no existe—, y el RPC no devuelve coordenadas ni email; probado).
- [x] Acogedor puede pausarse (vacaciones) y darse de baja con supresión real de datos (delete, no soft-delete; probado que desaparece de las listas en ambos casos).

## Cierre (2026-07-11)

- **BD**: `foster_homes` (pk = user, condiciones jsonb, radio 1–200 km, `consent_at` obligatorio) con redondeo de privacidad reutilizado de FEATURE-012. RLS: solo el dueño toca su fila; las protectoras acceden únicamente por el RPC `foster_homes_nearby`, que exige llamante dueño de la protectora indicada Y protectora verificada, y solo devuelve acogedores activos dentro de SU propio radio (probado: protectora lejana 0, pendiente 0, ajena 0).
- **Contacto vía plataforma**: `POST /api/acogida/contactar` — el email va AL ACOGEDOR con los datos de la protectora, nunca al revés (probado); revalida el alcance contra el RPC y rate-limita por protectora.
- **UI**: `/acogida` pública (alta/gestión con pausa y baja) enlazada en el footer y el sitemap; `/panel/acogida` para la protectora (chips de condiciones, distancia, "Proponer acogida") con estado para no verificadas; entrada "Acogidas" en el nav del panel.
- **Tests**: 6 RLS + 4 de la API de contacto. Suite: 658.
