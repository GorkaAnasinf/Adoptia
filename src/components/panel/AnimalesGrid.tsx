"use client";

import { ExternalLink, Mars, MoreVertical, PawPrint, Pencil, Plus, Search, Venus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import { FotoCarrusel } from "@/components/animals/FotoCarrusel";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/ui/Reveal";
import { edadAproximada } from "@/lib/animal-search";
import { ESTADOS, type AnimalStatus } from "@/lib/schemas/animal";
import { cn } from "@/lib/utils";

type Media = { url: string; is_cover: boolean; sort_order: number };
export type AnimalGridRow = {
  id: string;
  name: string;
  slug: string;
  sex: "male" | "female" | "unknown";
  breed: string | null;
  birth_date_approx: string | null;
  status: AnimalStatus;
  published_at: string | null;
  animal_media: Media[];
};

function portada(media: Media[]): string | null {
  if (!media || media.length === 0) return null;
  return (media.find((m) => m.is_cover) ?? [...media].sort((a, b) => a.sort_order - b.sort_order)[0]).url;
}

function normaliza(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function AnimalesGrid({
  animales,
  shelterVerified,
}: {
  animales: AnimalGridRow[];
  shelterVerified: boolean;
}) {
  const t = useTranslations("animales");
  const tb = useTranslations("busqueda");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<AnimalStatus | "all">("all");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; msg: string } | null>(null);

  const filtrados = useMemo(() => {
    const term = normaliza(q.trim());
    return animales.filter(
      (a) =>
        (filtro === "all" || a.status === filtro) &&
        (term === "" || normaliza(a.name).includes(term) || normaliza(a.breed ?? "").includes(term)),
    );
  }, [animales, q, filtro]);

  async function ejecutar(a: AnimalGridRow, init: RequestInit) {
    setBusyId(a.id);
    setErrorId(null);
    setMenuId(null);
    try {
      const res = await fetch(`/api/animales/${a.id}`, init);
      if (!res.ok) {
        setErrorId({ id: a.id, msg: res.status === 422 ? t("publishIncomplete") : t("actionError") });
        return;
      }
      router.refresh();
    } catch {
      setErrorId({ id: a.id, msg: t("actionError") });
    } finally {
      setBusyId(null);
    }
  }

  function cambiarVisibilidad(a: AnimalGridRow, accion: "publish" | "unpublish") {
    void ejecutar(a, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accion }),
    });
  }

  function eliminar(a: AnimalGridRow) {
    if (window.confirm(t("deleteConfirm", { name: a.name }))) {
      void ejecutar(a, { method: "DELETE" });
    }
  }

  const chips: Array<AnimalStatus | "all"> = ["all", ...ESTADOS];

  return (
    <div className="mt-6">
      {/* Buscador */}
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="rounded-full pl-9"
        />
      </div>

      {/* Filtros de estado */}
      <nav className="mt-4 flex flex-wrap gap-2" aria-label={t("colStatus")}>
        {chips.map((key) => {
          const activo = filtro === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                activo
                  ? "border-tertiary/40 bg-tertiary/12 text-tertiary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {key === "all" ? t("filterAll") : t(`status${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
            </button>
          );
        })}
      </nav>

      {filtrados.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">{t("searchEmpty")}</p>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {filtrados.map((a, i) => {
          const edad = edadAproximada(a.birth_date_approx);
          const subtitulo = [
            a.breed,
            edad ? tb(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n }) : null,
          ]
            .filter(Boolean)
            .join(" · ");
          const publicado = a.published_at != null;
          const foto = portada(a.animal_media);
          return (
            <li key={a.id}>
              <Reveal delayMs={Math.min(i, 8) * 60} className="h-full">
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-1">
                  <div className="relative aspect-square bg-muted">
                    {foto ? (
                      <FotoCarrusel
                        animalId={a.id}
                        coverUrl={foto}
                        alt=""
                        sizes="(max-width: 640px) 50vw, 12rem"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <PawPrint className="size-8" aria-hidden="true" />
                      </span>
                    )}
                    <span className="absolute left-2 top-2">
                      <AnimalStatusBadge status={a.status} onImage />
                    </span>
                    {!publicado && (
                      <span className="absolute right-2 top-2 rounded-full bg-stone-700/90 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                        {t("draft")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-heading font-semibold text-primary">
                          {a.name}
                          {a.sex === "male" && <Mars className="size-4 shrink-0 text-secondary" aria-label={t("sexMale")} role="img" />}
                          {a.sex === "female" && <Venus className="size-4 shrink-0 text-secondary" aria-label={t("sexFemale")} role="img" />}
                        </p>
                        {subtitulo && <p className="truncate text-sm text-muted-foreground">{subtitulo}</p>}
                      </div>
                      {/* Menú de acciones */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          aria-label={t("menuLabel")}
                          aria-haspopup="menu"
                          aria-expanded={menuId === a.id}
                          disabled={busyId === a.id}
                          onClick={() => setMenuId(menuId === a.id ? null : a.id)}
                          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <MoreVertical className="size-4" aria-hidden="true" />
                        </button>
                        {menuId === a.id && (
                          <>
                            <button
                              type="button"
                              aria-hidden="true"
                              tabIndex={-1}
                              className="fixed inset-0 z-10 cursor-default"
                              onClick={() => setMenuId(null)}
                            />
                            <div
                              role="menu"
                              className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-md"
                            >
                              {publicado ? (
                                <MenuItem onClick={() => cambiarVisibilidad(a, "unpublish")}>{t("unpublish")}</MenuItem>
                              ) : (
                                <MenuItem
                                  disabled={!shelterVerified}
                                  onClick={() => cambiarVisibilidad(a, "publish")}
                                >
                                  {t("publish")}
                                </MenuItem>
                              )}
                              <MenuItem destructive onClick={() => eliminar(a)}>
                                {t("delete")}
                              </MenuItem>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {errorId?.id === a.id && <p className="text-xs text-destructive">{errorId.msg}</p>}

                    <div className="mt-auto flex items-center gap-3 pt-1 text-sm font-semibold">
                      <Link
                        href={`/panel/animales/${a.id}`}
                        className="inline-flex items-center gap-1 text-tertiary hover:underline"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        {t("edit")}
                      </Link>
                      {publicado && (
                        <Link
                          href={`/animales/${a.slug}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {t("viewProfile")}
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}

        {/* Nueva mascota */}
        <li>
          <Link
            href="/panel/animales/nueva"
            aria-label={t("newAnimalCard")}
            className="flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="size-7" aria-hidden="true" />
            <span className="font-heading font-semibold">{t("newAnimalCard")}</span>
            <span className="text-xs">{t("newAnimalCardHelp")}</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  destructive = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}
