// MapRoute.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L, { icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaArrowRight,
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaHouseUser,
} from "react-icons/fa";
import { Modal, Button, Form } from "react-bootstrap";
import "./MapRoute.css";
import { Link } from "react-router-dom";
import type { Customer, Depot, Vehicle } from "../types";
import { useParams } from "react-router-dom";
import {
  get_date_time,
  ZoomTopRight,
  getLatLng,
  getLngLat,
  getFirstLatLng,
  redIcon,
  blueIcon,
  getLatLngDepot,
} from "./utiities";

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
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);
  const [isOverlayOpenPlus, setIsOverlayOpenPlus] = useState(true);
  const [title, setTitle] = useState("Scenario");
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  // Customers, Depots, Vehicles states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // const [depotPoints, setDepotPoints] = useState<[number, number][]>([]);
  // const [vehiclePoints, setVehiclePoints] = useState<[number, number][]>([]);

  const { id } = useParams<{ id: string }>();
  const scenarioId = parseInt(id, 10);

  const validCustomers = useMemo(
    () =>
      customers.filter(
        (c) => c.customer_x !== undefined && c.customer_y !== undefined,
      ),
    [customers],
  );

  const validDepots = useMemo(
    () =>
      depots.filter(
        (d) => d.depot_x !== undefined && d.depot_y !== undefined,
      ),
    [depots],
  );


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
    console.log("center", center);
  });

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
    maxDistance: 0,
  });

  // Modal states
  const [showModal, setShowModal] = useState<
    "customer" | "depot" | "vehicle" | null
  >(null);

  // Fetch route for map
  useEffect(() => {
    if (validCustomers.length < 2) return;

    const fetchRoute = async () => {
      const coordsString = validCustomers
        .map((c) => getLngLat(c).join(",")) // lng,lat
        .join(";");

      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

      console.log("validCustomers", validCustomers);

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

  ///////////////
  // CUSTOMERS //
  ///////////////

  const addCustomer = () => {
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
      })
      .catch((err) => console.error("Failed to add customer:", err));
  };

  const removeCustomer = (id: number) => {
    console.log("Customer deleted:", id);
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
  // CUSTOMERS //
  ///////////////

  const addDepot = () => {
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
      })
      .catch((err) => console.error("Failed to add depot:", err));
  };

  const removeDepot = (id: number) => {
    console.log("Depot deleted:", id);
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
        setVehicles([...vehicles, { ...data, id: current_id }]);
        setVehicleInput({
          capacity: 0,
          maxDistance: 0,
        });
        setShowModal(null);
      })
      .catch((err) => console.error("Failed to add vehicle:", err));
  };

  const removeVehicle = (id: number) => {
    console.log("Vehicle deleted:", id);
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

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
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
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="fw-bold fs-2 mb-5">Parameters</h1>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 300px)" }}>
          {" "}
          {/* TEST */}
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
            {customers?.map((c) => (
              <li key={c.id} className="list-item">
                <div>
                  <strong>{c.customer_name}</strong> ({c.customer_x},{" "}
                  {c.customer_y}) - Demand: {c.demand}
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
            ))}
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
            {depots?.map((d) => (
              <li key={d.id} className="list-item">
                <div>
                  <strong>{d.depot_name}</strong> ({d.depot_x}, {d.depot_y}) - Capacity:{" "}
                  {d.capacity}, MaxDist: {d.maxDistance}, Type: {d.type}
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
            ))}
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
                  Capacity: {v.capacity}, MaxDist: {v.maxDistance}
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
        <div className="d-flex justify-content-center align-items-center ms-4">
          <Button
            variant="primary"
            className="fw-bold fs-5 position-absolute rounded-pill d-flex align-items-center justify-content-between pe-2 ps-4 py-4 w-100 mt-1 mb-4 button-circle"
            style={{
              bottom: "0px",
              right: "20px",
              paddingBottom: "40px !important",
              paddingTop: "10px !important",
              maxWidth: "200px",
            }}
          >
            <span className="me-3">Save</span>
            <span
              className="d-flex justify-content-center align-items-center rounded-circle bg-white text-primary"
              style={{ width: "32px", height: "32px" }}
            >
              <FaArrowRight size={14} />
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
          onClick={() => console.log("Plus button clicked")}
          className="button-circle "
        >
          <FaPlus />
        </button>

        <p className="text-custom-color-grey-lighter fw-bold fs-3 m-0 ps-2">
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
            onClick={() => console.log("Plus button clicked")}
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
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="blue" />
        )}
        {validCustomers.map((c) => (
          <Marker key={c.id} position={getLatLng(c)}  icon={redIcon}/>          
        ))}
        {validDepots.map((d) => (
          <Marker key={d.id} position={getLatLngDepot(d)}  icon={blueIcon}/>
        ))}
        <RecenterMap center={center} />
      </MapContainer>

      {/* Modal */}
      <Modal
        show={showModal !== null}
        onHide={() => setShowModal(null)}
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
                <Form.Label>X</Form.Label>
                <Form.Control
                  type="number"
                  value={customerInput.customer_x}
                  onChange={(e) =>
                    setCustomerInput({
                      ...customerInput,
                      customer_x: Number(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Y</Form.Label>
                <Form.Control
                  type="number"
                  value={customerInput.customer_y}
                  onChange={(e) =>
                    setCustomerInput({
                      ...customerInput,
                      customer_y: Number(e.target.value),
                    })
                  }
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
                <Form.Label>x</Form.Label>
                <Form.Control
                  type="number"
                  value={depotInput.depot_x}
                  onChange={(e) =>
                    setDepotInput({
                      ...depotInput,
                      depot_x: Number(e.target.value),
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>y</Form.Label>
                <Form.Control
                  type="number"
                  value={depotInput.depot_y}
                  onChange={(e) =>
                    setDepotInput({
                      ...depotInput,
                      depot_y: Number(e.target.value),
                    })
                  }
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
                <Form.Label>Max Distance</Form.Label>
                <Form.Control
                  type="number"
                  value={vehicleInput.maxDistance}
                  onChange={(e) =>
                    setVehicleInput({
                      ...vehicleInput,
                      maxDistance: Number(e.target.value),
                    })
                  }
                />
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
            className="rounded-pill button-circle bg-custom-color-grey-lighter mx-1 px-5 py-4"
          >
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MapRoute;
