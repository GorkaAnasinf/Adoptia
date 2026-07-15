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
    // La instrumentación de cobertura ralentiza los tests de interacción
    // largos (WizardAlta) más allá de los 5 s por defecto.
    testTimeout: 15000,
    // Los tests RLS comparten la BD local: en serie entre sí para evitar
    // flakes de concurrencia (IMPROVEMENT-014). El resto sigue en paralelo.
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/test/rls/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "rls",
          include: ["src/test/rls/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: "v8",
      // Solo código: con `src/**` el proveedor intenta parsear como JS los
      // ficheros que nunca ejecuta un test (globals.css, las guías .md) y
      // rolldown aborta el informe entero (BUG-005).
      include: ["src/**/*.{ts,tsx}"],
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
        functions: 70,
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
