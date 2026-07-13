import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { destinoPostLogin } from "@/lib/post-login";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de autenticación. Cubre los dos flujos:
 * - **OAuth / PKCE** (Google, confirmación en el mismo navegador): `?code=…` →
 *   `exchangeCodeForSession`.
 * - **Confirmación de email por token** (`?token_hash=…&type=…`): `verifyOtp`,
 *   que funciona también entre dispositivos (no necesita `code_verifier`).
 *
 * Si tras cualquiera de los dos hay sesión, redirige a `next` (solo rutas
 * internas) o, en su defecto, al destino según el rol del perfil
 * (protectora → `/panel`, admin → `/admin`). Si GoTrue ya dejó la sesión en
 * cookies, `getUser` lo detecta.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const destino = destinoPostLogin({
      role: profile?.role,
      redirect: url.searchParams.get("next"),
    });
    return NextResponse.redirect(new URL(destino, url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
