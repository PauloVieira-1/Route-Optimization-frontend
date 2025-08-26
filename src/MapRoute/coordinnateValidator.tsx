export class CoordinateValidator {
  /**
   * Check if coordinates are likely to be on land vs ocean
   * This is a simple heuristic - for production use, consider using a proper land/ocean dataset
   */
  static isLikelyOnLand(lat: number, lng: number): boolean {
    // Simple heuristic: avoid obvious ocean areas
    // This is not comprehensive but catches common ocean coordinates
    
    // Pacific Ocean (large areas)
    if (lat > -60 && lat < 60 && lng > -180 && lng < -120) {
      // But allow land areas like western Americas
      if ((lat > 25 && lat < 50 && lng > -130 && lng < -120) || // US West Coast
          (lat > -40 && lat < 15 && lng > -85 && lng < -70)) {   // West Coast Americas
        return true;
      }
      return false;
    }
    
    // Atlantic Ocean center
    if (lat > -40 && lat < 60 && lng > -50 && lng < -10) {
      return false;
    }
    
    // Indian Ocean
    if (lat > -50 && lat < 30 && lng > 40 && lng < 100) {
      return false;
    }
    
    // Antarctica (mostly inaccessible)
    if (lat < -70) {
      return false;
    }
    
    // Arctic Ocean
    if (lat > 80) {
      return false;
    }
    
    // Default to assuming it could be land
    return true;
  }

  /**
   * Validate coordinate format and ranges
   */
  static validateCoordinate(lat: number, lng: number): { valid: boolean; error?: string } {
    if (isNaN(lat) || isNaN(lng)) {
      return { valid: false, error: 'Coordinates must be valid numbers' };
    }
    
    if (lat < -90 || lat > 90) {
      return { valid: false, error: `Latitude ${lat} is out of range (-90 to 90)` };
    }
    
    if (lng < -180 || lng > 180) {
      return { valid: false, error: `Longitude ${lng} is out of range (-180 to 180)` };
    }
    
    if (lat === 0 && lng === 0) {
      return { valid: false, error: 'Coordinates (0,0) are in the ocean off Africa' };
    }
    
    if (!this.isLikelyOnLand(lat, lng)) {
      return { 
        valid: false, 
        error: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) appear to be in the ocean or inaccessible area` 
      };
    }
    
    return { valid: true };
  }

}

export default CoordinateValidator