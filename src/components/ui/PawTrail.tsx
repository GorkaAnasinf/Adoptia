import { cn } from "@/lib/utils";

/** Una huella: almohadilla central + cuatro dedos. */
function Huella({ x, y, rotacion }: { x: number; y: number; rotacion: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotacion})`}>
      <ellipse cx="0" cy="3" rx="4.2" ry="3.4" />
      <ellipse cx="-4.6" cy="-2.6" rx="1.7" ry="2.3" />
      <ellipse cx="-1.6" cy="-4.4" rx="1.7" ry="2.3" />
      <ellipse cx="1.6" cy="-4.4" rx="1.7" ry="2.3" />
      <ellipse cx="4.6" cy="-2.6" rx="1.7" ry="2.3" />
    </g>
  );
}

/**
 * Separador decorativo de marca: huellas tenues cruzando la página, como si
 * un animal acabara de pasar. Puramente visual (aria-hidden).
 */
export function PawTrail({ className }: { className?: string }) {
  const pasos = [
    { x: 40, y: 26, rotacion: 78 },
    { x: 110, y: 12, rotacion: 84 },
    { x: 185, y: 28, rotacion: 74 },
    { x: 260, y: 10, rotacion: 86 },
    { x: 335, y: 26, rotacion: 76 },
    { x: 410, y: 12, rotacion: 84 },
    { x: 485, y: 28, rotacion: 72 },
    { x: 560, y: 12, rotacion: 85 },
  ];

  return (
    <div aria-hidden="true" className={cn("flex justify-center overflow-hidden", className)}>
      <svg
        viewBox="0 0 600 40"
        className="h-12 w-full max-w-2xl fill-primary opacity-20"
        focusable="false"
      >
        {pasos.map((paso) => (
          <Huella key={paso.x} {...paso} />
        ))}
      </svg>
    </div>
  );
}
