# AGENTS.md — Adoptia

Guía para agentes de IA trabajando en este repo. La referencia completa está en [CLAUDE.md](CLAUDE.md) — este fichero es el resumen portable (formato agents.md).

## Proyecto

Adoptia: plataforma que conecta protectoras de animales con adoptantes. Next.js 15 (App Router) + TypeScript + Supabase (PostgreSQL/PostGIS, Auth, Storage, RLS) + Tailwind/shadcn/ui. Deploy en Vercel. Idioma: español (código y docs).

## Antes de tocar código

1. Lee `docs/planning/BACKLOG.md` (bloque 📍 ESTADO ACTUAL).
2. Localiza el item en `docs/planning/items/` — el plan técnico vive ahí.
3. Carga la skill del dominio en `.claude/commands/adoptia-{frontend,backend,database,security,testing}.md`.

## Reglas duras

- TDD: test rojo antes de producción. Cobertura ≥70% (80% en `src/lib/`).
- Toda tabla con RLS + tests de política. Nunca `SUPABASE_SERVICE_ROLE_KEY` en código cliente.
- Textos UI vía next-intl (`messages/es.json`).
- Ramas `feature/FEATURE-NNN-slug` desde `develop`; jamás commit a `main`.
- BACKLOG/ROADMAP/INDEX/catálogo de PRODUCT_CONTEXT son generados: edita los items y ejecuta `python scripts/render_planning.py`.
- Commits: Conventional Commits en español (plantilla en `.github/commit-message-template.txt`).

## Verificación antes de terminar

```powershell
npm run lint; npx tsc --noEmit; npm run test -- --coverage
python scripts/render_planning.py   # si tocaste items
```
