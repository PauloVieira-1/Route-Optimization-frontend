import { Container, Row, Col, Button } from "react-bootstrap";
import { FaArrowRight } from "react-icons/fa";
import "./HomeHeader.css";

function HomeHeader() {
  return (
    <Container
      fluid
      className="bg-custom-color-grey-lighter2 rounded-bottom-5 px-5 py-5 fw-bold position-relative"
      style={{ height: "250px", width: "100%" }}
    >
      <Row>
        <Col>
          <h1 className="text-custom-color-grey-lighter fw-bold fs-1 display-1">
            Route Optimization Tool
          </h1>
          <p className="mt-2 fs-5 fw-light text-custom-color-grey-lighter">
            Use this tool to optimize your routes
          </p>
        </Col>
      </Row>
        <Button
  variant="primary"
  className="fw-bold fs-5 position-absolute rounded-pill d-flex align-items-center justify-content-between pe-2 ps-4 py-4 button-circle"
  style={{ bottom: "20px", right: "20px", minWidth: "200px", paddingBottom: "40px !important", paddingTop: "10px !important" }}
>
  <span className="me-3">Learn More</span>
  <span
    className="d-flex justify-content-center align-items-center rounded-circle bg-white text-primary"
    style={{ width: "32px", height: "32px" }}
  >
    <FaArrowRight size={14} />
  </span>
</Button>

    </Container>
  );
}

export default HomeHeader;
