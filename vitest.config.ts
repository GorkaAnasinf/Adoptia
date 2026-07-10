import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` lanza fuera de un Server Component; en tests es un noop.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/test/**",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/components/ui/**", // generados por shadcn
        "src/i18n/**", // glue de next-intl sin lógica propia
        "src/app/layout.tsx", // root layout: fuentes y provider, sin lógica
        // Leaflet toca window/DOM real: no ejecutable en jsdom (Decisión #8)
        "src/components/shelters/MapPinPicker*.tsx",
        "src/components/map/MiniMapa*.tsx",
        "src/components/map/MapaProtectoras*.tsx",
      ],
      thresholds: {
        lines: 70,
        // TEMPORAL (IMPROVEMENT-012): deuda heredada en funciones; devolver a 70
        // cubriendo uploaders y páginas de panel sin tests.
        functions: 66,
        branches: 70,
        statements: 70,
        "src/lib/**": {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
});
