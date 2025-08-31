import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";

export interface RoutingErrorEvent extends L.LeafletEvent {
  error?: Error;
}

interface RoutingProps {
  route: [number, number][];
  color?: string;
  onError?: (err: RoutingErrorEvent) => void;
}

const RoutingMachine: React.FC<RoutingProps> = ({
  route,
  color = "blue",
  onError,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || route.length < 2) return;

    const control = L.Routing.control({
      waypoints: route.map((c) => L.latLng(c[0], c[1])),
      lineOptions: {
        styles: [{ color, weight: 5 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      addWaypoints: false,
      // @ts-expect-error createMarker exists at runtime but TS types are missing
      createMarker: () => null,
      routeWhileDragging: false,
      collapsible: false,
      show: false,
      itinerary: false,
      fitSelectedRoutes: false,
      router: new (L.Routing.OSRMv1 as unknown as typeof L.Routing.OSRMv1)({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        timeout: 10000,
      }),
    }).addTo(map);

    control.on("routingerror", (e: RoutingErrorEvent) => {
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
