import {
  BarChart3,
  Bell,
  CalendarDays,
  CalendarHeart,
  Clock,
  FileText,
  Heart,
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
  adopter: [
    { key: "navAccount", href: "/mi-cuenta", icon: Home, exists: true },
    { key: "navMyRequests", href: "/mi-cuenta/solicitudes", icon: FileText },
    { key: "navFavorites", href: "/mi-cuenta/favoritos", icon: Heart },
    { key: "navMyAppointments", href: "/mi-cuenta/citas", icon: CalendarHeart },
    { key: "navMyAlerts", href: "/mi-cuenta/alertas", icon: Bell },
  ],
};

type Props = {
  role: Role;
  /** Protectora sin alta enviada: panel bloqueado → ítems deshabilitados. */
  onboarding: boolean;
  pathname: string;
  /**
   * Conteos por clave de ítem (p. ej. `{ navRequests: 4 }`). Presentacional:
   * la alimentación real llega desde FEATURE-007/FEATURE-004. Sin valor → sin badge.
   */
  badges?: Partial<Record<string, number>>;
};

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hola@adoptia.app";

export function AppSidebar({ role, onboarding, pathname, badges }: Props) {
  const t = useTranslations("shell");
  const items = NAV[role];

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <nav className="flex flex-1 flex-col gap-1" aria-label={t("navMain")}>
        {items.map(({ key, href, icon: Icon, exists }) => {
          const activo = pathname === href;
          const deshabilitado = onboarding || !exists;
          const conteo = badges?.[key] ?? 0;
          const contenido = (
            <>
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{t(key)}</span>
              {conteo > 0 && (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-semibold tabular-nums text-primary">
                  {conteo}
                </span>
              )}
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
                  ? "bg-tertiary/12 font-semibold text-tertiary"
                  : "text-foreground hover:bg-accent",
              )}
            >
              {contenido}
            </Link>
          );
        })}
      </nav>

      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <LifeBuoy className="size-4" aria-hidden="true" />
        {t("support")}
      </a>
    </div>
  );
}
