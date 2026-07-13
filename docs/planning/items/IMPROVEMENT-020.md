---
id: IMPROVEMENT-020
tipo: improvement
titulo: Rediseño de la ficha pública de animal
estado: desarrollo
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-13
actualizado: 2026-07-13
---

# IMPROVEMENT-020 — Rediseño de la ficha pública de animal

## Descripción

Rediseñar `AnimalPublicProfile` para acercarla al mockup nuevo, en la misma línea
que los rediseños recientes de listado (IMPROVEMENT-019), home (018) y dashboard
(017). Objetivo: ficha más cálida y orientada a la conversión, con una **columna
de acción sticky** a la derecha y una columna de contenido más legible a la
izquierda.

## Cambios de UI (vs. actual)

**Columna izquierda (contenido):**
- Galería (sin cambios).
- Línea de estado: `AnimalStatusBadge` + «Publicado hace N días» (fecha relativa).
- Nombre (h1) sin la línea de ubicación (la ubicación pasa a la card de refugio).
- **Rasgos inline con iconos** (edad · sexo · tamaño (peso) · raza) en vez de pills bordeadas.
- **Compatibilidad como pills con icono y color**: verde (sí) / rojo (no) /
  neutro (desconocido). Sustituye la lista `dl` `FilaTri`.
- **Salud con checks verdes** en círculo para vacunado/esterilizado/microchip +
  notas de salud y necesidades especiales.
- Historia (sin cambios de fondo).
- **Card de refugio** con logo, ubicación y mini-mapa (reubicada dentro de la columna).
- Pie: enlace a guías + reportar (sin cambios).

**Columna derecha (sticky, desktop):**
- **Card «¿Te has enamorado?»**: título + texto, CTA **«Me interesa adoptar»**
  (rojo, ancho), botón **«Guardar para luego»** (outline, ancho, icono marcador),
  y clúster de **avatares genéricos + «N personas interesadas»** (número real).
- **Card verde «Proceso de adopción»**: 4 pasos numerados (contenido estático i18n).

**Móvil:** se conserva la barra sticky inferior (interés + favorito + compartir).

## Datos nuevos

- Contador real de interesados = nº de `adoption_requests` distintos por adoptante
  para el animal, expuesto de forma **agregada y anónima** (no filtra identidades).

## Plan de desarrollo

### 1. BD — RPC agregado (migración)
`supabase/migrations/2026071314XXXX_improvement020_contar_interesados.sql`
- `create function public.contar_interesados(p_animal_id uuid) returns integer`
  `security definer`, `set search_path = public`.
- Devuelve `count(distinct adopter_id)` de `adoption_requests` del animal **solo
  si** el animal está publicado y la protectora es `verified` (mismo blindaje que
  `registrar_visita`); en caso contrario `0`. Nunca expone quién.
- `grant execute ... to anon, authenticated`.
- Test RLS (`src/test/rls/contar-interesados.test.ts`): público obtiene el número;
  animal despublicado → 0; no se filtra ningún dato de los adoptantes.

### 2. Lib — fecha relativa (TDD)
`src/lib/fecha-relativa.ts` + test.
- `fechaRelativa(iso: string): string` → «hoy» / «ayer» / «hace N días» /
  «hace N meses» / «hace N años» con `Intl.RelativeTimeFormat('es')`.

### 3. Carga de datos
`src/app/(public)/animales/[slug]/page.tsx`
- Tras `cargarAnimal`, `supabase.rpc("contar_interesados", { p_animal_id })`
  (best-effort, `catch → 0`) y pasar `interesados` a `AnimalPublicProfile`.

### 4. Botones — variantes anchas
- `InterestButton`: prop opcional `fullWidth` (o `className`) para ocupar el ancho
  de la card; texto CTA nuevo «Me interesa adoptar».
- `FavoritoButton`: prop `variant?: "icon" | "wide"`; `wide` = botón outline ancho
  con icono `Bookmark` + «Guardar para luego». El círculo `icon` se mantiene para
  la barra móvil y la galería.

### 5. Rediseño de `AnimalPublicProfile`
- Nueva prop `interesados: number`.
- Reestructurar el grid: izquierda contenido, derecha stack de dos cards sticky
  (`lg:sticky lg:top-24`).
- Componentes internos: `PillCompat` (icono + color por estado), `CheckSalud`,
  `RasgoInline`, `AvataresInteresados`, `ProcesoAdopcion`.
- Tokens: rojo = `secondary`, verde = `tertiary`, acento nombre = `primary`.

### 6. i18n (`messages/es.json` → `ficha`)
Nuevas claves: `publicadoHace` («Publicado {rel}»), `enamoradoTitle`
(«¿Te has enamorado?»), `enamoradoText`, `interesaCta` («Me interesa adoptar»),
`guardarLuego` («Guardar para luego»), `interesados` (plural: `{n} personas
interesadas` / `1 persona interesada` / `Sé la primera persona en interesarte`),
`procesoTitle` («Proceso de adopción»), `procesoPaso1..4`.

### 7. Tests
- `AnimalPublicProfile.test.tsx` (nuevo o ampliado): render de pills de
  compatibilidad por estado, checks de salud, pasos del proceso, y contador de
  interesados (0, 1, N).
- `fecha-relativa.test.ts`, `contar-interesados.test.ts` (RLS).
- Ajustar `InterestButton`/`FavoritoButton` tests a las variantes.

## Criterios de aceptación

- [ ] La ficha coincide con el mockup: sidebar sticky con card de acción + card de
      proceso; izquierda con rasgos inline, compatibilidad en pills de color y
      salud con checks verdes.
- [ ] «N personas interesadas» muestra el conteo real y anónimo (0/1/N con plural
      correcto).
- [ ] «Publicado hace …» usa fecha relativa en español.
- [ ] La barra sticky móvil sigue funcionando.
- [ ] Sin textos hardcodeados (todo en `messages/es.json`).
- [ ] RLS del RPC probada (público lee agregado; despublicado → 0; sin fuga de identidad).
- [ ] `npm run lint`, `npx tsc --noEmit` y la suite (con `--coverage`) en verde.
