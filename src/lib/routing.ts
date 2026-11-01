import { CAMPUS_CONFIG, isInsideCampusBoundary, isNearCampus, haversineDistanceKm } from './campus-config';

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface RouteResponse {
  distanceMeters: number;
  durationMinutes: number;
  polyline: [number, number][]; // Array of [lat, lng] pairs for Leaflet Polyline
  source: 'OSRM_LIVE' | 'GEOMETRIC_FALLBACK';
  summary?: string;
}

export interface GeocodeResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

/**
 * Geocode destination query using OpenStreetMap Nominatim.
 * Results are filtered to locations within the PES RR Campus boundary or nearby.
 * Returns { results, outsideCampus } to allow the caller to show a restriction message.
 */
export async function searchDestinations(
  queryStr: string
): Promise<{ results: GeocodeResult[]; outsideCampus: boolean }> {
  if (!queryStr || queryStr.trim().length < 2) return { results: [], outsideCampus: false };

  let allResults: GeocodeResult[] = [];

  try {
    // Bias Nominatim search towards the campus area using viewbox
    const viewbox = '77.5310,12.9370,77.5390,12.9305'; // W,N,E,S
    const encoded = encodeURIComponent(queryStr);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&limit=8&viewbox=${viewbox}&bounded=0`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ParkWise-SmartParking-DBMS/1.0 (university-project)',
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        allResults = data.map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
      }
    }
  } catch (err) {
    console.warn('Nominatim geocoding network error, using local fallback:', err);
  }

  // If Nominatim returned nothing, check curated campus landmarks
  if (allResults.length === 0) {
    const knownLandmarks: GeocodeResult[] = [
      { name: 'PES University Main Gate', displayName: 'PES University Main Gate, 100 Feet Ring Road, Bengaluru', lat: 12.9340, lng: 77.5365 },
      { name: 'PES University MRD Auditorium', displayName: 'MRD Auditorium, PES University RR Campus, Bengaluru', lat: 12.9348, lng: 77.5345 },
      { name: 'PES University Library Block', displayName: 'Library Block, PES University RR Campus, Bengaluru', lat: 12.9335, lng: 77.5348 },
      { name: 'PES University Sports Ground', displayName: 'Sports Ground, PES University RR Campus, Bengaluru', lat: 12.9328, lng: 77.5340 },
      { name: 'PES University Engineering Block', displayName: 'Engineering Block, PES University RR Campus, Bengaluru', lat: 12.9345, lng: 77.5355 },
      { name: 'PES University Parking Area', displayName: 'Student & Staff Parking, PES University RR Campus, Bengaluru', lat: 12.9338, lng: 77.5360 },
    ];

    const q = queryStr.toLowerCase();
    allResults = knownLandmarks.filter(
      (l) => l.name.toLowerCase().includes(q) || l.displayName.toLowerCase().includes(q)
    );
  }

  // Filter results: only return locations inside or near campus
  const campusResults = allResults.filter(
    (r) => isInsideCampusBoundary(r.lat, r.lng) || isNearCampus(r.lat, r.lng)
  );

  if (campusResults.length > 0) {
    return { results: campusResults, outsideCampus: false };
  }

  // If original results exist but none are near campus, report outsideCampus
  if (allResults.length > 0) {
    return { results: [], outsideCampus: true };
  }

  return { results: [], outsideCampus: false };
}

/**
 * Get Driving or Walking Route between two coordinates using OSRM
 */
export async function getRoute(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
  mode: 'driving' | 'walking' = 'driving'
): Promise<RouteResponse> {
  const profile = mode === 'walking' ? 'foot' : 'car';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ParkWise-SmartParking/1.0',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
        const polyline: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
        return {
          distanceMeters: Math.round(route.distance),
          durationMinutes: Math.round(route.duration / 60),
          polyline,
          source: 'OSRM_LIVE',
          summary: `${(route.distance / 1000).toFixed(1)} km, ~${Math.round(route.duration / 60)} mins`,
        };
      }
    }
  } catch (err) {
    console.warn('OSRM route fetch failed, computing geometric fallback:', err);
  }

  // Deterministic Geometric Fallback with realistic road circuitousness factor (1.35x)
  const R = 6371e3;
  const phi1 = (origin.lat * Math.PI) / 180;
  const phi2 = (destination.lat * Math.PI) / 180;
  const deltaPhi = ((destination.lat - origin.lat) * Math.PI) / 180;
  const deltaLambda = ((destination.lng - origin.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const haversineDist = R * c;

  const estimatedRoadDistance = Math.round(haversineDist * (mode === 'walking' ? 1.15 : 1.35));
  const speedMetersPerMin = mode === 'walking' ? 75 : 450; // 4.5 km/h walking vs 27 km/h urban driving
  const durationMinutes = Math.max(1, Math.round(estimatedRoadDistance / speedMetersPerMin));

  // Interpolate intermediate polyline points
  const steps = 6;
  const polyline: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = origin.lat + (destination.lat - origin.lat) * fraction;
    const lng = origin.lng + (destination.lng - origin.lng) * fraction;
    polyline.push([lat, lng]);
  }

  return {
    distanceMeters: estimatedRoadDistance,
    durationMinutes,
    polyline,
    source: 'GEOMETRIC_FALLBACK',
    summary: `${(estimatedRoadDistance / 1000).toFixed(1)} km, ~${durationMinutes} mins (Geometric route)`,
  };
}
