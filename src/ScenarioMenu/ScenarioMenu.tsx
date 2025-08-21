import { Container, Row, Col, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import Scenario from "./Scenario";
import { useEffect, useState } from "react";

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const newScenario = {
  name: "Title",
  date: getCurrentDate(),
  depots: [
    { depot_name: "Depot 1", depot_x: 10, depot_y: 5, capacity: 100, max_distance: 50, type: "main" },
    { depot_name: "Depot 2", depot_x: 20, depot_y: 15, capacity: 80, max_distance: 60, type: "secondary" }
  ],
  vehicles: [
    { capacity: 50, max_distance: 200 },
    { capacity: 40, max_distance: 150 }
  ],
  customers: [
    { customer_name: "Customer 1", customer_x: 2, customer_y: 8, demand: 10 },
    { customer_name: "Customer 2", customer_x: 5, customer_y: 12, demand: 15 }
  ]
};


function ScenarioMenu() {
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/scenarios")
      .then(res => res.json())
      .then(data => {setScenarios(data); console.log(data);});
  }, []);

function addScenario() {
  fetch("http://127.0.0.1:5000/scenarios/full", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newScenario),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      console.log(data);
      const newEntry = {
        id: data.scenario.id,
        name: data.scenario.name,
        date: data.scenario.date
      };
      setScenarios(prev => [...prev, newEntry]);
    })
    .catch((err) => console.error("Error creating scenario:", err));
}



function removeScenario(id: number) {
  console.log("Deleting scenario:", id);
  fetch(`http://127.0.0.1:5000/scenarios`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id: id })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      setScenarios(scenarios.filter((s) => s.id !== id));
    } else {
      console.error("Failed to delete scenario:", data.error);
    }
  })
  .catch(err => console.error("Fetch error:", err));
}

function updateName(id: number, name: string) {
  console.log("changing Name of ", id + " to " + name);
  fetch(`http://127.0.0.1:5000/scenarios`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id: id, new_name: name })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      setScenarios(
        scenarios.map((s: any) =>
          s.id === id ? { ...s, title: name } : s
        )
      );
    } else {
      console.error("Failed to update scenario:", data.error);
    }
  })
  .catch(err => console.error("Fetch error:", err));
}



  // function deleteAll() {
  //   fetch(`http://127.0.0.1:5000/reset-database`, { method: "POST" });
  //   setScenarios([]);
  // }


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
          scenarios.map((scenario: any) => (
            <div key={scenario.id} style={{ width: "400px" }}>
              <Scenario
                title={scenario.name}
                date={scenario.date}
                removeScenario={removeScenario}
                updateName={updateName}
                id={scenario.id}
                key={scenario.id}
              />
            </div>
          ))
        ) : (
          <p className="text-muted">No scenarios found</p>
        )}
      </Row>
      {/* <Row>
        <button className="btn btn-danger" onClick={deleteAll}>DELETE ALL</button>
      </Row> */}
    </Container>
  );
}

export default ScenarioMenu;

