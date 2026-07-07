import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decideOnboardingGate } from "@/lib/onboarding";
import { getSupabaseEnv } from "@/lib/supabase/env";

// Rutas que exigen sesión y, opcionalmente, un rol concreto.
const PROTECTED: { prefix: string; role?: "adopter" | "shelter" | "admin" }[] = [
  { prefix: "/panel", role: "shelter" },
  { prefix: "/mi-cuenta" },
  { prefix: "/admin", role: "admin" },
];

export async function middleware(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() verifica el JWT contra Supabase (nunca getSession en servidor)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rule = PROTECTED.find((r) =>
    request.nextUrl.pathname.startsWith(r.prefix),
  );
  if (!rule) return response;

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (rule.role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== rule.role) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Gate de onboarding: la protectora sin alta enviada queda confinada al wizard.
    if (rule.role === "shelter") {
      const { data: shelter } = await supabase
        .from("shelters")
        .select("submitted_at, status")
        .eq("owner_id", user.id)
        .maybeSingle();

      const destino = decideOnboardingGate({
        submittedAt: shelter?.submitted_at ?? null,
        hasShelter: Boolean(shelter),
        status: shelter?.status ?? null,
        pathname: request.nextUrl.pathname,
      });
      if (destino && destino !== request.nextUrl.pathname) {
        return NextResponse.redirect(new URL(destino, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Todo salvo estáticos e imágenes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
