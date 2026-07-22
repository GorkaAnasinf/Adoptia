---
id: FEATURE-048
tipo: feature
titulo: "Mis animales" de la protectora a rejilla de tarjetas con búsqueda y acciones
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

> **Cierre (2026-07-22):** hecho en `feature/FEATURE-048-mis-animales-rejilla`.
> `/panel/animales` deja de ser una tabla y pasa a **rejilla de tarjetas** (basada en
> el pantallazo del usuario + las pantallas ya creadas). Cada tarjeta: foto con
> `AnimalStatusBadge` legible superpuesto (variante `onImage`), chip «Borrador» si no
> está publicada, nombre + sexo (♂/♀) + `raza · edad`, y acciones **Editar** / **Ver
> ficha** (solo si publicada) + menú **⋮** con **Publicar** / **Despublicar** /
> **Eliminar** (con confirmación). **Búsqueda** por nombre/raza y **filtros de estado**
> instantáneos en cliente. Nueva API `/api/animales/[id]` (`PATCH publish|unpublish`,
> `DELETE`) bajo la sesión del usuario: RLS `animals_owner_write` garantiza la propiedad
> y publicar exige protectora **verificada** + ficha válida (`validarPublicacion`, 422 si
> no). Se descartan del pantallazo el chip «Urgentes» y el badge «Caso urgente» (no hay
> campo de urgencia en `animals`). Sin cambios de esquema. QA: suite 1063 verde,
> typecheck y lint limpios; revisión de rama completa sin incidencias bloqueantes
> (todo Minor). **Pendiente:** despliegue. **Follow-ups (deuda menor):** accesibilidad
> de teclado del menú ⋮ (Esc/flechas/foco) y enlace a editar en el mensaje 422.

# FEATURE-048 — "Mis animales" a rejilla con búsqueda, filtros y acciones

## Descripción

Rediseñar la lista de animales de la protectora (`/panel/animales`) según el pantallazo
aportado (sin wireframe), reutilizando las pantallas ya creadas: tabla → rejilla de
tarjetas con búsqueda, filtros de estado y acciones por tarjeta.

## Contexto / impacto

Afecta a la protectora. La tabla era funcional pero fría; la rejilla con foto y estado
legible es coherente con el resto del panel y da acceso directo a las acciones
(publicar/despublicar/eliminar) sin entrar a editar.

## Plan de desarrollo

### Seguridad / Modelo / API

- **Nueva API `/api/animales/[id]`** (Route Handler, patrón de `/api/solicitudes/[id]`),
  cliente con sesión → RLS `animals_owner_write` restringe a los animales de la
  protectora. `PATCH {accion:"publish"|"unpublish"}`: unpublish → `published_at=null`;
  publish → exige `shelters.status==="verified"` (403) + `validarPublicacion` (422) y
  pone `published_at=now()`. `DELETE` → borra (cascada de `animal_media`). **Sin cambios
  de esquema.**

### Frontend

- **`AnimalesGrid`** (client): búsqueda por nombre/raza (sin acentos, insensible) +
  chips de estado (Todos + `ESTADOS`), rejilla de tarjetas + tarjeta «Nueva mascota».
  Tarjeta con `AnimalStatusBadge onImage`, «Borrador», sexo, `raza·edad`, Editar / Ver
  ficha / menú ⋮ (publicar/despublicar/eliminar con confirmación) → API + `router.refresh()`.
- **`page.tsx`**: carga todos los animales (+`sex,breed,birth_date_approx`), monta la
  rejilla, mantiene avisos de moderación y estado vacío. Deja de filtrar por `?estado=`.

### Descartado del pantallazo

- Chip «Urgentes» y badge «Caso urgente»: no existe campo de urgencia en `animals`.

### Tareas TDD

1. API `/api/animales/[id]` (publish verificada/incompleta/válida, unpublish, delete, 400/401/404).
2. `AnimalesGrid` (búsqueda, filtros, borrador sin «Ver ficha», publicado con enlace,
   eliminar con confirmación → DELETE, «Nueva mascota»).
3. Conexión de `page.tsx` a la rejilla.

## Criterios de aceptación / Casuística a cubrir

- [x] Rejilla de tarjetas con foto, estado legible, sexo, `raza·edad` y «Nueva mascota».
- [x] Búsqueda por nombre/raza y filtros de estado instantáneos.
- [x] «Ver ficha» solo si publicado; «Editar» siempre.
- [x] Menú ⋮: publicar (verificada + ficha válida), despublicar, eliminar (confirmación).
- [x] Acciones bajo RLS; publicar bloqueado si no verificada o ficha incompleta.
- [x] Sin cambios de esquema. Avisos de moderación y estado vacío intactos.
