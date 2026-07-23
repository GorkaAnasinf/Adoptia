"use client";

import { Menu, PawPrint, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { inicioDeRol } from "@/lib/inicio-rol";
import type { RolPrivado } from "@/lib/command-sections";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { StatusBadge, type ShelterStatus } from "./StatusBadge";
import { UserMenu, type UserRole } from "./UserMenu";

type Props = {
  role?: UserRole | null;
  shelterName?: string | null;
  status: ShelterStatus | null;
  crumbs: Crumb[];
  onMenuClick: () => void;
  /**
   * Latente: encenderá el punto de la campana cuando exista la feature de
   * notificaciones. Hoy la campana está retirada, así que no se consume.
   */
  hasNotifications?: boolean;
};

export function AppHeader({ role, shelterName, status, crumbs, onMenuClick }: Props) {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const [buscando, setBuscando] = useState(false);

  // Atajo global ⌘K / Ctrl+K para abrir el buscador.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscando((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t("openMenu")}
          className="flex size-11 items-center justify-center rounded-xl hover:bg-accent lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        {/* Marca (visible sobre todo en móvil; en desktop el sidebar ya la lleva) */}
        <Link href={inicioDeRol(role)} className="flex items-center gap-2 lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PawPrint className="size-5" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-bold text-primary">
            {tc("appName")}
          </span>
        </Link>

        <div className="hidden min-w-0 lg:block">
          <Breadcrumbs items={crumbs} label={t("breadcrumb")} />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {role && (
          <button
            type="button"
            onClick={() => setBuscando(true)}
            aria-label={t("searchTitle")}
            aria-keyshortcuts="Control+K Meta+K"
            className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("searchTitle")}</span>
            <kbd className="hidden rounded border border-border bg-muted px-1.5 text-[10px] font-medium md:inline">
              ⌘K
            </kbd>
          </button>
        )}
        {shelterName && (
          <span className="hidden max-w-[160px] truncate text-sm font-medium text-foreground md:inline">
            {shelterName}
          </span>
        )}
        <StatusBadge status={status} />
        {/* Ayuda y notificaciones se retiran hasta tener feature; el prop
            `hasNotifications` queda latente para reactivar la campana. */}
        <UserMenu role={role} />
      </div>

      {role && (
        <CommandPalette
          role={role as RolPrivado}
          open={buscando}
          onClose={() => setBuscando(false)}
        />
      )}
    </header>
  );
}
