import { createClient } from "@/lib/supabase/server";
import { parseYoutubeId } from "@/lib/youtube";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * Comprueba que un enlace de YouTube es válido Y **embebible** antes de
 * guardarlo en el alta de un animal (FEATURE-020). Un vídeo privado, borrado
 * o con la inserción desactivada por su dueño saldría como «vídeo no
 * disponible» en la ficha; aquí se detecta con el endpoint oEmbed de YouTube
 * (200 = público y embebible; 401/403/404 = no incrustable).
 *
 * Solo hace fetch a youtube.com/oembed con un ID de 11 caracteres ya
 * validado (sin SSRF). Requiere sesión: solo lo usan las protectoras.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ error: { code: "unauthorized", message: "Necesitas iniciar sesión" } }, 401);
  }

  const url = new URL(req.url).searchParams.get("url") ?? "";
  const id = parseYoutubeId(url);
  if (!id) {
    return json({ error: { code: "invalid_url", message: "El enlace de YouTube no es válido" } }, 422);
  }

  const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`,
  )}`;

  try {
    const res = await fetch(oembed);
    if (res.ok) {
      return json({ data: { embeddable: true, id } });
    }
    // 401: inserción desactivada · 403: privado · 404: no existe/borrado.
    const reason = res.status === 404 ? "not_found" : "not_embeddable";
    return json({ data: { embeddable: false, id, reason } });
  } catch {
    // Fallo de red/YouTube caído: no bloqueamos el guardado por esto.
    return json({ data: { embeddable: null, id, reason: "check_failed" } });
  }
}
