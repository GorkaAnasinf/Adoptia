# Changelog — Adoptia

Formato: [Keep a Changelog](https://keepachangelog.com/es/) adaptado. Versionado 0.x hasta el MVP.

## [0.0.1] — 2026-07-04

### Añadido

- Inicialización completa del proyecto (esta base documental y de infraestructura):
  - **Documentación** por áreas en `docs/`: producto (PRODUCT_CONTEXT, PLAN, GLOSSARY), técnico (ARCHITECTURE, DATA_MODEL, API_CONTRACTS, DESIGN, DECISIONS + biblia técnica y prompts Stitch), planificación (BACKLOG, ROADMAP, CHATGPT_GATEWAY, items/), operación (SETUP, ENVIRONMENT, OPERATIONS, RUNBOOKS, SECURITY), meta (TESTING, PRIVACY, DOCUMENTATION).
  - **Sistema de items**: 17 items reales (FEATURE-000…016) en `docs/planning/items/` con plantilla `_TEMPLATE.md`; vistas renderizadas con `scripts/render_planning.py`.
  - **Infraestructura**: CI GitHub Actions (lint+typecheck+test+build, render check, docs), keepalive Supabase, pre-commit + detect-secrets, Makefile, MkDocs Material, plantillas de issues y commits.
  - **Manada SDD**: 6 agentes (Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko) + skills de stack (frontend, backend, database, security, testing) en `.claude/commands/`.
  - Ficheros raíz: README, CLAUDE.md, AGENTS.md, CONTRIBUTING, SECURITY.
