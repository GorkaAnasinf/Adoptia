/**
 * Validación y normalización de enlaces de YouTube.
 * Solo se acepta un ID de vídeo de 11 caracteres para renderizar un embed
 * sandbox; cualquier otra cosa se rechaza.
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extrae el ID de vídeo de una URL de YouTube, o null si no es válida. */
export function parseYoutubeId(input: string): string | null {
  const url = input.trim();
  if (!url) return null;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  let id: string | null = null;

  if (host === "youtu.be") {
    id = u.pathname.slice(1);
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (u.pathname === "/watch") {
      id = u.searchParams.get("v");
    } else if (u.pathname.startsWith("/embed/")) {
      id = u.pathname.slice("/embed/".length);
    } else if (u.pathname.startsWith("/shorts/")) {
      id = u.pathname.slice("/shorts/".length);
    }
  }

  if (!id) return null;
  id = id.split("/")[0];
  return ID_RE.test(id) ? id : null;
}

/** URL de embed canónica (nocookie) a partir de cualquier enlace de YouTube. */
export function youtubeEmbedUrl(input: string): string | null {
  const id = parseYoutubeId(input);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function esYoutubeValido(input: string): boolean {
  return parseYoutubeId(input) !== null;
}
