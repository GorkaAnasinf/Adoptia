import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = Promise<{ slug: string }>;

const ANCHO = 1200;
const ALTO = 630;

type Media = { url: string; is_cover: boolean; sort_order: number; type?: string };

/**
 * og:image de la ficha pública de un animal (1200×630): foto de portada,
 * nombre y "En adopción". El cliente anon respeta RLS, así que un animal
 * despublicado (o de protectora sin verificar) devuelve 404 y no filtra datos.
 */
export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("animals")
    .select("name, species, status, animal_media (url, is_cover, sort_order, type), shelters (name, status)")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

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
          backgroundColor: "#faf7f2",
        }}
      >
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portada}
            alt=""
            width={720}
            height={ALTO}
            style={{ width: 720, height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 720,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 200,
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
            padding: 48,
            gap: 16,
          }}
        >
          <div style={{ fontSize: 28, color: "#b45309", fontWeight: 700 }}>{t("ogBadge")}</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#1c1917", lineHeight: 1.1 }}>
            {data.name}
          </div>
          {shelter?.name ? (
            <div style={{ fontSize: 26, color: "#57534e" }}>{shelter.name}</div>
          ) : null}
          <div style={{ fontSize: 24, color: "#78716c", marginTop: 24 }}>{host}</div>
        </div>
      </div>
    ),
    { width: ANCHO, height: ALTO },
  );
}
