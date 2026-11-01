'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Navigation,
  MapPin,
  Car,
  Zap,
  Accessibility,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

/** Campus config values (duplicated client-side from lib/campus-config.ts) */
const CAMPUS = {
  center: { lat: 12.9342, lng: 77.5350 },
  defaultZoom: 17,
  boundary: [
    { lat: 12.9365, lng: 77.5320 },
    { lat: 12.9368, lng: 77.5375 },
    { lat: 12.9315, lng: 77.5380 },
    { lat: 12.9312, lng: 77.5325 },
  ],
  outsideCampusMessage:
    'ParkWise currently supports parking management only within PES University Ring Road Campus.',
  noFacilitiesMessage:
    'No registered parking facilities found in this area.',
};

export interface ParkingFacility {
  id: string;
  name: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  total_slots: number;
  currently_occupied?: number;
  currently_available?: number;
  occupancy_percentage?: number;
  min_hourly_rate?: number;
  max_hourly_rate?: number;
  ev_slots_count?: number;
  accessible_slots_count?: number;
  distanceKm?: number;
}

export default function MapComponent({
  onSelectFacility,
}: {
  onSelectFacility?: (facility: ParkingFacility) => void;
}) {
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<ParkingFacility | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Searched location marker
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const layersRef = useRef<{
    markers: any[];
    boundaryPolygon?: any;
  }>({ markers: [] });

  // 1. Fetch facilities on load
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async (destLat?: number, destLng?: number) => {
    try {
      let url = '/api/facilities';
      if (destLat && destLng) {
        url += `?destLat=${destLat}&destLng=${destLng}&radiusKm=5`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
        if (data.facilities?.length > 0 && !selectedFacility) {
          setSelectedFacility(data.facilities[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load facilities', e);
    }
  };

  // 2. Initialize Leaflet in browser safely
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      const L = (await import('leaflet')).default;

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current).setView(
          [CAMPUS.center.lat, CAMPUS.center.lng],
          CAMPUS.defaultZoom
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Draw campus boundary polygon
        const boundaryCoords = CAMPUS.boundary.map(p => [p.lat, p.lng] as [number, number]);
        const boundaryPoly = L.polygon(boundaryCoords, {
          color: '#6366f1',
          weight: 2,
          opacity: 0.6,
          fillColor: '#6366f1',
          fillOpacity: 0.05,
          dashArray: '6, 4',
        }).addTo(map);
        boundaryPoly.bindTooltip('PES RR Campus Boundary', {
          permanent: false,
          direction: 'center',
          className: 'campus-boundary-tooltip',
        });
        layersRef.current.boundaryPolygon = boundaryPoly;

        leafletMapRef.current = map;
        if (isMounted) setMapReady(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Render markers when state updates
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      const map = leafletMapRef.current;

      // Clear existing markers
      layersRef.current.markers.forEach((m) => m.remove());
      layersRef.current.markers = [];

      // Custom icon generators
      const createIcon = (color: string, label: string) =>
        L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${color}; color: white; border-radius: 9999px; padding: 4px 8px; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); border: 2px solid white; display: flex; align-items: center; gap: 4px; white-space: nowrap;">${label}</div>`,
          iconSize: [100, 30],
          iconAnchor: [50, 15],
        });

      // Searched Location Marker
      if (searchedLocation) {
        const searchMarker = L.marker([searchedLocation.lat, searchedLocation.lng], {
          icon: createIcon('#ef4444', `📍 ${searchedLocation.name.substring(0, 20)}`),
        })
          .addTo(map)
          .bindPopup(`<b>Searched Location</b><br/>${searchedLocation.name}`);
        layersRef.current.markers.push(searchMarker);
      }

      // Facility Markers from MySQL
      facilities.forEach((fac) => {
        const isSelected = selectedFacility?.id === fac.id;
        const slotsAvailable = fac.currently_available ?? fac.total_slots;
        const color = isSelected ? '#4f46e5' : '#1e293b';

        const facMarker = L.marker([Number(fac.latitude), Number(fac.longitude)], {
          icon: createIcon(color, `🅿 ${fac.name.split(' ')[0]} (${slotsAvailable})`),
        })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; min-width: 180px;">
              <strong style="color: #4f46e5; font-size: 13px;">${fac.name}</strong><br/>
              <span style="color: #64748b;">${fac.address}</span><br/>
              <b>Available:</b> ${slotsAvailable} / ${fac.total_slots} slots<br/>
              <b>Rate:</b> ₹${fac.min_hourly_rate ?? 5.00}/hr
              ${fac.distanceKm !== undefined && fac.distanceKm !== null ? `<br/><b>Distance:</b> ${fac.distanceKm} km` : ''}
            </div>
          `);

        facMarker.on('click', () => {
          setSelectedFacility(fac);
          if (onSelectFacility) onSelectFacility(fac);
        });

        layersRef.current.markers.push(facMarker);
      });
    }

    updateMarkers();
  }, [mapReady, facilities, selectedFacility, searchedLocation]);

  // Search using backend geocoding proxy with campus boundary validation
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchMessage(null);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/geocoding?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();

        if (data.outsideCampus) {
          setSearchMessage(data.message || CAMPUS.outsideCampusMessage);
          setSearchResults([]);
          return;
        }

        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
        } else {
          setSearchMessage('No results found. Try searching within the campus area.');
        }
      }
    } catch {
      setSearchMessage('Search service unavailable. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const location = { lat: result.lat, lng: result.lng, name: result.name };
    setSearchedLocation(location);
    setSearchResults([]);
    setSearchQuery(result.name);
    setSearchMessage(null);

    // Move map to searched location
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([result.lat, result.lng], 18);
    }

    // Refresh facilities near this location
    fetchFacilities(result.lat, result.lng);
  };

  const onFacilityCardClick = (fac: ParkingFacility) => {
    setSelectedFacility(fac);
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([Number(fac.latitude), Number(fac.longitude)], 18);
    }
    if (onSelectFacility) onSelectFacility(fac);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Map Left / Main View */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Controls Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search within PES RR Campus (e.g. Library, Main Gate, Parking Area)..."
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-sm px-4 py-2.5 pl-10 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <button
                type="submit"
                disabled={isSearching}
                className="ml-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
              </button>
            </form>

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 border-b border-slate-700/50 last:border-0 flex items-start space-x-2"
                  >
                    <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-100">{r.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{r.displayName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Message (campus restriction or no results) */}
          {searchMessage && (
            <div className="flex items-start space-x-2 bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{searchMessage}</span>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[460px] rounded-xl overflow-hidden border border-slate-800 shadow-md">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 text-[11px] rounded-lg p-2.5 z-[1000] shadow-lg text-slate-300 space-y-1">
            <div className="font-semibold text-indigo-300 mb-1 text-xs">PES University RR Campus</div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              <span>Campus Boundary</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
              <span>Registered Parking Facilities</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Searched Location</span>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities Sidebar */}
      <div className="w-full lg:w-96 flex flex-col space-y-4">
        {/* Nearby Registered Facilities List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-white flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Registered Parking Facilities</span>
            </h3>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-mono">
              {facilities.length} in campus
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 text-xs">
            {facilities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p>{CAMPUS.noFacilitiesMessage}</p>
              </div>
            ) : (
              facilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                const slotsFree = fac.currently_available ?? fac.total_slots;

                return (
                  <div
                    key={fac.id}
                    onClick={() => onFacilityCardClick(fac)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-600 ring-1 ring-indigo-500/50 shadow-md'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">{fac.name}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{fac.address}</div>
                      </div>
                      {fac.distanceKm !== undefined && fac.distanceKm !== null && (
                        <span className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                          {fac.distanceKm} km
                        </span>
                      )}
                    </div>

                    {/* Amenities Tags */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                      <span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>{fac.ev_slots_count || 0} EV</span>
                      </span>
                      <span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded flex items-center space-x-1">
                        <Accessibility className="w-3 h-3 text-blue-400" />
                        <span>{fac.accessible_slots_count || 0} ADA</span>
                      </span>
                      <span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded">
                        ₹{fac.min_hourly_rate ?? 5.00}/hr
                      </span>
                    </div>

                    {/* Availability Gauge */}
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <div className="text-[11px] text-slate-300">
                        <span className="font-bold text-emerald-400">{slotsFree}</span> / {fac.total_slots} slots free
                      </div>
                      <a
                        href={`/reservations?facilityId=${fac.id}`}
                        className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
