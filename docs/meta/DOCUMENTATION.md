# Cómo documentamos — Adoptia

## Principios

1. **Una verdad por dato.** Los items (`docs/planning/items/`) son la fuente de la planificación; BACKLOG/ROADMAP/catálogo de PRODUCT_CONTEXT son **vistas renderizadas** (`python scripts/render_planning.py`) y nunca se editan a mano dentro de sus zonas `<!-- RENDER -->`.
2. **La documentación acompaña al código.** Cada tarea que cambia comportamiento actualiza sus docs en el mismo flujo (lo verifica Hachiko contra `git diff`).
3. **Español**, lenguaje llano en `product/`, técnico preciso en `technical/`.

## Mapa de áreas

| Área | Contenido | Quién escribe |
|------|-----------|---------------|
| `docs/product/` | Qué es el producto (PRODUCT_CONTEXT es el hub raíz) | Analista + Hachiko |
| `docs/technical/` | Cómo está hecho (arquitectura, datos, API, diseño, decisiones) | Snoopy + Hachiko |
| `docs/planning/` | Dónde estamos (items, backlog, roadmap, changelog) | ChatGPT (items) + script + Hachiko |
| `docs/operations/` | Cómo se arranca y opera | Hachiko |
| `docs/meta/` | Transversal (testing, privacidad, este doc) | Hachiko |

## Ciclo de vida de un item

```
recibido → analisis → diseno → listo → desarrollo → hecho
                                  ↘ bloqueado ↗        ↘ descartado
```

- **Captura** (ChatGPT o a mano): copia `_TEMPLATE.md`, rellena Descripción/Contexto, `estado: recibido`, `hito: null`.
- **Promoción** (Snoopy): rellena Plan de desarrollo + Criterios, asigna hito, `estado: listo`.
- **Cierre** (Hachiko): `estado: hecho`, entrada en CHANGELOG, `python scripts/render_planning.py`.

## Sitio de documentación

MkDocs Material: `mkdocs serve` (local) / `mkdocs build` (CI). Nav en `mkdocs.yml` — al crear un doc nuevo, añadirlo al nav.

## Reglas prácticas

- Enlaces relativos entre docs (funcionan en GitHub y MkDocs).
- Fechas absolutas (YYYY-MM-DD), nunca "la semana pasada".
- Decisión estructural → fila en [DECISIONS](../technical/DECISIONS.md), no párrafo suelto.
- No duplicar la biblia técnica: resumir y enlazar.
