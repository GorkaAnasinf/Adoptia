"use client";

import { useEffect, useRef, useState } from "react";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Contador que anima de 0 al valor real la primera vez que entra en viewport.
 * El DOM arranca y termina con el valor final: sin IntersectionObserver o con
 * `prefers-reduced-motion` no se anima nada.
 */
export function CountUp({ value, durationMs = 2000 }: { value: number; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mostrado, setMostrado] = useState(value);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || typeof IntersectionObserver === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    // A partir de aquí habrá animación: baja a 0 ya, para que al asomar la
    // sección no se vea el valor final un instante antes de arrancar.
    setMostrado(0);
    const observer = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        // el inicio se toma del primer frame (misma base de tiempos que el
        // rAF) con una pausa breve: si la banda ya es visible al cargar, la
        // subida no se pierde entre el pintado inicial de la página.
        let inicio: number | null = null;
        const RETARDO_MS = 350;
        const tick = (ahora: number) => {
          if (inicio === null) inicio = ahora + RETARDO_MS;
          const t = Math.min(Math.max((ahora - inicio) / durationMs, 0), 1);
          setMostrado(Math.round(easeOut(t) * value));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.2 },
    );
    observer.observe(nodo);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs]);

  return <span ref={ref}>{mostrado}</span>;
}
