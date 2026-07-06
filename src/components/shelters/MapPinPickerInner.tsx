"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";

// Iconos de Leaflet vía CDN de unpkg (los assets por defecto no resuelven con bundler).
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Coords = { lat: number; lng: number };

function Recentrar({ center }: { center: Coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center, map]);
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
      className="h-72 w-full rounded-xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">${"OpenStreetMap"}</a>`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recentrar center={value} />
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
