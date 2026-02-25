import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader.jsx';
import UserFooter from '../layouts/UserFooter.jsx';

// ── SVG Icons (from UserProfile.jsx) ─────────────────────────────────────────
const FileTextIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const UsersIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const RepeatIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

const HeartIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const MessageCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const EyeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const MailIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/>
  </svg>
);

const MapPinIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const HomeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const LockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const NavigationIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const RefreshIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

const LeafIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [stats, setStats] = useState({ totalPosts: 0, totalFollowers: 0, totalFollowing: 0 });

  // Location states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [detailedLocation, setDetailedLocation] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ── Location helpers ──────────────────────────────────────────────────────
  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
        { headers: { 'Accept-Language': 'en' }, timeout: 5000 }
      );
      const data = response.data;
      const address = data.address || {};
      const components = {
        house: address.house_number || address.house_name || null,
        road: address.road || address.street || address.footway || address.path || null,
        neighbourhood: address.neighbourhood || null,
        suburb: address.suburb || null,
        city_district: address.city_district || null,
        village: address.village || address.hamlet || null,
        town: address.town || null,
        city: address.city || address.municipality || null,
        state: address.state || address.region || null,
        country: address.country || null,
        country_code: address.country_code ? address.country_code.toUpperCase() : null,
        postcode: address.postcode || null,
        county: address.county || null,
      };
      const parts = [
        components.house, components.road, components.neighbourhood,
        components.suburb, components.city_district, components.village,
        components.city, components.county, components.state,
        components.country, components.postcode
      ].filter(Boolean);
      const formattedAddress = parts.join(', ');
      return {
        fullAddress: formattedAddress || data.display_name || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: data.display_name, components, rawData: data, source: 'OpenStreetMap',
      };
    } catch (error) {
      return {
        fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: null, components: null, rawData: null,
        source: 'GPS coordinates only', error: 'Failed to fetch from OpenStreetMap'
      };
    }
  };

  const detectCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(accuracy);
        setUserLocation({ lat: latitude, lng: longitude });
        const locationInfo = await getOpenStreetMapAddress(latitude, longitude);
        setDetailedLocation(locationInfo);
        setLocationLoading(false);
      },
      (error) => {
        let msg = 'Could not get your location.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied by user.';
        else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information is unavailable.';
        else if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
        setLocationError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const updateUserAddress = async () => {
    if (!detailedLocation) return;
    try {
      const token = localStorage.getItem('token');
      const c = detailedLocation.components || {};
      const updateData = {
        ...(c.road && { street: c.road }),
        ...((c.neighbourhood || c.suburb) && { barangay: c.neighbourhood || c.suburb }),
        ...((c.city || c.town || c.village) && { city: c.city || c.town || c.village }),
        ...(c.postcode && { zipcode: c.postcode }),
      };
      if (Object.keys(updateData).length > 0) {
        const response = await axios.put(`${API_BASE_URL}/api/v1/users/me/update`, updateData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.data.success) {
          setUser(prev => ({
            ...prev,
            address: {
              ...prev?.address,
              street: updateData.street || prev?.address?.street,
              barangay: updateData.barangay || prev?.address?.barangay,
              city: updateData.city || prev?.address?.city,
              zipcode: updateData.zipcode || prev?.address?.zipcode,
            }
          }));
          setShowLocationModal(false);
          showToast('Address updated successfully!', 'success');
        }
      } else {
        showToast('No address data to update', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update address.', 'error');
    }
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const profileResponse = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (profileResponse.data.success) {
          const userData = profileResponse.data.user;
          setUser(userData);
          const userId = userData.userId || userData._id;

          const postsResponse = await axios.get(`${API_BASE_URL}/api/v1/users/community/posts/user/${userId}`);
          if (postsResponse.data.success) {
            const visiblePosts = (postsResponse.data.data || []).filter(
              post => !post.isHidden && !post.hiddenByAdmin && post.status !== 'hidden' && post.status !== 'removed'
            );
            setPosts(visiblePosts);
          }

          const followersRes = await axios.get(`${API_BASE_URL}/api/v1/users/${userId}/followers`);
          if (followersRes.data.success) setFollowers(followersRes.data.data || []);

          const followingRes = await axios.get(`${API_BASE_URL}/api/v1/users/${userId}/following`);
          if (followingRes.data.success) setFollowing(followingRes.data.data || []);

          const statsRes = await axios.get(`${API_BASE_URL}/api/v1/users/${userId}/stats`);
          if (statsRes.data.success) setStats(statsRes.data.data);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [navigate, API_BASE_URL]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; top: 100px; right: 20px;
      background: ${type === 'success' ? '#228B22' : type === 'error' ? '#dc3545' : '#17a2b8'};
      color: white; padding: 12px 20px; border-radius: 8px;
      z-index: 10000; font-size: 14px;
      animation: fadeInOut 3s ease-in-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getUserAvatar = (userData) => {
    if (userData?.profilePicture?.url) {
      return userData.profilePicture.url.startsWith('http')
        ? userData.profilePicture.url
        : `${API_BASE_URL}${userData.profilePicture.url}`;
    }
    if (userData?.avatar?.url) {
      return userData.avatar.url.startsWith('http')
        ? userData.avatar.url
        : `${API_BASE_URL}${userData.avatar.url}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'U')}&size=200&background=2d6a4f&color=fff&bold=true`;
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || 'U';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#ffffff' }}>
        <style>{`@keyframes up-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '60px', height: '60px', border: '4px solid #C8E6C9', borderTopColor: '#2E7D32', borderRadius: '50%', animation: 'up-spin 0.9s linear infinite' }} />
        <p style={{ textAlign: 'center', color: '#2E7D32', fontSize: '18px', marginTop: '20px', fontFamily: "'DM Sans', sans-serif" }}>Loading Profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545' }}>Profile not found</h2>
          <button onClick={() => navigate('/')} style={{ background: '#228B22', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <UserHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes up-spin  { to { transform: rotate(360deg); } }
        @keyframes up-fadeup { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInOut {
          0%   { opacity:0; transform:translateY(-10px); }
          20%  { opacity:1; transform:translateY(0); }
          80%  { opacity:1; transform:translateY(0); }
          100% { opacity:0; transform:translateY(-10px); }
        }

        .prf-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          padding-top: 80px;
        }

        .prf-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px 20px 60px;
        }

        /* ── HEADER CARD ── */
        .prf-header-card {
          background: #fff;
          border-radius: 12px;
          padding: 40px;
          margin-bottom: 28px;
          box-shadow: 0 2px 16px rgba(27,94,32,0.08);
          border: 1px solid #E8F5E9;
          display: flex;
          align-items: flex-start;
          gap: 36px;
          flex-wrap: wrap;
          animation: up-fadeup 0.45s ease both;
        }

        .prf-avatar-ring {
          width: 150px; height: 150px;
          border-radius: 50%; overflow: hidden;
          border: 4px solid #2d6a4f;
          flex-shrink: 0; background: #E8F5E9;
          display: flex; align-items: center; justify-content: center;
        }
        .prf-avatar-ring img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .prf-user-info { flex: 1; min-width: 0; }
        .prf-user-name {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem; color: #1a3d2b;
          margin: 0 0 8px;
        }
        .prf-user-bio {
          color: #546E7A; font-size: 1rem;
          line-height: 1.6; margin: 0 0 22px;
        }

        .prf-info-block {
          background: #F9FBF9;
          border: 1px solid #E8F5E9;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 16px;
        }
        .prf-info-block:last-child { margin-bottom: 0; }
        .prf-info-block-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #2E7D32; margin: 0 0 14px;
          padding-bottom: 10px; border-bottom: 1px solid #E8F5E9;
        }
        .prf-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .prf-info-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.78rem; color: #78909C;
          text-transform: uppercase; letter-spacing: 0.07em;
          font-weight: 600; margin-bottom: 4px;
        }
        .prf-info-value {
          font-size: 0.95rem; color: #263238; font-weight: 500;
        }

        /* ── ACTION BUTTONS ── */
        .prf-actions {
          display: flex; flex-direction: column;
          gap: 12px; flex-shrink: 0; width: 200px;
        }
        .prf-btn {
          width: 100%; padding: 14px 0;
          border: none; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          text-decoration: none;
        }
        .prf-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .prf-btn-primary {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 14px rgba(46,125,50,0.28);
        }
        .prf-btn-secondary {
          background: #fff; color: #2E7D32;
          border: 1.5px solid #66BB6A;
        }
        .prf-btn-location {
          background: linear-gradient(135deg, #0277bd, #0288d1);
          color: #fff;
          box-shadow: 0 4px 14px rgba(2,119,189,0.25);
        }

        /* ── STATS ── */
        .prf-stats-wrap {
          display: flex; gap: 20px; flex: 1;
          margin-bottom: 28px;
          animation: up-fadeup 0.5s 0.05s ease both;
        }
        .prf-stat-card {
          background: #fff; border-radius: 12px;
          padding: 24px 20px; text-align: center;
          box-shadow: 0 2px 12px rgba(27,94,32,0.07);
          border: 1.5px solid #E8F5E9;
          flex: 1; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .prf-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(27,94,32,0.13);
          border-color: #A5D6A7;
        }
        .prf-stat-card.active { border-color: #2d6a4f; border-width: 2px; }
        .prf-stat-icon { color: #2d6a4f; }
        .prf-stat-num {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem; color: #1a3d2b; line-height: 1;
        }
        .prf-stat-label {
          font-size: 0.78rem; color: #78909C;
          text-transform: uppercase; letter-spacing: 0.09em; font-weight: 600;
        }

        /* ── TABS ── */
        .prf-tabs-wrap { margin-bottom: 26px; animation: up-fadeup 0.5s 0.1s ease both; }
        .prf-tabs {
          display: flex; gap: 0;
          border-bottom: 2px solid #E8F5E9;
        }
        .prf-tab-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 13px 28px; border: none; background: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: #78909C; cursor: pointer;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -2px; transition: color 0.2s;
        }
        .prf-tab-btn:hover { color: #2E7D32; }
        .prf-tab-btn.active { color: #2E7D32; border-bottom-color: #43A047; }

        /* ── POST CARDS ── */
        .prf-post-card {
          background: #fff; border-radius: 12px; padding: 24px;
          box-shadow: 0 2px 12px rgba(27,94,32,0.06);
          border: 1.5px solid #E8F5E9;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          margin-bottom: 18px;
        }
        .prf-post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(27,94,32,0.1);
          border-color: #A5D6A7;
        }
        .prf-post-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem; color: #1B5E20; margin: 0 0 12px;
        }
        .prf-post-body {
          font-size: 0.93rem; color: #546E7A;
          line-height: 1.7; margin-bottom: 18px;
          white-space: pre-wrap; word-break: break-word;
        }
        .prf-post-footer {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 1px solid #E8F5E9; padding-top: 14px;
          color: #78909C; font-size: 0.83rem;
        }
        .prf-post-meta { display: flex; gap: 18px; }
        .prf-post-meta-item { display: flex; align-items: center; gap: 5px; }
        .prf-post-date { font-size: 0.8rem; color: #90A4AE; }

        /* ── PEOPLE GRID ── */
        .prf-people-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }
        .prf-person-card {
          background: #fff; border-radius: 12px; padding: 22px;
          box-shadow: 0 2px 12px rgba(27,94,32,0.06);
          border: 1.5px solid #E8F5E9;
          display: flex; align-items: center; gap: 18px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .prf-person-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(27,94,32,0.12);
          border-color: #A5D6A7;
        }
        .prf-person-avatar {
          width: 68px; height: 68px; border-radius: 50%;
          overflow: hidden; border: 2px solid #A5D6A7;
          flex-shrink: 0; background: #E8F5E9;
          display: flex; align-items: center; justify-content: center;
        }
        .prf-person-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .prf-person-name {
          font-size: 0.97rem; font-weight: 600;
          color: #263238; margin: 0 0 4px;
        }
        .prf-person-bio {
          font-size: 0.84rem; color: #78909C; line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden; margin: 0;
        }

        /* ── EMPTY ── */
        .prf-empty {
          background: #fff; border-radius: 12px;
          padding: 60px 20px; text-align: center;
          box-shadow: 0 2px 12px rgba(27,94,32,0.06);
          border: 1px solid #E8F5E9;
        }
        .prf-empty-icon { color: #A5D6A7; margin-bottom: 14px; }
        .prf-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32; margin: 0 0 8px; font-size: 1.3rem;
        }
        .prf-empty p { color: #78909C; margin: 0; font-size: 0.92rem; }

        /* ── MODAL ── */
        .prf-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10,30,15,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 20px; backdrop-filter: blur(3px);
        }
        .prf-modal {
          background: #fff; border-radius: 16px;
          max-width: 560px; width: 100%; max-height: 90vh; overflow: auto;
          box-shadow: 0 24px 64px rgba(27,94,32,0.2);
        }
        .prf-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 18px 22px; border-bottom: 1px solid #E8F5E9;
          background: linear-gradient(135deg, #1a3d2b, #2d6a4f);
          border-radius: 16px 16px 0 0;
        }
        .prf-modal-title {
          display: flex; align-items: center; gap: 8px;
          font-family: 'DM Serif Display', serif; font-size: 1.1rem;
          color: #fff; margin: 0;
        }
        .prf-modal-close {
          background: rgba(255,255,255,0.15); border: none; cursor: pointer;
          color: #fff; padding: 6px; display: flex; align-items: center;
          border-radius: 6px; transition: background 0.2s;
        }
        .prf-modal-close:hover { background: rgba(255,255,255,0.28); }
        .prf-modal-body { padding: 22px; }
        .prf-loc-loading { text-align: center; padding: 36px 20px; }
        .prf-loc-spinner { width: 40px; height: 40px; border: 3px solid #C8E6C9; border-top-color: #2E7D32; border-radius: 50%; animation: up-spin 0.9s linear infinite; margin: 0 auto 16px; }
        .prf-loc-error { text-align: center; padding: 32px 20px; color: #C62828; }
        .prf-retry-btn { margin-top: 16px; padding: 9px 22px; background: linear-gradient(135deg, #2E7D32, #43A047); color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; font-family: 'DM Sans',sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
        .prf-loc-result { padding: 4px 0; }
        .prf-loc-success-banner { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding: 10px 14px; background: #E8F5E9; border-radius: 8px; border-left: 4px solid #43A047; font-weight: 600; color: #2E7D32; font-size: 0.92rem; }
        .prf-loc-block { margin-bottom: 14px; padding: 14px; background: #F1F8E9; border-radius: 8px; border: 1px solid #C8E6C9; }
        .prf-loc-block strong { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #78909C; display: block; margin-bottom: 7px; }
        .prf-loc-block p { font-size: 0.92rem; color: #263238; margin: 0; line-height: 1.5; }
        .prf-loc-block ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
        .prf-loc-block ul li { font-size: 0.87rem; color: #546E7A; display: flex; align-items: center; gap: 7px; }
        .prf-loc-actions { display: flex; gap: 10px; margin-top: 18px; }
        .prf-confirm-btn { flex: 2; padding: 12px; background: linear-gradient(135deg, #2E7D32, #43A047); color: #fff; border: none; border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; box-shadow: 0 4px 14px rgba(46,125,50,0.25); transition: opacity 0.2s; }
        .prf-confirm-btn:hover { opacity: 0.88; }
        .prf-cancel-btn { flex: 1; padding: 12px; background: #F1F8E9; color: #546E7A; border: 1px solid #C8E6C9; border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: 0.88rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background 0.2s; }
        .prf-cancel-btn:hover { background: #E8F5E9; }

        @media (max-width: 768px) {
          .prf-header-card { padding: 24px 18px; gap: 22px; }
          .prf-actions { width: 100%; flex-direction: row; flex-wrap: wrap; }
          .prf-btn { flex: 1; min-width: 130px; }
          .prf-tabs { overflow-x: auto; }
          .prf-stats-wrap { flex-wrap: wrap; }
        }
      `}</style>

      <div className="prf-root">
        <div className="prf-inner">

          {/* ── Profile Header Card ── */}
          <div className="prf-header-card">

            {/* Avatar */}
            <div className="prf-avatar-ring">
              <img
                src={getUserAvatar(user)}
                alt={user.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#2d6a4f;font-family:'DM Serif Display',serif;font-size:3rem;font-weight:700;">${getInitial(user.name)}</div>`;
                }}
              />
            </div>

            {/* User Info */}
            <div className="prf-user-info">
              <h1 className="prf-user-name">{user.name}</h1>
              {user.bio && <p className="prf-user-bio">{user.bio}</p>}

              {/* Contact Information */}
              <div className="prf-info-block">
                <div className="prf-info-block-title">
                  <MailIcon size={13} /> Contact Information
                </div>
                <div className="prf-info-grid">
                  <div>
                    <div className="prf-info-label"><MailIcon /> Email</div>
                    <div className="prf-info-value">{user.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="prf-info-label"><PhoneIcon /> Phone</div>
                    <div className="prf-info-value">{user.phone || user.contact || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="prf-info-block">
                <div className="prf-info-block-title">
                  <MapPinIcon size={13} /> Address
                </div>
                <div className="prf-info-grid">
                  <div>
                    <div className="prf-info-label"><HomeIcon /> Street</div>
                    <div className="prf-info-value">{user.address?.street || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="prf-info-label"><MapPinIcon /> Barangay</div>
                    <div className="prf-info-value">{user.address?.barangay || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="prf-info-label"><MapPinIcon /> City</div>
                    <div className="prf-info-value">{user.address?.city || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="prf-info-label"><MapPinIcon /> Zip Code</div>
                    <div className="prf-info-value">{user.address?.zipCode || user.address?.zipcode || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="prf-actions">
              <Link to="/profile/edit" className="prf-btn prf-btn-primary">
                <EditIcon /> Edit Profile
              </Link>
              <Link to="/change-password" className="prf-btn prf-btn-secondary">
                <LockIcon /> Change Password
              </Link>
              <button
                className="prf-btn prf-btn-location"
                onClick={() => { setShowLocationModal(true); detectCurrentLocation(); }}
              >
                <NavigationIcon /> Detect Location
              </button>
            </div>
          </div>

          {/* ── Location Modal ── */}
          {showLocationModal && (
            <div className="prf-modal-overlay" onClick={() => setShowLocationModal(false)}>
              <div className="prf-modal" onClick={e => e.stopPropagation()}>
                <div className="prf-modal-header">
                  <h3 className="prf-modal-title"><MapPinIcon size={16} /> Detect Your Location</h3>
                  <button className="prf-modal-close" onClick={() => setShowLocationModal(false)}><XIcon /></button>
                </div>
                <div className="prf-modal-body">
                  {locationLoading && (
                    <div className="prf-loc-loading">
                      <div className="prf-loc-spinner" />
                      <p style={{ margin: '0 0 4px', fontSize: '0.92rem', color: '#546E7A' }}>Detecting your location...</p>
                      <p style={{ fontSize: '0.82rem', color: '#90A4AE', margin: 0 }}>Please allow location access when prompted</p>
                    </div>
                  )}
                  {locationError && !locationLoading && (
                    <div className="prf-loc-error">
                      <AlertTriangleIcon size={28} />
                      <p style={{ margin: '12px 0 0', fontSize: '0.92rem' }}>{locationError}</p>
                      <button className="prf-retry-btn" onClick={detectCurrentLocation}><RefreshIcon /> Try Again</button>
                    </div>
                  )}
                  {!locationLoading && !locationError && detailedLocation && (
                    <div className="prf-loc-result">
                      <div className="prf-loc-success-banner"><CheckIcon /> Location Detected Successfully</div>
                      <div className="prf-loc-block">
                        <strong>Full Address</strong>
                        <p>{detailedLocation.fullAddress}</p>
                      </div>
                      {detailedLocation.components && (
                        <div className="prf-loc-block">
                          <strong>Address Components</strong>
                          <ul>
                            {detailedLocation.components.road && <li><MapPinIcon /> Road: {detailedLocation.components.road}</li>}
                            {detailedLocation.components.neighbourhood && <li><LeafIcon /> Neighbourhood: {detailedLocation.components.neighbourhood}</li>}
                            {detailedLocation.components.suburb && <li><LeafIcon /> Suburb: {detailedLocation.components.suburb}</li>}
                            {detailedLocation.components.city && <li><MapPinIcon /> City: {detailedLocation.components.city}</li>}
                            {detailedLocation.components.town && <li><MapPinIcon /> Town: {detailedLocation.components.town}</li>}
                            {detailedLocation.components.village && <li><MapPinIcon /> Village: {detailedLocation.components.village}</li>}
                            {detailedLocation.components.state && <li><MapPinIcon /> State: {detailedLocation.components.state}</li>}
                            {detailedLocation.components.country && <li><LeafIcon /> Country: {detailedLocation.components.country}</li>}
                            {detailedLocation.components.postcode && <li><FileTextIcon /> Postcode: {detailedLocation.components.postcode}</li>}
                          </ul>
                        </div>
                      )}
                      {gpsAccuracy && (
                        <div className="prf-loc-block">
                          <strong>GPS Accuracy</strong>
                          <p>±{Math.round(gpsAccuracy)} meters</p>
                        </div>
                      )}
                      <div className="prf-loc-actions">
                        <button className="prf-confirm-btn" onClick={updateUserAddress}><CheckIcon /> Confirm & Save Address</button>
                        <button className="prf-cancel-btn" onClick={() => setShowLocationModal(false)}><XIcon /> Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Stats Row ── */}
          <div className="prf-stats-wrap">
            <div className={`prf-stat-card${activeTab === 'posts' ? ' active' : ''}`} onClick={() => setActiveTab('posts')}>
              <div className="prf-stat-icon"><FileTextIcon size={24} /></div>
              <div className="prf-stat-num">{posts.length}</div>
              <div className="prf-stat-label">Posts</div>
            </div>
            <div className={`prf-stat-card${activeTab === 'followers' ? ' active' : ''}`} onClick={() => setActiveTab('followers')}>
              <div className="prf-stat-icon"><UsersIcon size={24} /></div>
              <div className="prf-stat-num">{followers.length}</div>
              <div className="prf-stat-label">Followers</div>
            </div>
            <div className={`prf-stat-card${activeTab === 'following' ? ' active' : ''}`} onClick={() => setActiveTab('following')}>
              <div className="prf-stat-icon"><RepeatIcon size={24} /></div>
              <div className="prf-stat-num">{following.length}</div>
              <div className="prf-stat-label">Following</div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="prf-tabs-wrap">
            <div className="prf-tabs">
              <button className={`prf-tab-btn${activeTab === 'posts' ? ' active' : ''}`} onClick={() => setActiveTab('posts')}>
                <FileTextIcon size={14} /> Posts ({posts.length})
              </button>
              <button className={`prf-tab-btn${activeTab === 'followers' ? ' active' : ''}`} onClick={() => setActiveTab('followers')}>
                <UsersIcon size={14} /> Followers ({followers.length})
              </button>
              <button className={`prf-tab-btn${activeTab === 'following' ? ' active' : ''}`} onClick={() => setActiveTab('following')}>
                <RepeatIcon size={14} /> Following ({following.length})
              </button>
            </div>
          </div>

          {/* ── Posts Tab ── */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="prf-empty">
                  <div className="prf-empty-icon"><FileTextIcon size={48} /></div>
                  <h3>No posts yet</h3>
                  <p>You haven't created any posts yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {posts.map(post => (
                    <div key={post._id} className="prf-post-card">
                      <h3 className="prf-post-title">{post.title}</h3>
                      <div className="prf-post-body">{post.content}</div>
                      <div className="prf-post-footer">
                        <div className="prf-post-meta">
                          <span className="prf-post-meta-item"><HeartIcon /> {post.likesCount || 0} Likes</span>
                          <span className="prf-post-meta-item"><MessageCircleIcon /> {post.commentsCount || 0} Comments</span>
                          <span className="prf-post-meta-item"><EyeIcon /> {post.views || 0} Views</span>
                        </div>
                        <span className="prf-post-date">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Followers Tab ── */}
          {activeTab === 'followers' && (
            <div>
              {followers.length === 0 ? (
                <div className="prf-empty">
                  <div className="prf-empty-icon"><UsersIcon size={48} /></div>
                  <h3>No followers yet</h3>
                  <p>You don't have any followers yet.</p>
                </div>
              ) : (
                <div className="prf-people-grid">
                  {followers.map(follower => (
                    <div
                      key={follower._id || follower.userId}
                      className="prf-person-card"
                      onClick={() => navigate(`/user/${follower.userId || follower._id}`)}
                    >
                      <div className="prf-person-avatar">
                        <img
                          src={getUserAvatar(follower)}
                          alt={follower.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#2d6a4f;font-size:1.5rem;font-weight:700;">${getInitial(follower.name)}</div>`;
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className="prf-person-name">{follower.name}</p>
                        {follower.bio && <p className="prf-person-bio">{follower.bio}</p>}
                        {follower.email && !follower.bio && <p className="prf-person-bio">{follower.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Following Tab ── */}
          {activeTab === 'following' && (
            <div>
              {following.length === 0 ? (
                <div className="prf-empty">
                  <div className="prf-empty-icon"><RepeatIcon size={48} /></div>
                  <h3>Not following anyone</h3>
                  <p>You are not following anyone yet.</p>
                </div>
              ) : (
                <div className="prf-people-grid">
                  {following.map(followingUser => (
                    <div
                      key={followingUser._id || followingUser.userId}
                      className="prf-person-card"
                      onClick={() => navigate(`/user/${followingUser.userId || followingUser._id}`)}
                    >
                      <div className="prf-person-avatar">
                        <img
                          src={getUserAvatar(followingUser)}
                          alt={followingUser.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#2d6a4f;font-size:1.5rem;font-weight:700;">${getInitial(followingUser.name)}</div>`;
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className="prf-person-name">{followingUser.name}</p>
                        {followingUser.bio && <p className="prf-person-bio">{followingUser.bio}</p>}
                        {followingUser.email && !followingUser.bio && <p className="prf-person-bio">{followingUser.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <UserFooter />
    </>
  );
};

export default Profile;