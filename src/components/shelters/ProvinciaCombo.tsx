"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROVINCIAS } from "@/lib/provincias";
import { cn } from "@/lib/utils";

function normaliza(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Combo escribible sobre la lista fija de provincias (sin depender de datalist). */
export function ProvinciaCombo({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activo, setActivo] = useState(-1);
  const contenedor = useRef<HTMLDivElement>(null);

  const filtro = normaliza(value);
  const opciones = filtro
    ? PROVINCIAS.filter((p) => normaliza(p).includes(filtro))
    : [...PROVINCIAS];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function elegir(p: string) {
    onChange(p);
    setOpen(false);
    setActivo(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActivo((i) => (i + 1) % Math.max(opciones.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i <= 0 ? opciones.length - 1 : i - 1));
    } else if (e.key === "Enter" && open && activo >= 0 && opciones[activo]) {
      e.preventDefault();
      elegir(opciones[activo]);
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
            onChange(e.target.value);
            setOpen(true);
            setActivo(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />

        {open && opciones.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg"
          >
            {opciones.map((p, i) => {
              const seleccionada = normaliza(p) === filtro;
              return (
                <li key={p}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activo}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => elegir(p)}
                    onMouseEnter={() => setActivo(i)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm",
                      i === activo ? "bg-accent" : "hover:bg-accent",
                    )}
                  >
                    {p}
                    {seleccionada && <Check className="size-4 text-tertiary" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
