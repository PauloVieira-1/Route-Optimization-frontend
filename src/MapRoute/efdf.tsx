import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaArrowRight,
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaHouseUser,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BsFillQuestionCircleFill } from "react-icons/bs";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import "./MapRoute.css";
import { Link, useParams } from "react-router-dom";
import type { Customer, Depot, Vehicle, Route } from "../types";
import {
  get_date_time,
  getLatLng,
  getLngLat,
  getFirstLatLng,
  redIcon,
  blueIcon,
  getLatLngDepot,
  getCostMatrix,
} from "./utiities";
import ZoomTopRight from "./ZoomtoRight";
import RoutingMachine from "./RoutingMachine";
import SpinnerComponent from "../Spinner/Spinner";
import InfoModal from "../InfoModal/InfoModal";
import InputValidator from "../validator";
import { validateModalInput } from "./validation";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const MapRoute = () => {
  const [routeCoords, setRouteCoords] = useState<Route[]>([]);
  const [isOverlayOpenPlus, setIsOverlayOpenPlus] = useState(true);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [title, setTitle] = useState("Scenario");
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [transportationProbelm, setTransportationProblem] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [infoModal, setInfoModal] = useState<boolean>(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [modalValidationError, setModalValidationError] = useState<string>("");

  // Customers, Depots, Vehicles states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mdvrpProblem, setMDVRPProblem] = useState<string>("");

  // Modal states
  const [showModal, setShowModal] = useState<"customer" | "depot" | "vehicle" | null>(null);

  const { id } = useParams<{ id: string }>();
  const scenarioId = parseInt(id || "", 10);

  const validCustomers = useMemo(
    () =>
      customers.filter(
        (c) => c.customer_x !== undefined && c.customer_y !== undefined,
      ),
    [customers],
  );

  const validDepots = useMemo(
    () =>
      depots.filter((d) => d.depot_x !== undefined && d.depot_y !== undefined),
    [depots],
  );

  const inputValidator = useMemo(() => new InputValidator(), []);

  // Input states for modal
  const [customerInput, setCustomerInput] = useState({
    customer_x: 0,
    customer_y: 0,
    demand: 0,
    customer_name: "",
  });
  const [depotInput, setDepotInput] = useState({
    depot_name: "",
    depot_x: 0,
    depot_y: 0,
    capacity: 0,
    maxDistance: 0,
    type: "",
  });
  const [vehicleInput, setVehicleInput] = useState({
    capacity: 0,
    depot_id: 0,
  });

  // FIXED: Modal validation function - only for single coordinate pairs
  const handleModalValidation = (lat: number, lng: number): boolean => {
    setModalValidationError("");
    const errorArray: string[] = [];
    const setErrorArray = (errors: string[]) => {
      errorArray.length = 0;
      errorArray.push(...errors);
    };
    try {
      const result = validateModalInput(lat, lng, customers, depots, errorArray, setErrorArray);
      if (!result && errorArray.length > 0) {
        setModalValidationError(errorArray[0]);
        return false;
      } else if (!result) {
        setModalValidationError("Invalid coordinates");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error in modal validation:", error);
      setModalValidationError("Validation function error");
      return false;
    }
  };

  // FIXED: Global validation function
  const validateAllCoordinates = () => {
    const errors: string[] = [];
    customers.forEach((customer) => {
      const errorArray: string[] = [];
      const setErrorArray = (errors: string[]) => {
        errorArray.length = 0;
        errorArray.push(...errors);
      };
      try {
        const result = validateModalInput(
          customer.customer_x,
          customer.customer_y,
          customers,
          depots,
          errorArray,
          setErrorArray
        );
        if (!result) {
          const errorMsg = errorArray.length > 0 ? errorArray[0] : "Invalid coordinates";
          errors.push(`ERROR: Customer "${customer.customer_name}" - ${errorMsg}`);
        }
      } catch (error) {
        errors.push(`ERROR: Customer "${customer.customer_name}" - Validation error`);
      }
    });

    depots.forEach((depot) => {
      const errorArray: string[] = [];
      const setErrorArray = (errors: string[]) => {
        errorArray.length = 0;
        errorArray.push(...errors);
      };
      try {
        const result = validateModalInput(
          depot.depot_x,
          depot.depot_y,
          customers,
          depots,
          errorArray,
          setErrorArray
        );
        if (!result) {
          const errorMsg = errorArray.length > 0 ? errorArray[0] : "Invalid coordinates";
          errors.push(`ERROR: Depot "${depot.depot_name}" - ${errorMsg}`);
        }
      } catch (error) {
        errors.push(`ERROR: Depot "${depot.depot_name}" - Validation error`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Load scenario data and validate on mount
  useEffect(() => {
    fetch("http://127.0.0.1:5100/scenarios_by_id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: scenarioId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data.customers);
        setDepots(data.depots);
        setVehicles(data.vehicles);
        setTitle(data.name);
        setCenter(getFirstLatLng(data.customers));
      })
      .catch((err) => {
        console.error("Fetch error:", err);
      });
  }, [scenarioId]);

  useEffect(() => {
    if (customers.length > 0 || depots.length > 0) {
      const timer = setTimeout(() => {
        validateAllCoordinates();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [customers, depots]);

  useEffect(() => {
    if (validCustomers.length < 2) return;

    const fetchRoute = async () => {
      const coordsString = validCustomers
        .map((c) => getLngLat(c).join(","))
        .join(";");

      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
          console.error("No route found");
          setRouteCoords([]);
          return;
        }

        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng],
        );

        setRouteCoords(coords);
      } catch (error) {
        console.error("Failed to fetch route:", error);
      }
    };

    fetchRoute();
  }, [validCustomers]);



  const addCustomer = () => {
    if (!handleModalValidation(customerInput.customer_x, customerInput.customer_y)) return;

    const current_id = get_date_time();
    fetch("http://127.0.0.1:5100/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...customerInput,
        scenario_id: scenarioId,
        customer_id: current_id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCustomers([...customers, { ...data, id: current_id }]);
        setCustomerInput({ customer_x: 0, customer_y: 0, demand: 0, customer_name: "" });
        setShowModal(null);
        setModalValidationError("");
      })
      .catch((err) => console.error("Failed to add customer:", err));
  };

  const removeCustomer = (id: number) => {
    fetch(`http://127.0.0.1:5100/customers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setCustomers(customers.filter((c) => c.id !== id));
        else console.error("Failed to delete customer:", data.error);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  const addDepot = () => {
    if (!handleModalValidation(depotInput.depot_x, depotInput.depot_y)) return;

    const current_id = get_date_time();
    fetch(`http://127.0.0.1:5100/depots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...depotInput, scenario_id: scenarioId, depot_id: current_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDepots([...depots, { ...data, id: current_id }]);
        setDepotInput({ depot_name: "", depot_x: 0, depot_y: 0, capacity: 0, maxDistance: 0, type: "" });
        setShowModal(null);
        setModalValidationError("");
      })
      .catch((err) => console.error("Failed to add depot:", err));
  };

  const removeDepot = (id: number) => {
    fetch(`http://127.0.0.1:5100/depots`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depot_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setDepots(depots.filter((d) => d.id !== id));
        else console.error("Failed to delete depot:", data.error);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  const addVehicle = () => {
    const current_id = get_date_time();
    fetch(`http://127.0.0.1:5100/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...vehicleInput, scenario_id: scenarioId, vehicle_id: current_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setVehicles([...vehicles, { ...data[0], id: current_id }]);
        setVehicleInput({ capacity: 0, depot_id: 0 });
        setShowModal(null);
      })
      .catch((err) => console.error("Failed to add vehicle:", err));
  };

  const removeVehicle = (id: number) => {
    fetch(`http://127.0.0.1:5100/vehicles`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setVehicles(vehicles.filter((v) => v.id !== id));
        else console.error("Failed to delete vehicle:", data.error);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  const getTransportationProblem = async (depots: Depot[], customers: Customer[]) => {
    const costMatrix: number[][] = await getCostMatrix(depots, customers);
    fetch(`http://127.0.0.1:5100/solvetp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demand: customers, supply: depots, costMatrix }),
    })
      .then((res) => res.json())
      .then((data) => setTransportationProblem(data))
      .catch((err) => console.error("Fetch error:", err));
  };

  const getMDVRPProblem = async (depots: Depot[], customers: Customer[], vehicles: Vehicle[]) => {
    if (validationErrors.length > 0) {
      setLoading(false);
      alert("Please fix coordinate validation errors before calculating routes.");
      return;
    }
    try {
      const costMatrix: number[][] = await getCostMatrix(depots, customers);
      const response = await fetch(`http://127.0.0.1:5100/mdvrp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depots, customers, vehicles, costMatrix }),
      });
      const data = await response.json();
      setMDVRPProblem(data);
      setRouteCoords(makeRouteList(data.routes));
      setLoading(false);

      if (!inputValidator.isValid()) {
        setValidationErrors(prev => [...prev, ...inputValidator.getErrors()]);
        return;
      }
      inputValidator.resetErrors();
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  const getCoordinatesFromName = (name: string): [number, number] | undefined => {
    const depot = depots.find((d) => d.depot_name?.toLowerCase().includes(name.toLowerCase()));
    if (depot) return [depot.depot_x, depot.depot_y];
    const customer = customers.find((c) => c.customer_name?.toLowerCase().includes(name.toLowerCase()));
    if (customer) return [customer.customer_x, customer.customer_y];
    console.warn("No coordinates found for", name);
    return undefined;
  };

  const makeRouteList = (routeArray: { id: string; route: string[] }[]): Route[] => {
    return routeArray.map((route_info) => {
      const coords: [number, number][] = [];
      route_info.route.forEach((name) => {
        const point = getCoordinatesFromName(name);
        if (point) coords.push(point);
      });
      if (coords.length > 0) coords.push(coords[0]);
      return { id: route_info.id, route: coords };
    });
  };

  const renderRoutes = () => {
    if (!routeCoords || routeCoords.length === 0) return null;
    const validRouteCoords = routeCoords.filter((r) => r.route?.length && r.route.length >= 2 &&
      r.route.every(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number' && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !isNaN(lat) && !isNaN(lng))
    );
    return validRouteCoords.map((coord, index) => (
      <RoutingMachine key={coord.id} route={coord.route} color={index === 0 ? "red" : "blue"} />
    ));
  };

