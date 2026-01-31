import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LogoImage from '../logo/LOGO.png';

const UserHeader = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);

        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, API_BASE_URL]);

  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const navigationItems = [
    { label: 'Home', path: '/home' },
    { label: 'About Us', path: '/about' },
    { label: 'Latex Detection', path: '/latex-detection' },
    { label: 'Trunk Detection', path: '/trunks-detection' },
    { label: 'About Rubber', path: '/about-rubber' },
    { label: 'Contacts', path: '/contact' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setProfileMenuOpen(false);
    navigate('/login');
  };

  const profileMenuItems = [
    { label: 'Profile', icon: '👤', action: () => navigate('/profile') },
    { label: 'Recent Analysis', icon: '📊', action: () => navigate('/analysis') },
    { label: 'Settings', icon: '⚙️', action: () => navigate('/settings') },
    { label: 'Log out', icon: '🚪', isLogout: true, action: () => handleLogout() }
  ];

  const getUserInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getUserDisplayName = () =>
    user?.name || user?.username || user?.email?.split('@')[0] || 'User';

  const getUserEmail = () => user?.email || 'No email provided';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-dropdown')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileMenuOpen]);

  if (loading) {
    return <header className="user-header"><div className="header-container">Loading...</div></header>;
  }

  return (
    <>
      <style>{`
        /* Remove ALL default button styles + browser arrows */
        button {
          margin: 0;
          padding: 0;
          background: none;
          border: none;
          font: inherit;
          color: inherit;
          cursor: pointer;
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          background-image: none !important;
        }

        button::after,
        button::before {
          display: none !important;
          content: none !important;
        }

        button::-ms-expand {
          display: none;
        }

        .user-header {
          background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: .75rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .logo-section:hover {
          transform: translateY(-2px);
        }

        .logo-icon {
          width: 42px;
          height: 42px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .logo-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }

        .logo-text {
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.5px;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          flex: 1;
          margin-left: 3rem;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .nav-link.active {
          color: white;
          background: rgba(255, 255, 255, 0.15);
          font-weight: 600;
        }

        .profile-dropdown { 
          position: relative; 
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .profile-trigger:hover { 
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .user-name { 
          font-size: .875rem; 
          font-weight: 600; 
          color: white;
        }
        
        .user-email { 
          font-size: .75rem; 
          color: rgba(255, 255, 255, 0.8); 
        }

        .dropdown-arrow {
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.8);
          transition: transform .3s ease;
        }

        .dropdown-arrow.open { 
          transform: rotate(180deg);
          color: white;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          min-width: 240px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-15px);
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          z-index: 1000;
        }

        .dropdown-menu.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: 14px 16px;
          font-size: .9rem;
          color: #374151;
          text-align: left;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
        }

        .dropdown-item:hover {
          background: #f9fafb;
          padding-left: 20px;
          color: #1f2937;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item.logout { 
          color: #dc2626; 
        }
        
        .dropdown-item.logout:hover { 
          background: #fee2e2;
          color: #b91c1c;
        }

        .dropdown-item span:first-child {
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .header-container {
            padding: 0 1rem;
          }
          
          .logo-text {
            font-size: 1.2rem;
          }
        }

        /* Animation for logo */
        @keyframes logoGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.15);
          }
        }

        .logo-icon {
          animation: logoGlow 3s ease-in-out infinite;
        }
      `}</style>

      <header className="user-header">
        <div className="header-container">
          <div className="logo-section" onClick={() => navigate('/home')}>
            <div className="logo-icon">
              <img src={LogoImage} alt="RubberSense Logo" className="logo-image" />
            </div>
            <span className="logo-text">RubberSense</span>
          </div>

          <nav className="nav-links">
            {navigationItems.map((item, i) => (
              <div key={i} className="nav-link" onClick={() => navigate(item.path)}>
                {item.label}
              </div>
            ))}
          </nav>

          <div className="user-section">
            <div className="profile-dropdown">
              <button className="profile-trigger" onClick={toggleProfileMenu}>
                <div className="user-avatar">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt="avatar" className="avatar-image" />
                  ) : (
                    getUserInitials(getUserDisplayName())
                  )}
                </div>

                <div className="user-info">
                  <div className="user-name">{getUserDisplayName()}</div>
                  <div className="user-email">{getUserEmail()}</div>
                </div>

                <svg className={`dropdown-arrow ${profileMenuOpen ? 'open' : ''}`} viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              <div className={`dropdown-menu ${profileMenuOpen ? 'show' : ''}`}>
                {profileMenuItems.map((item, i) => (
                  <button key={i} className={`dropdown-item ${item.isLogout ? 'logout' : ''}`} onClick={item.action}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default UserHeader;