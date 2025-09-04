import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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
import L from "leaflet";
import ZoomTopRight from "./ZoomtoRight";
import RoutingMachine from "./RoutingMachine";
import SpinnerComponent from "../Spinner/Spinner";
import InfoModal from "../InfoModal/InfoModal";
import InputValidator from "../validator";
import { validateData } from "./validation";
import Validator from "../validator";
import type { RoutingErrorEvent } from "./RoutingMachine";
import RoutePlanModal from "./RoutePlanModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [title, setTitle] = useState("Scenario");
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  // const [transportationProbelm, setTransportationProblem] =
  useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [infoModal, setInfoModal] = useState<boolean>(false);
  const [showPlan, setShowPlan] = useState<boolean>(false);
  const [hasMDVRPRoutes, setHasMDVRPRoutes] = useState<boolean>(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [modalValidationError, setModalValidationError] = useState<string>("");
  const [routingError, setRoutingError] = useState<string>("");
  const [routingErrorShown, setRoutingErrorShown] = useState<boolean>(false);

  // Customers, Depots, Vehicles states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mdvrpProblem, setMDVRPProblem] = useState<string>("");

  // Modal states
  const [showModal, setShowModal] = useState<
    "customer" | "depot" | "vehicle" | null
  >(null);

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
    try {
      const result = validateData(
        lat,
        lng,
        customers,
        depots,
        vehicles,
        errorArray,
      );
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
    const validator = new Validator(customers, depots, vehicles);
    console.log(validator);
    const errors = validator.validateAll();

    console.log(errors);
    setValidationErrors(errors);

    return errors.length === 0;
  };

  // Log whenever transportationProblem or mdvrpProblem changes
  useEffect(() => {
    // console.log(transportationProbelm)
    console.log(mdvrpProblem);
  }, [mdvrpProblem]);

  // Load scenario data and validate on mount
  useEffect(() => {
    fetch("https://route-optimization-xb1p.onrender.com/scenarios_by_id", {
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

  // FIXED: Only fetch basic routes when no MDVRP routes exist
  useEffect(() => {
    if (validCustomers.length < 2 || hasMDVRPRoutes) return;

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
  }, [validCustomers, hasMDVRPRoutes]);

  // FIXED: Only reset on significant data changes
  useEffect(() => {
    setRoutingErrorShown(false);
    setHasMDVRPRoutes(false);
  }, [customers.length, depots.length, vehicles.length]);

  const addCustomer = () => {
    if (
      !handleModalValidation(customerInput.customer_x, customerInput.customer_y)
    )
      return;

    const current_id = get_date_time();
    fetch("https://route-optimization-xb1p.onrender.com/customers", {
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
        setHasMDVRPRoutes(false); // Reset MDVRP flag
        setCustomerInput({
          customer_x: 0,
          customer_y: 0,
          demand: 0,
          customer_name: "",
        });
        setShowModal(null);
        setModalValidationError("");
      })
      .catch((err) => console.error("Failed to add customer:", err));
  };

  const removeCustomer = (id: number) => {
    fetch(`https://route-optimization-xb1p.onrender.com/customers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setCustomers(customers.filter((c) => c.id !== id));
          setHasMDVRPRoutes(false); // Reset MDVRP flag
        } else console.error("Failed to delete customer:", data.error);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  const addDepot = () => {
    if (!handleModalValidation(depotInput.depot_x, depotInput.depot_y)) return;

    const current_id = get_date_time();
    fetch(`https://route-optimization-xb1p.onrender.com/depots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...depotInput,
        scenario_id: scenarioId,
        depot_id: current_id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDepots([...depots, { ...data, id: current_id }]);
        setHasMDVRPRoutes(false); // Reset MDVRP flag
        setDepotInput({
          depot_name: "",
          depot_x: 0,
          depot_y: 0,
          capacity: 0,
          maxDistance: 0,
          type: "",
        });
        setShowModal(null);
        setModalValidationError("");
      })
      .catch((err) => console.error("Failed to add depot:", err));
  };

  const removeDepot = (id: number) => {
    fetch(`https://route-optimization-xb1p.onrender.com/depots`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depot_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setDepots(depots.filter((d) => d.id !== id));
          setHasMDVRPRoutes(false); // Reset MDVRP flag
        } else console.error("Failed to delete depot:", data.error);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  const addVehicle = () => {
    const current_id = get_date_time();
    fetch(`https://route-optimization-xb1p.onrender.com/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...vehicleInput,
        scenario_id: scenarioId,
        vehicle_id: current_id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setVehicles([...vehicles, { ...data[0], id: current_id }]);
        setHasMDVRPRoutes(false); // Reset MDVRP flag
        setVehicleInput({ capacity: 0, depot_id: 0 });
        setShowModal(null);
      })
      .catch((err) => console.error("Failed to add vehicle:", err));
  };

  const removeVehicle = (id: number) => {
    fetch(`https://route-optimization-xb1p.onrender.com/vehicles`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setVehicles(vehicles.filter((v) => v.id !== id));
          setHasMDVRPRoutes(false); // Reset MDVRP flag
        } else console.error("Failed to delete vehicle:", data.error);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  // const getTransportationProblem = async (
  //   depots: Depot[],
  //   customers: Customer[],
  // ) => {
  //   const costMatrix: number[][] = await getCostMatrix(depots, customers);
  //   fetch(`https://route-optimization-xb1p.onrender.com/solvetp`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ demand: customers, supply: depots, costMatrix }),
  //   })
  //     .then((res) => res.json())
  //     .then((data) => setTransportationProblem(data))
  //     .catch((err) => console.error("Fetch error:", err));
  // };

  const getMDVRPProblem = async (
    depots: Depot[],
    customers: Customer[],
    vehicles: Vehicle[],
  ) => {
    console.log("Getting MDVRP problem...");
    console.log("Depots:", depots);
    console.log("Customers:", customers);
    console.log("Vehicles:", vehicles);
    // Always update validator with latest data
    inputValidator.setData(customers, depots, vehicles);

    const errors = inputValidator.validateAll();
    console.log(errors);

    if (errors.length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      alert("Please fix validation errors before calculating routes.");
      return;
    }

    try {
      const costMatrix: number[][] = await getCostMatrix(depots, customers);
      const response = await fetch(
        `https://route-optimization-xb1p.onrender.com/mdvrp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ depots, customers, vehicles, costMatrix }),
        },
      );
      const data = await response.json();
      setMDVRPProblem(data);
      setRouteCoords(makeRouteList(data.routes));
      setHasMDVRPRoutes(true); // Set flag when MDVRP routes are calculated
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  const getCoordinatesFromName = (
    name: string,
  ): [number, number] | undefined => {
    const depot = depots.find((d) =>
      d.depot_name?.toLowerCase().includes(name.toLowerCase()),
    );
    if (depot) return [depot.depot_x, depot.depot_y];
    const customer = customers.find((c) =>
      c.customer_name?.toLowerCase().includes(name.toLowerCase()),
    );
    if (customer) return [customer.customer_x, customer.customer_y];
    console.warn("No coordinates found for", name);
    return undefined;
  };

  const makeRouteList = (
    routeArray: { id: string; route: string[] }[],
  ): Route[] => {
    return routeArray.map((route_info) => {
      const coords: [number, number][] = [];
      route_info.route.forEach((name) => {
        const point = getCoordinatesFromName(name);
        if (point) coords.push(point);
      });
      if (coords.length > 0) coords.push(coords[0]);

      return { id: Number(route_info.id), route: coords };
    });
  };

  const renderRoutes = () => {
    if (!routeCoords || routeCoords.length === 0) return null;
    const validRouteCoords = routeCoords.filter(
      (r) =>
        r.route?.length &&
        r.route.length >= 2 &&
        r.route.every(
          ([lat, lng]) =>
            typeof lat === "number" &&
            typeof lng === "number" &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180 &&
            !isNaN(lat) &&
            !isNaN(lng),
        ),
    );
    return validRouteCoords.map((coord, index) => (
      <RoutingMachine
        key={coord.id}
        route={coord.route}
        color={index === 0 ? "red" : "blue"}
        onError={handleRoutingError}
      />
    ));
  };

  const handleRoutingError = (err: RoutingErrorEvent) => {
    console.error("Routing error:", err);

    // Only set error if it hasn't been shown already
    if (!routingErrorShown) {
      const errorMessage = err.error
        ? err.error.message
        : "Route cannot be found. Please check that coordinates comply with constraints and are accessible by road.";

      setRoutingError(errorMessage);
      setRoutingErrorShown(true);
    }
  };
  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* Routing Error Alert */}
      {routingError && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1500,
            maxWidth: "500px",
          }}
        >
          <Alert
            variant="danger"
            className="mb-2"
            dismissible
            onClose={() => {
              setRoutingError("");
              setRoutingErrorShown(false);
            }}
          >
            {" "}
            <Alert.Heading className="mb-3">
              <FaExclamationTriangle className="me-2 mt-0" />
              Routing Error
            </Alert.Heading>
            {routingError}
            <div className="d-flex justify-content-center mt-2">
              <p>Try using different coordinates</p>
            </div>
          </Alert>
        </div>
      )}

      {/* Top-left overlay */}
      <div
        style={{
          position: "absolute",
          left: isOverlayOpen ? 0 : -350,
          top: 0,
          bottom: 0,
          width: "300px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          zIndex: 1000,
          padding: "10px",
          transition: "left 0.3s",
        }}
        className="m-4 rounded-5 p-5"
      >
        <div className="d-flex align-items-center justify-content-center mb-4">
          <h1 className="fw-bold fs-2 me-3">Parameters</h1>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 270px)" }}>
          {/* Customers Section */}
          <div className="section-header">
            <h4 className="fw-bold">Customers</h4>
            <button
              className="button-circle"
              onClick={() => setShowModal("customer")}
            >
              <FaPlus />
            </button>
          </div>
          <hr className="w-100 mb-4" />
          <ul className="list">
            {customers?.map((c) => {
              const hasError = validationErrors.some((error) =>
                error.includes(`Customer "${c.customer_name}"`),
              );
              return (
                <li
                  key={c.id}
                  className={`list-item bg-custom-color-grey-lighter2 ${hasError ? "border-danger" : ""}`}
                >
                  <div>
                    <strong className={hasError ? "text-danger" : ""}>
                      {c.customer_name}
                      {hasError && (
                        <FaExclamationTriangle
                          className="ms-1 text-danger"
                          size={12}
                        />
                      )}
                    </strong>
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ fontWeight: 500 }}>Coordinates:</span> (
                      {c.customer_x.toFixed(4)}, {c.customer_y.toFixed(4)})
                    </div>
                    <div style={{ marginTop: "2px" }}>
                      <span style={{ fontWeight: 500 }}>Demand:</span>{" "}
                      {c.demand}
                    </div>
                  </div>
                  <div className="delete-btn-wrapper">
                    <button
                      className="delete-btn button-circle"
                      onClick={() => removeCustomer(c.id)}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Depots Section */}
          <div className="section-header">
            <h4 className="fw-bold">Depots</h4>
            <button
              className="button-circle"
              onClick={() => setShowModal("depot")}
            >
              <FaPlus />
            </button>
          </div>
          <hr className="w-100 mb-4" />
          <ul className="list">
            {depots?.map((d) => {
              const hasError = validationErrors.some((error) =>
                error.includes(`Depot "${d.depot_name}"`),
              );
              return (
                <li
                  key={d.id}
                  className={`list-item bg-custom-color-grey-lighter2 ${hasError ? "border-danger" : ""}`}
                >
                  <div>
                    <strong className={hasError ? "text-danger" : ""}>
                      {d.depot_name}
                      {hasError && (
                        <FaExclamationTriangle
                          className="ms-1 text-danger"
                          size={12}
                        />
                      )}
                    </strong>
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ fontWeight: 500 }}>Coordinates:</span> (
                      {d.depot_x.toFixed(4)}, {d.depot_y.toFixed(4)})
                    </div>
                    <div style={{ marginTop: "2px" }}>
                      <span style={{ fontWeight: 500 }}>Capacity:</span>{" "}
                      {d.capacity}
                    </div>
                    <div style={{ marginTop: "2px" }}>
                      <span style={{ fontWeight: 500 }}>Max Distance:</span>{" "}
                      {d.maxDistance ?? "N/A"}
                    </div>
                    <div style={{ marginTop: "2px" }}>
                      <span style={{ fontWeight: 500 }}>Type:</span>{" "}
                      {d.type || "N/A"}
                    </div>
                  </div>
                  <div className="delete-btn-wrapper">
                    <button
                      className="delete-btn button-circle"
                      onClick={() => removeDepot(d.id)}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Vehicles Section */}
          <div className="section-header">
            <h4 className="fw-bold"> Vehicles</h4>
            <button
              className="button-circle"
              onClick={() => setShowModal("vehicle")}
            >
              <FaPlus />
            </button>
          </div>
          <hr className="w-100 mb-4" />

          <ul className="list">
            {vehicles?.map((v) => (
              <li
                key={v.id}
                className="list-item bg-custom-color-grey-lighter2"
              >
                <div>
                  <div style={{ marginTop: "2px" }}>
                    <span style={{ fontWeight: 500 }}>Capacity:</span>{" "}
                    {v.capacity}
                  </div>
                  <div style={{ marginTop: "2px" }}>
                    <span style={{ fontWeight: 500 }}>Depot:</span>{" "}
                    {depots.find((d) => d.id === v.depot_id)?.depot_name ||
                      "N/A"}
                  </div>
                </div>
                <div className="delete-btn-wrapper">
                  <button
                    className="delete-btn button-circle"
                    onClick={() => removeVehicle(v.id)}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Calculate Button with validation check */}
        <div
          className="d-flex align-items-center justify-content-between"
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            gap: "40px",
          }}
        >
          {/* Question Mark */}
          <BsFillQuestionCircleFill
            style={{ cursor: "pointer" }}
            onClick={() => setInfoModal(true)}
            color="#007BFF"
            size={50}
            className="button-circle bg-white"
          />

          {/* Calculate Button */}
          <Button
            variant={validationErrors.length > 0 ? "danger" : "primary"}
            className="fw-bold fs-5 rounded-pill d-flex align-items-center justify-content-between pe-2 ps-4 py-2 "
            style={{ maxWidth: "200px" }}
            disabled={validationErrors.length > 0 || loading}
            onClick={() => {
              setLoading(true);
              validateAllCoordinates();
              getMDVRPProblem(depots, customers, vehicles);
            }}
            title={
              validationErrors.length > 0
                ? "Fix coordinate errors first"
                : "Calculate routes"
            }
          >
            <span className="me-3">
              {validationErrors.length > 0 ? "Fix Errors" : "Calculate"}
            </span>
            <span
              className="d-flex justify-content-center align-items-center rounded-circle bg-white text-primary"
              style={{ width: "32px", height: "32px" }}
            >
              {loading ? (
                <SpinnerComponent />
              ) : validationErrors.length > 0 ? (
                <FaExclamationTriangle size={14} color="#dc3545" />
              ) : (
                <FaArrowRight size={14} />
              )}
            </span>
          </Button>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "400px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          zIndex: 1000,
          padding: "10px",
          transition: "all 0.3s",
          height: "65px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          right: isOverlayOpenPlus ? "0px" : "-500px",
        }}
        className="m-4 rounded-4 py-4 px-3 rounded-pill"
      >
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#0d6efd", // Bootstrap primary
              color: "white",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              transition: "all 0.3s",
            }}
            className="button-circle"
          >
            <FaPlus />
          </button>

          {/* Popup Menu with smooth transition */}
          <div
            style={{
              position: "absolute",
              bottom: "62px",
              left: "0",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "20px",
              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              zIndex: 2000,
              minWidth: "150px",

              /* animation */
              opacity: isMenuOpen ? 1 : 0,
              transform: isMenuOpen ? "translateY(0)" : "translateY(10px)",
              pointerEvents: isMenuOpen ? "auto" : "none",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <button
              style={{
                width: "100%",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "transparent",
                padding: "8px",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              className="button-circle text-custom-color-grey-light fw-bold"
              onClick={() => setShowPlan(true)}
            >
              Route Plan
            </button>
            <button
              style={{
                width: "100%",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "transparent",
                padding: "8px",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              className="button-circle text-custom-color-grey-light fw-bold"
            >
              Feature 2
            </button>
            <button
              style={{
                width: "100%",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "transparent",
                padding: "8px",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              className="button-circle text-custom-color-grey-light fw-bold"
            >
              Feature 3
            </button>
          </div>
        </div>

        <p className="text-custom-color-grey-lighter fw-bold fs-4 m-0 ps-2">
          {title}
        </p>
      </div>
      <Link to="/">
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 40,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 1000,
            padding: "10px",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
          className="m-4 rounded-4 py-2 px-2 rounded-pill"
        >
          {/* Circular plus button with FaPlus icon */}
          <button
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#0d6efd", // Bootstrap primary
              color: "white",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
            className="button-circle "
          >
            <FaHouseUser />
          </button>
        </div>
      </Link>

      <button
        onClick={() => setIsOverlayOpen(!isOverlayOpen)}
        style={{
          position: "absolute",
          top: "30px",
          left: isOverlayOpen ? "350px" : "25px",
          width: "50px",
          height: "50px",
          cursor: "pointer",
          zIndex: 800,
          transition: "all 0.3s",
        }}
        className="decoration-none bg-white rounded-circle d-flex justify-content-center align-items-center border-0 button-circle"
      >
        {isOverlayOpen ? (
          <FaArrowLeft size={14} color="#0d6efd" />
        ) : (
          <FaArrowRight size={14} color="#0d6efd" />
        )}
      </button>

      <button
        onClick={() => setIsOverlayOpenPlus(!isOverlayOpenPlus)}
        style={{
          position: "absolute",
          bottom: "30px",
          right: isOverlayOpenPlus ? "440px" : "30px",
          width: "50px",
          height: "50px",
          cursor: "pointer",
          zIndex: 800,
          transition: "all 0.3s",
        }}
        className="decoration-none bg-white rounded-circle d-flex justify-content-center align-items-center border-0 button-circle"
      >
        {isOverlayOpenPlus ? (
          <FaArrowRight size={14} color="#0d6efd" />
        ) : (
          <FaArrowLeft size={14} color="#0d6efd" />
        )}
      </button>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomTopRight />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {renderRoutes()}

        {validCustomers.map((c) => (
          <Marker key={c.id} position={getLatLng(c)} icon={redIcon} />
        ))}
        {validDepots.map((d) => (
          <Marker key={d.id} position={getLatLngDepot(d)} icon={blueIcon} />
        ))}
        <RecenterMap center={center} />
      </MapContainer>

      {/* Modal */}
      <Modal
        show={showModal !== null}
        onHide={() => {
          setShowModal(null);
          setModalValidationError("");
        }}
        style={{ zIndex: 1200 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showModal === "customer" && "Add Customer"}
            {showModal === "depot" && "Add Depot"}
            {showModal === "vehicle" && "Add Vehicle"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {modalValidationError && (
            <Alert variant="danger" className="mb-3">
              <FaExclamationTriangle className="me-2" />
              {modalValidationError}
            </Alert>
          )}
          {showModal === "customer" && (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={customerInput.customer_name}
                  onChange={(e) =>
                    setCustomerInput({
                      ...customerInput,
                      customer_name: e.target.value,
                    })
                  }
                  className="mb-3"
                />
                <Form.Label>X (Latitude)</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  value={customerInput.customer_x}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setCustomerInput({
                      ...customerInput,
                      customer_x: value,
                    });
                  }}
                  className={`mb-3 ${modalValidationError ? "is-invalid" : ""}`}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Y (Longitude)</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  value={customerInput.customer_y}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setCustomerInput({
                      ...customerInput,
                      customer_y: value,
                    });
                  }}
                  className={modalValidationError ? "is-invalid" : ""}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Demand</Form.Label>
                <Form.Control
                  type="number"
                  value={customerInput.demand}
                  onChange={(e) =>
                    setCustomerInput({
                      ...customerInput,
                      demand: Number(e.target.value),
                    })
                  }
                  className="mb-3"
                />
              </Form.Group>
              <div className="mt-3 p-2 bg-light rounded">
                <small className="text-muted">
                  <strong>Coordinate Guidelines:</strong>
                  <br />
                  • Latitude must be between -90 and 90
                  <br />
                  • Longitude must be between -180 and 180
                  <br />
                  • Avoid ocean coordinates (0,0) or remote areas
                  <br />• Ensure coordinates are on accessible land
                </small>
              </div>
            </>
          )}

          {showModal === "depot" && (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={depotInput.depot_name}
                  onChange={(e) =>
                    setDepotInput({ ...depotInput, depot_name: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>X (Latitude)</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  value={depotInput.depot_x}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setDepotInput({
                      ...depotInput,
                      depot_x: value,
                    });
                  }}
                  className={modalValidationError ? "is-invalid" : ""}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Y (Longitude)</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  value={depotInput.depot_y}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setDepotInput({
                      ...depotInput,
                      depot_y: value,
                    });
                  }}
                  className={modalValidationError ? "is-invalid" : ""}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Capacity</Form.Label>
                <Form.Control
                  type="number"
                  value={depotInput.capacity}
                  onChange={(e) =>
                    setDepotInput({
                      ...depotInput,
                      capacity: Number(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Max Distance</Form.Label>
                <Form.Control
                  type="number"
                  value={depotInput.maxDistance}
                  onChange={(e) =>
                    setDepotInput({
                      ...depotInput,
                      maxDistance: Number(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Type</Form.Label>
                <Form.Control
                  type="text"
                  value={depotInput.type}
                  onChange={(e) =>
                    setDepotInput({ ...depotInput, type: e.target.value })
                  }
                />
              </Form.Group>
              <div className="mt-3 p-2 bg-light rounded">
                <small className="text-muted">
                  <strong>Coordinate Guidelines:</strong>
                  <br />
                  • Latitude must be between -90 and 90
                  <br />
                  • Longitude must be between -180 and 180
                  <br />
                  • Avoid ocean coordinates (0,0) or remote areas
                  <br />• Ensure coordinates are on accessible land
                </small>
              </div>
            </>
          )}

          {showModal === "vehicle" && (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Capacity</Form.Label>
                <Form.Control
                  type="number"
                  value={vehicleInput.capacity}
                  onChange={(e) =>
                    setVehicleInput({
                      ...vehicleInput,
                      capacity: Number(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Depots</Form.Label>
                <Form.Control
                  as="select"
                  value={vehicleInput.depot_id}
                  onChange={(e) =>
                    setVehicleInput({
                      ...vehicleInput,
                      depot_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Select depot</option>
                  {depots.map((depot) => (
                    <option key={depot.id} value={depot.id}>
                      {depot.depot_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              if (showModal === "customer") addCustomer();
              if (showModal === "depot") addDepot();
              if (showModal === "vehicle") addVehicle();
            }}
            className="rounded-pill px-5 py-4 button-circle bg-custom-color-grey-lighter"
          >
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      <InfoModal show={infoModal} onHide={() => setInfoModal(false)} />
      <RoutePlanModal
        show={showPlan}
        onHide={() => setShowPlan(false)}
        data={mdvrpProblem ? mdvrpProblem : undefined}
      />
    </div>
  );
};

export default MapRoute;
