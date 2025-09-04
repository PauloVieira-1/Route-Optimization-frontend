import { Container, Row, Col, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import Scenario from "./Scenario";
import { useEffect, useState } from "react";
import { getCurrentDate } from "../MapRoute/utiities";
import type { Depot, Vehicle, Customer } from "../types";

interface ScenarioType {
  id: number;
  name: string;
  date: string;
  depots?: Depot[];
  vehicles?: Vehicle[];
  customers?: Customer[];
}

const newScenario = {
  name: "Title",
  date: getCurrentDate(),
  depots: [],
  vehicles: [],
  customers: [],
};

function ScenarioMenu() {
  const [scenarios, setScenarios] = useState<ScenarioType[]>([]);
  const [screenshots, setScreenshots] = useState<{ [key: number]: string }>([]);

  useEffect(() => {
    fetch("https://route-optimization-xb1p.onrender.com/scenarios")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Scenarios loaded:", data);
        setScenarios(data);
        console.log(screenshots);
      })
      .catch((err) => {
        console.error("Error fetching scenarios:", err);
      });
  }, [screenshots]);

  const handleScreenshot = (id: number, img: string) => {
    setScreenshots((prev: { [key: number]: string }) => ({
      ...prev,
      [id]: img,
    }));
    console.log("Saved screenshot for scenario", id);
  };

  function addScenario() {
    fetch("https://route-optimization-xb1p.onrender.com/scenarios/full", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newScenario),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("New scenario created:", data);
        const newEntry = {
          id: data.scenario.id,
          name: data.scenario.name,
          date: data.scenario.date,
        };
        setScenarios((prev) => [...prev, newEntry]);
      })
      .catch((err) => console.error("Error creating scenario:", err));
  }

  function removeScenario(id: number) {
    console.log("Deleting scenario:", id);
    fetch(`https://route-optimization-xb1p.onrender.com/scenarios`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: id }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Delete response:", data);
        if (data.status === "success") {
          setScenarios(scenarios.filter((s) => s.id !== id));
        } else {
          console.error("Failed to delete scenario:", data.error);
        }
      })
      .catch((err) => console.error("Error deleting scenario:", err));
  }

  function updateName(id: number, name: string) {
    console.log("Changing name of scenario", id, "to", name);

    fetch(`https://route-optimization-xb1p.onrender.com/scenarios`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: id, new_name: name }),
    })
      .then((res) => {
        console.log("Update response status:", res.status);
        console.log("Update response ok:", res.ok);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Update response data:", data);
        console.log("Data type:", typeof data);
        console.log("Data status:", data.status);

        if (data.status === "success") {
          setScenarios(
            scenarios.map((s: ScenarioType) =>
              s.id === id ? { ...s, name: name } : s,
            ),
          );
          console.log("Scenario name updated successfully");
        } else {
          console.error(
            "Failed to update scenario:",
            data.error || "Unknown error",
          );
        }
      })
      .catch((err) => {
        console.error("Error updating scenario name:", err);
        console.error("Error details:", err.message);
      });
  }

  return (
    <Container fluid className="px-5 py-5">
      <Row className="align-items-center mb-3">
        <Col className="d-flex justify-content-between align-items-center">
          <h2 className="text-custom-color-grey-lighter fw-bold fs-2 display-1 mb-0">
            My Scenarios
          </h2>
          <Button
            variant="primary"
            className="d-flex justify-content-center align-items-center rounded-circle p-2 button-circle fw-bold fs-5"
            style={{ width: "40px", height: "40px" }}
            onClick={addScenario}
          >
            <FaPlus />
          </Button>
        </Col>
        <hr className="my-4" />
      </Row>
      <Row
        className="align-items-start justify-content-center"
        style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}
      >
        {scenarios.length > 0 ? (
          scenarios.map((scenario: ScenarioType) => (
            <div key={scenario.id} style={{ width: "400px" }}>
              <Scenario
                title={scenario.name}
                date={scenario.date}
                removeScenario={removeScenario}
                updateName={updateName}
                id={scenario.id}
                key={scenario.id}
                onScreenshot={handleScreenshot}
              />
            </div>
          ))
        ) : (
          <p className="text-muted">No scenarios found</p>
        )}
      </Row>
    </Container>
  );
}

export default ScenarioMenu;
