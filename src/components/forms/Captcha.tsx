"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export const captchaHabilitado = Boolean(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);

type Props = {
  onVerify: (token: string) => void;
  /** Cambia este número para forzar un token nuevo tras un error (los tokens son de un solo uso). */
  resetSignal?: number;
};

/**
 * Widget de Cloudflare Turnstile. Si no hay site key configurada, no renderiza
 * nada (captcha desactivado) — así el resto de la app funciona sin él.
 */
export function Captcha({ onVerify, resetSignal = 0 }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <div className="flex justify-center">
      <Turnstile
        key={resetSignal}
        siteKey={siteKey}
        options={{ language: "es", theme: "light" }}
        onSuccess={onVerify}
        onExpire={() => onVerify("")}
        onError={() => onVerify("")}
      />
    </div>
  );
}
