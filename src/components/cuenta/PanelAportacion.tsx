import { Bell, Gift, Heart, HeartHandshake, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Panel granate «Tu aportación» del dashboard del adoptante (FEATURE-039).
 *
 * El wireframe pedía euros y kilos donados; en Adoptia una donación es un
 * ofrecimiento de material, así que aquí solo hay cifras que existen de verdad.
 * Con cero, la fila invita a activar esa vía en lugar de enseñar un cero.
 */
export function PanelAportacion({
  donaciones,
  acogida,
  alertas,
}: {
  donaciones: number;
  acogida: boolean;
  alertas: number;
}) {
  const t = useTranslations("account");

  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-soft">
      <Heart
        className="pointer-events-none absolute -right-6 -top-6 size-32 rotate-12 text-white/10"
        aria-hidden="true"
        fill="currentColor"
      />
      <h2 className="font-heading text-lg font-semibold">{t("aportacionTitulo")}</h2>
      <p className="mt-1 text-sm italic text-white/85">{t("aportacionLema")}</p>

      <ul className="relative mt-4 flex flex-col gap-2">
        <Via
          icono={Gift}
          href="/mi-cuenta/donaciones"
          activa={donaciones > 0}
          texto={donaciones > 0 ? t("aportacionDonaciones", { n: donaciones }) : t("aportacionDonacionesVacio")}
        />
        <Via
          icono={HeartHandshake}
          href="/mi-cuenta/acogida"
          activa={acogida}
          texto={acogida ? t("aportacionAcogida") : t("aportacionAcogidaVacio")}
        />
        <Via
          icono={Bell}
          href="/mi-cuenta/alertas"
          activa={alertas > 0}
          texto={alertas > 0 ? t("aportacionAlertas", { n: alertas }) : t("aportacionAlertasVacio")}
        />
      </ul>

      <Link
        href="/necesidades"
        className="relative mt-4 flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-safe:active:scale-95"
      >
        {t("aportacionCta")}
      </Link>
    </section>
  );
}

function Via({
  icono: Icono,
  href,
  activa,
  texto,
}: {
  icono: LucideIcon;
  href: string;
  activa: boolean;
  texto: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-safe:active:scale-95 ${
          activa ? "bg-white/15 font-semibold hover:bg-white/20" : "text-white/85 hover:bg-white/10"
        }`}
      >
        <Icono className="size-4 shrink-0" aria-hidden="true" />
        <span>{texto}</span>
      </Link>
    </li>
  );
}
