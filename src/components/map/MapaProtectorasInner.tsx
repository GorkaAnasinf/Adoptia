"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useTranslations } from "next-intl";
import type { ShelterMapResult } from "./ListaProtectoras";

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

const ESPANA_CENTER: [number, number] = [40.4165, -3.7026];

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(s: ShelterMapResult, animalesLabel: string, verProtectoraLabel: string): string {
  return `
    <div class="space-y-1">
      <p class="font-semibold">${escapeHtml(s.name)}</p>
      <p class="text-sm text-gray-600">${escapeHtml(s.city ?? "")}</p>
      <p class="text-sm text-gray-600">${escapeHtml(animalesLabel)}</p>
      <a href="/protectoras/${encodeURIComponent(s.slug)}" class="text-sm font-medium text-primary underline">
        ${escapeHtml(verProtectoraLabel)}
      </a>
    </div>
  `;
}

function ClusterLayer({
  shelters,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
}: {
  shelters: ShelterMapResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const map = useMap();
  const t = useTranslations("mapa");
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup();
    clusterRef.current = clusterGroup;
    markersRef.current = new Map();

    for (const s of shelters) {
      const marker = L.marker([s.lat, s.lng], { icon, alt: s.name });
      marker.bindPopup(popupHtml(s, t("animales", { count: s.animal_count }), t("verProtectora")));
      marker.on("click", () => onSelect(s.id));
      marker.on("mouseover", () => onHover?.(s.id));
      marker.on("mouseout", () => onHover?.(null));
      clusterGroup.addLayer(marker);
      markersRef.current.set(s.id, marker);
    }

    map.addLayer(clusterGroup);

    if (shelters.length > 0) {
      const bounds = L.latLngBounds(shelters.map((s) => [s.lat, s.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    return () => {
      map.removeLayer(clusterGroup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelters, map]);

  useEffect(() => {
    const activeId = hoveredId ?? selectedId;
    if (!activeId) return;
    const marker = markersRef.current.get(activeId);
    marker?.openPopup();
  }, [selectedId, hoveredId]);

  return null;
}

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

export default function MapaProtectorasInner({
  shelters,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
}: {
  shelters: ShelterMapResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  return (
    <MapContainer
      center={ESPANA_CENTER}
      zoom={6}
      className="isolate h-full w-full"
      zoomControl
    >
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">${"OpenStreetMap"}</a>`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarTamano />
      <ClusterLayer
        shelters={shelters}
        selectedId={selectedId}
        onSelect={onSelect}
        hoveredId={hoveredId}
        onHover={onHover}
      />
    </MapContainer>
  );
}
