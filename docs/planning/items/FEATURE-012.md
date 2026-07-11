---
id: FEATURE-012
tipo: feature
titulo: Animales perdidos y encontrados
estado: hecho
prioridad: media
hito: "0.4"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
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

- [x] Aviso con foto, especie, descripción y zona en <2 min desde el móvil (form de una pantalla: tipo, especie, nombre opcional, descripción, foto comprimida en cliente, pin en mapa).
- [x] Filtro perdido/encontrado en el mapa; distinción visual clara (marcadores rojo/verde + chips; probado en test de componente).
- [x] Resuelto desaparece del mapa (RPC solo devuelve `open`) e historia visible si el autor la comparte (probado en RLS y E2E).
- [x] La ubicación exacta nunca se expone públicamente: trigger de BD redondea a rejilla de ~0.002° (~200 m) ANTES de guardar — la coordenada exacta no llega a existir (probado).

## Cierre (2026-07-11)

- **BD**: `lost_found_posts` (open/resolved/archived, `last_activity_at`), trigger de redondeo de privacidad, RPC `lost_found_list` (solo abiertos, máx. 500), bucket `lost-found` (lectura pública, subida por carpeta de usuario). RLS: público lee open+resolved; solo el autor edita/resuelve; archived solo autor/admin.
- **Cron**: `/api/cron/avisos` archiva abiertos sin actividad en 60 días; añadido como segundo paso del workflow diario `alertas.yml`.
- **UI**: `/perdidos-encontrados` (mapa Leaflet con círculos rojo/verde + popup, chips de filtro, listado, aviso de privacidad), `/perdidos-encontrados/nuevo` (requiere cuenta), detalle con mini-mapa, badge y "Marcar como resuelto" con historia; enlace "Perdidos" en el header y ruta en el sitemap.
- **Recorte consciente**: listado ordenado por fecha, no por cercanía (el criterio no lo exige; el mapa ya da la lectura espacial). La moderación de avisos reusa la suspensión de cuentas de FEATURE-011 (no hay botón reportar en avisos — item nuevo si se quiere).
- **Tests**: 5 RLS (incluido el redondeo y visibilidad por estado), 2 del cron, 4 de la vista; E2E (aparece en listado → autor resuelve con historia → desaparece de abiertos) en desktop y móvil. Suite: 604 + 2 E2E.
