// Cabeceras de seguridad (CSP incluida). Extraído de next.config para poder
// testear la política (p. ej. que el mapa Leaflet puede cargar tiles de OSM).

export function buildCsp(isDev: boolean): string {
  const localSupabase = isDev
    ? " http://127.0.0.1:54321 ws://127.0.0.1:54321 http://localhost:54321"
    : "";

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    // Mapa Leaflet: tiles de OpenStreetMap servidas como <img>. Los iconos de
    // marcador se sirven desde el propio dominio (public/leaflet), sin CDN.
    // Avatares de Google (OAuth) desde lh3.googleusercontent.com.
    // images.unsplash.com: fotos del seed de demo (FEATURE-008).
    "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://lh3.googleusercontent.com https://images.unsplash.com",
    "font-src 'self'",
    "frame-src 'self' https://challenges.cloudflare.com",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${localSupabase}`,
    "frame-ancestors 'none'",
  ].join("; ");
}

export const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: buildCsp(process.env.NODE_ENV !== "production"),
  },
];
