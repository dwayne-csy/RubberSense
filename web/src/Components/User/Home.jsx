import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
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
  const messagesEndRef = useRef(null);
  const slideIntervalRef = useRef(null);
  const mapIframeRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const slides = [
    {
      id: 1,
      image: '/src/Components/slidingpics/slide1.jpg',
      alt: 'Rubber Tree Plantation',
      title: 'Efficient Tree Tapping Operations',
      description: 'Professional latex extraction with modern technology'
    },
    {
      id: 2,
      image: '/src/Components/slidingpics/slide2.jpg',
      alt: 'Latex Collection',
      title: 'Premium Latex Collection',
      description: 'High-quality latex from healthy rubber trees'
    },
    {
      id: 3,
      image: '/src/Components/slidingpics/slide4.jpg',
      alt: 'Plantation Management',
      title: 'Smart Plantation Management',
      description: 'Advanced monitoring for optimal growth conditions'
    },
    {
      id: 4,
      image: '/src/Components/slidingpics/slide5.jpg',
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

  // Auto slide functionality
  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [slides.length]);

  // Update current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Format date
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
      
      // Format time
      const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      };
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
    };

    updateDateTime();
    const timeInterval = setInterval(updateDateTime, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Enhanced OpenStreetMap address parsing
  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      // Use higher zoom level for more detailed results
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          },
          timeout: 5000
        }
      );

      const data = response.data;
      const address = data.address || {};
      const displayName = data.display_name || '';

      // Extract location components
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

      // Create a formatted address string
      let formattedAddress = '';
      const parts = [];

      // Add address components in hierarchical order
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

      formattedAddress = parts.filter(Boolean).join(', ');

      return {
        fullAddress: formattedAddress || displayName || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: displayName,
        components: locationComponents,
        rawData: data,
        source: 'OpenStreetMap',
        coordinates: {
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          full: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }
      };

    } catch (error) {
      console.error('OpenStreetMap error:', error);
      return {
        fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: null,
        components: null,
        rawData: null,
        source: 'GPS coordinates only',
        coordinates: {
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          full: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        },
        error: 'Failed to fetch from OpenStreetMap'
      };
    }
  };

  // Get weather data
  const fetchWeatherData = async (lat, lng, accuracy = null) => {
    try {
      // Using Open-Meteo API for weather data
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );

      const weatherData = weatherResponse.data;
      
      // Map weather codes to icons and conditions
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

      // Get address from OpenStreetMap
      const locationInfo = await getOpenStreetMapAddress(lat, lng);
      
      setLocationAddress(locationInfo.fullAddress);
      setDetailedLocation(locationInfo);

      // Create display location
      let displayLocation = 'Your Location';
      const components = locationInfo.components;
      
      if (components) {
        if (components.suburb) {
          displayLocation = components.suburb;
        } else if (components.village) {
          displayLocation = components.village;
        } else if (components.city) {
          displayLocation = components.city;
        } else if (components.state) {
          displayLocation = components.state;
        }
      }

      // Set current weather
      setWeather({
        temp: Math.round(weatherData.current.temperature_2m),
        condition: currentWeather.condition,
        humidity: Math.round(weatherData.current.relative_humidity_2m),
        wind: Math.round(weatherData.current.wind_speed_10m),
        location: displayLocation,
        icon: currentWeather.icon,
        feels_like: Math.round(weatherData.current.temperature_2m + 2),
        accuracy: accuracy,
        coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        source: locationInfo.source
      });

      // Set forecast for next 5 days
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
      // Fallback with coordinates only
      setWeather({
        temp: 28,
        condition: 'Partly Cloudy',
        humidity: 75,
        wind: 12,
        location: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        icon: '🌤️',
        feels_like: 30,
        accuracy: accuracy,
        coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        source: 'GPS coordinates only'
      });
      
      const fallbackForecast = [
        { day: 'Mon', temp: 29, icon: '☀️', condition: 'Sunny', low: 24 },
        { day: 'Tue', temp: 27, icon: '⛅', condition: 'Partly Cloudy', low: 23 },
        { day: 'Wed', temp: 25, icon: '🌧️', condition: 'Rain', low: 22 },
        { day: 'Thu', temp: 26, icon: '⛅', condition: 'Partly Cloudy', low: 23 },
        { day: 'Fri', temp: 30, icon: '☀️', condition: 'Sunny', low: 25 }
      ];
      setForecast(fallbackForecast);
      setWeatherLoading(false);
    }
  };

  // Check if geolocation is available and permission is granted
  const checkGeolocationPermission = async () => {
    if (!navigator.geolocation) {
      return { available: false, error: 'Geolocation not supported by your browser' };
    }

    // Try to get position to check permission
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          resolve({ available: true, error: null });
        },
        (error) => {
          let errorMessage = 'Location permission denied';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'Unknown location error';
          }
          resolve({ available: false, error: errorMessage });
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: Infinity
        }
      );
    });
  };

  // Get user's location
  useEffect(() => {
    if (loading) return;

    const initializeLocation = async () => {
      setMapLoading(true);
      
      // Check geolocation permission first
      const geolocationStatus = await checkGeolocationPermission();
      
      if (geolocationStatus.available) {
        // Try to get precise location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`GPS Coordinates: ${latitude}, ${longitude}`);
            console.log(`GPS Accuracy: ${accuracy} meters`);

            setGpsAccuracy(accuracy);
            setUserLocation({ lat: latitude, lng: longitude });
            setLocationError(null);

            // Fetch weather and location data
            await fetchWeatherData(latitude, longitude, accuracy);
            setMapLoading(false);
          },
          async (error) => {
            console.error('Precise geolocation error:', error);
            setLocationError('Could not get your location. Please check your browser settings.');
            setMapLoading(false);
            setWeatherLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        // Geolocation not available or permission denied
        console.log('Geolocation status:', geolocationStatus);
        setLocationError(geolocationStatus.error || 'Location services unavailable.');
        setMapLoading(false);
        setWeatherLoading(false);
      }
    };

    initializeLocation();
  }, [loading]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Handle slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  // Function to go to user location on map
  const goToMyLocation = () => {
    if (userLocation) {
      const zoom = 17;
      const lat = userLocation.lat;
      const lng = userLocation.lng;
      const bboxSize = 0.002;
      
      const iframe = document.querySelector('iframe[title="OpenStreetMap"]');
      if (iframe) {
        iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bboxSize},${lat - bboxSize},${lng + bboxSize},${lat + bboxSize}&layer=mapnik&marker=${lat},${lng}&center=${lat},${lng}`;
      }
      
      // Show notification
      const toast = document.createElement('div');
      toast.textContent = '📍 Map centered on your location';
      toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        animation: fadeInOut 2s ease-in-out;
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  // Handle Learn More button click
  const handleLearnMore = () => {
    navigate('/about');
  };

  // NEW: Navigate to Maps page
  const navigateToMaps = () => {
    navigate('/maps');
  };

  // FIXED: Parse Puter AI response properly
  const parsePuterAIResponse = (response) => {
    console.log('parsePuterAIResponse input:', response);
    console.log('Type of response:', typeof response);
    
    // If response is a string, try to parse it as JSON
    if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        console.log('Parsed string to JSON:', parsed);
        
        // Check for Puter AI structure
        if (parsed.message && parsed.message.content) {
          return parsed.message.content;
        }
        
        // Check for direct content
        if (parsed.content) {
          return parsed.content;
        }
        
        // If we can't find content, return the string
        return response;
      } catch (e) {
        console.log('Failed to parse as JSON, treating as plain string');
        return response;
      }
    }
    
    // If response is an object
    if (typeof response === 'object' && response !== null) {
      // Check for Puter AI structure
      if (response.message && response.message.content && typeof response.message.content === 'string') {
        return response.message.content;
      }
      
      // Check for direct content
      if (response.content && typeof response.content === 'string') {
        return response.content;
      }
      
      // If we can't extract content, stringify the object
      try {
        const jsonString = JSON.stringify(response);
        // Try to extract content from stringified JSON
        const contentMatch = jsonString.match(/"content"\s*:\s*"([^"]+)"/);
        if (contentMatch && contentMatch[1]) {
          let content = contentMatch[1];
          // Unescape special characters
          content = content.replace(/\\n/g, '\n')
                           .replace(/\\"/g, '"')
                           .replace(/\\\\/g, '\\')
                           .replace(/\\t/g, '\t')
                           .replace(/\\r/g, '\r');
          return content;
        }
      } catch (e) {
        console.error('Error stringifying response:', e);
      }
    }
    
    // Fallback: return as string
    return String(response || 'No response received');
  };

  // FIXED: Handle chat submit with proper error handling
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setChatLoading(true);

    try {
      if (window.puter && window.puter.ai && window.puter.ai.chat) {
        console.log('Sending message to Puter AI:', userMessage);
        const response = await window.puter.ai.chat(userMessage, {
          model: 'gpt-5-nano',
        });
        
        console.log('Raw response from Puter AI:', response);
        console.log('Response type:', typeof response);
        
        // Parse the response to extract the text content
        const botResponse = parsePuterAIResponse(response);
        
        console.log('Parsed bot response:', botResponse);
        
        // Ensure we're only adding strings to chatMessages
        if (typeof botResponse === 'string') {
          // Clean up the response
          const cleanedResponse = botResponse
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .trim();
          
          setChatMessages(prev => [...prev, { text: cleanedResponse, sender: 'bot' }]);
        } else {
          console.error('Unexpected response type:', typeof botResponse, botResponse);
          setChatMessages(prev => [...prev, { 
            text: "I received an unexpected response format. Please try again.", 
            sender: 'bot' 
          }]);
        }
      } else {
        console.log('Puter AI not available, using simulated chat');
        await simulateAIChat(userMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        text: "Sorry, I encountered an error. Please try again.", 
        sender: 'bot' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const simulateAIChat = async (message) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responses = [
      "I'm RubberSense AI! I can help with questions about rubber trees, general knowledge, coding, and much more. What would you like to know?",
      "That's an interesting question! As an AI assistant, I'm here to help you with various topics. Feel free to ask me anything!",
      "Thanks for your question! I'm designed to assist with a wide range of topics. How can I help you today?",
      "I'm here to answer your questions! Whether it's about rubber tree cultivation, technology, science, or general knowledge, I'm ready to help.",
      "Hello! I'm your AI assistant. I can help with questions, explanations, brainstorming, and more. What's on your mind?"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    setChatMessages(prev => [...prev, { text: randomResponse, sender: 'bot' }]);
  };

  // Clear chat history
  const clearChat = () => {
    setChatMessages([]);
  };

  // Refresh location manually
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
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError(geolocationStatus.error || 'Location permission still denied.');
      setMapLoading(false);
      setWeatherLoading(false);
    }
  };

  // Render location details in OpenStreetMap format
  const renderOpenStreetMapLocation = () => {
    if (!detailedLocation || !detailedLocation.components) return null;

    const components = detailedLocation.components;
    
    // Create location breakdown similar to OpenStreetMap
    const locationBreakdown = [];

    // Add components in hierarchical order
    if (components.house) locationBreakdown.push({ label: 'House', value: components.house });
    if (components.building) locationBreakdown.push({ label: 'Building', value: components.building });
    if (components.block) locationBreakdown.push({ label: 'Block', value: components.block });
    if (components.road) locationBreakdown.push({ label: 'Road', value: components.road });
    if (components.neighbourhood) locationBreakdown.push({ label: 'Neighbourhood', value: components.neighbourhood });
    if (components.quarter) locationBreakdown.push({ label: 'Barangay', value: components.quarter });
    if (components.suburb) locationBreakdown.push({ label: 'Suburb', value: components.suburb });
    if (components.city_district) locationBreakdown.push({ label: 'City District', value: components.city_district });
    if (components.village) locationBreakdown.push({ label: 'Village', value: components.village });
    if (components.town) locationBreakdown.push({ label: 'Town', value: components.town });
    if (components.city) locationBreakdown.push({ label: 'City', value: components.city });
    if (components.county) locationBreakdown.push({ label: 'County', value: components.county });
    if (components.state_district) locationBreakdown.push({ label: 'State District', value: components.state_district });
    if (components.state) locationBreakdown.push({ label: 'State', value: components.state });
    if (components.country) locationBreakdown.push({ label: 'Country', value: components.country });
    if (components.country_code) locationBreakdown.push({ label: 'Country Code', value: components.country_code });
    if (components.postcode) locationBreakdown.push({ label: 'Postcode', value: components.postcode });

    if (locationBreakdown.length === 0) return null;

    return (
      <div style={{
        marginTop: '20px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}>
        {/* Location Header */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.15)',
          padding: '12px 15px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#3B82F6',
          fontWeight: 'bold'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🗺️</span>
          <span>OpenStreetMap Location Details</span>
        </div>

        {/* Location Details Grid */}
        <div style={{
          padding: '15px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {locationBreakdown.map((item, idx) => (
            <div key={idx} style={{
              padding: '10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {item.label}
              </div>
              <div style={{
                fontWeight: 'bold',
                color: 'white',
                fontSize: '0.95rem',
                wordBreak: 'break-word'
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Map Data Footer */}
        <div style={{
          background: 'rgba(0,0,0,0.1)',
          padding: '10px 15px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>📍</span>
            <span>Source: {detailedLocation.source}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>🌐</span>
            <span>OpenStreetMap</span>
          </div>
        </div>
      </div>
    );
  };

  // Render GPS Coordinates section
  const renderGPSCoordinates = () => {
    if (!userLocation) return null;

    return (
      <div style={{
        marginTop: '15px',
        padding: '15px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          color: '#4CAF50'
        }}>
          <span style={{ fontSize: '1.2rem' }}>📡</span>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
            GPS Coordinates
          </span>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{
            flex: 1,
            minWidth: '200px'
          }}>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: 'monospace',
              marginBottom: '5px'
            }}>
              {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span>🎯</span>
              <span>Accuracy: {gpsAccuracy ? `${Math.round(gpsAccuracy)} meters` : 'Calculating...'}</span>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`);
              const toast = document.createElement('div');
              toast.textContent = 'Coordinates copied to clipboard!';
              toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                z-index: 10000;
                font-size: 14px;
                animation: fadeInOut 2s ease-in-out;
              `;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 2000);
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            📋 Copy Coordinates
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh', 
        background: '#667eea' 
      }}>
        <p style={{ 
          textAlign: 'center', 
          color: 'white',
          fontSize: '18px' 
        }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#667eea',
      position: 'relative',
      paddingTop: '64px'
    }}>
      {/* User Header Component - Fixed at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 2000
      }}>
        <UserHeader />
      </div>
      
      {/* Full Screen Image Carousel */}
      <div style={{
        position: 'relative',
        height: 'calc(100vh - 64px)',
        width: '100%',
        marginTop: 0
      }}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7)'
            }} />
            
            <div style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              color: 'white',
              padding: '40px',
              maxWidth: '800px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'fadeIn 1s ease-out'
            }}>
              <h2 style={{
                fontSize: '3.5rem',
                marginBottom: '20px',
                textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
                fontWeight: 'bold'
              }}>
                {slide.title}
              </h2>
              <p style={{
                fontSize: '1.5rem',
                marginBottom: '30px',
                opacity: 0.9
              }}>
                {slide.description}
              </p>
              <button
                onClick={handleLearnMore}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  padding: '15px 40px',
                  borderRadius: '30px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '15px',
          zIndex: 10
        }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentSlide ? '#4CAF50' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'background 0.3s, transform 0.3s',
                transform: index === currentSlide ? 'scale(1.2)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (index !== currentSlide) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentSlide) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Below Carousel */}
      <div style={{
        background: '#667eea',
        padding: '40px 20px'
      }}>
        {/* Welcome Section */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 40px',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            color: 'white', 
            marginBottom: '20px',
            fontSize: '2.2rem',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Welcome to RubberSense
          </h2>
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            lineHeight: '1.8',
            fontSize: '1.2rem',
            marginBottom: '30px',
            textAlign: 'center',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Your intelligent assistant for rubber tree analysis and cultivation insights.
            Monitor weather conditions, track plantation locations, and optimize your rubber farming operations.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🌿 Latex Detection
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🌳 Trunk Analysis
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🤖 AI Assistant
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🌤️ Weather Monitoring
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Weather and Maps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Weather Card */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ 
                color: 'white', 
                fontSize: '1.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🌤️ Current Weather
                {weatherLoading && (
                  <span style={{
                    fontSize: '0.9rem',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    Loading...
                  </span>
                )}
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={refreshLocation}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            
            {/* Date and Time */}
            <div style={{
              marginBottom: '25px',
              padding: '15px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '1rem',
                marginBottom: '5px' 
              }}>
                📅 {currentDate}
              </div>
              <div style={{ 
                color: '#4CAF50', 
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                🕒 {currentTime}
              </div>
            </div>
            
            {weather && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '25px'
                }}>
                  <div>
                    <div style={{ fontSize: '3.5rem', color: 'white', fontWeight: 'bold' }}>
                      {weather.temp}°C
                    </div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      fontSize: '1.3rem', 
                      marginTop: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {weather.condition}
                      <span style={{ 
                        fontSize: '0.9rem', 
                        color: 'rgba(255,255,255,0.7)',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        Feels like {weather.feels_like}°C
                      </span>
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '1rem',
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      📍 {weather.location}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '4rem',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    animation: 'pulse 2s infinite'
                  }}>
                    {weather.icon}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '30px',
                  marginBottom: '30px',
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '15px',
                    borderRadius: '12px',
                    flex: 1,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '5px' }}>Humidity</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4CAF50' }}>{weather.humidity}%</div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '15px',
                    borderRadius: '12px',
                    flex: 1,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '5px' }}>Wind Speed</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4CAF50' }}>{weather.wind} km/h</div>
                  </div>
                </div>

                {/* 5-Day Forecast */}
                <div>
                  <h3 style={{ 
                    color: 'white', 
                    marginBottom: '20px',
                    fontSize: '1.3rem',
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📅 5-Day Forecast
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    {forecast.map((day, index) => (
                      <div key={index} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '15px',
                        textAlign: 'center',
                        flex: 1,
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ 
                          color: 'white', 
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          marginBottom: '10px'
                        }}>
                          {day.day}
                        </div>
                        <div style={{ 
                          fontSize: '1.8rem', 
                          margin: '10px 0',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}>
                          {day.icon}
                        </div>
                        <div style={{ 
                          color: '#4CAF50', 
                          fontWeight: 'bold',
                          fontSize: '1.5rem',
                          marginBottom: '5px'
                        }}>
                          {day.temp}°
                        </div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.7)', 
                          fontSize: '0.9rem',
                          marginBottom: '5px'
                        }}>
                          {day.condition}
                        </div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.5)', 
                          fontSize: '0.8rem'
                        }}>
                          Low: {day.low}°
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Card - Clickable to navigate to Maps page */}
          <div 
            onClick={navigateToMaps}
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '30px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)';
              e.currentTarget.style.borderColor = 'rgba(76, 175, 80, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            {/* Click to View Full Map Label */}
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'rgba(76, 175, 80, 0.8)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              zIndex: 5,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <span>↗</span>
              <span>Click to View Full Map</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{
                color: 'white',
                fontSize: '1.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🗺️ Your Location
                {mapLoading && (
                  <span style={{
                    fontSize: '0.9rem',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    Detecting...
                  </span>
                )}
              </h2>
            </div>

            {/* Location Error Alert */}
            {locationError && (
              <div style={{
                background: 'rgba(255,152,0,0.15)',
                border: '1px solid rgba(255,152,0,0.3)',
                color: '#ff9800',
                padding: '12px 15px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <strong>Location Issue:</strong> {locationError}
                  <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.8 }}>
                    Please enable location access in your browser settings
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent click
                    setLocationError(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff9800',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div style={{
              height: '350px',
              borderRadius: '15px',
              overflow: 'hidden',
              background: '#2c3e50',
              position: 'relative',
              marginBottom: '20px',
              border: '2px solid rgba(255,255,255,0.1)'
            }}>
              {userLocation ? (
                <iframe
                  ref={mapIframeRef}
                  title="OpenStreetMap"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.005},${userLocation.lat - 0.005},${userLocation.lng + 0.005},${userLocation.lat + 0.005}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}&center=${userLocation.lat},${userLocation.lng}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  loading="lazy"
                />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📍</div>
                    <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Location Access Required</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      Please allow location access for accurate weather and mapping
                    </div>
                  </div>
                </div>
              )}

              {/* Go to My Location Button */}
              {userLocation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent click
                    goToMyLocation();
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#333',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s, background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                  }}
                  title="Go to my location"
                >
                  ↗
                </button>
              )}
            </div>

            {/* Location Information - OpenStreetMap Style */}
            <div style={{
              color: 'white'
            }}>
              {/* Main Address Display */}
              {locationAddress && (
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      📍
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.7)',
                        marginBottom: '4px'
                      }}>
                        Full Address:
                      </div>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        lineHeight: '1.4'
                      }}>
                        {locationAddress}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GPS Coordinates Section */}
              {renderGPSCoordinates()}

              {/* OpenStreetMap Location Details */}
              {renderOpenStreetMapLocation()}

              {/* Navigation Hint */}
              <div style={{
                textAlign: 'center',
                marginTop: '20px',
                padding: '10px',
                background: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2rem', color: '#4CAF50' }}>📍</span>
                <span style={{ color: '#4CAF50', fontSize: '0.9rem' }}>
                  Click anywhere on this card to view the full interactive map
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Bot Icon Button */}
      <button
        onClick={() => setChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
        {!chatOpen && chatMessages.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {chatMessages.filter(m => m.sender === 'bot' && m.text).length}
          </span>
        )}
      </button>

      {/* Chat Bot Window */}
      {chatOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '350px',
          height: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          overflow: 'hidden',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {/* Chat Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            padding: '12px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                backdropFilter: 'blur(10px)',
                flexShrink: 0
              }}>
                🤖
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  RubberSense AI
                </h3>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Powered by GPT-5 nano
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              <button
                onClick={clearChat}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                title="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div style={{
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            background: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {chatMessages.length === 0 && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'white',
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                maxWidth: '85%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}>
                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>
                  👋 Hello! I'm <strong>RubberSense AI</strong>, powered by GPT-5 nano. I can help you with:
                </p>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#555' }}>
                  <li>Questions about rubber trees and latex</li>
                  <li>General knowledge and information</li>
                  <li>Coding and technical questions</li>
                  <li>Creative writing and brainstorming</li>
                  <li>Math, science, and history</li>
                  <li>And much more!</li>
                </ul>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555' }}>
                  Ask me anything! What would you like to know?
                </p>
              </div>
            )}

            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' 
                    : 'white',
                  color: msg.sender === 'user' ? 'white' : '#333',
                  padding: '10px 15px',
                  borderRadius: msg.sender === 'user' 
                    ? '18px 4px 18px 18px' 
                    : '4px 18px 18px 18px',
                  maxWidth: '85%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e0e0e0',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </div>
            ))}

            {chatLoading && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'white',
                padding: '12px 16px',
                borderRadius: '4px 18px 18px 18px',
                maxWidth: '85%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    animation: 'bounce 1.4s infinite ease-in-out both'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    animation: 'bounce 1.4s infinite ease-in-out both 0.2s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    animation: 'bounce 1.4s infinite ease-in-out both 0.4s'
                  }}></div>
                </div>
                <span style={{ fontSize: '13px', color: '#666' }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <form onSubmit={handleChatSubmit} style={{
            borderTop: '1px solid #e0e0e0',
            padding: '12px',
            background: 'white',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '14px',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #4CAF50'}
              onBlur={(e) => e.target.style.border = '1px solid #e0e0e0'}
              disabled={chatLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                  return;
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  handleChatSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                transition: 'opacity 0.2s, transform 0.2s'
              }}
              disabled={chatLoading || !chatInput.trim()}
              onMouseEnter={(e) => {
                if (!chatLoading && chatInput.trim()) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!chatLoading && chatInput.trim()) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {chatLoading ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
                '→'
              )}
            </button>
          </form>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 
          40% { 
            transform: scale(1.0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default Home;