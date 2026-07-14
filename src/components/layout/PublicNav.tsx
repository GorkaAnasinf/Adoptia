"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LINKS = [
  { key: "animals", href: "/animales" },
  { key: "shelters", href: "/protectoras" },
  { key: "map", href: "/mapa" },
  { key: "lostFound", href: "/perdidos-encontrados" },
] as const;

/**
 * Buscador de la cabecera: envía a `/animales?q=<término>` (o al listado sin
 * filtro si va vacío). El texto real lo resuelve el RPC `animals_search`.
 */
function Buscador({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const termino = q.trim();
    router.push(termino ? `/animales?q=${encodeURIComponent(termino)}` : "/animales");
    onNavigate?.();
  };

  return (
    <form onSubmit={enviar} role="search" className={className}>
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={t("searchPlaceholder")}
        placeholder={t("searchPlaceholder")}
        maxLength={60}
        className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

/**
 * Navegación de la cabecera pública: enlaces con estado activo, buscador
 * (entrada a la exploración de animales) y menú móvil en drawer.
 */
export function PublicNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  const esActivo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Cierra el drawer al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Al abrir, lleva el foco al botón de cerrar; cierra con Escape
  useEffect(() => {
    if (!open) return;
    cerrarRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Enlaces (desktop) */}
      <nav className="hidden items-center gap-5 text-sm md:flex" aria-label={t("openMenu")}>
        {LINKS.map(({ key, href }) => (
          <Link
            key={key}
            href={href}
            aria-current={esActivo(href) ? "page" : undefined}
            className={cn(
              "font-medium transition-colors hover:text-primary",
              esActivo(href) ? "text-primary" : "text-foreground",
            )}
          >
            {t(key)}
          </Link>
        ))}
      </nav>

      {/* Buscador (desktop) */}
      <Buscador className="hidden min-w-50 items-center gap-2 rounded-full border border-input bg-card px-4 py-2 transition-colors focus-within:border-primary/40 hover:border-primary/40 lg:flex" />

      {/* Botón de menú (móvil) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={open}
        className="ml-auto flex size-11 items-center justify-center rounded-xl hover:bg-accent md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/* Drawer (móvil) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("openMenu")}
            className="absolute inset-y-0 right-0 flex w-72 flex-col gap-1 bg-background p-4 shadow-xl"
          >
            <div className="flex justify-end">
              <button
                ref={cerrarRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeMenu")}
                className="flex size-11 items-center justify-center rounded-xl hover:bg-accent"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <Buscador
              className="mb-2 flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2.5"
              onNavigate={() => setOpen(false)}
            />

            {LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                aria-current={esActivo(href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  esActivo(href)
                    ? "bg-accent text-primary"
                    : "text-foreground hover:bg-accent",
                )}
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
