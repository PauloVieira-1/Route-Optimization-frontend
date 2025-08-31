import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import html2canvas from "html2canvas";
import "leaflet/dist/leaflet.css";
import "./scenario.css";

interface ScenarioProps {
  id: number;
  title: string;
  date: string;
  removeScenario: (id: number) => void;
  updateName: (id: number, name: string) => void;
  onScreenshot: (id: number, img: string) => void;
}

function Scenario({
  id,
  title,
  date,
  removeScenario,
  updateName,
  onScreenshot,
}: ScenarioProps) {
  const [editableTitle, setEditableTitle] = useState(title);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    if (editableTitle !== title) {
      updateName(id, editableTitle);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (mapRef.current) {
        const canvas = await html2canvas(mapRef.current);
        const imgData = canvas.toDataURL("image/png");
        onScreenshot(id, imgData);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [id, onScreenshot]);

  return (
    <Container
      fluid
      className="scenario-container p-0 rounded-4 shadow-sm mx-1"
      style={{ width: "400px", overflow: "hidden", position: "relative" }}
    >
      <Link to={`/scenario/${id}`} className="text-decoration-none">
        {/* Map Preview */}
        <Row
          ref={mapRef}
          className="bg-custom-color-grey-lighter rounded-top-4 scenario-row"
          style={{ height: "170px" }}
        >
          <MapContainer
            center={[52.3676, 4.9041]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
            attributionControl={false}
            zoomControl={false}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            dragging={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </MapContainer>
        </Row>

        {/* Delete button */}
        <Button
          variant="danger"
          className="scenario-delete-btn rounded-circle p-1 d-flex justify-content-center align-items-center"
          style={{
            width: "30px",
            height: "30px",
            position: "absolute",
            top: "10px",
            right: "10px",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeScenario(id);
          }}
        >
          <FaTimes size={12} />
        </Button>
      </Link>

      <Row className="align-items-center p-3">
        <Col className="d-flex flex-column">
          <Form.Control
            type="text"
            value={editableTitle}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditableTitle(e.target.value);
            }}
            onBlur={handleBlur}
            className="mb-1 fw-bold fs-4 text-custom-color-grey-lighter"
            style={{
              border: "none",
              backgroundColor: "transparent",
              padding: 0,
            }}
          />
          <p className="text-muted mb-0">{date}</p>
        </Col>
      </Row>
    </Container>
  );
}

export default Scenario;
