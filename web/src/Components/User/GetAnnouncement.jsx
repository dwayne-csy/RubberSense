// RubberSense/Web/src/Components/User/GetAnnouncement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone, RefreshCw, Wrench, Newspaper, AlertTriangle, Pin,
  Star, Calendar, ChevronRight, X, Search, SlidersHorizontal,
  BarChart3, Bell, Clock, Loader2, Inbox, Leaf
} from 'lucide-react';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const TYPE_CONFIG = {
  announcement: { icon: Megaphone,      color: '#2d6a4f', bg: '#d8f3dc' },
  update:        { icon: RefreshCw,     color: '#1b4332', bg: '#b7e4c7' },
  maintenance:   { icon: Wrench,        color: '#6b705c', bg: '#e9edc9' },
  news:          { icon: Newspaper,     color: '#386641', bg: '#cddabd' },
  alert:         { icon: AlertTriangle, color: '#bc4749', bg: '#fde8e8' },
};

const PRIORITY_CONFIG = {
  urgent: { color: '#bc4749', bg: '#fde8e8', label: 'Urgent' },
  high:   { color: '#ca6702', bg: '#fff1e6', label: 'High'   },
  medium: { color: '#2d6a4f', bg: '#d8f3dc', label: 'Medium' },
  low:    { color: '#386641', bg: '#cddabd', label: 'Low'    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffDays = Math.floor((Date.now() - date) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatFullDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toast = ({ show, message, type }) => (
  <div style={{
    position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
    transform: show ? 'translateY(0)' : 'translateY(-120%)',
    opacity: show ? 1 : 0,
    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 18px', borderRadius: '10px',
    backgroundColor: type === 'success' ? '#1b4332' : '#7f1d1d',
    color: 'white', fontSize: '14px', fontWeight: '500',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    fontFamily: "'Lora', serif",
  }}>
    {type === 'success' ? <Leaf size={16} /> : <AlertTriangle size={16} />}
    {message}
  </div>
);

const StatCard = ({ icon: Icon, value, label, accent }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'white', padding: '20px 22px', borderRadius: '12px',
        boxShadow: hovered ? '0 6px 20px rgba(27,67,50,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: '14px',
        border: '1px solid #e9f5ee', transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        backgroundColor: accent + '18', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={accent} strokeWidth={1.75} />
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1b4332', lineHeight: 1.2, fontFamily: "'Lora', serif" }}>
          {value}
        </div>
        <div style={{ fontSize: '12.5px', color: '#6b705c', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>
          {label}
        </div>
      </div>
    </div>
  );
};

const AnnouncementRow = ({ announcement, onClick, index }) => {
  const isUnread = !announcement.readBy?.length;
  const isExpired = announcement.expiryDate && new Date(announcement.expiryDate) < new Date();
  const typeConf = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.announcement;
  const priorityConf = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeConf.icon;
  const [hovered, setHovered] = useState(false);
  const dateLabel = formatRelativeDate(announcement.publishDate || announcement.createdAt);

  return (
    <div
      onClick={() => onClick(announcement)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0',
        backgroundColor: hovered ? '#f0faf3' : isUnread ? '#f7fdf9' : 'white',
        borderBottom: '1px solid #e9f0eb',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        fontFamily: "'DM Sans', sans-serif",
        animation: `rowFadeIn 0.3s ease both`,
        animationDelay: `${index * 0.04}s`,
      }}
    >
      {/* Left date column */}
      <div style={{
        width: '80px', minWidth: '80px', padding: '18px 16px 18px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        borderRight: '1px solid #e9f0eb',
      }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {new Date(announcement.publishDate || announcement.createdAt).toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span style={{ fontSize: '20px', fontWeight: '700', color: '#1b4332', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>
          {new Date(announcement.publishDate || announcement.createdAt).getDate()}
        </span>
        <span style={{ fontSize: '10.5px', color: '#a3b18a', marginTop: '1px' }}>
          {new Date(announcement.publishDate || announcement.createdAt).getFullYear()}
        </span>
      </div>

      {/* Type icon */}
      <div style={{
        width: '48px', minWidth: '48px', display: 'flex', justifyContent: 'center', padding: '0 6px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          backgroundColor: typeConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TypeIcon size={15} color={typeConf.color} strokeWidth={2} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '16px 12px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '14.5px', fontWeight: isUnread ? '700' : '600',
            color: '#1b4332',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {announcement.title}
          </span>
          {isUnread && (
            <span style={{
              backgroundColor: '#2d6a4f', color: 'white',
              fontSize: '9.5px', fontWeight: '700', padding: '2px 7px',
              borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
            }}>
              NEW
            </span>
          )}
          {announcement.isImportant && (
            <Star size={13} color="#ca6702" fill="#ca6702" style={{ flexShrink: 0 }} />
          )}
        </div>
        <p style={{
          fontSize: '13px', color: '#6b705c', lineHeight: '1.5', margin: '0 0 8px',
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {announcement.content}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10.5px', fontWeight: '600', padding: '2px 8px',
            borderRadius: '5px', textTransform: 'capitalize',
            backgroundColor: typeConf.bg, color: typeConf.color,
          }}>
            {announcement.type}
          </span>
          <span style={{
            fontSize: '10.5px', fontWeight: '600', padding: '2px 8px',
            borderRadius: '5px',
            backgroundColor: priorityConf.bg, color: priorityConf.color,
          }}>
            {priorityConf.label}
          </span>
          {isExpired && (
            <span style={{
              fontSize: '10.5px', fontWeight: '600', padding: '2px 8px',
              borderRadius: '5px', backgroundColor: '#f3f4f6', color: '#9ca3af',
            }}>
              Expired
            </span>
          )}
        </div>
      </div>

      {/* Right: arrow */}
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <ChevronRight
          size={16}
          color="#a3b18a"
          style={{
            transition: 'transform 0.2s, color 0.2s',
            transform: hovered ? 'translateX(3px)' : 'none',
            color: hovered ? '#2d6a4f' : '#a3b18a',
          }}
        />
      </div>
    </div>
  );
};

const DetailModal = ({ announcement, onClose }) => {
  if (!announcement) return null;
  const typeConf = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.announcement;
  const priorityConf = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeConf.icon;
  const isExpired = announcement.expiryDate && new Date(announcement.expiryDate) < new Date();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(13,38,24,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '20px',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '18px',
          maxWidth: '660px', width: '100%', maxHeight: '88vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(13,38,24,0.3)',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Decorative top bar */}
        <div style={{
          height: '5px',
          background: 'linear-gradient(90deg, #1b4332 0%, #2d6a4f 40%, #52b788 100%)',
        }} />

        {/* Modal header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #e9f0eb', position: 'relative', backgroundColor: '#f7fdf9' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: '#e9f0eb', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d8f3dc'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e9f0eb'}
          >
            <X size={16} color="#2d6a4f" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              backgroundColor: typeConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TypeIcon size={16} color={typeConf.color} strokeWidth={2} />
            </div>
            <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', backgroundColor: typeConf.bg, color: typeConf.color, textTransform: 'capitalize' }}>
              {announcement.type}
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', backgroundColor: priorityConf.bg, color: priorityConf.color }}>
              {priorityConf.label} Priority
            </span>
            {announcement.isImportant && (
              <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', backgroundColor: '#fff1e6', color: '#ca6702', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={11} fill="#ca6702" color="#ca6702" /> Important
              </span>
            )}
            {isExpired && (
              <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', backgroundColor: '#f3f4f6', color: '#9ca3af' }}>
                Expired
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1b4332', margin: '0 0 12px', lineHeight: 1.35, fontFamily: "'Lora', serif" }}>
            {announcement.title}
          </h2>

          <div style={{ display: 'flex', gap: '20px', fontSize: '12.5px', color: '#6b705c', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={12} color="#2d6a4f" /> {formatFullDate(announcement.publishDate || announcement.createdAt)}
            </span>
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '15px', lineHeight: '1.85', color: '#344e41', margin: 0, whiteSpace: 'pre-wrap' }}>
            {announcement.content}
          </p>
          {announcement.expiryDate && (
            <div style={{
              marginTop: '24px', padding: '13px 16px',
              backgroundColor: '#f0faf3', borderRadius: '10px',
              border: '1px solid #b7e4c7',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', color: '#2d6a4f',
            }}>
              <Calendar size={14} color="#2d6a4f" />
              <span>Expires on <strong>{formatFullDate(announcement.expiryDate)}</strong></span>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #e9f0eb', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f7fdf9' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
              border: 'none', borderRadius: '10px', color: 'white',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Leaf size={14} /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Custom hook: useAnnouncements ────────────────────────────────────────────

const useAnnouncements = (token, navigate, showNotification) => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('idle');

  const fetchAnnouncements = useCallback(async () => {
    if (!token) {
      showNotification('Please login to view announcements', 'error');
      navigate('/login');
      return;
    }
    setStatus('loading');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/mail/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setData(res.data.data);
        setStatus('success');
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      setStatus('error');
      if (err.response?.status === 401) {
        showNotification('Session expired. Please login again.', 'error');
        navigate('/login');
      } else {
        showNotification('Failed to load announcements', 'error');
      }
    }
  }, [token, navigate, showNotification]);

  const markAsRead = useCallback(async (id) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/v1/mail/announcements/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(prev =>
        prev.map(a =>
          a._id === id
            ? { ...a, readBy: [...(a.readBy || []), { readAt: new Date() }] }
            : a
        )
      );
    } catch (_) { /* silent */ }
  }, [token]);

  return { data, status, fetchAnnouncements, markAsRead };
};

// ─── Main Component ───────────────────────────────────────────────────────────

const UserGetAnnouncement = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [filters, setFilters] = useState({ type: 'all', priority: 'all', search: '' });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all | unread | important

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(p => ({ ...p, show: false })), 3500);
  }, []);

  const { data: announcements, status, fetchAnnouncements, markAsRead } = useAnnouncements(
    token, navigate, showNotification
  );

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // Derived stats
  const stats = {
    total:     announcements.length,
    unread:    announcements.filter(a => !a.readBy?.length).length,
    important: announcements.filter(a => a.isImportant).length,
  };

  // Filtered + sorted list
  const filtered = announcements
    .filter(a => activeTab === 'all' ? true : activeTab === 'unread' ? !a.readBy?.length : a.isImportant)
    .filter(a => filters.type === 'all'     || a.type     === filters.type)
    .filter(a => filters.priority === 'all' || a.priority === filters.priority)
    .filter(a => {
      const q = filters.search.toLowerCase().trim();
      return !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    })
    .sort((a, b) =>
      new Date(b.publishDate || b.createdAt) - new Date(a.publishDate || a.createdAt)
    );

  const handleCardClick = (a) => {
    setSelectedAnnouncement(a);
    if (!a.readBy?.length) markAsRead(a._id);
  };

  const activeFiltersCount = [
    filters.type !== 'all',
    filters.priority !== 'all',
    !!filters.search.trim(),
  ].filter(Boolean).length;

  const tabs = [
    { id: 'all',       label: 'All',       count: stats.total },
    { id: 'unread',    label: 'Unread',    count: stats.unread },
    { id: 'important', label: 'Important', count: stats.important },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes fadeIn    { from { opacity: 0 }                                       to { opacity: 1 } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes rowFadeIn { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes heroFloat { 0%,100% { transform: translateY(0px) rotate(-2deg) } 50% { transform: translateY(-8px) rotate(2deg) } }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        backgroundColor: '#f4f9f4', fontFamily: "'DM Sans', sans-serif",
      }}>
        <UserHeader />
        <Toast {...notification} />

        {/* Hero banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2818 0%, #1b4332 55%, #2d6a4f 100%)',
          padding: '48px 24px 60px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative leaf shapes */}
          <div style={{
            position: 'absolute', right: '-40px', top: '-30px',
            width: '260px', height: '260px', borderRadius: '50%',
            background: 'rgba(82,183,136,0.08)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: '80px', bottom: '-60px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'rgba(52,143,96,0.1)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', left: '-20px', bottom: '-40px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'rgba(163,209,141,0.06)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.15)',
                animation: 'heroFloat 4s ease-in-out infinite',
              }}>
                <Megaphone size={28} color="#74c69d" strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0, fontFamily: "'Lora', serif" }}>
                    Announcements
                  </h1>
                  {stats.unread > 0 && (
                    <span style={{
                      backgroundColor: '#74c69d', color: '#0d2818',
                      fontSize: '12px', fontWeight: '700', padding: '3px 11px',
                      borderRadius: '20px', letterSpacing: '0.3px',
                    }}>
                      {stats.unread} New
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: '#74c69d', margin: '5px 0 0', letterSpacing: '0.2px' }}>
                  Stay updated with the latest news from the plantation.
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap',
            }}>
              {[
                { icon: BarChart3, value: stats.total,     label: 'Total',     color: '#b7e4c7' },
                { icon: Bell,      value: stats.unread,    label: 'Unread',    color: '#ffd166' },
                { icon: Star,      value: stats.important, label: 'Important', color: '#ff9a3c' },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  minWidth: '140px',
                }}>
                  <Icon size={18} color={color} />
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>{value}</div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <main style={{
          flex: 1, maxWidth: '1200px', margin: '-24px auto 40px',
          padding: '0 24px', width: '100%', position: 'relative', zIndex: 1,
        }}>
          {/* Main card */}
          <div style={{
            backgroundColor: 'white', borderRadius: '18px',
            boxShadow: '0 4px 24px rgba(27,67,50,0.1)',
            overflow: 'hidden',
            border: '1px solid #e0ede4',
          }}>
            {/* Tabs + filters bar */}
            <div style={{
              padding: '0 0 0 0',
              borderBottom: '1px solid #e9f0eb',
            }}>
              {/* Tab row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', borderBottom: '1px solid #e9f0eb', flexWrap: 'wrap', gap: '8px',
              }}>
                <div style={{ display: 'flex', gap: '0' }}>
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '14px 16px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '14px', fontWeight: activeTab === tab.id ? '700' : '500',
                        color: activeTab === tab.id ? '#1b4332' : '#6b705c',
                        borderBottom: activeTab === tab.id ? '2.5px solid #2d6a4f' : '2.5px solid transparent',
                        marginBottom: '-1px',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: '7px',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {tab.label}
                      <span style={{
                        fontSize: '11px', fontWeight: '700',
                        backgroundColor: activeTab === tab.id ? '#d8f3dc' : '#f3f4f6',
                        color: activeTab === tab.id ? '#1b4332' : '#9ca3af',
                        padding: '1px 7px', borderRadius: '20px',
                        transition: 'all 0.15s',
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Refresh */}
                <button
                  onClick={fetchAnnouncements}
                  style={{
                    background: 'none', border: '1.5px solid #e0ede4',
                    borderRadius: '8px', padding: '7px 12px',
                    fontSize: '13px', color: '#2d6a4f', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: '600',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0faf3'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {/* Search + Filters row */}
              <div style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
              }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
                  <Search size={14} color="#a3b18a" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search announcements…"
                    value={filters.search}
                    onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px 9px 32px',
                      border: '1.5px solid #dde8df', borderRadius: '9px',
                      fontSize: '13.5px', color: '#1b4332', outline: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: '#f7fdf9',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2d6a4f'}
                    onBlur={e => e.target.style.borderColor = '#dde8df'}
                  />
                </div>

                {/* Type filter */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={filters.type}
                    onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
                    style={{
                      padding: '9px 32px 9px 12px',
                      border: '1.5px solid #dde8df', borderRadius: '9px',
                      fontSize: '13.5px', color: '#1b4332', outline: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: filters.type !== 'all' ? '#d8f3dc' : '#f7fdf9',
                      cursor: 'pointer', appearance: 'none',
                      transition: 'border-color 0.15s, background-color 0.15s',
                      fontWeight: filters.type !== 'all' ? '600' : '400',
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="announcement">Announcement</option>
                    <option value="update">Update</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="news">News</option>
                    <option value="alert">Alert</option>
                  </select>
                  <ChevronRight size={13} color="#6b705c" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                </div>

                {/* Priority filter */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={filters.priority}
                    onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
                    style={{
                      padding: '9px 32px 9px 12px',
                      border: '1.5px solid #dde8df', borderRadius: '9px',
                      fontSize: '13.5px', color: '#1b4332', outline: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: filters.priority !== 'all' ? '#d8f3dc' : '#f7fdf9',
                      cursor: 'pointer', appearance: 'none',
                      transition: 'border-color 0.15s, background-color 0.15s',
                      fontWeight: filters.priority !== 'all' ? '600' : '400',
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <ChevronRight size={13} color="#6b705c" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                </div>

                {/* Clear filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => setFilters({ type: 'all', priority: 'all', search: '' })}
                    style={{
                      background: 'none', border: '1.5px solid #dde8df',
                      borderRadius: '9px', padding: '9px 12px',
                      fontSize: '13px', color: '#bc4749', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: '600',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <X size={13} /> Clear ({activeFiltersCount})
                  </button>
                )}
              </div>

            </div>

            {/* Loading */}
            {status === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '14px' }}>
                <Loader2 size={34} color="#2d6a4f" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '15px', color: '#6b705c' }}>Loading plantation updates…</span>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '80px 20px', gap: '12px',
              }}>
                <AlertTriangle size={38} color="#bc4749" />
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>Failed to load</p>
                <p style={{ fontSize: '14px', color: '#6b705c', margin: 0 }}>Could not fetch announcements.</p>
                <button
                  onClick={fetchAnnouncements}
                  style={{
                    marginTop: '8px', padding: '9px 20px',
                    background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                    color: 'white', border: 'none', borderRadius: '9px',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <RefreshCw size={14} /> Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {status === 'success' && filtered.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '80px 20px', gap: '12px',
              }}>
                <div style={{ fontSize: '48px', lineHeight: 1 }}>🌿</div>
                <p style={{ fontSize: '17px', fontWeight: '700', color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>
                  No Announcements Found
                </p>
                <p style={{ fontSize: '14px', color: '#6b705c', margin: 0 }}>
                  {activeFiltersCount > 0
                    ? 'Try adjusting or clearing your filters.'
                    : 'There are no announcements at this time.'}
                </p>
              </div>
            )}

            {/* List */}
            {status === 'success' && filtered.length > 0 && (
              <div>
                {filtered.map((a, i) => (
                  <AnnouncementRow
                    key={a._id}
                    announcement={a}
                    onClick={handleCardClick}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA removed */}
        </main>

        <UserFooter />
      </div>

      {selectedAnnouncement && (
        <DetailModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </>
  );
};

export default UserGetAnnouncement;