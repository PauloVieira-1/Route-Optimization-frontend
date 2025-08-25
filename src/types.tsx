interface Customer {
  id: number;
  customer_name: string;
  customer_x: number;
  customer_y: number;
  demand: number;
}

interface Depot {
  id: number;
  depot_name: string;
  depot_x: number;
  depot_y: number;
  capacity: number;
  maxDistance: number;
  type: string;
}

interface Vehicle {
  id: number;
  capacity: number;
  depot_id: number;
}

interface Route {
  id: number;
  route: [number, number][];
}

export type { Customer, Depot, Vehicle, Route };
