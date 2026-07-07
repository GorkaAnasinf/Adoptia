"use client";

import { PawPrint, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { crumbsFromPathname } from "@/lib/breadcrumbs";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { type ShelterStatus } from "./StatusBadge";

type Props = {
  role: "shelter" | "admin" | "adopter";
  onboarding: boolean;
  status: ShelterStatus | null;
  shelterName?: string | null;
  children: React.ReactNode;
};

function Marca({ shelterName }: { shelterName?: string | null }) {
  const t = useTranslations("common");
  return (
    <Link href="/panel" className="flex items-center gap-2.5 px-3 py-4">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <PawPrint className="size-6" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-bold text-primary">{t("appName")}</span>
        {shelterName && (
          <span className="max-w-[150px] truncate text-xs text-muted-foreground">
            {shelterName}
          </span>
        )}
      </span>
    </Link>
  );
}

export function AppShell({ role, onboarding, status, shelterName, children }: Props) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cierra el drawer al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const crumbs = crumbsFromPathname(pathname, t);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar fijo (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <Marca shelterName={shelterName} />
        <div className="flex-1 overflow-y-auto">
          <AppSidebar role={role} onboarding={onboarding} pathname={pathname} />
        </div>
      </aside>

      {/* Drawer (móvil) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("openMenu")}
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-xl"
          >
            <div className="flex items-center justify-between pr-2">
              <Marca shelterName={shelterName} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeMenu")}
                className="flex size-10 items-center justify-center rounded-xl hover:bg-accent"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AppSidebar role={role} onboarding={onboarding} pathname={pathname} />
            </div>
          </div>
        </div>
      )}

      {/* Columna de contenido */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AppHeader
          shelterName={shelterName}
          status={status}
          crumbs={crumbs}
          onMenuClick={() => setOpen(true)}
        />
        <main className="flex-1">{children}</main>
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-border px-6 py-4 text-sm text-muted-foreground sm:flex-row">
          <span>{t("footerRights", { year })}</span>
          <nav className="flex gap-4">
            <Link href="/ayuda" className="hover:text-primary">
              {t("footerHelp")}
            </Link>
            <Link href="/terminos" className="hover:text-primary">
              {t("footerTerms")}
            </Link>
            <Link href="/privacidad" className="hover:text-primary">
              {t("footerPrivacy")}
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
