"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DonacionForm, type Donacion } from "./DonacionForm";
import { DonacionRow } from "./DonacionRow";

type Tab = "publicar" | "lista";

/**
 * Área de donaciones del usuario en dos pestañas: publicar/editar (un único
 * formulario reutilizado) y la lista de ofertas. Editar una fila carga la
 * oferta en ese mismo formulario, sin duplicarlo.
 */
export function MisDonacionesCliente({
  userId,
  ofertas,
}: {
  userId: string;
  ofertas: Donacion[];
}) {
  const t = useTranslations("donaciones");
  const [tab, setTab] = useState<Tab>(ofertas.length > 0 ? "lista" : "publicar");
  const [editando, setEditando] = useState<Donacion | null>(null);

  function editar(oferta: Donacion) {
    setEditando(oferta);
    setTab("publicar");
  }

  function cerrarEdicion() {
    setEditando(null);
  }

  return (
    <div className="mt-8">
      <div role="tablist" className="flex gap-2 border-b border-border">
        <TabBoton activa={tab === "publicar"} onClick={() => setTab("publicar")}>
          {t("tabPublicar")}
        </TabBoton>
        <TabBoton activa={tab === "lista"} onClick={() => setTab("lista")}>
          {t("tabMisDonaciones")}
        </TabBoton>
      </div>

      <div className="mt-6">
        {tab === "publicar" ? (
          <DonacionForm
            // Remonta el formulario al cambiar de oferta (o volver a alta).
            key={editando?.id ?? "nueva"}
            userId={userId}
            existente={editando}
            onCerrar={editando ? cerrarEdicion : undefined}
          />
        ) : ofertas.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
            {t("miEmpty")}
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {ofertas.map((o) => (
                <DonacionRow key={o.id} oferta={o} onEditar={editar} />
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">{t("caducaInfo")}</p>
          </>
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
