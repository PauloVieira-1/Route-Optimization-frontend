// MapRoute.tsx
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
import { Link } from "react-router-dom";
import type { Customer, Depot, Vehicle, Route } from "../types";
import { useParams } from "react-router-dom";
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
import { CoordinateValidator } from "./coordinnateValidator";

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
  const [transportationProbelm, setTransportationProblem] =
    useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [infoModal, setInfoModal] = useState<InfoModal | null>(null);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [coordinateWarnings, setCoordinateWarnings] = useState<string[]>([]);

  // Customers, Depots, Vehicles states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mdvrpProblem, setMDVRPProblem] = useState<string>("");

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

  useEffect(() => {
  if (customers && depots && vehicles) {
    inputValidator.setData(customers, depots, vehicles);
  }
}, [customers, depots, vehicles, inputValidator]);


  // Modal states
  const [showModal, setShowModal] = useState<
    "customer" | "depot" | "vehicle" | null
  >(null);

  // Validation state for modal inputs
  const [modalValidationError, setModalValidationError] = useState<string>("");

  // Validate modal input coordinates
  const validateModalInput = (lat: number, lng: number): boolean => {
    setModalValidationError("");
    
    const validation = CoordinateValidator.validateCoordinate(lat, lng);
    if (!validation.valid) {
      setModalValidationError(validation.error || "Invalid coordinates");
      return false;
    }

    // Check for duplicates with existing coordinates
    const allExisting = [
      ...customers.map(c => ({ lat: c.customer_x, lng: c.customer_y, name: c.customer_name, type: 'Customer' })),
      ...depots.map(d => ({ lat: d.depot_x, lng: d.depot_y, name: d.depot_name, type: 'Depot' }))
    ];

    for (const existing of allExisting) {
      if (CoordinateValidator.areCoordinatesTooClose(lat, lng, existing.lat, existing.lng, 100)) {
        setModalValidationError(
          `Coordinates are too close to existing ${existing.type} "${existing.name}"`
        );
        return false;
      }
    }

    return true;
  };

  // Fetch route for map (keeping original logic but adding validation)
  useEffect(() => {
    if (validCustomers.length < 2) return;

    const fetchRoute = async () => {
      const coordsString = validCustomers
        .map((c) => getLngLat(c).join(",")) // lng,lat
        .join(";");

      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("OSRM response:", data);

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
  }, [customers]);

  useEffect(() => {
  validateAll();
}, [customers, depots, vehicles, routeCoords]);

  ///////////////
  // CUSTOMERS //
  ///////////////

  const addCustomer = () => {
    // Validate coordinates before adding
    if (!validateModalInput(customerInput.customer_x, customerInput.customer_y)) {
      return;
    }

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
    fetch(`http://127.0.0.1:5100/customers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setCustomers(customers.filter((c) => c.id !== id));
        } else {
          console.error("Failed to delete customer:", data.error);
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  ///////////////
  // DEPOTS //
  ///////////////

  const addDepot = () => {
    // Validate coordinates before adding
    if (!validateModalInput(depotInput.depot_x, depotInput.depot_y)) {
      return;
    }

    const current_id = get_date_time();

    fetch(`http://127.0.0.1:5100/depots`, {
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
    fetch(`http://127.0.0.1:5100/depots`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depot_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setDepots(depots.filter((d) => d.id !== id));
        } else {
          console.error("Failed to delete depot:", data.error);
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  ///////////////
  // VEHICLES //
  ///////////////

  const addVehicle = () => {
    const current_id = get_date_time();

    fetch(`http://127.0.0.1:5100/vehicles`, {
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
        setVehicleInput({
          capacity: 0,
          depot_id: 0,
        });
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
        if (data.status === "success") {
          setVehicles(vehicles.filter((v) => v.id !== id));
        } else {
          console.error("Failed to delete vehicle:", data.error);
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  // ///////////////
  // OVERLAY MENU //
  /////////////////

  const validateAll = () => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Customer validation
  customers.forEach((customer) => {
    if (customer.customer_x !== undefined && customer.customer_y !== undefined) {
      const validation = CoordinateValidator.validateCoordinate(
        customer.customer_x,
        customer.customer_y
      );
      if (!validation.valid) {
        errors.push(`Customer "${customer.customer_name}": ${validation.error}`);
      }
    }
  });

  // Depot validation
  depots.forEach((depot) => {
    if (depot.depot_x !== undefined && depot.depot_y !== undefined) {
      const validation = CoordinateValidator.validateCoordinate(
        depot.depot_x,
        depot.depot_y
      );
      if (!validation.valid) {
        errors.push(`Depot "${depot.depot_name}": ${validation.error}`);
      }
    }
  });

  // Route validation
  routeCoords.forEach((r) => {
    if (!r.route?.length || r.route.length < 2) {
      errors.push(`Route ${r.id} has too few points`);
    } else {
      r.route.forEach(([lat, lng], i) => {
        const validation = CoordinateValidator.validateCoordinate(lat, lng);
        if (!validation.valid) {
          errors.push(`Route ${r.id}, point ${i + 1}: ${validation.error}`);
        }
      });
    }
  });

  // InputValidator
  inputValidator.setData(customers, depots, vehicles);
  if (!inputValidator.isValid()) {
    errors.push(...inputValidator.getErrors());
  }

  setValidationErrors(errors);
  setCoordinateWarnings(warnings);
};


  const getTransportationProblem = async (
    depots: Depot[],
    customers: Customer[],
  ) => {
    const costMatrix: number[][] = await getCostMatrix(depots, customers);

    fetch(`http://127.0.0.1:5100/solvetp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demand: customers,
        supply: depots,
        costMatrix: costMatrix,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTransportationProblem(data);
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  const getMDVRPProblem = async (
    depots: Depot[],
    customers: Customer[],
    vehicles: Vehicle[],
  ) => {
    // Check for coordinate validation errors before proceeding
    if (validationErrors.length > 0) {
      setLoading(false);
      alert("Please fix coordinate validation errors before calculating routes.");
      return;
    }

    const costMatrix: number[][] = await getCostMatrix(depots, customers);

    fetch(`http://127.0.0.1:5100/mdvrp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        depots: depots,
        customers: customers,
        vehicles: vehicles,
        costMatrix: costMatrix,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMDVRPProblem(data);
        setRouteCoords(makeRouteList(data.routes));
        validateAll()
        setLoading(false);

        if (!inputValidator.isValid()) {
          console.log("Validation errors:", inputValidator.getErrors());
          setValidationErrors([...validationErrors, ...inputValidator.getErrors()]);
          return;
        }
        inputValidator.resetErrors();

      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
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

      // return to origin
      if (coords.length > 0) coords.push(coords[0]);
      return {
        id: route_info.id,
        route: coords,
      };
    });
  };

  // Enhanced route rendering with validation
  const renderRoutes = () => {
    if (!routeCoords) return null;

    const invalidRoutes: string[] = [];
    
    const validRouteCoords = routeCoords
      ?.filter((r) => {
        if (!r.route?.length || r.route.length < 2) {
          return false;
        }

        // Validate each coordinate in the route
        for (let i = 0; i < r.route.length; i++) {
          const [lat, lng] = r.route[i];
          const validation = CoordinateValidator.validateCoordinate(lat, lng);
          
          if (!validation.valid) {
            invalidRoutes.push(`Route ${r.id}: Point ${i + 1} - ${validation.error}`);
            return false;
          }

          // Check for duplicate points in the same route
          // for (let j = i + 1; j < r.route.length; j++) {
          //   const [lat2, lng2] = r.route[j];
          //   if (CoordinateValidator.areCoordinatesTooClose(lat, lng, lat2, lng2)) {
          //     invalidRoutes.push(
          //       `Route ${r.id}: Points ${i + 1} and ${j + 1} are too close`
          //     );
          //     return false;
          //   }
          // }
        }

        return true;
      });

    return validRouteCoords?.map((coord, index) => (
      <RoutingMachine
        key={coord.id}
        route={coord.route}
        color={index === 0 ? "red" : "blue"}
        inputValidator={inputValidator}
      />
    ));
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* Validation Alerts */}
      {(validationErrors.length > 0 || coordinateWarnings.length > 0) && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1500,
            maxWidth: "500px",
          }}
        >
          {validationErrors.length > 0 && (
            <Alert variant="danger" className="mb-2">
              <Alert.Heading>
                <FaExclamationTriangle className="me-2" />
                Coordinate Validation Errors
              </Alert.Heading>
              <ul className="mb-0">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          {coordinateWarnings.length > 0 && (
            <Alert variant="warning" className="mb-2">
              <Alert.Heading>Coordinate Warnings</Alert.Heading>
              <ul className="mb-0">
                {coordinateWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}
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
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 300px)" }}>
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
              const hasError = validationErrors.some(error => 
                error.includes(`Customer "${c.customer_name}"`)
              );
              return (
                <li key={c.id} className={`list-item ${hasError ? 'border-danger' : ''}`}>
                  <div>
                    <strong className={hasError ? 'text-danger' : ''}>
                      {c.customer_name}
                      {hasError && <FaExclamationTriangle className="ms-1 text-danger" size={12} />}
                    </strong>
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ fontWeight: 500 }}>Coordinates:</span> (
                      {c.customer_x.toFixed(4)}, {c.customer_y.toFixed(4)})
                    </div>
                    <div style={{ marginTop: "2px" }}>
                      <span style={{ fontWeight: 500 }}>Demand:</span> {c.demand}
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
              const hasError = validationErrors.some(error => 
                error.includes(`Depot "${d.depot_name}"`)
              );
              return (
                <li key={d.id} className={`list-item ${hasError ? 'border-danger' : ''}`}>
                  <div>
                    <strong className={hasError ? 'text-danger' : ''}>
                      {d.depot_name}
                      {hasError && <FaExclamationTriangle className="ms-1 text-danger" size={12} />}
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
          <ul className="list">
            {vehicles?.map((v) => (
              <li key={v.id} className="list-item">
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
            className="fw-bold fs-5 rounded-pill d-flex align-items-center justify-content-between pe-2 ps-4 py-2"
            style={{ maxWidth: "200px" }}
            disabled={validationErrors.length > 0 || loading}
            onClick={() => {
              setLoading(true);
              getMDVRPProblem(depots, customers, vehicles);
            }}
            title={validationErrors.length > 0 ? "Fix coordinate errors first" : "Calculate routes"}
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
                <FaExclamationTriangle size={14} color="#dc3545"/>
              ) : (
                <FaArrowRight size={14} />
              )}
            </span>
          </Button>
        </div>
      </div>

      {/* Rest of your existing UI elements... */}
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
            transition: "all 0.3s",
          }}
          className="button-circle "
        >
          <FaPlus />
        </button>

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
        <Modal.Body>
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
                    // Real-time validation
                    if (customerInput.customer_y !== 0) {
                      validateModalInput(value, customerInput.customer_y);
                    }
                  }}
                  className={modalValidationError ? "is-invalid" : ""}
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
                    // Real-time validation
                    if (customerInput.customer_x !== 0) {
                      validateModalInput(customerInput.customer_x, value);
                    }
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
                  <br />
                  • Ensure coordinates are on accessible land
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
                    // Real-time validation
                    if (depotInput.depot_y !== 0) {
                      validateModalInput(value, depotInput.depot_y);
                    }
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
                    // Real-time validation
                    if (depotInput.depot_x !== 0) {
                      validateModalInput(depotInput.depot_x, value);
                    }
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
                  <br />
                  • Ensure coordinates are on accessible land
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
            variant="secondary"
            onClick={() => {
              setShowModal(null);
              setModalValidationError("");
            }}
            className="rounded-pill px-4"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (showModal === "customer") addCustomer();
              if (showModal === "depot") addDepot();
              if (showModal === "vehicle") addVehicle();
            }}
            disabled={modalValidationError !== ""}
            className="rounded-pill px-4"
          >
            Add
          </Button>
        </Modal.Footer>
      </Modal>
      
      <InfoModal show={infoModal} onHide={() => setInfoModal(false)} />
    </div>
  );
};

export default MapRoute;