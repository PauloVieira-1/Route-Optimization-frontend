import { Modal, ListGroup, Table } from "react-bootstrap";

interface Route {
  vehicle?: string; // sometimes missing, so optional
  capacity: number;
  route: string[];
}

interface RouteData {
  status: string;
  total_cost: number;
  routes: Route[];
}

interface RoutePlanModalProps {
  show: boolean;
  data?: string | RouteData; // can be JSON string or already parsed object
  onHide: () => void;
}

// Utility to safely parse data
function parseRouteData(data?: string | RouteData): RouteData | null {
  if (!data) return null;
  try {
    if (typeof data === "string") {
      return JSON.parse(data) as RouteData;
    }
    return data as RouteData; // already an object
  } catch (error) {
    console.error("Invalid route data:", error);
    return null;
  }
}

export default function RoutePlanModal({
  show,
  onHide,
  data,
}: RoutePlanModalProps) {
  const parsedData = parseRouteData(data);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Route Plan</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!parsedData ? (
          <p>No data available, try clicking "Calculate" first</p>
        ) : (
          <>
            {/* Status and cost summary */}
            <div className="mb-3">
              <strong>Status:</strong>{" "}
              <span
                className={
                  parsedData.status === "Optimal"
                    ? "text-success"
                    : "text-warning"
                }
              >
                {parsedData.status}
              </span>
              <br />
              <strong>Total Cost:</strong> €{parsedData.total_cost.toFixed(2)}
            </div>

            {/* Routes list */}
            <ListGroup>
              {parsedData.routes.map((route, idx) => (
                <ListGroup.Item
                  key={route.vehicle ?? idx} // always unique
                  className="mb-3"
                >
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
                      {route.route.map((stop, stopIdx) => (
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
    </Modal>
  );
}
