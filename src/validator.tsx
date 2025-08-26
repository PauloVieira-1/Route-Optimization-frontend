import type { Customer, Depot, Vehicle } from "./types";

class InputValidator {
  private customers: Customer[] = [];
  private depots: Depot[] = [];
  private vehicles: Vehicle[] = [];
  private errors: string[] = [];

  constructor(customers: Customer[] = [], depots: Depot[] = [], vehicles: Vehicle[] = []) {
    this.customers = customers;
    this.depots = depots;
    this.vehicles = vehicles;
  }

  // Set or update data
  setData(customers: Customer[], depots: Depot[], vehicles: Vehicle[]) {
    this.customers = customers;
    this.depots = depots;
    this.vehicles = vehicles;
  }

  // Reset errors manually
  resetErrors() {
    this.errors = [];
  }


  // Add an error to the list (avoid duplicates)
  public addError(error: string) {
    if (!this.errors.includes(error)) {
      this.errors.push(error);
      console.error("Validator error added:", error);
    }
  }

  // Validate total demand vs vehicle capacity
  private isTotalDemandValid() {
    const totalDemand = this.customers.reduce((total, c) => total + c.demand, 0);
    const totalCapacity = this.vehicles.reduce((total, v) => total + v.capacity, 0);
    if (totalDemand > totalCapacity) {
      this.addError("Total demand is greater than total capacity");
    }
  }

  // Validate total supply vs vehicle capacity
  private isTotalSupplyValid() {
    const totalSupply = this.depots.reduce((total, d) => total + d.capacity, 0);
    const totalCapacity = this.vehicles.reduce((total, v) => total + v.capacity, 0);
    if (totalSupply > totalCapacity) {
      this.addError("Total supply is greater than total capacity");
    }
  }

  // Placeholder for routing/accessibility checks
  private isAccessible() {
    // Implement additional accessibility checks here
  }

  // Run all validations
  isValid() {
    this.resetErrors();
    this.isTotalDemandValid();
    this.isTotalSupplyValid();
    this.isAccessible();
    return this.errors.length === 0;
  }

  // Get current errors
  getErrors() {
    return this.errors;
  }
}

export default InputValidator;
