// RubberSense/Web/src/Components/User/Weather.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

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
        color: dayWeather.color
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
    switch(type) {
      case 'large': return '🌳';
      case 'medium': return '🌳';
      case 'small': return '🌳';
      default: return '🌳';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Lora', Georgia, serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', border: '3px solid #e8f5e9',
            borderTop: '3px solid #2e7d32', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 20px'
          }} />
          <p style={{ color: '#2e7d32', fontWeight: '600', fontSize: '1rem', letterSpacing: '0.05em' }}>
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
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .weather-page { font-family: 'DM Sans', sans-serif; background: #ffffff; min-height: 100vh; }
        
        .stat-card {
          background: #ffffff;
          border: 1px solid #e8f5e9;
          border-radius: 16px;
          padding: 24px 20px;
          display: flex; flex-direction: column; align-items: flex-start;
          transition: all 0.25s ease;
          box-shadow: 0 1px 4px rgba(46,125,50,0.06);
          animation: fadeIn 0.4s ease both;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(46,125,50,0.1);
          border-color: #a5d6a7;
        }

        .plantation-item {
          background: #ffffff;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .plantation-item:hover {
          border-color: #a5d6a7;
          background: #f9fdf9;
          transform: translateX(2px);
          box-shadow: 0 2px 8px rgba(46,125,50,0.08);
        }
        .plantation-item.selected {
          border-color: #2e7d32;
          background: #f1f8e9;
          box-shadow: 0 2px 12px rgba(46,125,50,0.12);
        }

        .forecast-card {
          background: #ffffff;
          border: 1px solid #e8f5e9;
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
          transition: all 0.2s ease;
          flex: 1;
        }
        .forecast-card:hover {
          border-color: #81c784;
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(46,125,50,0.1);
        }

        .my-location-btn {
          background: #2e7d32;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex; align-items: center; gap: 6px;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .my-location-btn:hover {
          background: #1b5e20;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(46,125,50,0.25);
        }

        .type-select {
          background: #f9fdf9;
          color: #2e7d32;
          border: 1.5px solid #c8e6c9;
          padding: 10px 16px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          cursor: pointer;
          outline: none;
          font-weight: 500;
          transition: border-color 0.2s;
        }
        .type-select:hover, .type-select:focus { border-color: #2e7d32; }

        .weather-detail-chip {
          background: #f9fdf9;
          border: 1px solid #e8f5e9;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex; flex-direction: column; align-items: center;
          gap: 4px;
          flex: 1;
        }

        .loading-indicator {
          width: 18px; height: 18px;
          border: 2px solid #e8f5e9;
          border-top-color: #2e7d32;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .section-title {
          font-family: 'Lora', Georgia, serif;
          font-weight: 600;
          color: #1b3a1d;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
        }

        .badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e8f5e9, transparent); margin: 4px 0; }
      `}</style>

      <div className="weather-page">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 48px' }}>

          {/* Page Header */}
          <div style={{ marginBottom: '32px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', border: '1px solid #a5d6a7'
              }}>🌤️</div>
              <h1 style={{
                fontFamily: 'Lora, Georgia, serif', fontSize: '1.75rem', fontWeight: '700',
                color: '#1b3a1d', margin: 0, letterSpacing: '-0.02em'
              }}>RubberSense Weather</h1>
            </div>
            <p style={{ color: '#5a7b5e', margin: 0, fontSize: '0.95rem', paddingLeft: '52px' }}>
              Monitor weather conditions for optimal rubber tree cultivation.
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            {/* Large - Green */}
            <div style={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 60%, #43a047 100%)',
              borderRadius: '18px', padding: '24px 22px',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(46,125,50,0.25)',
              animation: 'fadeIn 0.4s ease 0.05s both',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 10px 30px rgba(46,125,50,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(46,125,50,0.25)'; }}
            >
              <div style={{ position:'absolute', top:'-18px', right:'-18px', width:'90px', height:'90px', background:'rgba(255,255,255,0.08)', borderRadius:'50%' }} />
              <div style={{ position:'absolute', bottom:'-24px', left:'-10px', width:'70px', height:'70px', background:'rgba(255,255,255,0.05)', borderRadius:'50%' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', position:'relative' }}>
                <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'10px', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>🌳</div>
                <span style={{ background:'rgba(255,255,255,0.25)', color:'#fff', fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', padding:'3px 10px', borderRadius:'20px', textTransform:'uppercase' }}>Large</span>
              </div>
              <div style={{ fontFamily:'Lora, Georgia, serif', fontSize:'3rem', fontWeight:'700', color:'#ffffff', lineHeight:1, position:'relative' }}>{stats.largeCount}</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.8rem', marginTop:'6px', fontWeight:'500', position:'relative' }}>Plantation Sites</div>
            </div>

            {/* Medium - Yellow/Amber */}
            <div style={{
              background: 'linear-gradient(135deg, #f57f17 0%, #f9a825 60%, #fbc02d 100%)',
              borderRadius: '18px', padding: '24px 22px',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(245,127,23,0.28)',
              animation: 'fadeIn 0.4s ease 0.1s both',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 10px 30px rgba(245,127,23,0.38)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(245,127,23,0.28)'; }}
            >
              <div style={{ position:'absolute', top:'-18px', right:'-18px', width:'90px', height:'90px', background:'rgba(255,255,255,0.08)', borderRadius:'50%' }} />
              <div style={{ position:'absolute', bottom:'-24px', left:'-10px', width:'70px', height:'70px', background:'rgba(255,255,255,0.05)', borderRadius:'50%' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', position:'relative' }}>
                <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'10px', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>🌳</div>
                <span style={{ background:'rgba(255,255,255,0.25)', color:'#fff', fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', padding:'3px 10px', borderRadius:'20px', textTransform:'uppercase' }}>Medium</span>
              </div>
              <div style={{ fontFamily:'Lora, Georgia, serif', fontSize:'3rem', fontWeight:'700', color:'#ffffff', lineHeight:1, position:'relative' }}>{stats.mediumCount}</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.8rem', marginTop:'6px', fontWeight:'500', position:'relative' }}>Plantation Sites</div>
            </div>

            {/* Small - Red */}
            <div style={{
              background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 60%, #e53935 100%)',
              borderRadius: '18px', padding: '24px 22px',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(198,40,40,0.25)',
              animation: 'fadeIn 0.4s ease 0.15s both',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 10px 30px rgba(198,40,40,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(198,40,40,0.25)'; }}
            >
              <div style={{ position:'absolute', top:'-18px', right:'-18px', width:'90px', height:'90px', background:'rgba(255,255,255,0.08)', borderRadius:'50%' }} />
              <div style={{ position:'absolute', bottom:'-24px', left:'-10px', width:'70px', height:'70px', background:'rgba(255,255,255,0.05)', borderRadius:'50%' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', position:'relative' }}>
                <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'10px', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>🌳</div>
                <span style={{ background:'rgba(255,255,255,0.25)', color:'#fff', fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.1em', padding:'3px 10px', borderRadius:'20px', textTransform:'uppercase' }}>Small</span>
              </div>
              <div style={{ fontFamily:'Lora, Georgia, serif', fontSize:'3rem', fontWeight:'700', color:'#ffffff', lineHeight:1, position:'relative' }}>{stats.smallCount}</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.8rem', marginTop:'6px', fontWeight:'500', position:'relative' }}>Plantation Sites</div>
            </div>
          </div>

          {/* Main Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

            {/* Left: Weather Panel */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8f5e9',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(46,125,50,0.06)',
              animation: 'fadeIn 0.5s ease 0.1s both'
            }}>
              {/* Panel Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f0f7f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{viewMode === 'plantation' ? '🏭' : '📍'}</span>
                  <span className="section-title">
                    {viewMode === 'plantation' ? `${selectedPlantation?.name || ''}` : 'Your Location Weather'}
                  </span>
                  {weatherLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="loading-indicator" />
                      <span style={{ fontSize: '0.75rem', color: '#81c784', fontWeight: '500' }}>Loading</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    className="type-select"
                    value={selectedPlantationType}
                    onChange={(e) => setSelectedPlantationType(e.target.value)}
                  >
                    <option value="all">All Plantations</option>
                    <option value="large">Large Plantations</option>
                    <option value="medium">Medium Plantations</option>
                    <option value="small">Small Plantations</option>
                  </select>
                  <button className="my-location-btn" onClick={handleMyLocation}>
                    📍 My Location
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Date & Time */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  padding: '14px 18px',
                  background: '#f9fdf9', borderRadius: '12px',
                  border: '1px solid #e8f5e9', marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem' }}></span>
                    <span style={{ color: '#3a6b3e', fontSize: '0.875rem', fontWeight: '500' }}>{currentDate}</span>
                  </div>
                  <div style={{ width: '1px', height: '18px', background: '#c8e6c9' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem' }}></span>
                    <span style={{ color: '#3a6b3e', fontSize: '0.875rem', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{currentTime}</span>
                  </div>
                </div>

                {/* Location Error */}
                {locationError && (
                  <div style={{
                    background: '#fff8e1', border: '1px solid #ffe082',
                    borderRadius: '12px', padding: '14px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    marginBottom: '20px'
                  }}>
                    <span style={{ fontSize: '1rem' }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#856404', fontSize: '0.85rem', marginBottom: '2px' }}>Location Issue</div>
                      <div style={{ color: '#856404', fontSize: '0.82rem' }}>{locationError}</div>
                    </div>
                    <button
                      onClick={() => setLocationError(null)}
                      style={{ background: 'none', border: 'none', color: '#856404', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0' }}
                    >×</button>
                  </div>
                )}

                {/* Current Weather */}
                {currentWeather ? (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    {/* Main Card */}
                    <div style={{
                      background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 40%, #388e3c 100%)',
                      borderRadius: '20px',
                      padding: '28px',
                      marginBottom: '20px',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: '160px'
                    }}>
                      {/* Decorative background circles */}
                      <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'150px', height:'150px', background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
                      <div style={{ position:'absolute', bottom:'-20px', left:'30%', width:'100px', height:'100px', background:'rgba(255,255,255,0.04)', borderRadius:'50%' }} />

                      {/* SVG Rubber Tree - main large */}
                      <div style={{ position:'absolute', right:'24px', bottom:'0', opacity:0.18, pointerEvents:'none' }}>
                        <svg width="120" height="130" viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="52" y="90" width="16" height="40" rx="4" fill="#ffffff"/>
                          <ellipse cx="60" cy="85" rx="38" ry="26" fill="#ffffff"/>
                          <ellipse cx="60" cy="62" rx="30" ry="22" fill="#ffffff"/>
                          <ellipse cx="60" cy="40" rx="22" ry="18" fill="#ffffff"/>
                          <ellipse cx="60" cy="22" rx="13" ry="12" fill="#ffffff"/>
                        </svg>
                      </div>

                      {/* SVG Rubber Tree - smaller accent */}
                      <div style={{ position:'absolute', right:'155px', bottom:'0', opacity:0.09, pointerEvents:'none' }}>
                        <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="26" y="55" width="8" height="25" rx="3" fill="#ffffff"/>
                          <ellipse cx="30" cy="50" rx="20" ry="15" fill="#ffffff"/>
                          <ellipse cx="30" cy="34" rx="15" ry="13" fill="#ffffff"/>
                          <ellipse cx="30" cy="18" rx="10" ry="10" fill="#ffffff"/>
                        </svg>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', position: 'relative' }}>
                        <div>
                          <div style={{
                            fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em',
                            color: 'rgba(255,255,255,0.7)',
                            marginBottom: '10px', textTransform: 'uppercase'
                          }}>
                            {currentWeather.isPlantation ? 'Plantation Weather' : 'Your Location Weather'}
                          </div>
                          <div style={{
                            fontFamily: "'Lora', Georgia, serif", fontSize: '4.5rem', fontWeight: '700',
                            color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em'
                          }}>
                            {currentWeather.temp}°<span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.65)' }}>C</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                            <span style={{ fontSize: '1.1rem' }}>{currentWeather.icon}</span>
                            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '500', fontSize: '0.95rem' }}>{currentWeather.condition}</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>📍</span>
                            <span>{currentWeather.location}</span>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '3.5rem', lineHeight: 1,
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                          marginTop: '4px'
                        }}>
                          {currentWeather.icon}
                        </div>
                      </div>
                    </div>

                    {/* Detail Chips */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                      {[
                        { icon: '', value: `${currentWeather.feels_like}°C`, label: 'Feels Like' },
                        { icon: '', value: `${currentWeather.humidity}%`, label: 'Humidity' },
                        { icon: '', value: `${currentWeather.wind}`, label: 'km/h Wind' }
                      ].map((chip, i) => (
                        <div key={i} className="weather-detail-chip">
                          <span style={{ fontSize: '1.1rem' }}>{chip.icon}</span>
                          <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '1.3rem', fontWeight: '700', color: '#1b3a1d' }}>{chip.value}</span>
                          <span style={{ color: '#7a9e7e', fontSize: '0.72rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{chip.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Plantation Info Badge */}
                    {currentWeather.isPlantation && currentWeather.plantationInfo && (
                      <div style={{
                        background: '#f1f8e9', border: '1px solid #c8e6c9',
                        borderRadius: '12px', padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: '24px'
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>{getPlantationTypeIcon(currentWeather.plantationInfo.type)}</span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#2e7d32', fontSize: '0.9rem' }}>{currentWeather.plantationInfo.name}</div>
                          <div>
                            <span className="badge" style={{
                              background: currentWeather.plantationInfo.type === 'large' ? '#e8f5e9' :
                                         currentWeather.plantationInfo.type === 'medium' ? '#fff8e1' : '#fce4ec',
                              color: currentWeather.plantationInfo.type === 'large' ? '#2e7d32' :
                                     currentWeather.plantationInfo.type === 'medium' ? '#f57f17' : '#c62828'
                            }}>
                              {currentWeather.plantationInfo.size}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5-Day Forecast */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '0.9rem' }}>📅</span>
                        <span className="section-title" style={{ fontSize: '0.95rem' }}>5-Day Forecast</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {currentWeather.forecast && currentWeather.forecast.map((day, index) => (
                          <div key={index} className="forecast-card" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#7a9e7e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                              {day.day}
                            </div>
                            <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{day.icon}</div>
                            <div style={{ fontFamily: 'Lora, serif', fontSize: '1.2rem', fontWeight: '700', color: '#1b3a1d' }}>
                              {day.temp}°
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#7a9e7e', margin: '4px 0', lineHeight: 1.3 }}>{day.condition}</div>
                            <div style={{ fontSize: '0.72rem', color: '#a5c8a8', fontWeight: '500' }}>↓ {day.low}°</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '60px 20px', textAlign: 'center',
                    color: '#7a9e7e', animation: 'fadeIn 0.4s ease'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>🌤️</div>
                    <div style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: '600', color: '#3a6b3e', marginBottom: '8px' }}>
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
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8f5e9',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(46,125,50,0.06)',
              animation: 'fadeIn 0.5s ease 0.15s both'
            }}>
              <div style={{
                padding: '18px 20px',
                borderBottom: '1px solid #f0f7f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🏭</span>
                  <span className="section-title">Rubber Plantations</span>
                </div>
                <span style={{
                  background: '#e8f5e9', color: '#2e7d32',
                  fontSize: '0.75rem', fontWeight: '700',
                  padding: '3px 10px', borderRadius: '20px'
                }}>
                  {filteredPlantations.length}
                </span>
              </div>

              <div style={{ padding: '14px', maxHeight: '620px', overflowY: 'auto' }}>
                {filteredPlantations.map((plantation) => {
                  const isSelected = selectedPlantation?.id === plantation.id;
                  const isLoading = plantationLoading[plantation.id];
                  return (
                    <div
                      key={plantation.id}
                      className={`plantation-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => loadPlantationWeather(plantation)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '32px', height: '32px',
                          borderRadius: '8px',
                          background: plantation.type === 'large' ? '#e8f5e9' :
                                     plantation.type === 'medium' ? '#fff8e1' : '#fce4ec',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', flexShrink: 0
                        }}>
                          {getPlantationTypeIcon(plantation.type)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.82rem', fontWeight: '600', color: '#1b3a1d',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {plantation.name}
                          </div>
                          <span className="badge" style={{
                            background: plantation.type === 'large' ? '#e8f5e9' :
                                       plantation.type === 'medium' ? '#fff8e1' : '#fce4ec',
                            color: plantation.type === 'large' ? '#2e7d32' :
                                   plantation.type === 'medium' ? '#f57f17' : '#c62828'
                          }}>
                            {plantation.size}
                          </span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: '8px' }}>
                        {isLoading ? (
                          <div className="loading-indicator" style={{ width: '16px', height: '16px' }} />
                        ) : (
                          <span style={{
                            color: isSelected ? '#2e7d32' : '#b0c4b1',
                            fontSize: '1rem', fontWeight: '700',
                            transition: 'color 0.2s'
                          }}>→</span>
                        )}
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