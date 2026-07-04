# Contribuir a Adoptia

## Gitflow (sin PRs)

Equipo de 1 → sin pull requests; el CI protege la calidad.

```
main      ← solo merges desde develop (release). Producción.
develop   ← rama de integración. Preview en Vercel.
feature/FEATURE-NNN-slug   ← una rama por item, desde develop
fix/BUG-NNN-slug           ← correcciones
```

- Nunca commit directo a `main` (pre-commit lo bloquea).
- Merge a `develop` con la rama en verde localmente (lint + typecheck + tests).
- Release: `develop → main` + tag `vX.Y.Z` + entrada en [CHANGELOG](docs/planning/CHANGELOG.md).

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
2. Rama `feature/FEATURE-NNN-slug`; item a `estado: desarrollo`.
3. TDD hasta cumplir TODOS los criterios de aceptación.
4. Cierre: `estado: hecho`, CHANGELOG, `python scripts/render_planning.py`, merge a `develop`.

Con la Manada: `/adoptia-balto "FEATURE-NNN"` hace este ciclo completo.
