"use client";

import Link from "next/link";
// global-error sustituye al layout raíz completo: aquí no hay proveedor de
// next-intl, así que los textos se leen del JSON de mensajes directamente.
import messages from "../../messages/es.json";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = messages.errors;

  return (
    <html lang="es">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 64 }}>
            🐾
          </span>
          <h1>{t.errorTitle}</h1>
          <p>{t.errorText}</p>
          <button type="button" onClick={reset} style={{ padding: "12px 24px", cursor: "pointer" }}>
            {t.retry}
          </button>
          <Link href="/">{t.backHome}</Link>
        </main>
      </body>
    </html>
  );
}
