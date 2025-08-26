import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";
import InputValidator from "../validator";

interface RoutingProps {
  route: [number, number][];
  color?: string;
  inputValidator?: InputValidator;
}

const RoutingMachine: React.FC<RoutingProps> = ({ route, color = "blue", inputValidator }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || route.length < 2) return;

    // Reset errors for this routing attempt
    inputValidator?.resetErrors();

    // Pre-validate coordinates before attempting routing
    const invalidCoords = route.filter(([lat, lng], index) => {
      // Check for invalid coordinate values
      if (isNaN(lat) || isNaN(lng)) {
        inputValidator?.addError(`Waypoint ${index + 1}: Invalid coordinates (${lat}, ${lng})`);
        return true;
      }
      
      // Check coordinate bounds (valid lat/lng ranges)
      if (lat < -90 || lat > 90) {
        inputValidator?.addError(`Waypoint ${index + 1}: Invalid latitude ${lat} (must be between -90 and 90)`);
        return true;
      }
      
      if (lng < -180 || lng > 180) {
        inputValidator?.addError(`Waypoint ${index + 1}: Invalid longitude ${lng} (must be between -180 and 180)`);
        return true;
      }

      return false;
    });

    if (invalidCoords.length > 0) {
      inputValidator?.addError("Cannot generate route: Invalid coordinates detected.");
      return;
    }


    const control = L.Routing.control({
      waypoints: route.map(([lat, lng]) => L.latLng(lat, lng)),
      lineOptions: { styles: [{ color, weight: 5 }] },
      addWaypoints: false,
      createMarker: () => null,
      routeWhileDragging: false,
      collapsible: false,
      show: false,
      itinerary: false,
      fitSelectedRoutes: false,
    }) as any;

    // Add timeout for routing requests
    let routingTimeout: NodeJS.Timeout;

    const cleanup = () => {
      if (routingTimeout) clearTimeout(routingTimeout);
      try {
        map.removeControl(control);
      } catch (e) {
        // Control might already be removed
      }
    };

    const handleRoutesFound = (e: any) => {
      if (routingTimeout) clearTimeout(routingTimeout);
      
      const routeObj = e.routes?.[0];

      // If OSRM returned nothing, consider it a full failure
      if (!routeObj || !routeObj.coordinates || routeObj.coordinates.length === 0) {
        inputValidator?.addError("No route could be generated between customers and depots.");
        cleanup();
        return;
      }

      // Check if route is too short (indicates same point routing)
      if (routeObj.coordinates.length < 3) {
        inputValidator?.addError("Route is invalid: waypoints appear to be at the same location.");
        cleanup();
        return;
      }

      // Check total route distance - if too short, likely invalid
      const totalDistance = routeObj.summary?.totalDistance || 0;
      if (totalDistance < 100) { // Less than 100 meters total
        inputValidator?.addError("Waypoints may be identical or invalid.");
        cleanup();
        return;
      }

      // Check each waypoint to see if it was properly snapped
      let allWaypointsValid = true;
      const maxSnapDistance = 5000; // 5km maximum snap distance

      route.forEach(([lat, lng], i) => {
        const originalPoint = L.latLng(lat, lng);
        const snapped = routeObj.waypoints?.[i]?.latLng;
        
        if (!snapped) {
          inputValidator?.addError(`Waypoint ${i + 1} (${lat.toFixed(4)}, ${lng.toFixed(4)}) is unreachable by road.`);
          allWaypointsValid = false;
          return;
        }

        const snapDistance = map.distance(originalPoint, snapped);
        
        // Check if waypoint was snapped too far (likely in ocean/invalid area)
        if (snapDistance > maxSnapDistance) {
          inputValidator?.addError(
            `Waypoint ${i + 1} (${lat.toFixed(4)}, ${lng.toFixed(4)}) is too far from any road. ` +
            `Nearest road is ${(snapDistance / 1000).toFixed(1)}km away. ` +
            `This location may be in the ocean or an inaccessible area.`
          );
          allWaypointsValid = false;

          // Highlight unreachable waypoint on map
          L.circleMarker([lat, lng], {
            radius: 8,
            color: "red",
            fillColor: "red",
            fillOpacity: 0.8,
            weight: 2
          })
            .addTo(map)
            .bindTooltip(`Waypoint ${i + 1}: Unreachable (${(snapDistance / 1000).toFixed(1)}km from road)`, {
              permanent: false,
              direction: 'top'
            });
        }
      });

      // Additional validation: check if route segments are reasonable
      const routeCoords = routeObj.coordinates;
      let hasUnreasonableSegments = false;

      for (let i = 0; i < routeCoords.length - 1; i++) {
        const segmentDistance = map.distance(
          L.latLng(routeCoords[i].lat, routeCoords[i].lng),
          L.latLng(routeCoords[i + 1].lat, routeCoords[i + 1].lng)
        );
        
        // If any segment is extremely long, it might indicate ocean crossing or invalid routing
        if (segmentDistance > 100000) { // 100km segments are suspicious
          hasUnreasonableSegments = true;
          break;
        }
      }

      if (hasUnreasonableSegments) {
        inputValidator?.addError("Route contains unreasonable segments (possible ocean crossing). Check if coordinates are on land.");
        allWaypointsValid = false;
      }

      // If any waypoint is invalid, remove the route
      if (!allWaypointsValid) {
        cleanup();
        inputValidator?.addError("No valid route exists connecting all customers and depots.");
      } else {
        console.log("✅ Valid route found covering all waypoints:", {
          distance: `${(totalDistance / 1000).toFixed(2)}km`,
          waypoints: route.length,
          coordinates: routeObj.coordinates.length
        });
      }
    };

    const handleRoutingError = (e: any) => {
      if (routingTimeout) clearTimeout(routingTimeout);
      
      let errorMessage = "Routing failed: ";
      
      if (e.error?.message) {
        errorMessage += e.error.message;
      } else if (typeof e === 'string') {
        errorMessage += e;
      } else {
        errorMessage += "Unknown routing error. Coordinates may be in inaccessible areas.";
      }
      
      // Add specific guidance for common issues
      if (errorMessage.includes('No route found') || errorMessage.includes('Cannot find')) {
        errorMessage += " This often occurs when coordinates are in the ocean or other inaccessible areas.";
      }
      
      inputValidator?.addError(errorMessage);
      cleanup();
    };

    // Set timeout for routing request (30 seconds)
    routingTimeout = setTimeout(() => {
      inputValidator?.addError("Routing request timed out. Coordinates may be in inaccessible areas.");
      cleanup();
    }, 30000);

    control.on("routesfound", handleRoutesFound);
    control.on("routingerror", handleRoutingError);

    try {
      control.addTo(map);
    } catch (error) {
      if (routingTimeout) clearTimeout(routingTimeout);
      inputValidator?.addError("Failed to initialize routing. Please check your coordinates.");
      return;
    }

    // Hide routing UI
    const style = document.createElement("style");
    style.innerHTML = `.leaflet-routing-container { display: none !important; }`;
    document.head.appendChild(style);

    return () => {
      if (routingTimeout) clearTimeout(routingTimeout);
      
      control.off("routesfound", handleRoutesFound);
      control.off("routingerror", handleRoutingError);
      
      try {
        map.removeControl(control);
        document.head.removeChild(style);
      } catch (e) {
        // Elements might already be removed
      }
    };
  }, [map, route, color]);

  return null;
};

export default RoutingMachine;