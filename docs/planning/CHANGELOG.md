# Changelog — Adoptia

Formato: [Keep a Changelog](https://keepachangelog.com/es/) adaptado. Versionado 0.x hasta el MVP.

## [0.0.2] — 2026-07-05

### Añadido

- **FEATURE-000 — Inicialización y andamiaje**: la aplicación existe y funciona en local — Next.js 15 con design system propio (terracota/teal, Montserrat/Open Sans), home conectada a Supabase con contador de animales, registro/login de adoptantes, rutas de panel protegidas por rol, base de datos fase 1 migrada con RLS verificada por tests (10 casos permitido/denegado), i18n en español sin textos hardcodeados (test automático), suite Vitest+Playwright con cobertura 94 % y endpoint keepalive para el plan free de Supabase.
- **FEATURE-017** creado para los pasos manuales de despliegue (Supabase cloud + Vercel), que requieren cuentas del propietario.

## [0.0.1] — 2026-07-04

### Añadido

- Inicialización completa del proyecto (esta base documental y de infraestructura):
  - **Documentación** por áreas en `docs/`: producto (PRODUCT_CONTEXT, PLAN, GLOSSARY), técnico (ARCHITECTURE, DATA_MODEL, API_CONTRACTS, DESIGN, DECISIONS + biblia técnica y prompts Stitch), planificación (BACKLOG, ROADMAP, CHATGPT_GATEWAY, items/), operación (SETUP, ENVIRONMENT, OPERATIONS, RUNBOOKS, SECURITY), meta (TESTING, PRIVACY, DOCUMENTATION).
  - **Sistema de items**: 17 items reales (FEATURE-000…016) en `docs/planning/items/` con plantilla `_TEMPLATE.md`; vistas renderizadas con `scripts/render_planning.py`.
  - **Infraestructura**: CI GitHub Actions (lint+typecheck+test+build, render check, docs), keepalive Supabase, pre-commit + detect-secrets, Makefile, MkDocs Material, plantillas de issues y commits.
  - **Manada SDD**: 6 agentes (Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko) + skills de stack (frontend, backend, database, security, testing) en `.claude/commands/`.
  - Ficheros raíz: README, CLAUDE.md, AGENTS.md, CONTRIBUTING, SECURITY.
