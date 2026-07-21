import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sección de formulario con encabezado (icono + título + ayuda) y contenido.
 * Patrón base para todos los formularios de alta de datos de la app.
 */
export function FormSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 py-6", className)}>
      <header className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className="sm:pl-12">{children}</div>
    </section>
  );
}
