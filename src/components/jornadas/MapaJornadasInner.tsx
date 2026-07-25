"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { JornadaMapa } from "./tipos";

const ESPANA_CENTER: [number, number] = [40.4165, -3.7026];

export default function MapaJornadasInner({ jornadas }: { jornadas: JornadaMapa[] }) {
  return (
    <MapContainer center={ESPANA_CENTER} zoom={6} className="h-full w-full rounded-2xl" scrollWheelZoom>
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">${"OpenStreetMap"}</a>`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {jornadas.map((j) => (
        <CircleMarker
          key={j.id}
          center={[j.lat, j.lng]}
          radius={9}
          pathOptions={{ color: "#b23a48", fillColor: "#b23a48", fillOpacity: 0.7 }}
        >
          <Popup>
            <span className="block font-heading text-sm font-semibold">{j.title}</span>
            {j.city && <span className="block text-xs text-muted-foreground">{j.city}</span>}
            <Link href={`/jornadas/${j.id}`} className="text-xs font-semibold text-primary underline">
              {j.shelter_name}
            </Link>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
