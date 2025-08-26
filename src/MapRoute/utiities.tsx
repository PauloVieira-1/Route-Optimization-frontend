import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import type { LatLngTuple } from "leaflet";
import type { Customer } from "../types";
import InputValidator from "../validator";

// This file contains various utility functions that are used throughout the MapRoute component.
//
// The functions are:
//
// - get_date_time: Returns the current date and time as a string in the format "YYYYMMDDHHMMSS".
// - getLatLng: Returns a LatLng object from a given array of coordinates.
// - getLngLat: Returns an array of coordinates from a given LatLng object.
// - getFirstLatLng: Returns the first LatLng object from a given array of coordinates.
// - redIcon and blueIcon: Returns a custom icon for a marker.

/**
 * Returns the current date and time as a string in the format "YYYYMMDDHHMMSS".
 *
 * This is used to generate a unique name for the scenario file.
 *
 * @returns {string} The current date and time as a string.
 */
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

/**
 * Returns the current date as a string in the format "YYYY-MM-DD".
 *
 * This is used to set the initial date when creating a new scenario.
 *
 * @returns {string} The current date as a string.
 */
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a LatLngTuple (an array of two numbers, [latitude, longitude])
 * from an object with customer_x and customer_y properties.
 * This order is required by the Leaflet routing machine.
 *
 * @param {Object} c - An object with customer_x and customer_y properties.
 * @returns {LatLngTuple} A LatLngTuple representing the coordinates.
 */
const getLatLng = (c: {
  customer_x: number;
  customer_y: number;
}): LatLngTuple => [
  c.customer_x, // latitude
  c.customer_y, // longitude
];

/**
 * Returns a LatLngTuple (an array of two numbers, [longitude, latitude])
 * from an object with customer_x and customer_y properties.
 * This order is required by the OSRM API.
 *
 * @param {Object} c - An object with customer_x and customer_y properties.
 * @returns {LatLngTuple} A LatLngTuple representing the coordinates.
 */
const getLngLat = (c: {
  customer_x: number;
  customer_y: number;
}): LatLngTuple => [
  c.customer_y, // longitude
  c.customer_x, // latitude
];

/**
 * Returns a LatLngTuple (an object with lat and lng properties)
 * from an object with depot_x and depot_y properties.
 * This order is required by the Leaflet routing machine.
 *
 * @param {Object} c - An object with depot_x and depot_y properties.
 * @returns {LatLngTuple} A LatLngTuple representing the coordinates.
 */
const getLatLngDepot = (c: {
  depot_x: number;
  depot_y: number;
}): LatLngTuple => [c.depot_x, c.depot_y];

/**
 * Returns a LatLngTuple (an object with lat and lng properties)
 * from an object with depot_x and depot_y properties.
 * This order is required by the OSRM API.
 *
 * @param {Object} c - An object with depot_x and depot_y properties.
 * @returns {LatLngTuple} A LatLngTuple representing the coordinates.
 */
const getLngLatDepot = (d: {
  depot_x: number;
  depot_y: number;
}): LatLngTuple => [d.depot_y, d.depot_x];

/**
 * Returns the first LatLng object from an array of customers.
 *
 * If the array is empty, this function returns the default coordinates (54.526, 18.5318).
 *
 * @param {Customer[]} customers - An array of customers.
 * @returns {[number, number]} The first LatLng object from the array.
 */
const getFirstLatLng = (customers: Customer[]): [number, number] => {
  if (customers.length === 0) {
    return [54.526, 18.5318]; // default coordinates
  }
  return [customers[0].customer_x, customers[0].customer_y];
};

interface depotCoords {
  depot_x: number; // latitude
  depot_y: number; // longitude
}

interface customerCoords {
  customer_x: number; // latitude
  customer_y: number; // longitude
}

/**
 * Fetches the cost matrix from the OSRM API.
 *
 * The cost matrix is a 2D array where `costMatrix[i][j]` is the cost of traveling
 * from the `i`-th depot to the `j`-th customer. If the customer is unreachable
 * from the depot, `costMatrix[i][j]` is `Infinity`.
 *
 * If the OSRM API is unavailable or returns an error, this function will fall
 * back to calculating the cost matrix using Euclidean distance.
 *
 * @param {depotCoords[]} depots - Array of depot coordinates.
 * @param {customerCoords[]} customers - Array of customer coordinates.
 * @returns {Promise<number[][]>} The cost matrix as a 2D array.
 */

/**
 * Fetches the cost matrix from the OSRM API or calculates it using Euclidean distance
 * as a fallback.
 *
 * The cost matrix is a 2D array where `costMatrix[i][j]` is the cost of traveling
 * from the `i`-th depot to the `j`-th customer. If the customer is unreachable
 * from the depot, `costMatrix[i][j]` is `Infinity`.
 *
 * @param {depotCoords[]} depots - Array of depot coordinates.
 * @param {customerCoords[]} customers - Array of customer coordinates.
 * @returns {Promise<number[][]>} The cost matrix as a 2D array.
 */
const getCostMatrix = async (
  depots: depotCoords[],
  customers: customerCoords[],
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
    const matrix: number[][] = data.distances
      .slice(0, depots.length)
      .map((row: number[]) => row.slice(depots.length));

    const infMatrix = matrix.map((row) =>
      row.map((d) => (d === null ? Infinity : d)),
    );
    console.log("OSRM distances:", infMatrix);
    // Replace null (unreachable) with Infinity
    return infMatrix;
  } catch (error) {
    console.error("Failed to fetch route:", error);
    InputValidator.addError("Failed to fetch route");

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

// Icons

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

export {
  get_date_time,
  redIcon,
  blueIcon,
  getLatLng,
  getLngLat,
  getFirstLatLng,
  getLatLngDepot,
  getCostMatrix,
  getCurrentDate,
  getLngLatDepot,
};
