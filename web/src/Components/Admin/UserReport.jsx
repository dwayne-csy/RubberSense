import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeftNavigationBar from '../layouts/LeftNavigationBar';
import { exportRowsToPdf } from '../../utils/pdfExport';

// ── SVG Icons (no MUI dependency for layout) ─────────────────────────────────
const FlagIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const ClockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CheckCircleIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const SearchIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const RefreshIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const DownloadIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
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
const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const PostIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);
const CommentIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const MessageIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const WarningIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const UserIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const ImageIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const CheckIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ThumbUpIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);
const InfoIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ── CSS ───────────────────────────────────────────────────────────────────────
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
    --blue:        #1e88e5;
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
  @keyframes urHeroFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes urHeroPulse { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .9; transform: scale(1.15); } }
  @keyframes urHeroFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes urOrb { 0% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.1); } 66% { transform: translate(-20px,15px) scale(.93); } 100% { transform: translate(0,0) scale(1); } }

  .ur-hero {
    position: relative; border-radius: 20px;
    overflow: hidden; margin-bottom: 32px; padding: 36px 40px;
    background: linear-gradient(135deg, #0d3b1c 0%, #1b6b35 40%, #0a5a4a 70%, #0d3b1c 100%);
    display: flex; align-items: center; gap: 40px; min-height: 210px;
  }
  .ur-hero::before, .ur-hero::after {
    content: ''; position: absolute; border-radius: 50%; pointer-events: none;
  }
  .ur-hero::before {
    width: 340px; height: 340px; top: -100px; right: 160px;
    background: radial-gradient(circle, rgba(0,191,165,.22) 0%, transparent 70%);
    animation: urOrb 9s ease-in-out infinite;
  }
  .ur-hero::after {
    width: 260px; height: 260px; bottom: -80px; right: 60px;
    background: radial-gradient(circle, rgba(67,160,71,.25) 0%, transparent 70%);
    animation: urOrb 12s ease-in-out infinite reverse;
  }

  .ur-hero-left { position: relative; z-index: 2; flex: 1; animation: urHeroFadeUp .55s ease both; }

  .ur-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18);
    padding: 5px 14px; border-radius: 50px; margin-bottom: 14px;
    font-family: 'DM Sans', sans-serif; font-size: .72rem; font-weight: 700;
    color: rgba(255,255,255,.88); text-transform: uppercase; letter-spacing: 1.2px;
    backdrop-filter: blur(8px);
  }
  .ur-hero-eyebrow-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #00e5cc;
    animation: urHeroPulse 2s ease-in-out infinite;
  }

  .ur-hero-title {
    font-family: 'Playfair Display', serif; font-size: 2.4rem;
    color: #fff; margin: 0 0 10px; line-height: 1.1; letter-spacing: -.6px;
  }
  .ur-hero-title span { color: #4dd0e1; }

  .ur-hero-sub {
    font-family: 'DM Sans', sans-serif; font-size: .9rem;
    color: rgba(255,255,255,.6); margin: 0; font-weight: 300;
    max-width: 380px; line-height: 1.6;
  }

  /* content-type tiles */
  .ur-hero-tiles {
    position: relative; z-index: 2;
    display: flex; gap: 12px; flex-shrink: 0;
    animation: urHeroFadeUp .55s .15s ease both;
  }
  .ur-hero-tile {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 20px 20px 16px; border-radius: 16px;
    background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.12);
    backdrop-filter: blur(12px); cursor: default; transition: all .25s;
    min-width: 88px;
  }
  .ur-hero-tile:hover {
    background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.26);
    transform: translateY(-6px); box-shadow: 0 12px 32px rgba(0,0,0,.25);
  }
  .ur-hero-tile:nth-child(1) { animation: urHeroFloat 5.2s ease-in-out 0s infinite; }
  .ur-hero-tile:nth-child(2) { animation: urHeroFloat 5.2s ease-in-out .9s infinite; }
  .ur-hero-tile:nth-child(3) { animation: urHeroFloat 5.2s ease-in-out 1.8s infinite; }

  .ur-hero-tile-icon {
    width: 48px; height: 48px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
  }
  .ur-hero-tile-icon.post    { background: rgba(129,199,132,.22); color: #a5d6a7; }
  .ur-hero-tile-icon.comment { background: rgba(77,208,225,.18);  color: #80deea; }
  .ur-hero-tile-icon.msg     { background: rgba(240,98,146,.18);  color: #f48fb1; }

  .ur-hero-tile-label {
    font-family: 'DM Sans', sans-serif; font-size: .73rem; font-weight: 700;
    color: rgba(255,255,255,.8); text-transform: uppercase; letter-spacing: .8px;
  }
  .ur-hero-tile-sub {
    font-family: 'DM Sans', sans-serif; font-size: .67rem;
    color: rgba(255,255,255,.42); letter-spacing: .2px; white-space: nowrap;
  }

  /* ── STATS ───────────────────────────────────────────────── */
  .ur-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 14px; margin-bottom: 28px;
  }
  .ur-stat-card {
    background: var(--white); border-radius: 12px;
    padding: 20px 18px; display: flex; align-items: center; gap: 16px;
    box-shadow: var(--shadow-sm); border: 1.5px solid transparent;
    font-family: 'DM Sans', sans-serif; transition: transform .18s, box-shadow .18s;
  }
  .ur-stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .ur-stat-card.highlight { border-color: var(--amber); }
  .ur-stat-icon-wrap {
    width: 52px; height: 52px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ur-stat-icon-wrap.total   { background: #e8f5e9; color: var(--green-mid); }
  .ur-stat-icon-wrap.pending { background: #fff8e1; color: var(--amber); }
  .ur-stat-icon-wrap.resolved{ background: #e0f7fa; color: var(--teal); }
  .ur-stat-info { flex: 1; }
  .ur-stat-count { font-size: 1.7rem; font-weight: 700; color: var(--grey-dark); line-height: 1; }
  .ur-stat-label { font-size: .72rem; color: var(--grey-mid); margin-top: 4px; text-transform: uppercase; letter-spacing: .6px; font-weight: 500; }
  .ur-stat-bar { margin-top: 8px; height: 4px; background: #eceff1; border-radius: 2px; overflow: hidden; }
  .ur-stat-bar-fill { height: 100%; background: var(--amber); border-radius: 2px; transition: width .4s; }

  /* ── TABS ────────────────────────────────────────────────── */
  .ur-tabs {
    display: flex; gap: 4px; background: var(--white);
    padding: 6px; border-radius: 10px; box-shadow: var(--shadow-sm);
    margin-bottom: 16px; font-family: 'DM Sans', sans-serif;
    width: fit-content;
  }
  .ur-tab {
    padding: 8px 20px; border: none; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: .86rem; font-weight: 600;
    cursor: pointer; transition: all .18s; color: var(--grey-mid); background: transparent;
  }
  .ur-tab.active { background: var(--green-mid); color: #fff; box-shadow: 0 2px 8px rgba(46,125,50,.25); }
  .ur-tab:hover:not(.active) { background: var(--green-pale); color: var(--green-mid); }

  /* ── FILTER BAR ──────────────────────────────────────────── */
  .ur-filter-bar {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: var(--white); padding: 14px 20px;
    border-radius: 10px; box-shadow: var(--shadow-sm);
    margin-bottom: 24px; font-family: 'DM Sans', sans-serif;
  }
  .ur-filter-select {
    padding: 8px 14px; border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    cursor: pointer; outline: none; transition: border-color .2s;
  }
  .ur-filter-select:focus { border-color: var(--green-mid); background: #fff; }
  .ur-search-wrap { flex: 1; min-width: 220px; position: relative; display: flex; align-items: center; }
  .ur-search-icon { position: absolute; left: 12px; color: var(--grey-mid); pointer-events: none; display: flex; }
  .ur-search-input {
    width: 100%; padding: 8px 14px 8px 36px;
    border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    outline: none; transition: border-color .2s; box-sizing: border-box;
  }
  .ur-search-input:focus { border-color: var(--green-mid); background: #fff; }
  .ur-filter-count { font-size: .82rem; color: var(--grey-mid); font-weight: 500; white-space: nowrap; }

  /* ── REPORT CARD ─────────────────────────────────────────── */
  .ur-card {
    background: var(--white); border-radius: var(--radius);
    padding: 22px 26px; margin-bottom: 16px;
    box-shadow: var(--shadow-sm); border: 1.5px solid #e0e7ef;
    transition: box-shadow .22s, border-color .22s, transform .22s;
    font-family: 'DM Sans', sans-serif; position: relative; overflow: hidden;
  }
  .ur-card::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 4px; height: 100%; border-radius: 4px 0 0 4px;
    background: var(--grey-light); opacity: 0; transition: opacity .2s;
  }
  .ur-card:hover { box-shadow: var(--shadow-md); border-color: #b2dfdb; transform: translateY(-2px); }
  .ur-card:hover::before { opacity: 1; }
  .ur-card.pending { background: #fffdf5; border-color: #ffe082; }
  .ur-card.pending::before { background: var(--amber); opacity: 1; }
  .ur-card.resolved::before { background: var(--teal); opacity: 1; }

  .ur-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
  .ur-card-reporter { display: flex; align-items: center; gap: 12px; }
  .ur-card-avatar {
    width: 44px; height: 44px; border-radius: 12px;
    background: var(--green-pale); color: var(--green-mid);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700;
    flex-shrink: 0; overflow: hidden;
  }
  .ur-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ur-card-reporter-name { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--grey-dark); margin: 0 0 2px; }
  .ur-card-reporter-email { font-size: .78rem; color: var(--grey-mid); margin: 0; }
  .ur-card-meta { text-align: right; flex-shrink: 0; }
  .ur-card-date { font-size: .74rem; color: #90a4ae; margin-top: 6px; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }

  .ur-card-body { font-size: .88rem; line-height: 1.65; color: #546e7a; margin: 0 0 14px; padding: 12px 14px; background: var(--grey-light); border-radius: 8px; }

  .ur-card-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .ur-card-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ur-card-id { font-family: monospace; font-size: .72rem; color: #90a4ae; }

  /* ── BADGE ───────────────────────────────────────────────── */
  .ur-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 13px; border-radius: 50px;
    font-size: .7rem; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  }
  .ur-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .ur-badge.pending  { background: #fff8e1; color: #f57f17; }
  .ur-badge.pending  .ur-badge-dot { background: var(--amber); }
  .ur-badge.resolved { background: #e0f7fa; color: var(--teal); }
  .ur-badge.resolved .ur-badge-dot { background: var(--teal); }
  .ur-badge.post     { background: var(--green-pale); color: var(--green-mid); }
  .ur-badge.comment  { background: #e3f2fd; color: var(--blue); }
  .ur-badge.message  { background: #fce4ec; color: #c62828; }
  .ur-badge.reason   { background: #eceff1; color: var(--grey-mid); }

  /* ── ACTION BUTTONS ──────────────────────────────────────── */
  .ur-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .ur-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 15px; border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .83rem; font-weight: 600;
    cursor: pointer; transition: all .18s; letter-spacing: .2px;
  }
  .ur-btn:active { transform: scale(.97); }
  .ur-btn:disabled { opacity: .55; cursor: not-allowed; }
  .ur-btn-view     { background: var(--green-pale); color: var(--green-mid); }
  .ur-btn-view:hover:not(:disabled)     { background: var(--green-mid); color: #fff; }
  .ur-btn-resolve  { background: #e0f7fa; color: var(--teal); }
  .ur-btn-resolve:hover:not(:disabled)  { background: var(--teal); color: #fff; }
  .ur-btn-hide     { background: #fff3e0; color: #e65100; }
  .ur-btn-hide:hover:not(:disabled)     { background: #e65100; color: #fff; }
  .ur-btn-delete   { background: #ffebee; color: var(--red); }
  .ur-btn-delete:hover:not(:disabled)   { background: var(--red); color: #fff; }
  .ur-btn-refresh  { background: var(--grey-light); color: var(--grey-mid); }
  .ur-btn-refresh:hover:not(:disabled)  { background: var(--grey-mid); color: #fff; }
  .ur-btn-cancel   { background: #eceff1; color: var(--grey-mid); }
  .ur-btn-cancel:hover:not(:disabled)   { background: #cfd8dc; }
  .ur-btn-submit   { background: var(--green-mid); color: #fff; }
  .ur-btn-submit:hover:not(:disabled)   { background: var(--green-dark); }

  /* ── MODAL ───────────────────────────────────────────────── */
  .ur-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.65);
    backdrop-filter: blur(4px); display: flex; justify-content: center;
    align-items: center; z-index: 1000; padding: 20px;
  }
  .ur-modal {
    background: var(--white); border-radius: 18px;
    width: 100%; max-width: 700px; max-height: 92vh;
    overflow-y: auto; box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
  }
  .ur-modal.wide { max-width: 860px; }
  .ur-modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 28px 0; position: sticky; top: 0; background: #fff;
    border-radius: 18px 18px 0 0; z-index: 1;
  }
  .ur-modal-title { font-family: 'Playfair Display', serif; font-size: 1.45rem; color: var(--grey-dark); margin: 0; }
  .ur-modal-close {
    width: 36px; height: 36px; border-radius: 50%;
    border: none; background: var(--grey-light); color: var(--grey-mid);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .18s; flex-shrink: 0;
  }
  .ur-modal-close:hover { background: #cfd8dc; }
  .ur-modal-divider { height: 2px; background: linear-gradient(90deg, var(--green-mid), var(--accent)); margin: 12px 28px 0; border-radius: 2px; }
  .ur-modal-body { padding: 24px 28px; }
  .ur-modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 28px 28px; border-top: 1px solid var(--grey-light); }

  /* ── MODAL SECTIONS ──────────────────────────────────────── */
  .ur-section-label {
    font-size: .72rem; font-weight: 700; color: var(--grey-mid);
    text-transform: uppercase; letter-spacing: .8px; margin: 0 0 14px;
  }
  .ur-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px; }
  .ur-info-item {}
  .ur-info-caption { font-size: .74rem; color: var(--grey-mid); margin: 0 0 4px; font-weight: 500; }
  .ur-info-value { font-size: .93rem; color: var(--grey-dark); margin: 0; font-weight: 500; }
  .ur-info-value.mono { font-family: monospace; font-size: .82rem; }

  .ur-desc-box {
    background: var(--grey-light); border-radius: 10px; padding: 16px 18px;
    font-size: .93rem; color: var(--grey-dark); line-height: 1.65;
    margin-bottom: 22px;
  }

  .ur-content-box {
    background: var(--grey-light); border-radius: 10px;
    padding: 18px 20px; margin-bottom: 18px;
    font-size: .93rem; color: var(--grey-dark); line-height: 1.65;
    white-space: pre-wrap;
  }

  .ur-alert {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 13px 16px; border-radius: 10px; font-size: .87rem;
    margin-bottom: 16px; font-family: 'DM Sans', sans-serif;
  }
  .ur-alert.warning { background: #fff8e1; color: #e65100; border: 1px solid #ffe082; }
  .ur-alert.info    { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
  .ur-alert.success { background: #e8f5e9; color: var(--green-dark); border: 1px solid #a5d6a7; }
  .ur-alert.error   { background: #ffebee; color: var(--red); border: 1px solid #ef9a9a; }
  .ur-alert-icon { flex-shrink: 0; margin-top: 1px; }

  .ur-participants { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
  .ur-participant { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--grey-light); border-radius: 10px; }
  .ur-participant-avatar {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: var(--green-pale); color: var(--green-mid);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-weight: 700; overflow: hidden;
  }
  .ur-participant-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ur-participant-label { font-size: .72rem; color: var(--grey-mid); margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
  .ur-participant-name { font-size: .9rem; color: var(--grey-dark); margin: 0; font-weight: 600; }

  .ur-media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
  .ur-media-item { border-radius: 8px; overflow: hidden; aspect-ratio: 1; background: var(--grey-light); cursor: pointer; }
  .ur-media-item img, .ur-media-item video { width: 100%; height: 100%; object-fit: cover; display: block; }

  .ur-stat-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }

  /* ── NOTIFICATION ────────────────────────────────────────── */
  .ur-notification {
    position: fixed; top: 22px; right: 22px; padding: 13px 22px;
    border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: .9rem; font-weight: 600; box-shadow: var(--shadow-md);
    z-index: 9999; display: flex; align-items: center; gap: 8px;
    animation: urSlideIn .3s ease;
  }
  .ur-notification.success { background: var(--green-mid); color: #fff; }
  .ur-notification.error   { background: var(--red); color: #fff; }
  @keyframes urSlideIn { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }

  /* ── EMPTY / LOADING ─────────────────────────────────────── */
  .ur-empty { text-align: center; padding: 60px 20px; font-family: 'DM Sans', sans-serif; color: var(--grey-mid); }
  .ur-empty-icon { margin-bottom: 16px; display: flex; justify-content: center; opacity: .35; color: var(--grey-mid); }
  .ur-empty-text { font-size: 1rem; }
  .ur-spinner {
    width: 40px; height: 40px; border: 3px solid var(--grey-light);
    border-top-color: var(--green-mid); border-radius: 50%;
    animation: urSpin .7s linear infinite; margin: 0 auto;
  }
  @keyframes urSpin { to { transform: rotate(360deg); } }
`;

// ─────────────────────────────────────────────────────────────────────────────
const UserReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openResolveDialog, setOpenResolveDialog] = useState(false);
  const [openPostModal, setOpenPostModal] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [contentLoading, setContentLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = API_BASE_URL;
  }, [API_BASE_URL]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let endpoint = '/api/v1/admin/reports';
      if (currentTab === 1) endpoint = '/api/v1/admin/reports/pending';
      else if (currentTab === 2) endpoint = '/api/v1/admin/reports/resolved';
      const response = await axios.get(endpoint, {
        params: { page: 1, limit: 100, type: typeFilter !== 'all' ? typeFilter : '', search: searchTerm },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(response.data.data);
        if (currentTab === 0) calculateStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to fetch reports.', severity: 'error' });
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get('/api/v1/admin/reports/stats', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        setStats({ total: response.data.data.total || 0, pending: response.data.data.pending || 0, resolved: response.data.data.resolved || 0 });
      }
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  const calculateStats = (reportsData) => {
    setStats({ total: reportsData.length, pending: reportsData.filter(r => r.status === 'pending').length, resolved: reportsData.filter(r => r.status === 'resolved').length });
  };

  const fetchPostDetails = async (postId) => {
    try {
      setContentLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`/api/v1/admin/reports/posts/${postId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) return response.data.data;
      return null;
    } catch (error) {
      console.error('Error fetching post details:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to fetch post details', severity: 'error' });
      return null;
    } finally { setContentLoading(false); }
  };

  const fetchCommentDetails = async (commentId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`/api/v1/admin/reports/comments/${commentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) return response.data.data;
      return null;
    } catch (error) { console.error('Error fetching comment details:', error); return null; }
  };

  const fetchMessageDetails = async (messageId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`/api/v1/admin/reports/messages/${messageId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) return response.data.data;
      return null;
    } catch (error) { console.error('Error fetching message details:', error); return null; }
  };

  const renderMedia = (media, type = 'post') => {
    if (!media || media.length === 0) return null;
    return (
      <div>
        <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--grey-mid)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ImageIcon size={13} /> {type === 'comment' ? 'Comment' : 'Post'} Media ({media.length})
        </p>
        <div className="ur-media-grid">
          {media.map((item, index) => (
            <div key={index} className="ur-media-item">
              {item.mimetype?.startsWith('image/') ? (
                <img src={`${API_BASE_URL}${item.url}`} alt={`media ${index + 1}`} onClick={() => window.open(`${API_BASE_URL}${item.url}`, '_blank')} />
              ) : item.mimetype?.startsWith('video/') ? (
                <video src={`${API_BASE_URL}${item.url}`} controls />
              ) : (
                <div style={{ padding: 12, fontSize: '.78rem', color: 'var(--grey-mid)' }}>{item.mimetype || 'Unknown'}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => { fetchReports(); fetchStats(); }, [currentTab, typeFilter]);
  useEffect(() => { if (currentTab === 0) calculateStats(reports); }, [reports, currentTab]);

  const handleViewReport = (report) => { setSelectedReport(report); setOpenDialog(true); };

  const handleViewPost = async (report) => {
    try {
      setContentLoading(true);
      if (report.reportedItemType === 'post') {
        const postDetails = await fetchPostDetails(report.reportedItemId);
        if (postDetails) {
          setViewingPost({ ...postDetails, reportId: report._id, reportReason: report.reason, reportDescription: report.description, reporter: report.reporter, reportStatus: report.status, isReportedContent: true, reportedItemId: report.reportedItemId });
        } else {
          setViewingPost({ _id: report.reportedItemId, title: report.reportedItem?.title || 'Post not available', content: report.reportedItem?.content || 'This post may have been deleted.', user: report.reportedItem?.user || { name: 'Unknown User' }, media: [], comments: [], createdAt: report.createdAt, reportId: report._id, reportReason: report.reason, reportDescription: report.description, reporter: report.reporter, reportStatus: report.status, isReportedContent: true, isUnavailable: true, reportedItemId: report.reportedItemId });
        }
      } else if (report.reportedItemType === 'comment') {
        const commentDetails = await fetchCommentDetails(report.reportedItemId);
        if (commentDetails) {
          setViewingPost({ _id: `comment-${report.reportedItemId}`, isCommentOnly: true, title: 'Reported Comment', content: '', user: { name: 'System' }, reportedComment: { _id: report.reportedItemId, content: commentDetails.content || 'Comment not available', user: commentDetails.user || { name: 'Unknown User' }, media: commentDetails.media || [], createdAt: commentDetails.createdAt || report.createdAt, isHidden: commentDetails.isHidden || false }, postInfo: commentDetails.post ? { title: commentDetails.post.title || 'Related Post', id: commentDetails.post._id || commentDetails.post } : null, createdAt: report.createdAt, reportId: report._id, reportReason: report.reason, reportDescription: report.description, reporter: report.reporter, reportStatus: report.status, isReportedContent: true, isUnavailable: false, reportedCommentId: report.reportedItemId, reportedItemId: report.reportedItemId });
        } else {
          setViewingPost({ _id: `comment-${report.reportedItemId}`, isCommentOnly: true, title: 'Reported Comment', content: '', user: { name: 'System' }, reportedComment: { _id: report.reportedItemId, content: report.reportedItem?.content || 'Comment not available', user: report.reportedItem?.user || { name: 'Unknown User' }, media: report.reportedItem?.media || [], createdAt: report.createdAt, isHidden: false }, createdAt: report.createdAt, reportId: report._id, reportReason: report.reason, reportDescription: report.description, reporter: report.reporter, reportStatus: report.status, isReportedContent: true, isUnavailable: true, reportedCommentId: report.reportedItemId, reportedItemId: report.reportedItemId });
        }
      } else if (report.reportedItemType === 'message') {
        const messageDetails = await fetchMessageDetails(report.reportedItemId);
        if (messageDetails) {
          setViewingPost({ _id: `message-${report.reportedItemId}`, isMessageOnly: true, title: 'Reported Message', content: '', reportedMessage: { _id: report.reportedItemId, content: messageDetails.content || 'Message not available', sender: messageDetails.sender || { name: 'Unknown User' }, recipient: messageDetails.recipient || { name: 'Unknown User' }, createdAt: messageDetails.createdAt || report.createdAt, isHidden: messageDetails.isHidden || false, reportCount: messageDetails.reportCount || 1 }, createdAt: report.createdAt, reportId: report._id, reportReason: report.reason, reportDescription: report.description, reporter: report.reporter, reportStatus: report.status, isReportedContent: true, isUnavailable: false, reportedItemId: report.reportedItemId });
        } else {
          setViewingPost({ _id: `message-${report.reportedItemId}`, isMessageOnly: true, title: 'Reported Message', content: '', reportedMessage: { _id: report.reportedItemId, content: 'Message content unavailable', sender: { name: 'Unknown User' }, recipient: { name: 'Unknown User' }, createdAt: report.createdAt, isHidden: false, reportCount: 1 }, createdAt: report.createdAt, reportId: report._id, reportReason: report.reason, reportDescription: report.description, reporter: report.reporter, reportStatus: report.status, isReportedContent: true, isUnavailable: true, reportedItemId: report.reportedItemId });
        }
      }
      setOpenPostModal(true);
    } catch (error) {
      console.error('Error viewing content:', error);
      setSnackbar({ open: true, message: 'Failed to load content details', severity: 'error' });
    } finally { setContentLoading(false); }
  };

  const handleResolveReport = (report) => { setSelectedReport(report); setResolveStatus('resolved'); setOpenResolveDialog(true); };
  const handleCloseDialog = () => { setOpenDialog(false); setSelectedReport(null); };
  const handleClosePostModal = () => { setOpenPostModal(false); setViewingPost(null); };
  const handleCloseResolveDialog = () => { setOpenResolveDialog(false); setSelectedReport(null); setResolveStatus(''); };

  const handleUpdateReport = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.put(`/api/v1/admin/reports/${selectedReport._id}`, { status: resolveStatus }, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        fetchReports(); fetchStats();
        setSnackbar({ open: true, message: 'Report resolved successfully', severity: 'success' });
        handleCloseResolveDialog(); handleClosePostModal(); handleCloseDialog();
      }
    } catch (error) {
      console.error('Error updating report:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to resolve report.', severity: 'error' });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.delete(`/api/v1/admin/reports/${reportId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        setReports(prev => prev.filter(report => report._id !== reportId));
        setSnackbar({ open: true, message: 'Report deleted successfully', severity: 'success' });
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to delete report.', severity: 'error' });
    }
  };

  const handleHideContent = async (report) => {
    let confirmMessage = '';
    if (report.reportedItemType === 'post') confirmMessage = 'Are you sure you want to hide this post? This will hide it from all users.';
    else if (report.reportedItemType === 'comment') confirmMessage = 'Are you sure you want to hide this comment? This will hide it from all users.';
    else if (report.reportedItemType === 'message') confirmMessage = 'Are you sure you want to hide this message? This will hide it from all users in the conversation.';
    if (!window.confirm(confirmMessage)) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let endpoint; let data = {};
      if (report.reportedItemType === 'post') { endpoint = `/api/v1/admin/reports/posts/${report.reportedItemId}/hide`; data = { reason: 'admin_action' }; }
      else if (report.reportedItemType === 'comment') { endpoint = `/api/v1/admin/reports/comments/${report.reportedItemId}/hide`; data = { reason: 'admin_action' }; }
      else if (report.reportedItemType === 'message') { endpoint = `/api/v1/admin/reports/messages/${report.reportedItemId}/hide`; data = { reason: 'admin_action' }; }
      else throw new Error('Unsupported content type');
      const response = await axios.put(endpoint, data, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        try { await handleUpdateReportStatus(report._id, 'resolved'); } catch (e) { console.error('Error updating report status:', e); }
        let successMessage = report.reportedItemType === 'post' ? 'Post hidden and report resolved' : report.reportedItemType === 'comment' ? 'Comment hidden and report resolved' : 'Message hidden from conversation and report resolved';
        setSnackbar({ open: true, message: successMessage, severity: 'success' });
        fetchReports(); fetchStats();
        if (openPostModal) handleClosePostModal();
        if (openDialog) handleCloseDialog();
      } else {
        setSnackbar({ open: true, message: response.data.message || 'Failed to hide content', severity: 'error' });
      }
    } catch (error) {
      console.error('Error hiding content:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to hide content.', severity: 'error' });
    }
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.put(`/api/v1/admin/reports/${reportId}`, { status }, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) { fetchReports(); fetchStats(); }
    } catch (error) { console.error('Error updating report status:', error); }
  };

  const getReasonLabel = (reason) => {
    const labels = { spam: 'Spam', harassment: 'Harassment', hate_speech: 'Hate Speech', inappropriate_content: 'Inappropriate', false_information: 'False Info', inappropriate: 'Inappropriate', offensive: 'Offensive', other: 'Other' };
    return labels[reason] || reason;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString); const now = new Date(); const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.reporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedItem?.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedItem?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.reportedItemType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleExportPdf = () => {
    if (!filteredReports.length) {
      setSnackbar({ open: true, message: 'No reports available to export.', severity: 'error' });
      return;
    }

    try {
      setExportingPdf(true);
      const now = new Date();
      exportRowsToPdf({
        title: 'RubberSense - User Reports',
        subtitleLines: [
          `Generated: ${now.toLocaleString()}`,
          `Tab: ${currentTab === 1 ? 'Pending' : currentTab === 2 ? 'Resolved' : 'All Reports'} | Type: ${typeFilter} | Status: ${statusFilter} | Search: ${searchTerm || 'None'}`,
          `Total records: ${filteredReports.length}`,
        ],
        headers: ['Report ID', 'Type', 'Reason', 'Status', 'Reporter', 'Email', 'Date', 'Description'],
        rows: filteredReports.map((report) => [
          report._id,
          typeLabel(report.reportedItemType),
          getReasonLabel(report.reason),
          report.status || 'unknown',
          report.reporter?.name || 'Unknown',
          report.reporter?.email || 'N/A',
          formatDate(report.createdAt),
          report.description || report.reportedItem?.title || report.reportedItem?.content || 'N/A',
        ]),
        fileName: `user-reports-${now.toISOString().slice(0, 10)}.pdf`,
      });
      setSnackbar({ open: true, message: 'PDF export completed.', severity: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      setSnackbar({ open: true, message: 'Failed to export PDF.', severity: 'error' });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleTabChange = (newValue) => {
    setCurrentTab(newValue);
    if (newValue === 0) setStatusFilter('all');
    else if (newValue === 1) setStatusFilter('pending');
    else if (newValue === 2) setStatusFilter('resolved');
  };

  const typeIcon = (type) => type === 'post' ? <PostIcon size={13} /> : type === 'comment' ? <CommentIcon size={13} /> : <MessageIcon size={13} />;
  const typeLabel = (type) => type === 'post' ? 'Post' : type === 'comment' ? 'Comment' : 'Message';

  const getAvatarSrc = (user) => {
    const raw = user?.avatar?.url || user?.profilePicture || user?.photoURL || null;
    if (!raw || typeof raw !== 'string') return null;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    return raw.startsWith('/') ? `${API_BASE_URL}${raw}` : `${API_BASE_URL}/${raw}`;
  };

  const UserAvatar = ({ user, size = 44, className = 'ur-card-avatar', style = {}, iconSize }) => {
    const [imageError, setImageError] = useState(false);
    const src = getAvatarSrc(user);
    const name = user?.name || 'User';

    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          minWidth: size,
          fontSize: size * 0.42,
          borderRadius: size * 0.27,
          ...style,
        }}
      >
        {src && !imageError ? (
          <img src={src} alt={name} onError={() => setImageError(true)} />
        ) : (
          name?.charAt(0)?.toUpperCase() || <UserIcon size={iconSize || size * 0.45} />
        )}
      </div>
    );
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex' }}>
        <LeftNavigationBar />

        <div style={{ marginLeft: 250, padding: '28px 32px', width: 'calc(100% - 250px)', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>

          {/* Notification */}
          {snackbar.open && (
            <div className={`ur-notification ${snackbar.severity === 'success' ? 'success' : 'error'}`}>
              {snackbar.severity === 'success' ? <CheckIcon size={15} /> : <WarningIcon size={15} />}
              {snackbar.message}
            </div>
          )}
          {snackbar.open && setTimeout(() => setSnackbar(s => ({ ...s, open: false })), 6000) && null}

          {/* ── HERO ─────────────────────────────────────────────── */}
          <div className="ur-hero">
            {/* Left: text */}
            <div className="ur-hero-left">
              <div className="ur-hero-eyebrow">
                <span className="ur-hero-eyebrow-dot" />
                Admin Panel
              </div>
              <h1 className="ur-hero-title">
                User <span>Reports</span>
              </h1>
              <p className="ur-hero-sub">
                Review and moderate reported posts, comments, and messages to keep the community safe.
              </p>
            </div>

            {/* Right: content-type tiles */}
            <div className="ur-hero-tiles">
              <div className="ur-hero-tile">
                <div className="ur-hero-tile-icon post"><PostIcon size={22} /></div>
                <span className="ur-hero-tile-label">Posts</span>
                <span className="ur-hero-tile-sub">Reported content</span>
              </div>
              <div className="ur-hero-tile">
                <div className="ur-hero-tile-icon comment"><CommentIcon size={22} /></div>
                <span className="ur-hero-tile-label">Comments</span>
                <span className="ur-hero-tile-sub">Flagged replies</span>
              </div>
              <div className="ur-hero-tile">
                <div className="ur-hero-tile-icon msg"><MessageIcon size={22} /></div>
                <span className="ur-hero-tile-label">Messages</span>
                <span className="ur-hero-tile-sub">DM violations</span>
              </div>
            </div>
          </div>

          {/* ── STATS ────────────────────────────────────────────── */}
          <div className="ur-stats">
            <div className="ur-stat-card">
              <div className="ur-stat-icon-wrap total"><FlagIcon size={24} /></div>
              <div className="ur-stat-info">
                <div className="ur-stat-count">{stats.total}</div>
                <div className="ur-stat-label">Total Reports</div>
              </div>
            </div>
            <div className={`ur-stat-card ${stats.pending > 0 ? 'highlight' : ''}`}>
              <div className="ur-stat-icon-wrap pending"><WarningIcon size={24} /></div>
              <div className="ur-stat-info">
                <div className="ur-stat-count">{stats.pending}</div>
                <div className="ur-stat-label">Pending</div>
                {stats.pending > 0 && stats.total > 0 && (
                  <div className="ur-stat-bar">
                    <div className="ur-stat-bar-fill" style={{ width: `${Math.min((stats.pending / stats.total) * 100, 100)}%` }} />
                  </div>
                )}
              </div>
            </div>
            <div className="ur-stat-card">
              <div className="ur-stat-icon-wrap resolved"><CheckCircleIcon size={24} /></div>
              <div className="ur-stat-info">
                <div className="ur-stat-count">{stats.resolved}</div>
                <div className="ur-stat-label">Resolved</div>
              </div>
            </div>
          </div>

          {/* ── TABS + FILTER BAR ─────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div className="ur-tabs">
              {['All Reports', 'Pending', 'Resolved'].map((label, i) => (
                <button key={i} className={`ur-tab ${currentTab === i ? 'active' : ''}`} onClick={() => handleTabChange(i)}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="ur-btn ur-btn-refresh" onClick={fetchReports} disabled={loading}>
                <RefreshIcon size={15} /> Refresh
              </button>
              <button className="ur-btn ur-btn-view" onClick={handleExportPdf} disabled={loading || exportingPdf || filteredReports.length === 0}>
                <DownloadIcon size={15} /> {exportingPdf ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>

          <div className="ur-filter-bar">
            <div className="ur-search-wrap">
              <span className="ur-search-icon"><SearchIcon size={16} /></span>
              <input className="ur-search-input" type="text" placeholder="Search reports…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="ur-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="message">Messages</option>
            </select>
            <select className="ur-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
            <span className="ur-filter-count">{filteredReports.length} result{filteredReports.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── REPORT CARDS ─────────────────────────────────────── */}
          {loading ? (
            <div className="ur-empty"><div className="ur-spinner" /><p className="ur-empty-text" style={{ marginTop: 16 }}>Loading reports…</p></div>
          ) : filteredReports.length === 0 ? (
            <div className="ur-empty">
              <div className="ur-empty-icon"><FlagIcon size={52} /></div>
              <p className="ur-empty-text">No reports found matching your criteria.</p>
            </div>
          ) : (
            filteredReports.map(report => (
              <div key={report._id} className={`ur-card ${report.status}`}>
                <div className="ur-card-header">
                  <div className="ur-card-reporter">
                    <UserAvatar user={report.reporter} />
                    <div>
                      <p className="ur-card-reporter-name">{report.reporter?.name || 'Unknown User'}</p>
                      <p className="ur-card-reporter-email">{report.reporter?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="ur-card-meta">
                    <span className={`ur-badge ${report.status}`}>
                      <span className="ur-badge-dot" />
                      {report.status ? report.status.charAt(0).toUpperCase() + report.status.slice(1) : 'Unknown'}
                    </span>
                    <p className="ur-card-date"><ClockIcon /> {formatDate(report.createdAt)}</p>
                  </div>
                </div>
                {report.description && <div className="ur-card-body">{report.description}</div>}
                <div className="ur-card-footer">
                  <div className="ur-card-tags">
                    <span className={`ur-badge ${report.reportedItemType}`}>
                      {typeIcon(report.reportedItemType)} {typeLabel(report.reportedItemType)}
                    </span>
                    <span className="ur-badge reason">
                      <span className="ur-badge-dot" style={{ background: 'var(--grey-mid)' }} />
                      {getReasonLabel(report.reason)}
                    </span>
                    <span className="ur-card-id">#{report._id?.substring(0, 8)}</span>
                  </div>
                  <div className="ur-actions">
                    <button className="ur-btn ur-btn-view" onClick={() => handleViewReport(report)}>
                      <EyeIcon size={14} /> View
                    </button>
                    {report.status === 'pending' && (
                      <button className="ur-btn ur-btn-resolve" onClick={() => handleResolveReport(report)}>
                        <CheckCircleIcon size={14} /> Resolve
                      </button>
                    )}
                    <button className="ur-btn ur-btn-delete" onClick={() => handleDeleteReport(report._id)}>
                      ✕ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* ── VIEW REPORT DETAIL MODAL ──────────────────────────── */}
          {openDialog && selectedReport && (
            <div className="ur-modal-overlay">
              <div className="ur-modal">
                <div className="ur-modal-header">
                  <h2 className="ur-modal-title">Report Details</h2>
                  <button className="ur-modal-close" onClick={handleCloseDialog}><CloseIcon size={16} /></button>
                </div>
                <div className="ur-modal-divider" />
                <div className="ur-modal-body">
                  <div className="ur-info-grid">
                    <div>
                      <p className="ur-section-label">Report Information</p>
                      <div style={{ marginBottom: 14 }}>
                        <p className="ur-info-caption">Report ID</p>
                        <p className="ur-info-value mono">{selectedReport._id}</p>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <p className="ur-info-caption">Type</p>
                        <span className={`ur-badge ${selectedReport.reportedItemType}`}>
                          {typeIcon(selectedReport.reportedItemType)} {typeLabel(selectedReport.reportedItemType)}
                        </span>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <p className="ur-info-caption">Reason</p>
                        <span className="ur-badge reason">{getReasonLabel(selectedReport.reason)}</span>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <p className="ur-info-caption">Status</p>
                        <span className={`ur-badge ${selectedReport.status}`}>
                          <span className="ur-badge-dot" />
                          {selectedReport.status?.charAt(0).toUpperCase() + selectedReport.status?.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="ur-info-caption">Reported Date</p>
                        <p className="ur-info-value">{formatDate(selectedReport.createdAt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="ur-section-label">Reporter Information</p>
                      <div style={{ marginBottom: 14 }}>
                        <p className="ur-info-caption">Name</p>
                        <p className="ur-info-value">{selectedReport.reporter?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="ur-info-caption">Email</p>
                        <p className="ur-info-value">{selectedReport.reporter?.email || 'No email provided'}</p>
                      </div>
                    </div>
                  </div>
                  <p className="ur-section-label">Report Description</p>
                  <div className="ur-desc-box">{selectedReport.description || 'No description provided'}</div>
                </div>
                <div className="ur-modal-footer">
                  <button className="ur-btn ur-btn-cancel" onClick={handleCloseDialog}>Close</button>
                  <button className="ur-btn ur-btn-view" onClick={() => { handleCloseDialog(); handleViewPost(selectedReport); }}>
                    <EyeIcon size={14} /> View Content
                  </button>
                  {selectedReport.status === 'pending' && (
                    <button className="ur-btn ur-btn-resolve" onClick={() => handleResolveReport(selectedReport)}>
                      <CheckCircleIcon size={14} /> Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW CONTENT MODAL ────────────────────────────────── */}
          {openPostModal && (
            <div className="ur-modal-overlay">
              <div className="ur-modal wide">
                <div className="ur-modal-header">
                  <h2 className="ur-modal-title">
                    {viewingPost?.isCommentOnly ? 'Reported Comment' : viewingPost?.isMessageOnly ? 'Reported Message' : 'Reported Post'}
                  </h2>
                  <button className="ur-modal-close" onClick={handleClosePostModal}><CloseIcon size={16} /></button>
                </div>
                <div className="ur-modal-divider" />
                {contentLoading ? (
                  <div className="ur-empty" style={{ padding: '40px 20px' }}><div className="ur-spinner" /></div>
                ) : viewingPost ? (
                  <div className="ur-modal-body">
                    <div className="ur-alert warning">
                      <span className="ur-alert-icon"><WarningIcon size={16} /></span>
                      <div>
                        <strong>Reported for: {getReasonLabel(viewingPost.reportReason)}</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '.84rem' }}>{viewingPost.reportDescription || 'No additional details provided'}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '.78rem', opacity: .8 }}>Reported by: {viewingPost.reporter?.name || 'Unknown'} · {formatRelativeTime(viewingPost.createdAt)}</p>
                      </div>
                    </div>
                    {viewingPost.isMessageOnly && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--grey-dark)', margin: '0 0 3px' }}>Reported Message</p>
                            <p style={{ fontSize: '.78rem', color: 'var(--grey-mid)', margin: 0 }}>{formatDate(viewingPost.reportedMessage.createdAt)}</p>
                          </div>
                          <span className="ur-badge message"><span className="ur-badge-dot" /> Reported</span>
                        </div>
                        <div className="ur-content-box">{viewingPost.reportedMessage.content}</div>
                        <div className="ur-participants">
                          {[{ label: 'Sender', data: viewingPost.reportedMessage.sender }, { label: 'Recipient', data: viewingPost.reportedMessage.recipient }].map(({ label, data }) => (
                            <div key={label} className="ur-participant">
                              <UserAvatar user={data} size={38} className="ur-participant-avatar" iconSize={18} />
                              <div>
                                <p className="ur-participant-label">{label}</p>
                                <p className="ur-participant-name">{data?.name || 'Unknown User'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="ur-stat-chips">
                          <span className="ur-badge reason"><FlagIcon size={11} /> {viewingPost.reportedMessage.reportCount || 1} Report(s)</span>
                          {viewingPost.reportedMessage.isHidden && <span className="ur-badge" style={{ background: '#ffebee', color: 'var(--red)' }}><WarningIcon size={11} /> Hidden</span>}
                        </div>
                        {viewingPost.reportedMessage.isHidden && (
                          <div className="ur-alert info"><span className="ur-alert-icon"><InfoIcon size={15} /></span>This message has been hidden from users.</div>
                        )}
                      </>
                    )}
                    {viewingPost.isCommentOnly && (
                      <>
                        {viewingPost.postInfo && (
                          <div className="ur-alert info" style={{ marginBottom: 16 }}>
                            <span className="ur-alert-icon"><InfoIcon size={15} /></span>
                            <div><strong>From post:</strong> "{viewingPost.postInfo.title}"</div>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <UserAvatar
                            user={viewingPost.reportedComment.user}
                            size={46}
                            className="ur-participant-avatar"
                            style={{ borderRadius: 12 }}
                            iconSize={20}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--grey-dark)', margin: '0 0 2px' }}>{viewingPost.reportedComment.user?.name || 'Unknown User'}</p>
                            <p style={{ fontSize: '.78rem', color: 'var(--grey-mid)', margin: 0 }}>{formatDate(viewingPost.reportedComment.createdAt)}</p>
                          </div>
                          <span className="ur-badge comment"><span className="ur-badge-dot" /> Reported Comment</span>
                        </div>
                        <div className="ur-content-box">{viewingPost.reportedComment.content}</div>
                        {viewingPost.reportedComment.media?.length > 0 && renderMedia(viewingPost.reportedComment.media, 'comment')}
                        {viewingPost.reportedComment.isHidden && (
                          <div className="ur-alert warning"><span className="ur-alert-icon"><WarningIcon size={15} /></span>This comment has been hidden from users.</div>
                        )}
                      </>
                    )}
                    {!viewingPost.isMessageOnly && !viewingPost.isCommentOnly && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <UserAvatar
                            user={viewingPost.user}
                            size={46}
                            className="ur-participant-avatar"
                            style={{ borderRadius: 12 }}
                            iconSize={20}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--grey-dark)', margin: '0 0 2px' }}>{viewingPost.user?.name || 'Unknown User'}</p>
                            <p style={{ fontSize: '.78rem', color: 'var(--grey-mid)', margin: 0 }}>{formatDate(viewingPost.createdAt)}</p>
                          </div>
                          <span className="ur-badge post"><span className="ur-badge-dot" /> Reported Post</span>
                        </div>
                        {viewingPost.title && (
                          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-mid)', margin: '0 0 14px' }}>{viewingPost.title}</p>
                        )}
                        <div className="ur-content-box">{viewingPost.content}</div>
                        {viewingPost.media?.length > 0 && renderMedia(viewingPost.media, 'post')}
                        <div className="ur-stat-chips">
                          <span className="ur-badge" style={{ background: '#e8f5e9', color: 'var(--green-mid)' }}><ThumbUpIcon size={11} /> {viewingPost.likesCount || 0} Likes</span>
                          <span className="ur-badge comment"><CommentIcon size={11} /> {viewingPost.commentsCount || 0} Comments</span>
                          <span className="ur-badge reason"><FlagIcon size={11} /> {viewingPost.reportsCount || 1} Reports</span>
                        </div>
                      </>
                    )}
                    {viewingPost.isUnavailable && (
                      <div className="ur-alert warning"><span className="ur-alert-icon"><WarningIcon size={15} /></span>This content may have been deleted or is no longer accessible.</div>
                    )}
                    <div style={{ height: 1, background: 'var(--grey-light)', margin: '20px 0' }} />
                    <div className="ur-actions" style={{ flexWrap: 'wrap' }}>
                      {viewingPost.reportStatus === 'pending' && (
                        <button
                          className="ur-btn ur-btn-hide"
                          disabled={viewingPost.isUnavailable}
                          onClick={() => {
                            let report = selectedReport;
                            if (!report && viewingPost.reportId) report = reports.find(r => r._id === viewingPost.reportId);
                            if (!report && viewingPost.reportedItemId) report = { _id: viewingPost.reportId, reportedItemType: viewingPost.isMessageOnly ? 'message' : viewingPost.isCommentOnly ? 'comment' : 'post', reportedItemId: viewingPost.reportedItemId || (viewingPost.isMessageOnly ? viewingPost.reportedMessage?._id : viewingPost.isCommentOnly ? viewingPost.reportedComment?._id : viewingPost._id) };
                            if (report) handleHideContent(report);
                            else setSnackbar({ open: true, message: 'Could not find report data. Please refresh and try again.', severity: 'error' });
                          }}
                        >
                          <EyeOffIcon size={14} /> Hide {viewingPost.isMessageOnly ? 'Message' : viewingPost.isCommentOnly ? 'Comment' : 'Post'}
                        </button>
                      )}
                      {viewingPost.reportStatus === 'pending' && (
                        <button
                          className="ur-btn ur-btn-resolve"
                          onClick={() => {
                            const report = selectedReport || reports.find(r => r._id === viewingPost.reportId);
                            if (report) handleResolveReport(report);
                          }}
                        >
                          <CheckCircleIcon size={14} /> Mark as Resolved
                        </button>
                      )}
                      {viewingPost.reportStatus === 'resolved' && (
                        <div className="ur-alert success" style={{ width: '100%', margin: 0 }}>
                          <span className="ur-alert-icon"><CheckIcon size={15} /></span>
                          This report has been marked as resolved.
                        </div>
                      )}
                      {viewingPost.isMessageOnly && viewingPost.reportedMessage?.isHidden && (
                        <div className="ur-alert info" style={{ width: '100%', margin: 0 }}>
                          <span className="ur-alert-icon"><InfoIcon size={15} /></span>
                          This message has already been hidden from the conversation.
                        </div>
                      )}
                      {viewingPost.isCommentOnly && viewingPost.reportedComment?.isHidden && (
                        <div className="ur-alert info" style={{ width: '100%', margin: 0 }}>
                          <span className="ur-alert-icon"><InfoIcon size={15} /></span>
                          This comment has already been hidden from users.
                        </div>
                      )}
                      {!viewingPost.isMessageOnly && !viewingPost.isCommentOnly && viewingPost.isHidden && (
                        <div className="ur-alert info" style={{ width: '100%', margin: 0 }}>
                          <span className="ur-alert-icon"><InfoIcon size={15} /></span>
                          This post has already been hidden from users.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="ur-modal-body">
                    <div className="ur-alert error"><span className="ur-alert-icon"><WarningIcon size={15} /></span>Unable to load content details.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RESOLVE CONFIRM MODAL ─────────────────────────────── */}
          {openResolveDialog && selectedReport && (
            <div className="ur-modal-overlay">
              <div className="ur-modal" style={{ maxWidth: 480 }}>
                <div className="ur-modal-header">
                  <h2 className="ur-modal-title">Resolve Report</h2>
                  <button className="ur-modal-close" onClick={handleCloseResolveDialog}><CloseIcon size={16} /></button>
                </div>
                <div className="ur-modal-divider" />
                <div className="ur-modal-body">
                  <div className="ur-alert info" style={{ marginBottom: 20 }}>
                    <span className="ur-alert-icon"><InfoIcon size={15} /></span>
                    Are you sure you want to mark this report as resolved?
                  </div>
                  <div style={{ background: 'var(--grey-light)', borderRadius: 10, padding: '14px 16px' }}>
                    <p className="ur-section-label" style={{ margin: '0 0 10px' }}>Report Details</p>
                    <p style={{ margin: '0 0 6px', fontSize: '.85rem', color: 'var(--grey-dark)' }}>
                      <strong>Type:</strong> {typeLabel(selectedReport.reportedItemType)}
                    </p>
                    <p style={{ margin: '0 0 6px', fontSize: '.85rem', color: 'var(--grey-dark)' }}>
                      <strong>Reason:</strong> {getReasonLabel(selectedReport.reason)}
                    </p>
                    <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--grey-dark)' }}>
                      <strong>Reporter:</strong> {selectedReport.reporter?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="ur-modal-footer">
                  <button className="ur-btn ur-btn-cancel" onClick={handleCloseResolveDialog}>Cancel</button>
                  <button className="ur-btn ur-btn-submit" onClick={handleUpdateReport}>
                    <CheckCircleIcon size={14} /> Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default UserReport;
