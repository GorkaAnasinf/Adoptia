import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guías educativas (FEATURE-015): ficheros Markdown con frontmatter en
 * src/content/guias. Añadir una guía = añadir un fichero, sin tocar código.
 * Sin dependencias: frontmatter y render propios (ver markdown.tsx).
 */

export type GuiaMeta = {
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  orden: number;
  minutosLectura: number;
  actualizado: string;
};

export type Guia = GuiaMeta & { cuerpo: string };

const DIR = join(process.cwd(), "src", "content", "guias");

/** Frontmatter mínimo: bloque `---` inicial con `clave: valor` por línea. */
export function parseFrontmatter(raw: string): { meta: Record<string, string>; cuerpo: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, cuerpo: raw };
  const meta: Record<string, string> = {};
  for (const linea of match[1].split(/\r?\n/)) {
    const i = linea.indexOf(":");
    if (i === -1) continue;
    meta[linea.slice(0, i).trim()] = linea.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { meta, cuerpo: raw.slice(match[0].length) };
}

/** ~200 palabras por minuto, mínimo 1. */
export function minutosDeLectura(texto: string): number {
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

function cargar(slug: string, raw: string): Guia {
  const { meta, cuerpo } = parseFrontmatter(raw);
  return {
    slug,
    titulo: meta.titulo ?? slug,
    descripcion: meta.descripcion ?? "",
    categoria: meta.categoria ?? "General",
    orden: Number(meta.orden ?? 999),
    actualizado: meta.actualizado ?? "",
    minutosLectura: minutosDeLectura(cuerpo),
    cuerpo,
  };
}

export function listarGuias(): GuiaMeta[] {
  let ficheros: string[] = [];
  try {
    ficheros = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return ficheros
    .map((f) => {
      const guia = cargar(f.replace(/\.md$/, ""), readFileSync(join(DIR, f), "utf8"));
      const meta: GuiaMeta = {
        slug: guia.slug,
        titulo: guia.titulo,
        descripcion: guia.descripcion,
        categoria: guia.categoria,
        orden: guia.orden,
        minutosLectura: guia.minutosLectura,
        actualizado: guia.actualizado,
      };
      return meta;
    })
    .sort((a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo));
}

export function leerGuia(slug: string): Guia | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return cargar(slug, readFileSync(join(DIR, `${slug}.md`), "utf8"));
  } catch {
    return null;
  }
}

/** Títulos de nivel 2 para la tabla de contenidos. */
export function extraerTOC(cuerpo: string): { id: string; titulo: string }[] {
  return [...cuerpo.matchAll(/^##\s+(.+)$/gm)].map((m) => ({
    id: slugDeTitulo(m[1]),
    titulo: m[1].trim(),
  }));
}

export function slugDeTitulo(titulo: string): string {
  return titulo
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
