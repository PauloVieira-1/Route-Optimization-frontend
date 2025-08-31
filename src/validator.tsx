import type { Customer, Depot, Vehicle } from "./types";

class Validator {
  private customers: Customer[] = [];
  private depots: Depot[] = [];
  private vehicles: Vehicle[] = [];
  private errors: string[] = [];

  constructor(
    customers: Customer[] = [],
    depots: Depot[] = [],
    vehicles: Vehicle[] = [],
  ) {
    this.customers = customers;
    this.depots = depots;
    this.vehicles = vehicles;
  }

  public getErrors(): string[] {
    return this.errors;
  }

  private addError(error: string) {
    if (!this.errors.includes(error)) {
      this.errors.push(error);
      console.error(error);
    }
  }

  public setData(customers: Customer[], depots: Depot[], vehicles: Vehicle[]) {
    this.customers = customers;
    this.depots = depots;
    this.vehicles = vehicles;
  }

  // --- Coordinate validation ---
  private static isLikelyOnLand(lat: number, lng: number): boolean {
    if (lat > -60 && lat < 60 && lng > -180 && lng < -120) {
      if (
        (lat > 25 && lat < 50 && lng > -130 && lng < -120) ||
        (lat > -40 && lat < 15 && lng > -85 && lng < -70)
      )
        return true;
      return false;
    }
    if (lat > -40 && lat < 60 && lng > -50 && lng < -10) return false;
    if (lat > -50 && lat < 30 && lng > 40 && lng < 100) return false;
    if (lat < -70 || lat > 80) return false;
    return true;
  }

  public static validateCoordinate(
    lat: number,
    lng: number,
  ): { valid: boolean; error?: string } {
    if (isNaN(lat) || isNaN(lng))
      return { valid: false, error: "Coordinates must be valid numbers" };
    if (lat < -90 || lat > 90)
      return {
        valid: false,
        error: `Latitude ${lat} is out of range (-90 to 90)`,
      };
    if (lng < -180 || lng > 180)
      return {
        valid: false,
        error: `Longitude ${lng} is out of range (-180 to 180)`,
      };
    if (lat === 0 && lng === 0)
      return {
        valid: false,
        error: "Coordinates (0,0) are in the ocean off Africa",
      };
    if (!Validator.isLikelyOnLand(lat, lng))
      return {
        valid: false,
        error: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) appear to be in the ocean or inaccessible area`,
      };
    return { valid: true };
  }

  public static areCoordinatesTooClose(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    minDistanceMeters: number,
  ): boolean {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance < minDistanceMeters;
  }

  // --- Validation methods ---
  private checkCoordinates() {
    const allCoords: {
      type: string;
      name: string;
      lat: number;
      lng: number;
    }[] = [];

    this.customers.forEach((c) =>
      allCoords.push({
        type: "Customer",
        name: c.customer_name,
        lat: c.customer_x,
        lng: c.customer_y,
      }),
    );
    this.depots.forEach((d) =>
      allCoords.push({
        type: "Depot",
        name: d.depot_name,
        lat: d.depot_x,
        lng: d.depot_y,
      }),
    );

    // Check individual coordinates and duplicates
    for (const item of allCoords) {
      const coordValidation = Validator.validateCoordinate(item.lat, item.lng);
      if (!coordValidation.valid && coordValidation.error) {
        this.addError(`${item.type} "${item.name}": ${coordValidation.error}`);
      }

      for (const other of allCoords) {
        if (item === other) continue;
        if (
          Validator.areCoordinatesTooClose(
            item.lat,
            item.lng,
            other.lat,
            other.lng,
            100,
          )
        ) {
          this.addError(
            `${item.type} "${item.name}" is too close to ${other.type} "${other.name}"`,
          );
        }
      }
    }
  }

  private checkCapacity() {
    const totalDemand = this.customers.reduce(
      (sum, c) => sum + (c.demand || 0),
      0,
    );
    const totalSupply = this.depots.reduce(
      (sum, d) => sum + (d.capacity || 0),
      0,
    );
    const totalCapacity = this.vehicles.reduce(
      (sum, v) => sum + (v.capacity || 0),
      0,
    );

    if (totalCapacity === 0) return; // skip if no vehicles

    if (totalDemand > totalCapacity)
      this.addError(
        `Total demand (${totalDemand}) exceeds total vehicle capacity (${totalCapacity})`,
      );
    if (totalSupply > totalCapacity)
      this.addError(
        `Total depot supply (${totalSupply}) exceeds total vehicle capacity (${totalCapacity})`,
      );
  }

  // --- Main validation ---
  public validateAll(): string[] {
    this.errors = [];
    this.checkCoordinates();
    this.checkCapacity();
    return this.errors;
  }
}

export default Validator;
