import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';

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
  const [transportMode, setTransportMode] = useState('motor'); // 'walk', 'motor', 'bike', 'car'
  const [routeLoading, setRouteLoading] = useState(false);
  const mapIframeRef = useRef(null);
  const navigate = useNavigate();

  // Rubber Plantation Data
  const rubberPlantations = [
    // LARGE PLANTATIONS (GREEN)
    { name: "Kidapawan City, North Cotabato", type: "large", lat: 7.0086, lng: 125.0894, color: "green" },
    { name: "Makilala, North Cotabato", type: "large", lat: 6.9667, lng: 125.0833, color: "green" },
    { name: "Matalam, North Cotabato", type: "large", lat: 7.0833, lng: 124.9000, color: "green" },
    { name: "President Roxas, North Cotabato", type: "large", lat: 7.1545, lng: 125.0558, color: "green" },
    { name: "Tampilisan, Zamboanga del Norte", type: "large", lat: 8.0500, lng: 122.6833, color: "green" },
    { name: "Zamboanga Sibugay (General)", type: "large", lat: 7.8000, lng: 122.6667, color: "green" },
    { name: "Basilan (General)", type: "large", lat: 6.7167, lng: 122.0667, color: "green" },
    
    // MEDIUM PLANTATIONS (YELLOW)
    { name: "South Upi, Maguindanao", type: "medium", lat: 7.0167, lng: 124.1667, color: "yellow" },
    { name: "Upi, Maguindanao", type: "medium", lat: 7.0333, lng: 124.1833, color: "yellow" },
    { name: "Trento, Agusan del Sur", type: "medium", lat: 8.0500, lng: 126.0667, color: "yellow" },
    { name: "Sta. Josefa, Agusan del Sur", type: "medium", lat: 7.9833, lng: 126.0333, color: "yellow" },
    { name: "Rosario, Agusan del Sur", type: "medium", lat: 8.3833, lng: 125.8333, color: "yellow" },
    { name: "Bunawan, Agusan del Sur", type: "medium", lat: 8.1833, lng: 125.9833, color: "yellow" },
    { name: "Laak, Davao de Oro", type: "medium", lat: 7.8000, lng: 125.8000, color: "yellow" },
    { name: "Maco, Davao de Oro", type: "medium", lat: 7.3667, lng: 125.8500, color: "yellow" },
    { name: "Monkayo, Davao de Oro", type: "medium", lat: 7.8167, lng: 126.0500, color: "yellow" },
    
    // SMALL PLANTATIONS (RED)
    { name: "Aleosan, North Cotabato", type: "small", lat: 7.1500, lng: 124.5667, color: "red" },
    { name: "Pinamalayan, Oriental Mindoro", type: "small", lat: 13.0333, lng: 121.4333, color: "red" },
    { name: "Los Baños, Laguna", type: "small", lat: 14.1667, lng: 121.2333, color: "red" },
    { name: "Calamba, Laguna", type: "small", lat: 14.2167, lng: 121.1667, color: "red" },
    { name: "Bay, Laguna", type: "small", lat: 14.1833, lng: 121.2833, color: "red" },
    { name: "Santa Cruz, Laguna", type: "small", lat: 14.2833, lng: 121.4167, color: "red" },
    { name: "Palawan (General)", type: "small", lat: 10.0000, lng: 118.7500, color: "red" },
    { name: "Talakag, Bukidnon", type: "small", lat: 8.2333, lng: 124.6000, color: "red" },
    { name: "Kalilangan, Bukidnon", type: "small", lat: 7.9167, lng: 124.7333, color: "red" },
    { name: "Negros Oriental (General)", type: "small", lat: 9.7500, lng: 122.8333, color: "red" },
    { name: "Tacloban, Leyte", type: "small", lat: 11.2500, lng: 125.0000, color: "red" },
  ];

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

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

  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'RubberSense/1.0'
          },
          timeout: 5000
        }
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

      const formattedAddress = parts.filter(Boolean).join(', ') || displayName;

      return {
        fullAddress: formattedAddress || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
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

  const checkGeolocationPermission = async () => {
    if (!navigator.geolocation) {
      return { available: false, error: 'Geolocation not supported by your browser' };
    }

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

  const updateMap = (lat, lng, zoom = 17, showMarker = true) => {
    const bboxSize = 0.005 / Math.sqrt(zoom);
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bboxSize},${lat - bboxSize},${lng + bboxSize},${lat + bboxSize}&layer=mapnik&center=${lat},${lng}&zoom=${zoom}${showMarker ? `&marker=${lat},${lng}` : ''}`;
    
    if (mapIframeRef.current) {
      mapIframeRef.current.src = mapSrc;
    }
  };

  const updateMapWithRoute = async (startLat, startLng, endLat, endLng, mode = 'motor') => {
    try {
      setRouteLoading(true);
      
      // Convert mode to OSRM profile
      let profile = 'driving';
      switch(mode) {
        case 'walk':
          profile = 'walking';
          break;
        case 'bike':
          profile = 'cycling';
          break;
        case 'motor':
        case 'car':
        default:
          profile = 'driving';
      }
      
      // Get route from OSRM API
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=simplified&geometries=geojson`
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const distance = (route.distance / 1000).toFixed(1); // Convert meters to km
        const duration = formatDuration(route.duration, mode); // Convert seconds to readable format
        
        // Extract coordinates for the route line
        const coordinates = route.geometry.coordinates;
        setRouteCoordinates(coordinates);
        setRouteDistance(distance);
        setRouteDuration(duration);
        
        // Create encoded polyline for OpenStreetMap
        const encodedPolyline = encodePolyline(coordinates.map(coord => [coord[1], coord[0]]));
        
        // Calculate bounds for the map
        const bounds = calculateBounds(coordinates);
        const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
        
        // Create map URL with route overlay
        // Note: OpenStreetMap embed doesn't support custom polylines directly
        // We'll use markers and let OSM show the route
        const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${startLat},${startLng}&marker=${endLat},${endLng}&center=${bounds.centerLat},${bounds.centerLng}&zoom=12`;
        
        if (mapIframeRef.current) {
          mapIframeRef.current.src = mapSrc;
        }
        
        setRouteStart({ lat: startLat, lng: startLng });
        setRouteEnd({ lat: endLat, lng: endLng });
        setShowRoute(true);
        setRouteLoading(false);
        
        return { distance, duration };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      // Fallback to simple straight line route
      return showSimpleRoute(startLat, startLng, endLat, endLng, mode);
    } finally {
      setRouteLoading(false);
    }
  };

  const showSimpleRoute = (startLat, startLng, endLat, endLng, mode) => {
    // Calculate distance (haversine formula)
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    const duration = calculateDuration(distance, mode);
    
    // Create a simple straight line for visualization
    const simpleCoords = [[startLng, startLat], [endLng, endLat]];
    setRouteCoordinates(simpleCoords);
    setRouteDistance(distance);
    setRouteDuration(duration);
    
    // Calculate bounds
    const minLat = Math.min(startLat, endLat);
    const maxLat = Math.max(startLat, endLat);
    const minLng = Math.min(startLng, endLng);
    const maxLng = Math.max(startLng, endLng);
    const padding = 0.02;
    const bbox = `${minLng - padding},${minLat - padding},${maxLng + padding},${maxLat + padding}`;
    const centerLat = (startLat + endLat) / 2;
    const centerLng = (startLng + endLng) / 2;
    
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${startLat},${startLng}&marker=${endLat},${endLng}&center=${centerLat},${centerLng}&zoom=12`;
    
    if (mapIframeRef.current) {
      mapIframeRef.current.src = mapSrc;
    }
    
    setRouteStart({ lat: startLat, lng: startLng });
    setRouteEnd({ lat: endLat, lng: endLng });
    setShowRoute(true);
    
    return { distance, duration };
  };

  const calculateBounds = (coordinates) => {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    
    coordinates.forEach(coord => {
      const lat = coord[1];
      const lng = coord[0];
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
    
    // Add padding
    const padding = 0.02;
    return {
      minLat: minLat - padding,
      maxLat: maxLat + padding,
      minLng: minLng - padding,
      maxLng: maxLng + padding,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2
    };
  };

  const encodePolyline = (points) => {
    // Simple polyline encoding
    return points.map(point => `${point[0].toFixed(6)},${point[1].toFixed(6)}`).join(';');
  };

  const formatDuration = (seconds, mode) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const calculateDuration = (distance, mode) => {
    let speed;
    switch(mode) {
      case 'walk':
        speed = 5; // km/h for walking
        break;
      case 'bike':
        speed = 15; // km/h for biking
        break;
      case 'motor':
        speed = 40; // km/h for motorcycle
        break;
      case 'car':
        speed = 60; // km/h for car
        break;
      default:
        speed = 40;
    }
    
    const hours = distance / speed;
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    } else {
      const hoursInt = Math.floor(hours);
      const minutes = Math.round((hours - hoursInt) * 60);
      return `${hoursInt}h ${minutes}m`;
    }
  };

  const fetchLocationDetails = async (lat, lng) => {
    const locationInfo = await getOpenStreetMapAddress(lat, lng);
    setLocationAddress(locationInfo.fullAddress);
    setDetailedLocation(locationInfo);
    return locationInfo;
  };

  const goToMyLocation = async () => {
    if (!userLocation) {
      const geolocationStatus = await checkGeolocationPermission();
      if (!geolocationStatus.available) {
        setLocationError(geolocationStatus.error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsAccuracy(accuracy);
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(17);
          
          await fetchLocationDetails(latitude, longitude);
          updateMap(latitude, longitude, 17, true);
          setLocationError(null);
          showToast('📍 Map centered on your location');
        },
        (error) => {
          setLocationError('Could not get your location. Please check your browser settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setMapCenter(userLocation);
      setMapZoom(17);
      updateMap(userLocation.lat, userLocation.lng, 17, true);
      showToast('📍 Map centered on your location');
    }
  };

  const calculateRoute = async (destinationLat, destinationLng, destinationName) => {
    if (!userLocation) {
      const geolocationStatus = await checkGeolocationPermission();
      if (!geolocationStatus.available) {
        setLocationError(geolocationStatus.error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setGpsAccuracy(accuracy);
          
          // Show route on map
          await updateMapWithRoute(latitude, longitude, destinationLat, destinationLng, transportMode);
          setLocationAddress(destinationName);
          setSelectedLocation({ lat: destinationLat, lng: destinationLng });
          showToast(`📍 Route to ${destinationName} calculated`, 'info');
        },
        (error) => {
          setLocationError('Could not get your location. Please check your browser settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // User location already available, show route
      await updateMapWithRoute(userLocation.lat, userLocation.lng, destinationLat, destinationLng, transportMode);
      setLocationAddress(destinationName);
      setSelectedLocation({ lat: destinationLat, lng: destinationLng });
      showToast(`📍 Route to ${destinationName} calculated`, 'info');
    }
  };

  const changeTransportMode = async (mode) => {
    setTransportMode(mode);
    
    if (showRoute && routeStart && routeEnd) {
      setRouteLoading(true);
      await updateMapWithRoute(routeStart.lat, routeStart.lng, routeEnd.lat, routeEnd.lng, mode);
      showToast(`Route updated for ${getModeDisplayName(mode)}`, 'info');
    }
  };

  const getModeDisplayName = (mode) => {
    switch(mode) {
      case 'walk': return 'Walking';
      case 'bike': return 'Bicycle';
      case 'motor': return 'Motorcycle';
      case 'car': return 'Car';
      default: return 'Motorcycle';
    }
  };

  const getModeIcon = (mode) => {
    switch(mode) {
      case 'walk': return '🚶';
      case 'bike': return '🚲';
      case 'motor': return '🏍️';
      case 'car': return '🚗';
      default: return '🏍️';
    }
  };

  const clearRoute = () => {
    setShowRoute(false);
    setRouteStart(null);
    setRouteEnd(null);
    setRouteDistance(null);
    setRouteDuration(null);
    setRouteCoordinates([]);
    
    // Return to normal map view
    if (selectedLocation) {
      updateMap(selectedLocation.lat, selectedLocation.lng, 14, true);
    } else if (userLocation) {
      updateMap(userLocation.lat, userLocation.lng, 14, true);
    }
    
    showToast('🗺️ Route cleared', 'info');
  };

  const saveLocation = async () => {
    if (!selectedLocation || !locationName.trim()) return;

    const locationData = {
      name: locationName,
      type: locationType,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      address: locationAddress,
      details: detailedLocation,
      accuracy: gpsAccuracy,
      createdAt: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/locations`, locationData);
      
      if (response.data.success) {
        setSavedLocations(prev => [...prev, response.data.location]);
        setShowSaveModal(false);
        setLocationName('');
        setSelectedLocation(null);
        
        showToast('✅ Location saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      const saved = JSON.parse(localStorage.getItem('savedLocations') || '[]');
      saved.push({
        ...locationData,
        id: Date.now().toString()
      });
      localStorage.setItem('savedLocations', JSON.stringify(saved));
      setSavedLocations(saved);
      setShowSaveModal(false);
      setLocationName('');
      setSelectedLocation(null);
      
      showToast('✅ Location saved locally!', 'success');
    }
  };

  const loadSavedLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get(`${API_BASE_URL}/api/v1/locations`);
      
      if (response.data.success) {
        setSavedLocations(response.data.locations);
      }
    } catch (error) {
      console.error('Error loading saved locations:', error);
      const saved = JSON.parse(localStorage.getItem('savedLocations') || '[]');
      setSavedLocations(saved);
    }
  };

  const deleteLocation = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await axios.delete(`${API_BASE_URL}/api/v1/locations/${locationId}`);
      setSavedLocations(prev => prev.filter(loc => loc.id !== locationId));
      
      showToast('🗑️ Location deleted', 'info');
    } catch (error) {
      console.error('Error deleting location:', error);
      const saved = JSON.parse(localStorage.getItem('savedLocations') || '[]').filter(loc => loc.id !== locationId);
      localStorage.setItem('savedLocations', JSON.stringify(saved));
      setSavedLocations(saved);
      
      showToast('🗑️ Location deleted locally', 'info');
    }
  };

  const goToLocation = (location) => {
    setMapCenter({ lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) });
    setMapZoom(15);
    updateMap(parseFloat(location.latitude), parseFloat(location.longitude), 15, true);
    
    setLocationAddress(location.address);
    setDetailedLocation(location.details || { components: {} });
    
    showToast(`📍 Navigated to ${location.name}`);
  };

  const getPlantationStats = () => {
    const largeCount = rubberPlantations.filter(p => p.type === 'large').length;
    const mediumCount = rubberPlantations.filter(p => p.type === 'medium').length;
    const smallCount = rubberPlantations.filter(p => p.type === 'small').length;
    return { largeCount, mediumCount, smallCount };
  };

  const getFilteredPlantations = () => {
    if (selectedPlantationType === 'all') {
      return rubberPlantations;
    }
    return rubberPlantations.filter(p => p.type === selectedPlantationType);
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(33, 150, 243, 0.9)'};
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      animation: fadeInOut 2s ease-in-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
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
            setGpsAccuracy(accuracy);
            setUserLocation({ lat: latitude, lng: longitude });
            setMapCenter({ lat: latitude, lng: longitude });
            
            await fetchLocationDetails(latitude, longitude);
            updateMap(latitude, longitude, 14, true);
            setMapLoading(false);
          },
          async (error) => {
            console.error('Geolocation error:', error);
            setLocationError('Could not get your location. Please check your browser settings.');
            updateMap(mapCenter.lat, mapCenter.lng, mapZoom, false);
            setMapLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setLocationError(geolocationStatus.error || 'Location services unavailable.');
        updateMap(mapCenter.lat, mapCenter.lng, mapZoom, false);
        setMapLoading(false);
      }

      loadSavedLocations();
    };

    initializeLocation();
  }, [loading]);

  const renderGPSCoordinates = () => {
    const location = selectedLocation || userLocation || mapCenter;
    if (!location) return null;

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
              {parseFloat(location.lat).toFixed(6)}, {parseFloat(location.lng).toFixed(6)}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span>🎯</span>
              <span>Accuracy: {gpsAccuracy ? `${Math.round(gpsAccuracy)} meters` : 'Not available'}</span>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${parseFloat(location.lat).toFixed(6)}, ${parseFloat(location.lng).toFixed(6)}`);
              showToast('Coordinates copied to clipboard!', 'success');
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
            📋 Copy
          </button>
        </div>
      </div>
    );
  };

  const renderOpenStreetMapLocation = () => {
    if (!detailedLocation || !detailedLocation.components) return null;

    const components = detailedLocation.components;
    const locationBreakdown = [];

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
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 2000
      }}>
        <UserHeader />
      </div>

      <div style={{
        padding: '40px 20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            color: 'white', 
            marginBottom: '15px',
            fontSize: '2.2rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{ fontSize: '2.5rem' }}>🗺️</span>
            RubberSense Maps - Plantation Routes
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            lineHeight: '1.6',
            fontSize: '1.1rem',
            maxWidth: '800px'
          }}>
            Click on any plantation to calculate route from your current location. 
            Select transport mode to get optimized routes for walking, cycling, motorcycle, or car.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '25px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(76, 175, 80, 0.2)',
              border: '2px solid rgba(76, 175, 80, 0.5)',
              padding: '15px 25px',
              borderRadius: '15px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: '200px'
            }}>
              <div style={{
                background: 'rgba(76, 175, 80, 0.3)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                🌳
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {getPlantationStats().largeCount}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Large Plantations
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 193, 7, 0.2)',
              border: '2px solid rgba(255, 193, 7, 0.5)',
              padding: '15px 25px',
              borderRadius: '15px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: '200px'
            }}>
              <div style={{
                background: 'rgba(255, 193, 7, 0.3)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                🌳
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {getPlantationStats().mediumCount}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Medium Plantations
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'rgba(244, 67, 54, 0.2)',
              border: '2px solid rgba(244, 67, 54, 0.5)',
              padding: '15px 25px',
              borderRadius: '15px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: '200px'
            }}>
              <div style={{
                background: 'rgba(244, 67, 54, 0.3)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                🌳
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {getPlantationStats().smallCount}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Small Plantations
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'rgba(33, 150, 243, 0.2)',
              border: '2px solid rgba(33, 150, 243, 0.5)',
              padding: '15px 25px',
              borderRadius: '15px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: '200px'
            }}>
              <div style={{
                background: 'rgba(33, 150, 243, 0.3)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                📍
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {savedLocations.length}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Your Saved Locations
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '30px'
        }}>
          {/* Left Column: Map */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              height: '600px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <h2 style={{
                  color: 'white',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {showRoute ? `Route to Plantation (${getModeDisplayName(transportMode)})` : 'Rubber Plantation Map'}
                  {mapLoading && (
                    <span style={{
                      fontSize: '0.9rem',
                      background: 'rgba(255,255,255,0.2)',
                      padding: '4px 12px',
                      borderRadius: '12px'
                    }}>
                      Loading...
                    </span>
                  )}
                  {routeLoading && (
                    <span style={{
                      fontSize: '0.9rem',
                      background: 'rgba(33, 150, 243, 0.2)',
                      padding: '4px 12px',
                      borderRadius: '12px'
                    }}>
                      Calculating route...
                    </span>
                  )}
                </h2>
                
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  {showRoute && (
                    <button
                      onClick={clearRoute}
                      style={{
                        background: 'rgba(255, 152, 0, 0.9)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '25px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s, transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 152, 0, 1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 152, 0, 0.9)'}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🗺️</span>
                      Clear Route
                    </button>
                  )}
                  
                  {/* Transport Mode Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select
                      value={transportMode}
                      onChange={(e) => changeTransportMode(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '10px 15px',
                        paddingLeft: '45px',
                        borderRadius: '25px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        outline: 'none',
                        minWidth: '180px',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="walk">🚶 Walking</option>
                      <option value="bike">🚲 Bicycle</option>
                      <option value="motor">🏍️ Motorcycle</option>
                      <option value="car">🚗 Car</option>
                    </select>
                    <div style={{
                      position: 'absolute',
                      left: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      fontSize: '1.2rem'
                    }}>
                      {getModeIcon(transportMode)}
                    </div>
                    <div style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      ▼
                    </div>
                  </div>
                  
                  <select
                    value={selectedPlantationType}
                    onChange={(e) => setSelectedPlantationType(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '10px 15px',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      outline: 'none',
                      minWidth: '150px'
                    }}
                  >
                    <option value="all">All Plantations</option>
                    <option value="large">Large Plantations</option>
                    <option value="medium">Medium Plantations</option>
                    <option value="small">Small Plantations</option>
                  </select>
                  
                  <button
                    onClick={goToMyLocation}
                    style={{
                      background: 'rgba(33, 150, 243, 0.9)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s, transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(33, 150, 243, 1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(33, 150, 243, 0.9)'}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                    My Location
                  </button>
                </div>
              </div>
              
              {/* Route Information */}
              {showRoute && routeDistance && routeDuration && (
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '15px',
                  flexWrap: 'wrap',
                  background: 'rgba(59, 130, 246, 0.15)',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.3)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      📏
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Distance</div>
                      <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{routeDistance} km</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.3)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      ⏱️
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Estimated Time</div>
                      <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{routeDuration}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.3)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {getModeIcon(transportMode)}
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Transport Mode</div>
                      <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {getModeDisplayName(transportMode)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Plantation Legend */}
              <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '15px',
                flexWrap: 'wrap',
                background: 'rgba(0,0,0,0.2)',
                padding: '12px 15px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    border: '2px solid white'
                  }}></div>
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>Large Plantation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    background: '#FFC107',
                    border: '2px solid white'
                  }}></div>
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>Medium Plantation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    background: '#F44336',
                    border: '2px solid white'
                  }}></div>
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>Small Plantation</span>
                </div>
              </div>
              
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
                  </div>
                  <button
                    onClick={() => setLocationError(null)}
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
                flex: 1,
                borderRadius: '15px',
                overflow: 'hidden',
                background: '#2c3e50',
                position: 'relative',
                border: '2px solid rgba(255,255,255,0.1)'
              }}>
                <iframe
                  ref={mapIframeRef}
                  title="OpenStreetMap"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.005},${mapCenter.lat - 0.005},${mapCenter.lng + 0.005},${mapCenter.lat + 0.005}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}&center=${mapCenter.lat},${mapCenter.lng}&zoom=${mapZoom}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  loading="lazy"
                  allowFullScreen
                />
                
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.9)',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '10px',
                  color: '#333',
                  zIndex: 15
                }}>
                  © OpenStreetMap contributors
                </div>
              </div>
              
              <div style={{
                marginTop: '15px',
                padding: '12px 15px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <span>
                  <strong>Tip:</strong> {showRoute 
                    ? 'Change transport mode from dropdown to get different route calculations' 
                    : 'Click on any plantation to connect your current location with a route line'}
                </span>
              </div>
            </div>
            
            <div style={{
              marginTop: '30px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '1.5rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>📍</span>
                {showRoute ? 'Route Destination' : 'Location Details'}
              </h2>
              
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
                      background: showRoute ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      {showRoute ? '🎯' : '📍'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.7)',
                        marginBottom: '4px'
                      }}>
                        {showRoute ? 'Destination Plantation:' : selectedLocation ? 'Selected Location:' : 'Current Location:'}
                      </div>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        lineHeight: '1.4',
                        color: 'white'
                      }}>
                        {locationAddress}
                      </div>
                      {showRoute && (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          color: 'rgba(255,255,255,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ color: '#4CAF50' }}>●</span>
                          <span>Connected to your location via {getModeDisplayName(transportMode).toLowerCase()} route</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {renderGPSCoordinates()}
              
              {renderOpenStreetMapLocation()}
              
              <div style={{
                display: 'flex',
                gap: '15px',
                marginTop: '25px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    if (selectedLocation) {
                      setShowSaveModal(true);
                    } else {
                      showToast('Please select a location first', 'error');
                    }
                  }}
                  disabled={!selectedLocation}
                  style={{
                    background: selectedLocation ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '25px',
                    fontSize: '1rem',
                    cursor: selectedLocation ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background 0.2s, transform 0.2s',
                    fontWeight: 'bold',
                    flex: 1,
                    minWidth: '200px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedLocation) {
                      e.currentTarget.style.background = 'rgba(76, 175, 80, 1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLocation) {
                      e.currentTarget.style.background = 'rgba(76, 175, 80, 0.9)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>💾</span>
                  Save Location
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              marginBottom: '30px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '1.5rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>📋</span>
                Rubber Plantations
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  marginLeft: 'auto'
                }}>
                  {getFilteredPlantations().length}
                </span>
              </h2>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {getFilteredPlantations().map((plantation, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      padding: '12px 15px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, border-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onClick={() => calculateRoute(plantation.lat, plantation.lng, plantation.name)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    <div style={{
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      background: plantation.color,
                      border: '2px solid white',
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: 'white',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {plantation.name}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span>{plantation.type.charAt(0).toUpperCase() + plantation.type.slice(1)} Plantation</span>
                        <span>•</span>
                        <span>{plantation.lat.toFixed(4)}, {plantation.lng.toFixed(4)}</span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      color: 'rgba(255,255,255,0.6)',
                      flexShrink: 0
                    }}>
                      🔗
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              height: 'calc(600px - 430px)',
              overflowY: 'auto'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '1.5rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.8rem' }}>📋</span>
                Your Saved Locations
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  marginLeft: 'auto'
                }}>
                  {savedLocations.length}
                </span>
              </h2>
              
              {savedLocations.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🗺️</div>
                  <h3 style={{ color: 'white', marginBottom: '10px' }}>No Saved Locations</h3>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Select locations on the map and save them to appear here.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {savedLocations.map((location, index) => (
                    <div
                      key={location.id || index}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '12px 15px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'transform 0.2s, border-color 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                      onClick={() => goToLocation(location)}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          background: location.type === 'plantation' 
                            ? 'rgba(76, 175, 80, 0.2)' 
                            : 'rgba(33, 150, 243, 0.2)',
                          width: '35px',
                          height: '35px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0
                        }}>
                          {location.type === 'plantation' ? '🌳' : '📍'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            margin: 0,
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {location.name}
                          </h3>
                          <p style={{
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '0.8rem',
                            margin: 0,
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {location.address}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span>📅</span>
                          <span>
                            {new Date(location.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLocation(location.id);
                          }}
                          style={{
                            background: 'rgba(244, 67, 54, 0.2)',
                            color: '#ff5252',
                            border: 'none',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 67, 54, 0.3)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 67, 54, 0.2)'}
                          title="Delete location"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && selectedLocation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#667eea',
            borderRadius: '20px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <h2 style={{
              color: 'white',
              marginBottom: '25px',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '2rem' }}>💾</span>
              Save Location
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>📍</span>
                <span>Selected Location:</span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '12px 15px',
                borderRadius: '10px',
                color: 'white',
                fontSize: '0.95rem',
                marginBottom: '15px'
              }}>
                {locationAddress}
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255,255,255,0.9)',
                  marginBottom: '8px',
                  fontSize: '0.95rem'
                }}>
                  Location Name *
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Main Rubber Plantation"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                  autoFocus
                />
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  color: 'rgba(255,255,255,0.9)',
                  marginBottom: '8px',
                  fontSize: '0.95rem'
                }}>
                  Location Type
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    onClick={() => setLocationType('plantation')}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '12px',
                      background: locationType === 'plantation' 
                        ? 'rgba(76, 175, 80, 0.9)' 
                        : 'rgba(255,255,255,0.1)',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                  >
                    🌳 Plantation
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('collection')}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '12px',
                      background: locationType === 'collection' 
                        ? 'rgba(33, 150, 243, 0.9)' 
                        : 'rgba(255,255,255,0.1)',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                  >
                    🚚 Collection Point
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setLocationName('');
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.2)',
                  padding: '12px 25px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                Cancel
              </button>
              <button
                onClick={saveLocation}
                disabled={!locationName.trim()}
                style={{
                  background: locationName.trim() 
                    ? 'rgba(76, 175, 80, 0.9)' 
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  cursor: locationName.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (locationName.trim()) {
                    e.currentTarget.style.background = 'rgba(76, 175, 80, 1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (locationName.trim()) {
                    e.currentTarget.style.background = 'rgba(76, 175, 80, 0.9)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideIn {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

export default Maps;