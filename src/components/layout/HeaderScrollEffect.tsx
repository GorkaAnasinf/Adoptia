"use client";

import { useEffect } from "react";

/**
 * Marca el header con `data-scrolled` a partir de 20 px de scroll para que
 * el CSS lo compacte y le dé sombra. No renderiza nada.
 */
export function HeaderScrollEffect() {
  useEffect(() => {
    const header = document.querySelector("header[data-app-header]");
    if (!header) return;
    const alScroll = () => header.toggleAttribute("data-scrolled", window.scrollY > 20);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  return null;
}
