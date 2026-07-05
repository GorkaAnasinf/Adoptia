import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
  /** Ruta pública de la imagen del panel, p. ej. /images/auth-login.jpg */
  image: string;
  children: React.ReactNode;
};

export function AuthSplit({ image, children }: Props) {
  const t = useTranslations();
  const tienePhoto = existsSync(join(process.cwd(), "public", image));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        {tienePhoto ? (
          <Image
            src={image}
            alt={t("auth.sideClaimAlt")}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        <Link
          href="/"
          className="absolute left-8 top-8 font-heading text-2xl font-bold text-white drop-shadow"
        >
          {t("common.appName")}
        </Link>
        <p className="absolute bottom-10 left-8 right-8 font-heading text-2xl font-semibold leading-snug text-white drop-shadow">
          {t("auth.sideClaim")}
        </p>
      </div>
      <div className="flex flex-col">
        {/* Marca visible en móvil (en desktop va sobre la foto) */}
        <div className="p-6 lg:hidden">
          <Link href="/" className="font-heading text-2xl font-bold text-primary">
            {t("common.appName")}
          </Link>
        </div>
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
