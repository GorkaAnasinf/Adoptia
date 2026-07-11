import Link from "next/link";
import { slugDeTitulo } from "@/lib/guias";

/**
 * Renderer Markdown → React para las guías (FEATURE-015). Subconjunto
 * suficiente y sin dependencias: h2/h3 (con ancla para el TOC), párrafos,
 * listas, checklists (`- [ ]`), avisos (`> `), negrita, cursiva y enlaces
 * (internos con next/link).
 */

function inline(texto: string, keyBase: string): React.ReactNode[] {
  const partes: React.ReactNode[] = [];
  // enlaces [texto](url), negrita **x**, cursiva *x*
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    const key = `${keyBase}-${k++}`;
    if (m[1] !== undefined) {
      const href = m[2];
      partes.push(
        href.startsWith("/") ? (
          <Link key={key} href={href} className="text-primary underline-offset-4 hover:underline">
            {m[1]}
          </Link>
        ) : (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {m[1]}
          </a>
        ),
      );
    } else if (m[3] !== undefined) {
      partes.push(<strong key={key}>{m[3]}</strong>);
    } else if (m[4] !== undefined) {
      partes.push(<em key={key}>{m[4]}</em>);
    }
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

type Bloque =
  | { tipo: "h2" | "h3" | "p" | "aviso"; texto: string }
  | { tipo: "ul" | "ol" | "checklist"; items: string[] };

export function parseBloques(cuerpo: string): Bloque[] {
  const bloques: Bloque[] = [];
  const lineas = cuerpo.split(/\r?\n/);
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];
    if (!linea.trim()) {
      i++;
      continue;
    }
    if (linea.startsWith("## ")) {
      bloques.push({ tipo: "h2", texto: linea.slice(3).trim() });
      i++;
    } else if (linea.startsWith("### ")) {
      bloques.push({ tipo: "h3", texto: linea.slice(4).trim() });
      i++;
    } else if (linea.startsWith("> ")) {
      const partes: string[] = [];
      while (i < lineas.length && lineas[i].startsWith("> ")) {
        partes.push(lineas[i].slice(2));
        i++;
      }
      bloques.push({ tipo: "aviso", texto: partes.join(" ") });
    } else if (/^- \[[ x]\] /.test(linea)) {
      const items: string[] = [];
      while (i < lineas.length && /^- \[[ x]\] /.test(lineas[i])) {
        items.push(lineas[i].replace(/^- \[[ x]\] /, ""));
        i++;
      }
      bloques.push({ tipo: "checklist", items });
    } else if (linea.startsWith("- ")) {
      const items: string[] = [];
      while (i < lineas.length && lineas[i].startsWith("- ")) {
        items.push(lineas[i].slice(2));
        i++;
      }
      bloques.push({ tipo: "ul", items });
    } else if (/^\d+\.\s/.test(linea)) {
      const items: string[] = [];
      while (i < lineas.length && /^\d+\.\s/.test(lineas[i])) {
        items.push(lineas[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      bloques.push({ tipo: "ol", items });
    } else {
      const partes: string[] = [];
      while (i < lineas.length && lineas[i].trim() && !/^(##|###|>|-|\d+\.)\s/.test(lineas[i])) {
        partes.push(lineas[i]);
        i++;
      }
      bloques.push({ tipo: "p", texto: partes.join(" ") });
    }
  }
  return bloques;
}

export function Markdown({ cuerpo }: { cuerpo: string }) {
  const bloques = parseBloques(cuerpo);
  return (
    <div className="flex flex-col gap-4 leading-relaxed">
      {bloques.map((b, i) => {
        const key = `b${i}`;
        switch (b.tipo) {
          case "h2":
            return (
              <h2
                key={key}
                id={slugDeTitulo(b.texto)}
                className="mt-6 scroll-mt-24 font-heading text-2xl font-semibold"
              >
                {inline(b.texto, key)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} className="mt-2 font-heading text-lg font-semibold">
                {inline(b.texto, key)}
              </h3>
            );
          case "aviso":
            return (
              <div
                key={key}
                role="note"
                className="rounded-xl border-l-4 border-tertiary bg-tertiary/10 px-4 py-3 text-sm"
              >
                {inline(b.texto, key)}
              </div>
            );
          case "checklist":
            return (
              <ul key={key} className="flex flex-col gap-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-primary text-xs text-primary"
                    >
                      ✓
                    </span>
                    <span>{inline(it, `${key}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc pl-6">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal pl-6">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={key}>{inline(b.texto, key)}</p>;
        }
      })}
    </div>
  );
}
