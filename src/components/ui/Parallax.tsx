"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Desplaza a su hijo a una fracción de la velocidad del scroll (parallax
 * sutil). Solo actúa en desktop y bajo `motion-safe`; en el resto de casos es
 * un contenedor inerte.
 */
export function Parallax({
  children,
  factor = 0.4,
  className,
}: {
  children: React.ReactNode;
  factor?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    let raf = 0;
    const alScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        nodo.style.transform = `translateY(${window.scrollY * factor}px)`;
      });
    };
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScroll);
      cancelAnimationFrame(raf);
    };
  }, [factor]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
