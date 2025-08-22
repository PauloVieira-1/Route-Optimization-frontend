import { useEffect } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import 'leaflet-routing-machine';import { useMap } from "react-leaflet";
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
})

const getFirstLatLng = (customers: Customer[] ): [number, number] => {
  if (customers.length === 0) {
    return [54.526, 18.5318];
  }
  return [customers[0].customer_x, customers[0].customer_y];
};


const getRouteDistance = async (
  from: { lng: number; lat: number } | undefined,
  to: { lng: number; lat: number } | undefined
): Promise<number> => {
  if (!from || !to) throw new Error("Missing coordinates");
  if (isNaN(from.lat) || isNaN(from.lng) || isNaN(to.lat) || isNaN(to.lng))
    throw new Error("Invalid coordinates");

  return new Promise((resolve, reject) => {
    const router = new L.Routing.OSRMv1();

    console.log("from", from, "to", to);
    router.route(
      {
        // Leaflet expects (lat, lng), so we swap here
        waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
        geometryOnly: true,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.routes[0].distance);
        }
      }
    );
  });
};

const getCostMatrix = async (depots: Depot[], customers: Customer[]): Promise<number[][]> => {
  const matrix: number[][] = [];

  for (const depot of depots) {
    console.log(depot);
    if (depot.depot_x == null || depot.depot_y == null) continue; // skip invalid depot
    const row: number[] = [];
    for (const customer of customers) {
      if (customer.customer_x == null || customer.customer_y == null) {
        row.push(Infinity); // mark as unreachable
        continue;
      }
      try {
        // Swapped x and y to match Leaflet's (lat, lng)
        const dist = await getRouteDistance(
          { lat: depot.depot_x, lng: depot.depot_y },
          { lat: customer.customer_x, lng: customer.customer_y }
        );
        row.push(Math.round(dist));
      } catch {
        row.push(Infinity); // mark as unreachable
      }
    }
    matrix.push(row);
  }
  console.log(matrix);

  return matrix;
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
  getCostMatrix
};
