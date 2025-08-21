interface Customer {
  id: number;
  customer_name: string;
  customer_x: number;
  customer_y: number;
  demand: number;
}

interface Depot {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  maxDistance: number;
  type: string;
}

interface Vehicle {
  id: number;
  capacity: number;
  maxDistance: number;
}

export type { Customer, Depot, Vehicle };
