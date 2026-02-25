import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoImage from '../logo/LOGO.png';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const LandingHeader = () => {
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const navigationItems = [
    { label: 'Home', path: '/landinghome' },
    { label: 'About Us', path: '/landingabout' },
    { label: 'Features', isDropdown: true },
    { label: 'About Rubber', path: '/landingrubber' },
    { label: 'Contact Us', path: '/landingcontact' },
  ];

  const featuresMenuItems = [
    { label: 'Latex Detection', path: '/latex-detection' },
    { label: 'Trunks Detection', path: '/trunks-detection' },
    { label: 'Leaf Detection', path: '/leaf-detection' },
    { label: 'Community Blogspot', path: '/community-blogspot' },
    { label: 'Maps', path: '/maps' },
    { label: 'Weather', path: '/weather' }
  ];

  const toggleFeaturesMenu = () => setFeaturesMenuOpen(!featuresMenuOpen);

  const handleFeatureClick = (path) => {
    setFeaturesMenuOpen(false);
    // For now, navigate to login for feature items
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSignUp = () => {
    navigate('/login');
  };

  // Check if a path is active
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFeaturesMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <style>{`
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
        }

        .landing-header {
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
          animation: logoGlow 3s ease-in-out infinite;
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
          gap: 1.5rem;
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
          position: relative;
          text-decoration: none;
          background: none;
          border: none;
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
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Add an indicator for active link */
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          background: white;
          border-radius: 2px;
          animation: slideIn 0.3s ease;
        }

        .nav-link-with-arrow {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .features-dropdown { 
          position: relative; 
        }

        .features-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .features-trigger:hover { 
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .dropdown-arrow {
          width: 20px;
          height: 20px;
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
          left: 0;
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
          z-index: 1001;
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
          padding: 12px 16px;
          font-size: 0.95rem;
          color: #374151;
          text-align: left;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
          background: white;
          border: none;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: #f9fafb;
          color: #1f2937;
          padding-left: 20px;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .signup-section {
          display: flex;
          align-items: center;
        }

        .signup-button {
          background: white;
          color: #1a472a;
          font-weight: 600;
          padding: 8px 24px;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          cursor: pointer;
        }

        .signup-button:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          border-color: white;
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
          
          .dropdown-menu {
            min-width: 200px;
          }
        }

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

        @keyframes slideIn {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 20px;
            opacity: 1;
          }
        }
      `}</style>

      <header className="landing-header">
        <div className="header-container">
          <div className="logo-section" onClick={() => handleNavigation('/')}>
            <div className="logo-icon">
              <img src={LogoImage} alt="RubberSense Logo" className="logo-image" />
            </div>
            <span className="logo-text">RubberSense</span>
          </div>

          <nav className="nav-links">
            {navigationItems.map((item, i) => (
              item.isDropdown ? (
                <div key={i} className="features-dropdown" ref={dropdownRef}>
                  <button 
                    className="nav-link nav-link-with-arrow features-trigger" 
                    onClick={toggleFeaturesMenu}
                    type="button"
                  >
                    <span>{item.label}</span>
                    <ExpandMoreIcon className={`dropdown-arrow ${featuresMenuOpen ? 'open' : ''}`} />
                  </button>
                  <div className={`dropdown-menu ${featuresMenuOpen ? 'show' : ''}`}>
                    {featuresMenuItems.map((feature, idx) => (
                      <button 
                        key={idx} 
                        className="dropdown-item" 
                        onClick={() => handleFeatureClick(feature.path)}
                        type="button"
                      >
                        {feature.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button 
                  key={i} 
                  className={`nav-link ${isActivePath(item.path) ? 'active' : ''}`} 
                  onClick={() => handleNavigation(item.path)}
                  type="button"
                >
                  {item.label}
                </button>
              )
            ))}
          </nav>

          <div className="signup-section">
            <button className="signup-button" onClick={handleSignUp} type="button">
              Sign In
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default LandingHeader;