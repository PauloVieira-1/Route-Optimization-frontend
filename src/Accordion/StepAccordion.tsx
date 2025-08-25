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
            First, we prepare a <strong>distance matrix</strong> using the
            <strong> Open Source Routing Machine (OSRM)</strong>. Each depot and
            customer location is converted into <code>lng,lat</code> strings.
          </p>
          <p>
            The API request looks like:
            <br />
            <code>
              const url = `https://router.project-osrm.org/table/v1/driving/$
              {"{depotCoords}"};{"{customerCoords}"}?annotations=distance`;
            </code>
          </p>
          <p>
            The OSRM response is a 2D array: rows correspond to depots and
            columns to all waypoints (depots + customers). This represents
            pairwise travel distances.
          </p>
          <p>
            This distance matrix, along with customer demands and IDs, is sent
            to the backend for further optimization.
          </p>
          <h6>Mathematical Formulation</h6>
          <pre>
            {`Sets:
  D = {depots}, C = {customers}
Parameters:
  c_{ij} = travel cost (distance) from node i to node j

Distance matrix:
  M[i][j] = c_{ij}

Purpose:
  Provides travel costs for customer assignment and routing.`}
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
            Next, we assign customers to depots based on the distance matrix.
            This is formulated as a <strong>Linear Programming (LP)</strong>{" "}
            problem using <code>PuLP</code> in Python, aiming to minimize the
            total assignment cost.
          </p>
          <p>
            Optional capacity constraints for depots can be included to ensure
            no depot is overloaded.
          </p>
          <h6>Mathematical Formulation</h6>
          <pre>
            {`Decision variables:
  y_{ij} = 1 if customer j ∈ C is assigned to depot i ∈ D, 0 otherwise

Objective:
  Minimize total assignment cost: 
    ∑_{i∈D} ∑_{j∈C} c_{ij} * y_{ij}

Constraints:
  1. Each customer assigned to exactly one depot:
       ∑_{i∈D} y_{ij} = 1, ∀ j ∈ C
  2. Depot capacity (optional):
       ∑_{j∈C} demand_j * y_{ij} ≤ capacity_i, ∀ i ∈ D`}
          </pre>
          <p>
            The LP output provides the total cost and a list of
            customer-to-depot assignments. These assignments feed directly into
            the routing step.
          </p>
        </Accordion.Body>
      </Accordion.Item>

      {/* Step 3: Constructing Routes (Multiple-Depot VRP) */}
      <Accordion.Item eventKey="2">
        <Accordion.Header>
          Step 3: Constructing Routes (Multiple-Depot VRP)
        </Accordion.Header>
        <Accordion.Body>
          <p>
            With customer assignments determined, we solve the
            <strong> Multiple-Depot Vehicle Routing Problem (MDVRP)</strong>.
            Each depot may dispatch one or more vehicles, each with limited
            capacity. Vehicles may remain unused if not needed.
          </p>
          <p>The key model components are:</p>
          <ul>
            <li>
              <strong>Customer coverage:</strong> each customer is visited
              exactly once.
            </li>
            <li>
              <strong>Depot linkage:</strong> vehicles start and end at the same
              depot (closed routes).
            </li>
            <li>
              <strong>Capacity:</strong> the total demand on a route cannot
              exceed the vehicle’s capacity.
            </li>
            <li>
              <strong>Flow conservation:</strong> if a vehicle enters a node, it
              must also leave it.
            </li>
            <li>
              <strong>Subtour elimination:</strong> Miller–Tucker–Zemlin (MTZ)
              constraints prevent disconnected loops.
            </li>
          </ul>
          <p>
            The optimization minimizes the total travel distance while
            satisfying all constraints, yielding an optimized set of vehicle
            routes per depot.
          </p>
          <h6>Mathematical Formulation</h6>
          <pre>
            {`Sets:
  D = {depots}, C = {customers}, K = {vehicles}

Parameters:
  c_{ij} = travel cost from node i to node j
  q_j = demand of customer j
  Q_k = capacity of vehicle k

Decision variables:
  x_{ijk} = 1 if vehicle k travels from node i to node j, 0 otherwise
  u_j = load of vehicle after visiting customer j

Objective:
  Minimize total distance:
    ∑_{k∈K} ∑_{i∈D∪C} ∑_{j∈D∪C} c_{ij} * x_{ijk}

Constraints:
  1. Each customer visited exactly once:
       ∑_{i∈D∪C} ∑_{k∈K} x_{ijk} = 1, ∀ j ∈ C
  2. Capacity:
       u_j + q_j ≤ Q_k, ∀ j ∈ C, k ∈ K
  3. Flow conservation:
       ∑_{i} x_{ijk} = ∑_{m} x_{jmk}, ∀ j ∈ C, ∀ k ∈ K
  4. Depot linkage:
       Routes start and end at the assigned depot
  5. Subtour elimination (MTZ):
       u_i - u_j + Q_k * x_{ijk} ≤ Q_k - q_j`}
          </pre>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

export default StepAccordion;
