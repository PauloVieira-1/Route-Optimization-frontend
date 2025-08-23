import Accordion from "react-bootstrap/Accordion";

function StepAccordion() {
  return (
    <Accordion defaultActiveKey="0" alwaysOpen>
      {/* Step 1: Building the Distance Matrix */}
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          Step 1: Building the Distance Matrix
        </Accordion.Header>
        <Accordion.Body>
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
          <h6>Mathematical Formulation</h6>
          <pre>
            {`Let D = set of depots, C = set of customers
Let c_{ij} = travel cost (distance) from depot i ∈ D to customer j ∈ C

Distance matrix M:
  M[i][j] = c_{ij}

This matrix serves as input for customer assignment and routing steps.`}
          </pre>
        </Accordion.Body>
      </Accordion.Item>

      {/* Step 2: Assigning Customers to Depots */}
      <Accordion.Item eventKey="1">
        <Accordion.Header>
          Step 2: Assigning Customers to Depots
        </Accordion.Header>
        <Accordion.Body>
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
            the total assignment cost:
          </p>
          <h6>Mathematical Formulation</h6>
          <pre>
            {`Decision variables:
  y_{ij} = 1 if customer j ∈ C is assigned to depot i ∈ D, 0 otherwise

Objective:
  Minimize total assignment cost: ∑_{i∈D} ∑_{j∈C} c_{ij} * y_{ij}

Constraints:
  1. Each customer is assigned to exactly one depot: ∑_{i∈D} y_{ij} = 1 ∀ j ∈ C
  2. Optional: Depot capacity constraints: ∑_{j∈C} demand_j * y_{ij} ≤ capacity_i ∀ i ∈ D`}
          </pre>
          <p>
            The output specifies the total cost of assignments and a list of
            shipment decisions that map each customer to a depot.
          </p>
        </Accordion.Body>
      </Accordion.Item>

      {/* Step 3: Solving the Multiple-Depot Vehicle Routing Problem */}
      <Accordion.Item eventKey="2">
        <Accordion.Header>
          Step 3: Constructing Routes (Multiple-Depot VRP)
        </Accordion.Header>
        <Accordion.Body>
          <p>
            With customers assigned to depots, the problem is modeled as a{" "}
            <strong>Multiple-Depot Vehicle Routing Problem (MDVRP)</strong>.
            Each depot can dispatch one or more vehicles, each with a capacity
            limit, to serve its assigned customers.
          </p>
          <p>The model enforces the following rules:</p>
          <ul>
            <li>Each customer is visited exactly once.</li>
            <li>
              Vehicles start and end at the same depot (unless open tours are
              allowed).
            </li>
            <li>Each vehicle cannot exceed its maximum capacity.</li>
            <li>
              Outgoing edges from depots correspond to vehicles leaving the
              depot.
            </li>
            <li>
              Incoming edges to depots correspond to vehicles returning to the
              depot.
            </li>
            <li>
              Subtour elimination (via Miller–Tucker–Zemlin or other
              constraints) applies to customer nodes to prevent disconnected
              routes.
            </li>
          </ul>
          <p>
            The solution produces a set of{" "}
            <strong>optimized vehicle routes</strong>— one or more per
            depot—that minimize total travel cost while respecting capacity and
            depot constraints.
          </p>
          <h6>Mathematical Formulation</h6>
          <pre>
            {`Decision variables:
  x_{ijk} = 1 if vehicle k travels from customer i to customer j, 0 otherwise
  u_i = load accumulated by the vehicle after visiting customer i

Objective:
  Minimize total distance: ∑_{i,j,k} c_{ij} * x_{ijk}

Constraints:
  1. Each customer visited exactly once: ∑_{i,k} x_{ijk} = 1 ∀ j
  2. Vehicle capacity: u_i ≤ capacity_k ∀ i,k
  3. Flow conservation: ∑_{i} x_{ijk} = ∑_{j} x_{jik} ∀ k, ∀ i (customers)
  4. Vehicles start and end at their assigned depot
  5. Subtour elimination (MTZ or other)`}
          </pre>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

export default StepAccordion;
