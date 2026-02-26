// RubberSense/Web/src/Components/Admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const UsersIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MegaphoneIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z"/>
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
);

const AnalysisIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2"/><path d="M7 10l3-3 3 3 4-4"/>
    <path d="M17 10V4h-6"/><path d="M21 12h-4"/>
  </svg>
);

const InboxIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
  </svg>
);

const FlagIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const ArrowRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const TrendingUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8 10 1 17"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, verified: 0 },
    announcements: { total: 0, published: 0, important: 0 },
    analyses: { total: 0, latex: 0, leaf: 0, trunk: 0 },
    messages: { total: 0, unread: 0, read: 0 },
    reports: { total: 0, pending: 0, resolved: 0 }
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const slides = [
    {
      id: 1,
      video: '/src/Components/slidingpics/slide1.mp4',
      alt: 'Rubber Tree Plantation',
      title: 'Efficient Tree Tapping Operations',
      description: 'Professional latex extraction with modern technology'
    },
    {
      id: 2,
      video: '/src/Components/slidingpics/slide2.mp4',
      alt: 'Latex Collection',
      title: 'Premium Latex Collection',
      description: 'High-quality latex from healthy rubber trees'
    },
    {
      id: 3,
      video: '/src/Components/slidingpics/slide3.mp4',
      alt: 'Plantation Management',
      title: 'Smart Plantation Management',
      description: 'Advanced monitoring for optimal growth conditions'
    },
    {
      id: 4,
      video: '/src/Components/slidingpics/slide4.mp4',
      alt: 'Sustainable Farming',
      title: 'Sustainable Rubber Farming',
      description: 'Eco-friendly practices for long-term yield'
    }
  ];

  // Fetch all statistics
  const fetchAllStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch users stats
      const usersRes = await axios.get(`${API_BASE_URL}/api/v1/users`);
      if (usersRes.data.success) {
        const nonAdminUsers = usersRes.data.users.filter(u => u.role !== 'admin');
        setStats(prev => ({
          ...prev,
          users: {
            total: nonAdminUsers.length,
            active: nonAdminUsers.filter(u => u.isActive).length,
            verified: nonAdminUsers.filter(u => u.isVerified).length
          }
        }));
      }

      // Fetch announcements stats
      try {
        const announcementsRes = await axios.get(`${API_BASE_URL}/api/v1/mail/admin/announcements/stats`);
        if (announcementsRes.data.success) {
          setStats(prev => ({
            ...prev,
            announcements: {
              total: announcementsRes.data.data.total || 0,
              published: announcementsRes.data.data.published || 0,
              important: announcementsRes.data.data.important || 0
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching announcements stats:', error);
      }

      // Fetch contact messages stats
      try {
        const messagesRes = await axios.get(`${API_BASE_URL}/api/v1/contact/admin`);
        if (messagesRes.data.success) {
          const messages = messagesRes.data.data;
          setStats(prev => ({
            ...prev,
            messages: {
              total: messages.length,
              unread: messages.filter(m => m.status === 'unread').length,
              read: messages.filter(m => m.status === 'read' || m.status === 'replied' || m.status === 'conversation').length
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching messages stats:', error);
      }

      // Fetch analyses stats
      try {
        const analysesRes = await axios.get(`${API_BASE_URL}/api/v1/admin`, {
          params: { page: 1, limit: 1000 }
        });
        if (analysesRes.data.success) {
          const analyses = analysesRes.data.data;
          setStats(prev => ({
            ...prev,
            analyses: {
              total: analyses.length,
              latex: analyses.filter(a => a.analysisType === 'latex').length,
              leaf: analyses.filter(a => a.analysisType === 'leaf').length,
              trunk: analyses.filter(a => a.analysisType === 'trunk').length
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching analyses stats:', error);
      }

      // Fetch reports stats
      try {
        const reportsRes = await axios.get(`${API_BASE_URL}/api/v1/admin/reports`, {
          params: { page: 1, limit: 1000 }
        });
        if (reportsRes.data.success) {
          const reports = reportsRes.data.data;
          setStats(prev => ({
            ...prev,
            reports: {
              total: reports.length,
              pending: reports.filter(r => r.status === 'pending').length,
              resolved: reports.filter(r => r.status === 'resolved').length
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching reports stats:', error);
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (response.data.success) {
          setUser(response.data.user);
          await fetchAllStats();
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, API_BASE_URL]);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Stat cards data
  const statCards = [
    {
      id: 'users',
      title: 'Total Users',
      count: stats.users.total,
      subCounts: [
        { label: 'Active', value: stats.users.active, color: '#4caf50' },
        { label: 'Verified', value: stats.users.verified, color: '#ff9800' }
      ],
      icon: UsersIcon,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      path: '/admin/users'
    },
    {
      id: 'announcements',
      title: 'Announcements',
      count: stats.announcements.total,
      subCounts: [
        { label: 'Published', value: stats.announcements.published, color: '#00acc1' },
        { label: 'Important', value: stats.announcements.important, color: '#ffb300' }
      ],
      icon: MegaphoneIcon,
      color: '#00acc1',
      bgColor: '#e0f7fa',
      path: '/admin/announcements'
    },
    {
      id: 'analyses',
      title: 'Analyses',
      count: stats.analyses.total,
      subCounts: [
        { label: 'Latex', value: stats.analyses.latex, color: '#2e7d32' },
        { label: 'Leaf', value: stats.analyses.leaf, color: '#4caf50' },
        { label: 'Trunk', value: stats.analyses.trunk, color: '#ff9800' }
      ],
      icon: AnalysisIcon,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
      path: '/admin/analysis-logs'
    },
    {
      id: 'messages',
      title: 'Contact Messages',
      count: stats.messages.total,
      subCounts: [
        { label: 'Unread', value: stats.messages.unread, color: '#e53935' },
        { label: 'Read', value: stats.messages.read, color: '#00acc1' }
      ],
      icon: InboxIcon,
      color: '#e53935',
      bgColor: '#ffebee',
      path: '/admin/contact-messages'
    },
    {
      id: 'reports',
      title: 'User Reports',
      count: stats.reports.total,
      subCounts: [
        { label: 'Pending', value: stats.reports.pending, color: '#ffb300' },
        { label: 'Resolved', value: stats.reports.resolved, color: '#4caf50' }
      ],
      icon: FlagIcon,
      color: '#ff9800',
      bgColor: '#fff8e1',
      path: '/admin/user-reports'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNavigationBar />
        <div style={{
          flex: 1,
          marginLeft: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #e8f5e9',
              borderTopColor: '#2e7d32',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#607d8b', fontFamily: "'DM Sans', sans-serif" }}>Loading Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left Navigation Bar */}
        <LeftNavigationBar />

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          marginLeft: '280px',
          backgroundColor: '#f5f5f5',
          fontFamily: "'DM Sans', sans-serif"
        }}>

          {/* ── HERO CAROUSEL ── */}
          <div style={{
            position: 'relative',
            height: '480px',
            width: '100%',
            overflow: 'hidden',
            background: '#0d2818'
          }}>
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  opacity: index === currentSlide ? 1 : 0,
                  transition: 'opacity 1s ease-in-out',
                  pointerEvents: index === currentSlide ? 'auto' : 'none'
                }}
              >
                <video
                  key={slide.video}
                  autoPlay muted loop playsInline
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                >
                  <source src={slide.video} type="video/mp4" />
                </video>

                {/* Overlays */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(13,40,24,0.75) 0%, rgba(13,40,24,0.3) 50%, rgba(13,40,24,0.6) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,40,24,0.9) 0%, transparent 50%)' }} />

                {/* Hero Text */}
                <div style={{
                  position: 'absolute',
                  bottom: '60px',
                  left: '8%',
                  zIndex: 2,
                  maxWidth: '640px',
                  animation: index === currentSlide ? 'heroSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) both' : 'none'
                }}>
                  <h2 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    marginBottom: '12px',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: '700',
                    color: '#ffffff',
                    lineHeight: '1.15',
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)'
                  }}>
                    {slide.title}
                  </h2>

                  <p style={{
                    fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
                    marginBottom: '24px',
                    color: 'rgba(255,255,255,0.82)',
                    lineHeight: '1.6',
                    fontWeight: '300'
                  }}>
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Prev Arrow */}
            <button
              onClick={goToPrevSlide}
              style={{
                position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                width: '44px', height: '44px', borderRadius: '50%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: '300', zIndex: 10,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,181,74,0.5)'; e.currentTarget.style.borderColor = '#4ab54a'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >‹</button>

            {/* Next Arrow */}
            <button
              onClick={goToNextSlide}
              style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                width: '44px', height: '44px', borderRadius: '50%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: '300', zIndex: 10,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,181,74,0.5)'; e.currentTarget.style.borderColor = '#4ab54a'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >›</button>

            {/* Dot Indicators */}
            <div style={{
              position: 'absolute', bottom: '20px', left: '8%',
              display: 'flex', gap: '8px', zIndex: 10, alignItems: 'center'
            }}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: index === currentSlide ? '32px' : '8px',
                    height: '6px',
                    borderRadius: '3px',
                    border: 'none',
                    background: index === currentSlide ? '#4ab54a' : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    padding: 0
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── STATISTICS SECTION ── */}
          <div style={{ padding: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.8rem',
                  color: '#37474f',
                  margin: '0 0 4px'
                }}>
                  Dashboard Overview
                </h2>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#607d8b',
                  margin: 0
                }}>
                  Real-time statistics of your platform
                </p>
              </div>
              <button
                onClick={fetchAllStats}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #cfd8dc',
                  borderRadius: '8px',
                  color: '#37474f',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5e9'; e.currentTarget.style.borderColor = '#2e7d32'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cfd8dc'; }}
              >
                <TrendingUpIcon size={14} /> Refresh Stats
              </button>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {statCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={card.id}
                    onClick={() => navigateTo(card.path)}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: '1.5px solid #e0e7ef',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
                      e.currentTarget.style.borderColor = card.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                      e.currentTarget.style.borderColor = '#e0e7ef';
                    }}
                  >
                    {/* Decorative gradient line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: card.color,
                      borderRadius: '4px 0 0 4px',
                      opacity: 0.2
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{
                          fontSize: '0.9rem',
                          color: '#607d8b',
                          margin: '0 0 6px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {card.title}
                        </h3>
                        <p style={{
                          fontSize: '2.2rem',
                          fontWeight: '700',
                          color: '#37474f',
                          margin: 0,
                          lineHeight: 1
                        }}>
                          {card.count.toLocaleString()}
                        </p>
                      </div>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: card.bgColor,
                        color: card.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComponent size={26} />
                      </div>
                    </div>

                    {/* Sub-stats */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1.5px solid #eceff1'
                    }}>
                      {card.subCounts.map((sub, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '4px',
                            background: sub.color
                          }} />
                          <span style={{ fontSize: '0.8rem', color: '#607d8b' }}>{sub.label}:</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#37474f' }}>{sub.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* View details indicator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      marginTop: '12px',
                      color: '#90a4ae',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      View Details <ArrowRightIcon size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        * { box-sizing: border-box; }
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Dashboard;