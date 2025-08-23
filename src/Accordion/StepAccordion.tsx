import Accordion from "react-bootstrap/Accordion";

function StepAccordion() {
  return (
    <Accordion defaultActiveKey="0" alwaysOpen className="rounded-5 shadow">
      {/* Step 1: Building the Distance Matrix */}
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <strong className="fw-bold ">
            Step 1: Building the Distance Matrix{" "}
          </strong>
        </Accordion.Header>
        <Accordion.Body className="p-5">
          <p>
            The process begins by preparing a distance matrix using the{" "}
            <strong>Open Source Routing Machine (OSRM)</strong>. Each depot and
            customer location is converted into the required format (
            <code>lng,lat</code> strings).
          </p>
          <p>
            A request is then made to the OSRM API:
            <br />
            <code>
              const url = `https://router.project-osrm.org/table/v1/driving/$
              {"{depotCoords}"};{"{customerCoords}"}?annotations=distance`;
            </code>
          </p>
          <p>
            The OSRM service returns a 2D matrix where rows correspond to depots
            and columns correspond to all waypoints (depots + customers). This
            matrix represents the pairwise travel distances.
          </p>
          <p>
            Once the distance matrix is received, the data is packaged together
            with demand information, customer IDs, and depot IDs, and sent to
            the backend for optimization.
          </p>
          <h6>Mathematical Notation</h6>
          <pre>
            {`Let D = set of depots
    C = set of customers
    c_{ij} = distance from location i to location j (from OSRM)

Distance matrix M = [c_{ij}], where i ∈ D, j ∈ (D ∪ C)`}
          </pre>
        </Accordion.Body>
      </Accordion.Item>

      {/* Step 2: Assigning Customers to Depots */}
      <Accordion.Item eventKey="1">
        <Accordion.Header>
          <strong className="fw-bold ">
            Step 2: Assigning Customers to Depots{" "}
          </strong>
        </Accordion.Header>
        <Accordion.Body className="p-5">
          <p>
            The next step determines which depots should serve which customers.
            This is based on travel distances from the matrix, under the
            assumption that{" "}
            <strong>transportation cost is proportional to distance</strong>.
            (Future versions will allow for more complex cost functions.)
          </p>
          <p>
            The optimization is formulated as a{" "}
            <strong>Linear Programming problem</strong> using the{" "}
            <code>PuLP</code> package in Python. The objective is to minimize
            the total assignment cost.
          </p>
          <h6>Mathematical Formulation</h6>
          <pre>
            {`Decision variable:
   x_{ij} = 1 if customer j ∈ C is assigned to depot i ∈ D
            0 otherwise

Objective:
   Minimize   ∑_{i ∈ D} ∑_{j ∈ C} c_{ij} x_{ij}

Constraints:
   ∑_{i ∈ D} x_{ij} = 1   ∀ j ∈ C    (each customer is assigned to exactly one depot)
   x_{ij} ∈ {0,1}`}
          </pre>
          <p>
            The output specifies the total cost of assignments and a list of
            shipment decisions that map each customer to a depot.
          </p>
        </Accordion.Body>
      </Accordion.Item>

      {/* Step 3: Solving the Multiple-Depot mTSP */}
      <Accordion.Item eventKey="2">
        <Accordion.Header>
          {" "}
          <strong className="fw-bold ">
            Step 3: Constructing Routes (Multiple-Depot mTSP){" "}
          </strong>
        </Accordion.Header>
        <Accordion.Body className="p-5">
          <p>
            With customers assigned to depots, the problem reduces to a{" "}
            <strong>Multiple-Depot Traveling Salesman Problem (MDTSP)</strong>.
            Each depot serves as the start (and end) location for exactly one
            salesperson (or vehicle).
          </p>
          <p>The model enforces the following rules:</p>
          <ul>
            <li>Each non-depot city is visited exactly once.</li>
            <li>
              A route must start and end at the same depot (unless open tours
              are explicitly allowed).
            </li>
            <li>
              Outgoing edges from each depot are limited to 1, meaning at most
              one route can leave a depot.
            </li>
            <li>
              Incoming edges to each depot are also limited to 1, ensuring
              routes return properly.
            </li>
            <li>
              Subtour elimination (via Miller–Tucker–Zemlin constraints) applies
              only to customer nodes, preventing disjoint cycles that exclude a
              depot.
            </li>
          </ul>
          <h6>Mathematical Formulation (MDTSP with MTZ)</h6>
          <pre>
            {`Decision variables:
   x_{ij} = 1 if edge (i,j) is used in a route, 0 otherwise
   u_i    = ordering variable for MTZ (only for customers)

Objective:
   Minimize   ∑_{i ∈ D ∪ C} ∑_{j ∈ D ∪ C, j ≠ i} c_{ij} x_{ij}

Constraints:
   ∑_{i ∈ D ∪ C, i ≠ j} x_{ij} = 1   ∀ j ∈ C   (each customer entered once)
   ∑_{j ∈ D ∪ C, j ≠ i} x_{ij} = 1   ∀ i ∈ C   (each customer exited once)

   ∑_{j ∈ C} x_{dj} ≤ 1              ∀ d ∈ D   (at most one route leaves each depot)
   ∑_{i ∈ C} x_{id} ≤ 1              ∀ d ∈ D   (at most one route returns to each depot)

MTZ subtour elimination:
   u_i - u_j + (|C|) * x_{ij} ≤ |C|-1    ∀ i,j ∈ C, i ≠ j
   1 ≤ u_i ≤ |C|                         ∀ i ∈ C`}
          </pre>
          <p>
            The solution of this step yields a set of{" "}
            <strong>optimized routes</strong>
            —one per depot—that minimize total travel cost while respecting the
            constraints of the multiple-depot formulation.
          </p>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

export default StepAccordion;
