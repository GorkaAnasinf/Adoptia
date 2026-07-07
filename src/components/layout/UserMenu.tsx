"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

function iniciales(user: User): string {
  const nombre = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const base = nombre.includes("@") ? nombre.split("@")[0] : nombre;
  const partes = base.trim().split(/[\s.]+/).filter(Boolean);
  const chars = partes.length >= 2 ? partes[0][0] + partes[1][0] : base.slice(0, 2);
  return chars.toUpperCase() || "?";
}

export function UserMenu() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cargado, setCargado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [fotoFallida, setFotoFallida] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCargado(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cerrar al clicar fuera o con Escape
  useEffect(() => {
    if (!abierto) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [abierto]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAbierto(false);
    router.push("/");
    router.refresh();
  }

  if (!cargado) return <div className="size-9" aria-hidden="true" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
      >
        {t("nav.login")}
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const mostrarFoto = Boolean(avatarUrl) && !fotoFallida;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={t("shell.userMenu")}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {mostrarFoto ? (
          <Image
            src={avatarUrl as string}
            alt={t("shell.userAvatar")}
            width={36}
            height={36}
            className="size-full object-cover"
            onError={() => setFotoFallida(true)}
          />
        ) : (
          iniciales(user)
        )}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
          </div>
          <Link
            href="/mi-cuenta"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
          >
            <UserRound className="size-4" aria-hidden="true" />
            {t("shell.navAccount")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {t("auth.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
