import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Callback OAuth (PKCE): intercambia el código por sesión en cookies. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Solo rutas internas: nunca redirigir a orígenes externos
      const destino = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
