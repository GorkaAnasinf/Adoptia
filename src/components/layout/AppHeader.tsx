"use client";

import { Bell, HelpCircle, Menu, PawPrint } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { StatusBadge, type ShelterStatus } from "./StatusBadge";
import { UserMenu } from "./UserMenu";

type Props = {
  shelterName?: string | null;
  status: ShelterStatus | null;
  crumbs: Crumb[];
  onMenuClick: () => void;
};

export function AppHeader({ shelterName, status, crumbs, onMenuClick }: Props) {
  const t = useTranslations("shell");
  const tc = useTranslations("common");

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
        <Link href="/panel" className="flex items-center gap-2 lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PawPrint className="size-5" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-bold text-primary">
            {tc("appName")}
          </span>
        </Link>

        <div className="hidden min-w-0 lg:block">
          <Breadcrumbs items={crumbs} />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {shelterName && (
          <span className="hidden max-w-[160px] truncate text-sm font-medium text-foreground md:inline">
            {shelterName}
          </span>
        )}
        <StatusBadge status={status} />
        <button
          type="button"
          aria-label={t("help")}
          className="hidden size-9 items-center justify-center rounded-full text-primary hover:bg-accent sm:flex"
        >
          <HelpCircle className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t("notifications")}
          className="hidden size-9 items-center justify-center rounded-full text-primary hover:bg-accent sm:flex"
        >
          <Bell className="size-5" aria-hidden="true" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
