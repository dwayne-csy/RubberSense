// RubberSense/Web/src/Components/User/Weather.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

// ── SVG Icon Components ──────────────────────────────────────────────────────

const IconSun = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconCloudSun = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"/>
    <path d="M17 12a5 5 0 1 0-9.9-1H6a3 3 0 0 0 0 6h11a3 3 0 0 0 0-6z"/>
  </svg>
);

const IconCloud = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const IconCloudRain = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
  </svg>
);

const IconSnowflake = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
    <path d="M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>
  </svg>
);

const IconZap = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconFog = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    <line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="17" x2="21" y2="17"/>
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

const IconThermometer = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
  </svg>
);

const IconDroplets = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
  </svg>
);

const IconWind = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);

const IconCalendar = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconClock = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconAlertTriangle = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconX = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconFactory = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
  </svg>
);

const IconArrowRight = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconArrowDown = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);

// Map emoji icon strings -> SVG components
const WeatherIconFromEmoji = ({ icon, size = 20, color = 'currentColor' }) => {
  const map = {
    '☀️': <IconSun size={size} color={color} />,
    '🌤️': <IconCloudSun size={size} color={color} />,
    '⛅': <IconCloudSun size={size} color={color} />,
    '☁️': <IconCloud size={size} color={color} />,
    '🌫️': <IconFog size={size} color={color} />,
    '🌧️': <IconCloudRain size={size} color={color} />,
    '🌨️': <IconSnowflake size={size} color={color} />,
    '⛈️': <IconZap size={size} color={color} />,
  };
  return map[icon] || <IconCloudSun size={size} color={color} />;
};

// ── Component ────────────────────────────────────────────────────────────────

const Weather = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [selectedPlantation, setSelectedPlantation] = useState(null);
  const [plantationWeather, setPlantationWeather] = useState({});
  const [plantationLoading, setPlantationLoading] = useState({});
  const [viewMode, setViewMode] = useState('user');
  const [selectedPlantationType, setSelectedPlantationType] = useState('all');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  const weatherCodes = {
    0: { icon: '☀️', condition: 'Clear sky', color: '#FFD700' },
    1: { icon: '🌤️', condition: 'Mainly clear', color: '#87CEEB' },
    2: { icon: '⛅', condition: 'Partly cloudy', color: '#A9A9A9' },
    3: { icon: '☁️', condition: 'Overcast', color: '#696969' },
    45: { icon: '🌫️', condition: 'Fog', color: '#D3D3D3' },
    48: { icon: '🌫️', condition: 'Depositing rime fog', color: '#D3D3D3' },
    51: { icon: '🌧️', condition: 'Light drizzle', color: '#4682B4' },
    53: { icon: '🌧️', condition: 'Moderate drizzle', color: '#4169E1' },
    55: { icon: '🌧️', condition: 'Dense drizzle', color: '#0000CD' },
    56: { icon: '🌧️', condition: 'Light freezing drizzle', color: '#B0C4DE' },
    57: { icon: '🌧️', condition: 'Dense freezing drizzle', color: '#6495ED' },
    61: { icon: '🌧️', condition: 'Slight rain', color: '#4682B4' },
    63: { icon: '🌧️', condition: 'Moderate rain', color: '#4169E1' },
    65: { icon: '🌧️', condition: 'Heavy rain', color: '#0000CD' },
    66: { icon: '🌧️', condition: 'Light freezing rain', color: '#B0C4DE' },
    67: { icon: '🌧️', condition: 'Heavy freezing rain', color: '#6495ED' },
    71: { icon: '🌨️', condition: 'Slight snow fall', color: '#F0F8FF' },
    73: { icon: '🌨️', condition: 'Moderate snow fall', color: '#E0FFFF' },
    75: { icon: '🌨️', condition: 'Heavy snow fall', color: '#AFEEEE' },
    77: { icon: '🌨️', condition: 'Snow grains', color: '#B0E0E6' },
    80: { icon: '🌧️', condition: 'Slight rain showers', color: '#4682B4' },
    81: { icon: '🌧️', condition: 'Moderate rain showers', color: '#4169E1' },
    82: { icon: '🌧️', condition: 'Violent rain showers', color: '#0000CD' },
    85: { icon: '🌨️', condition: 'Slight snow showers', color: '#F0F8FF' },
    86: { icon: '🌨️', condition: 'Heavy snow showers', color: '#E0FFFF' },
    95: { icon: '⛈️', condition: 'Thunderstorm', color: '#4B0082' },
    96: { icon: '⛈️', condition: 'Thunderstorm with slight hail', color: '#483D8B' },
    99: { icon: '⛈️', condition: 'Thunderstorm with heavy hail', color: '#2F4F4F' }
  };

  const rubberPlantations = [
    { id: 1, name: "Kidapawan City, North Cotabato", type: "large", lat: 7.0086, lng: 125.0894, color: "green", size: "LARGE" },
    { id: 2, name: "Makilala, North Cotabato", type: "large", lat: 6.9667, lng: 125.0833, color: "green", size: "LARGE" },
    { id: 3, name: "Matalam, North Cotabato", type: "large", lat: 7.0833, lng: 124.9000, color: "green", size: "LARGE" },
    { id: 4, name: "President Roxas, North Cotabato", type: "large", lat: 7.1545, lng: 125.0558, color: "green", size: "LARGE" },
    { id: 5, name: "Tampilisan, Zamboanga del Norte", type: "large", lat: 8.0500, lng: 122.6833, color: "green", size: "LARGE" },
    { id: 6, name: "Zamboanga Sibugay", type: "large", lat: 7.8000, lng: 122.6667, color: "green", size: "LARGE" },
    { id: 7, name: "Basilan", type: "large", lat: 6.7167, lng: 122.0667, color: "green", size: "LARGE" },
    { id: 8, name: "South Upi, Maguindanao", type: "medium", lat: 7.0167, lng: 124.1667, color: "yellow", size: "MEDIUM" },
    { id: 9, name: "Upi, Maguindanao", type: "medium", lat: 7.0333, lng: 124.1833, color: "yellow", size: "MEDIUM" },
    { id: 10, name: "Trento, Agusan del Sur", type: "medium", lat: 8.0500, lng: 126.0667, color: "yellow", size: "MEDIUM" },
    { id: 11, name: "Sta. Josefa, Agusan del Sur", type: "medium", lat: 7.9833, lng: 126.0333, color: "yellow", size: "MEDIUM" },
    { id: 12, name: "Rosario, Agusan del Sur", type: "medium", lat: 8.3833, lng: 125.8333, color: "yellow", size: "MEDIUM" },
    { id: 13, name: "Bunawan, Agusan del Sur", type: "medium", lat: 8.1833, lng: 125.9833, color: "yellow", size: "MEDIUM" },
    { id: 14, name: "Laak, Davao de Oro", type: "medium", lat: 7.8000, lng: 125.8000, color: "yellow", size: "MEDIUM" },
    { id: 15, name: "Maco, Davao de Oro", type: "medium", lat: 7.3667, lng: 125.8500, color: "yellow", size: "MEDIUM" },
    { id: 16, name: "Monkayo, Davao de Oro", type: "medium", lat: 7.8167, lng: 126.0500, color: "yellow", size: "MEDIUM" },
    { id: 17, name: "Aleosan, North Cotabato", type: "small", lat: 7.1500, lng: 124.5667, color: "red", size: "SMALL" },
    { id: 18, name: "Pinamalayan, Mindoro", type: "small", lat: 13.0333, lng: 121.4333, color: "red", size: "SMALL" },
    { id: 19, name: "Los Baños, Laguna", type: "small", lat: 14.1667, lng: 121.2333, color: "red", size: "SMALL" },
    { id: 20, name: "Calamba, Laguna", type: "small", lat: 14.2167, lng: 121.1667, color: "red", size: "SMALL" },
    { id: 21, name: "Bay, Laguna", type: "small", lat: 14.1833, lng: 121.2833, color: "red", size: "SMALL" },
    { id: 22, name: "Santa Cruz, Laguna", type: "small", lat: 14.2833, lng: 121.4167, color: "red", size: "SMALL" },
    { id: 23, name: "Palawan", type: "small", lat: 10.0000, lng: 118.7500, color: "red", size: "SMALL" },
    { id: 24, name: "Talakag, Bukidnon", type: "small", lat: 8.2333, lng: 124.6000, color: "red", size: "SMALL" },
    { id: 25, name: "Kalilangan, Bukidnon", type: "small", lat: 7.9167, lng: 124.7333, color: "red", size: "SMALL" },
    { id: 26, name: "Negros Oriental", type: "small", lat: 9.7500, lng: 122.8333, color: "red", size: "SMALL" },
    { id: 27, name: "Tacloban, Leyte", type: "small", lat: 11.2500, lng: 125.0000, color: "red", size: "SMALL" }
  ];

  const getPlantationsByType = (type) => {
    if (type === 'all') return rubberPlantations;
    return rubberPlantations.filter(p => p.type === type);
  };

  const getPlantationStats = () => {
    const largeCount = rubberPlantations.filter(p => p.type === 'large').length;
    const mediumCount = rubberPlantations.filter(p => p.type === 'medium').length;
    const smallCount = rubberPlantations.filter(p => p.type === 'small').length;
    return { largeCount, mediumCount, smallCount, total: rubberPlantations.length };
  };

  const fetchWeatherData = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );
      if (!response.ok) throw new Error('Weather API error');
      const weatherData = await response.json();
      const currentCode = weatherData.current.weather_code;
      const currentWeather = weatherCodes[currentCode] || { icon: '🌤️', condition: 'Fair', color: '#87CEEB' };
      return {
        current: {
          temp: Math.round(weatherData.current.temperature_2m),
          condition: currentWeather.condition,
          humidity: Math.round(weatherData.current.relative_humidity_2m),
          wind: Math.round(weatherData.current.wind_speed_10m),
          icon: currentWeather.icon,
          color: currentWeather.color,
          feels_like: Math.round(weatherData.current.temperature_2m + 2),
          weather_code: currentCode
        },
        daily: weatherData.daily.time.map((date, index) => ({
          date: new Date(date),
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          temp_max: Math.round(weatherData.daily.temperature_2m_max[index]),
          temp_min: Math.round(weatherData.daily.temperature_2m_min[index]),
          weather_code: weatherData.daily.weather_code[index]
        })),
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6) },
        fetched_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      throw error;
    }
  };

  const getFiveDayForecast = (dailyData) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const forecastData = [];
    for (let i = 0; i < 5; i++) {
      const dayCode = dailyData[i].weather_code;
      const dayWeather = weatherCodes[dayCode] || { icon: '🌤️', condition: 'Fair', color: '#87CEEB' };
      forecastData.push({
        day: days[dailyData[i].date.getDay()],
        temp: dailyData[i].temp_max,
        icon: dayWeather.icon,
        condition: dayWeather.condition,
        low: dailyData[i].temp_min,
        color: dayWeather.color,
        weather_code: dayCode
      });
    }
    return forecastData;
  };

  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'RubberSenseApp/1.0' } }
      );
      if (!response.ok) throw new Error('OpenStreetMap error');
      const data = await response.json();
      const address = data.address || {};
      const parts = [];
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      const formattedAddress = parts.filter(Boolean).join(', ') || data.display_name;
      return {
        fullAddress: formattedAddress || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        components: address,
        source: 'OpenStreetMap',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6) }
      };
    } catch (error) {
      console.error('OpenStreetMap error:', error);
      return {
        fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        components: null,
        source: 'GPS coordinates only',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6) }
      };
    }
  };

  const checkGeolocationPermission = () => {
    if (!navigator.geolocation) {
      return { available: false, error: 'Geolocation not supported by your browser' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ available: true, error: null }),
        (error) => {
          let errorMessage = 'Location permission denied';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied by user';
          }
          resolve({ available: false, error: errorMessage });
        },
        { timeout: 3000 }
      );
    });
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({ lat: latitude, lng: longitude, accuracy });
        },
        (error) => reject(new Error('Could not get location')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData || { name: 'Guest' });
      } catch (e) {
        setUser({ name: 'Guest' });
      }
    } else {
      setUser({ name: 'Guest' });
    }
    setLoading(false);

    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateDateTime();
    const timeInterval = setInterval(updateDateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (loading) return;
    const initializeLocation = async () => {
      setWeatherLoading(true);
      const geolocationStatus = await checkGeolocationPermission();
      if (geolocationStatus.available) {
        try {
          const location = await getUserLocation();
          const { lat, lng } = location;
          setUserLocation({ lat, lng });
          setLocationError(null);
          const locationInfo = await getOpenStreetMapAddress(lat, lng);
          setLocationAddress(locationInfo.fullAddress);
          const weatherData = await fetchWeatherData(lat, lng);
          setWeather(weatherData);
          const fiveDayForecast = getFiveDayForecast(weatherData.daily);
          setForecast(fiveDayForecast);
        } catch (error) {
          console.error('Location/Weather error:', error);
          setLocationError('Could not get weather data. Please try again.');
        }
      } else {
        setLocationError(geolocationStatus.error);
      }
      setWeatherLoading(false);
    };
    initializeLocation();
  }, [loading]);

  const loadPlantationWeather = async (plantation) => {
    setPlantationLoading(prev => ({ ...prev, [plantation.id]: true }));
    try {
      const weatherData = await fetchWeatherData(plantation.lat, plantation.lng);
      const fiveDayForecast = getFiveDayForecast(weatherData.daily);
      setPlantationWeather(prev => ({
        ...prev,
        [plantation.id]: { ...weatherData, forecast: fiveDayForecast, plantationInfo: plantation }
      }));
      setSelectedPlantation(plantation);
      setViewMode('plantation');
    } catch (error) {
      console.error(`Failed to load weather for ${plantation.name}:`, error);
    } finally {
      setPlantationLoading(prev => ({ ...prev, [plantation.id]: false }));
    }
  };

  const handleMyLocation = async () => {
    setWeatherLoading(true);
    try {
      const geolocationStatus = await checkGeolocationPermission();
      if (geolocationStatus.available) {
        const location = await getUserLocation();
        const { lat, lng } = location;
        setUserLocation({ lat, lng });
        setLocationError(null);
        const locationInfo = await getOpenStreetMapAddress(lat, lng);
        setLocationAddress(locationInfo.fullAddress);
        const weatherData = await fetchWeatherData(lat, lng);
        setWeather(weatherData);
        const fiveDayForecast = getFiveDayForecast(weatherData.daily);
        setForecast(fiveDayForecast);
        setSelectedPlantation(null);
        setViewMode('user');
        showToast('Location weather loaded successfully!', 'success');
      } else {
        setLocationError(geolocationStatus.error);
      }
    } catch (error) {
      console.error('Location/Weather error:', error);
      setLocationError('Could not get weather data. Please try again.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 100px; right: 20px;
      background: ${type === 'success' ? '#228B22' : '#228B22'};
      color: white; padding: 10px 15px; borderRadius: 8px;
      z-index: 10000; font-size: 14px;
      animation: fadeInOut 2s ease-in-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const getCurrentWeatherData = () => {
    if (viewMode === 'plantation' && selectedPlantation && plantationWeather[selectedPlantation.id]) {
      const data = plantationWeather[selectedPlantation.id];
      return {
        ...data.current,
        forecast: data.forecast,
        location: selectedPlantation.name,
        coordinates: data.coordinates,
        isPlantation: true,
        plantationInfo: selectedPlantation
      };
    } else if (weather) {
      let displayLocation = 'Your Location';
      if (locationAddress && locationAddress !== 'Coordinates: ') {
        displayLocation = locationAddress.split(',')[0] || 'Your Location';
      }
      return {
        ...weather.current,
        forecast: forecast,
        location: displayLocation,
        coordinates: weather.coordinates,
        isPlantation: false
      };
    }
    return null;
  };

  const getPlantationTypeColor = (type) => {
    switch(type) {
      case 'large': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'small': return '#F44336';
      default: return '#666666';
    }
  };

  const getPlantationTypeIcon = (type) => {
    const colors = { large: '#4CAF50', medium: '#FFC107', small: '#F44336' };
    return <IconTree size={16} color={colors[type] || '#666'} />;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f2f7f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
            <circle cx="28" cy="28" r="24" stroke="#d1ead1" strokeWidth="3"/>
            <path d="M28 4a24 24 0 0 1 24 24" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 28 28" to="360 28 28" dur="0.9s" repeatCount="indefinite"/>
            </path>
          </svg>
          <p style={{ color: '#2e7d32', fontWeight: '600', fontSize: '1rem', letterSpacing: '0.05em', margin: 0 }}>
            Loading Weather Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const currentWeather = getCurrentWeatherData();
  const stats = getPlantationStats();
  const filteredPlantations = getPlantationsByType(selectedPlantationType);

  return (
    <>
      <UserHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: translateY(8px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }

        .rs-weather-page {
          font-family: 'DM Sans', sans-serif;
          background: #f2f7f2;
          min-height: 100vh;
          padding-top: 64px;
        }

        .rs-stat-card {
          border-radius: 20px; padding: 26px 22px;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          animation: fadeUp 0.5s ease both;
        }
        .rs-stat-card:hover { transform: translateY(-5px); }
        .rs-stat-card .deco-a { position: absolute; top: -20px; right: -20px; width: 88px; height: 88px; background: rgba(255,255,255,0.1); border-radius: 50%; }
        .rs-stat-card .deco-b { position: absolute; bottom: -24px; left: -8px; width: 64px; height: 64px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .rs-stat-card .icon-box { background: rgba(255,255,255,0.18); border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; }
        .rs-stat-card .badge-pill { background: rgba(255,255,255,0.22); color: #fff; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; }
        .rs-stat-card .big-num { font-family: 'Playfair Display', Georgia, serif; font-size: 3.2rem; font-weight: 700; color: #fff; line-height: 1; position: relative; margin-top: 14px; }
        .rs-stat-card .sub-label { color: rgba(255,255,255,0.72); font-size: 0.78rem; font-weight: 500; margin-top: 5px; position: relative; }

        .rs-panel { background: #fff; border: 1px solid #ddeedd; border-radius: 22px; overflow: hidden; box-shadow: 0 2px 16px rgba(46,125,50,0.07); animation: fadeUp 0.5s ease 0.08s both; }
        .rs-panel-header { padding: 18px 24px; border-bottom: 1px solid #eef6ee; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: #fafcfa; }

        .rs-weather-hero { background: linear-gradient(135deg, #1a4d1e 0%, #2e7d32 45%, #388e3c 100%); border-radius: 18px; padding: 28px 28px 26px; position: relative; overflow: hidden; margin-bottom: 22px; }
        .rs-weather-hero .hero-deco-a { position: absolute; top: -36px; right: -36px; width: 160px; height: 160px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .rs-weather-hero .hero-deco-b { position: absolute; bottom: -24px; left: 30%; width: 110px; height: 110px; background: rgba(255,255,255,0.04); border-radius: 50%; }

        .rs-chip { background: #f4fbf4; border: 1px solid #ddeedd; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; transition: border-color 0.2s, background 0.2s; }
        .rs-chip:hover { background: #eaf6ea; border-color: #a5d6a7; }

        .rs-forecast-card { background: #f4fbf4; border: 1px solid #ddeedd; border-radius: 14px; padding: 14px 10px; text-align: center; flex: 1; transition: all 0.2s ease; cursor: default; }
        .rs-forecast-card:hover { background: #1a4d1e; border-color: #1a4d1e; transform: translateY(-5px); box-shadow: 0 8px 24px rgba(26,77,30,0.2); }
        .rs-forecast-card:hover .fc-day,
        .rs-forecast-card:hover .fc-temp,
        .rs-forecast-card:hover .fc-cond,
        .rs-forecast-card:hover .fc-low { color: rgba(255,255,255,0.85) !important; }
        .rs-forecast-card:hover .fc-temp { color: #ffffff !important; }

        .rs-plantation-item { background: #fff; border: 1px solid #eef0ee; border-radius: 12px; padding: 12px 14px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 7px; display: flex; align-items: center; justify-content: space-between; }
        .rs-plantation-item:hover { border-color: #a5d6a7; background: #f5fbf5; transform: translateX(3px); box-shadow: 0 2px 10px rgba(46,125,50,0.09); }
        .rs-plantation-item.selected { border-color: #2e7d32; background: #f0f9f0; box-shadow: 0 2px 14px rgba(46,125,50,0.13); }

        .rs-my-loc-btn { background: linear-gradient(135deg, #2e7d32, #388e3c); color: white; border: none; padding: 9px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 7px; letter-spacing: 0.01em; white-space: nowrap; box-shadow: 0 2px 8px rgba(46,125,50,0.22); }
        .rs-my-loc-btn:hover { background: linear-gradient(135deg, #1b5e20, #2e7d32); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(46,125,50,0.32); }

        .rs-type-select { background: #f5fbf5; color: #2e7d32; border: 1.5px solid #c8e6c9; padding: 9px 34px 9px 14px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; cursor: pointer; outline: none; font-weight: 500; transition: border-color 0.2s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232e7d32' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
        .rs-type-select:hover, .rs-type-select:focus { border-color: #2e7d32; }

        .rs-spinner { width: 17px; height: 17px; border: 2px solid #d1ead1; border-top-color: #2e7d32; border-radius: 50%; animation: spin 0.75s linear infinite; flex-shrink: 0; }

        .rs-section-label { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; color: #1a3d1e; font-size: 1rem; letter-spacing: -0.01em; }

        .rs-badge { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; }

        .rs-datetime-bar { display: flex; align-items: center; gap: 18px; padding: 13px 18px; background: #f5fbf5; border-radius: 12px; border: 1px solid #ddeedd; margin-bottom: 20px; }

        .rs-sidebar { background: #fff; border: 1px solid #ddeedd; border-radius: 22px; overflow: hidden; box-shadow: 0 2px 16px rgba(46,125,50,0.07); animation: fadeUp 0.5s ease 0.14s both; }
        .rs-sidebar-header { padding: 17px 20px; border-bottom: 1px solid #eef6ee; display: flex; align-items: center; justify-content: space-between; background: #fafcfa; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f0f7f0; }
        ::-webkit-scrollbar-thumb { background: #a5d6a7; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2e7d32; }
      `}</style>

      <div className="rs-weather-page">
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '36px 24px 56px' }}>

          {/* ── Page Header ── */}
          <div style={{ marginBottom: '36px', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div style={{
                width: '44px', height: '44px',
                background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #a5d6a7', boxShadow: '0 2px 8px rgba(46,125,50,0.12)', flexShrink: 0
              }}>
                <IconCloudSun size={22} color="#2e7d32" />
              </div>
              <div>
                <h1 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.8rem', fontWeight: '700',
                  color: '#1a3d1e', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1
                }}>RubberSense Weather</h1>
                <p style={{ color: '#5a7b5e', margin: '4px 0 0', fontSize: '0.9rem' }}>
                  Monitor weather conditions for optimal rubber tree cultivation.
                </p>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '28px' }}>
            {/* Large */}
            <div className="rs-stat-card" style={{ background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 60%, #43a047 100%)', boxShadow: '0 4px 20px rgba(46,125,50,0.28)', animationDelay: '0.05s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(46,125,50,0.38)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(46,125,50,0.28)'}
            >
              <div className="deco-a" /><div className="deco-b" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div className="icon-box"><IconTree size={20} color="rgba(255,255,255,0.9)" /></div>
                <span className="badge-pill">Large</span>
              </div>
              <div className="big-num">{stats.largeCount}</div>
              <div className="sub-label">Plantation Sites</div>
            </div>

            {/* Medium */}
            <div className="rs-stat-card" style={{ background: 'linear-gradient(135deg, #f57f17 0%, #f9a825 60%, #fbc02d 100%)', boxShadow: '0 4px 20px rgba(245,127,23,0.28)', animationDelay: '0.1s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,127,23,0.4)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,127,23,0.28)'}
            >
              <div className="deco-a" /><div className="deco-b" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div className="icon-box"><IconTree size={20} color="rgba(255,255,255,0.9)" /></div>
                <span className="badge-pill">Medium</span>
              </div>
              <div className="big-num">{stats.mediumCount}</div>
              <div className="sub-label">Plantation Sites</div>
            </div>

            {/* Small */}
            <div className="rs-stat-card" style={{ background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 60%, #e53935 100%)', boxShadow: '0 4px 20px rgba(198,40,40,0.25)', animationDelay: '0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(198,40,40,0.38)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(198,40,40,0.25)'}
            >
              <div className="deco-a" /><div className="deco-b" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div className="icon-box"><IconTree size={20} color="rgba(255,255,255,0.9)" /></div>
                <span className="badge-pill">Small</span>
              </div>
              <div className="big-num">{stats.smallCount}</div>
              <div className="sub-label">Plantation Sites</div>
            </div>
          </div>

          {/* ── Main Layout ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

            {/* Left: Weather Panel */}
            <div className="rs-panel">
              <div className="rs-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {viewMode === 'plantation'
                    ? <IconFactory size={18} color="#2e7d32" />
                    : <IconPin size={18} color="#2e7d32" />}
                  <span className="rs-section-label">
                    {viewMode === 'plantation' ? `${selectedPlantation?.name || ''}` : 'Your Location Weather'}
                  </span>
                  {weatherLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="rs-spinner" />
                      <span style={{ fontSize: '0.74rem', color: '#81c784', fontWeight: '600' }}>Loading</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select className="rs-type-select" value={selectedPlantationType} onChange={(e) => setSelectedPlantationType(e.target.value)}>
                    <option value="all">All Plantations</option>
                    <option value="large">Large Plantations</option>
                    <option value="medium">Medium Plantations</option>
                    <option value="small">Small Plantations</option>
                  </select>
                  <button className="rs-my-loc-btn" onClick={handleMyLocation}>
                    <IconPin size={14} color="white" /> My Location
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Date/Time */}
                <div className="rs-datetime-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <IconCalendar size={14} color="#5a7b5e" />
                    <span style={{ color: '#3a6b3e', fontSize: '0.85rem', fontWeight: '500' }}>{currentDate}</span>
                  </div>
                  <div style={{ width: '1px', height: '16px', background: '#c8e6c9', flexShrink: 0 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <IconClock size={14} color="#5a7b5e" />
                    <span style={{ color: '#3a6b3e', fontSize: '0.85rem', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{currentTime}</span>
                  </div>
                </div>

                {/* Location Error */}
                {locationError && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '13px 15px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px', animation: 'fadeUp 0.3s ease' }}>
                    <IconAlertTriangle size={16} color="#d97706" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#92400e', fontSize: '0.84rem', marginBottom: '2px' }}>Location Issue</div>
                      <div style={{ color: '#92400e', fontSize: '0.8rem' }}>{locationError}</div>
                    </div>
                    <button onClick={() => setLocationError(null)} style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <IconX size={16} color="#92400e" />
                    </button>
                  </div>
                )}

                {/* Current Weather */}
                {currentWeather ? (
                  <div style={{ animation: 'fadeUp 0.4s ease' }}>
                    {/* Hero Card */}
                    <div className="rs-weather-hero">
                      <div className="hero-deco-a" />
                      <div className="hero-deco-b" />
                      {/* Decorative tree silhouette */}
                      <div style={{ position: 'absolute', right: '20px', bottom: 0, opacity: 0.13, pointerEvents: 'none' }}>
                        <svg width="110" height="125" viewBox="0 0 110 125" fill="white">
                          <rect x="47" y="85" width="14" height="40" rx="4"/>
                          <ellipse cx="54" cy="80" rx="35" ry="24"/>
                          <ellipse cx="54" cy="58" rx="27" ry="20"/>
                          <ellipse cx="54" cy="37" rx="20" ry="16"/>
                          <ellipse cx="54" cy="19" rx="12" ry="11"/>
                        </svg>
                      </div>
                      <div style={{ position: 'absolute', right: '145px', bottom: 0, opacity: 0.07, pointerEvents: 'none' }}>
                        <svg width="55" height="78" viewBox="0 0 55 78" fill="white">
                          <rect x="23" y="52" width="8" height="26" rx="3"/>
                          <ellipse cx="27" cy="46" rx="19" ry="14"/>
                          <ellipse cx="27" cy="31" rx="14" ry="12"/>
                          <ellipse cx="27" cy="17" rx="9" ry="9"/>
                        </svg>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', position: 'relative' }}>
                        <div>
                          <div style={{ fontSize: '0.66rem', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: '10px', textTransform: 'uppercase' }}>
                            {currentWeather.isPlantation ? 'Plantation Weather' : 'Your Location Weather'}
                          </div>
                          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '4.8rem', fontWeight: '700', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                            {currentWeather.temp}°
                            <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.55)', fontWeight: '400' }}>C</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '12px' }}>
                            <WeatherIconFromEmoji icon={currentWeather.icon} size={18} color="rgba(255,255,255,0.85)" />
                            <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: '500', fontSize: '0.95rem' }}>{currentWeather.condition}</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconPin size={13} color="rgba(255,255,255,0.55)" />{currentWeather.location}
                          </div>
                        </div>
                        <div style={{ marginTop: '4px', opacity: 0.88 }}>
                          <WeatherIconFromEmoji icon={currentWeather.icon} size={56} color="rgba(255,255,255,0.85)" />
                        </div>
                      </div>
                    </div>

                    {/* Detail Chips */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      {[
                        { Icon: IconThermometer, value: `${currentWeather.feels_like}°C`, label: 'Feels Like', iconColor: '#ef5350' },
                        { Icon: IconDroplets, value: `${currentWeather.humidity}%`, label: 'Humidity', iconColor: '#42a5f5' },
                        { Icon: IconWind, value: `${currentWeather.wind}`, label: 'km/h Wind', iconColor: '#26a69a' }
                      ].map((chip, i) => (
                        <div key={i} className="rs-chip">
                          <chip.Icon size={16} color={chip.iconColor} />
                          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.3rem', fontWeight: '700', color: '#1a3d1e' }}>{chip.value}</span>
                          <span style={{ color: '#7a9e7e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{chip.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Plantation Info */}
                    {currentWeather.isPlantation && currentWeather.plantationInfo && (
                      <div style={{ background: '#f0f9f0', border: '1px solid #c8e6c9', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                          background: currentWeather.plantationInfo.type === 'large' ? '#e8f5e9' : currentWeather.plantationInfo.type === 'medium' ? '#fff8e1' : '#fce4ec',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {getPlantationTypeIcon(currentWeather.plantationInfo.type)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#2e7d32', fontSize: '0.9rem', marginBottom: '3px' }}>{currentWeather.plantationInfo.name}</div>
                          <span className="rs-badge" style={{
                            background: currentWeather.plantationInfo.type === 'large' ? '#e8f5e9' : currentWeather.plantationInfo.type === 'medium' ? '#fff8e1' : '#fce4ec',
                            color: currentWeather.plantationInfo.type === 'large' ? '#2e7d32' : currentWeather.plantationInfo.type === 'medium' ? '#f57f17' : '#c62828'
                          }}>
                            {currentWeather.plantationInfo.size}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 5-Day Forecast */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <IconCalendar size={15} color="#3a6b3e" />
                        <span className="rs-section-label" style={{ fontSize: '0.95rem' }}>5-Day Forecast</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {currentWeather.forecast && currentWeather.forecast.map((day, index) => (
                          <div key={index} className="rs-forecast-card">
                            <div className="fc-day" style={{ fontSize: '0.7rem', fontWeight: '700', color: '#7a9e7e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{day.day}</div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                              <WeatherIconFromEmoji icon={day.icon} size={22} color="#2e7d32" />
                            </div>
                            <div className="fc-temp" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: '700', color: '#1a3d1e' }}>{day.temp}°</div>
                            <div className="fc-cond" style={{ fontSize: '0.62rem', color: '#7a9e7e', margin: '3px 0', lineHeight: 1.3 }}>{day.condition}</div>
                            <div className="fc-low" style={{ fontSize: '0.7rem', color: '#aac8ac', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                              <IconArrowDown size={10} color="#aac8ac" />{day.low}°
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: '#7a9e7e', animation: 'fadeUp 0.4s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.4 }}>
                      <IconCloudSun size={52} color="#2e7d32" />
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: '600', color: '#3a6b3e', marginBottom: '8px' }}>
                      Loading Weather Data...
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      {locationError ? locationError : 'Fetching weather information...'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Plantations Sidebar */}
            <div className="rs-sidebar">
              <div className="rs-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconFactory size={16} color="#2e7d32" />
                  <span className="rs-section-label">Rubber Plantations</span>
                </div>
                <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: '1px solid #c8e6c9' }}>
                  {filteredPlantations.length}
                </span>
              </div>

              <div style={{ padding: '12px', maxHeight: '620px', overflowY: 'auto' }}>
                {filteredPlantations.map((plantation) => {
                  const isSelected = selectedPlantation?.id === plantation.id;
                  const isLoading = plantationLoading[plantation.id];
                  return (
                    <div
                      key={plantation.id}
                      className={`rs-plantation-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => loadPlantationWeather(plantation)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          background: plantation.type === 'large' ? '#e8f5e9' : plantation.type === 'medium' ? '#fff8e1' : '#fce4ec',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${plantation.type === 'large' ? '#c8e6c9' : plantation.type === 'medium' ? '#ffe082' : '#f48fb1'}`
                        }}>
                          {getPlantationTypeIcon(plantation.type)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a3d1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>
                            {plantation.name}
                          </div>
                          <span className="rs-badge" style={{
                            background: plantation.type === 'large' ? '#e8f5e9' : plantation.type === 'medium' ? '#fff8e1' : '#fce4ec',
                            color: plantation.type === 'large' ? '#2e7d32' : plantation.type === 'medium' ? '#f57f17' : '#c62828'
                          }}>
                            {plantation.size}
                          </span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: '8px' }}>
                        {isLoading
                          ? <div className="rs-spinner" style={{ width: '15px', height: '15px' }} />
                          : <IconArrowRight size={14} color={isSelected ? '#2e7d32' : '#c8d8c8'} />
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      <UserFooter />
    </>
  );
};

export default Weather;