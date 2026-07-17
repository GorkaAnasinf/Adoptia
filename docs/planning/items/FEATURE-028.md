---
id: FEATURE-028
tipo: feature
titulo: Rediseño del perfil público de protectora (mockup nuevo)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-17
actualizado: 2026-07-17
---

# FEATURE-028 — Rediseño del perfil público de protectora

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

La vista pública `/protectoras/[slug]` es muy básica. Rediseñarla según el mockup aportado por el usuario:

- **Hero** con foto de portada, avatar (logo), nombre, badge «Verificada», ciudad y botones **Contactar** y **Donar**.
- **Franja de métricas**: adopciones, animales en adopción, años de labor.
- **Dos columnas**: «Sobre nosotros» (descripción + chips de servicios) y «Horario y ubicación» (horario semanal + mini-mapa + dirección).
- **Animales en adopción** con contador, buscador por nombre, filtros de especie y edad, y tarjetas con foto, raza, edad, corazón de favorito y «Ver perfil».

Decisiones del usuario (2026-07-17): portada = campo nuevo `cover_url` con uploader en el editor; métricas = las 3, con campo nuevo `founded_year`; Contactar = revelar email público (mailto).

## Contexto / impacto

Los adoptantes evalúan la credibilidad de una protectora en esta página antes de contactar; hoy no transmite confianza ni invita a la acción. Afecta a adoptantes (conversión) y protectoras (escaparate). Es la continuación natural del rediseño por tandas (FEATURE-025/026/027).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- `docs/technical/DESIGN.md` (tokens) y `docs/technical/DATA_MODEL.md` (shelters).
- Skills: `adoptia-frontend`, `adoptia-database`, `adoptia-security`, `adoptia-testing`.
- Reutilizables: `AnimalCard` (foto+raza+edad+FavoritoOverlay), `MiniMapa` (mapa lectura, Decisión #8), `parsePoint` (`src/lib/shelter-mapping.ts`), `edadAproximada` (`src/lib/animal-search.ts`), `EnlaceExternoPago`, `LogoUploader` (patrón de subida), `src/lib/image.ts` (compresión ≤300 KB), bucket `shelter-media` (público, políticas por carpeta ya existentes).

### Seguridad

- **RPC `shelter_public_stats`** `security definer`: expone solo agregados (conteos), nunca filas de animales despublicados. Guard: devuelve datos solo si la protectora está `verified` (o es el owner/admin). Tests de RLS: anónimo obtiene conteos de verified, nada útil de pending/rejected.
- `cover_url` y `founded_year`: columnas nuevas cubiertas por las políticas de fila existentes de `shelters` (sin RLS nueva). Validación Zod: `founded_year` entero 1900–año actual; `cover_url` URL del bucket propio.
- Email en vista pública: ya era legible por RLS (fila completa); ahora se muestra. La protectora lo dio como contacto público (onboarding). Sin superficie nueva.
- Subida de portada: misma política por carpeta del bucket `shelter-media` (owner escribe en su carpeta); compresión cliente ≤300 KB (regla 7).

### Modelo de datos

Migración `20260717_feature028_perfil_publico.sql`:

- `alter table public.shelters add column cover_url text, add column founded_year smallint` + `check (founded_year is null or founded_year between 1900 and 2100)`.
- Función `public.shelter_public_stats(p_shelter_id uuid) returns table (adopciones int, disponibles int)` — `security definer`, `set search_path`; cuenta `animals` con `status='adopted'` (todos) y `status='available' and published_at is not null`; solo para shelters `verified` (si no, fila de ceros/null). «Años de labor» se calcula en cliente desde `founded_year`.

### API

- Sin endpoints nuevos. El perfil (`PATCH` existente del editor) acepta `cover_url` y `founded_year` vía `shelter-mapping` + schema Zod.
- La página server llama a `supabase.rpc("shelter_public_stats", …)` y amplía el select con `email, cover_url, founded_year, address, location`.
- Actualizar `API_CONTRACTS.md` con el RPC.

### Frontend

- **`ShelterPublicProfile.tsx`** (rediseño): hero con `cover_url` (fallback degradado de marca), avatar circular, nombre, badge verificada, ciudad; CTAs Contactar (`mailto:`) y Donar (`EnlaceExternoPago`). Franja de métricas (se oculta cada tile sin dato; la franja entera si no hay ninguno). Dos columnas: sobre nosotros + chips de servicios (voluntariado, acogida, web) | horario + `MiniMapa` con `parsePoint(location)` + dirección. Instalaciones se mantiene. Grid de animales con `AnimalCard`.
- **`ShelterAnimalsGrid.tsx`** (nuevo, client): contador, buscador por nombre y filtros especie/edad **client-side** sobre los animales ya cargados (sin paginación: volumen pequeño por protectora).
- **`PerfilEditor.tsx`**: uploader de portada (patrón `LogoUploader` + `src/lib/image.ts`, bucket `shelter-media`) y campo «Año de fundación».
- Textos nuevos en `messages/es.json` (`shelterPublic.*`, editor). Imágenes con `next/image`.

### Tareas TDD

1. Test RLS del RPC `shelter_public_stats` (verified → conteos; pending → sin datos; adoptados despublicados cuentan) → migración.
2. Test schema Zod shelter (`founded_year` límites, `cover_url`) + `shelter-mapping` ida/vuelta → implementación.
3. Test `CoverUploader` (sube comprimido a carpeta propia, pinta preview, error de tamaño) → implementación.
4. Test `PerfilEditor` con campos nuevos (render, guardado incluye `cover_url`/`founded_year`) → implementación.
5. Test hero (portada/fallback, badge solo verified, mailto solo con email, Donar solo con enlace) → implementación.
6. Test métricas (3 tiles, tile oculto sin dato, franja oculta sin ninguno, años = año actual − founded_year) → implementación.
7. Test columna horario/ubicación (MiniMapa solo con location, dirección, horario existente) → implementación.
8. Test `ShelterAnimalsGrid` (buscador por nombre, filtro especie, filtro edad, contador, vacío con filtros) → implementación.
9. Test página server (select ampliado, rpc llamado, props correctas) → ajuste de `page.tsx`.
10. `messages/es.json` + lint i18n; suite completa + `tsc` al final.

### Dependencias

- Ninguna (FEATURE-004, 010, 019 ya `hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Hero muestra portada si existe; degradado de marca si no. Avatar con fallback de icono.
- [x] Badge «Verificada» solo con `status = verified`.
- [x] «Contactar» abre `mailto:` del email; el botón no aparece sin email. «Donar» solo con `donation_link` y mantiene el aviso de pago externo.
- [x] Métricas: cada tile se oculta sin dato; sin ninguno, la franja no se pinta. Años de labor = año actual − `founded_year` (0 no se muestra como «0 años»).
- [x] RPC: anónimo obtiene conteos de una protectora verified; de una pending/rejected no obtiene datos. Los adoptados despublicados cuentan como adopciones sin filtrarse como filas.
- [x] Horario semanal como hoy; mini-mapa solo si hay `location`; dirección textual si existe.
- [x] Grid: buscador por nombre (case/acentos-insensible), filtros especie y edad combinables, contador refleja el filtrado, estado vacío con filtros activos y estado «sin animales».
- [x] Tarjetas con foto, raza, edad y corazón de favorito (comportamiento actual de `AnimalCard`, incl. no autenticado). *Desviación menor aceptada: el fallback sin foto es el «Sin foto» estándar de `AnimalCard`, no una huella (ver IMPROVEMENT-024).*
- [x] Editor: subir/quitar portada (comprimida ≤300 KB, a carpeta propia del bucket), año de fundación validado (1900–actual); errores de validación visibles.
- [x] Apadrinables siguen destacados primero en el orden por defecto.
- [x] Sin textos hardcodeados (todo en `messages/es.json`); móvil primero (hero y métricas apilan).
- [x] Suite completa verde (974/974, RLS incluidos), cobertura 82,0 % global / 96,7 % `src/lib`, `tsc --noEmit` limpio.

## Cierre (2026-07-17)

- QA Scooby: ✅ APROBADO 13/13. Notas menores trasladadas a IMPROVEMENT-024.
- **Pendiente de despliegue:** migración `20260717090000_feature028_perfil_publico.sql` aplicada solo en local — falta `supabase db push` a producción antes de liberar.
