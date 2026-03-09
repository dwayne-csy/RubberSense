import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  InboxOutlined,
  UserOutlined,
  NotificationOutlined,
  MessageOutlined,
  LogoutOutlined,
  BarChartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

import Logo from '../logo/LOGO.png';

const LeftNavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentMenuKey = () => {
    const path = location.pathname;
    if (path.includes('/market-price')) return 'market-price';
    if (path.includes('/analysis-logs')) return 'analysis-logs';
    if (path.includes('/report-inbox') || path.includes('/user-reports')) return 'report-inbox';
    if (path.includes('/contact-messages')) return 'contact-inquiry';
    if (path.includes('/announcements')) return 'announcement';
    if (path.includes('/users')) return 'users';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/ml-detection')) return 'ml-detection';
    return '';
  };

  const [currentMenu, setCurrentMenu] = useState(getCurrentMenuKey());
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    setCurrentMenu(getCurrentMenuKey());
  }, [location.pathname]);

  const menuItems = [
    { key: 'dashboard',           label: 'Dashboard',           path: '/admin/dashboard',          icon: <DashboardOutlined /> },
    { key: 'report-inbox',        label: 'Report Inbox',        path: '/admin/user-reports',        icon: <InboxOutlined /> },
    { key: 'users',               label: 'Users',               path: '/admin/users',               icon: <UserOutlined /> },
    { key: 'analysis-logs',       label: 'Analysis Logs',       path: '/admin/analysis-logs',       icon: <FileTextOutlined /> },
    { key: 'ml-detection',         label: 'ML Detection',        path: '/admin/ml-detection',        icon: <DashboardOutlined /> }, // New ML Detection button
    { key: 'market-price',        label: 'Market Price',        path: '/admin/market-price',        icon: <span style={{ fontSize: '16px', fontWeight: 'bold' }}>₱</span> }, // Changed to peso sign
    { key: 'announcement',        label: 'Announcement',        path: '/admin/announcements',       icon: <NotificationOutlined /> },
    { key: 'contact-inquiry',     label: 'Contact Inquiry',     path: '/admin/contact-messages',    icon: <MessageOutlined /> },
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
    <>
      <style>{css}</style>
      <aside className="rs-sidebar">

        {/* Decorative blobs */}
        <div className="rs-blob rs-blob--top" />
        <div className="rs-blob rs-blob--bottom" />

        {/* ── Logo ─────────────────────────────── */}
        <div className="rs-logo" onClick={() => navigate('/admin/dashboard')}>
          <div className="rs-logo-badge">
            <img src={Logo} alt="RubberSense" className="rs-logo-img" />
          </div>
          <div className="rs-logo-text">
            <span className="rs-logo-name">RubberSense</span>
            <span className="rs-logo-role">Admin Portal</span>
          </div>
        </div>

        {/* ── Divider ──────────────────────────── */}
        <div className="rs-sep" />

        {/* ── Section label ────────────────────── */}
        <p className="rs-section-label">Navigation</p>

        {/* ── Menu ─────────────────────────────── */}
        <nav className="rs-nav">
          {menuItems.map((item) => {
            const isActive = currentMenu === item.key;
            return (
              <button
                key={item.key}
                className={`rs-item ${isActive ? 'rs-item--active' : ''}`}
                onClick={() => handleMenuClick(item.key, item.path)}
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {isActive && <span className="rs-item-bg" />}
                <span className={`rs-item-icon ${isActive ? 'rs-item-icon--active' : ''}`}>
                  {item.icon}
                </span>
                <span className="rs-item-label">{item.label}</span>
                {isActive && <span className="rs-item-arrow">›</span>}
              </button>
            );
          })}
        </nav>

        {/* ── Footer / Logout ───────────────────── */}
        <div className="rs-footer">
          <div className="rs-sep" style={{ marginBottom: '16px' }} />
          <button className="rs-logout" onClick={handleLogout}>
            <span className="rs-logout-icon-wrap">
              <LogoutOutlined />
            </span>
            <span className="rs-logout-text">Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

  .rs-sidebar {
    width: 268px;
    height: 100vh;
    position: fixed;
    left: 0; top: 0;
    display: flex;
    flex-direction: column;
    font-family: 'Outfit', sans-serif;
    z-index: 1000;
    overflow: hidden;
    background: linear-gradient(160deg, #1e5438 0%, #2d6a4f 45%, #1a4a38 100%);
    box-shadow: 6px 0 32px rgba(0,0,0,0.28);
  }

  .rs-blob {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(60px);
  }
  .rs-blob--top {
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(82,183,136,0.45), transparent);
    top: -60px; left: -40px;
  }
  .rs-blob--bottom {
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(27,67,50,0.7), transparent);
    bottom: -50px; right: -50px;
  }

  .rs-sidebar > *:not(.rs-blob) { position: relative; z-index: 1; }

  /* ── Logo ── */
  .rs-logo {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 28px 22px 22px;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }
  .rs-logo:hover { opacity: 0.85; }

  .rs-logo-badge {
    width: 46px; height: 46px;
    flex-shrink: 0;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.10));
    border: 1px solid rgba(255,255,255,0.25);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3);
  }

  .rs-logo-img {
    width: 26px; height: 26px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  .rs-logo-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .rs-logo-name {
    font-size: 19px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.3px;
    line-height: 1;
    white-space: nowrap;
  }

  .rs-logo-role {
    font-size: 10px;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    letter-spacing: 1.8px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Separator ── */
  .rs-sep {
    height: 1px;
    margin: 0 18px;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, transparent 100%);
  }

  /* ── Section label ── */
  .rs-section-label {
    margin: 0;
    padding: 16px 26px 8px;
    font-size: 9.5px;
    font-weight: 700;
    color: rgba(255,255,255,0.38);
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  /* ── Nav ── */
  .rs-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 4px 12px 8px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .rs-nav::-webkit-scrollbar { width: 3px; }
  .rs-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

  /* ── Nav item ── */
  .rs-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.62);
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: color 0.2s, transform 0.18s, background 0.2s;
    overflow: hidden;
  }

  .rs-item:hover:not(.rs-item--active) {
    color: rgba(255,255,255,0.92);
    transform: translateX(3px);
    background: rgba(255,255,255,0.07);
  }

  .rs-item--active {
    color: #ffffff;
    font-weight: 600;
  }

  .rs-item-bg {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: linear-gradient(100deg, rgba(255,255,255,0.17) 0%, rgba(255,255,255,0.08) 100%);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2);
    z-index: 0;
  }

  .rs-item-icon {
    position: relative;
    z-index: 1;
    width: 34px; height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    background: rgba(255,255,255,0.08);
    transition: background 0.2s, box-shadow 0.2s;
  }

  .rs-item:hover:not(.rs-item--active) .rs-item-icon {
    background: rgba(255,255,255,0.12);
  }

  .rs-item-icon--active {
    background: rgba(255,255,255,0.22) !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.35);
  }

  .rs-item-label {
    position: relative;
    z-index: 1;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rs-item-arrow {
    position: relative;
    z-index: 1;
    font-size: 20px;
    line-height: 1;
    color: rgba(255,255,255,0.55);
    margin-left: auto;
    flex-shrink: 0;
  }

  /* ── Footer / Logout ── */
  .rs-footer {
    padding: 0 12px 24px;
  }

  .rs-logout {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 14px;
    border-radius: 12px;
    border: 1px solid rgba(252,129,129,0.22);
    background: rgba(200,48,48,0.10);
    color: rgba(255,165,165,0.9);
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.22s ease;
    letter-spacing: 0.3px;
  }

  .rs-logout:hover {
    background: rgba(200,48,48,0.22);
    border-color: rgba(252,129,129,0.5);
    color: #ffb3b3;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(180,30,30,0.2);
  }

  .rs-logout:active { transform: translateY(0); box-shadow: none; }

  .rs-logout-icon-wrap {
    width: 34px; height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    background: rgba(252,129,129,0.14);
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .rs-logout:hover .rs-logout-icon-wrap {
    background: rgba(252,129,129,0.26);
  }

  .rs-logout-text { flex: 1; }
`;

export default LeftNavigationBar;