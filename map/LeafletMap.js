import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";

const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61168.png",
  iconSize: [40, 40],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [35, 35],
});

export default function LeafletMap({ busData, userLocation }) {
  // Prevent bad/undefined coordinates
  if (!busData.lat || !busData.lng) return <h3>Waiting for bus…</h3>;

  const routeCoords = useMemo(() => {
    const list = [];
    if (busData.startPoint) list.push([busData.startPoint.lat, busData.startPoint.lng]);
    if (busData.stops) busData.stops.forEach((s) => list.push([s.lat, s.lng]));
    if (busData.endPoint) list.push([busData.endPoint.lat, busData.endPoint.lng]);
    return list;
  }, [busData]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[busData.lat, busData.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Bus Marker */}
        <Marker position={[busData.lat, busData.lng]} icon={busIcon} />

        {/* User Marker */}
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userIcon}
        />

        {/* Route Highlight */}
        {routeCoords.length > 1 && (
          <Polyline positions={routeCoords} color="blue" weight={5} />
        )}
      </MapContainer>
    </div>
  );
}