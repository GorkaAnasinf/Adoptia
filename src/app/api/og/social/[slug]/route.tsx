import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = Promise<{ slug: string }>;
type Media = { url: string; is_cover: boolean; sort_order: number; type?: string };

/**
 * Imagen social lista para compartir (FEATURE-014): cuadrada 1080×1080 por
 * defecto, vertical 1080×1920 con `?f=story`. El cliente anon respeta RLS:
 * un animal no público devuelve 404.
 */
export async function GET(req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const formato = new URL(req.url).searchParams.get("f");
  const ancho = 1080;
  const alto = formato === "story" ? 1920 : 1080;

  const supabase = await createClient();
  const { data } = await supabase
    .from("animals")
    .select("id, name, species, status, animal_media (url, is_cover, sort_order, type), shelters (name, status)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });

  const media = ((data.animal_media as Media[] | null) ?? [])
    .filter((m) => (m.type ?? "photo") === "photo")
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const portada = media[0]?.url ?? null;
  const shelter = data.shelters as unknown as { name: string } | null;
  const t = await getTranslations("ficha");
  const host = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
    : "adoptia";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1c1917",
        }}
      >
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portada}
            alt=""
            width={ancho}
            height={Math.round(alto * 0.72)}
            style={{ width: "100%", height: `${Math.round(alto * 0.72)}px`, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: `${Math.round(alto * 0.72)}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 260,
              background: "linear-gradient(135deg, #f97316, #fbbf24)",
            }}
          >
            🐾
          </div>
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "32px 56px",
            gap: 10,
            color: "#fef8f0",
          }}
        >
          <div style={{ fontSize: 34, color: "#fbbf24", fontWeight: 700 }}>{t("ogBadge")}</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>{data.name}</div>
          {shelter?.name ? (
            <div style={{ fontSize: 34, color: "#d6d3d1" }}>{shelter.name}</div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#fb923c" }}>{"Adoptia"}</div>
            <div style={{ fontSize: 28, color: "#a8a29e" }}>
              {host}/animales/{slug}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: ancho, height: alto },
  );
}
