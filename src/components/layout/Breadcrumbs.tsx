import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const ultimo = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li>
                {item.href && !ultimo ? (
                  <Link
                    href={item.href}
                    className="font-medium text-muted-foreground hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={ultimo ? "page" : undefined}
                    className={ultimo ? "font-semibold text-primary" : "text-muted-foreground"}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!ultimo && (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
