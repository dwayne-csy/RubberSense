import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const UserIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const UsersIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const MailIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const CheckIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const EyeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const PowerIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
);
const SearchIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const RefreshIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const CloseIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ClockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CalendarIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ShieldIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const ChevronLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Global Styles ─────────────────────────────────────────────────────────────
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

  /* ── HERO (pure CSS — no external image) ───────────────── */
  .ul-hero {
    position: relative; height: 220px; border-radius: var(--radius);
    overflow: hidden; margin-bottom: 32px;
    display: flex; align-items: flex-end; padding: 28px 32px;
    /* Rich layered green gradient background */
    background:
      radial-gradient(ellipse at 20% 50%, rgba(0,191,165,.35) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(67,160,71,.4) 0%, transparent 55%),
      radial-gradient(ellipse at 60% 80%, rgba(0,150,136,.25) 0%, transparent 50%),
      linear-gradient(135deg, #1b5e20 0%, #2e7d32 40%, #1a6b5a 100%);
  }

  /* Decorative geometric shapes rendered as pseudo-elements & SVG */
  .ul-hero-shapes {
    position: absolute; inset: 0; overflow: hidden; pointer-events: none;
  }
  .ul-hero-circle-1 {
    position: absolute; width: 280px; height: 280px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,.08);
    top: -80px; right: 120px;
  }
  .ul-hero-circle-2 {
    position: absolute; width: 180px; height: 180px; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,.06);
    top: 30px; right: 60px;
  }
  .ul-hero-circle-3 {
    position: absolute; width: 120px; height: 120px; border-radius: 50%;
    background: rgba(0,191,165,.12);
    bottom: -30px; left: 40%;
  }
  .ul-hero-dots {
    position: absolute; top: 18px; left: 50%;
    display: grid; grid-template-columns: repeat(8, 1fr); gap: 14px; opacity: .12;
  }
  .ul-hero-dot {
    width: 4px; height: 4px; border-radius: 50%; background: #fff;
  }

  .ul-hero-content { position: relative; z-index: 1; }
  .ul-hero-title {
    font-family: 'Playfair Display', serif; font-size: 2.2rem;
    color: #fff; margin: 0 0 4px; line-height: 1.1; letter-spacing: -.5px;
    text-shadow: 0 2px 12px rgba(0,0,0,.25);
  }
  .ul-hero-sub {
    font-family: 'DM Sans', sans-serif; font-size: .92rem;
    color: rgba(255,255,255,.78); margin: 0; font-weight: 300;
  }
  .ul-hero-icon {
    position: absolute; top: 20px; right: 24px; z-index: 1;
    opacity: .13; color: #fff;
  }

  /* ── STATS ROW ──────────────────────────────────────────── */
  .ul-stats {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 14px; margin-bottom: 28px;
  }
  .ul-stat-card {
    background: var(--white); border-radius: 12px;
    padding: 18px 16px; display: flex; align-items: center; gap: 14px;
    box-shadow: var(--shadow-sm); border: 1.5px solid transparent;
    font-family: 'DM Sans', sans-serif;
    transition: transform .18s, box-shadow .18s;
  }
  .ul-stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .ul-stat-icon-wrap {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ul-stat-icon-wrap.total    { background: #e8f5e9; color: var(--green-mid); }
  .ul-stat-icon-wrap.online   { background: #e0f7fa; color: var(--teal); }
  .ul-stat-icon-wrap.active   { background: #e8f5e9; color: var(--green-light); }
  .ul-stat-icon-wrap.verified { background: #fff8e1; color: var(--amber); }
  .ul-stat-icon-wrap.inactive { background: #eceff1; color: var(--grey-mid); }
  .ul-stat-info { flex: 1; }
  .ul-stat-count { font-size: 1.6rem; font-weight: 700; color: var(--grey-dark); line-height: 1; }
  .ul-stat-label { font-size: .7rem; color: var(--grey-mid); margin-top: 4px; text-transform: uppercase; letter-spacing: .6px; font-weight: 500; }

  /* ── FILTER BAR ─────────────────────────────────────────── */
  .ul-filter-bar {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: var(--white); padding: 14px 20px;
    border-radius: 10px; box-shadow: var(--shadow-sm);
    margin-bottom: 24px; font-family: 'DM Sans', sans-serif;
  }
  .ul-filter-select {
    padding: 8px 14px; border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    cursor: pointer; outline: none; transition: border-color .2s;
  }
  .ul-filter-select:focus { border-color: var(--green-mid); background: #fff; }
  .ul-search-wrap { flex: 1; min-width: 220px; position: relative; display: flex; align-items: center; }
  .ul-search-icon { position: absolute; left: 12px; color: var(--grey-mid); pointer-events: none; display: flex; }
  .ul-search-input {
    width: 100%; padding: 8px 14px 8px 36px;
    border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    outline: none; transition: border-color .2s; box-sizing: border-box;
  }
  .ul-search-input:focus { border-color: var(--green-mid); background: #fff; }
  .ul-filter-count { margin-left: auto; font-size: .82rem; color: var(--grey-mid); font-weight: 500; white-space: nowrap; }

  /* ── USER CARD ──────────────────────────────────────────── */
  .ul-card {
    background: var(--white); border-radius: var(--radius);
    padding: 20px 26px; margin-bottom: 14px;
    box-shadow: var(--shadow-sm); border: 1.5px solid #e0e7ef;
    transition: box-shadow .22s, border-color .22s, transform .22s;
    font-family: 'DM Sans', sans-serif; position: relative; overflow: hidden;
  }
  .ul-card::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 4px; height: 100%; background: var(--green-mid);
    border-radius: 4px 0 0 4px; opacity: 0; transition: opacity .2s;
  }
  .ul-card:hover { box-shadow: var(--shadow-md); border-color: #b2dfdb; transform: translateY(-2px); }
  .ul-card:hover::before { opacity: 1; }
  .ul-card.online::before { opacity: 1; background: var(--teal); }
  .ul-card.inactive { opacity: .75; }

  .ul-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
  .ul-card-left { display: flex; align-items: center; gap: 14px; }
  .ul-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg, var(--green-mid), var(--accent));
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-family: 'Playfair Display', serif;
    font-size: 1.2rem; font-weight: 700; flex-shrink: 0; position: relative;
    overflow: hidden;
  }
  .ul-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .ul-avatar-dot {
    position: absolute; bottom: 1px; right: 1px;
    width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid #fff;
  }
  .ul-avatar-dot.online  { background: #00c853; }
  .ul-avatar-dot.offline { background: #90a4ae; }
  .ul-card-name {
    font-family: 'Playfair Display', serif; font-size: 1.05rem;
    font-weight: 700; color: var(--grey-dark); margin: 0 0 3px;
  }
  .ul-card-email { font-size: .82rem; color: var(--grey-mid); display: flex; align-items: center; gap: 5px; }
  .ul-card-right { text-align: right; flex-shrink: 0; }
  .ul-card-meta-row { font-size: .74rem; color: #90a4ae; display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-top: 4px; }
  .ul-card-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .ul-card-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  /* ── BADGE ──────────────────────────────────────────────── */
  .ul-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; border-radius: 50px;
    font-size: .7rem; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  }
  .ul-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .ul-badge.online-badge     { background: #e0f7fa; color: var(--teal); }
  .ul-badge.online-badge     .ul-badge-dot { background: var(--teal); }
  .ul-badge.offline-badge    { background: #eceff1; color: var(--grey-mid); }
  .ul-badge.offline-badge    .ul-badge-dot { background: var(--grey-mid); }
  .ul-badge.verified-badge   { background: #e8f5e9; color: var(--green-mid); }
  .ul-badge.verified-badge   .ul-badge-dot { background: var(--green-light); }
  .ul-badge.unverified-badge { background: #fff8e1; color: #f57f17; }
  .ul-badge.unverified-badge .ul-badge-dot { background: var(--amber); }
  .ul-badge.active-badge     { background: var(--green-pale); color: var(--green-mid); }
  .ul-badge.active-badge     .ul-badge-dot { background: var(--green-light); }
  .ul-badge.inactive-badge   { background: #eceff1; color: var(--grey-mid); }
  .ul-badge.inactive-badge   .ul-badge-dot { background: #90a4ae; }
  .ul-badge.role-badge       { background: #f3e5f5; color: #7b1fa2; }
  .ul-badge.role-badge       .ul-badge-dot { background: #ab47bc; }

  /* ── ACTION BUTTONS ─────────────────────────────────────── */
  .ul-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .ul-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .82rem; font-weight: 600;
    cursor: pointer; transition: all .18s; letter-spacing: .2px;
  }
  .ul-btn:active { transform: scale(.97); }
  .ul-btn:disabled { opacity: .55; cursor: not-allowed; }
  .ul-btn-view       { background: #e3f2fd; color: #1565c0; }
  .ul-btn-view:hover { background: #1565c0; color: #fff; }
  .ul-btn-activate   { background: var(--green-pale); color: var(--green-mid); }
  .ul-btn-activate:hover { background: var(--green-mid); color: #fff; }
  .ul-btn-deactivate { background: #fce4ec; color: #c62828; }
  .ul-btn-deactivate:hover { background: #c62828; color: #fff; }
  .ul-btn-verify     { background: #fff8e1; color: #f57f17; }
  .ul-btn-verify:hover { background: #f57f17; color: #fff; }
  .ul-btn-refresh    { background: var(--grey-light); color: var(--grey-mid); }
  .ul-btn-refresh:hover { background: var(--grey-mid); color: #fff; }
  .ul-btn-reset      { background: var(--grey-light); color: var(--grey-mid); }
  .ul-btn-reset:hover { background: var(--grey-mid); color: #fff; }

  /* ── PAGINATION ─────────────────────────────────────────── */
  .ul-pagination {
    display: flex; justify-content: center; align-items: center; gap: 8px;
    padding: 24px 20px; font-family: 'DM Sans', sans-serif;
  }
  .ul-page-btn {
    min-width: 40px; height: 40px; padding: 0 10px; border-radius: 8px;
    border: 1.5px solid #cfd8dc; background: var(--white);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: .88rem;
    font-weight: 600; color: var(--grey-dark); transition: all .18s;
  }
  .ul-page-btn:hover:not(:disabled):not(.active) { border-color: var(--green-mid); color: var(--green-mid); transform: translateY(-1px); }
  .ul-page-btn.active { background: var(--green-mid); color: #fff; border-color: var(--green-mid); }
  .ul-page-btn:disabled { opacity: .35; cursor: not-allowed; }
  .ul-page-info { font-size: .82rem; color: var(--grey-mid); padding: 0 8px; }

  /* ── MODAL ──────────────────────────────────────────────── */
  .ul-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.65);
    backdrop-filter: blur(4px); display: flex; justify-content: center;
    align-items: center; z-index: 1000; padding: 20px;
  }
  .ul-modal {
    background: var(--white); border-radius: 18px;
    width: 100%; max-width: 620px; max-height: 92vh;
    overflow-y: auto; box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
  }
  .ul-modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 28px 0; position: sticky; top: 0; background: #fff;
    border-radius: 18px 18px 0 0; z-index: 1;
  }
  .ul-modal-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: var(--grey-dark); margin: 0; }
  .ul-modal-close {
    width: 36px; height: 36px; border-radius: 50%;
    border: none; background: var(--grey-light); color: var(--grey-mid);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .18s; flex-shrink: 0;
  }
  .ul-modal-close:hover { background: #cfd8dc; }
  .ul-modal-divider { height: 2px; background: linear-gradient(90deg, var(--green-mid), var(--accent)); margin: 12px 28px 0; border-radius: 2px; }
  .ul-modal-body { padding: 24px 28px; }
  .ul-modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 28px 28px; }

  /* ── MODAL DETAIL ROWS ──────────────────────────────────── */
  .ul-detail-section {
    background: var(--grey-light); border-radius: 12px;
    padding: 18px 20px; margin-bottom: 16px;
  }
  .ul-detail-section-title {
    font-size: .75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .8px; color: var(--grey-mid); margin-bottom: 14px;
    display: flex; align-items: center; gap: 6px;
  }
  .ul-detail-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .ul-detail-row:last-child { margin-bottom: 0; }
  .ul-detail-label { font-size: .84rem; color: var(--grey-mid); font-weight: 500; }
  .ul-detail-value { font-size: .88rem; color: var(--grey-dark); font-weight: 600; text-align: right; }

  /* ── ONLINE STATUS BLOCK ────────────────────────────────── */
  .ul-online-block {
    border-radius: 10px; padding: 14px 18px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 14px;
  }
  .ul-online-block.is-online  { background: #e8f5e9; border: 1.5px solid #a5d6a7; }
  .ul-online-block.is-offline { background: #eceff1; border: 1.5px solid #cfd8dc; }
  .ul-pulse-dot {
    width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
    background: #00c853; animation: ulPulse 1.5s infinite;
  }
  .ul-offline-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; background: #90a4ae; }
  .ul-online-label  { font-size: .95rem; font-weight: 700; color: var(--green-mid); }
  .ul-offline-label { font-size: .95rem; font-weight: 700; color: var(--grey-mid); }
  .ul-online-sub    { font-size: .78rem; color: var(--grey-mid); margin-top: 2px; }

  /* ── MODAL AVATAR ───────────────────────────────────────── */
  .ul-modal-avatar-row {
    display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
    padding-bottom: 20px; border-bottom: 1.5px solid var(--grey-light);
  }
  .ul-modal-avatar {
    width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--green-mid), var(--accent));
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700;
    position: relative;
    overflow: hidden;
  }
  .ul-modal-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .ul-modal-avatar-dot {
    position: absolute; bottom: 2px; right: 2px;
    width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #fff;
  }
  .ul-modal-user-name  { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: var(--grey-dark); margin: 0 0 4px; }
  .ul-modal-user-email { font-size: .85rem; color: var(--grey-mid); display: flex; align-items: center; gap: 6px; }

  /* ── LOADING / EMPTY ────────────────────────────────────── */
  .ul-empty { text-align: center; padding: 60px 20px; font-family: 'DM Sans', sans-serif; color: var(--grey-mid); }
  .ul-empty-icon { margin-bottom: 16px; display: flex; justify-content: center; opacity: .3; }
  .ul-empty-text { font-size: 1rem; }
  .ul-loading { display: flex; justify-content: center; padding: 60px 20px; }
  .ul-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid var(--grey-light); border-top-color: var(--green-mid);
    animation: ulSpin .8s linear infinite;
  }

  /* ── NOTIFICATION ───────────────────────────────────────── */
  .ul-notification {
    position: fixed; top: 22px; right: 22px; padding: 13px 22px;
    border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: .9rem; font-weight: 600; box-shadow: var(--shadow-md);
    z-index: 2000; display: flex; align-items: center; gap: 8px;
    animation: ulSlideIn .3s ease;
  }
  .ul-notification.success { background: var(--green-mid); color: #fff; }
  .ul-notification.error   { background: var(--red); color: #fff; }

  /* ── ANIMATIONS ─────────────────────────────────────────── */
  @keyframes ulPulse   { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)} }
  @keyframes ulSpin    { to{transform:rotate(360deg)} }
  @keyframes ulSlideIn { from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)} }
`;

const PAGE_SIZE = 8;

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOnlineStatus, setUserOnlineStatus] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const activityIntervalRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const showNotification = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4500);
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const isUserOnline = (lastLogin) => {
    if (!lastLogin) return false;
    return (Date.now() - new Date(lastLogin).getTime()) < 5 * 60 * 1000;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const updateOnlineStatus = () => {
    const statuses = {};
    users.forEach(user => { statuses[user._id] = isUserOnline(user.lastLogin); });
    setUserOnlineStatus(statuses);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        const nonAdminUsers = response.data.users.filter(user => user.role !== 'admin');
        const usersWithKey = nonAdminUsers.map(user => ({ ...user, key: user._id }));
        setUsers(usersWithKey);
        setFilteredUsers(usersWithKey);
        updateOnlineStatus();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        showNotification('Session expired. Please login again.', 'error');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        showNotification('Admin access required.', 'error');
      } else {
        showNotification('Failed to fetch users', 'error');
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`;
    document.head.appendChild(style);
    fetchUsers();
    activityIntervalRef.current = setInterval(updateOnlineStatus, 30000);
    return () => {
      clearInterval(activityIntervalRef.current);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    let result = [...users];
    if (verificationFilter === 'verified') result = result.filter(u => u.isVerified);
    else if (verificationFilter === 'unverified') result = result.filter(u => !u.isVerified);
    if (statusFilter === 'active') result = result.filter(u => u.isActive);
    else if (statusFilter === 'inactive') result = result.filter(u => !u.isActive);
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, verificationFilter, statusFilter, searchText]);

  useEffect(() => { if (users.length > 0) updateOnlineStatus(); }, [users]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/${userId}/toggle-status`, {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        showNotification(response.data.message);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(prev => ({ ...prev, isActive: !currentStatus }));
        }
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showNotification('Failed to update user status', 'error');
    }
  };

  const showUserDetails = (user) => { setSelectedUser(user); setModalVisible(true); };

  const verifyUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/${userId}/verify`, {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        showNotification('User verified successfully');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      if (error.response?.status === 404) showNotification('Verification endpoint not found.', 'error');
      else showNotification('Failed to verify user', 'error');
    }
  };

  const resetFilters = () => { setVerificationFilter('all'); setStatusFilter('all'); setSearchText(''); };

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onlineCount  = Object.values(userOnlineStatus).filter(Boolean).length;
  const activeCount  = users.filter(u => u.isActive).length;
  const verifiedCount = users.filter(u => u.isVerified).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  const statItems = [
    { key: 'total',    colorClass: 'total',    Icon: UsersIcon,  label: 'Total Users', count: users.length },
    { key: 'online',   colorClass: 'online',   Icon: UserIcon,   label: 'Online Now',  count: onlineCount },
    { key: 'active',   colorClass: 'active',   Icon: CheckIcon,  label: 'Active',      count: activeCount },
    { key: 'verified', colorClass: 'verified', Icon: ShieldIcon, label: 'Verified',    count: verifiedCount },
    { key: 'inactive', colorClass: 'inactive', Icon: XIcon,      label: 'Inactive',    count: inactiveCount },
  ];

  // Helper function to render avatar with fallback
  const renderAvatar = (user, size = 'default') => {
    if (user.avatar && user.avatar.url) {
      return (
        <img 
          src={user.avatar.url} 
          alt={user.name || 'User avatar'}
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            parent.style.background = 'linear-gradient(135deg, var(--green-mid), var(--accent))';
            const initial = document.createElement('span');
            initial.textContent = getInitial(user.name);
            initial.style.cssText = 'font-family: "Playfair Display", serif; font-size: 1.2rem; font-weight: 700;';
            parent.appendChild(initial);
          }}
        />
      );
    }
    return getInitial(user.name);
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex' }}>
        <LeftNavigationBar />

        <div style={{ marginLeft: 250, padding: '28px 32px', width: 'calc(100% - 250px)', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>

          {/* Notification */}
          {notification.show && (
            <div className={`ul-notification ${notification.type}`}>
              {notification.type === 'success' ? <CheckIcon size={14} /> : <XIcon size={13} />}
              {notification.message}
            </div>
          )}

          {/* ── Hero Banner (pure CSS, no external image) ── */}
          <div className="ul-hero">
            {/* Decorative shapes */}
            <div className="ul-hero-shapes">
              <div className="ul-hero-circle-1" />
              <div className="ul-hero-circle-2" />
              <div className="ul-hero-circle-3" />
              <div className="ul-hero-dots">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className="ul-hero-dot" />
                ))}
              </div>
            </div>
            <div className="ul-hero-content">
              <h1 className="ul-hero-title">User Management</h1>
              <p className="ul-hero-sub">Monitor, verify, and manage all platform users</p>
            </div>
            <div className="ul-hero-icon">
              <UsersIcon size={110} />
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button
              className="ul-btn ul-btn-refresh"
              style={{
                padding: '11px 22px', borderRadius: 10, fontSize: '.92rem', fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,.1)', transition: 'transform .18s, box-shadow .18s',
                opacity: loading ? .6 : 1
              }}
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshIcon size={15} /> {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Stats */}
          <div className="ul-stats">
            {statItems.map(({ key, colorClass, Icon, label, count }) => (
              <div key={key} className="ul-stat-card">
                <div className={`ul-stat-icon-wrap ${colorClass}`}><Icon size={22} /></div>
                <div className="ul-stat-info">
                  <div className="ul-stat-count">{count}</div>
                  <div className="ul-stat-label">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="ul-filter-bar">
            <select className="ul-filter-select" value={verificationFilter} onChange={e => setVerificationFilter(e.target.value)}>
              <option value="all">All Verification</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
            <select className="ul-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <div className="ul-search-wrap">
              <span className="ul-search-icon"><SearchIcon size={16} /></span>
              <input
                type="text"
                className="ul-search-input"
                placeholder="Search by name or email…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
            <button className="ul-btn ul-btn-reset" onClick={resetFilters} style={{ whiteSpace: 'nowrap' }}>
              Reset Filters
            </button>
            <span className="ul-filter-count">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* User Cards */}
          {loading ? (
            <div className="ul-loading"><div className="ul-spinner" /></div>
          ) : pagedUsers.length === 0 ? (
            <div className="ul-empty">
              <div className="ul-empty-icon"><UsersIcon size={52} /></div>
              <p className="ul-empty-text">No users found matching your filters.</p>
            </div>
          ) : (
            pagedUsers.map(user => {
              const online = userOnlineStatus[user._id];
              return (
                <div key={user._id} className={`ul-card ${online ? 'online' : ''} ${!user.isActive ? 'inactive' : ''}`}>
                  <div className="ul-card-header">
                    <div className="ul-card-left">
                      <div className="ul-avatar">
                        {renderAvatar(user)}
                        <span className={`ul-avatar-dot ${online ? 'online' : 'offline'}`} />
                      </div>
                      <div>
                        <p className="ul-card-name">{user.name || 'No Name'}</p>
                        <p className="ul-card-email"><MailIcon size={12} />{user.email}</p>
                      </div>
                    </div>
                    <div className="ul-card-right">
                      <span className={`ul-badge ${online ? 'online-badge' : 'offline-badge'}`}>
                        <span className="ul-badge-dot" />
                        {online ? 'Online' : 'Offline'}
                      </span>
                      <p className="ul-card-meta-row">
                        <CalendarIcon />
                        {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="ul-card-footer">
                    <div className="ul-card-tags">
                      <span className={`ul-badge ${user.isActive ? 'active-badge' : 'inactive-badge'}`}>
                        <span className="ul-badge-dot" />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`ul-badge ${user.isVerified ? 'verified-badge' : 'unverified-badge'}`}>
                        <span className="ul-badge-dot" />
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className="ul-badge role-badge">
                        <span className="ul-badge-dot" />
                        {user.authProvider || 'local'}
                      </span>
                      <span style={{ fontSize: '.78rem', color: 'var(--grey-mid)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon />{online ? 'Online now' : getTimeAgo(user.lastLogin)}
                      </span>
                    </div>
                    <div className="ul-actions">
                      <button className="ul-btn ul-btn-view" onClick={() => showUserDetails(user)}>
                        <EyeIcon size={13} /> View
                      </button>
                      <button
                        className={`ul-btn ${user.isActive ? 'ul-btn-deactivate' : 'ul-btn-activate'}`}
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                      >
                        <PowerIcon size={13} />{user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {!user.isVerified && (
                        <button className="ul-btn ul-btn-verify" onClick={() => verifyUser(user._id)}>
                          <CheckIcon size={13} /> Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ul-pagination">
              <button className="ul-page-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                <ChevronLeftIcon size={15} />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                  return (
                    <button key={p} className={`ul-page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>
                      {p}
                    </button>
                  );
                }
                if (p === currentPage - 3 || p === currentPage + 3) {
                  return <span key={p} className="ul-page-info">…</span>;
                }
                return null;
              })}
              <button className="ul-page-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                <ChevronRightIcon size={15} />
              </button>
            </div>
          )}

          {/* ── User Details Modal ── */}
          {modalVisible && selectedUser && (
            <div className="ul-modal-overlay">
              <div className="ul-modal">
                <div className="ul-modal-header">
                  <h2 className="ul-modal-title">User Details</h2>
                  <button className="ul-modal-close" onClick={() => setModalVisible(false)}><CloseIcon size={15} /></button>
                </div>
                <div className="ul-modal-divider" />
                <div className="ul-modal-body">
                  <div className="ul-modal-avatar-row">
                    <div className="ul-modal-avatar">
                      {selectedUser.avatar && selectedUser.avatar.url ? (
                        <img 
                          src={selectedUser.avatar.url} 
                          alt={selectedUser.name || 'User avatar'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            parent.style.background = 'linear-gradient(135deg, var(--green-mid), var(--accent))';
                            const initial = document.createElement('span');
                            initial.textContent = getInitial(selectedUser.name);
                            initial.style.cssText = 'font-family: "Playfair Display", serif; font-size: 1.6rem; font-weight: 700;';
                            parent.appendChild(initial);
                          }}
                        />
                      ) : (
                        getInitial(selectedUser.name)
                      )}
                      <span 
                        className="ul-modal-avatar-dot"
                        style={{ background: userOnlineStatus[selectedUser._id] ? '#00c853' : '#90a4ae' }}
                      />
                    </div>
                    <div>
                      <p className="ul-modal-user-name">{selectedUser.name || 'No Name'}</p>
                      <p className="ul-modal-user-email"><MailIcon size={13} />{selectedUser.email}</p>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span className={`ul-badge ${userOnlineStatus[selectedUser._id] ? 'online-badge' : 'offline-badge'}`}>
                        <span className="ul-badge-dot" />
                        {userOnlineStatus[selectedUser._id] ? 'Online Now' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className={`ul-online-block ${userOnlineStatus[selectedUser._id] ? 'is-online' : 'is-offline'}`}>
                    {userOnlineStatus[selectedUser._id] ? (
                      <>
                        <div className="ul-pulse-dot" />
                        <div>
                          <div className="ul-online-label">Currently Online</div>
                          <div className="ul-online-sub">User is active on the platform right now</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="ul-offline-dot" />
                        <div>
                          <div className="ul-offline-label">Currently Offline</div>
                          <div className="ul-online-sub">
                            {selectedUser.lastLogin
                              ? `Last seen ${getTimeAgo(selectedUser.lastLogin)} · ${formatDate(selectedUser.lastLogin)}`
                              : 'Never logged in'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="ul-detail-section">
                    <div className="ul-detail-section-title"><UserIcon size={12} /> Account Information</div>
                    <div className="ul-detail-row">
                      <span className="ul-detail-label">Account Status</span>
                      <span className={`ul-badge ${selectedUser.isActive ? 'active-badge' : 'inactive-badge'}`}>
                        <span className="ul-badge-dot" />{selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="ul-detail-row">
                      <span className="ul-detail-label">Verification</span>
                      <span className={`ul-badge ${selectedUser.isVerified ? 'verified-badge' : 'unverified-badge'}`}>
                        <span className="ul-badge-dot" />{selectedUser.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div className="ul-detail-row">
                      <span className="ul-detail-label">Auth Provider</span>
                      <span className="ul-badge role-badge">
                        <span className="ul-badge-dot" />{selectedUser.authProvider || 'local'}
                      </span>
                    </div>
                    {selectedUser.firebaseUID && (
                      <div className="ul-detail-row">
                        <span className="ul-detail-label">Firebase ID</span>
                        <span className="ul-detail-value" style={{ fontSize: '.78rem', fontFamily: 'monospace' }}>
                          {selectedUser.firebaseUID.substring(0, 12)}…
                        </span>
                      </div>
                    )}
                    <div className="ul-detail-row">
                      <span className="ul-detail-label">Member Since</span>
                      <span className="ul-detail-value">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="ul-modal-footer">
                  <button className="ul-btn ul-btn-refresh" onClick={() => { fetchUsers(); setModalVisible(false); }}>
                    <RefreshIcon size={13} /> Refresh
                  </button>
                  {!selectedUser.isVerified && (
                    <button className="ul-btn ul-btn-verify" onClick={() => { verifyUser(selectedUser._id); setModalVisible(false); }}>
                      <CheckIcon size={13} /> Verify User
                    </button>
                  )}
                  <button
                    className={`ul-btn ${selectedUser.isActive ? 'ul-btn-deactivate' : 'ul-btn-activate'}`}
                    onClick={() => { toggleUserStatus(selectedUser._id, selectedUser.isActive); setModalVisible(false); }}
                  >
                    <PowerIcon size={13} />{selectedUser.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="ul-btn ul-btn-reset" onClick={() => setModalVisible(false)}>Close</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default UserList;