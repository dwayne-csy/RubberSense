import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LogoImage from '../logo/LOGO.png';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MailIcon from '@mui/icons-material/Mail';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MessageIcon from '@mui/icons-material/Message';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const UserHeader = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({
    mail: 0,
    messages: 0,
    notifications: 0
  });
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Create axios instance with interceptors
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.get('/api/v1/users/me');

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
  }, [navigate]);

  // Enhanced unread counts fetching
  const fetchUnreadCounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const newUnreadCounts = { mail: 0, messages: 0, notifications: 0 };
      
      console.log('🔔 Fetching unread counts...');
      
      // ================== FETCH MAIL UNREAD COUNT ==================
      try {
        // Try the endpoint from your Mail.jsx component
        const mailResponse = await api.get('/api/v1/contact/user/replies');
        console.log('📧 Mail response:', mailResponse.data);
        
        if (mailResponse.data.success) {
          // Calculate unread messages
          const messages = mailResponse.data.data || [];
          
          // Check for unread messages
          const hasUnreadAdminReplies = (message) => {
            if (!message.userReplies || message.userReplies.length === 0) {
              return message.reply && !message.readByUser;
            }
            return message.userReplies.some(userReply => 
              userReply.adminReplies && userReply.adminReplies.some(adminReply => !adminReply.readByUser)
            );
          };

          const unreadMessages = messages.filter(msg => {
            return !msg.isRead || hasUnreadAdminReplies(msg);
          });

          newUnreadCounts.mail = unreadMessages.length;
          console.log(`📧 Found ${newUnreadCounts.mail} unread mail items`);
        }
      } catch (mailError) {
        console.log('📧 Using mail specific unread endpoint...');
        try {
          const unreadCountResponse = await api.get('/api/v1/contact/user/unread/count');
          if (unreadCountResponse.data.success) {
            newUnreadCounts.mail = unreadCountResponse.data.data?.unreadMessages || 0;
          }
        } catch (altError) {
          console.log('📧 Mail endpoints not available');
        }
      }
      
      // ================== FETCH ANNOUNCEMENTS UNREAD COUNT ==================
      try {
        const announcementsResponse = await api.get('/api/v1/mail/announcements');
        if (announcementsResponse.data.success) {
          const announcements = announcementsResponse.data.data || [];
          const unreadAnnouncements = announcements.filter(ann => {
            return !ann.readBy || !ann.readBy.some(read => read.userId);
          });
          
          newUnreadCounts.mail += unreadAnnouncements.length;
          console.log(`📢 Found ${unreadAnnouncements.length} unread announcements`);
        }
      } catch (announcementsError) {
        console.log('📢 Announcements endpoint not available');
      }
      
      // ================== FETCH MESSAGES UNREAD COUNT ==================
      try {
        const messagesResponse = await api.get('/api/v1/messages/unread-count');
        console.log('💬 Messages unread response:', messagesResponse.data);
        if (messagesResponse.data.success) {
          newUnreadCounts.messages = messagesResponse.data.data?.unreadCount || 
                                   messagesResponse.data.unreadCount || 0;
        }
      } catch (messagesError) {
        console.log('💬 Messages endpoint not available, trying conversations...');
        try {
          const convResponse = await api.get('/api/v1/messages/conversations');
          if (convResponse.data.success) {
            const conversations = convResponse.data.acceptedConversations || [];
            const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
            newUnreadCounts.messages = totalUnread;
          }
        } catch (convError) {
          console.log('💬 No messages unread count available');
        }
      }
      
      // ================== FETCH NOTIFICATIONS UNREAD COUNT ==================
      try {
        const notificationsResponse = await api.get('/api/v1/notifications/unread-count');
        console.log('🔔 Notifications unread response:', notificationsResponse.data);
        
        if (notificationsResponse.data.success) {
          // Try different response formats
          const responseData = notificationsResponse.data;
          newUnreadCounts.notifications = responseData.data?.unreadCount || 
                                         responseData.unreadCount || 
                                         responseData.data?.count || 
                                         responseData.count || 0;
        }
      } catch (notificationsError) {
        console.log('🔔 Notifications endpoint not available, trying alternative...');
        try {
          // Try fetching all notifications and count unread
          const allNotificationsResponse = await api.get('/api/v1/notifications', {
            params: { page: 1, limit: 100 }
          });
          
          if (allNotificationsResponse.data.success) {
            const notifications = allNotificationsResponse.data.data || [];
            const unreadNotifications = notifications.filter(notification => !notification.isRead);
            newUnreadCounts.notifications = unreadNotifications.length;
          }
        } catch (altError) {
          console.log('🔔 No notifications count available');
        }
      }
      
      // Update state with new counts
      setUnreadCounts(newUnreadCounts);
      console.log('✅ Final unread counts:', newUnreadCounts);
      
      // Return counts for immediate use if needed
      return newUnreadCounts;
      
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      return unreadCounts; // Return current counts on error
    }
  };

  // Fetch counts on mount and setup polling.
  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
      
      // Poll every 30 seconds for updates
      const intervalId = setInterval(fetchUnreadCounts, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);
  const toggleFeaturesMenu = () => setFeaturesMenuOpen(!featuresMenuOpen);

  const navigationItems = [
    { label: 'Home', path: '/home' },
    { label: 'About Us', path: '/about' },
    { label: 'Features', isDropdown: true },
    { label: 'About Rubber', path: '/about-rubber' },
    { label: 'Contact Us', path: '/contact-us' },
  ];

  const featuresMenuItems = [
    { label: 'Latex Detection', path: '/latex-detection' },
    { label: 'Trunks Detection', path: '/trunks-detection' },
    { label: 'Leaf Detection', path: '/leaf-detection' },
    { label: 'Community Blogspot', path: '/community-blogspot' },
    { label: 'Maps', path: '/maps' },
    { label: 'Weather', path: '/weather' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Profile menu items with badge indicators
  const profileMenuItems = [
    { 
      label: 'Profile', 
      icon: AccountCircleIcon, 
      action: () => navigate('/profile'),
      badgeCount: 0,
      showBadgeDot: false
    },
    { 
      label: 'Mail', 
      icon: MailIcon, 
      action: () => {
        navigate('/mail');
        // Clear mail badge when clicked
        setUnreadCounts(prev => ({ ...prev, mail: 0 }));
      },
      badgeCount: unreadCounts.mail,
      showBadgeDot: unreadCounts.mail > 0
    },
    {
      label: 'Market Page',
      icon: TrendingUpIcon,
      action: () => navigate('/market'),
      badgeCount: 0,
      showBadgeDot: false
    },
    { 
      label: 'Messages', 
      icon: MessageIcon, 
      action: () => {
        navigate('/messages');
        // Clear messages badge when clicked
        setUnreadCounts(prev => ({ ...prev, messages: 0 }));
      },
      badgeCount: unreadCounts.messages,
      showBadgeDot: unreadCounts.messages > 0
    },
    { 
      label: 'Notification', 
      icon: NotificationsIcon, 
      action: () => {
        navigate('/notifications');
        // Clear notifications badge when clicked
        setUnreadCounts(prev => ({ ...prev, notifications: 0 }));
      },
      badgeCount: unreadCounts.notifications,
      showBadgeDot: unreadCounts.notifications > 0
    },
    { 
      label: 'Recent Analysis', 
      icon: AssessmentIcon, 
      action: () => navigate('/analysis/history'),
      badgeCount: 0,
      showBadgeDot: false
    },
    { 
      label: 'Settings', 
      icon: SettingsIcon, 
      action: () => navigate('/settings'),
      badgeCount: 0,
      showBadgeDot: false
    },
    { 
      label: 'Log out', 
      icon: LogoutIcon, 
      isLogout: true, 
      action: () => handleLogout(),
      badgeCount: 0,
      showBadgeDot: false
    }
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
      if (featuresMenuOpen && !event.target.closest('.features-dropdown')) {
        setFeaturesMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileMenuOpen, featuresMenuOpen]);

  // Calculate if there are any unread items
  const hasAnyUnread = unreadCounts.mail > 0 || unreadCounts.messages > 0 || unreadCounts.notifications > 0;

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

        .nav-link-with-arrow {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .profile-dropdown, .features-dropdown { 
          position: relative; 
        }

        .profile-trigger, .features-trigger {
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

        .features-trigger {
          gap: 6px;
        }

        .profile-trigger:hover, .features-trigger:hover { 
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
          position: relative;
        }

        /* Red dot on avatar for any unread items */
        .user-avatar.has-unread::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background-color: #ff4444;
          border-radius: 50%;
          border: 2px solid #2d6a4f;
          animation: pulse 2s infinite;
          z-index: 2;
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

        .profile-dropdown .dropdown-menu {
          right: 0;
        }

        .features-dropdown .dropdown-menu {
          left: 0;
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
          justify-content: space-between;
          padding: 12px 16px;
          font-size: 0.95rem;
          color: #374151;
          text-align: left;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
        }

        .dropdown-item:hover {
          background: #f9fafb;
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

        .dropdown-item-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .dropdown-item .mui-icon {
          width: 20px;
          height: 20px;
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .dropdown-item.logout .mui-icon {
          color: #dc2626;
        }

        .dropdown-item.logout:hover .mui-icon {
          color: #b91c1c;
        }

        /* Red dot for icons with unread items */
        .badge-dot {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 10px;
          height: 10px;
          background-color: #ff4444;
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse 2s infinite;
          z-index: 2;
        }

        .badge-count {
          background-color: #ff4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        .dropdown-item:hover .badge-count {
          background-color: #ff0000;
        }

        .user-section {
          display: flex;
          align-items: center;
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

        /* Animations */
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

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7);
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          70% {
            box-shadow: 0 0 0 5px rgba(255, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 68, 68, 0);
            transform: scale(1);
          }
        }

        .logo-icon {
          animation: logoGlow 3s ease-in-out infinite;
        }

        /* Notification indicator on Notifications icon */
        .notification-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .notification-badge.has-unread::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: #ff4444;
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse 2s infinite;
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
              item.isDropdown ? (
                <div key={i} className="features-dropdown">
                  <button className="nav-link nav-link-with-arrow features-trigger" onClick={toggleFeaturesMenu}>
                    <span>{item.label}</span>
                    <ExpandMoreIcon className={`dropdown-arrow ${featuresMenuOpen ? 'open' : ''}`} />
                  </button>
                  <div className={`dropdown-menu ${featuresMenuOpen ? 'show' : ''}`}>
                    {featuresMenuItems.map((feature, idx) => (
                      <button 
                        key={idx} 
                        className="dropdown-item" 
                        onClick={() => {
                          setFeaturesMenuOpen(false);
                          navigate(feature.path);
                        }}
                      >
                        <span>{feature.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={i} className="nav-link" onClick={() => navigate(item.path)}>
                  {item.label}
                </div>
              )
            ))}
          </nav>

          <div className="user-section">
            <div className="profile-dropdown">
              <button className="profile-trigger" onClick={toggleProfileMenu}>
                <div className={`user-avatar ${hasAnyUnread ? 'has-unread' : ''}`}>
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

                <ExpandMoreIcon className={`dropdown-arrow ${profileMenuOpen ? 'open' : ''}`} />
              </button>

              <div className={`dropdown-menu ${profileMenuOpen ? 'show' : ''}`}>
                {profileMenuItems.map((item, i) => {
                  const IconComponent = item.icon;
                  const hasUnreadNotification = item.label === 'Notification' && unreadCounts.notifications > 0;
                  
                  return (
                    <button 
                      key={i} 
                      className={`dropdown-item ${item.isLogout ? 'logout' : ''}`} 
                      onClick={item.action}
                    >
                      <div className="dropdown-item-content">
                        <span className={`mui-icon ${hasUnreadNotification ? 'notification-badge has-unread' : ''}`}>
                          <IconComponent fontSize="small" />
                          {item.showBadgeDot && <span className="badge-dot"></span>}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badgeCount > 0 && item.label !== 'Log out' && (
                        <span className="badge-count">{item.badgeCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default UserHeader;
