import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { Customer } from "../types";

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

const customerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
  color: "red",
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

const getFirstLatLng = (customers: Customer[]): [number, number] => {
  if (customers.length === 0) {
    return [54.526, 18.5318];
  }
  return [customers[0].customer_x, customers[0].customer_y];
};

export {
  get_date_time,
  customerIcon,
  ZoomTopRight,
  getLatLng,
  getLngLat,
  getFirstLatLng,
};
