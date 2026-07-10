import type { MetadataRoute } from "next";

/** Solo se indexa el área pública; panel, admin, cuenta y API quedan fuera. */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel", "/admin", "/cuenta", "/api", "/auth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
