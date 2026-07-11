"use client";

import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { AvisoMapa } from "./tipos";

const ESPANA_CENTER: [number, number] = [40.4165, -3.7026];

// Distinción visual clara perdido/encontrado (criterio FEATURE-012):
// rojo = perdido, verde = encontrado.
const COLOR: Record<AvisoMapa["type"], string> = {
  lost: "#dc2626",
  found: "#059669",
};

export default function MapaAvisosInner({ avisos }: { avisos: AvisoMapa[] }) {
  const t = useTranslations("perdidos");
  const router = useRouter();

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
            <div className="flex flex-col gap-1">
              <strong>
                {t(a.type === "lost" ? "tipoLost" : "tipoFound")}
                {a.name ? ` — ${a.name}` : ""}
              </strong>
              {a.city && <span>{a.city}</span>}
              <button
                type="button"
                onClick={() => router.push(`/perdidos-encontrados/${a.id}`)}
                className="mt-1 text-left font-semibold text-primary underline"
              >
                {t("verAviso")}
              </button>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
