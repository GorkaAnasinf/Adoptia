# CLAUDE.md — Adoptia

Plataforma que conecta protectoras de animales con adoptantes. Next.js 15 + TS + Supabase (Postgres/PostGIS, Auth, Storage) + Tailwind/shadcn + Vercel. Coste 0 €. Todo en español.

## 🐕 La Manada SDD (agentes de desarrollo)

Flujo completo de desarrollo. **Punto de entrada único: `/adoptia-balto`.**

| Agente | Rol | Cuándo usarlo directamente |
|--------|-----|---------------------------|
| **Balto** `/adoptia-balto` | Orquestador — clasifica la petición y deriva por fases | SIEMPRE como entrada de cualquier tarea de desarrollo |
| **Lassie** `/adoptia-lassie` | Estratega RCTF — clarifica peticiones ambiguas/complejas | Petición confusa que quieres afinar antes de planificar |
| **Snoopy** `/adoptia-snoopy` | Arquitecto — spec + plan de desarrollo en el item | Planificar un item sin ejecutar todavía |
| **Bolt** `/adoptia-bolt` | Codificador — ejecuta planes aprobados con TDD | Plan ya aprobado, solo falta código |
| **Scooby** `/adoptia-scooby` | QA — tests, cobertura, lint, completitud vs criterios | Verificar trabajo ya hecho |
| **Hachiko** `/adoptia-hachiko` | Memoria — render de planificación, cierre de items, docs/CHANGELOG alineados con git diff | Cerrar tarea o poner la documentación al día |

```
/adoptia-balto → [¿complejo? Lassie] → Snoopy (plan) → apruebas → Bolt (TDD) → Scooby (QA) → Hachiko (docs) → ✓
```

## Regla 0 — Despacho automático de skills

Antes de escribir código, carga la skill del dominio que toques:

| Si la tarea toca... | Lee primero |
|---------------------|-------------|
| Componentes, pantallas, Tailwind, shadcn, mapa, i18n | `.claude/commands/adoptia-frontend.md` |
| Route Handlers, Server Components, emails, cron | `.claude/commands/adoptia-backend.md` |
| Tablas, migraciones, RLS, PostGIS, Storage | `.claude/commands/adoptia-database.md` |
| Auth, validación, secretos, RLS, anti-spam | `.claude/commands/adoptia-security.md` |
| Tests (siempre en tareas de código) | `.claude/commands/adoptia-testing.md` |

## Flujo de items (planificación)

- **Única verdad:** `docs/planning/items/<ID>.md` (frontmatter: id, tipo, titulo, estado, prioridad, hito...).
- **Vistas renderizadas:** BACKLOG, ROADMAP, catálogo de PRODUCT_CONTEXT e INDEX se regeneran con `python scripts/render_planning.py`. **NUNCA editar sus zonas `<!-- RENDER -->` a mano.**
- **Captura externa:** un Proyecto de ChatGPT (pasarela del analista) crea items en `items/` — ver `docs/planning/CHATGPT_GATEWAY.md`. Hachiko los integra al renderizar.
- **Apertura de sesión:** lee el bloque `📍 ESTADO ACTUAL` de `docs/planning/BACKLOG.md` (~15 líneas) para saber dónde estamos.

## Reglas del proyecto

1. **TDD obligatorio** — test que falla antes de código de producción (ver `docs/meta/TESTING.md`).
2. **RLS es el pilar de seguridad** — toda tabla nueva con políticas + tests de acceso permitido/denegado.
3. **Textos de UI en `messages/es.json`** (next-intl) — nunca hardcodeados.
4. **Secretos jamás con `NEXT_PUBLIC_`** salvo los diseñados como públicos (URL y anon key de Supabase).
5. **Gitflow sin PRs:** ramas `feature/FEATURE-NNN-slug` desde `develop`; commits Conventional Commits en español; nunca commit directo a `main`.
6. **Decisión estructural → fila en `docs/technical/DECISIONS.md`** con fecha y motivo.
7. Imágenes siempre vía `next/image`; comprimir en cliente antes de subir (≤300 KB).
8. Leaflet siempre con `dynamic import` sin SSR.

## Comandos

```powershell
npm run dev / build / lint / test    # ciclo básico
npx tsc --noEmit                     # typecheck
python scripts/render_planning.py    # regenerar planificación
mkdocs serve                         # sitio de docs
supabase db push                     # aplicar migraciones
```
