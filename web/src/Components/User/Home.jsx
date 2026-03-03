import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';
import ChatbotWidget from './ChatbotWidget'; // Import the chatbot widget

// ── SVG Icon Components ──────────────────────────────────────────────────────

const IconFlask = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M9 3v8l-4 9h14l-4-9V3"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
  </svg>
);

const IconTree = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-7"/>
    <path d="M12 15L4 8h16z"/>
    <path d="M12 10L6 4h12z"/>
  </svg>
);

const IconRobot = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <line x1="12" y1="7" x2="12" y2="11"/>
    <line x1="8" y1="15" x2="8" y2="15" strokeWidth="3"/>
    <line x1="16" y1="15" x2="16" y2="15" strokeWidth="3"/>
    <line x1="9" y1="19" x2="15" y2="19"/>
  </svg>
);

const IconCloud = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const IconLeaf = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const IconFileText = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconMap = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const IconSun = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconCloudSun = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"/>
    <path d="M17 12a5 5 0 1 0-9.9-1H6a3 3 0 0 0 0 6h11a3 3 0 0 0 0-6z"/>
  </svg>
);

const IconCloudRain = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="13" x2="16" y2="21"/>
    <line x1="8" y1="13" x2="8" y2="21"/>
    <line x1="12" y1="15" x2="12" y2="23"/>
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
  </svg>
);

const IconSnowflake = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="12" y1="2" x2="12" y2="22"/>
    <path d="M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>
  </svg>
);

const IconZap = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconWind = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);

const IconDroplets = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
  </svg>
);

const IconCalendar = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconClock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconPin = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconRefresh = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const IconArrowUpRight = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  </svg>
);

const IconArrowRight = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconAlertTriangle = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconX = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconTarget = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconSpin = ({ size = 80, color = '#2d6a4f' }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <circle cx="40" cy="40" r="36" stroke="#d1e8d1" strokeWidth="4"/>
    <path d="M40 4a36 36 0 0 1 36 36" stroke={color} strokeWidth="4" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="1s" repeatCount="indefinite"/>
    </path>
  </svg>
);

// Map weather codes to icon components
const getWeatherIcon = (code, size = 40) => {
  if (code === 0) return <IconSun size={size} color="#f59e0b" />;
  if (code <= 2) return <IconCloudSun size={size} color="#f59e0b" />;
  if (code === 3) return <IconCloud size={size} color="#9ca3af" />;
  if (code <= 48) return <IconCloud size={size} color="#9ca3af" />;
  if (code <= 67) return <IconCloudRain size={size} color="#60a5fa" />;
  if (code <= 77) return <IconSnowflake size={size} color="#93c5fd" />;
  if (code <= 82) return <IconCloudRain size={size} color="#60a5fa" />;
  if (code <= 86) return <IconSnowflake size={size} color="#93c5fd" />;
  return <IconZap size={size} color="#fbbf24" />;
};

const weatherIconMap = {
  '☀️': <IconSun size={40} color="#f59e0b" />,
  '🌤️': <IconCloudSun size={40} color="#f59e0b" />,
  '⛅': <IconCloudSun size={40} color="#9ca3af" />,
  '☁️': <IconCloud size={40} color="#9ca3af" />,
  '🌫️': <IconCloud size={40} color="#d1d5db" />,
  '🌧️': <IconCloudRain size={40} color="#60a5fa" />,
  '🌨️': <IconSnowflake size={40} color="#93c5fd" />,
  '⛈️': <IconZap size={40} color="#fbbf24" />,
};

const weatherIconSmallMap = {
  '☀️': <IconSun size={22} color="#f59e0b" />,
  '🌤️': <IconCloudSun size={22} color="#f59e0b" />,
  '⛅': <IconCloudSun size={22} color="#9ca3af" />,
  '☁️': <IconCloud size={22} color="#9ca3af" />,
  '🌫️': <IconCloud size={22} color="#d1d5db" />,
  '🌧️': <IconCloudRain size={22} color="#60a5fa" />,
  '🌨️': <IconSnowflake size={22} color="#93c5fd" />,
  '⛈️': <IconZap size={22} color="#fbbf24" />,
};

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [detailedLocation, setDetailedLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // State for chat widget
  const mapIframeRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Plantation locations data
  const plantations = [
    { name: "Kidapawan City, North Cotabato", type: "Large" },
    { name: "Makilala, North Cotabato", type: "Large" },
    { name: "Matalam, North Cotabato", type: "Large" },
    { name: "President Roxas, North Cotabato", type: "Large" },
    { name: "Tampilisan, Zamboanga del Norte", type: "Large" },
    { name: "Zamboanga Sibugay (General)", type: "Large" },
    { name: "Basilan (General)", type: "Large" },
    { name: "South Upi, Maguindanao", type: "Medium" },
    { name: "Upi, Maguindanao", type: "Medium" },
    { name: "Trento, Agusan del Sur", type: "Medium" },
    { name: "Sta. Josefa, Agusan del Sur", type: "Medium" },
    { name: "Rosario, Agusan del Sur", type: "Medium" },
    { name: "Bunawan, Agusan del Sur", type: "Medium" },
    { name: "Laak, Davao de Oro", type: "Medium" },
    { name: "Maco, Davao de Oro", type: "Medium" },
    { name: "Monkayo, Davao de Oro", type: "Medium" },
    { name: "Aleosan, North Cotabato", type: "Small" },
    { name: "Pinamalayan, Oriental Mindoro", type: "Small" },
    { name: "Los Baños, Laguna", type: "Small" },
    { name: "Calamba, Laguna", type: "Small" },
    { name: "Bay, Laguna", type: "Small" },
    { name: "Santa Cruz, Laguna", type: "Small" },
    { name: "Palawan (General)", type: "Small" },
    { name: "Talakag, Bukidnon", type: "Small" },
    { name: "Kalilangan, Bukidnon", type: "Small" },
    { name: "Negros Oriental (General)", type: "Small" },
    { name: "Tacloban, Leyte", type: "Small" },
  ];

  // Generate a unique session ID for this user
  const [chatSessionId] = useState(() => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const slides = [
    {
      id: 1,
      video: '/src/Components/slidingpics/slide1.mp4',
      alt: 'Rubber Tree Plantation',
      title: 'Efficient Tree Tapping Operations',
      description: 'Professional latex extraction with modern technology'
    },
    {
      id: 2,
      video: '/src/Components/slidingpics/slide2.mp4',
      alt: 'Latex Collection',
      title: 'Premium Latex Collection',
      description: 'High-quality latex from healthy rubber trees'
    },
    {
      id: 3,
      video: '/src/Components/slidingpics/slide3.mp4',
      alt: 'Plantation Management',
      title: 'Smart Plantation Management',
      description: 'Advanced monitoring for optimal growth conditions'
    },
    {
      id: 4,
      video: '/src/Components/slidingpics/slide4.mp4',
      alt: 'Sustainable Farming',
      title: 'Sustainable Rubber Farming',
      description: 'Eco-friendly practices for long-term yield'
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, API_BASE_URL]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options));
      const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
    };

    updateDateTime();
    const timeInterval = setInterval(updateDateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
        { headers: { 'Accept-Language': 'en' }, timeout: 5000 }
      );

      const data = response.data;
      const address = data.address || {};
      const displayName = data.display_name || '';

      const locationComponents = {
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

      const parts = [];
      if (locationComponents.house) parts.push(locationComponents.house);
      if (locationComponents.road) parts.push(locationComponents.road);
      if (locationComponents.neighbourhood) parts.push(locationComponents.neighbourhood);
      if (locationComponents.suburb) parts.push(locationComponents.suburb);
      if (locationComponents.city_district) parts.push(locationComponents.city_district);
      if (locationComponents.village) parts.push(locationComponents.village);
      if (locationComponents.city) parts.push(locationComponents.city);
      if (locationComponents.county) parts.push(locationComponents.county);
      if (locationComponents.state) parts.push(locationComponents.state);
      if (locationComponents.country) parts.push(locationComponents.country);
      if (locationComponents.postcode) parts.push(locationComponents.postcode);

      const formattedAddress = parts.filter(Boolean).join(', ');

      return {
        fullAddress: formattedAddress || displayName || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName,
        components: locationComponents,
        rawData: data,
        source: 'OpenStreetMap',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6), full: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }
      };
    } catch (error) {
      console.error('OpenStreetMap error:', error);
      return {
        fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: null,
        components: null,
        rawData: null,
        source: 'GPS coordinates only',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6), full: `${lat.toFixed(6)}, ${lng.toFixed(6)}` },
        error: 'Failed to fetch from OpenStreetMap'
      };
    }
  };

  const fetchWeatherData = async (lat, lng, accuracy = null) => {
    try {
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );

      const weatherData = weatherResponse.data;
      const weatherCodes = {
        0: { icon: '☀️', condition: 'Clear sky' },
        1: { icon: '🌤️', condition: 'Mainly clear' },
        2: { icon: '⛅', condition: 'Partly cloudy' },
        3: { icon: '☁️', condition: 'Overcast' },
        45: { icon: '🌫️', condition: 'Fog' },
        48: { icon: '🌫️', condition: 'Depositing rime fog' },
        51: { icon: '🌧️', condition: 'Light drizzle' },
        53: { icon: '🌧️', condition: 'Moderate drizzle' },
        55: { icon: '🌧️', condition: 'Dense drizzle' },
        56: { icon: '🌧️', condition: 'Light freezing drizzle' },
        57: { icon: '🌧️', condition: 'Dense freezing drizzle' },
        61: { icon: '🌧️', condition: 'Slight rain' },
        63: { icon: '🌧️', condition: 'Moderate rain' },
        65: { icon: '🌧️', condition: 'Heavy rain' },
        66: { icon: '🌧️', condition: 'Light freezing rain' },
        67: { icon: '🌧️', condition: 'Heavy freezing rain' },
        71: { icon: '🌨️', condition: 'Slight snow fall' },
        73: { icon: '🌨️', condition: 'Moderate snow fall' },
        75: { icon: '🌨️', condition: 'Heavy snow fall' },
        77: { icon: '🌨️', condition: 'Snow grains' },
        80: { icon: '🌧️', condition: 'Slight rain showers' },
        81: { icon: '🌧️', condition: 'Moderate rain showers' },
        82: { icon: '🌧️', condition: 'Violent rain showers' },
        85: { icon: '🌨️', condition: 'Slight snow showers' },
        86: { icon: '🌨️', condition: 'Heavy snow showers' },
        95: { icon: '⛈️', condition: 'Thunderstorm' },
        96: { icon: '⛈️', condition: 'Thunderstorm with slight hail' },
        99: { icon: '⛈️', condition: 'Thunderstorm with heavy hail' }
      };

      const currentCode = weatherData.current.weather_code;
      const currentWeather = weatherCodes[currentCode] || { icon: '🌤️', condition: 'Fair' };

      const locationInfo = await getOpenStreetMapAddress(lat, lng);
      setLocationAddress(locationInfo.fullAddress);
      setDetailedLocation(locationInfo);

      let displayLocation = 'Your Location';
      const components = locationInfo.components;
      if (components) {
        if (components.suburb) displayLocation = components.suburb;
        else if (components.village) displayLocation = components.village;
        else if (components.city) displayLocation = components.city;
        else if (components.state) displayLocation = components.state;
      }

      setWeather({
        temp: Math.round(weatherData.current.temperature_2m),
        condition: currentWeather.condition,
        humidity: Math.round(weatherData.current.relative_humidity_2m),
        wind: Math.round(weatherData.current.wind_speed_10m),
        location: displayLocation,
        icon: currentWeather.icon,
        feels_like: Math.round(weatherData.current.temperature_2m + 2),
        accuracy,
        coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        source: locationInfo.source
      });

      const forecastData = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayCode = weatherData.daily.weather_code[i];
        const dayWeather = weatherCodes[dayCode] || { icon: '🌤️', condition: 'Fair' };
        forecastData.push({
          day: days[date.getDay()],
          temp: Math.round(weatherData.daily.temperature_2m_max[i]),
          icon: dayWeather.icon,
          condition: dayWeather.condition,
          low: Math.round(weatherData.daily.temperature_2m_min[i])
        });
      }
      setForecast(forecastData);
      setWeatherLoading(false);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeather({
        temp: 28,
        condition: 'Partly Cloudy',
        humidity: 75,
        wind: 12,
        location: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        icon: '🌤️',
        feels_like: 30,
        accuracy,
        coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        source: 'GPS coordinates only'
      });
      setForecast([
        { day: 'Mon', temp: 29, icon: '☀️', condition: 'Sunny', low: 24 },
        { day: 'Tue', temp: 27, icon: '⛅', condition: 'Partly Cloudy', low: 23 },
        { day: 'Wed', temp: 25, icon: '🌧️', condition: 'Rain', low: 22 },
        { day: 'Thu', temp: 26, icon: '⛅', condition: 'Partly Cloudy', low: 23 },
        { day: 'Fri', temp: 30, icon: '☀️', condition: 'Sunny', low: 25 }
      ]);
      setWeatherLoading(false);
    }
  };

  const checkGeolocationPermission = async () => {
    if (!navigator.geolocation) {
      return { available: false, error: 'Geolocation not supported by your browser' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ available: true, error: null }),
        (error) => {
          let errorMessage = 'Location permission denied';
          switch(error.code) {
            case error.PERMISSION_DENIED: errorMessage = 'Location permission denied by user'; break;
            case error.POSITION_UNAVAILABLE: errorMessage = 'Location information is unavailable'; break;
            case error.TIMEOUT: errorMessage = 'Location request timed out'; break;
            default: errorMessage = 'Unknown location error';
          }
          resolve({ available: false, error: errorMessage });
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: Infinity }
      );
    });
  };

  useEffect(() => {
    if (loading) return;

    const initializeLocation = async () => {
      setMapLoading(true);
      const geolocationStatus = await checkGeolocationPermission();
      
      if (geolocationStatus.available) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`GPS Coordinates: ${latitude}, ${longitude}`);
            console.log(`GPS Accuracy: ${accuracy} meters`);
            setGpsAccuracy(accuracy);
            setUserLocation({ lat: latitude, lng: longitude });
            setLocationError(null);
            await fetchWeatherData(latitude, longitude, accuracy);
            setMapLoading(false);
          },
          async (error) => {
            console.error('Precise geolocation error:', error);
            setLocationError('Could not get your location. Please check your browser settings.');
            setMapLoading(false);
            setWeatherLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        console.log('Geolocation status:', geolocationStatus);
        setLocationError(geolocationStatus.error || 'Location services unavailable.');
        setMapLoading(false);
        setWeatherLoading(false);
      }
    };

    initializeLocation();
  }, [loading]);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToMyLocation = () => {
    if (userLocation) {
      const lat = userLocation.lat;
      const lng = userLocation.lng;
      const bboxSize = 0.002;
      const iframe = document.querySelector('iframe[title="OpenStreetMap"]');
      if (iframe) {
        iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bboxSize},${lat - bboxSize},${lng + bboxSize},${lat + bboxSize}&layer=mapnik&marker=${lat},${lng}&center=${lat},${lng}`;
      }
      const toast = document.createElement('div');
      toast.textContent = 'Map centered on your location';
      toast.style.cssText = `
        position: fixed; bottom: 100px; right: 20px; background: #2d6a4f; color: white;
        padding: 10px 15px; border-radius: 8px; z-index: 10000; font-size: 14px;
        animation: fadeInOut 2s ease-in-out;
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  const handleLearnMore = () => navigate('/about-rubber');
  const navigateToMaps = () => navigate('/maps');
  const navigateToWeather = () => navigate('/weather');

  const refreshLocation = async () => {
    setMapLoading(true);
    setWeatherLoading(true);
    setLocationError(null);
    
    const geolocationStatus = await checkGeolocationPermission();
    if (geolocationStatus.available) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsAccuracy(accuracy);
          setUserLocation({ lat: latitude, lng: longitude });
          await fetchWeatherData(latitude, longitude, accuracy);
          setMapLoading(false);
        },
        async (error) => {
          setLocationError('Failed to refresh location. Please check your browser settings.');
          setMapLoading(false);
          setWeatherLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError(geolocationStatus.error || 'Location permission still denied.');
      setMapLoading(false);
      setWeatherLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f7f0' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <IconSpin size={80} color="#2d6a4f" />
        </div>
        <p style={{ textAlign: 'center', color: '#2d6a4f', fontSize: '18px', marginTop: '20px', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '1px' }}>Growing your experience...</p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* User Header Component - Fixed at top */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 2000 }}>
        <UserHeader />
      </div>
      
      <div style={{ minHeight: '100vh', background: '#f5f9f5', position: 'relative', paddingTop: '64px', fontFamily: "'DM Sans', sans-serif" }}>

        {/* ===================== HERO CAROUSEL ===================== */}
        <div style={{
          position: 'relative',
          height: 'calc(100vh - 64px)',
          width: '100%',
          overflow: 'hidden',
          background: '#0d2818'
        }}>
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                opacity: index === currentSlide ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                pointerEvents: index === currentSlide ? 'auto' : 'none'
              }}
            >
              <video
                key={slide.video}
                autoPlay muted loop playsInline
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              >
                <source src={slide.video} type="video/mp4" />
              </video>

              {/* Multi-layer overlay for depth */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(13,40,24,0.75) 0%, rgba(13,40,24,0.3) 50%, rgba(13,40,24,0.6) 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,40,24,0.9) 0%, transparent 50%)' }} />

              {/* Decorative leaf pattern overlay */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(74,181,74,0.08) 0%, transparent 50%)', pointerEvents: 'none' }} />

              {/* Hero Text Content */}
              <div style={{
                position: 'absolute',
                bottom: '120px',
                left: '8%',
                zIndex: 2,
                maxWidth: '640px',
                animation: 'heroSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) both'
              }}>
                <h2 style={{
                  fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
                  marginBottom: '16px',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: '1.15',
                  textShadow: '0 2px 20px rgba(0,0,0,0.3)'
                }}>
                  {slide.title}
                </h2>

                <p style={{
                  fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                  marginBottom: '36px',
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: '1.7',
                  fontWeight: '300'
                }}>
                  {slide.description}
                </p>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <button
                    onClick={handleLearnMore}
                    style={{
                      background: 'linear-gradient(135deg, #4ab54a, #2d6a4f)',
                      color: 'white',
                      padding: '14px 32px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      letterSpacing: '0.5px',
                      boxShadow: '0 8px 24px rgba(74,181,74,0.35)',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(74,181,74,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,181,74,0.35)'; }}
                  >
                    Learn More <IconArrowRight size={14} color="white" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Prev Arrow */}
          <button
            onClick={goToPrevSlide}
            style={{
              position: 'absolute', left: '28px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
              color: 'white', border: '1px solid rgba(255,255,255,0.15)',
              width: '52px', height: '52px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: '300', zIndex: 10,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,181,74,0.5)'; e.currentTarget.style.borderColor = '#4ab54a'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >‹</button>

          {/* Next Arrow */}
          <button
            onClick={goToNextSlide}
            style={{
              position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
              color: 'white', border: '1px solid rgba(255,255,255,0.15)',
              width: '52px', height: '52px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: '300', zIndex: 10,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,181,74,0.5)'; e.currentTarget.style.borderColor = '#4ab54a'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >›</button>

          {/* Dot Indicators */}
          <div style={{
            position: 'absolute', bottom: '40px', left: '8%',
            display: 'flex', gap: '10px', zIndex: 10, alignItems: 'center'
          }}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  width: index === currentSlide ? '36px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: index === currentSlide ? '#4ab54a' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.4s ease',
                  padding: 0
                }}
              />
            ))}
          </div>

          {/* Scroll indicator */}
          <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 10, opacity: 0.6 }}>
            <span style={{ color: 'white', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Scroll</span>
            <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, white, transparent)', animation: 'scrollPulse 2s ease-in-out infinite' }}></div>
          </div>
        </div>

        {/* ===================== MAIN CONTENT ===================== */}
        <div style={{ background: '#f5f9f5' }}>

          {/* ── WELCOME SECTION ── */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '100px 40px 80px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
              {/* Left: Text */}
              <div>
                <h2 style={{
                  color: '#0d2818',
                  fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
                  fontWeight: '700',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  lineHeight: '1.2',
                  marginBottom: '24px'
                }}>
                  AI-Powered{' '}
                  <span style={{ color: '#2d6a4f', fontStyle: 'italic' }}>Rubber Tree Detection</span>
                  {' '}at Your Fingertips
                </h2>

                <p style={{ color: '#4a6455', fontSize: '1.05rem', lineHeight: '1.85', marginBottom: '16px', fontWeight: '300' }}>
                  Upload or scan a photo of rubber tree <strong>leaves, trunks, or latex</strong> and our machine learning model will instantly identify quality, detect diseases, assess health, and provide actionable recommendations.
                </p>

                <p style={{ color: '#2d6a4f', fontSize: '1rem', fontWeight: '600', marginBottom: '32px' }}>
                  Scan. Detect. Recommend — Powered by Advanced ML
                </p>

                {/* Feature grid - clickable navigation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[
                    { icon: <IconFlask size={18} />, label: 'Latex Detection', path: '/latex-detection', clickable: true },
                    { icon: <IconTree size={18} />, label: 'Trunk Analysis', path: '/trunks-detection', clickable: true },
                    { icon: <IconRobot size={18} />, label: 'AI Assistant', path: null, clickable: false, action: () => setIsChatOpen(true) },
                    { icon: <IconCloud size={18} />, label: 'Weather Monitoring', path: '/weather', clickable: true },
                    { icon: <IconLeaf size={18} />, label: 'Leaf Detection', path: '/leaf-detection', clickable: true },
                    { icon: <IconFileText size={18} />, label: 'Community Blogspot', path: '/community-blogspot', clickable: true },
                    { icon: <IconMap size={18} />, label: 'Plantation Mapping', path: '/maps', clickable: true }
                  ].map((feature, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (feature.action) {
                          feature.action();
                        } else if (feature.clickable && feature.path) {
                          navigate(feature.path);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '13px 16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #d8eed8',
                        color: '#0d2818',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: feature.clickable || feature.action ? 'pointer' : 'default',
                        transition: 'all 0.25s ease',
                        boxShadow: '0 2px 8px rgba(45,106,79,0.05)',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (feature.clickable || feature.action) {
                          e.currentTarget.style.background = '#2d6a4f';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(45,106,79,0.25)';
                          e.currentTarget.style.borderColor = '#2d6a4f';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (feature.clickable || feature.action) {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.color = '#0d2818';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,106,79,0.05)';
                          e.currentTarget.style.borderColor = '#d8eed8';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>{feature.icon}</span>
                        <span>{feature.label}</span>
                      </div>
                      {(feature.clickable || feature.action) && (
                        <IconArrowRight size={12} color="currentColor" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Stacked images with badge */}
              <div style={{ position: 'relative', minHeight: '560px' }}>
                {/* Top image */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '85%', height: '300px',
                  borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 24px 48px rgba(13,40,24,0.2)',
                  border: '4px solid white'
                }}>
                  <img
                    src="/src/Components/aboutrubber/latexproduct.jpg"
                    alt="Latex Product"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/480x300/2d6a4f/ffffff?text=Latex+Product'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,40,24,0.3) 0%, transparent 60%)' }}></div>
                </div>

                {/* Bottom image */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: '75%', height: '260px',
                  borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 24px 48px rgba(13,40,24,0.2)',
                  border: '4px solid white'
                }}>
                  <img
                    src="/src/Components/aboutrubber/rubbertree.jpg"
                    alt="Rubber Tree Plantation"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/380x260/1b4332/ffffff?text=Rubber+Tree'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,40,24,0.3) 0%, transparent 60%)' }}></div>
                </div>

                {/* Decorative circle */}
                <div style={{
                  position: 'absolute', top: '-30px', left: '-20px',
                  width: '180px', height: '180px',
                  background: 'radial-gradient(circle, rgba(74,181,74,0.12), transparent)',
                  borderRadius: '50%', zIndex: -1
                }}></div>
                <div style={{
                  position: 'absolute', bottom: '-20px', right: '30px',
                  width: '120px', height: '120px',
                  background: 'radial-gradient(circle, rgba(45,106,79,0.12), transparent)',
                  borderRadius: '50%', zIndex: -1
                }}></div>
              </div>
            </div>
          </div>

          {/* Attractive Green Line Divider */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
            <div style={{
              position: 'relative',
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, #4ab54a 20%, #2d6a4f 50%, #4ab54a 80%, transparent 100%)',
              marginBottom: '20px'
            }} />
            
            {/* Decorative leaf icon in the center */}
            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '-22px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: '#f5f9f5',
                padding: '0 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <IconLeaf size={22} color="#2d6a4f" />
                <IconLeaf size={22} color="#2d6a4f" />
              </div>
            </div>

            {/* Double line effect */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(74,181,74,0.3), rgba(45,106,79,0.5), rgba(74,181,74,0.3), transparent)',
              marginTop: '-10px',
              marginBottom: '40px'
            }} />
          </div>

          {/* ── DASHBOARD CARDS: WEATHER & MAP ── */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 80px' }}>

            {/* Section heading */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ color: '#0d2818', fontSize: '2.2rem', fontFamily: "'Playfair Display', serif", fontWeight: '700', margin: 0 }}>
                Real-Time Field Intelligence
              </h2>
              <p style={{ color: '#4a6455', fontSize: '1rem', marginTop: '12px', fontWeight: '300' }}>Monitor weather and location data for your plantation</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

              {/* ── WEATHER CARD ── */}
              <div
                onClick={navigateToWeather}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(13,40,24,0.08)',
                  border: '1px solid #d8eed8',
                  cursor: 'pointer',
                  transition: 'all 0.35s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(13,40,24,0.16)'; e.currentTarget.style.borderColor = '#4ab54a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(13,40,24,0.08)'; e.currentTarget.style.borderColor = '#d8eed8'; }}
              >
                {/* Card header strip */}
                <div style={{ background: 'linear-gradient(135deg, #1b4332, #2d6a4f)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconCloudSun size={22} color="white" />
                    <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: '600', fontFamily: "'Playfair Display', serif" }}>Current Weather</span>
                    {weatherLoading && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '3px 10px', borderRadius: '20px' }}>Loading...</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); refreshLocation(); }}
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                    >
                      <IconRefresh size={13} color="white" /> Refresh
                    </button>
                    <div style={{ background: 'rgba(74,181,74,0.3)', color: '#a8e6a3', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(74,181,74,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconArrowUpRight size={12} color="#a8e6a3" /> Full View
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Date/time */}
                  <div style={{ background: '#f5f9f5', padding: '14px 18px', borderRadius: '10px', border: '1px solid #d8eed8', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#4a6455', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconCalendar size={15} color="#4a6455" /> {currentDate}
                    </div>
                    <div style={{ color: '#2d6a4f', fontSize: '1rem', fontWeight: '700', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconClock size={15} color="#2d6a4f" /> {currentTime}
                    </div>
                  </div>

                  {weather && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, #f5f9f5, #e8f5e9)', borderRadius: '12px', border: '1px solid #d8eed8' }}>
                        <div>
                          <div style={{ fontSize: '3.2rem', color: '#1b4332', fontWeight: '800', fontFamily: "'Playfair Display', serif", lineHeight: '1' }}>{weather.temp}°<span style={{ fontSize: '1.8rem', color: '#2d6a4f' }}>C</span></div>
                          <div style={{ color: '#4a6455', fontSize: '1rem', marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500' }}>{weather.condition}</span>
                            <span style={{ fontSize: '0.8rem', color: '#666', background: 'white', padding: '2px 8px', borderRadius: '20px', border: '1px solid #d8eed8' }}>Feels {weather.feels_like}°C</span>
                          </div>
                          <div style={{ color: '#2d6a4f', fontSize: '0.85rem', marginTop: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconPin size={13} color="#2d6a4f" /> {weather.location}
                          </div>
                        </div>
                        <div style={{ animation: 'float 3s ease-in-out infinite' }}>
                          {weatherIconMap[weather.icon] || <IconCloudSun size={40} color="#f59e0b" />}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                        {[
                          { label: 'Humidity', value: `${weather.humidity}%`, iconEl: <IconDroplets size={22} color="#60a5fa" /> },
                          { label: 'Wind Speed', value: `${weather.wind} km/h`, iconEl: <IconWind size={22} color="#34d399" /> }
                        ].map((item, i) => (
                          <div key={i} style={{ background: '#f5f9f5', padding: '16px', borderRadius: '10px', textAlign: 'center', border: '1px solid #d8eed8' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>{item.iconEl}</div>
                            <div style={{ color: '#4a6455', fontSize: '0.8rem', marginBottom: '4px' }}>{item.label}</div>
                            <div style={{ color: '#1b4332', fontSize: '1.5rem', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 style={{ color: '#0d2818', marginBottom: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IconCalendar size={16} color="#0d2818" /> 5-Day Forecast
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {forecast.map((day, index) => (
                            <div key={index}
                              style={{ background: '#f5f9f5', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', flex: 1, border: '1px solid #d8eed8', cursor: 'default', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#2d6a4f'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(45,106,79,0.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f9f5'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              <div style={{ color: '#4a6455', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>{day.day}</div>
                              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                                {weatherIconSmallMap[day.icon] || <IconCloudSun size={22} color="#f59e0b" />}
                              </div>
                              <div style={{ color: '#1b4332', fontWeight: '700', fontSize: '1.1rem' }}>{day.temp}°</div>
                              <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '2px' }}>{day.low}°</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── MAP CARD ── */}
              <div
                onClick={navigateToMaps}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(13,40,24,0.08)',
                  border: '1px solid #d8eed8',
                  cursor: 'pointer',
                  transition: 'all 0.35s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(13,40,24,0.16)'; e.currentTarget.style.borderColor = '#4ab54a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(13,40,24,0.08)'; e.currentTarget.style.borderColor = '#d8eed8'; }}
              >
                {/* Card header strip */}
                <div style={{ background: 'linear-gradient(135deg, #1b4332, #2d6a4f)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconMap size={22} color="white" />
                    <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: '600', fontFamily: "'Playfair Display', serif" }}>Your Location</span>
                    {mapLoading && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '3px 10px', borderRadius: '20px' }}>Detecting...</span>
                    )}
                  </div>
                  <div style={{ background: 'rgba(74,181,74,0.3)', color: '#a8e6a3', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(74,181,74,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconArrowUpRight size={12} color="#a8e6a3" /> Full Map
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {locationError && (
                    <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', color: '#92400e', padding: '12px 15px', borderRadius: '10px', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ flexShrink: 0, marginTop: '1px' }}><IconAlertTriangle size={18} color="#f59e0b" /></span>
                      <div style={{ flex: 1 }}>
                        <strong>Location Issue:</strong> {locationError}
                        <div style={{ fontSize: '0.8rem', marginTop: '3px', opacity: 0.8 }}>Enable location access in your browser settings</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setLocationError(null); }} style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <IconX size={18} color="#92400e" />
                      </button>
                    </div>
                  )}

                  <div style={{ height: '360px', borderRadius: '10px', overflow: 'hidden', background: '#e8f5e9', position: 'relative', marginBottom: '18px', border: '1px solid #d8eed8' }}>
                    {userLocation ? (
                      <iframe
                        ref={mapIframeRef}
                        title="OpenStreetMap"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.005},${userLocation.lat - 0.005},${userLocation.lng + 0.005},${userLocation.lat + 0.005}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}&center=${userLocation.lat},${userLocation.lng}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                            <IconPin size={48} color="#2d6a4f" />
                          </div>
                          <div style={{ fontSize: '1.05rem', color: '#2d6a4f', fontWeight: '600', marginBottom: '8px' }}>Location Access Required</div>
                          <div style={{ fontSize: '0.85rem', color: '#4a6455' }}>Allow location for mapping & weather</div>
                        </div>
                      </div>
                    )}

                    {userLocation && (
                      <button
                        onClick={(e) => { e.stopPropagation(); goToMyLocation(); }}
                        style={{
                          position: 'absolute', bottom: '14px', right: '14px',
                          background: 'white', color: '#2d6a4f',
                          border: '2px solid #2d6a4f',
                          width: '44px', height: '44px', borderRadius: '50%',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          zIndex: 10,
                          boxShadow: '0 4px 12px rgba(45,106,79,0.3)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#2d6a4f'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
                        title="Center on my location"
                      >
                        <IconTarget size={20} color="inherit" />
                      </button>
                    )}
                  </div>

                  {locationAddress && (
                    <div style={{ background: '#f5f9f5', padding: '14px 16px', borderRadius: '10px', border: '1px solid #d8eed8', marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: '#2d6a4f', color: 'white', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconPin size={18} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#4a6455', marginBottom: '3px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Address</div>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#0d2818', lineHeight: '1.4' }}>{locationAddress}</div>
                      </div>
                    </div>
                  )}

                  {/* Plantation Locations Section - Scrollable */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h3 style={{ color: '#0d2818', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <IconTree size={16} color="#2d6a4f" /> Philippines Plantations
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: '#4a6455', background: '#f5f9f5', padding: '2px 8px', borderRadius: '12px' }}>
                        {plantations.length} locations
                      </span>
                    </div>
                    
                    <div style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      borderRadius: '8px',
                      border: '1px solid #d8eed8',
                      background: '#fafdfa'
                    }}>
                      {plantations.map((plantation, index) => (
                        <div
                          key={index}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '10px 12px',
                            borderBottom: index < plantations.length - 1 ? '1px solid #e8f5e9' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: 'white'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9f0'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              <IconTree size={14} color={plantation.type === 'Large' ? '#2d6a4f' : plantation.type === 'Medium' ? '#4a6455' : '#6b8e6b'} />
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#0d2818' }}>
                                {plantation.name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#4a6455', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ 
                                  background: plantation.type === 'Large' ? '#2d6a4f' : plantation.type === 'Medium' ? '#4a6455' : '#6b8e6b',
                                  color: 'white',
                                  padding: '1px 6px',
                                  borderRadius: '10px',
                                  fontSize: '0.6rem',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  {plantation.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <IconArrowRight size={12} color="#4a6455" />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#4a6455', textAlign: 'right', marginTop: '6px' }}>
                      Scroll for more locations
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: '12px', background: '#f5f9f5', borderRadius: '8px', border: '1px solid #d8eed8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <IconPin size={16} color="#4ab54a" />
                    <span style={{ color: '#2d6a4f', fontSize: '0.82rem', fontWeight: '600' }}>Click anywhere to open the full interactive map</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* User Footer */}
      <UserFooter />

      {/* Chatbot Widget - Always rendered but controls visibility via isOpen */}
      <ChatbotWidget 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(!isChatOpen)}
        sessionId={chatSessionId}
      />

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { box-sizing: border-box; }
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f5f9f5; }
        ::-webkit-scrollbar-thumb { background: #c8e6c9; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2d6a4f; }
      `}</style>
    </>
  );
};

export default Home;