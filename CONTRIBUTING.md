# Contribuir a Adoptia

## Gitflow (sin PRs)

Equipo de 1 → sin pull requests; el CI protege la calidad.

```
main                        ← integración y producción (Vercel deploya al hacer push).
feature/FEATURE-NNN-slug    ← una rama por item, desde main
fix/BUG-NNN-slug            ← correcciones, desde main
```

- **Una rama por item, creada desde `main`.** Se libera directa a `main`: no hay rama `develop` intermedia (quedó en desuso; el flujo real es main-based).
- Nunca commit directo a `main` (pre-commit lo bloquea): siempre rama + `merge --no-ff`.
- Merge a `main` con la rama en verde localmente (lint + typecheck + tests) y `push origin main` (dispara el deploy en Vercel).
- Release/versionado: entrada en [CHANGELOG](docs/planning/CHANGELOG.md) al cerrar cada item (tag `vX.Y.Z` opcional).

## Commits

Conventional Commits **en español** (plantilla configurada: `git config commit.template .github/commit-message-template.txt`).

```
feat(mapa): búsqueda por proximidad con PostGIS
fix(solicitudes): evitar duplicado por animal y usuario
docs(items): FEATURE-007 promovida a desarrollo
```

## TDD obligatorio

1. Test que falla (comportamiento del criterio de aceptación).
2. Implementación mínima que lo pasa.
3. Refactor con la suite en verde.

Sin excepciones en código de producción. Detalle en [docs/meta/TESTING.md](docs/meta/TESTING.md).

## Calidad

| Herramienta | Cuándo |
|------------|--------|
| ESLint (config Next) + Prettier | `npm run lint` — CI y pre-commit |
| TypeScript estricto | `npx tsc --noEmit` |
| Vitest + Testing Library + Playwright | `npm run test` — cobertura ≥70% |
| pre-commit (detect-secrets, EOL, no-commit-to-main) | `pre-commit install` una vez |

## Ciclo de un item

1. Item en `docs/planning/items/` con estado `listo` (plan aprobado).
2. Rama `feature/FEATURE-NNN-slug` desde `main`; item a `estado: desarrollo`.
3. TDD hasta cumplir TODOS los criterios de aceptación.
4. Cierre: `estado: hecho`, CHANGELOG, `python scripts/render_planning.py`, `merge --no-ff` a `main` y push.

Con la Manada: `/adoptia-balto "FEATURE-NNN"` hace este ciclo completo.
