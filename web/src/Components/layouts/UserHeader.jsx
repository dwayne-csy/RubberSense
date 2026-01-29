import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
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
    { label: 'Contact Us', path: '/contact' }
  ];

  const profileMenuItems = [
    { label: 'Profile', icon: '👤', action: () => navigate('/profile') },
    { label: 'Recent Analysis', icon: '📊', action: () => navigate('/analysis') },
    { label: 'Settings', icon: '⚙️', action: () => navigate('/settings') },
    { label: 'Log out', icon: '🚪', isLogout: true, action: () => handleLogout() }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setProfileMenuOpen(false);
    navigate('/login');
  };

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
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: .75rem;
          cursor: pointer;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: #2d6a4f;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          flex: 1;
          margin-left: 3rem;
        }

        .nav-link {
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #2d6a4f;
        }

        .profile-dropdown { position: relative; }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .375rem .5rem;
          border-radius: 8px;
        }

        .profile-trigger:hover { background: #f9fafb; }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2d6a4f;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
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

        .user-name { font-size: .875rem; font-weight: 600; }
        .user-email { font-size: .75rem; color: #6b7280; }

        .dropdown-arrow {
          width: 16px;
          height: 16px;
          color: #9ca3af;
          transition: transform .2s ease;
        }

        .dropdown-arrow.open { transform: rotate(180deg); }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + .5rem);
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 15px rgba(0,0,0,.1);
          min-width: 220px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: .2s ease;
        }

        .dropdown-menu.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          gap: .75rem;
          padding: .75rem 1rem;
          font-size: .875rem;
        }

        .dropdown-item.logout { color: #dc2626; }
      `}</style>

      <header className="user-header">
        <div className="header-container">
          <div className="logo-section" onClick={() => navigate('/')}>
            <div className="logo-icon">RS</div>
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

                {/* Your custom arrow only */}
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
