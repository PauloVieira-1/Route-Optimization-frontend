import { Modal } from "react-bootstrap";

interface InfoModalProps {
  show: boolean;
  onHide: () => void;
}

function InfoModal({ show, onHide }: InfoModalProps) {
  const headerStyle: React.CSSProperties = {
    borderBottom: "1px solid #f0f0f0",
    fontWeight: 600,
    fontSize: "1.4rem",
    paddingBottom: "0.5rem",
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: "1rem",
    lineHeight: 1.6,
    color: "#333",
    paddingTop: "0.8rem",
    paddingBottom: "1.5rem",
    paddingLeft: "2.5rem",
    paddingRight: "2.5rem",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: "1.1rem",
    marginTop: "1.5rem",
    marginBottom: "0.5rem",
    color: "#111",
  };

  const paragraphStyle: React.CSSProperties = {
    marginBottom: "1rem",
  };

  const listStyle: React.CSSProperties = {
    paddingLeft: "1.2rem",
    marginBottom: "1rem",
  };

  const highlightRed: React.CSSProperties = {
    color: "#e53935",
    fontWeight: "600",
  };

  const highlightBlue: React.CSSProperties = {
    color: "#1e88e5",
    fontWeight: "600",
  };

  return (
    <Modal show={show} onHide={onHide} centered className="">
      <Modal.Header closeButton style={headerStyle}>
        How to Use the Application
      </Modal.Header>

      <Modal.Body style={bodyStyle}>
        <div>
          <h6 style={sectionTitleStyle}>Map Pins</h6>
          <p style={paragraphStyle}>
            On the map, <span style={highlightRed}>red pins</span> represent{" "}
            <b>customers</b> with specific demand values, while{" "}
            <span style={highlightBlue}>blue pins</span> represent <b>depots</b>{" "}
            where vehicles start and supply is stored.
          </p>
        </div>

        <div>
          <h6 style={sectionTitleStyle}>Adding Vehicles</h6>
          <p style={paragraphStyle}>
            You can add vehicles to each depot. Each vehicle has a{" "}
            <b>capacity</b> that determines how much demand it can serve from
            customers. Make sure to configure enough vehicles to cover total
            demand.
          </p>
        </div>

        <div>
          <h6 style={sectionTitleStyle}>Constraints</h6>
          <p style={paragraphStyle}>
            The problem requires the following constraints to be satisfied:
          </p>
          <ul style={listStyle}>
            <li>
              Total <b>customer demand</b> must equal total{" "}
              <b>vehicle supply</b> across depots.
            </li>
            <li>
              Each vehicle can only serve customers up to its <b>capacity</b>.
            </li>
            <li>Every customer must be visited by exactly one vehicle.</li>
            <li>Additional constraints can be added as needed.</li>
          </ul>
        </div>

        <div>
          <h6 style={sectionTitleStyle}>Running the Calculation</h6>
          <p style={paragraphStyle}>
            Once customers, depots, and vehicles are set, click the{" "}
            <b>Calculate</b> button. The solver will generate optimized vehicle
            routes that minimize travel distance while satisfying the
            constraints.
          </p>
        </div>
      </Modal.Body>

      {/* <Modal.Footer className="d-flex justify-content-end">
        <Button
          variant="primary"
          onClick={onHide}
          className="rounded-pill button-circle bg-custom-color-grey-lighter mx-1 px-5 py-4"
        >
          Close
        </Button>
      </Modal.Footer> */}
    </Modal>
  );
}

export default InfoModal;
