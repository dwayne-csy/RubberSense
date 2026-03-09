import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

// ── SVG Icon Components ──────────────────────────────────────────────────────

const IconMap = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const IconPin = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconTree = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-7"/><path d="M12 15L4 8h16z"/><path d="M12 10L6 4h12z"/>
  </svg>
);

const IconNavigation = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const IconRoute = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>
);

const IconRuler = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 8.7l-8-8a1 1 0 0 0-1.4 0l-9.2 9.2a1 1 0 0 0 0 1.4l8 8a1 1 0 0 0 1.4 0l9.2-9.2a1 1 0 0 0 0-1.4z"/>
    <line x1="7.5" y1="10.5" x2="7.51" y2="10.5"/><line x1="10.5" y1="7.5" x2="10.51" y2="7.5"/>
    <line x1="13.5" y1="10.5" x2="13.51" y2="10.5"/><line x1="10.5" y1="13.5" x2="10.51" y2="13.5"/>
  </svg>
);

const IconClock = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconWalk = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="4" r="2"/>
    <path d="M14.5 10.5l2 4.5H20v2h-5l-1.5-3.5-3 3.5V22h-2v-6.5l3-3.5-1-3.5"/>
    <path d="M8 11.5l2-1.5"/>
  </svg>
);

const IconBike = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6a1 1 0 0 0-1 1v3.5"/><path d="M15 6H9l-3 5.5"/><path d="M9 6l3 5.5H18.5"/>
  </svg>
);

const IconMotorcycle = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/>
    <path d="M5 17H3V14L5 8H13L17.5 12H19.5"/>
    <path d="M13 8L15 12"/><path d="M7 14H13"/>
  </svg>
);

const IconCar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3v-7l2-5h14l2 5v7h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M5 10h14"/>
  </svg>
);

const IconSave = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconTrash = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconX = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconAlertTriangle = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconCalendar = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconUser = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconPhone = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 5.59 5.59l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconArrowRight = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconLightbulb = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
);

const getModeIcon = (mode, size = 14, color = 'currentColor') => {
  switch(mode) {
    case 'walk': return <IconWalk size={size} color={color} />;
    case 'bike': return <IconBike size={size} color={color} />;
    case 'motor': return <IconMotorcycle size={size} color={color} />;
    case 'car': return <IconCar size={size} color={color} />;
    default: return <IconMotorcycle size={size} color={color} />;
  }
};

// ── Main Component ────────────────────────────────────────────────────────────

const Maps = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [detailedLocation, setDetailedLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 8.1650, lng: 125.0667 });
  const [mapZoom, setMapZoom] = useState(7);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationType, setLocationType] = useState('plantation');
  const [selectedPlantationType, setSelectedPlantationType] = useState('all');
  const [showRoute, setShowRoute] = useState(false);
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [transportMode, setTransportMode] = useState('motor');
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedPlantation, setSelectedPlantation] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeLayersRef = useRef([]);
  const plantationMarkersRef = useRef([]);
  const transportModeRef = useRef('motor');
  useEffect(() => { transportModeRef.current = transportMode; }, [transportMode]);

  const navigate = useNavigate();

  const rubberPlantations = [
    { name: "Kidapawan City, North Cotabato", type: "large", lat: 7.0086, lng: 125.0894 },
    { name: "Makilala, North Cotabato", type: "large", lat: 6.9667, lng: 125.0833 },
    { name: "Matalam, North Cotabato", type: "large", lat: 7.0833, lng: 124.9000 },
    { name: "President Roxas, North Cotabato", type: "large", lat: 7.1545, lng: 125.0558 },
    { name: "Tampilisan, Zamboanga del Norte", type: "large", lat: 8.0500, lng: 122.6833 },
    { name: "Zamboanga Sibugay (General)", type: "large", lat: 7.8000, lng: 122.6667 },
    { name: "Basilan (General)", type: "large", lat: 6.7167, lng: 122.0667 },
    { name: "South Upi, Maguindanao", type: "medium", lat: 7.0167, lng: 124.1667 },
    { name: "Upi, Maguindanao", type: "medium", lat: 7.0333, lng: 124.1833 },
    { name: "Trento, Agusan del Sur", type: "medium", lat: 8.0500, lng: 126.0667 },
    { name: "Sta. Josefa, Agusan del Sur", type: "medium", lat: 7.9833, lng: 126.0333 },
    { name: "Rosario, Agusan del Sur", type: "medium", lat: 8.3833, lng: 125.8333 },
    { name: "Bunawan, Agusan del Sur", type: "medium", lat: 8.1833, lng: 125.9833 },
    { name: "Laak, Davao de Oro", type: "medium", lat: 7.8000, lng: 125.8000 },
    { name: "Maco, Davao de Oro", type: "medium", lat: 7.3667, lng: 125.8500 },
    { name: "Monkayo, Davao de Oro", type: "medium", lat: 7.8167, lng: 126.0500 },
    { name: "Aleosan, North Cotabato", type: "small", lat: 7.1500, lng: 124.5667 },
    { name: "Pinamalayan, Oriental Mindoro", type: "small", lat: 13.0333, lng: 121.4333 },
    { name: "Los Baños, Laguna", type: "small", lat: 14.1667, lng: 121.2333 },
    { name: "Calamba, Laguna", type: "small", lat: 14.2167, lng: 121.1667 },
    { name: "Bay, Laguna", type: "small", lat: 14.1833, lng: 121.2833 },
    { name: "Santa Cruz, Laguna", type: "small", lat: 14.2833, lng: 121.4167 },
    { name: "Palawan (General)", type: "small", lat: 10.0000, lng: 118.7500 },
    { name: "Talakag, Bukidnon", type: "small", lat: 8.2333, lng: 124.6000 },
    { name: "Kalilangan, Bukidnon", type: "small", lat: 7.9167, lng: 124.7333 },
    { name: "Negros Oriental (General)", type: "small", lat: 9.7500, lng: 122.8333 },
    { name: "Tacloban, Leyte", type: "small", lat: 11.2500, lng: 125.0000 },
  ];

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const getAuthApiClient = () => {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        const res = await getAuthApiClient().get('/api/v1/users/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
        }
      } catch {
        localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // ── Load Leaflet from CDN ──────────────────────────────────────────────────
  const loadLeaflet = () => new Promise((resolve) => {
    if (window.L) { resolve(); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = resolve;
    document.head.appendChild(js);
  });

  // ── Init Leaflet map ───────────────────────────────────────────────────────
  const initLeafletMap = async (centerLat, centerLng, zoom) => {
    await loadLeaflet();
    const L = window.L;
    if (!mapContainerRef.current || leafletMapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [centerLat, centerLng], zoom, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    leafletMapRef.current = map;
    addAllPlantationMarkers(map);
    setMapLoading(false);
  };

  // ── Plantation markers ─────────────────────────────────────────────────────
  const dotColor = (type) => type === 'large' ? '#4CAF50' : type === 'medium' ? '#FFC107' : '#F44336';

  const addAllPlantationMarkers = (map) => {
    const L = window.L;
    plantationMarkersRef.current.forEach(m => map.removeLayer(m));
    plantationMarkersRef.current = [];
    rubberPlantations.forEach((p) => {
      const color = dotColor(p.type);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: p.type === 'large' ? 10 : p.type === 'medium' ? 8 : 7,
        fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9,
      }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'DM Sans',sans-serif;min-width:160px;">
          <div style="font-weight:700;color:#1b3a1d;font-size:0.9rem;margin-bottom:4px;">${p.name}</div>
          <span style="background:${color}22;color:${p.type==='medium'?'#b45309':color};border:1px solid ${color}55;border-radius:12px;padding:2px 8px;font-size:0.7rem;font-weight:700;text-transform:uppercase;">${p.type}</span>
          <div style="margin-top:8px;font-size:0.75rem;color:#7a9e7e;">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</div>
        </div>
      `);
      plantationMarkersRef.current.push(marker);
    });
  };

  // ── User location marker ───────────────────────────────────────────────────
  const placeUserMarker = (lat, lng) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#1565c0;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(21,101,192,0.3);"></div>`,
      className: '', iconSize: [16, 16], iconAnchor: [8, 8],
    });
    userMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup('<div style="font-family:\'DM Sans\',sans-serif;font-weight:600;color:#1565c0;">Your Location</div>');
  };

  // ── Destination marker ─────────────────────────────────────────────────────
  const placeDestinationMarker = (lat, lng, name) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;
    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);
    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:#2e7d32;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(46,125,50,0.5);display:flex;align-items:center;justify-content:center;font-size:13px;"></div>`,
      className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    });
    destinationMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-weight:600;color:#2e7d32;">${name}</div>`)
      .openPopup();
  };

  // ── Draw route polyline ────────────────────────────────────────────────────
  const drawRoute = (coords) => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;
    routeLayersRef.current.forEach(l => map.removeLayer(l));
    routeLayersRef.current = [];
    const latlngs = coords.map(c => [c[1], c[0]]);
    const outline = L.polyline(latlngs, { color: '#ffffff', weight: 9, opacity: 0.7 }).addTo(map);
    const route = L.polyline(latlngs, { color: '#1565c0', weight: 5, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }).addTo(map);
    routeLayersRef.current = [outline, route];
    map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
  };

  const clearRouteFromMap = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    routeLayersRef.current.forEach(l => map.removeLayer(l));
    routeLayersRef.current = [];
    if (destinationMarkerRef.current) { map.removeLayer(destinationMarkerRef.current); destinationMarkerRef.current = null; }
  };

  const flyTo = (lat, lng, zoom = 15) => {
    if (leafletMapRef.current) leafletMapRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
  };

  // ── Reverse geocoding ──────────────────────────────────────────────────────
  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
        { timeout: 15000 }
      );
      const data = res.data;
      const address = data.address || {};
      const displayName = data.display_name || '';
      const components = {
        house: address.house_number || address.house_name || null,
        building: address.building || null,
        block: address.block || null,
        road: address.road || address.street || address.footway || address.path || null,
        neighbourhood: address.neighbourhood || null,
        quarter: address.quarter || null,
        suburb: address.suburb || null,
        city_district: address.city_district || null,
        village: address.village || address.hamlet || null,
        town: address.town || null,
        city: address.city || address.municipality || null,
        state: address.state || address.region || null,
        state_district: address.state_district || null,
        country: address.country || null,
        country_code: address.country_code ? address.country_code.toUpperCase() : null,
        postcode: address.postcode || null,
        county: address.county || null
      };
      const parts = [components.house, components.road, components.neighbourhood, components.suburb,
        components.city_district, components.village, components.city, components.county,
        components.state, components.country, components.postcode].filter(Boolean);
      return {
        fullAddress: parts.join(', ') || displayName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName, components, rawData: data, source: 'OpenStreetMap',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6), full: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }
      };
    } catch {
      return {
        fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: null, components: null, rawData: null, source: 'GPS coordinates only',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6), full: `${lat.toFixed(6)}, ${lng.toFixed(6)}` },
        error: 'Failed to fetch from OpenStreetMap'
      };
    }
  };

  const checkGeolocationPermission = async () => {
    if (!navigator.geolocation) return { available: false, error: 'Geolocation not supported by your browser' };
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ available: true, error: null }),
        (err) => {
          const msgs = { 1: 'Location permission denied by user', 2: 'Location information is unavailable', 3: 'Location request timed out' };
          resolve({ available: false, error: msgs[err.code] || 'Unknown location error' });
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: Infinity }
      );
    });
  };

  const fetchLocationDetails = async (lat, lng) => {
    const info = await getOpenStreetMapAddress(lat, lng);
    setLocationAddress(info.fullAddress);
    setDetailedLocation(info);
    return info;
  };

  // ── OSRM routing ─────────────────────────────────────────────────────────
  const getOsrmProfile = (mode) => {
    if (mode === 'walk') return 'foot';
    if (mode === 'bike') return 'bike';
    return 'driving';
  };

  const MODE_SPEEDS = { walk: 5, bike: 15, motor: 50, car: 80 };

  const calcDurationFromDistance = (distanceKm, mode) => {
    const speed = MODE_SPEEDS[mode] || 50;
    const totalHours = distanceKm / speed;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const fetchOsrmRoute = async (startLat, startLng, endLat, endLng, profile) => {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.length) throw new Error(data.message || 'No route returned');
        return data.routes[0];
      } catch (err) {
        if (attempt === 1) throw err;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  const updateMapWithRoute = async (startLat, startLng, endLat, endLng, mode) => {
    try {
      setRouteLoading(true);
      const profile = getOsrmProfile(mode);
      const osrmRoute = await fetchOsrmRoute(startLat, startLng, endLat, endLng, profile);
      const distanceKm = parseFloat((osrmRoute.distance / 1000).toFixed(1));
      const duration = calcDurationFromDistance(distanceKm, mode);
      const coords = osrmRoute.geometry.coordinates;
      setRouteCoordinates(coords);
      setRouteDistance(distanceKm);
      setRouteDuration(duration);
      setRouteStart({ lat: startLat, lng: startLng });
      setRouteEnd({ lat: endLat, lng: endLng });
      setShowRoute(true);
      placeUserMarker(startLat, startLng);
      drawRoute(coords);
      return { distance: distanceKm, duration };
    } catch (err) {
      console.error('Routing error:', err);
      showToast('Could not get road route — showing straight line estimate', 'error');
      return showFallbackRoute(startLat, startLng, endLat, endLng, mode);
    } finally {
      setRouteLoading(false);
    }
  };

  const showFallbackRoute = (startLat, startLng, endLat, endLng, mode) => {
    const distanceKm = parseFloat(calculateDistance(startLat, startLng, endLat, endLng));
    const roadEstimate = parseFloat((distanceKm * 1.3).toFixed(1));
    const duration = calcDurationFromDistance(roadEstimate, mode);
    const coords = [[startLng, startLat], [endLng, endLat]];
    setRouteCoordinates(coords);
    setRouteDistance(roadEstimate);
    setRouteDuration(duration);
    setRouteStart({ lat: startLat, lng: startLng });
    setRouteEnd({ lat: endLat, lng: endLng });
    setShowRoute(true);
    placeUserMarker(startLat, startLng);
    drawRoute(coords);
    return { distance: roadEstimate, duration };
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };

  // ── My Location ────────────────────────────────────────────────────────────
  const goToMyLocation = async () => {
    const geo = await checkGeolocationPermission();
    if (!geo.available) { setLocationError(geo.error); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setGpsAccuracy(accuracy);
        setUserLocation({ lat, lng });
        setMapCenter({ lat, lng });
        await fetchLocationDetails(lat, lng);
        placeUserMarker(lat, lng);
        flyTo(lat, lng, 17);
        setLocationError(null);
        showToast('Centered on your location', 'success');
      },
      () => setLocationError('Could not get your location.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Navigate to plantation ─────────────────────────────────────────────────
  const calculateRoute = async (destLat, destLng, destName) => {
    const currentMode = transportModeRef.current;
    const doRoute = async (uLat, uLng) => {
      placeDestinationMarker(destLat, destLng, destName);
      await updateMapWithRoute(uLat, uLng, destLat, destLng, currentMode);
      setLocationAddress(destName);
      setSelectedLocation({ lat: destLat, lng: destLng });
      showToast(`Route to ${destName} drawn on map`, 'success');
    };
    if (userLocation) {
      await doRoute(userLocation.lat, userLocation.lng);
    } else {
      const geo = await checkGeolocationPermission();
      if (!geo.available) { setLocationError(geo.error); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          setUserLocation({ lat, lng }); setGpsAccuracy(accuracy);
          await doRoute(lat, lng);
        },
        () => setLocationError('Could not get your location.'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const changeTransportMode = async (mode) => {
    setTransportMode(mode);
    transportModeRef.current = mode;
    if (showRoute && routeStart && routeEnd) {
      await updateMapWithRoute(routeStart.lat, routeStart.lng, routeEnd.lat, routeEnd.lng, mode);
      showToast(`Route updated for ${getModeDisplayName(mode)}`, 'info');
    }
  };

  const getModeDisplayName = (mode) => ({ walk: 'Walking', bike: 'Bicycle', motor: 'Motorcycle', car: 'Car' }[mode] || 'Motorcycle');

  const clearRoute = () => {
    setShowRoute(false); setRouteStart(null); setRouteEnd(null);
    setRouteDistance(null); setRouteDuration(null); setRouteCoordinates([]);
    clearRouteFromMap();
    if (userLocation) flyTo(userLocation.lat, userLocation.lng, 14);
    showToast('Route cleared', 'info');
  };

  // ── Save / Load / Delete locations ────────────────────────────────────────
  const saveLocation = async () => {
    if (!selectedLocation || !locationName.trim()) { showToast('Please enter a location name', 'error'); return; }
    const locationData = { name: locationName, type: locationType, latitude: selectedLocation.lat, longitude: selectedLocation.lng, address: locationAddress, details: detailedLocation, accuracy: gpsAccuracy };
    try {
      const res = await getAuthApiClient().post('/api/v1/locations', locationData);
      if (res.data.success) {
        setSavedLocations(prev => [...prev, { ...res.data.location, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, contact: user.contact } }]);
        setShowSaveModal(false); setLocationName(''); setSelectedLocation(null);
        showToast('Location saved!', 'success');
      } else showToast(res.data.message || 'Failed to save', 'error');
    } catch (err) {
      showToast(`${err.response?.data?.message || 'Failed to save to server'}`, 'error');
      const saved = JSON.parse(localStorage.getItem('savedLocations') || '[]');
      saved.push({ ...locationData, id: Date.now().toString(), createdAt: new Date().toISOString(), user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, contact: user.contact } });
      localStorage.setItem('savedLocations', JSON.stringify(saved));
      setSavedLocations(saved); setShowSaveModal(false); setLocationName(''); setSelectedLocation(null);
      showToast('Saved locally', 'info');
    }
  };

  const loadSavedLocations = async () => {
    try {
      const res = await getAuthApiClient().get('/api/v1/locations');
      if (res.data.success) setSavedLocations(res.data.locations);
      else showToast(res.data.message || 'Failed to load locations', 'error');
    } catch (err) {
      if (err.response?.status === 404) showToast('Location API not found.', 'error');
      const saved = JSON.parse(localStorage.getItem('savedLocations') || '[]');
      setSavedLocations(saved.filter(l => l.user && l.user.id === user?.id));
    }
  };

  const deleteLocation = async (locationId) => {
    try {
      await getAuthApiClient().delete(`/api/v1/locations/${locationId}`);
      setSavedLocations(prev => prev.filter(l => l.id !== locationId));
      showToast('Deleted', 'info');
    } catch (err) {
      if (err.response?.status === 404) showToast('Not found or access denied', 'error');
      else {
        const saved = JSON.parse(localStorage.getItem('savedLocations') || '[]').filter(l => l.id !== locationId);
        localStorage.setItem('savedLocations', JSON.stringify(saved)); setSavedLocations(saved);
        showToast('Deleted locally', 'info');
      }
    }
  };

  const goToLocation = (location) => {
    flyTo(parseFloat(location.latitude), parseFloat(location.longitude), 15);
    setLocationAddress(location.address);
    setDetailedLocation(location.details || { components: {} });
    placeDestinationMarker(parseFloat(location.latitude), parseFloat(location.longitude), location.name);
    showToast(`Navigated to ${location.name}`);
  };

  const goToPlantation = (plantation) => {
    setSelectedPlantation(plantation);
    flyTo(plantation.lat, plantation.lng, 15);
    setSelectedLocation({ lat: plantation.lat, lng: plantation.lng });
    setLocationAddress(plantation.name);
    setDetailedLocation(null);
    showToast(`Zoomed to ${plantation.name}`);
  };

  const getPlantationStats = () => ({
    largeCount: rubberPlantations.filter(p => p.type === 'large').length,
    mediumCount: rubberPlantations.filter(p => p.type === 'medium').length,
    smallCount: rubberPlantations.filter(p => p.type === 'small').length,
  });

  const getFilteredPlantations = () =>
    selectedPlantationType === 'all' ? rubberPlantations : rubberPlantations.filter(p => p.type === selectedPlantationType);

  const showToast = (message, type = 'info') => {
    const colors = { success: '#2e7d32', error: '#c62828', info: '#1565c0' };
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed;bottom:100px;right:20px;background:${colors[type]||colors.info};color:white;padding:10px 16px;border-radius:10px;z-index:10000;font-size:14px;font-family:'DM Sans',sans-serif;font-weight:500;animation:fadeInOut 2.5s ease-in-out;box-shadow:0 4px 16px rgba(0,0,0,0.2);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ── Init map after auth loads ──────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const init = async () => {
      setMapLoading(true);
      const geo = await checkGeolocationPermission();
      if (geo.available) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng, accuracy } = pos.coords;
            setGpsAccuracy(accuracy); setUserLocation({ lat, lng }); setMapCenter({ lat, lng });
            await initLeafletMap(lat, lng, 14);
            placeUserMarker(lat, lng);
            await fetchLocationDetails(lat, lng);
          },
          async () => {
            setLocationError('Could not get your location.');
            await initLeafletMap(mapCenter.lat, mapCenter.lng, mapZoom);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationError(geo.error || 'Location services unavailable.');
        await initLeafletMap(mapCenter.lat, mapCenter.lng, mapZoom);
      }
      loadSavedLocations();
    };
    init();
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, [loading]);

  useEffect(() => {
    if (leafletMapRef.current && window.L) addAllPlantationMarkers(leafletMapRef.current);
  }, [selectedPlantationType]);

  // ── OSM address breakdown ──────────────────────────────────────────────────
  const renderOpenStreetMapLocation = () => {
    if (!detailedLocation?.components) return null;
    const c = detailedLocation.components;
    const items = [
      { label: 'House', value: c.house }, { label: 'Building', value: c.building },
      { label: 'Block', value: c.block }, { label: 'Road', value: c.road },
      { label: 'Neighbourhood', value: c.neighbourhood }, { label: 'Barangay', value: c.quarter },
      { label: 'Suburb', value: c.suburb }, { label: 'City District', value: c.city_district },
      { label: 'Village', value: c.village }, { label: 'Town', value: c.town },
      { label: 'City', value: c.city }, { label: 'County', value: c.county },
      { label: 'State District', value: c.state_district }, { label: 'State', value: c.state },
      { label: 'Country', value: c.country }, { label: 'Country Code', value: c.country_code },
      { label: 'Postcode', value: c.postcode },
    ].filter(i => i.value);
    if (!items.length) return null;
    return (
      <div style={{ marginTop: '20px', background: '#f9fdf9', borderRadius: '14px', border: '1px solid #c8e6c9', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1b5e20, #2e7d32)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconMap size={16} color="rgba(255,255,255,0.9)" />
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '600', color: 'white', fontSize: '0.95rem' }}>OpenStreetMap Location Details</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{detailedLocation.source}</span>
        </div>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ padding: '10px 12px', background: 'white', borderRadius: '10px', border: '1px solid #e8f5e9' }}>
              <div style={{ fontSize: '0.68rem', color: '#7a9e7e', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700' }}>{item.label}</div>
              <div style={{ fontWeight: '600', color: '#1b3a1d', fontSize: '0.88rem', wordBreak: 'break-word', fontFamily: "'DM Sans', sans-serif" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f2f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <circle cx="28" cy="28" r="24" stroke="#d1ead1" strokeWidth="3"/>
            <path d="M28 4a24 24 0 0 1 24 24" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 28 28" to="360 28 28" dur="0.9s" repeatCount="indefinite"/>
            </path>
          </svg>
          <p style={{ color: '#2e7d32', fontWeight: '600', fontSize: '1rem', letterSpacing: '0.05em', margin: 0 }}>Loading Maps...</p>
        </div>
      </div>
    );
  }

  const stats = getPlantationStats();
  const filteredPlantations = getFilteredPlantations();

  return (
    <div style={{ minHeight: '100vh', background: '#f2f7f2', fontFamily: "'DM Sans', sans-serif", position: 'relative', paddingTop: '64px' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 2000 }}>
        <UserHeader />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInOut { 0%{opacity:0;transform:translateY(8px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
        @keyframes modalSlideIn { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .leaflet-container { font-family: 'DM Sans', sans-serif !important; border-radius: 14px; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important; border: 1px solid #e8f5e9 !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 12px 16px !important; }
        .leaflet-popup-tip-container { margin-top: -1px; }

        .rs-maps-page { font-family: 'DM Sans', sans-serif; background: #f2f7f2; min-height: 100vh; }

        .rs-stat-card { border-radius: 20px; padding: 26px 22px; display: flex; flex-direction: column; position: relative; overflow: hidden; transition: transform 0.25s ease, box-shadow 0.25s ease; animation: fadeUp 0.5s ease both; }
        .rs-stat-card:hover { transform: translateY(-5px); }
        .rs-stat-card .deco-a { position: absolute; top: -20px; right: -20px; width: 88px; height: 88px; background: rgba(255,255,255,0.1); border-radius: 50%; }
        .rs-stat-card .deco-b { position: absolute; bottom: -24px; left: -8px; width: 64px; height: 64px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .rs-stat-card .icon-box { background: rgba(255,255,255,0.18); border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; }
        .rs-stat-card .badge-pill { background: rgba(255,255,255,0.22); color: #fff; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; }
        .rs-stat-card .big-num { font-family: 'Playfair Display', Georgia, serif; font-size: 3.2rem; font-weight: 700; color: #fff; line-height: 1; position: relative; margin-top: 14px; }
        .rs-stat-card .sub-label { color: rgba(255,255,255,0.72); font-size: 0.78rem; font-weight: 500; margin-top: 5px; position: relative; }

        .rs-panel { background: #fff; border: 1px solid #ddeedd; border-radius: 22px; overflow: hidden; box-shadow: 0 2px 16px rgba(46,125,50,0.07); animation: fadeUp 0.5s ease 0.08s both; }
        .rs-panel-header { padding: 18px 24px; border-bottom: 1px solid #eef6ee; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: #fafcfa; }

        .rs-sidebar { background: #fff; border: 1px solid #ddeedd; border-radius: 22px; overflow: hidden; box-shadow: 0 2px 16px rgba(46,125,50,0.07); animation: fadeUp 0.5s ease 0.14s both; }
        .rs-sidebar-header { padding: 17px 20px; border-bottom: 1px solid #eef6ee; display: flex; align-items: center; justify-content: space-between; background: #fafcfa; }

        .rs-section-label { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; color: #1a3d1e; font-size: 1rem; letter-spacing: -0.01em; }
        .rs-badge { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; }

        .plantation-list-item { background: #fff; border: 1px solid #eef0ee; border-radius: 12px; padding: 12px 14px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 7px; display: flex; align-items: center; justify-content: space-between; }
        .plantation-list-item:hover { border-color: #a5d6a7 !important; background: #f5fbf5 !important; transform: translateX(3px); box-shadow: 0 2px 10px rgba(46,125,50,0.09); }
        .plantation-list-item.selected { border-color: #2e7d32 !important; background: #f0f9f0 !important; box-shadow: 0 2px 14px rgba(46,125,50,0.13); }

        .saved-loc-item { background: #fff; border: 1px solid #eef0ee; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 7px; }
        .saved-loc-item:hover { border-color: #a5d6a7; background: #f5fbf5; box-shadow: 0 2px 10px rgba(46,125,50,0.09); }

        .rs-btn { background: linear-gradient(135deg, #2e7d32, #388e3c); color: white; border: none; padding: 9px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 8px rgba(46,125,50,0.22); }
        .rs-btn:hover { background: linear-gradient(135deg, #1b5e20, #2e7d32); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(46,125,50,0.32); }

        .rs-btn-orange { background: linear-gradient(135deg, #e65100, #f4511e); color: white; border: none; padding: 9px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 8px rgba(230,81,0,0.22); }
        .rs-btn-orange:hover { background: linear-gradient(135deg, #bf360c, #e65100); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(230,81,0,0.32); }

        .rs-btn-blue { background: linear-gradient(135deg, #1565c0, #1976d2); color: white; border: none; padding: 9px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 7px; white-space: nowrap; box-shadow: 0 2px 8px rgba(21,101,192,0.22); }
        .rs-btn-blue:hover { background: linear-gradient(135deg, #0d47a1, #1565c0); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(21,101,192,0.32); }

        .rs-select { background: #f5fbf5; color: #2e7d32; border: 1.5px solid #c8e6c9; padding: 9px 34px 9px 14px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; cursor: pointer; outline: none; font-weight: 500; transition: border-color 0.2s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232e7d32' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
        .rs-select:hover, .rs-select:focus { border-color: #2e7d32; }

        .rs-route-chip { background: #f0f6ff; border: 1px solid #c2d4f0; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; transition: border-color 0.2s, background 0.2s; }
        .rs-route-chip:hover { background: #e3ecfd; border-color: #90a9d4; }

        .rs-spinner { width: 17px; height: 17px; border: 2px solid #d1ead1; border-top-color: #2e7d32; border-radius: 50%; animation: spin 0.75s linear infinite; flex-shrink: 0; }

        .nav-btn { background: #f1f8e9; color: #2e7d32; border: 1.5px solid #a5d6a7; border-radius: 8px; padding: 5px 11px; font-size: 0.72rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; display: flex; align-items: center; gap: 4px; }
        .nav-btn:hover, .nav-btn.active { background: #2e7d32; color: white; border-color: #2e7d32; }

        .delete-btn { background: #fce4ec; color: #c62828; border: 1px solid #ef9a9a; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0; }
        .delete-btn:hover { background: #c62828; color: white; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f0f7f0; }
        ::-webkit-scrollbar-thumb { background: #a5d6a7; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2e7d32; }
      `}</style>

      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '36px 24px 56px' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: '36px', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
              borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #a5d6a7', boxShadow: '0 2px 8px rgba(46,125,50,0.12)', flexShrink: 0
            }}>
              <IconMap size={22} color="#2e7d32" />
            </div>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.8rem', fontWeight: '700',
                color: '#1a3d1e', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1
              }}>RubberSense Maps</h1>
              <p style={{ color: '#5a7b5e', margin: '4px 0 0', fontSize: '0.9rem' }}>
                Interactive map with real road routing — no redirects. Click a plantation to zoom in, then press Navigate to draw the route directly on the map.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '28px' }}>
          {[
            { gradient: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 60%, #43a047 100%)', shadow: 'rgba(46,125,50,0.28)', label: 'Large', count: stats.largeCount, delay: '0.05s' },
            { gradient: 'linear-gradient(135deg, #f57f17 0%, #f9a825 60%, #fbc02d 100%)', shadow: 'rgba(245,127,23,0.28)', label: 'Medium', count: stats.mediumCount, delay: '0.1s' },
            { gradient: 'linear-gradient(135deg, #c62828 0%, #d32f2f 60%, #e53935 100%)', shadow: 'rgba(198,40,40,0.25)', label: 'Small', count: stats.smallCount, delay: '0.15s' },
            { gradient: 'linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #1e88e5 100%)', shadow: 'rgba(21,101,192,0.25)', label: 'Saved', count: savedLocations.length, delay: '0.2s', isSaved: true },
          ].map((card, i) => (
            <div key={i} className="rs-stat-card"
              style={{ background: card.gradient, boxShadow: `0 4px 20px ${card.shadow}`, animationDelay: card.delay }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 12px 32px ${card.shadow.replace('0.28', '0.42').replace('0.25', '0.4')}`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 20px ${card.shadow}`}
            >
              <div className="deco-a" /><div className="deco-b" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div className="icon-box">
                  {card.isSaved
                    ? <IconPin size={20} color="rgba(255,255,255,0.9)" />
                    : <IconTree size={20} color="rgba(255,255,255,0.9)" />
                  }
                </div>
                <span className="badge-pill">{card.label}</span>
              </div>
              <div className="big-num">{card.count}</div>
              <div className="sub-label">{card.isSaved ? 'Your Locations' : 'Plantation Sites'}</div>
            </div>
          ))}
        </div>

        {/* ── Main Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Map Panel */}
            <div className="rs-panel">
              <div className="rs-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconRoute size={18} color="#2e7d32" />
                  <span className="rs-section-label">{showRoute ? `Route — ${getModeDisplayName(transportMode)}` : 'Rubber Plantation Map'}</span>
                  {mapLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="rs-spinner" />
                      <span style={{ fontSize: '0.74rem', color: '#81c784', fontWeight: '600' }}>Loading map...</span>
                    </div>
                  )}
                  {routeLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="rs-spinner" style={{ borderTopColor: '#1565c0' }} />
                      <span style={{ fontSize: '0.74rem', color: '#1565c0', fontWeight: '600' }}>Calculating route...</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {showRoute && (
                    <button className="rs-btn-orange" onClick={clearRoute}>
                      <IconX size={14} color="white" /> Clear Route
                    </button>
                  )}
                  <select className="rs-select" value={transportMode} onChange={e => changeTransportMode(e.target.value)}>
                    <option value="walk">Walking</option>
                    <option value="bike">Bicycle</option>
                    <option value="motor">Motorcycle</option>
                    <option value="car">Car</option>
                  </select>
                  <select className="rs-select" value={selectedPlantationType} onChange={e => setSelectedPlantationType(e.target.value)}>
                    <option value="all">All Plantations</option>
                    <option value="large">Large</option>
                    <option value="medium">Medium</option>
                    <option value="small">Small</option>
                  </select>
                  <button className="rs-btn-blue" onClick={goToMyLocation}>
                    <IconPin size={14} color="white" /> My Location
                  </button>
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {/* Route chips */}
                {showRoute && routeDistance && routeDuration && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {[
                      { Icon: IconRuler, label: 'Distance', value: `${routeDistance} km`, color: '#1565c0' },
                      { Icon: IconClock, label: 'Est. Time', value: routeDuration, color: '#1565c0' },
                      { Icon: null, modeIcon: true, label: 'Transport', value: getModeDisplayName(transportMode), color: '#1565c0' },
                    ].map((chip, i) => (
                      <div key={i} className="rs-route-chip">
                        <div style={{ background: '#1565c0', color: 'white', width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {chip.modeIcon ? getModeIcon(transportMode, 16, 'white') : <chip.Icon size={16} color="white" />}
                        </div>
                        <div>
                          <div style={{ color: '#5a7b8a', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{chip.label}</div>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: '700', color: '#1565c0' }}>{chip.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', padding: '10px 16px', background: '#f9fdf9', borderRadius: '12px', border: '1px solid #e8f5e9', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[{ color: '#4CAF50', label: 'Large' }, { color: '#FFC107', label: 'Medium' }, { color: '#F44336', label: 'Small' }].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, border: '2px solid rgba(0,0,0,0.15)' }} />
                      <span style={{ color: '#3a6b3e', fontSize: '0.8rem', fontWeight: '500' }}>{item.label}</span>
                    </div>
                  ))}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1565c0', border: '2px solid white', boxShadow: '0 0 0 1.5px #1565c0' }} />
                      <span style={{ color: '#1565c0', fontSize: '0.8rem', fontWeight: '500' }}>You</span>
                    </div>
                    {showRoute && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '22px', height: '4px', background: '#1565c0', borderRadius: '2px' }} />
                        <span style={{ color: '#1565c0', fontSize: '0.8rem', fontWeight: '500' }}>Route</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Error */}
                {locationError && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '13px 15px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', animation: 'fadeUp 0.3s ease' }}>
                    <IconAlertTriangle size={16} color="#d97706" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#92400e', fontSize: '0.84rem', marginBottom: '2px' }}>Location Issue</div>
                      <div style={{ color: '#92400e', fontSize: '0.8rem' }}>{locationError}</div>
                    </div>
                    <button onClick={() => setLocationError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <IconX size={16} color="#92400e" />
                    </button>
                  </div>
                )}

                {/* LEAFLET MAP DIV */}
                <div
                  ref={mapContainerRef}
                  style={{ height: '450px', width: '100%', borderRadius: '14px', border: '1px solid #c8e6c9', background: '#e8f5e9', zIndex: 1, position: 'relative' }}
                />

                {/* Tip */}
                <div style={{ marginTop: '14px', padding: '12px 16px', background: '#f9fdf9', borderRadius: '12px', fontSize: '0.82rem', color: '#5a7b5e', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e8f5e9' }}>
                  <IconLightbulb size={15} color="#5a7b5e" />
                  <span>
                    {showRoute
                      ? `Road path via OSRM. Distance is the same for motor/car (same roads) — Est. Time differs by speed (Motor ~50km/h, Car ~80km/h).`
                      : 'Click a plantation row to zoom in — then press Navigate to draw the road route on the map.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="rs-panel">
              <div className="rs-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {showRoute ? <IconNavigation size={18} color="#2e7d32" /> : <IconPin size={18} color="#2e7d32" />}
                  <span className="rs-section-label">{showRoute ? 'Route Destination' : 'Location Details'}</span>
                </div>
                <button
                  className="rs-btn"
                  onClick={() => { if (selectedLocation) setShowSaveModal(true); else showToast('Please select a location first', 'error'); }}
                  style={{ opacity: selectedLocation ? 1 : 0.45, cursor: selectedLocation ? 'pointer' : 'not-allowed' }}
                >
                  <IconSave size={14} color="white" /> Save Location
                </button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {locationAddress ? (
                  <div style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 40%, #388e3c 100%)', borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                    {/* decorative tree silhouette */}
                    <div style={{ position: 'absolute', right: '20px', bottom: 0, opacity: 0.12, pointerEvents: 'none' }}>
                      <svg width="80" height="90" viewBox="0 0 80 90" fill="none">
                        <rect x="34" y="60" width="12" height="30" rx="3" fill="#fff"/>
                        <ellipse cx="40" cy="56" rx="26" ry="18" fill="#fff"/>
                        <ellipse cx="40" cy="40" rx="20" ry="16" fill="#fff"/>
                        <ellipse cx="40" cy="26" rx="14" ry="12" fill="#fff"/>
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {showRoute ? 'Destination Plantation' : selectedLocation ? 'Selected Location' : 'Current Location'}
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', lineHeight: 1.4, position: 'relative' }}>{locationAddress}</div>
                    {showRoute && (
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a5d6a7', flexShrink: 0 }} />
                        <span>Route drawn on map via {getModeDisplayName(transportMode).toLowerCase()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7a9e7e' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.35 }}>
                      <IconPin size={52} color="#2e7d32" />
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: '600', color: '#3a6b3e', marginBottom: '6px' }}>No location selected</div>
                    <div style={{ fontSize: '0.82rem' }}>Click a plantation to view details</div>
                  </div>
                )}
                {renderOpenStreetMapLocation()}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Plantation List */}
            <div className="rs-sidebar">
              <div className="rs-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconTree size={16} color="#2e7d32" />
                  <span className="rs-section-label">Rubber Plantations</span>
                </div>
                <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: '1px solid #c8e6c9' }}>
                  {filteredPlantations.length}
                </span>
              </div>
              <div style={{ padding: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                {filteredPlantations.map((plantation, index) => {
                  const color = dotColor(plantation.type);
                  const isSelected = selectedPlantation?.name === plantation.name;
                  return (
                    <div
                      key={index}
                      className={`plantation-list-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => goToPlantation(plantation)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          background: plantation.type === 'large' ? '#e8f5e9' : plantation.type === 'medium' ? '#fff8e1' : '#fce4ec',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${plantation.type === 'large' ? '#c8e6c9' : plantation.type === 'medium' ? '#ffe082' : '#f48fb1'}`
                        }}>
                          <IconTree size={15} color={color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#1b3a1d', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>{plantation.name}</div>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <span className="rs-badge" style={{ background: plantation.type === 'large' ? '#e8f5e9' : plantation.type === 'medium' ? '#fff8e1' : '#fce4ec', color: plantation.type === 'large' ? '#2e7d32' : plantation.type === 'medium' ? '#f57f17' : '#c62828' }}>
                              {plantation.type}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#7a9e7e' }}>{plantation.lat.toFixed(3)}, {plantation.lng.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className={`nav-btn ${isSelected ? 'active' : ''}`}
                        onClick={e => { e.stopPropagation(); calculateRoute(plantation.lat, plantation.lng, plantation.name); }}
                        title="Draw road route on map"
                      >
                        <IconNavigation size={11} color={isSelected ? 'white' : '#2e7d32'} /> Navigate
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Saved Locations */}
            <div className="rs-sidebar">
              <div className="rs-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconSave size={16} color="#2e7d32" />
                  <span className="rs-section-label">Saved Locations</span>
                </div>
                <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: '1px solid #90caf9' }}>
                  {savedLocations.length}
                </span>
              </div>
              <div style={{ padding: '12px', maxHeight: '360px', overflowY: 'auto' }}>
                {savedLocations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a9e7e' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', opacity: 0.35 }}>
                      <IconMap size={48} color="#2e7d32" />
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: '600', color: '#3a6b3e', marginBottom: '6px' }}>No Saved Locations</div>
                    <p style={{ fontSize: '0.82rem', lineHeight: '1.5', margin: 0 }}>Select locations and save them to appear here.</p>
                  </div>
                ) : savedLocations.map((location, index) => (
                  <div key={location.id || index} className="saved-loc-item" onClick={() => goToLocation(location)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <div style={{
                        background: location.type === 'plantation' ? '#e8f5e9' : '#e3f2fd',
                        border: `1.5px solid ${location.type === 'plantation' ? '#a5d6a7' : '#90caf9'}`,
                        width: '34px', height: '34px', borderRadius: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {location.type === 'plantation'
                          ? <IconTree size={16} color="#2e7d32" />
                          : <IconPin size={16} color="#1565c0" />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#1b3a1d', fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location.name}</div>
                        <div style={{ color: '#7a9e7e', fontSize: '0.75rem', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{location.address}</div>
                        {location.user && (
                          <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#9e9e9e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconUser size={11} color="#9e9e9e" />
                            <span>{location.user.name}</span>
                            {location.user.contact && (
                              <>
                                <span>•</span>
                                <IconPhone size={10} color="#9e9e9e" />
                                <span>{location.user.contact}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f0f7f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#9e9e9e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <IconCalendar size={12} color="#9e9e9e" />
                        <span>{new Date(location.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteLocation(location.id); }} title="Delete">
                        <IconTrash size={13} color="inherit" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Save Modal ── */}
      {showSaveModal && selectedLocation && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '22px', padding: '32px', width: '90%', maxWidth: '480px', border: '1px solid #e8f5e9', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'modalSlideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a5d6a7' }}>
                <IconSave size={20} color="#2e7d32" />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.4rem', fontWeight: '700', color: '#1b3a1d', margin: 0 }}>Save Location</h2>
            </div>
            <div style={{ background: '#f9fdf9', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e8f5e9', marginBottom: '20px', fontSize: '0.875rem', color: '#3a6b3e', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <IconPin size={15} color="#2e7d32" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ flex: 1, lineHeight: 1.4 }}>{locationAddress}</span>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', color: '#1b3a1d', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>Location Name *</label>
              <input
                type="text" value={locationName} onChange={e => setLocationName(e.target.value)}
                placeholder="e.g., Main Rubber Plantation"
                style={{ width: '100%', padding: '12px 14px', background: '#ffffff', border: '1.5px solid #e8f5e9', borderRadius: '10px', color: '#1b3a1d', fontSize: '0.95rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2e7d32'}
                onBlur={e => e.target.style.borderColor = '#e8f5e9'}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#1b3a1d', marginBottom: '10px', fontSize: '0.875rem', fontWeight: '600' }}>Location Type</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setLocationType('plantation')}
                  style={{ flex: 1, padding: '12px', background: locationType === 'plantation' ? '#2e7d32' : '#f9fdf9', border: `1.5px solid ${locationType === 'plantation' ? '#2e7d32' : '#c8e6c9'}`, borderRadius: '10px', color: locationType === 'plantation' ? 'white' : '#2e7d32', fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                  <IconTree size={16} color={locationType === 'plantation' ? 'white' : '#2e7d32'} /> Plantation
                </button>
                <button type="button" onClick={() => setLocationType('collection')}
                  style={{ flex: 1, padding: '12px', background: locationType === 'collection' ? '#1565c0' : '#f9fdf9', border: `1.5px solid ${locationType === 'collection' ? '#1565c0' : '#c8e6c9'}`, borderRadius: '10px', color: locationType === 'collection' ? 'white' : '#1565c0', fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                  <IconNavigation size={15} color={locationType === 'collection' ? 'white' : '#1565c0'} /> Collection Point
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowSaveModal(false); setLocationName(''); }}
                style={{ background: '#f9fdf9', color: '#5a7b5e', border: '1.5px solid #e8f5e9', padding: '11px 22px', borderRadius: '10px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: '600', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fdf9'}>
                Cancel
              </button>
              <button onClick={saveLocation} disabled={!locationName.trim()}
                style={{ background: locationName.trim() ? 'linear-gradient(135deg, #2e7d32, #388e3c)' : '#e0e0e0', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '0.875rem', cursor: locationName.trim() ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: locationName.trim() ? '0 2px 8px rgba(46,125,50,0.22)' : 'none' }}
                onMouseEnter={e => { if (locationName.trim()) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(46,125,50,0.32)'; } }}
                onMouseLeave={e => { if (locationName.trim()) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(46,125,50,0.22)'; } }}>
                <IconSave size={14} color="white" /> Save Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maps;