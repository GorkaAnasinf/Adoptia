#!/usr/bin/env python3
"""Render determinista de la planificación de Adoptia.

Lee docs/planning/items/*.md (única fuente de verdad) y regenera las zonas
marcadas <!-- RENDER:START --> ... <!-- RENDER:END --> de:

  - docs/planning/BACKLOG.md        (items abiertos agrupados por estado)
  - docs/planning/ROADMAP.md        (items por hito + % completado)
  - docs/product/PRODUCT_CONTEXT.md (catálogo de features en lenguaje usuario)
  - docs/planning/items/INDEX.md    (índice completo, fichero entero)

Idempotente: misma carpeta de items -> mismo output. Solo stdlib.
Uso: python scripts/render_planning.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEMS_DIR = ROOT / "docs" / "planning" / "items"
BACKLOG = ROOT / "docs" / "planning" / "BACKLOG.md"
ROADMAP = ROOT / "docs" / "planning" / "ROADMAP.md"
PRODUCT = ROOT / "docs" / "product" / "PRODUCT_CONTEXT.md"
INDEX = ITEMS_DIR / "INDEX.md"

SKIP_FILES = {"_TEMPLATE.md", "INDEX.md"}
ESTADOS = ["recibido", "analisis", "diseno", "listo", "desarrollo",
           "bloqueado", "hecho", "descartado"]
ABIERTOS = ["desarrollo", "bloqueado", "listo", "diseno", "analisis", "recibido"]
ESTADO_LABEL = {
    "recibido": "📥 Recibido", "analisis": "🔍 En análisis", "diseno": "📐 En diseño",
    "listo": "✅ Listo para desarrollo", "desarrollo": "🔨 En desarrollo",
    "bloqueado": "🚫 Bloqueado", "hecho": "🎉 Hecho", "descartado": "🗑️ Descartado",
}
PRIORIDAD_ORDEN = {"alta": 0, "media": 1, "baja": 2}


def parse_frontmatter(text: str) -> dict:
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return {}
    data = {}
    for line in m.group(1).splitlines():
        if ":" not in line or line.strip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        value = value.strip().strip('"').strip("'")
        data[key.strip()] = None if value in ("", "null", "~") else value
    return data


def load_items() -> list[dict]:
    items = []
    for path in sorted(ITEMS_DIR.glob("*.md")):
        if path.name in SKIP_FILES:
            continue
        fm = parse_frontmatter(path.read_text(encoding="utf-8"))
        if not fm.get("id"):
            print(f"AVISO: {path.name} sin frontmatter valido, ignorado", file=sys.stderr)
            continue
        fm["_file"] = path.name
        items.append(fm)
    return items


def replace_zone(path: Path, content: str) -> None:
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r"(<!-- RENDER:START -->).*?(<!-- RENDER:END -->)", re.DOTALL)
    if not pattern.search(text):
        sys.exit(f"ERROR: {path} no tiene zona RENDER:START/END")
    new = pattern.sub(lambda m: f"{m.group(1)}\n{content.strip()}\n{m.group(2)}", text)
    path.write_text(new, encoding="utf-8", newline="\n")
    print(f"OK render -> {path.relative_to(ROOT)}")


def item_link(it: dict, from_dir: str) -> str:
    rel = {"planning": "items/", "product": "../planning/items/"}[from_dir]
    return f"[{it['id']}]({rel}{it['_file']})"


def sort_key(it: dict):
    return (PRIORIDAD_ORDEN.get(it.get("prioridad") or "media", 1), it["id"])


def render_backlog(items: list[dict]) -> None:
    lines = []
    for estado in ABIERTOS:
        grupo = sorted([i for i in items if i.get("estado") == estado], key=sort_key)
        if not grupo:
            continue
        lines.append(f"\n### {ESTADO_LABEL[estado]} ({len(grupo)})\n")
        lines.append("| Item | Título | Prioridad | Hito |")
        lines.append("|------|--------|-----------|------|")
        for it in grupo:
            lines.append(f"| {item_link(it, 'planning')} | {it.get('titulo','')} "
                         f"| {it.get('prioridad','—')} | {it.get('hito') or '—'} |")
    if not lines:
        lines = ["\n_No hay items abiertos._"]
    replace_zone(BACKLOG, "\n".join(lines))


def render_roadmap(items: list[dict]) -> None:
    hitos = sorted({i["hito"] for i in items if i.get("hito")})
    lines = []
    for hito in hitos:
        grupo = sorted([i for i in items if i.get("hito") == hito], key=sort_key)
        hechos = [i for i in grupo if i.get("estado") == "hecho"]
        pct = round(100 * len(hechos) / len(grupo)) if grupo else 0
        lines.append(f"\n### Hito {hito} — {pct}% completado ({len(hechos)}/{len(grupo)})\n")
        lines.append("| Item | Título | Estado | Prioridad |")
        lines.append("|------|--------|--------|-----------|")
        for it in grupo:
            lines.append(f"| {item_link(it, 'planning')} | {it.get('titulo','')} "
                         f"| {it.get('estado','')} | {it.get('prioridad','—')} |")
    sin_hito = [i for i in items if not i.get("hito") and i.get("estado") not in ("hecho", "descartado")]
    if sin_hito:
        lines.append(f"\n### Sin hito asignado ({len(sin_hito)})\n")
        lines.append("_Capturas pendientes de promover — no forman parte del roadmap todavía._\n")
        for it in sorted(sin_hito, key=sort_key):
            lines.append(f"- {item_link(it, 'planning')} — {it.get('titulo','')} ({it.get('estado','')})")
    replace_zone(ROADMAP, "\n".join(lines))


def render_product(items: list[dict]) -> None:
    lines = []
    hechos = sorted([i for i in items if i.get("estado") == "hecho"], key=lambda i: i["id"])
    en_curso = sorted([i for i in items if i.get("estado") == "desarrollo"], key=lambda i: i["id"])
    previstos = sorted([i for i in items if i.get("estado") in
                        ("recibido", "analisis", "diseno", "listo", "bloqueado")],
                       key=lambda i: (i.get("hito") or "z", i["id"]))
    lines.append("\n#### ✅ Disponible\n")
    if hechos:
        lines += [f"- {it.get('titulo','')} ({item_link(it, 'product')})" for it in hechos]
    else:
        lines.append("_Todavía no hay funcionalidades entregadas._")
    lines.append("\n#### 🚧 En camino (en desarrollo ahora)\n")
    if en_curso:
        lines += [f"- {it.get('titulo','')} ({item_link(it, 'product')})" for it in en_curso]
    else:
        lines.append("_Nada en desarrollo en este momento._")
    lines.append("\n#### 🗓️ Previsto\n")
    if previstos:
        lines += [f"- {it.get('titulo','')} — hito {it.get('hito') or 'sin asignar'} "
                  f"({item_link(it, 'product')})" for it in previstos]
    else:
        lines.append("_Backlog vacío._")
    replace_zone(PRODUCT, "\n".join(lines))


def render_index(items: list[dict]) -> None:
    lines = [
        "# Índice de items",
        "",
        "> **Fichero generado** por `python scripts/render_planning.py` — no editar a mano.",
        "> Consúltalo ANTES de crear un item nuevo para evitar duplicados.",
        "",
        "| ID | Título | Tipo | Estado | Hito |",
        "|----|--------|------|--------|------|",
    ]
    for it in sorted(items, key=lambda i: i["id"]):
        lines.append(f"| [{it['id']}]({it['_file']}) | {it.get('titulo','')} | {it.get('tipo','')} "
                     f"| {it.get('estado','')} | {it.get('hito') or '—'} |")
    INDEX.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"OK render -> {INDEX.relative_to(ROOT)}")


def main() -> None:
    items = load_items()
    if not items:
        sys.exit("ERROR: no hay items en docs/planning/items/")
    for it in items:
        if it.get("estado") not in ESTADOS:
            sys.exit(f"ERROR: {it['_file']} estado invalido: {it.get('estado')}")
    render_backlog(items)
    render_roadmap(items)
    render_product(items)
    render_index(items)
    print(f"Render completado: {len(items)} items procesados.")


if __name__ == "__main__":
    main()
