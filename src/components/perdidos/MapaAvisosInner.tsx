"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { PopupAviso } from "./PopupAviso";
import { type AvisoMapa, COLOR_AVISO as COLOR } from "./tipos";

const ESPANA_CENTER: [number, number] = [40.4165, -3.7026];

export default function MapaAvisosInner({ avisos }: { avisos: AvisoMapa[] }) {
  return (
    <MapContainer
      center={ESPANA_CENTER}
      zoom={6}
      className="h-full w-full rounded-2xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">${"OpenStreetMap"}</a>`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {avisos.map((a) => (
        <CircleMarker
          key={a.id}
          center={[a.lat, a.lng]}
          radius={9}
          pathOptions={{ color: COLOR[a.type], fillColor: COLOR[a.type], fillOpacity: 0.7 }}
        >
          <Popup>
            <PopupAviso aviso={a} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
