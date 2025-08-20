import { Container, Row, Col, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import Scenario from "./Scenario";
import { useState } from "react";
import MapRoute from "../MapRoute/MapRoute";

interface ScenarioInterface {
  id: number;
  title: string;
  date: string;
}

const Scenarios: ScenarioInterface[] = [
  { id: 1, title: "Scenario 1", date: "21/02/2023" },
  { id: 2, title: "Scenario 2", date: "20/02/2023" },
  { id: 3, title: "Scenario 3", date: "19/02/2023" },
];

function ScenarioMenu() {
  const [scenarios, setScenarios] = useState(Scenarios);

  // Set width as a variable for easy changes
  const scenarioWidth = 400; // width in px

  function addScenario() {
    const newId = Math.max(...scenarios.map((s) => s.id)) + 1;
    setScenarios([
      ...scenarios,
      { id: newId, title: `Scenario ${newId}`, date: getDateTime(new Date()) },
    ]);
  }

  function removeScenario(id: number) {
    setScenarios(scenarios.filter((s) => s.id !== id));
  }

  function getDateTime(date: Date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

      {/* Flex container for scenarios with wrapping */}
      <Row
        className="align-items-start justify-content-center"
        style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}
      >
        {scenarios.length > 0 ? (
          scenarios.map((scenario) => (
            <div key={scenario.id} style={{ width: `${scenarioWidth}px` }}>
              <Scenario
                title={scenario.title}
                date={scenario.date}
                removeScenario={removeScenario}
                id={scenario.id}
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

