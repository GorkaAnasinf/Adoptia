"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";

// Iconos servidos desde el propio dominio (public/leaflet) — sin CDN, compatibles
// con la CSP (los assets por defecto de Leaflet no resuelven con el bundler).
const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

type Coords = { lat: number; lng: number };

function Recentrar({ center }: { center: Coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
}

// Recalcula el tamaño cuando el contenedor pudo montar con dimensión 0
// (dynamic import / paso recién visible), evitando tiles grises.
function AjustarTamano() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapPinPickerInner({
  value,
  onChange,
}: {
  value: Coords;
  onChange: (c: Coords) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  return (
    <MapContainer
      center={[value.lat, value.lng]}
      zoom={15}
      className="isolate h-72 w-full overflow-hidden rounded-xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">${"OpenStreetMap"}</a>`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recentrar center={value} />
      <AjustarTamano />
      <Marker
        draggable
        icon={icon}
        position={[value.lat, value.lng]}
        ref={markerRef}
        eventHandlers={{
          dragend() {
            const m = markerRef.current;
            if (m) {
              const { lat, lng } = m.getLatLng();
              onChange({ lat, lng });
            }
          },
        }}
      />
    </MapContainer>
  );
}
