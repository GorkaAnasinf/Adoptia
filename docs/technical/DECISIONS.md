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
| 17 | **Manada SDD** (tema perros: Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko) | Elección del propietario; coherente con el dominio | Panteón griego (default) |
| 18 | **Gitflow sin PRs**: `develop` → `main`, ramas `feature/FEATURE-NNN-slug` | Equipo de 1; CI protege calidad | PRs obligatorias (fricción sin revisores) |
| 19 | **Keepalive cron** (GitHub Actions 2×/semana) | Supabase free pausa tras 7 días de inactividad | Aceptar pausas (mala demo) |

## Cómo añadir una decisión

Nueva fila con fecha en sección nueva si cambia el mes. Si revierte una anterior, enlázala ("revierte #9") en vez de borrarla.
