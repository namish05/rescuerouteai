import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export const LeafletMap = ({
  center = [28.6000, 77.2150],
  zoom = 13,
  ambulancePos = null,
  routeCoordinates = [],
  intersections = [],
  hospitals = [],
  pickupLocation = null,
  destinationHospital = null,
  isGreenCorridorActive = false,
  onIntersectionClick = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const ambulanceMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const intersectionMarkersRef = useRef([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      // Dark style OpenStreetMap tiles using CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      const polylineColor = isGreenCorridorActive ? '#22c55e' : '#06b6d4';
      const polyline = L.polyline(routeCoordinates, {
        color: polylineColor,
        weight: 6,
        opacity: 0.9,
        dashArray: isGreenCorridorActive ? null : '10, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      routePolylineRef.current = polyline;
    }
  }, [routeCoordinates, isGreenCorridorActive]);

  // Update Ambulance Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const pos = ambulancePos || (routeCoordinates && routeCoordinates.length > 0 ? routeCoordinates[0] : center);

    const ambulanceIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 -top-2 -left-2 rounded-full ${isGreenCorridorActive ? 'bg-emerald-500/30' : 'bg-red-500/30'} animate-ping"></div>
        <div class="w-8 h-8 rounded-full ${isGreenCorridorActive ? 'bg-emerald-500 border-2 border-white' : 'bg-red-600 border-2 border-white'} flex items-center justify-center shadow-lg text-white font-bold text-xs">
          🚑
        </div>
      </div>
    `;

    const customAmbulanceIcon = L.divIcon({
      html: ambulanceIconHtml,
      className: 'custom-amb-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (!ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current = L.marker(pos, { icon: customAmbulanceIcon }).addTo(map);
      ambulanceMarkerRef.current.bindPopup(`
        <div class="text-navy-950 font-sans p-1 text-xs">
          <p class="font-bold text-sm text-red-600">🚑 Priority Ambulance AMB-101</p>
          <p class="text-slate-700 font-medium">Status: ${isGreenCorridorActive ? '🟢 Green Corridor Active' : 'Emergency Transit'}</p>
          <p class="text-slate-500">Speed: 52 km/h | Golden Hour Target</p>
        </div>
      `);
    } else {
      ambulanceMarkerRef.current.setLatLng(pos);
      ambulanceMarkerRef.current.setIcon(customAmbulanceIcon);
    }
  }, [ambulancePos, routeCoordinates, isGreenCorridorActive]);

  // Update Intersections Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing intersection markers
    intersectionMarkersRef.current.forEach(m => map.removeLayer(m));
    intersectionMarkersRef.current = [];

    if (intersections && intersections.length > 0) {
      intersections.forEach((item) => {
        let badgeColor = '#ef4444'; // Red default
        let statusText = 'Normal Traffic Red';
        let lightEmoji = '🔴';

        if (item.status === 'cleared_green') {
          badgeColor = '#22c55e';
          statusText = 'Cleared Green Wave';
          lightEmoji = '🟢';
        } else if (item.status === 'pending_clearance') {
          badgeColor = '#f59e0b';
          statusText = 'Clearance Requested';
          lightEmoji = '🟡';
        } else if (item.status === 'congested') {
          badgeColor = '#dc2626';
          statusText = 'Heavy Congestion';
          lightEmoji = '⚠️';
        }

        const iconHtml = `
          <div class="relative group cursor-pointer flex flex-col items-center">
            <div class="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-md flex items-center space-x-1" style="background-color: ${badgeColor}; border: 1px solid rgba(255,255,255,0.4)">
              <span>${lightEmoji}</span>
              <span class="hidden sm:inline">${item.id}</span>
            </div>
            <div class="w-1.5 h-3 bg-slate-600 rounded-b"></div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'intersection-marker',
          iconSize: [40, 24],
          iconAnchor: [20, 24]
        });

        const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);

        marker.bindPopup(`
          <div class="text-navy-950 font-sans p-1 text-xs">
            <p class="font-bold text-sm text-slate-900">${item.name}</p>
            <p class="text-xs font-semibold" style="color: ${badgeColor}">${statusText}</p>
            <p class="text-[11px] text-slate-500">ID: ${item.id}</p>
            ${item.clearedBy ? `<p class="text-[10px] text-emerald-600">Cleared by: ${item.clearedBy}</p>` : ''}
          </div>
        `);

        if (onIntersectionClick) {
          marker.on('click', () => onIntersectionClick(item));
        }

        intersectionMarkersRef.current.push(marker);
      });
    }
  }, [intersections, onIntersectionClick]);

  // Update Hospital Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hospitals && hospitals.length > 0) {
      hospitals.forEach((hosp) => {
        const hospIconHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 border-2 border-white shadow-lg text-white font-bold text-xs">
            🏥
          </div>
        `;
        const icon = L.divIcon({
          html: hospIconHtml,
          className: 'hosp-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([hosp.location.lat, hosp.location.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div class="text-navy-950 font-sans p-1 text-xs">
            <p class="font-bold text-sm text-blue-700">🏥 ${hosp.name}</p>
            <p class="text-slate-600 font-medium">${hosp.location.address}</p>
            <div class="mt-1 pt-1 border-t border-slate-200 text-[11px]">
              <p class="text-emerald-700 font-semibold">Trauma Beds: ${hosp.capacity?.traumaBedsAvailable || 3} free</p>
              <p class="text-slate-600">ICU Beds: ${hosp.capacity?.icuBedsAvailable || 6} free</p>
            </div>
          </div>
        `);
      });
    }
  }, [hospitals]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full dark-tiles" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-navy-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2 text-[10px] text-slate-300 z-[1000] space-y-1 shadow-lg pointer-events-none">
        <div className="font-bold text-slate-200 uppercase tracking-wider text-[9px] mb-1">Tactical Map Legend</div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white"></span>
          <span>Ambulance AMB-101</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Cleared Signal (Green Wave)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Clearance Requested</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Destination Hospital ER</span>
        </div>
      </div>
    </div>
  );
};
