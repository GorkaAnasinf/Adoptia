"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AcogidaForm, type FosterHome } from "./AcogidaForm";
import { PropuestasRecibidas, type PropuestaRecibida } from "./PropuestasRecibidas";
import { cn } from "@/lib/utils";

type Tab = "propuestas" | "registro";

/** Área de acogida del adoptante en dos pestañas: propuestas y registro. */
export function MisAcogidasCliente({
  userId,
  existente,
  propuestas,
}: {
  userId: string;
  existente: FosterHome | null;
  propuestas: PropuestaRecibida[];
}) {
  const t = useTranslations("acogida");
  const [tab, setTab] = useState<Tab>(existente ? "propuestas" : "registro");

  const nuevas = propuestas.filter((p) => p.status === "enviada").length;

  return (
    <div className="mt-8">
      <div role="tablist" className="flex gap-2 border-b border-border">
        <TabBoton activa={tab === "propuestas"} onClick={() => setTab("propuestas")}>
          {t("tabPropuestas")}
          {nuevas > 0 && (
            <span className="ml-2 rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
              {t("propuestasNuevas", { n: nuevas })}
            </span>
          )}
        </TabBoton>
        <TabBoton activa={tab === "registro"} onClick={() => setTab("registro")}>
          {t("tabRegistro")}
        </TabBoton>
      </div>

      <div className="mt-6">
        {tab === "propuestas" ? (
          existente ? (
            <PropuestasRecibidas propuestas={propuestas} />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <p className="max-w-md text-muted-foreground">{t("propuestasSinRegistro")}</p>
              <button
                type="button"
                onClick={() => setTab("registro")}
                className="inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
              >
                {t("propuestasSinRegistroCta")}
              </button>
            </div>
          )
        ) : (
          <AcogidaForm userId={userId} existente={existente} />
        )}
      </div>
    </div>
  );
}

function TabBoton({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={cn(
        "-mb-px inline-flex items-center border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
        activa
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
