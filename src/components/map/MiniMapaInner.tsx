"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

// Recalcula el tamaño cuando el contenedor pudo montar con dimensión 0
// (dynamic import), evitando tiles grises.
function AjustarTamano() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export type PuntoExtra = { id: string; lat: number; lng: number; etiqueta?: string };

export default function MiniMapaInner({
  lat,
  lng,
  extras = [],
}: {
  lat: number;
  lng: number;
  extras?: PuntoExtra[];
}) {
  // Con avistamientos el mapa deja de ser decorativo: hay que poder moverlo.
  const interactivo = extras.length > 0;
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      className={`isolate w-full overflow-hidden rounded-xl ${interactivo ? "h-64" : "h-44"}`}
      scrollWheelZoom={false}
      dragging={interactivo}
      zoomControl={interactivo}
    >
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">${"OpenStreetMap"}</a>`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarTamano />
      <Marker icon={icon} position={[lat, lng]} interactive={false} />
      {extras.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={8}
          pathOptions={{ color: "#396662", fillColor: "#7fb5a6", fillOpacity: 0.8, weight: 2 }}
        >
          {p.etiqueta && <Tooltip>{p.etiqueta}</Tooltip>}
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
