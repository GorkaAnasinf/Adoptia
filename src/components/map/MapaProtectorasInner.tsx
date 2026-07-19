"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useTranslations } from "next-intl";
import type { ShelterMapResult } from "./ListaProtectoras";
import { popupHtml } from "./popup";

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

const ESPANA_CENTER: [number, number] = [40.4165, -3.7026];

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
  const [marcadoresListos, setMarcadoresListos] = useState(0);

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup();
    clusterRef.current = clusterGroup;
    markersRef.current = new Map();

    for (const s of shelters) {
      const marker = L.marker([s.lat, s.lng], { icon, alt: s.name });
      marker.bindPopup(
        popupHtml(s, {
          animales: t("animales", { count: s.animal_count }),
          verProtectora: t("verProtectora"),
        }),
        { minWidth: 220 },
      );
      marker.on("click", () => onSelect(s.id));
      marker.on("mouseover", () => onHover?.(s.id));
      marker.on("mouseout", () => onHover?.(null));
      clusterGroup.addLayer(marker);
      markersRef.current.set(s.id, marker);
    }

    map.addLayer(clusterGroup);
    setMarcadoresListos((v) => v + 1);

    if (shelters.length > 0) {
      const bounds = L.latLngBounds(shelters.map((s) => [s.lat, s.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    return () => {
      map.removeLayer(clusterGroup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelters, map]);

  // Hover: solo asoma el popup si el marcador ya está a la vista. NO mueve el
  // mapa — que el mapa salte cada vez que el ratón cruza la lista es mareante.
  useEffect(() => {
    if (!hoveredId) return;
    markersRef.current.get(hoveredId)?.openPopup();
  }, [hoveredId, marcadoresListos]);

  // Selección (clic): esta sí acerca. Si el marcador está dentro de un cluster
  // NO está en el mapa y `openPopup()` no hace nada, así que seleccionar una
  // protectora agrupada con otra cercana no mostraba absolutamente nada
  // (encontrado al sanear los E2E, BUG-008). `zoomToShowLayer` acerca hasta
  // deshacer el cluster y entonces abre el popup.
  //
  // `marcadoresListos` en las dependencias: sin él, seleccionar ANTES de que el
  // mapa terminara de montar no hacía nada nunca — el efecto buscaba un
  // marcador que aún no existía y no volvía a intentarlo. Pasa de verdad: la
  // lista la pinta el servidor y el mapa entra por `dynamic import`.
  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    const cluster = clusterRef.current;
    if (cluster) cluster.zoomToShowLayer(marker, () => marker.openPopup());
    else marker.openPopup();
  }, [selectedId, marcadoresListos]);

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
