"use client";

import { CornerDownLeft, PawPrint, Search, Star, FileText, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { filtrarSecciones, type RolPrivado } from "@/lib/command-sections";
import type { ResultadoBusqueda } from "@/app/api/buscar/route";
import { cn } from "@/lib/utils";

type Opcion = {
  grupo: "seccion" | "animal" | "solicitud" | "favorito";
  label: string;
  sub: string | null;
  href: string;
};

const ICONO: Record<Opcion["grupo"], typeof Search> = {
  seccion: Compass,
  animal: PawPrint,
  solicitud: FileText,
  favorito: Star,
};

/** Buscador global del área privada (FEATURE-061): secciones + entidades por rol. */
export function CommandPalette({
  role,
  open,
  onClose,
}: {
  role: RolPrivado;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("shell");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [remotos, setRemotos] = useState<ResultadoBusqueda[]>([]);
  const [activo, setActivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Secciones (cliente, instantáneo) filtradas por el término.
  const secciones = useMemo(
    () => filtrarSecciones(role, q, (k) => t(k)),
    [role, q, t],
  );

  // Reinicia al abrir y lleva el foco al input.
  useEffect(() => {
    if (open) {
      setQ("");
      setRemotos([]);
      setActivo(0);
      inputRef.current?.focus();
    }
  }, [open]);

  // Búsqueda remota debounced (entidades por rol). Vacía con <2 caracteres.
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setRemotos([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(q.trim())}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const { data } = await res.json();
        setRemotos((data?.results as ResultadoBusqueda[]) ?? []);
      } catch {
        // abortada o error de red: se ignora
      }
    }, 220);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, open]);

  const opciones: Opcion[] = useMemo(() => {
    const secc: Opcion[] = secciones.map((s) => ({
      grupo: "seccion",
      label: s.label,
      sub: null,
      href: s.href,
    }));
    const ent: Opcion[] = remotos.map((r) => ({
      grupo: r.type,
      label: r.title,
      sub: r.subtitle,
      href: r.href,
    }));
    return [...secc, ...ent];
  }, [secciones, remotos]);

  // El índice activo nunca se sale de rango al cambiar la lista.
  useEffect(() => {
    setActivo((i) => Math.min(i, Math.max(0, opciones.length - 1)));
  }, [opciones.length]);

  function ir(op: Opcion | undefined) {
    if (!op) return;
    onClose();
    router.push(op.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => (i + 1) % Math.max(1, opciones.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i - 1 + opciones.length) % Math.max(1, opciones.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      ir(opciones[activo]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("searchTitle")}
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {opciones.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              {q.trim().length < 2 ? t("searchHint") : t("searchEmpty")}
            </li>
          ) : (
            opciones.map((op, i) => {
              const Icono = ICONO[op.grupo];
              return (
                <li key={`${op.grupo}-${op.href}-${i}`}>
                  <button
                    type="button"
                    onClick={() => ir(op)}
                    onMouseEnter={() => setActivo(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      i === activo ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <Icono className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{op.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {op.grupo === "seccion" ? t("searchGroupSection") : t(`searchGroup_${op.grupo}`)}
                    </span>
                    {i === activo && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
