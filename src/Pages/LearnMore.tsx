import StepAccordion from "../Accordion/StepAccordion";
import { Container, Row, Col, Button } from "react-bootstrap";
import {
  FaHouseUser
} from "react-icons/fa";
import { Link } from "react-router-dom";

function LearnMore() {
    return (
        <Container fluid className="p-3">
    <Container
      fluid
      className="bg-custom-color-grey-lighter2 rounded-bottom-5 px-5 py-5 fw-bold position-relative"
      style={{ height: "250px", width: "100%" }}
    >
      <Row>
        <Col>
          <h1 className="text-custom-color-grey-lighter fw-bold fs-1 display-1">
                How it works
          </h1>
          <p className="mt-2 fs-5 fw-light text-custom-color-grey-lighter">
            We use a combination of machine learning and computer vision to detect and track objects in real-time. This is done by using a camera to capture images of the environment and then using algorithms to analyze the images and detect the objects.
          </p>
        </Col>
      </Row>
      <Link to="/" className="text-decoration-none">
      <Button
        variant="primary"
        className="fw-bold fs-5 position-absolute rounded-pill d-flex align-items-center justify-content-between pe-2 ps-4 py-4 button-circle"
        style={{
          bottom: "20px",
          right: "20px",
          minWidth: "200px",
          paddingBottom: "40px !important",
          paddingTop: "10px !important",
        }}
      >
        <span className="me-3">Dashboard</span>
        <span
          className="d-flex justify-content-center align-items-center rounded-circle bg-white text-primary"
          style={{ width: "32px", height: "32px" }}
        >
          <FaHouseUser size={14} />
        </span>
      </Button>
      </Link>
    </Container>
    <Container fluid className="p-3 mt-4">
    <StepAccordion />
    </Container>
    </Container>
    );
}

export default LearnMore