# 🐾 Adoptia

**Plataforma web que conecta protectoras de animales con personas que quieren adoptar.**

Las protectoras publican sus animales y gestionan solicitudes y citas desde un panel; los adoptantes buscan por proximidad en un mapa, consultan fichas completas y arrancan la adopción con un cuestionario guiado. Gratuito para ambos lados.

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Supabase (PostgreSQL + PostGIS, Auth, Storage) · Leaflet + OpenStreetMap · Resend · Vercel — **coste 0 €** en free tiers.

## Empezar

```powershell
npm install
Copy-Item .env.example .env.local   # rellenar claves
npm run dev                          # http://localhost:3000
```

Guía completa: [docs/operations/SETUP.md](docs/operations/SETUP.md)

## Documentación

- 🧭 **[Contexto de producto](docs/product/PRODUCT_CONTEXT.md)** — empieza aquí
- 📍 **[Backlog](docs/planning/BACKLOG.md)** — estado actual y items abiertos
- 🗺️ **[Roadmap](docs/planning/ROADMAP.md)** — hitos y progreso
- 🔧 **[Arquitectura](docs/technical/ARCHITECTURE.md)** · **[Modelo de datos](docs/technical/DATA_MODEL.md)** · **[Decisiones](docs/technical/DECISIONS.md)**
- ⚙️ Sitio navegable: `mkdocs serve`

## Flujo de trabajo

Desarrollo con el flujo SDD de la **Manada** (ver [CLAUDE.md](CLAUDE.md)): `/adoptia-balto "petición"` orquesta análisis → plan → código TDD → QA → documentación. La planificación vive en `docs/planning/items/` y las vistas se regeneran con `python scripts/render_planning.py`.

Contribución y convenciones: [CONTRIBUTING.md](CONTRIBUTING.md) · Seguridad: [SECURITY.md](SECURITY.md)
