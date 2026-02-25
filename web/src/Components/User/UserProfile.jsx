import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
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

const UserPlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="20" y1="8" x2="20" y2="14"/>
    <line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
);

const UserMinusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
);

const SendIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
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

const GlobeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [messagingStatus, setMessagingStatus] = useState({
    canMessage: true,
    requiresRequest: true,
    isBlocked: false,
    mutualFollowing: false
  });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Configure axios
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = API_BASE_URL;
  }, [API_BASE_URL]);

  // ── OpenStreetMap address resolver ────────────────────────────────────────
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
      return {
        fullAddress: parts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        components,
        source: 'OpenStreetMap',
      };
    } catch (error) {
      return null;
    }
  };

  // Resolve address from stored coordinates if available
  const resolveAddressFromCoords = async (userData) => {
    // If user has stored lat/lng coordinates, resolve them
    const lat = userData?.location?.lat || userData?.location?.latitude || userData?.coordinates?.lat;
    const lng = userData?.location?.lng || userData?.location?.longitude || userData?.coordinates?.lng;

    if (lat && lng) {
      setAddressLoading(true);
      const result = await getOpenStreetMapAddress(lat, lng);
      setResolvedAddress(result);
      setAddressLoading(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const userResponse = await axios.get(`/api/v1/users/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (userResponse.data.success) {
        const userData = userResponse.data.data;
        setUser(userData);

        // Try to resolve address from coordinates
        resolveAddressFromCoords(userData);

        if (token) {
          try {
            const followCheckResponse = await axios.get(`/api/v1/users/${userId}/follow-status`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (followCheckResponse.data.success) {
              setIsFollowing(followCheckResponse.data.isFollowing);
            }
          } catch (error) {
            console.log('Follow status check failed:', error);
          }
        }

        setPosts(userData.posts || []);
        setFollowers(userData.followers || []);
        setFollowing(userData.following || []);
      } else {
        showToast('Failed to load user profile', 'error');
        navigate('/community');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 404) {
        showToast('User not found', 'error');
      } else {
        showToast('Failed to load user profile', 'error');
      }
      navigate('/community');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const response = await axios.get('/api/v1/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const checkMessagingStatus = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !currentUser || currentUser.userId === userId) return;

      const response = await axios.get(`/api/v1/messages/can-message/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessagingStatus({
          canMessage: response.data.canMessage,
          requiresRequest: response.data.requiresRequest,
          isBlocked: response.data.isBlocked || false,
          mutualFollowing: response.data.mutualFollowing || false
        });
      }
    } catch (error) {
      console.error('Error checking messaging status:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchCurrentUser();
  }, [fetchUserData]);

  useEffect(() => {
    if (currentUser && currentUser.userId !== userId) {
      checkMessagingStatus();
    }
  }, [currentUser, userId]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showToast('Please login to follow users', 'error');
        navigate('/login');
        return;
      }

      if (isFollowing) {
        const response = await axios.delete(`/api/v1/users/${userId}/unfollow`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
          setIsFollowing(false);
          setFollowers(prev => prev.filter(f => f._id !== currentUser?.userId));
          showToast('Unfollowed successfully', 'success');
          checkMessagingStatus();
        }
      } else {
        const response = await axios.post(`/api/v1/users/${userId}/follow`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
          setIsFollowing(true);
          if (currentUser) setFollowers(prev => [currentUser, ...prev]);
          showToast('Followed successfully', 'success');
          checkMessagingStatus();
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        navigate('/login');
      } else if (error.response?.data?.message === 'Already following this user') {
        showToast('Already following this user', 'info');
      } else if (error.response?.data?.message === 'You cannot follow yourself') {
        showToast('You cannot follow yourself', 'error');
      } else {
        showToast('Failed to update follow status', 'error');
      }
    }
  };

  const handleMessageClick = async () => {
    if (!currentUser) {
      showToast('Please login to send messages', 'error');
      navigate('/login');
      return;
    }
    if (currentUser.userId === userId) {
      showToast('Cannot message yourself', 'error');
      return;
    }
    if (messagingStatus.isBlocked) {
      showToast('You cannot message this user because you are blocked', 'error');
      return;
    }
    if (messagingStatus.requiresRequest && !messagingStatus.mutualFollowing) {
      const confirmSend = window.confirm(
        `You don't follow each other yet. Your message will be sent as a message request. ${user.name} will need to accept it before they can reply. Do you want to continue?`
      );
      if (!confirmSend) return;
    }
    navigate(`/messages/${userId}`);
  };

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
      background: ${type === 'success' ? '#228B22' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
      color: ${type === 'warning' ? '#212529' : 'white'};
      padding: 12px 20px; border-radius: 8px; z-index: 10000;
      font-size: 14px; animation: fadeInOut 3s ease-in-out;
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
    return "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png";
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || 'U';

  // Helper: get best address value
  const getAddressValue = (field) => {
    // Prefer resolved OpenStreetMap data if available
    if (resolvedAddress?.components) {
      const c = resolvedAddress.components;
      switch (field) {
        case 'street': return c.road || user?.address?.street || 'Not provided';
        case 'barangay': return c.neighbourhood || c.suburb || user?.address?.barangay || 'Not provided';
        case 'city': return c.city || c.town || c.village || user?.address?.city || 'Not provided';
        case 'zipCode': return c.postcode || user?.address?.zipCode || user?.address?.zipcode || 'Not provided';
        default: return 'Not provided';
      }
    }
    switch (field) {
      case 'street': return user?.address?.street || 'Not provided';
      case 'barangay': return user?.address?.barangay || 'Not provided';
      case 'city': return user?.address?.city || 'Not provided';
      case 'zipCode': return user?.address?.zipCode || user?.address?.zipcode || 'Not provided';
      default: return 'Not provided';
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545' }}>User not found</h2>
          <button onClick={() => navigate('/community')} style={{ background: '#228B22', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}>Back to Community</button>
        </div>
      </div>
    );
  }

  const isRequestMessage = messagingStatus.requiresRequest && !messagingStatus.mutualFollowing;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <UserHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes up-spin  { to { transform: rotate(360deg); } }
        @keyframes up-fadeup { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInOut {
          0%   { opacity:0; transform:translateY(-10px); }
          20%  { opacity:1; transform:translateY(0);     }
          80%  { opacity:1; transform:translateY(0);     }
          100% { opacity:0; transform:translateY(-10px); }
        }

        .up-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          padding-top: 80px;
        }

        .up-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px 20px 60px;
        }

        /* ── HEADER CARD ── */
        .up-header-card {
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

        .up-avatar-ring {
          width: 150px; height: 150px;
          border-radius: 50%; overflow: hidden;
          border: 4px solid #2d6a4f;
          flex-shrink: 0; background: #E8F5E9;
          display: flex; align-items: center; justify-content: center;
        }
        .up-avatar-ring img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .up-user-info { flex: 1; min-width: 0; }
        .up-user-name {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem; color: #1a3d2b;
          margin: 0 0 8px;
        }
        .up-user-bio {
          color: #546E7A; font-size: 1rem;
          line-height: 1.6; margin: 0 0 22px;
        }

        .up-info-block {
          background: #F9FBF9;
          border: 1px solid #E8F5E9;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 16px;
        }
        .up-info-block:last-child { margin-bottom: 0; }
        .up-info-block-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #2E7D32; margin: 0 0 14px;
          padding-bottom: 10px; border-bottom: 1px solid #E8F5E9;
        }
        .up-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .up-info-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.78rem; color: #78909C;
          text-transform: uppercase; letter-spacing: 0.07em;
          font-weight: 600; margin-bottom: 4px;
        }
        .up-info-value {
          font-size: 0.95rem; color: #263238; font-weight: 500;
        }
        .up-address-source {
          margin-top: 10px; padding: 8px 12px;
          background: #E8F5E9; border-radius: 6px;
          font-size: 0.78rem; color: #2E7D32;
          display: flex; align-items: center; gap: 6px;
        }
        .up-address-loading {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.82rem; color: #78909C; margin-top: 8px;
        }
        .up-mini-spinner {
          width: 14px; height: 14px;
          border: 2px solid #C8E6C9; border-top-color: #2E7D32;
          border-radius: 50%; animation: up-spin 0.8s linear infinite; flex-shrink: 0;
        }

        /* ── ACTION BUTTONS ── */
        .up-actions {
          display: flex; flex-direction: column;
          gap: 12px; flex-shrink: 0; width: 200px;
        }
        .up-btn {
          width: 100%; padding: 14px 0;
          border: none; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .up-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        .up-btn-follow {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 14px rgba(46,125,50,0.28);
        }
        .up-btn-unfollow {
          background: #fff3f3; color: #c62828;
          border: 1.5px solid #ef9a9a;
        }
        .up-btn-msg-direct {
          background: linear-gradient(135deg, #0277bd, #0288d1);
          color: #fff;
          box-shadow: 0 4px 14px rgba(2,119,189,0.25);
          position: relative;
        }
        .up-btn-msg-request {
          background: #fff8e1; color: #795548;
          border: 1.5px solid #ffe082;
          position: relative;
        }
        .up-request-badge {
          position: absolute; top: -7px; right: -7px;
          background: #FFA000; color: #fff;
          font-size: 0.65rem; font-weight: 700;
          padding: 2px 7px; border-radius: 10px;
        }
        .up-blocked-notice {
          background: #fff3f3; color: #c62828;
          border: 1px solid #ffcdd2; border-radius: 8px;
          padding: 10px 14px; font-size: 0.82rem;
          text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          line-height: 1.5;
        }

        /* ── STATS ── */
        .up-stats-wrap {
          display: flex; gap: 20px; flex: 1;
          margin-bottom: 28px;
          animation: up-fadeup 0.5s 0.05s ease both;
        }
        .up-stat-card {
          background: #fff; border-radius: 12px;
          padding: 24px 20px; text-align: center;
          box-shadow: 0 2px 12px rgba(27,94,32,0.07);
          border: 1.5px solid #E8F5E9;
          flex: 1; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .up-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(27,94,32,0.13);
          border-color: #A5D6A7;
        }
        .up-stat-card.active { border-color: #2d6a4f; border-width: 2px; }
        .up-stat-icon { color: #2d6a4f; }
        .up-stat-num {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem; color: #1a3d2b; line-height: 1;
        }
        .up-stat-label {
          font-size: 0.78rem; color: #78909C;
          text-transform: uppercase; letter-spacing: 0.09em; font-weight: 600;
        }

        /* ── TABS ── */
        .up-tabs-wrap { margin-bottom: 26px; animation: up-fadeup 0.5s 0.1s ease both; }
        .up-tabs {
          display: flex; gap: 0;
          border-bottom: 2px solid #E8F5E9;
        }
        .up-tab-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 13px 28px; border: none; background: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: #78909C; cursor: pointer;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -2px; transition: color 0.2s;
        }
        .up-tab-btn:hover { color: #2E7D32; }
        .up-tab-btn.active { color: #2E7D32; border-bottom-color: #43A047; }

        /* ── POST CARDS ── */
        .up-post-card {
          background: #fff; border-radius: 12px; padding: 24px;
          box-shadow: 0 2px 12px rgba(27,94,32,0.06);
          border: 1.5px solid #E8F5E9;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          margin-bottom: 18px;
        }
        .up-post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(27,94,32,0.1);
          border-color: #A5D6A7;
        }
        .up-post-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem; color: #1B5E20; margin: 0 0 12px;
        }
        .up-post-body {
          font-size: 0.93rem; color: #546E7A;
          line-height: 1.7; margin-bottom: 18px;
          white-space: pre-wrap; word-break: break-word;
        }
        .up-post-footer {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 1px solid #E8F5E9; padding-top: 14px;
          color: #78909C; font-size: 0.83rem;
        }
        .up-post-meta { display: flex; gap: 18px; }
        .up-post-meta-item { display: flex; align-items: center; gap: 5px; }
        .up-post-date { font-size: 0.8rem; color: #90A4AE; }

        /* ── PEOPLE GRID ── */
        .up-people-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }
        .up-person-card {
          background: #fff; border-radius: 12px; padding: 22px;
          box-shadow: 0 2px 12px rgba(27,94,32,0.06);
          border: 1.5px solid #E8F5E9;
          display: flex; align-items: center; gap: 18px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .up-person-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(27,94,32,0.12);
          border-color: #A5D6A7;
        }
        .up-person-avatar {
          width: 68px; height: 68px; border-radius: 50%;
          overflow: hidden; border: 2px solid #A5D6A7;
          flex-shrink: 0; background: #E8F5E9;
          display: flex; align-items: center; justify-content: center;
        }
        .up-person-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .up-person-name {
          font-size: 0.97rem; font-weight: 600;
          color: #263238; margin: 0 0 4px;
        }
        .up-person-bio {
          font-size: 0.84rem; color: #78909C; line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden; margin: 0;
        }

        /* ── EMPTY ── */
        .up-empty {
          background: #fff; border-radius: 12px;
          padding: 60px 20px; text-align: center;
          box-shadow: 0 2px 12px rgba(27,94,32,0.06);
          border: 1px solid #E8F5E9;
        }
        .up-empty-icon { color: #A5D6A7; margin-bottom: 14px; }
        .up-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32; margin: 0 0 8px; font-size: 1.3rem;
        }
        .up-empty p { color: #78909C; margin: 0; font-size: 0.92rem; }

        @media (max-width: 768px) {
          .up-header-card { padding: 24px 18px; gap: 22px; }
          .up-actions { width: 100%; flex-direction: row; flex-wrap: wrap; }
          .up-btn { flex: 1; min-width: 130px; }
          .up-tabs { overflow-x: auto; }
          .up-stats-wrap { flex-wrap: wrap; }
        }
      `}</style>

      <div className="up-root">
        <div className="up-inner">

          {/* ── Profile Header Card ── */}
          <div className="up-header-card">

            {/* Avatar */}
            <div className="up-avatar-ring">
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
            <div className="up-user-info">
              <h1 className="up-user-name">{user.name}</h1>
              {user.bio && <p className="up-user-bio">{user.bio}</p>}

              {/* Contact Information */}
              <div className="up-info-block">
                <div className="up-info-block-title">
                  <MailIcon size={13} /> Contact Information
                </div>
                <div className="up-info-grid">
                  <div>
                    <div className="up-info-label"><MailIcon /> Email</div>
                    <div className="up-info-value">{user.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="up-info-label"><PhoneIcon /> Phone</div>
                    <div className="up-info-value">{user.phone || user.contact || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="up-info-block">
                <div className="up-info-block-title">
                  <MapPinIcon size={13} /> Address
                  {resolvedAddress && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#78909C', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GlobeIcon size={11} /> via OpenStreetMap
                    </span>
                  )}
                </div>

                {addressLoading && (
                  <div className="up-address-loading">
                    <div className="up-mini-spinner" />
                    Resolving address from coordinates...
                  </div>
                )}

                <div className="up-info-grid">
                  <div>
                    <div className="up-info-label"><HomeIcon /> Street</div>
                    <div className="up-info-value">{getAddressValue('street')}</div>
                  </div>
                  <div>
                    <div className="up-info-label"><MapPinIcon /> Barangay</div>
                    <div className="up-info-value">{getAddressValue('barangay')}</div>
                  </div>
                  <div>
                    <div className="up-info-label"><MapPinIcon /> City</div>
                    <div className="up-info-value">{getAddressValue('city')}</div>
                  </div>
                  <div>
                    <div className="up-info-label"><MapPinIcon /> Zip Code</div>
                    <div className="up-info-value">{getAddressValue('zipCode')}</div>
                  </div>
                </div>

                {/* Show full resolved address if available */}
                {resolvedAddress?.fullAddress && (
                  <div className="up-address-source">
                    <MapPinIcon size={12} />
                    <span>{resolvedAddress.fullAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons — shown to other logged-in users */}
            {currentUser && currentUser.userId !== userId && (
              <div className="up-actions">
                <button
                  onClick={handleFollow}
                  className={`up-btn ${isFollowing ? 'up-btn-unfollow' : 'up-btn-follow'}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isFollowing ? '#fce8e8' : 'linear-gradient(135deg,#1B5E20,#2E7D32)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isFollowing ? '#fff3f3' : 'linear-gradient(135deg,#2E7D32,#43A047)';
                  }}
                >
                  {isFollowing ? <><UserMinusIcon /> Unfollow</> : <><UserPlusIcon /> Follow</>}
                </button>

                {!messagingStatus.isBlocked && (
                  <button
                    onClick={handleMessageClick}
                    className={`up-btn ${isRequestMessage ? 'up-btn-msg-request' : 'up-btn-msg-direct'}`}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.84'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    title={isRequestMessage
                      ? "You don't follow each other yet. Messages will be sent as requests."
                      : "You follow each other. Messages will be delivered directly."}
                  >
                    <SendIcon /> Message
                    {isRequestMessage && <span className="up-request-badge">Request</span>}
                  </button>
                )}

                {messagingStatus.isBlocked && (
                  <div className="up-blocked-notice">
                    <AlertTriangleIcon /> You are blocked from messaging this user
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Stats Row ── */}
          <div className="up-stats-wrap">
            <div className={`up-stat-card${activeTab === 'posts' ? ' active' : ''}`} onClick={() => setActiveTab('posts')}>
              <div className="up-stat-icon"><FileTextIcon size={24} /></div>
              <div className="up-stat-num">{posts.length}</div>
              <div className="up-stat-label">Posts</div>
            </div>
            <div className={`up-stat-card${activeTab === 'followers' ? ' active' : ''}`} onClick={() => setActiveTab('followers')}>
              <div className="up-stat-icon"><UsersIcon size={24} /></div>
              <div className="up-stat-num">{followers.length}</div>
              <div className="up-stat-label">Followers</div>
            </div>
            <div className={`up-stat-card${activeTab === 'following' ? ' active' : ''}`} onClick={() => setActiveTab('following')}>
              <div className="up-stat-icon"><RepeatIcon size={24} /></div>
              <div className="up-stat-num">{following.length}</div>
              <div className="up-stat-label">Following</div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="up-tabs-wrap">
            <div className="up-tabs">
              <button className={`up-tab-btn${activeTab === 'posts' ? ' active' : ''}`} onClick={() => setActiveTab('posts')}>
                <FileTextIcon size={14} /> Posts ({posts.length})
              </button>
              <button className={`up-tab-btn${activeTab === 'followers' ? ' active' : ''}`} onClick={() => setActiveTab('followers')}>
                <UsersIcon size={14} /> Followers ({followers.length})
              </button>
              <button className={`up-tab-btn${activeTab === 'following' ? ' active' : ''}`} onClick={() => setActiveTab('following')}>
                <RepeatIcon size={14} /> Following ({following.length})
              </button>
            </div>
          </div>

          {/* ── Posts Tab ── */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="up-empty">
                  <div className="up-empty-icon"><FileTextIcon size={48} /></div>
                  <h3>No posts yet</h3>
                  <p>{user.name} hasn't created any posts yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {posts.map(post => (
                    <div key={post._id} className="up-post-card">
                      <h3 className="up-post-title">{post.title}</h3>
                      <div className="up-post-body">{post.content}</div>
                      <div className="up-post-footer">
                        <div className="up-post-meta">
                          <span className="up-post-meta-item"><HeartIcon /> {post.likesCount || 0} Likes</span>
                          <span className="up-post-meta-item"><MessageCircleIcon /> {post.commentsCount || 0} Comments</span>
                          <span className="up-post-meta-item"><EyeIcon /> {post.views || 0} Views</span>
                        </div>
                        <span className="up-post-date">{formatDate(post.createdAt)}</span>
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
                <div className="up-empty">
                  <div className="up-empty-icon"><UsersIcon size={48} /></div>
                  <h3>No followers yet</h3>
                  <p>{user.name} doesn't have any followers yet.</p>
                </div>
              ) : (
                <div className="up-people-grid">
                  {followers.map(follower => (
                    <div
                      key={follower._id || follower.userId}
                      className="up-person-card"
                      onClick={() => navigate(`/user/${follower.userId || follower._id}`)}
                    >
                      <div className="up-person-avatar">
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
                        <p className="up-person-name">{follower.name}</p>
                        {follower.bio && <p className="up-person-bio">{follower.bio}</p>}
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
                <div className="up-empty">
                  <div className="up-empty-icon"><RepeatIcon size={48} /></div>
                  <h3>Not following anyone</h3>
                  <p>{user.name} is not following anyone yet.</p>
                </div>
              ) : (
                <div className="up-people-grid">
                  {following.map(followingUser => (
                    <div
                      key={followingUser._id || followingUser.userId}
                      className="up-person-card"
                      onClick={() => navigate(`/user/${followingUser.userId || followingUser._id}`)}
                    >
                      <div className="up-person-avatar">
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
                        <p className="up-person-name">{followingUser.name}</p>
                        {followingUser.bio && <p className="up-person-bio">{followingUser.bio}</p>}
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

export default UserProfile;