import {
  BarChart3,
  CalendarDays,
  Clock,
  FileText,
  Home,
  type LucideIcon,
  LifeBuoy,
  PawPrint,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Role = "shelter" | "admin" | "adopter";

type Item = {
  key: string;
  href: string;
  icon: LucideIcon;
  /** ¿La ruta ya existe? Si no, se muestra deshabilitada. */
  exists?: boolean;
};

const NAV: Record<Role, Item[]> = {
  shelter: [
    { key: "navHome", href: "/panel", icon: Home, exists: true },
    { key: "navAnimals", href: "/panel/animales", icon: PawPrint },
    { key: "navRequests", href: "/panel/solicitudes", icon: FileText },
    { key: "navAppointments", href: "/panel/citas", icon: CalendarDays },
    { key: "navAgenda", href: "/panel/agenda", icon: Clock },
    { key: "navPublicProfile", href: "/panel/perfil", icon: Store },
    { key: "navStats", href: "/panel/estadisticas", icon: BarChart3 },
  ],
  admin: [{ key: "navAdminShelters", href: "/admin/protectoras", icon: Store, exists: true }],
  adopter: [{ key: "navAccount", href: "/mi-cuenta", icon: Home, exists: true }],
};

type Props = {
  role: Role;
  /** Protectora sin alta enviada: panel bloqueado → ítems deshabilitados. */
  onboarding: boolean;
  pathname: string;
};

export function AppSidebar({ role, onboarding, pathname }: Props) {
  const t = useTranslations("shell");
  const items = NAV[role];

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <nav className="flex flex-1 flex-col gap-1" aria-label="Navegación principal">
        {items.map(({ key, href, icon: Icon, exists }) => {
          const activo = pathname === href;
          const deshabilitado = onboarding || !exists;
          const contenido = (
            <>
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span>{t(key)}</span>
            </>
          );

          if (deshabilitado) {
            return (
              <span
                key={key}
                aria-disabled="true"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/50"
              >
                {contenido}
              </span>
            );
          }

          return (
            <Link
              key={key}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                activo
                  ? "bg-secondary/15 text-secondary"
                  : "text-foreground hover:bg-accent",
              )}
            >
              {contenido}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-border px-3 py-2.5 text-sm font-medium text-tertiary hover:bg-accent"
      >
        <LifeBuoy className="size-4" aria-hidden="true" />
        {t("support")}
      </button>
    </div>
  );
}
