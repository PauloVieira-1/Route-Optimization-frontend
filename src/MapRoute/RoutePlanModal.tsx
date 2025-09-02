import { Modal, Button, ListGroup, Table } from "react-bootstrap";

interface RoutePlanModalProps {
  show: boolean;
  data?: any;
  onHide: () => void;
}

export default function RoutePlanModal({
  show,
  onHide,
  data,
}: RoutePlanModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Route Plan</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!data ? (
          <p>No data available, try clicking "Calculate" first</p>
        ) : (
          <>
            {/* Status and cost summary */}
            <div className="mb-3">
              <strong>Status:</strong>{" "}
              <span
                className={
                  data.status === "Optimal" ? "text-success" : "text-warning"
                }
              >
                {data.status}
              </span>
              <br />
              <strong>Total Cost:</strong> €{data.total_cost.toFixed(2)}
            </div>

            {/* Routes list */}
            <ListGroup>
              {data.routes.map((route: any, idx: number) => (
                <ListGroup.Item key={idx} className="mb-3">
                  <h6 className="fw-bold">Vehicle: {idx + 1}</h6>
                  <p>
                    <strong>Capacity:</strong> {route.capacity}
                  </p>

                  <Table striped bordered size="sm" className="mb-2">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Stop</th>
                      </tr>
                    </thead>
                    <tbody>
                      {route.route.map((stop: string, stopIdx: number) => (
                        <tr key={stopIdx}>
                          <td>{stopIdx + 1}</td>
                          <td>{stop}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Modal.Body>

      {/* <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={() => alert("Route planned!")}>
          Plan Route
        </Button>
      </Modal.Footer> */}
    </Modal>
  );
}
