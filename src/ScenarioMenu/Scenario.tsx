import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import { useState } from "react";
import "./Scenario.css";
import { Link } from "react-router-dom";

function Scenario({
  title,
  date,
  removeScenario,
  id,
}: {
  title: string;
  date: string;
  removeScenario: (id: number) => void;
  id: number;
}) {
  const [editableTitle, setEditableTitle] = useState(title);

  return (
    <Link to={`/scenario/${id}`} className="text-decoration-none">
      <Container
        fluid
        className="scenario-container p-0 rounded-4 shadow-sm mx-1"
        style={{ width: "400px", overflow: "hidden", position: "relative" }}
      >
        <Row
          className="bg-custom-color-grey-lighter rounded-top-4"
          style={{ height: "170px" }}
        ></Row>

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

        <Row className="align-items-center p-3">
          <Col className="d-flex flex-column">
            <Form.Control
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
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
    </Link>
  );
}

export default Scenario;
