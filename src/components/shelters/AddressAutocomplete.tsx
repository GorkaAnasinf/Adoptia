"use client";

import { Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Sugerencia } from "@/lib/geocoding";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: Sugerencia) => void;
  placeholder?: string;
  searchingLabel: string;
  noResultsLabel: string;
  /** "address" (por defecto) o "place" (municipios). */
  tipo?: "address" | "place";
  /** Contexto que se añade a la búsqueda sin mostrarse (p. ej. provincia/ciudad). */
  contexto?: string;
};

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  searchingLabel,
  noResultsLabel,
  tipo = "address",
  contexto = "",
}: Props) {
  const [items, setItems] = useState<Sugerencia[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activo, setActivo] = useState(-1);
  const listboxId = useId();
  // Solo se busca cuando el usuario escribe en ESTA caja (no al precargar el
  // borrador ni al cambiar el contexto de otra caja como la provincia).
  const tecleando = useRef(false);
  const contextoRef = useRef(contexto);
  contextoRef.current = contexto;
  const contenedor = useRef<HTMLDivElement>(null);

  // Búsqueda con debounce, disparada solo por el tecleo del usuario.
  useEffect(() => {
    if (!tecleando.current) return;
    const q = value.trim();
    if (q.length < 3) {
      setItems([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const ctx = contextoRef.current.trim();
        const busqueda = ctx ? `${q} ${ctx}` : q;
        const res = await fetch(
          `/api/protectoras/direcciones?q=${encodeURIComponent(busqueda)}&tipo=${tipo}`,
          { signal: ctrl.signal },
        );
        const body = (await res.json()) as { data?: Sugerencia[] };
        setItems(body.data ?? []);
        setOpen(true);
        setActivo(-1);
      } catch {
        // abortado o red caída: sin sugerencias
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, tipo]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function elegir(s: Sugerencia) {
    tecleando.current = false;
    onSelect(s);
    setOpen(false);
    setItems([]);
    setActivo(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && activo >= 0) {
      e.preventDefault();
      elegir(items[activo]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={contenedor}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => {
            tecleando.current = true;
            onChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg"
          >
            {items.length === 0 && !loading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{noResultsLabel}</li>
            ) : (
              items.map((s, i) => (
                <li key={`${s.label}-${i}`} role="option" aria-selected={i === activo}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => elegir(s)}
                    onMouseEnter={() => setActivo(i)}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                      i === activo ? "bg-accent" : "hover:bg-accent",
                    )}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>{s.label}</span>
                  </button>
                </li>
              ))
            )}
            {loading && items.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">{searchingLabel}</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
