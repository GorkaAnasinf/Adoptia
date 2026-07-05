import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda anti-hardcode: los componentes y páginas no deben contener
 * texto de UI en español fuera de messages/es.json.
 */
const RAICES = ["src/app", "src/components"];
const IGNORAR = [/\.test\.tsx?$/, /components[\\/]+ui[\\/]/];

// Texto visible: contenido JSX que empiece por letra (no expresiones {t(...)})
const TEXTO_JSX = />\s*([A-Za-zÁÉÍÓÚÑáéíóúñ¿¡][^<>{}]*)</g;

function ficherosTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return ficherosTsx(ruta);
    return ruta.endsWith(".tsx") ? [ruta] : [];
  });
}

describe("i18n — sin textos hardcodeados", () => {
  it("ninguna página ni componente contiene texto de UI fuera de messages/es.json", () => {
    const infractores: string[] = [];

    for (const raiz of RAICES) {
      for (const fichero of ficherosTsx(raiz)) {
        if (IGNORAR.some((re) => re.test(fichero))) continue;
        const contenido = readFileSync(fichero, "utf8");
        for (const match of contenido.matchAll(TEXTO_JSX)) {
          const texto = match[1].trim();
          if (texto.length > 1) {
            infractores.push(`${fichero}: "${texto}"`);
          }
        }
      }
    }

    expect(infractores).toEqual([]);
  });
});
