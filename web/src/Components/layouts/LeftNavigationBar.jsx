import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined,
  InboxOutlined,
  UserOutlined,
  NotificationOutlined,
  MessageOutlined,
  LogoutOutlined 
} from '@ant-design/icons';

// Import the logo
import Logo from '../logo/LOGO.png';

const LeftNavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current menu key from pathname
  const getCurrentMenuKey = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/report-inbox')) return 'report-inbox'; // Updated path
    if (path.includes('/users')) return 'users';
    if (path.includes('/announcements')) return 'announcement';
    if (path.includes('/contact-messages')) return 'contact-inquiry';
    return 'dashboard';
  };
  
  const [currentMenu, setCurrentMenu] = useState(getCurrentMenuKey());

  // Update current menu when location changes
  useEffect(() => {
    setCurrentMenu(getCurrentMenuKey());
  }, [location.pathname]);

  // All menu items with Ant Design icons - Updated Report Inbox
  const menuItems = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: <DashboardOutlined style={{ fontSize: '18px' }} /> 
    },
    { 
      key: 'report-inbox', 
      label: 'Report Inbox', 
      path: '/admin/user-reports', 
      icon: <InboxOutlined style={{ fontSize: '18px' }} />  // Updated icon
    },
    { 
      key: 'users', 
      label: 'Users', 
      path: '/admin/users', 
      icon: <UserOutlined style={{ fontSize: '18px' }} /> 
    },
    { 
      key: 'announcement', 
      label: 'Announcement', 
      path: '/admin/announcements', 
      icon: <NotificationOutlined style={{ fontSize: '18px' }} /> 
    },
    { 
      key: 'contact-inquiry', 
      label: 'Contact Inquiry', 
      path: '/admin/contact-messages', 
      icon: <MessageOutlined style={{ fontSize: '18px' }} /> 
    },
  ];

  const handleMenuClick = (key, path) => {
    setCurrentMenu(key);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={styles.sidebar}>
      {/* Logo Section */}
      <div 
        style={styles.logoContainer}
        onClick={() => navigate('/admin/dashboard')}
      >
        <div style={styles.logoWrapper}>
          <img 
            src={Logo} 
            alt="RubberSense Logo" 
            style={styles.logoImage}
          />
          <h1 style={styles.logoText}>RubberSense</h1>
        </div>
      </div>

      {/* Navigation Menu. */}
      <div style={styles.navigation}>
        {menuItems.map((item) => (
          <div
            key={item.key}
            className="nav-item"
            style={{
              ...styles.navItem,
              ...(currentMenu === item.key ? styles.activeNavItem : {})
            }}
            onClick={() => handleMenuClick(item.key, item.path)}
          >
            <span style={styles.navItemIcon}>{item.icon}</span>
            <span style={styles.navItemLabel}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Logout Section - Fixed at bottom */}
      <div style={styles.logoutSection}>
        <button onClick={handleLogout} style={styles.logoutButton} className="logout-button">
          <LogoutOutlined style={{ fontSize: '16px', marginRight: '10px' }} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '250px',
    height: '100vh',
    background: 'linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    padding: '30px 0 20px 0',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '3px 0 15px rgba(0, 0, 0, 0.2)',
  },
  logoContainer: {
    padding: '0 25px 30px 25px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: '30px',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoImage: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
    textAlign: 'left',
    letterSpacing: '0.5px',
  },
  navigation: {
    flex: 1,
    padding: '0 25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    marginBottom: '20px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '14px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left',
    background: 'rgba(255, 255, 255, 0.05)',
    marginBottom: '5px',
  },
  activeNavItem: {
    background: 'rgba(255, 255, 255, 0.15)',
    borderLeft: '4px solid #ffffff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  navItemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
  },
  navItemLabel: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#ffffff',
  },
  logoutSection: {
    padding: '0 25px',
    marginTop: 'auto',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
};

// Add hover effects
const hoverStyles = `
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    transform: translateX(3px);
  }
  
  .active-nav-item {
    background: rgba(255, 255, 255, 0.15) !important;
    border-left: 4px solid #ffffff !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  }
  
  .active-nav-item:hover {
    background: rgba(255, 255, 255, 0.2) !important;
  }
  
  .logout-button:hover {
    background: rgba(255, 255, 255, 0.25) !important;
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .logo-container:hover {
    opacity: 0.9;
  }
  
  .logo-wrapper:hover {
    transform: scale(1.02);
    transition: transform 0.3s ease;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerHTML = hoverStyles;
  document.head.appendChild(styleSheet);
}

export default LeftNavigationBar;