import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Host de Supabase Storage (fotos de animales/protectoras) para next/image.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePattern = supabaseUrl
  ? (() => {
      const u = new URL(supabaseUrl);
      return {
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
      };
    })()
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Avatares de Google (OAuth).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Supabase Storage (buckets logos, animal-media).
      ...(supabasePattern ? [supabasePattern] : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
