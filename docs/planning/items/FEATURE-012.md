---
id: FEATURE-012
tipo: feature
titulo: Animales perdidos y encontrados
estado: listo
prioridad: media
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
---

# FEATURE-012 — Animales perdidos y encontrados

## Descripción

Sección donde particulares y protectoras publican avisos de animales perdidos o encontrados con foto y ubicación, sobre el mismo mapa de la plataforma. Los avisos se marcan como resueltos. (Ref: U12)

## Contexto / impacto

Amplía la plataforma a todo el ecosistema de protección animal y atrae tráfico recurrente de la zona (quien busca a su perro hoy es adoptante mañana).

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`lost_found_posts`), skill `adoptia-frontend` (mapa)

### Seguridad

- Publicar exige cuenta; moderación aplicable (FEATURE-011). Ubicación aproximada (redondeo ~200 m) para no exponer domicilios.
- Caducidad automática: avisos >60 días sin actividad se archivan.

### Modelo de datos

- Activar `lost_found_posts` (migración fase 3) con `location geography` y `status open/resolved`.

### API

- CRUD vía supabase-js + RLS; cron de caducidad.

### Frontend

- Mapa con capa propia (iconos distintos perdido/encontrado), formulario de aviso con foto y pin, listado por cercanía, botón "resuelto" con mini-historia opcional.

### Tareas TDD

1. Test RLS: solo el autor edita/resuelve su aviso.
2. Test redondeo de ubicación en lecturas públicas.
3. Test cron caducidad.
4. E2E: publicar perdido → aparece en mapa → resolver.

### Dependencias

- FEATURE-006 (mapa), FEATURE-011 (moderación).

## Criterios de aceptación / Casuística a cubrir

- [ ] Aviso con foto, especie, descripción y zona en <2 min desde el móvil.
- [ ] Filtro perdido/encontrado en el mapa; distinción visual clara.
- [ ] Resuelto desaparece del mapa; historia visible si el autor la comparte.
- [ ] La ubicación exacta nunca se expone públicamente.
