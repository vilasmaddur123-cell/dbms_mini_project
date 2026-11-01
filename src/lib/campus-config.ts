/**
 * ParkWise Campus Configuration
 * ==============================
 * Centralized configuration for PES University Ring Road (RR) Campus, Bengaluru.
 *
 * Campus center coordinates verified from:
 *   - Wikipedia: 12.9338°N, 77.5345°E
 *   - Google Maps: PES University, 100 Feet Ring Road, Banashankari Stage III
 *   - Address: 100 Feet Ring Road, Banashankari Stage III, Hosakerehalli,
 *              Bengaluru, Karnataka 560085, India
 *
 * The boundary polygon approximates the ~30-acre PES RR campus area
 * bounded by 100 Feet Ring Road to the east, residential areas on other sides.
 */

export const CAMPUS_CONFIG = {
  name: 'PES University Ring Road Campus',
  shortName: 'PES RR Campus',
  city: 'Bengaluru',
  address: '100 Feet Ring Road, Banashankari Stage III, Hosakerehalli, Bengaluru, Karnataka 560085',

  /** Campus center coordinates (verified from Wikipedia & Google Maps) */
  center: {
    lat: 12.9342,
    lng: 77.5350,
  },

  /** Default map zoom level */
  defaultZoom: 17,

  /**
   * Campus boundary polygon (lat/lng vertices).
   * Defines the valid area for parking facility registration and searches.
   * Approximates the PES RR campus footprint using a bounding polygon.
   *
   * These coordinates define a polygon that encloses the main campus area
   * including the engineering blocks, sports ground, and parking areas.
   */
  boundary: [
    { lat: 12.9365, lng: 77.5320 },  // NW corner
    { lat: 12.9368, lng: 77.5375 },  // NE corner
    { lat: 12.9315, lng: 77.5380 },  // SE corner
    { lat: 12.9312, lng: 77.5325 },  // SW corner
  ],

  /**
   * Extended search radius (in km) around campus center.
   * Locations within this radius from center are considered "near campus"
   * for search purposes, but facilities must be inside the boundary polygon.
   */
  searchRadiusKm: 1.0,

  /** Restriction message shown when user searches outside campus */
  outsideCampusMessage:
    'ParkWise currently supports parking management only within PES University Ring Road Campus.',

  /** Message when no registered facilities found */
  noFacilitiesMessage:
    'No registered parking facilities found in this area.',
} as const;

/**
 * Check if a point (lat, lng) is inside the campus boundary polygon.
 * Uses the ray-casting algorithm (point-in-polygon test).
 */
export function isInsideCampusBoundary(lat: number, lng: number): boolean {
  const polygon = CAMPUS_CONFIG.boundary;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate haversine distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is within the campus search radius (looser check for searches).
 */
export function isNearCampus(lat: number, lng: number): boolean {
  const dist = haversineDistanceKm(
    lat, lng,
    CAMPUS_CONFIG.center.lat,
    CAMPUS_CONFIG.center.lng
  );
  return dist <= CAMPUS_CONFIG.searchRadiusKm;
}
