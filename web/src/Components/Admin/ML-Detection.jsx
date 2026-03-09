import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLatexDetection from './mldetection/AdminLatexDetection';
import AdminLeafDetection from './mldetection/AdminLeafDetection';
import AdminTrunksDetection from './mldetection/AdminTrunksDetection';
import LeftNavigationBar from '../layouts/LeftNavigationBar';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Grass as GrassIcon,
  Park as ParkIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ── Global Styles (matching MarketPrice design system) ────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --green-dark:  #1b5e20;
    --green-mid:   #2e7d32;
    --green-light: #43a047;
    --green-pale:  #e8f5e9;
    --accent:      #00bfa5;
    --grey-dark:   #37474f;
    --grey-mid:    #607d8b;
    --grey-light:  #eceff1;
    --white:       #ffffff;
    --shadow-sm:   0 2px 8px rgba(0,0,0,.08);
    --shadow-md:   0 6px 24px rgba(0,0,0,.12);
    --radius:      14px;
  }

  /* ── HERO ──────────────────────────────────────────────── */
  .ml-hero {
    position: relative; height: 220px; border-radius: var(--radius);
    overflow: hidden; margin-bottom: 32px;
    display: flex; align-items: flex-end; padding: 28px 32px;
  }
  .ml-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 40%; filter: brightness(.52);
  }
  .ml-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(27,94,32,.78) 0%, rgba(0,191,165,.32) 100%);
  }
  .ml-hero-content { position: relative; z-index: 1; }
  .ml-hero-title {
    font-family: 'Playfair Display', serif; font-size: 2.2rem;
    color: #fff; margin: 0 0 4px; line-height: 1.1; letter-spacing: -.5px;
  }
  .ml-hero-sub {
    font-family: 'DM Sans', sans-serif; font-size: .92rem;
    color: rgba(255,255,255,.8); margin: 0; font-weight: 300;
  }
  .ml-hero-icon {
    position: absolute; top: 20px; right: 24px; z-index: 1;
    opacity: .18; color: #fff;
  }

  /* ── TABS PANEL ─────────────────────────────────────────── */
  .ml-tabs-paper {
    border-radius: 16px !important;
    overflow: hidden;
    border: 1.5px solid #e0e7ef !important;
    box-shadow: var(--shadow-sm) !important;
    font-family: 'DM Sans', sans-serif;
  }
`;

// ── BiotechIcon SVG ───────────────────────────────────────────────────────────
const BiotechSVG = ({ size = 110 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 19c-1.1 0-2 .9-2 2h14c0-1.1-.9-2-2-2h-4v-2h3c1.1 0 2-.9 2-2H8c-1.66 0-3-1.34-3-3 0-1.4.97-2.59 2.27-2.91C7.1 9.41 7 9.21 7 9c0-.55.22-1.05.58-1.42C6.63 7.12 6 8.01 6 9.07 4.23 9.54 3 11.14 3 13c0 2.21 1.79 4 4 4h1v2H7zm14.25-3.26c.46-.33.75-.87.75-1.47 0-1.49-1.23-2.04-2.5-2.04-1.27 0-1.75.68-1.75.68l.57 1.4s.43-.6 1.18-.6c.63 0 1 .35 1 .83 0 .53-.41.84-1.08.84H18v1.42h1.42c.74 0 1.08.31 1.08.99 0 .66-.53 1.11-1.28 1.11-.91 0-1.53-.76-1.53-.76l-.57 1.4s.73.88 2.12.88c1.5 0 2.76-.85 2.76-2.29 0-.78-.44-1.4-1.11-1.7zM11 7l1-2 1 2-2 2 2 2-1 2-1-2 2-2z"/>
  </svg>
);

// ── Tab Panel ─────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-detection-tabpanel-${index}`}
      aria-labelledby={`ml-detection-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const MLDetection = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!token || user.role !== 'admin') {
        navigate('/admin/login');
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, API_BASE_URL]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const tabs = [
    { label: 'Latex Analysis',  icon: <ScienceIcon />, component: <AdminLatexDetection />,  color: '#2e7d32' },
    { label: 'Leaf Analysis',   icon: <GrassIcon />,   component: <AdminLeafDetection />,   color: '#2e7d32' },
    { label: 'Trunk Analysis',  icon: <ParkIcon />,    component: <AdminTrunksDetection />, color: '#8B4513' },
  ];

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>
        <LeftNavigationBar onCollapse={handleSidebarCollapse} />
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh',
          ml: sidebarCollapsed ? '65px' : '240px',
          transition: 'margin-left 0.3s ease',
          bgcolor: '#f0f4f8'
        }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <CircularProgress size={52} thickness={3} sx={{ color: '#2e7d32' }} />
          </motion.div>
        </Box>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <LeftNavigationBar onCollapse={handleSidebarCollapse} />

      <div style={{
        marginLeft: sidebarCollapsed ? 65 : 240,
        padding: '28px 32px',
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        transition: 'margin-left 0.3s ease',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>

          {/* ── Hero Banner ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="ml-hero">
              <img
                className="ml-hero-img"
                src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80"
                alt="Machine Learning"
              />
              <div className="ml-hero-overlay" />
              <div className="ml-hero-content">
                <h1 className="ml-hero-title">ML Detection System</h1>
                <p className="ml-hero-sub">AI-powered analysis for Latex, Leaf, and Trunk detection using trained YOLO models</p>
              </div>
              <div className="ml-hero-icon">
                <BiotechSVG size={110} />
              </div>
            </div>
          </motion.div>

          {/* ── Tabs Panel ── */}
          <Paper elevation={0} className="ml-tabs-paper">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: '#fafafa',
                '& .MuiTab-root': {
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif"
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{
                    color: activeTab === index ? tab.color : 'text.secondary',
                    '&.Mui-selected': { color: tab.color },
                  }}
                />
              ))}
            </Tabs>

            <Box sx={{ p: 2 }}>
              {tabs.map((tab, index) => (
                <TabPanel key={index} value={activeTab} index={index}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {tab.component}
                    </motion.div>
                  </AnimatePresence>
                </TabPanel>
              ))}
            </Box>
          </Paper>

        </Container>
      </div>
    </>
  );
};

export default MLDetection;