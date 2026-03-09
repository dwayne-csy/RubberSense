// RubberSense/web/src/Components/Admin/MarketPrice.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeftNavigationBar from '../layouts/LeftNavigationBar';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const ChartIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 10l3-3 3 3 4-4" />
    <path d="M17 10V4h-6" />
  </svg>
);

const TrendingUpIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8 10 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8 14 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const TrendingFlatIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 5 12 12 19" />
  </svg>
);

const RefreshIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DollarIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ClockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BoltIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
  </svg>
);

const PsychologyIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const InfoIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const AutoGraphIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 14l3-3 3 3 4-4" />
    <path d="M17 10V4h-6" />
  </svg>
);

// ── Shared CSS (same design token system as Announcement.jsx) ──────────────
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
  .mp-hero {
    position: relative; height: 220px; border-radius: var(--radius);
    overflow: hidden; margin-bottom: 32px;
    display: flex; align-items: flex-end; padding: 28px 32px;
  }
  .mp-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 40%; filter: brightness(.52);
  }
  .mp-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(27,94,32,.78) 0%, rgba(0,191,165,.32) 100%);
  }
  .mp-hero-content { position: relative; z-index: 1; }
  .mp-hero-title {
    font-family: 'Playfair Display', serif; font-size: 2.2rem;
    color: #fff; margin: 0 0 4px; line-height: 1.1; letter-spacing: -.5px;
  }
  .mp-hero-sub {
    font-family: 'DM Sans', sans-serif; font-size: .92rem;
    color: rgba(255,255,255,.8); margin: 0; font-weight: 300;
  }
  .mp-hero-icon {
    position: absolute; top: 20px; right: 24px; z-index: 1;
    opacity: .18; color: #fff;
  }

  /* ── PRICE CARD ───────────────────────────────────────────── */
  .mp-price-card {
    background: var(--white); border-radius: 16px;
    padding: 28px 32px; margin-bottom: 28px;
    box-shadow: var(--shadow-md); border: 1.5px solid #e0e7ef;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 24px;
    font-family: 'DM Sans', sans-serif;
  }
  .mp-price-left { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .mp-price-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: var(--green-pale); color: var(--green-mid);
    display: flex; align-items: center; justify-content: center;
  }
  .mp-price-info { }
  .mp-price-label {
    font-size: .85rem; text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--grey-mid); font-weight: 600; margin-bottom: 4px;
  }
  .mp-price-value {
    font-size: 3.5rem; font-weight: 800; color: var(--grey-dark);
    line-height: 1; font-family: 'Playfair Display', serif;
  }
  .mp-price-currency {
    font-size: 1.2rem; color: var(--grey-mid); font-weight: 400;
    margin-left: 8px;
  }
  .mp-price-change {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: 50px;
    font-weight: 700; font-size: 1.1rem;
    background: #f1f8e9; color: var(--green-mid);
  }
  .mp-price-change.negative { background: #ffebee; color: var(--red); }
  .mp-price-change.neutral { background: #eceff1; color: var(--grey-mid); }

  .mp-price-right {
    display: flex; flex-direction: column; align-items: flex-end;
    gap: 10px;
  }
  .mp-source-info {
    font-size: .85rem; color: var(--grey-mid);
    display: flex; align-items: center; gap: 6px;
  }
  .mp-updated-info {
    font-size: .8rem; color: var(--grey-mid);
    display: flex; align-items: center; gap: 6px;
  }
  .mp-stale-badge {
    background: #fff8e1; color: #f57f17;
    padding: 6px 14px; border-radius: 50px;
    font-size: .75rem; font-weight: 700; display: flex; align-items: center; gap: 6px;
  }

  /* ── STATS ROW ───────────────────────────────────────────── */
  .mp-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 14px; margin-bottom: 28px;
  }
  .mp-stat-card {
    background: var(--white); border-radius: 12px;
    padding: 20px 18px; display: flex; align-items: center; gap: 16px;
    box-shadow: var(--shadow-sm); border: 1.5px solid transparent;
    font-family: 'DM Sans', sans-serif;
    transition: transform .18s, box-shadow .18s;
  }
  .mp-stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .mp-stat-icon-wrap {
    width: 52px; height: 52px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mp-stat-icon-wrap.confidence { background: #e8f5e9; color: var(--green-mid); }
  .mp-stat-icon-wrap.sentiment { background: #e0f7fa; color: var(--teal); }
  .mp-stat-icon-wrap.projection { background: #fff8e1; color: var(--amber); }
  .mp-stat-info { flex: 1; }
  .mp-stat-value {
    font-size: 1.7rem; font-weight: 700; color: var(--grey-dark);
    line-height: 1; font-family: 'Playfair Display', serif;
  }
  .mp-stat-label {
    font-size: .72rem; color: var(--grey-mid); margin-top: 4px;
    text-transform: uppercase; letter-spacing: .6px; font-weight: 500;
  }

  /* ── FILTER BAR ─────────────────────────────────────────── */
  .mp-filter-bar {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: var(--white); padding: 14px 20px;
    border-radius: 10px; box-shadow: var(--shadow-sm);
    margin-bottom: 24px; font-family: 'DM Sans', sans-serif;
  }
  .mp-filter-select {
    padding: 8px 14px; border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    cursor: pointer; outline: none; transition: border-color .2s;
  }
  .mp-filter-select:focus { border-color: var(--green-mid); background: #fff; }
  .mp-filter-count {
    margin-left: auto; font-size: .82rem; color: var(--grey-mid);
    font-weight: 500; white-space: nowrap; display: flex; align-items: center; gap: 8px;
  }

  /* ── CHART CARD ───────────────────────────────────── */
  .mp-chart-card {
    background: var(--white); border-radius: 16px;
    padding: 24px; margin-bottom: 24px;
    box-shadow: var(--shadow-sm); border: 1.5px solid #e0e7ef;
    font-family: 'DM Sans', sans-serif;
  }
  .mp-chart-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px; flex-wrap: wrap; gap: 16px;
  }
  .mp-chart-title {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Playfair Display', serif; font-size: 1.2rem;
    font-weight: 700; color: var(--grey-dark);
  }
  .mp-chart-toggle-group {
    display: flex; gap: 6px; background: var(--grey-light);
    padding: 4px; border-radius: 8px;
  }
  .mp-chart-toggle {
    padding: 6px 16px; border: none; border-radius: 6px;
    font-family: 'DM Sans', sans-serif; font-size: .8rem;
    font-weight: 600; cursor: pointer; background: transparent;
    color: var(--grey-mid); transition: all .15s;
  }
  .mp-chart-toggle:hover { background: rgba(46,125,50,.1); color: var(--green-mid); }
  .mp-chart-toggle.active {
    background: var(--green-mid); color: #fff;
  }
  .mp-chart-container {
    width: 100%; height: 320px;
  }

  /* ── AI ANALYSIS CARD ─────────────────────────────────────── */
  .mp-analysis-card {
    background: var(--white); border-radius: 16px;
    padding: 28px; margin-bottom: 24px;
    box-shadow: var(--shadow-sm); border: 1.5px solid #e0e7ef;
    font-family: 'DM Sans', sans-serif;
  }
  .mp-analysis-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
  }
  .mp-analysis-title {
    font-family: 'Playfair Display', serif; font-size: 1.2rem;
    font-weight: 700; color: var(--grey-dark);
  }
  .mp-analysis-text {
    font-size: .95rem; line-height: 1.8; color: #546e7a;
    margin-bottom: 24px;
  }
  .mp-features-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px; margin-top: 16px;
  }
  .mp-feature-item {
    background: #f8fafc; border-radius: 12px;
    padding: 16px; border: 1px solid #e2e8f0;
  }
  .mp-feature-name {
    font-weight: 700; color: var(--grey-dark); margin-bottom: 10px;
    font-size: .95rem;
  }
  .mp-feature-detail {
    display: flex; justify-content: space-between; align-items: center;
    font-size: .85rem;
  }
  .mp-feature-impact {
    padding: 4px 12px; border-radius: 50px; font-weight: 600;
  }
  .mp-feature-impact.high { background: #ffebee; color: var(--red); }
  .mp-feature-impact.medium { background: #fff8e1; color: #f57f17; }
  .mp-feature-impact.low { background: #e8f5e9; color: var(--green-mid); }
  .mp-feature-sentiment.positive { color: var(--green-mid); font-weight: 600; }
  .mp-feature-sentiment.negative { color: var(--red); font-weight: 600; }
  .mp-feature-sentiment.neutral { color: var(--grey-mid); font-weight: 600; }

  /* ── RECOMMENDATIONS CARD ────────────────────────────────── */
  .mp-recommendations-card {
    background: var(--white); border-radius: 16px;
    padding: 28px; margin-bottom: 24px;
    box-shadow: var(--shadow-sm); border: 1.5px solid #e0e7ef;
    font-family: 'DM Sans', sans-serif;
  }
  .mp-recommendations-title {
    font-family: 'Playfair Display', serif; font-size: 1.2rem;
    font-weight: 700; color: var(--grey-dark); margin-bottom: 18px;
    display: flex; align-items: center; gap: 8px;
  }
  .mp-recommendation-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid #e2e8f0;
  }
  .mp-recommendation-item:last-child { border-bottom: none; }
  .mp-recommendation-bullet {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green-mid); margin-top: 10px; flex-shrink: 0;
  }
  .mp-recommendation-text {
    color: #546e7a; line-height: 1.7; font-size: .93rem;
  }

  /* ── ACTION BUTTONS ─────────────────────────────────────── */
  .mp-actions {
    display: flex; gap: 10px; margin-bottom: 24px;
    justify-content: flex-end;
  }
  .mp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: .92rem;
    font-weight: 700; cursor: pointer; transition: all .18s;
    letter-spacing: .2px;
  }
  .mp-btn:active { transform: scale(.97); }
  .mp-btn:disabled { opacity: .55; cursor: not-allowed; }
  .mp-btn-refresh {
    background: var(--grey-light); color: var(--grey-mid);
  }
  .mp-btn-refresh:hover:not(:disabled) {
    background: var(--grey-mid); color: #fff;
  }
  .mp-btn-force {
    background: var(--green-mid); color: #fff;
    box-shadow: 0 4px 14px rgba(46,125,50,.3);
  }
  .mp-btn-force:hover:not(:disabled) {
    background: var(--green-dark); transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(46,125,50,.4);
  }

  /* ── NOTIFICATION ───────────────────────────────────────── */
  .mp-notification {
    position: fixed; top: 22px; right: 22px; padding: 13px 22px;
    border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: .9rem; font-weight: 600; box-shadow: var(--shadow-md);
    z-index: 2000; display: flex; align-items: center; gap: 8px;
    animation: mpSlideIn .3s ease;
  }
  .mp-notification.success { background: var(--green-mid); color: #fff; }
  .mp-notification.error   { background: var(--red); color: #fff; }
  @keyframes mpSlideIn { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }

  /* ── EMPTY / LOADING ────────────────────────────────────── */
  .mp-empty {
    text-align: center; padding: 80px 20px;
    font-family: 'DM Sans', sans-serif; color: var(--grey-mid);
  }
  .mp-empty-icon { margin-bottom: 16px; opacity: .35; }
  .mp-empty-text { font-size: 1rem; }
`;

// ── Utility Functions ─────────────────────────────────────────────────────
const toNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const truncateText = (value = '', max = 180) => {
  const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3).trim()}...`;
};

const formatSourceLabel = (source, sourceSymbol) => {
  const provider = String(source || '').trim().toLowerCase();
  const providerLabel = provider === 'stooq'
    ? 'Stooq Exchange'
    : provider ? `Source: ${provider.toUpperCase()}` : 'Source: Unknown';
  const symbol = String(sourceSymbol || '').trim().toUpperCase();
  return symbol ? `${providerLabel} (${symbol})` : providerLabel;
};

const formatUpdatedLabel = (timestamp) => {
  const parsed = new Date(timestamp || '');
  if (Number.isNaN(parsed.getTime())) return 'Updated: -';
  return parsed.toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const compressLabels = (labels = [], maxVisible = 6) => {
  if (!Array.isArray(labels) || labels.length <= maxVisible) return labels;
  const step = Math.ceil(labels.length / maxVisible);
  return labels.map((label, idx) => (idx % step === 0 || idx === labels.length - 1 ? label : ''));
};

const normalizeSeries = (values, labels, fallbackLabels) => {
  const safeValues = Array.isArray(values) && values.length > 0
    ? values.map(v => toNumber(v, 0))
    : [0];

  let safeLabels = Array.isArray(labels) && labels.length > 0 ? labels : fallbackLabels;

  if (safeLabels.length !== safeValues.length) {
    if (safeLabels.length > safeValues.length) {
      safeLabels = safeLabels.slice(safeLabels.length - safeValues.length);
    } else {
      const base = safeLabels.length > 0 ? safeLabels[0] : (fallbackLabels[0] || '');
      safeLabels = [...Array(safeValues.length - safeLabels.length).fill(base), ...safeLabels];
    }
  }
  return { labels: safeLabels, values: safeValues };
};

// ── Main Component ────────────────────────────────────────────────────────
const MarketPrice = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketData, setMarketData] = useState({
    currentPrice: 0,
    priceChange: 0,
    lastUpdated: '',
    dayHistory: [],
    dayLabels: [],
    monthHistory: [],
    monthLabels: [],
    yearHistory: [],
    yearLabels: [],
    trend: 'NEUTRAL',
    confidence: 0,
    nextWeekPrice: 0,
    source: '',
    sourceSymbol: '',
    stale: false,
    features: [],
    analysis: '',
    recommendations: []
  });
  const [chartPeriod, setChartPeriod] = useState('1D');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const fetchMarketData = useCallback(async (force = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setRefreshing(true);
      const endpoints = ['/api/v1/market/latest', '/api/market/latest'];
      let payload = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
            params: { force },
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response?.data?.success) {
            payload = response.data;
            break;
          }
          lastError = new Error(response?.data?.error || 'Failed to fetch market data');
        } catch (requestError) {
          if (requestError?.response?.status === 404) {
            lastError = requestError;
            continue;
          }
          throw requestError;
        }
      }

      if (!payload?.success) {
        throw lastError || new Error('Failed to fetch market data');
      }

      const data = payload.data || {};

      const dayHistory = Array.isArray(data.dayHistory) && data.dayHistory.length > 0
        ? data.dayHistory : (Array.isArray(data.dailyHistory) ? data.dailyHistory : []);
      const dayLabels = Array.isArray(data.dayLabels) && data.dayLabels.length > 0
        ? data.dayLabels : (Array.isArray(data.dailyLabels) ? data.dailyLabels : []);

      const monthHistory = Array.isArray(data.monthHistory) && data.monthHistory.length > 0
        ? data.monthHistory : (Array.isArray(data.monthlyHistory) ? data.monthlyHistory : []);
      const monthLabels = Array.isArray(data.monthLabels) && data.monthLabels.length > 0
        ? data.monthLabels : (Array.isArray(data.monthlyLabels) ? data.monthlyLabels : []);

      const yearHistory = Array.isArray(data.yearHistory) && data.yearHistory.length > 0
        ? data.yearHistory : (Array.isArray(data.monthlyHistory) ? data.monthlyHistory : []);
      const yearLabels = Array.isArray(data.yearLabels) && data.yearLabels.length > 0
        ? data.yearLabels : (Array.isArray(data.monthlyLabels) ? data.monthlyLabels : []);

      setMarketData({
        currentPrice: toNumber(data.price, 0),
        priceChange: toNumber(data.priceChange, 0),
        lastUpdated: data.sourceTimestamp || data.timestamp || new Date().toISOString(),
        dayHistory,
        dayLabels,
        monthHistory,
        monthLabels,
        yearHistory,
        yearLabels,
        trend: data.trend || 'NEUTRAL',
        confidence: toNumber(data.confidence, 0),
        nextWeekPrice: toNumber(data.nextWeekProjection, 0),
        source: data.source || '',
        sourceSymbol: data.sourceSymbol || '',
        stale: Boolean(data.stale),
        features: Array.isArray(data.features) ? data.features : [],
        analysis: truncateText(data.analysis || '', 260),
        recommendations: (Array.isArray(data.recommendations) ? data.recommendations : []).slice(0, 6)
      });

      if (force) {
        showNotification('Market data refreshed successfully');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to fetch market data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE_URL, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchMarketData(false);

    const interval = setInterval(() => {
      fetchMarketData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchMarketData, navigate]);

  const handleRefresh = (force = false) => {
    fetchMarketData(force);
  };

  // Prepare chart data
  const chartRows = useMemo(() => {
    const defaultDayLabels = Array.from({ length: 24 }).map((_, idx) => {
      const hour = idx.toString().padStart(2, '0');
      return `${hour}:00`;
    });
    const defaultMonthLabels = Array.from({ length: 30 }).map((_, idx) => `${idx + 1}`);
    const defaultYearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const series = chartPeriod === '1D'
      ? normalizeSeries(marketData.dayHistory, marketData.dayLabels, defaultDayLabels)
      : chartPeriod === '1M'
        ? normalizeSeries(marketData.monthHistory, marketData.monthLabels, defaultMonthLabels)
        : normalizeSeries(marketData.yearHistory, marketData.yearLabels, defaultYearLabels);

    const compressed = compressLabels(series.labels, chartPeriod === '1D' ? 8 : 6);

    return series.values.map((value, idx) => ({
      value,
      label: series.labels[idx],
      displayLabel: compressed[idx]
    }));
  }, [chartPeriod, marketData.dayHistory, marketData.dayLabels, marketData.monthHistory, marketData.monthLabels, marketData.yearHistory, marketData.yearLabels]);

  // Determine trend icon and color
  const TrendIcon = marketData.trend === 'RISE' ? TrendingUpIcon :
                    marketData.trend === 'FALL' ? TrendingDownIcon : TrendingFlatIcon;

  const trendColor = marketData.trend === 'RISE' ? '#2e7d32' :
                     marketData.trend === 'FALL' ? '#e53935' : '#f57f17';

  const trendText = marketData.trend === 'RISE' ? 'BULLISH' :
                    marketData.trend === 'FALL' ? 'BEARISH' : 'SIDEWAYS';

  const sourceLabel = formatSourceLabel(marketData.source, marketData.sourceSymbol);
  const updatedLabel = formatUpdatedLabel(marketData.lastUpdated);

  if (loading && marketData.currentPrice <= 0) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{ display: 'flex' }}>
          <LeftNavigationBar />
          <div style={{ marginLeft: 250, padding: '28px 32px', width: 'calc(100% - 250px)', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
            <div className="mp-empty">
              <div className="mp-empty-icon"><ClockIcon size={52} /></div>
              <p className="mp-empty-text">Loading market data...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex' }}>
        <LeftNavigationBar />

        <div style={{ marginLeft: 250, padding: '28px 32px', width: 'calc(100% - 250px)', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>

          {/* Notification */}
          {notification.show && (
            <div className={`mp-notification ${notification.type}`}>
              {notification.type === 'success' ? <CheckIcon size={15} /> : <CloseIcon size={14} />}
              {notification.message}
            </div>
          )}

          {/* Hero Banner */}
          <div className="mp-hero">
            <img
              className="mp-hero-img"
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80"
              alt="Market Prices"
            />
            <div className="mp-hero-overlay" />
            <div className="mp-hero-content">
              <h1 className="mp-hero-title">Market Prices</h1>
              <p className="mp-hero-sub">Live RSS3 rubber prices with AI-powered insights</p>
            </div>
            <div className="mp-hero-icon">
              <ChartIcon size={110} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mp-actions">
            <button
              className="mp-btn mp-btn-refresh"
              onClick={() => handleRefresh(false)}
              disabled={refreshing}
            >
              <RefreshIcon size={16} /> Refresh
            </button>
            <button
              className="mp-btn mp-btn-force"
              onClick={() => handleRefresh(true)}
              disabled={refreshing}
            >
              <BoltIcon size={16} /> Force Update
            </button>
          </div>

          {/* Main Price Card */}
          <div className="mp-price-card">
            <div className="mp-price-left">
              <div className="mp-price-icon">
                <DollarIcon size={36} />
              </div>
              <div className="mp-price-info">
                <div className="mp-price-label">RSS3 RUBBER SPOT PRICE</div>
                <div>
                  <span className="mp-price-value">
                    {marketData.currentPrice.toFixed(2)}
                  </span>
                  <span className="mp-price-currency">PHP/kg</span>
                </div>
              </div>
              <div className={`mp-price-change ${marketData.priceChange > 0 ? '' : marketData.priceChange < 0 ? 'negative' : 'neutral'}`}>
                {marketData.priceChange > 0 ? '+' : ''}{marketData.priceChange.toFixed(2)}%
              </div>
            </div>
            <div className="mp-price-right">
              <div className="mp-source-info">
                <InfoIcon size={14} /> {sourceLabel}
              </div>
              <div className="mp-updated-info">
                <ClockIcon /> {updatedLabel}
              </div>
              {marketData.stale && (
                <div className="mp-stale-badge">
                  <ClockIcon size={12} /> Stale Data
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mp-stats">
            <div className="mp-stat-card">
              <div className="mp-stat-icon-wrap confidence">
                <PsychologyIcon size={24} />
              </div>
              <div className="mp-stat-info">
                <div className="mp-stat-value">{marketData.confidence}%</div>
                <div className="mp-stat-label">AI Confidence</div>
              </div>
            </div>
            <div className="mp-stat-card">
              <div className="mp-stat-icon-wrap sentiment" style={{ color: trendColor }}>
                <TrendIcon size={24} />
              </div>
              <div className="mp-stat-info">
                <div className="mp-stat-value" style={{ color: trendColor }}>{trendText}</div>
                <div className="mp-stat-label">Market Sentiment</div>
              </div>
            </div>
            <div className="mp-stat-card">
              <div className="mp-stat-icon-wrap projection">
                <ChartIcon size={24} />
              </div>
              <div className="mp-stat-info">
                <div className="mp-stat-value">PHP {marketData.nextWeekPrice.toFixed(2)}</div>
                <div className="mp-stat-label">Next Week Projection</div>
              </div>
            </div>
          </div>

          {/* Chart Card with Recharts Implementation */}
          <div className="mp-chart-card">
            <div className="mp-chart-header">
              <div className="mp-chart-title">
                <AutoGraphIcon size={20} /> Price History
              </div>
              <div className="mp-chart-toggle-group">
                <button
                  className={`mp-chart-toggle ${chartPeriod === '1D' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('1D')}
                >
                  1D
                </button>
                <button
                  className={`mp-chart-toggle ${chartPeriod === '1M' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('1M')}
                >
                  1M
                </button>
                <button
                  className={`mp-chart-toggle ${chartPeriod === '1Y' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('1Y')}
                >
                  1Y
                </button>
              </div>
            </div>
            <div className="mp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows} margin={{ top: 8, right: 10, left: 8, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
                  <XAxis 
                    dataKey="displayLabel" 
                    tick={{ fill: '#607d8b', fontSize: 11 }} 
                    axisLine={{ stroke: '#cfd8dc' }} 
                    tickLine={{ stroke: '#cfd8dc' }} 
                  />
                  <YAxis
                    tick={{ fill: '#607d8b', fontSize: 11 }}
                    axisLine={{ stroke: '#cfd8dc' }}
                    tickLine={{ stroke: '#cfd8dc' }}
                    tickFormatter={(val) => `₱${Number(val).toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={(value) => [`PHP ${toNumber(value, 0).toFixed(2)}`, 'Price']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label || '-'}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e0e7ef', 
                      borderRadius: 8, 
                      color: '#37474f',
                      boxShadow: '0 2px 8px rgba(0,0,0,.08)'
                    }}
                    labelStyle={{ color: '#607d8b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2e7d32"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: '#2e7d32' }}
                    activeDot={{ r: 4, fill: '#2e7d32' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Analysis Card */}
          {marketData.analysis && (
            <div className="mp-analysis-card">
              <div className="mp-analysis-header">
                <PsychologyIcon size={20} />
                <span className="mp-analysis-title">AI Market Analysis</span>
              </div>
              <p className="mp-analysis-text">{marketData.analysis}</p>

              {marketData.features && marketData.features.length > 0 && (
                <div className="mp-features-grid">
                  {marketData.features.slice(0, 4).map((feature, idx) => {
                    const impact = String(feature.impact || 'Medium').toLowerCase();
                    const sentiment = String(feature.sentiment || 'Neutral').toLowerCase();
                    return (
                      <div key={idx} className="mp-feature-item">
                        <div className="mp-feature-name">{feature.name || 'Market Driver'}</div>
                        <div className="mp-feature-detail">
                          <span className={`mp-feature-impact ${impact}`}>
                            {feature.impact || 'Medium'}
                          </span>
                          <span className={`mp-feature-sentiment ${sentiment}`}>
                            {feature.sentiment || 'Neutral'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recommendations Card */}
          {marketData.recommendations && marketData.recommendations.length > 0 && (
            <div className="mp-recommendations-card">
              <div className="mp-recommendations-title">
                <TrendingUpIcon size={18} /> Strategic Recommendations
              </div>
              {marketData.recommendations.map((rec, idx) => (
                <div key={idx} className="mp-recommendation-item">
                  <div className="mp-recommendation-bullet" />
                  <div className="mp-recommendation-text">{rec}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter bar for reference */}
          <div className="mp-filter-bar">
            <select className="mp-filter-select" value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)}>
              <option value="1D">Last 24 Hours</option>
              <option value="1M">Last 30 Days</option>
              <option value="1Y">Last 12 Months</option>
            </select>
            <span className="mp-filter-count">
              <ClockIcon size={12} /> Live updates every 60s
            </span>
          </div>

        </div>
      </div>
    </>
  );
};

export default MarketPrice;