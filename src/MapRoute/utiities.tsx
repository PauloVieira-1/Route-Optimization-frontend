import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet-routing-machine";
import { useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { Customer, Depot } from "../types";

const get_date_time = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const ZoomTopRight = () => {
  const map = useMap();
  useEffect(() => {
    map.zoomControl.setPosition("topright");
  }, [map]);
  return null;
};

const getLatLng = (c: {
  customer_x: number;
  customer_y: number;
}): LatLngTuple => [
  c.customer_x, // latitude
  c.customer_y, // longitude
];

const getLngLat = (c: {
  customer_x: number;
  customer_y: number;
}): LatLngTuple => [
  c.customer_y, // longitude
  c.customer_x, // latitude
];

const getLatLngDepot = (c: {
  depot_x: number;
  depot_y: number;
}): LatLngTuple => ({
  lat: c.depot_x, // latitude
  lng: c.depot_y, // longitude
});

const getFirstLatLng = (customers: Customer[]): [number, number] => {
  if (customers.length === 0) {
    return [54.526, 18.5318];
  }
  return [customers[0].customer_x, customers[0].customer_y];
};

interface Depot {
  depot_x: number; // latitude
  depot_y: number; // longitude
}

interface Customer {
  customer_x: number; // latitude
  customer_y: number; // longitude
}

const getCostMatrix = async (
  depots: Depot[],
  customers: Customer[],
): Promise<number[][]> => {
  // Build coordinate strings in OSRM format: lng,lat
  const depotCoords = depots.map((d) => `${d.depot_y},${d.depot_x}`).join(";");
  const customerCoords = customers
    .map((c) => `${c.customer_y},${c.customer_x}`)
    .join(";");

  const url = `https://router.project-osrm.org/table/v1/driving/${depotCoords};${customerCoords}?annotations=distance`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.distances) throw new Error("No distances returned from OSRM");

    // OSRM returns a 2D array: rows = depots, columns = all waypoints
    const matrix: number[][] = data.distances.slice(0, depots.length).map(
      (row) => row.slice(depots.length), // skip depot→depot part
    );

    const infMatrix = matrix.map((row) =>
      row.map((d) => (d === null ? Infinity : d)),
    );
    console.log("OSRM distances:", infMatrix);
    // Replace null (unreachable) with Infinity
    return infMatrix;
  } catch (err) {
    console.error("Error fetching OSRM distances:", err);

    // fallback: Euclidean distance
    return depots.map((depot) =>
      customers.map((customer) =>
        Math.round(
          Math.hypot(
            depot.depot_x - customer.customer_x,
            depot.depot_y - customer.customer_y,
          ) * 111000, // approx meters
        ),
      ),
    );
  }
};

export {
  get_date_time,
  redIcon,
  blueIcon,
  ZoomTopRight,
  getLatLng,
  getLngLat,
  getFirstLatLng,
  getLatLngDepot,
  getCostMatrix,
};
