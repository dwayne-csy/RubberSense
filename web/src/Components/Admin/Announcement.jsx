// RubberSense/Web/src/Components/Admin/Announcement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const MegaphoneIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z"/>
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
);
const PlusIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const EyeIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const StarIcon = ({ size = 14, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const SearchIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevronLeftIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const ChevronRightIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const ClockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CheckIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Shared CSS (same design token system as AdminContactMessages) ──────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --green-dark:  #1b5e20;
    --green-mid:   #2e7d32;
    --green-light: #43a047;
    --green-pale:  #e8f5e9;
    --accent:      #00bfa5;
    --red:         #e53935;
    --amber:       #ffb300;
    --teal:        #00acc1;
    --grey-dark:   #37474f;
    --grey-mid:    #607d8b;
    --grey-light:  #eceff1;
    --white:       #ffffff;
    --shadow-sm:   0 2px 8px rgba(0,0,0,.08);
    --shadow-md:   0 6px 24px rgba(0,0,0,.12);
    --shadow-lg:   0 16px 48px rgba(0,0,0,.18);
    --radius:      14px;
  }

  /* ── HERO ──────────────────────────────────────────────── */
  .an-hero {
    position: relative; height: 220px; border-radius: var(--radius);
    overflow: hidden; margin-bottom: 32px;
    display: flex; align-items: flex-end; padding: 28px 32px;
  }
  .an-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 40%; filter: brightness(.52);
  }
  .an-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(27,94,32,.78) 0%, rgba(0,191,165,.32) 100%);
  }
  .an-hero-content { position: relative; z-index: 1; }
  .an-hero-title {
    font-family: 'Playfair Display', serif; font-size: 2.2rem;
    color: #fff; margin: 0 0 4px; line-height: 1.1; letter-spacing: -.5px;
  }
  .an-hero-sub {
    font-family: 'DM Sans', sans-serif; font-size: .92rem;
    color: rgba(255,255,255,.8); margin: 0; font-weight: 300;
  }
  .an-hero-icon {
    position: absolute; top: 20px; right: 24px; z-index: 1;
    opacity: .18; color: #fff;
  }

  /* ── STATS ROW ───────────────────────────────────────────── */
  .an-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin-bottom: 28px;
  }
  .an-stat-card {
    background: var(--white); border-radius: 12px;
    padding: 20px 18px; display: flex; align-items: center; gap: 16px;
    box-shadow: var(--shadow-sm); border: 1.5px solid transparent;
    font-family: 'DM Sans', sans-serif;
    transition: transform .18s, box-shadow .18s;
  }
  .an-stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .an-stat-icon-wrap {
    width: 52px; height: 52px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .an-stat-icon-wrap.total   { background: #e8f5e9; color: var(--green-mid); }
  .an-stat-icon-wrap.pub     { background: #e0f7fa; color: var(--teal); }
  .an-stat-icon-wrap.imp     { background: #fff8e1; color: var(--amber); }
  .an-stat-icon-wrap.unpub   { background: #eceff1; color: var(--grey-mid); }
  .an-stat-info { flex: 1; }
  .an-stat-count { font-size: 1.7rem; font-weight: 700; color: var(--grey-dark); line-height: 1; }
  .an-stat-label { font-size: .72rem; color: var(--grey-mid); margin-top: 4px; text-transform: uppercase; letter-spacing: .6px; font-weight: 500; }

  /* ── FILTER BAR ─────────────────────────────────────────── */
  .an-filter-bar {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: var(--white); padding: 14px 20px;
    border-radius: 10px; box-shadow: var(--shadow-sm);
    margin-bottom: 24px; font-family: 'DM Sans', sans-serif;
  }
  .an-filter-select {
    padding: 8px 14px; border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    cursor: pointer; outline: none; transition: border-color .2s;
  }
  .an-filter-select:focus { border-color: var(--green-mid); background: #fff; }
  .an-search-wrap { flex: 1; min-width: 220px; position: relative; display: flex; align-items: center; }
  .an-search-icon { position: absolute; left: 12px; color: var(--grey-mid); pointer-events: none; display: flex; }
  .an-search-input {
    width: 100%; padding: 8px 14px 8px 36px;
    border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    outline: none; transition: border-color .2s; box-sizing: border-box;
  }
  .an-search-input:focus { border-color: var(--green-mid); background: #fff; }
  .an-filter-count { margin-left: auto; font-size: .82rem; color: var(--grey-mid); font-weight: 500; white-space: nowrap; }

  /* ── ANNOUNCEMENT CARD ───────────────────────────────────── */
  .an-card {
    background: var(--white); border-radius: var(--radius);
    padding: 22px 26px; margin-bottom: 16px;
    box-shadow: var(--shadow-sm); border: 1.5px solid #e0e7ef;
    transition: box-shadow .22s, border-color .22s, transform .22s;
    font-family: 'DM Sans', sans-serif; position: relative; overflow: hidden;
  }
  .an-card::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 4px; height: 100%; background: var(--green-mid);
    border-radius: 4px 0 0 4px; opacity: 0; transition: opacity .2s;
  }
  .an-card:hover { box-shadow: var(--shadow-md); border-color: #b2dfdb; transform: translateY(-2px); }
  .an-card:hover::before { opacity: 1; }
  .an-card.important::before { opacity: 1; background: var(--amber); }
  .an-card.unpublished { opacity: .75; }

  .an-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; }
  .an-card-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .an-card-title {
    font-family: 'Playfair Display', serif; font-size: 1.1rem;
    font-weight: 700; color: var(--grey-dark); margin: 0;
  }
  .an-card-meta { text-align: right; flex-shrink: 0; }
  .an-card-date { font-size: .74rem; color: #90a4ae; margin-top: 6px; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
  .an-card-body { font-size: .93rem; line-height: 1.7; color: #546e7a; margin: 0 0 16px; }
  .an-card-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .an-card-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* ── BADGE ──────────────────────────────────────────────── */
  .an-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 13px; border-radius: 50px;
    font-size: .7rem; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  }
  .an-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .an-badge.published   { background: #e0f7fa; color: var(--teal); }
  .an-badge.published   .an-badge-dot { background: var(--teal); }
  .an-badge.unpublished { background: #eceff1; color: var(--grey-mid); }
  .an-badge.unpublished .an-badge-dot { background: var(--grey-mid); }
  .an-badge.type        { background: var(--green-pale); color: var(--green-mid); }
  .an-badge.type        .an-badge-dot { background: var(--green-light); }
  .an-badge.important   { background: #fff8e1; color: #f57f17; }
  .an-badge.important   .an-badge-dot { background: var(--amber); }

  /* ── VIEWS CHIP ─────────────────────────────────────────── */
  .an-views { font-size: .78rem; color: var(--grey-mid); display: flex; align-items: center; gap: 4px; }

  /* ── ACTION BUTTONS ─────────────────────────────────────── */
  .an-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .an-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 15px; border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .83rem; font-weight: 600;
    cursor: pointer; transition: all .18s; letter-spacing: .2px;
  }
  .an-btn:active { transform: scale(.97); }
  .an-btn:disabled { opacity: .55; cursor: not-allowed; }
  .an-btn-publish   { background: var(--green-pale); color: var(--green-mid); }
  .an-btn-publish:hover:not(:disabled)   { background: var(--green-mid); color: #fff; }
  .an-btn-unpublish { background: #eceff1; color: var(--grey-mid); }
  .an-btn-unpublish:hover:not(:disabled) { background: var(--grey-mid); color: #fff; }
  .an-btn-edit      { background: #fff3e0; color: #e65100; }
  .an-btn-edit:hover:not(:disabled)      { background: #e65100; color: #fff; }

  /* ── PAGINATION ─────────────────────────────────────────── */
  .an-pagination {
    display: flex; justify-content: center; align-items: center; gap: 8px;
    padding: 24px 20px; font-family: 'DM Sans', sans-serif;
  }
  .an-page-btn {
    width: 40px; height: 40px; border-radius: 8px;
    border: 1.5px solid #cfd8dc; background: var(--white);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: .88rem;
    font-weight: 600; color: var(--grey-dark); transition: all .18s;
  }
  .an-page-btn:hover:not(:disabled):not(.active) { border-color: var(--green-mid); color: var(--green-mid); transform: translateY(-1px); }
  .an-page-btn.active { background: var(--green-mid); color: #fff; border-color: var(--green-mid); }
  .an-page-btn:disabled { opacity: .35; cursor: not-allowed; }

  /* ── MODAL ──────────────────────────────────────────────── */
  .an-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.65);
    backdrop-filter: blur(4px); display: flex; justify-content: center;
    align-items: center; z-index: 1000; padding: 20px;
  }
  .an-modal {
    background: var(--white); border-radius: 18px;
    width: 100%; max-width: 680px; max-height: 92vh;
    overflow-y: auto; box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
  }
  .an-modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 28px 0; position: sticky; top: 0; background: #fff;
    border-radius: 18px 18px 0 0; z-index: 1;
  }
  .an-modal-title { font-family: 'Playfair Display', serif; font-size: 1.45rem; color: var(--grey-dark); margin: 0; }
  .an-modal-close {
    width: 36px; height: 36px; border-radius: 50%;
    border: none; background: var(--grey-light); color: var(--grey-mid);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .18s; flex-shrink: 0;
  }
  .an-modal-close:hover { background: #cfd8dc; }
  .an-modal-divider { height: 2px; background: linear-gradient(90deg, var(--green-mid), var(--accent)); margin: 12px 28px 0; border-radius: 2px; }
  .an-modal-body { padding: 24px 28px 10px; }
  .an-modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 28px 28px; }

  /* ── FORM ELEMENTS ──────────────────────────────────────── */
  .an-form-group { margin-bottom: 20px; }
  .an-form-label { display: block; margin-bottom: 7px; font-size: .87rem; font-weight: 600; color: var(--grey-dark); }
  .an-form-input, .an-form-select {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid #cfd8dc; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: .93rem;
    color: var(--grey-dark); outline: none;
    transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
    background: var(--grey-light);
  }
  .an-form-input:focus, .an-form-select:focus { border-color: var(--green-mid); background: #fff; box-shadow: 0 0 0 3px rgba(46,125,50,.1); }
  .an-form-textarea {
    width: 100%; padding: 12px 14px; min-height: 180px;
    border: 1.5px solid #cfd8dc; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: .93rem;
    color: var(--grey-dark); resize: vertical; outline: none; line-height: 1.65;
    transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
    background: var(--grey-light);
  }
  .an-form-textarea:focus { border-color: var(--green-mid); background: #fff; box-shadow: 0 0 0 3px rgba(46,125,50,.1); }
  .an-checkbox-row { display: flex; align-items: center; gap: 10px; font-size: .93rem; color: var(--grey-dark); cursor: pointer; padding: 4px 0; font-weight: 500; }
  .an-checkbox-row input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--green-mid); }

  /* ── MODAL BUTTONS ──────────────────────────────────────── */
  .an-btn-cancel { background: #eceff1; color: var(--grey-mid); }
  .an-btn-cancel:hover:not(:disabled) { background: #cfd8dc; }
  .an-btn-submit { background: var(--green-mid); color: #fff; }
  .an-btn-submit:hover:not(:disabled) { background: var(--green-dark); }

  /* ── NOTIFICATION ───────────────────────────────────────── */
  .an-notification {
    position: fixed; top: 22px; right: 22px; padding: 13px 22px;
    border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: .9rem; font-weight: 600; box-shadow: var(--shadow-md);
    z-index: 2000; display: flex; align-items: center; gap: 8px;
    animation: anSlideIn .3s ease;
  }
  .an-notification.success { background: var(--green-mid); color: #fff; }
  .an-notification.error   { background: var(--red); color: #fff; }
  @keyframes anSlideIn { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }

  /* ── EMPTY / LOADING ────────────────────────────────────── */
  .an-empty { text-align: center; padding: 60px 20px; font-family: 'DM Sans', sans-serif; color: var(--grey-mid); }
  .an-empty-icon { margin-bottom: 16px; display: flex; justify-content: center; opacity: .35; color: var(--grey-mid); }
  .an-empty-text { font-size: 1rem; }
`;

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    isImportant: false,
    isPublished: true
  });
  const [filters, setFilters] = useState({
    type: 'all',
    isPublished: 'all',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => { fetchAnnouncements(); fetchStats(); }, [filters]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/admin/login'); return; }
    try {
      setLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.isPublished !== 'all') params.append('isPublished', filters.isPublished);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      params.append('sortBy', 'publishDate');
      params.append('sortOrder', 'desc');
      const response = await axios.get(`${API_BASE_URL}/api/v1/mail/admin/announcements?${params.toString()}`);
      if (response.data.success) {
        setAnnouncements(response.data.data);
        setPagination({ total: response.data.total, pages: response.data.pages, currentPage: response.data.currentPage });
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      if (error.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
      else showNotification('Failed to load announcements', 'error');
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/mail/admin/announcements/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setStats(response.data.data);
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/mail/admin/announcements`, formData, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        showNotification('Announcement created successfully');
        setShowCreateModal(false); resetForm(); fetchAnnouncements(); fetchStats();
      } else showNotification(response.data.message || 'Failed to create announcement', 'error');
    } catch (error) {
      console.error('Error creating announcement:', error);
      showNotification(error.response?.data?.message || 'Failed to create announcement', 'error');
    } finally { setSaving(false); }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedAnnouncement) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/mail/admin/announcements/${selectedAnnouncement._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        showNotification('Announcement updated successfully');
        setShowEditModal(false); resetForm(); fetchAnnouncements(); fetchStats();
      } else showNotification(response.data.message || 'Failed to update announcement', 'error');
    } catch (error) {
      console.error('Error updating announcement:', error);
      showNotification(error.response?.data?.message || 'Failed to update announcement', 'error');
    } finally { setSaving(false); }
  };

  const handleTogglePublish = async (announcement) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/mail/admin/announcements/${announcement._id}/toggle-publish`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        showNotification(`Announcement ${announcement.isPublished ? 'unpublished' : 'published'} successfully`);
        fetchAnnouncements(); fetchStats();
      }
    } catch (error) { console.error('Error toggling publish status:', error); showNotification('Failed to update status', 'error'); }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', type: 'announcement', isImportant: false, isPublished: true });
    setSelectedAnnouncement(null);
  };

  const handleEditClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({ title: announcement.title, content: announcement.content, type: announcement.type, isImportant: announcement.isImportant, isPublished: announcement.isPublished });
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo(0, 0);
  };

  // Stat items — SVG icons, no emojis; unpublished = total - published as fallback
  const unpublishedCount = stats
    ? (stats.unpublished !== undefined ? stats.unpublished : (stats.total || 0) - (stats.published || 0))
    : 0;
  const statItems = [
    { key: 'total', colorClass: 'total', IconComp: MegaphoneIcon, label: 'Total',       count: stats?.total || 0 },
    { key: 'pub',   colorClass: 'pub',   IconComp: EyeIcon,       label: 'Published',   count: stats?.published || 0 },
    { key: 'imp',   colorClass: 'imp',   IconComp: StarIcon,      label: 'Important',   count: stats?.important || 0 },
    { key: 'unpub', colorClass: 'unpub', IconComp: EyeOffIcon,    label: 'Unpublished', count: unpublishedCount },
  ];

  // Shared form body used in both create & edit modals
  const renderFormBody = () => (
    <div className="an-modal-body">
      <div className="an-form-group">
        <label className="an-form-label">Title *</label>
        <input type="text" name="title" className="an-form-input" value={formData.title} onChange={handleInputChange} required placeholder="Enter announcement title" />
      </div>
      <div className="an-form-group">
        <label className="an-form-label">Content *</label>
        <textarea name="content" className="an-form-textarea" value={formData.content} onChange={handleInputChange} required placeholder="Enter announcement content…" />
      </div>
      <div className="an-form-group">
        <label className="an-form-label">Type</label>
        <select name="type" className="an-form-select" value={formData.type} onChange={handleInputChange}>
          <option value="announcement">Announcement</option>
          <option value="update">Update</option>
          <option value="maintenance">Maintenance</option>
          <option value="news">News</option>
          <option value="alert">Alert</option>
        </select>
      </div>
      <div className="an-form-group">
        <label className="an-checkbox-row">
          <input type="checkbox" name="isImportant" checked={formData.isImportant} onChange={handleInputChange} />
          Mark as Important
        </label>
      </div>
      <div className="an-form-group">
        <label className="an-checkbox-row">
          <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleInputChange} />
          Publish immediately
        </label>
      </div>
    </div>
  );

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex' }}>
        <LeftNavigationBar />

        <div style={{ marginLeft: 250, padding: '28px 32px', width: 'calc(100% - 250px)', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>

          {/* Notification */}
          {notification.show && (
            <div className={`an-notification ${notification.type}`}>
              {notification.type === 'success' ? <CheckIcon size={15} /> : <CloseIcon size={14} />}
              {notification.message}
            </div>
          )}

          {/* Hero Banner */}
          <div className="an-hero">
            <img
              className="an-hero-img"
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80"
              alt="Announcements"
            />
            <div className="an-hero-overlay" />
            <div className="an-hero-content">
              <h1 className="an-hero-title">Announcements</h1>
              <p className="an-hero-sub">Create and manage public announcements</p>
            </div>
            {/* Big decorative megaphone icon — top-right, like ACM's inbox icon */}
            <div className="an-hero-icon">
              <MegaphoneIcon size={110} />
            </div>
          </div>

          {/* Toolbar — Create button sits here, outside the hero */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--green-mid)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '12px 22px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '.92rem',
                fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(46,125,50,.3)',
                transition: 'transform .18s, box-shadow .18s'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(46,125,50,.4)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(46,125,50,.3)'; }}
              onClick={() => { resetForm(); setShowCreateModal(true); }}
            >
              <PlusIcon size={16} /> Create Announcement
            </button>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="an-stats">
              {statItems.map(({ key, colorClass, IconComp, label, count }) => (
                <div key={key} className="an-stat-card">
                  <div className={`an-stat-icon-wrap ${colorClass}`}>
                    <IconComp size={24} />
                  </div>
                  <div className="an-stat-info">
                    <div className="an-stat-count">{count}</div>
                    <div className="an-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter Bar */}
          <div className="an-filter-bar">
            <select className="an-filter-select" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
              <option value="all">All Types</option>
              <option value="announcement">Announcement</option>
              <option value="update">Update</option>
              <option value="maintenance">Maintenance</option>
              <option value="news">News</option>
              <option value="alert">Alert</option>
            </select>
            <select className="an-filter-select" value={filters.isPublished} onChange={(e) => handleFilterChange('isPublished', e.target.value)}>
              <option value="all">All Status</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
            <div className="an-search-wrap">
              <span className="an-search-icon"><SearchIcon size={16} /></span>
              <input
                type="text"
                className="an-search-input"
                placeholder="Search by title or content…"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <span className="an-filter-count">
              {announcements.length} result{announcements.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Announcement Cards */}
          {loading ? (
            <div className="an-empty">
              <div className="an-empty-icon"><ClockIcon size={52} /></div>
              <p className="an-empty-text">Loading announcements…</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="an-empty">
              <div className="an-empty-icon"><MegaphoneIcon size={52} /></div>
              <p className="an-empty-text">No announcements found. Create your first one!</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement._id}
                className={`an-card ${announcement.isImportant ? 'important' : ''} ${!announcement.isPublished ? 'unpublished' : ''}`}
              >
                {/* Card Header */}
                <div className="an-card-header">
                  <div>
                    <div className="an-card-title-row">
                      <h3 className="an-card-title">{announcement.title}</h3>
                      {announcement.isImportant && (
                        <span className="an-badge important">
                          <span className="an-badge-dot" />
                          <StarIcon size={11} filled /> Important
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="an-card-meta">
                    <span className={`an-badge ${announcement.isPublished ? 'published' : 'unpublished'}`}>
                      <span className="an-badge-dot" />
                      {announcement.isPublished ? 'Published' : 'Unpublished'}
                    </span>
                    <p className="an-card-date"><ClockIcon /> {formatDate(announcement.createdAt)}</p>
                  </div>
                </div>

                {/* Body */}
                <p className="an-card-body">
                  {announcement.content.substring(0, 160)}{announcement.content.length > 160 ? '…' : ''}
                </p>

                {/* Footer */}
                <div className="an-card-footer">
                  <div className="an-card-tags">
                    <span className="an-badge type">
                      <span className="an-badge-dot" />
                      {announcement.type}
                    </span>
                    <span className="an-views">
                      <EyeIcon size={13} /> {announcement.views || 0} views
                    </span>
                  </div>
                  <div className="an-actions">
                    <button
                      className={`an-btn ${announcement.isPublished ? 'an-btn-unpublish' : 'an-btn-publish'}`}
                      onClick={() => handleTogglePublish(announcement)}
                    >
                      {announcement.isPublished ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      {announcement.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="an-btn an-btn-edit" onClick={() => handleEditClick(announcement)}>
                      <EditIcon size={14} /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="an-pagination">
              <button
                className="an-page-btn"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
              >
                <ChevronLeftIcon size={16} />
              </button>
              {[...Array(pagination.pages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === pagination.pages || (p >= filters.page - 2 && p <= filters.page + 2)) {
                  return (
                    <button
                      key={p}
                      className={`an-page-btn ${filters.page === p ? 'active' : ''}`}
                      onClick={() => handlePageChange(p)}
                    >{p}</button>
                  );
                }
                return null;
              })}
              <button
                className="an-page-btn"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.pages}
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          )}

          {/* ── CREATE MODAL ─────────────────────────────────────── */}
          {showCreateModal && (
            <div className="an-modal-overlay">
              <div className="an-modal">
                <div className="an-modal-header">
                  <h2 className="an-modal-title">Create Announcement</h2>
                  <button className="an-modal-close" onClick={() => setShowCreateModal(false)}><CloseIcon size={16} /></button>
                </div>
                <div className="an-modal-divider" />
                <form onSubmit={handleCreateAnnouncement}>
                  {renderFormBody()}
                  <div className="an-modal-footer">
                    <button type="button" className="an-btn an-btn-cancel" disabled={saving} onClick={() => setShowCreateModal(false)}>Cancel</button>
                    <button type="submit" className="an-btn an-btn-submit" disabled={saving}>
                      {saving ? 'Creating…' : <><PlusIcon size={14} /> Create</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── EDIT MODAL ───────────────────────────────────────── */}
          {showEditModal && selectedAnnouncement && (
            <div className="an-modal-overlay">
              <div className="an-modal">
                <div className="an-modal-header">
                  <h2 className="an-modal-title">Edit Announcement</h2>
                  <button className="an-modal-close" onClick={() => setShowEditModal(false)}><CloseIcon size={16} /></button>
                </div>
                <div className="an-modal-divider" />
                <form onSubmit={handleUpdateAnnouncement}>
                  {renderFormBody()}
                  <div className="an-modal-footer">
                    <button type="button" className="an-btn an-btn-cancel" disabled={saving} onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button type="submit" className="an-btn an-btn-submit" disabled={saving}>
                      {saving ? 'Saving…' : <><CheckIcon size={14} /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Announcement;