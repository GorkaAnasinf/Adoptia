---
id: FEATURE-019
tipo: feature
titulo: Directorio público de protectoras (/protectoras)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-13
actualizado: 2026-07-13
---

# FEATURE-019 — Directorio público de protectoras (`/protectoras`)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

La cabecera pública enlaza a `/protectoras` ("Protectoras"), pero esa página no existe: solo hay ficha de detalle (`/protectoras/[slug]`), así que cualquier visitante que pulse el enlace aterriza en el 404 ("Esta página se ha escapado"). Se necesita un directorio público que liste las protectoras verificadas con su nombre, logo, ciudad/provincia y acceso a su perfil.

## Contexto / impacto

- **Afecta a:** cualquier visitante (adoptantes sobre todo) — el enlace roto está en la navegación principal de todas las páginas públicas.
- **Impacto:** enlace muerto en producción desde la creación del Header; mala imagen y pérdida de una vía natural de descubrimiento de protectoras (hoy solo se llega a una ficha desde la ficha de un animal o el mapa).
- **Si no se hace:** el 404 sigue visible en producción; alternativa mínima sería quitar el enlace del Header, pero se pierde la funcionalidad.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- `docs/technical/DATA_MODEL.md` — tabla `shelters` (RLS: pública solo `status='verified'`).
- Skills: `adoptia-frontend` (App Router, tokens, cards), `adoptia-testing` (Vitest + Testing Library).
- Referencias de patrón en código: `src/app/(public)/animales/page.tsx` (listado público) y `src/app/(public)/protectoras/[slug]/page.tsx` (carga de shelter + campos públicos).

### Seguridad

- **Sin superficie nueva:** página pública de solo lectura con el cliente anon; la RLS existente de `shelters` ya limita a `status='verified'`. Filtrar además `.eq("status", "verified")` en la query por claridad (mismo patrón que `sitemap.ts`).
- No exponer campos privados: solo `name, slug, logo_url, city, province, description` (subset de los ya públicos en la ficha).
- Sin formularios ni mutaciones → sin validación de entrada ni anti-spam.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios (Server Component consulta Supabase directamente, como el resto de páginas públicas).

### Frontend

- **Nueva página:** `src/app/(public)/protectoras/page.tsx` — Server Component:
  - Query: `shelters` verificadas ordenadas por `name`, con conteo de animales disponibles publicados por protectora (`animals` con `published_at not null` y `status='available'`).
  - Grid de cards (patrón shadcn del listado de animales): logo (`next/image`, fallback icono huella), nombre, ciudad/provincia, extracto de descripción, badge "N animales en adopción", enlace a `/protectoras/[slug]`.
  - Estado vacío ilustrado si no hay protectoras verificadas.
  - `generateMetadata` con título/descripción SEO.
- **Nuevo componente:** `src/components/shelters/ShelterDirectory.tsx` (presentacional, testeable) + textos en `messages/es.json` (`shelters.directory.*`) — nunca hardcodeados.
- **Sitemap:** añadir `/protectoras` a las rutas estáticas de `src/app/sitemap.ts` (changeFrequency `daily`, priority `0.7`).
- Sin mapa en esta página (ya existe `/mapa`); enlace secundario "Ver en el mapa".

### Tareas TDD

1. Test de `ShelterDirectory`: renderiza cards con nombre, ubicación, badge de conteo y enlace correcto a `/protectoras/[slug]` → implementación del componente.
2. Test de `ShelterDirectory`: estado vacío (sin protectoras) muestra mensaje i18n y CTA a `/animales` → implementación.
3. Test de `ShelterDirectory`: protectora sin logo muestra fallback y sin descripción no rompe el layout → implementación.
4. Test de la página (query builder o helper `src/lib/shelters-directory.ts`): filtra `status='verified'`, ordena por nombre y calcula el conteo de disponibles → implementación de la página/helper.
5. Test de `sitemap.ts`: incluye `/protectoras` en las estáticas → actualización del sitemap.
6. Verificación manual: `npm run dev` → Header "Protectoras" navega al directorio sin 404 y cada card abre su ficha.

### Dependencias

- Ninguna (FEATURE-002 protectoras y FEATURE-008 SEO ya `hecho`).

## Criterios de aceptación / Casuística a cubrir

- [ ] `/protectoras` responde 200 y lista SOLO protectoras `status='verified'` (pendientes/suspendidas nunca aparecen, ni manipulando la query — lo garantiza RLS).
- [ ] Cada card muestra nombre, ciudad/provincia, logo (o fallback) y enlaza a `/protectoras/[slug]`.
- [ ] Badge con el número de animales disponibles publicados; `0` se muestra sin romper ("Sin animales publicados" o badge a 0).
- [ ] Estado vacío: sin protectoras verificadas, mensaje amable + CTA (sin error ni página en blanco).
- [ ] Todos los textos desde `messages/es.json`; ninguno hardcodeado.
- [ ] Imágenes con `next/image`; sin CLS visible en el grid.
- [ ] `/protectoras` presente en el sitemap; metadata SEO (título + descripción) definida.
- [ ] Responsive: grid 1 col móvil / 2-3 col escritorio; enlace del Header visible y funcional.
- [ ] Sin datos personales del gestor (email/teléfono privados no se muestran) — RGPD sin impacto nuevo.
- [ ] `npm run lint`, `npx tsc --noEmit` y suite de tests con cobertura ≥70 en verde.
