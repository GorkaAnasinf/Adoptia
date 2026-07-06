"use client";

import dynamic from "next/dynamic";

type Coords = { lat: number; lng: number };

// Leaflet toca `window`: dynamic import sin SSR (Decisión #8).
const Inner = dynamic(() => import("./MapPinPickerInner"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-muted" />,
});

export function MapPinPicker({ value, onChange }: { value: Coords; onChange: (c: Coords) => void }) {
  return <Inner value={value} onChange={onChange} />;
}
