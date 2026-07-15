---
id: FEATURE-023
tipo: feature
titulo: Avisos de perdidos — ficha identificativa completa, galería y filtros
estado: recibido
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-15
actualizado: 2026-07-15
---

# FEATURE-023 — Avisos de perdidos: ficha identificativa completa, galería y filtros

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

El aviso de perdido/encontrado se publica hoy con muy poca información: especie, nombre, descripción libre, una sola foto y ciudad. Para reconocer a un animal por la calle eso no basta, y para buscar entre avisos tampoco. Falta:

- **Datos identificativos estructurados**: raza, sexo, tamaño, color/señas particulares, si lleva collar y de qué tipo, si tiene microchip (**solo sí/no/no lo sé — el número nunca**, porque identifica al dueño en el registro autonómico).
- **Fecha real de la pérdida o del hallazgo** (`lost_at`): hoy solo existe `created_at`, que es cuándo se publicó, no cuándo ocurrió. Alguien publica tres días tarde y el aviso miente.
- **Varias fotos** por aviso (de frente, de perfil, la mancha del lomo), como ya tienen las fichas de animales con `animal_media`.
- **Filtros** en el mapa/listado por especie, tamaño y fecha. Hoy solo hay perdido/encontrado.

## Contexto / impacto

Un aviso con "perro marrón" no lo reconoce nadie. Los datos estructurados son además la base de un futuro cruce automático perdido↔encontrado (fuera de alcance aquí, pero imposible sin ellos). Se planifica **después de FEATURE-022**: primero que el aviso sirva para algo (contacto y pistas), luego que describa mejor.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

_Pendiente de planificar (Snoopy) cuando FEATURE-022 esté cerrada._

Notas de partida:

- Reusar el patrón `animal_media` (`is_cover`, `sort_order`) para la galería en vez de inventar otro.
- `lost_at` con check `<= now()`; migrar los avisos existentes copiando `created_at`.
- Los filtros nuevos probablemente pidan mover el listado a un RPC con parámetros, como hizo IMPROVEMENT-021 con `animals_search` (`p_query`), en vez de seguir filtrando en cliente.
- Microchip: booleano/enum. El número, fuera. No negociable.

### Dependencias

- FEATURE-022.

## Criterios de aceptación / Casuística a cubrir

- [ ] Pendiente de planificar.
