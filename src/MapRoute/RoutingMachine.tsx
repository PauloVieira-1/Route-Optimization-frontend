import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";

interface RoutingProps {
  route: [number, number][];
  color?: string;
  onError?: (err: any) => void;   // callback for errors
}

const RoutingMachine: React.FC<RoutingProps> = ({ route, color = "blue", onError }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || route.length < 2) return;

    const control = L.Routing.control({
      waypoints: route.map((c) => L.latLng(c[0], c[1])),
      lineOptions: { styles: [{ color, weight: 5 }] },
      addWaypoints: false,
      createMarker: () => null,
      routeWhileDragging: false,
      collapsible: false,
      show: false,
      itinerary: false,
      fitSelectedRoutes: false,
      // ✅ Custom router with retries disabled
      router: new (L.Routing.OSRMv1 as any)({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        timeout: 10000, // 10s timeout
        retry: 0,       // ⬅️ disable retry logic
      }),
    }).addTo(map);

    // Listen for routing errors
    control.on("routingerror", (e) => {
      console.error("Routing error:", e);
      if (onError) onError(e);
    });

    // Hide default routing UI
    const style = document.createElement("style");
    style.innerHTML = `
      .leaflet-routing-container {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.removeControl(control);
      document.head.removeChild(style);
    };
  }, [map, route, color, onError]);

  return null;
};

export default RoutingMachine;
