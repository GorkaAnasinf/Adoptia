# Registro de decisiones — Adoptia

Formato ligero tipo ADR. Toda decisión con impacto estructural se registra aquí con fecha y motivo. Las decisiones marcadas 🔒 vienen fijadas por el análisis técnico aprobado (biblia) — no reabrirlas sin causa mayor.

## 2026-07-04 — Inicialización

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 1 🔒 | **Coste 0 €** como restricción rectora | Proyecto sin presupuesto; demo a dirección | Cualquier servicio de pago |
| 2 🔒 | **Next.js 15 + TypeScript en Vercel** | SEO crítico (fichas indexables) exige SSR/ISR; deploy git-push gratis | SPA pura (sin SEO), Render (apaga servicios free tras 15 min) |
| 3 🔒 | **Supabase** (Postgres + Auth + Storage + RLS) | Todo en un servicio free sin expiración; PostGIS disponible | Render Postgres (expira a 30 días), Firebase (NoSQL no encaja) |
| 4 🔒 | **PostGIS** para proximidad | Búsqueda por distancia real (`ST_DWithin`) es feature núcleo | Haversine en JS (no escala, sin índice) |
| 5 🔒 | **RLS como pilar de seguridad** | Políticas en BD, no en código; imposible saltárselas desde cliente | Autorización solo en aplicación |
| 6 🔒 | **Leaflet + OpenStreetMap + Nominatim** | 100% gratis, sin API key ni tarjeta | Google Maps (exige tarjeta) |
| 7 🔒 | **Resend** para email transaccional | Free 100/día suficiente para MVP; DX buena | SendGrid (free más restrictivo) |
| 8 🔒 | **Tailwind + shadcn/ui** | Encaja con salidas de Stitch; tokens de DESIGN.md | MUI/AntD (look corporativo, pesa) |
| 9 | **Sin backend separado** — Route Handlers | Un solo deploy; Render queda como plan B si hiciera falta procesado pesado | NestJS/FastAPI aparte (coste operativo sin necesidad aún) |
| 10 | **Sin Docker en local** | Deploy es Vercel+Supabase; desarrollo contra proyecto cloud + `next dev`. `supabase start` disponible si se quiere BD local | docker-compose propio |
| 11 | **Repo único** (no monorepo) | Una sola app Next.js; `packages/` sería ceremonia vacía | Monorepo |
| 12 | **ES único + i18n preparado (next-intl)** | Mercado inicial España; retrofitting de i18n es caro, se cablea desde el día 1 | Multiidioma real (coste de traducción sin demanda) |
| 13 | **Vitest + Testing Library + Playwright** | Vitest nativo con Vite/Next, rápido; Playwright para E2E críticos | Jest (más lento, config extra) |
| 14 | **Umami / Vercel Analytics** | Sin cookies → banner de cookies mínimo, RGPD-friendly | GA4 (cookies, consentimiento complejo) |
| 15 | **Compresión de imagen en cliente** (≤300 KB) + YouTube para vídeo | Proteger 1 GB de Storage free | Cloudinary (queda como escalado futuro) |
| 16 | **Items como única fuente de verdad** + render determinista | Evita drift entre BACKLOG/ROADMAP; ChatGPT solo toca `items/` | Planificación editada a mano |

## 2026-07-05 — FEATURE-000 (andamiaje)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 17 | **Tests de RLS contra stack local** (`supabase start` + CLI como devDependency, vars `SUPABASE_TEST_*`) | Verificar políticas reales en Postgres sin tocar el proyecto cloud; se saltan si no hay stack (suite unitaria rápida) | Mockear supabase-js (no prueba las políticas de verdad) |
| 18 | **Grants explícitos a `anon/authenticated/service_role` en la migración** | Los default privileges del rol de migración no cubrían las tablas nuevas (`permission denied`); el control de acceso real lo gobierna RLS | Depender de default privileges implícitos |
| 19 | **Rol verificado en middleware + RLS como red final** | Defensa en profundidad barata: middleware redirige por rol (`/panel`→shelter, `/admin`→admin) sin flash de contenido | Solo comprobación en página o solo RLS (UX pobre) |
| 17 | **Manada SDD** (tema perros: Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko) | Elección del propietario; coherente con el dominio | Panteón griego (default) |
| 18 | **Gitflow sin PRs**: `develop` → `main`, ramas `feature/FEATURE-NNN-slug` | Equipo de 1; CI protege calidad | PRs obligatorias (fricción sin revisores) |
| 19 | **Keepalive cron** (GitHub Actions 2×/semana) | Supabase free pausa tras 7 días de inactividad | Aceptar pausas (mala demo) |

## 2026-07-05 — FEATURE-001 (registro y login)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 20 | **Trigger de alta con whitelist de rol** (solo adopter/shelter; el resto cae a adopter) | El signup deja pasar metadata arbitraria; sin whitelist, un signup directo a la API con `role:admin` escala privilegios | Confiar en que el formulario solo envía roles válidos |
| 21 | **CAPTCHA Cloudflare Turnstile** en auth | Free, ligero y con integración nativa en Supabase; complementa los rate limits contra bots | hCaptcha (peor DX), solo rate limits (no frena bots que rotan IP) |
| 22 | **SMTP de Gmail + plantillas HTML propias** para el MVP | Coste 0 y control total del diseño de los correos; suficiente para el volumen inicial (~500/día) | SMTP por defecto de Supabase (2/h, remitente genérico), Resend (requiere dominio verificado) |
| 23 | **Política de contraseña fuerte** (mayús+minús+dígito+símbolo) alineada cliente y servidor | El servidor (Supabase) la exige; el cliente debe reflejarla para no rebotar al usuario | Solo validación en servidor (mala UX) |

## 2026-07-09 — FEATURE-004 / pulido del alta (IMPROVEMENT-007..011)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 24 | **Photon (photon.komoot.io) para autocompletar direcciones** (complementa a Nominatim de #6; llamado desde el servidor con caché) | Nominatim no está pensado para autocompletar (1 req/s, sin tipo *search-as-you-type*); Photon es gratis, sin clave y devuelve sugerencias al teclear. **Nota:** Photon **no** admite `lang=es` (solo default/de/en/fr). Nominatim se mantiene para "Localizar en el mapa" | Cartociudad/IGN (mejor callejero ES pero API antigua y más costosa de integrar); seguir solo con Nominatim (UX pobre) |
| 25 | **Provincia con lista fija de las 52** (`matchProvincia`) y municipios vía Photon `place`; nunca se pisa la provincia elegida con la comarca de OSM (`county`) | OSM mete comarcas ("Iruñerria") en `county`; sin control, el combo quedaba con valores inválidos | Confiar en los campos administrativos de OSM tal cual |
| 26 | **Vista previa del perfil = componente público real** (`ShelterPublicProfile` compartido entre `/protectoras/[slug]` y el editor) | Garantiza que "lo que ves es lo que se publica" sin duplicar UI ni divergencias | Renderizar una maqueta aparte para la vista previa |
| 27 | **Búsqueda pública vía RPC `animals_search` SECURITY INVOKER** (2026-07-10): filtros, distancia PostGIS, portada y `total_count` en una sola función SQL; el builder TS (`src/lib/animal-search.ts`) traduce la URL a argumentos | El orden por distancia y el recuento total no se pueden expresar con el query builder de supabase-js; al ser *invoker*, la RLS de `animals`/`shelters` sigue aplicando (anon solo ve publicado+verificado) | Ordenar/paginar en JS (rompe con paginación), vista materializada (complejidad sin necesidad a esta escala), SECURITY DEFINER (duplicaría las garantías de RLS a mano) |

## Cómo añadir una decisión

Nueva fila con fecha en sección nueva si cambia el mes. Si revierte una anterior, enlázala ("revierte #9") en vez de borrarla.
