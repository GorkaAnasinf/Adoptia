import type { MetadataRoute } from "next";
import { listarGuias } from "@/lib/guias";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Sitemap solo con contenido público: rutas estáticas, animales publicados y
 * protectoras verificadas. El cliente anon respeta RLS, así que los borradores
 * y protectoras pendientes quedan fuera aunque cambien los filtros.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/animales`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/mapa`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/perdidos-encontrados`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/guias`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/acogida`, changeFrequency: "monthly", priority: 0.5 },
    ...listarGuias().map((g) => ({
      url: `${base}/guias/${g.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/aviso-legal`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const supabase = await createClient();
    const [animales, protectoras] = await Promise.all([
      supabase.from("animals").select("slug, updated_at").not("published_at", "is", null),
      supabase.from("shelters").select("slug, updated_at").eq("status", "verified"),
    ]);

    const fichas: MetadataRoute.Sitemap = (animales.data ?? []).map((a) => ({
      url: `${base}/animales/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const perfiles: MetadataRoute.Sitemap = (protectoras.data ?? []).map((s) => ({
      url: `${base}/protectoras/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...estaticas, ...fichas, ...perfiles];
  } catch {
    // Sin BD (build local sin .env): el sitemap estático sigue sirviendo.
    return estaticas;
  }
}
