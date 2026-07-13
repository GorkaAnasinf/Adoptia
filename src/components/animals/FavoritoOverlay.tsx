"use client";

import { FavoritoButton } from "./FavoritoButton";

/**
 * Corazón de favorito superpuesto en la tarjeta del listado. El wrapper corta
 * el clic hacia el Link padre para que marcar favorito no navegue a la ficha.
 * Vive en su propio componente cliente porque `AnimalCard` es Server Component.
 */
export function FavoritoOverlay({ animalId }: { animalId: string }) {
  return (
    <div
      className="absolute right-2 top-2"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <FavoritoButton animalId={animalId} />
    </div>
  );
}
