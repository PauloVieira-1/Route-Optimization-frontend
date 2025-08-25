import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";

interface RoutingProps {
  route: [number, number][];
  color?: string;
}

const RoutingMachine: React.FC<RoutingProps> = ({ route, color = "blue" }) => {
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

    }).addTo(map);

    // Additional CSS to hide any remaining elements
    const style = document.createElement('style');
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
  }, [map, route, color]);

  return null;
};

export default RoutingMachine;
