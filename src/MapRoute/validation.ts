import Validator from "../validator";
import type { Customer, Depot, Vehicle } from "../types";

/**
 * Validate coordinates using the Validator class.
 */
export const validateData = (
  lat: number,
  lng: number,
  customers: Customer[],
  depots: Depot[],
  vehicles: Vehicle[],
  validationErrors: string[]
): boolean => {

  // 1️⃣ Create a validator instance
  const validator = new Validator(customers, depots, vehicles);

  // 2️⃣ First, validate the coordinate itself
  const coordValidation = Validator.validateCoordinate(lat, lng);
  if (!coordValidation.valid) {
    validationErrors.push(coordValidation.error || "Invalid coordinates");
    return false;
  }

  // 4️⃣ Run other class checks if needed (optional)
  validator.isValid();
  const classErrors = validator.getErrors();
  if (classErrors.length > 0) {
    validationErrors.push(...classErrors);
    return false;
  }

  return true;
};
