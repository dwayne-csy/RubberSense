import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';
import {
  Search, Plus, Edit2, Trash2, AlertTriangle, Heart, MessageCircle,
  X, Send, Image, ChevronDown, ChevronUp, Loader2, Leaf, Upload,
  Flag, CornerDownRight, Clock, Check, Bell, ChevronLeft, ChevronRight
} from 'lucide-react';

import slide1 from '../otherpictures/communityblogspot.jpg';
import slide2 from '../otherpictures/communityblogspot1.jpg';
import slide3 from '../otherpictures/communityblogspot2.jpg';

// Import bad words filter
import badWordsFilter from '../../utils/badWordsFilter';

/* ─── Design tokens ─────────────────────────────────────────── */
const T = {
  bark:    '#2C1A0E',
  canopy:  '#1E4D2B',
  moss:    '#3A6B35',
  sap:     '#6BAE47',
  latex:   '#D4E9C2',
  cream:   '#F5F0E8',
  parchment: '#EDE5D4',
  mist:    '#F9F6F0',
  fog:     '#EDE8DF',
  shadow:  'rgba(44,26,14,0.12)',
  shadowMd:'rgba(44,26,14,0.18)',
  danger:  '#C0392B',
  dangerLight:'#FDF0EF',
  warning: '#E67E22',
};

const SLIDES = [
  {
    img: slide1,
    eyebrow: 'RubberSense Community',
    title: "The Growers'",
    titleItalic: 'Blogspot',
    subtitle: 'Share your experiences, ask questions, and connect with fellow rubber farmers. Discuss farming tips, weather insights, pest control, and more.',
  },
  {
    img: slide2,
    eyebrow: 'Knowledge & Community',
    title: 'Grow',
    titleItalic: 'Together',
    subtitle: 'Exchange wisdom with thousands of rubber farmers across the region. Every insight shared strengthens our community grove.',
  },
  {
    img: slide3,
    eyebrow: 'Tips & Discussions',
    title: 'Better',
    titleItalic: 'Harvests',
    subtitle: 'From tapping techniques to pest management — find answers, share discoveries, and elevate your farm with community knowledge.',
  },
];

/* ─── DropZone MUST be outside the component so it doesn't remount on re-render ─── */
const DropZone = ({ id, onChange }) => (
  <div className="cb-dropzone">
    <input
      type="file"
      multiple
      accept="image/*,video/*"
      onChange={onChange}
      style={{ display: 'none' }}
      id={id}
    />
    <label htmlFor={id} style={{ cursor: 'pointer' }}>
      <div className="cb-dropzone-icon"><Upload size={22} /></div>
      <p>Click to upload photos or videos</p>
      <small>Supports JPG, PNG, GIF, WebP, MP4, WebM, QuickTime, AVI, WMV</small>
    </label>
  </div>
);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }

  .cb-root {
    min-height: 100vh;
    background: ${T.mist};
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(107,174,71,0.07) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 90%, rgba(30,77,43,0.06) 0%, transparent 60%);
  }

  /* ══════════════════════════════════════════
     HERO CAROUSEL
  ══════════════════════════════════════════ */
  .cb-hero {
    position: relative;
    height: 520px;
    overflow: hidden;
  }

  .cb-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.9s ease;
    pointer-events: none;
  }
  .cb-slide.active {
    opacity: 1;
    pointer-events: auto;
  }
  .cb-slide-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    transform: scale(1.04);
    transition: transform 6s ease;
  }
  .cb-slide.active .cb-slide-bg {
    transform: scale(1);
  }
  .cb-slide-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      rgba(28,50,25,0.82) 0%,
      rgba(30,77,43,0.55) 45%,
      rgba(44,26,14,0.3) 100%
    );
  }

  .cb-slide-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 64px;
    max-width: 680px;
  }
  .cb-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${T.sap};
    margin-bottom: 20px;
    background: rgba(107,174,71,0.18);
    padding: 6px 16px;
    border-radius: 100px;
    border: 1px solid rgba(107,174,71,0.35);
    width: fit-content;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
  }
  .cb-slide.active .cb-hero-eyebrow {
    opacity: 1;
    transform: translateY(0);
  }
  .cb-hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.4rem, 5.5vw, 4rem);
    font-weight: 700;
    color: ${T.cream};
    line-height: 1.1;
    margin-bottom: 18px;
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s;
  }
  .cb-slide.active h1 {
    opacity: 1;
    transform: translateY(0);
  }
  .cb-hero h1 em { font-style: italic; color: ${T.sap}; }
  .cb-hero p {
    font-size: 1rem;
    color: rgba(245,240,232,0.78);
    max-width: 520px;
    line-height: 1.75;
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s;
  }
  .cb-slide.active p {
    opacity: 1;
    transform: translateY(0);
  }

  .cb-carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(245,240,232,0.14);
    border: 1.5px solid rgba(245,240,232,0.28);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: background 0.2s, border-color 0.2s;
    backdrop-filter: blur(6px);
  }
  .cb-carousel-btn:hover {
    background: rgba(107,174,71,0.35);
    border-color: ${T.sap};
  }
  .cb-carousel-btn.prev { left: 24px; }
  .cb-carousel-btn.next { right: 24px; }

  .cb-carousel-dots {
    position: absolute;
    bottom: 26px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 10;
  }
  .cb-dot {
    width: 8px;
    height: 8px;
    border-radius: 100px;
    background: rgba(245,240,232,0.4);
    border: none;
    cursor: pointer;
    transition: background 0.3s, width 0.3s;
    padding: 0;
  }
  .cb-dot.active {
    background: ${T.sap};
    width: 28px;
  }

  .cb-progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: ${T.sap};
    z-index: 10;
    animation: progressFill 5s linear;
  }
  @keyframes progressFill {
    from { width: 0%; }
    to   { width: 100%; }
  }

  .cb-slide-counter {
    position: absolute;
    bottom: 22px;
    right: 32px;
    color: rgba(245,240,232,0.5);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    z-index: 10;
  }
  .cb-slide-counter span { color: rgba(245,240,232,0.9); }

  /* ── Layout ── */
  .cb-body { max-width: 820px; margin: 0 auto; padding: 40px 20px 80px; }

  /* ── Announcement Bar ── */
  .cb-announcement-bar {
    background: white;
    border: 1.5px solid ${T.latex};
    border-radius: 16px;
    padding: 18px 24px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 14px ${T.shadow};
    gap: 16px;
  }
  .cb-announcement-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cb-announcement-icon {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: linear-gradient(135deg, ${T.latex} 0%, #c6e0a8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${T.canopy};
    flex-shrink: 0;
  }
  .cb-announcement-content h3 {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    color: ${T.bark};
    margin-bottom: 3px;
  }
  .cb-announcement-content p {
    color: #888;
    font-size: 13px;
    line-height: 1.4;
  }
  .cb-announcement-btn {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    background: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    padding: 11px 24px;
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(76,175,80,0.45);
    transition: transform .2s, box-shadow .2s, background .2s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .cb-announcement-btn:hover {
    background: #43A047;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(76,175,80,0.5);
  }

  /* ── Controls bar ── */
  .cb-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .cb-search-wrap {
    flex: 1; min-width: 220px;
    display: flex; align-items: center;
    background: white;
    border: 1.5px solid ${T.fog};
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px ${T.shadow};
    transition: border-color .2s, box-shadow .2s;
  }
  .cb-search-wrap:focus-within {
    border-color: ${T.sap};
    box-shadow: 0 0 0 4px rgba(107,174,71,0.12);
  }
  .cb-search-icon { padding: 0 14px; color: ${T.moss}; display: flex; align-items: center; flex-shrink: 0; }
  .cb-search-input {
    flex: 1; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 15px;
    color: ${T.bark}; background: transparent;
    padding: 13px 0;
  }
  .cb-search-input::placeholder { color: #aaa; }
  .cb-search-btn {
    background: ${T.canopy}; color: white;
    border: none; cursor: pointer;
    padding: 0 20px; height: 100%; min-height: 48px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    letter-spacing: 0.02em;
    transition: background .2s;
    display: flex; align-items: center; gap: 7px;
  }
  .cb-search-btn:hover { background: ${T.bark}; }
  .cb-search-btn:disabled { background: #bbb; cursor: not-allowed; }

  .cb-create-btn {
    display: inline-flex; align-items: center; gap: 9px;
    background: #4CAF50;
    color: white; border: none; cursor: pointer;
    padding: 13px 24px; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700;
    box-shadow: 0 4px 16px rgba(76,175,80,0.45);
    transition: transform .2s, box-shadow .2s, background .2s;
    white-space: nowrap;
  }
  .cb-create-btn:hover {
    background: #43A047;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(76,175,80,0.5);
  }

  /* ── Search banner ── */
  .cb-search-banner {
    display: flex; align-items: center; justify-content: space-between;
    background: white; border: 1.5px solid ${T.latex};
    border-radius: 10px; padding: 12px 18px;
    margin-bottom: 24px;
  }
  .cb-search-banner span { color: ${T.canopy}; font-weight: 600; font-size: 14px; }
  .cb-clear-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: transparent; border: 1px solid #ccc; color: #666;
    padding: 6px 14px; border-radius: 8px; cursor: pointer;
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    transition: all .2s;
  }
  .cb-clear-btn:hover { background: ${T.fog}; border-color: #aaa; }

  /* ── Empty state ── */
  .cb-empty {
    background: white; border-radius: 16px;
    padding: 70px 30px; text-align: center;
    border: 1.5px dashed ${T.fog};
  }
  .cb-empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: ${T.latex}; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 20px; color: ${T.moss};
  }
  .cb-empty h3 { font-family: 'Playfair Display', serif; color: ${T.bark}; font-size: 1.4rem; margin-bottom: 10px; }
  .cb-empty p { color: #777; font-size: 15px; margin-bottom: 24px; }

  /* ── Post card ── */
  .cb-post-card {
    background: white;
    border: 1.5px solid ${T.fog};
    border-radius: 18px;
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: 0 2px 10px ${T.shadow};
    transition: transform .2s, box-shadow .2s;
  }
  .cb-post-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px ${T.shadowMd};
  }
  .cb-post-card-inner { padding: 28px; }

  .cb-post-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; margin-bottom: 18px;
  }
  .cb-author { display: flex; align-items: center; gap: 13px; }
  .cb-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    border: 2.5px solid ${T.sap};
    overflow: hidden; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: ${T.latex}; color: ${T.moss};
    font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700;
    flex-shrink: 0;
    transition: transform .2s, box-shadow .2s;
  }
  .cb-avatar:hover { transform: scale(1.06); box-shadow: 0 0 0 3px rgba(107,174,71,0.25); }
  .cb-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .cb-author-name {
    font-weight: 600; color: ${T.bark}; font-size: 15px; cursor: pointer;
    transition: color .2s;
    text-decoration: none; display: inline-block;
  }
  .cb-author-name:hover { color: ${T.moss}; text-decoration: underline; }
  .cb-author-meta {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #999; margin-top: 2px;
  }
  .cb-edited-tag {
    background: ${T.latex}; color: ${T.moss};
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 2px 7px; border-radius: 100px;
  }

  .cb-post-actions { display: flex; gap: 4px; flex-shrink: 0; }
  .cb-icon-btn {
    background: transparent; border: none; cursor: pointer;
    width: 34px; height: 34px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    transition: background .2s;
  }
  .cb-icon-btn:hover { background: ${T.fog}; }
  .cb-icon-btn.danger { color: ${T.danger}; }
  .cb-icon-btn.danger:hover { background: ${T.dangerLight}; }
  .cb-icon-btn.warn { color: #E67E22; }
  .cb-icon-btn.warn:hover { background: #FEF9F0; }
  .cb-icon-btn.edit { color: ${T.moss}; }

  .cb-post-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem; font-weight: 700;
    color: ${T.bark}; margin-bottom: 12px; line-height: 1.3;
  }
  .cb-post-content {
    font-size: 15px; color: #555; line-height: 1.75;
    white-space: pre-wrap; word-break: break-word; margin-bottom: 18px;
  }
  .cb-read-more {
    background: transparent; border: none; cursor: pointer;
    color: ${T.moss}; font-weight: 600; font-size: 14px;
    padding: 0; margin-left: 6px;
  }

  .cb-media-grid {
    display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px;
  }
  .cb-media-grid img, .cb-media-grid video {
    max-width: 100%; max-height: 280px;
    border-radius: 10px; cursor: pointer;
    object-fit: cover;
    border: 1px solid ${T.fog};
  }

  .cb-post-footer {
    display: flex; align-items: center; gap: 4px;
    border-top: 1.5px solid ${T.fog}; padding-top: 14px;
  }
  .cb-action-pill {
    display: inline-flex; align-items: center; gap: 7px;
    background: transparent; border: 1.5px solid transparent;
    border-radius: 100px; padding: 7px 15px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer; transition: all .2s;
    color: #777;
  }
  .cb-action-pill:hover { background: ${T.fog}; border-color: ${T.fog}; color: ${T.bark}; }
  .cb-action-pill.liked { color: ${T.danger}; border-color: rgba(192,57,43,0.2); background: rgba(192,57,43,0.05); }
  .cb-action-pill:disabled { cursor: not-allowed; opacity: 0.45; }

  /* ── Comments ── */
  .cb-comments-section {
    background: ${T.mist};
    border-top: 1.5px solid ${T.fog};
    padding: 24px 28px;
  }

  .cb-comment-input-wrap { margin-bottom: 24px; }
  .cb-textarea {
    width: 100%; border: 1.5px solid ${T.fog};
    border-radius: 10px; padding: 13px 15px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: ${T.bark}; resize: vertical; outline: none;
    background: white; transition: border-color .2s, box-shadow .2s;
    min-height: 80px;
  }
  .cb-textarea:focus {
    border-color: ${T.sap};
    box-shadow: 0 0 0 3px rgba(107,174,71,0.1);
  }
  .cb-textarea::placeholder { color: #bbb; }
  .cb-comment-footer {
    display: flex; align-items: center;
    justify-content: space-between; margin-top: 10px; flex-wrap: wrap; gap: 10px;
  }
  .cb-upload-label {
    display: inline-flex; align-items: center; gap: 7px;
    background: white; border: 1.5px solid ${T.fog};
    border-radius: 8px; padding: 7px 14px; cursor: pointer;
    font-size: 13px; font-weight: 500; color: #666;
    transition: all .2s;
  }
  .cb-upload-label:hover { border-color: ${T.sap}; color: ${T.moss}; }

  .cb-submit-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: ${T.canopy}; color: white;
    border: none; border-radius: 8px; padding: 9px 20px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background .2s;
  }
  .cb-submit-btn:hover { background: ${T.bark}; }
  .cb-submit-btn:disabled { background: #ccc; cursor: not-allowed; }

  .cb-comment {
    background: white; border-radius: 12px;
    border: 1.5px solid ${T.fog}; padding: 16px;
    margin-bottom: 12px;
  }
  .cb-comment-header {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 10px;
  }
  .cb-avatar-sm {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid ${T.sap};
    overflow: hidden; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: ${T.latex}; color: ${T.moss};
    font-family: 'Playfair Display', serif; font-size: 0.85rem; font-weight: 700;
    flex-shrink: 0; transition: transform .2s;
  }
  .cb-avatar-sm:hover { transform: scale(1.07); }
  .cb-avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
  .cb-avatar-xs {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid ${T.sap};
    overflow: hidden; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: ${T.latex}; color: ${T.moss};
    font-family: 'Playfair Display', serif; font-size: 0.75rem; font-weight: 700;
    flex-shrink: 0; transition: transform .2s;
  }
  .cb-avatar-xs:hover { transform: scale(1.07); }
  .cb-avatar-xs img { width: 100%; height: 100%; object-fit: cover; }
  .cb-comment-body { font-size: 14px; color: #555; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
  .cb-comment-actions { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
  .cb-like-btn {
    display: inline-flex; align-items: center; gap: 5px;
    background: transparent; border: none; cursor: pointer;
    font-size: 12px; font-weight: 500; color: #999;
    padding: 4px 0; transition: color .2s;
  }
  .cb-like-btn:hover, .cb-like-btn.liked { color: ${T.danger}; }
  .cb-like-btn:disabled { cursor: not-allowed; opacity: .5; }
  .cb-reply-btn {
    display: inline-flex; align-items: center; gap: 5px;
    background: transparent; border: none; cursor: pointer;
    font-size: 12px; font-weight: 500; color: #999; padding: 4px 0;
    transition: color .2s;
  }
  .cb-reply-btn:hover { color: ${T.moss}; }

  .cb-replies {
    margin-top: 12px; margin-left: 28px;
    padding-left: 16px; border-left: 2px solid ${T.latex};
  }
  .cb-reply {
    background: ${T.mist}; border-radius: 8px;
    padding: 12px; margin-bottom: 8px;
    border: 1px solid ${T.fog};
  }
  .cb-reply-input-wrap {
    margin-top: 10px; margin-left: 28px;
    padding-left: 16px; border-left: 2px solid ${T.latex};
  }
  .cb-reply-btns { display: flex; gap: 8px; margin-top: 8px; }
  .cb-cancel-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: transparent; border: 1px solid #ccc; color: #666;
    border-radius: 7px; padding: 7px 14px; cursor: pointer;
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    transition: all .2s;
  }
  .cb-cancel-btn:hover { background: ${T.fog}; }

  /* ── Modals ── */
  .cb-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(44,26,14,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000; padding: 20px;
    animation: fadeIn .18s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .cb-modal {
    background: white; border-radius: 20px;
    width: 100%; max-width: 620px; max-height: 92vh;
    overflow-y: auto;
    box-shadow: 0 24px 64px rgba(44,26,14,0.3);
    animation: slideUp .22s ease;
  }
  @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .cb-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 26px 28px 0; margin-bottom: 24px;
  }
  .cb-modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem; color: ${T.bark};
  }
  .cb-modal-title.report { color: ${T.danger}; }
  .cb-modal-close {
    width: 36px; height: 36px; border-radius: 50%;
    background: ${T.fog}; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #666; transition: background .2s;
  }
  .cb-modal-close:hover { background: ${T.parchment}; }
  .cb-modal-body { padding: 0 28px 28px; }

  .cb-field { margin-bottom: 20px; }
  .cb-label {
    display: block; margin-bottom: 7px;
    font-weight: 600; font-size: 13px; color: ${T.bark};
    letter-spacing: 0.02em;
  }
  .cb-input {
    width: 100%; border: 1.5px solid ${T.fog};
    border-radius: 10px; padding: 12px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 15px;
    color: ${T.bark}; outline: none; background: white;
    transition: border-color .2s, box-shadow .2s;
  }
  .cb-input:focus {
    border-color: ${T.sap};
    box-shadow: 0 0 0 3px rgba(107,174,71,0.1);
  }

  .cb-dropzone {
    border: 2px dashed ${T.fog};
    border-radius: 12px; padding: 28px 20px;
    text-align: center; cursor: pointer;
    transition: border-color .2s, background .2s;
  }
  .cb-dropzone:hover { border-color: ${T.sap}; background: rgba(107,174,71,0.03); }
  .cb-dropzone-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: ${T.latex}; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 12px; color: ${T.moss};
  }
  .cb-dropzone p { color: #777; font-size: 14px; }
  .cb-dropzone small { color: #aaa; font-size: 12px; margin-top: 5px; display: block; }

  .cb-preview-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .cb-preview-item { position: relative; }
  .cb-preview-item img, .cb-preview-item video {
    width: 96px; height: 96px; object-fit: cover; border-radius: 10px;
    border: 1.5px solid ${T.fog};
  }
  .cb-remove-preview {
    position: absolute; top: -7px; right: -7px;
    width: 22px; height: 22px; border-radius: 50%;
    background: ${T.danger}; color: white; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 11px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  }

  .cb-modal-footer {
    display: flex; justify-content: flex-end; gap: 12px;
    margin-top: 24px; padding-top: 20px;
    border-top: 1.5px solid ${T.fog};
  }

  .cb-radio-group { display: flex; flex-direction: column; gap: 10px; }
  .cb-radio-label {
    display: flex; align-items: center; gap: 12px; cursor: pointer;
    padding: 11px 14px; border-radius: 10px;
    border: 1.5px solid ${T.fog}; background: white;
    font-size: 14px; color: ${T.bark}; transition: all .15s;
  }
  .cb-radio-label:has(input:checked) {
    border-color: ${T.sap}; background: rgba(107,174,71,0.05);
  }
  .cb-radio-label input { accent-color: ${T.moss}; width: 15px; height: 15px; }

  .cb-toast {
    position: fixed; top: 90px; right: 20px; z-index: 9999;
    padding: 14px 20px; border-radius: 10px; color: white;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    animation: toastIn .25s ease;
    display: flex; align-items: center; gap: 9px;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .cb-comment-img {
    margin-top: 10px; max-width: 200px; max-height: 200px;
    border-radius: 8px; cursor: pointer; border: 1px solid ${T.fog};
  }

  .cb-spinner {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 100vh; background: ${T.mist};
  }
  .cb-spinner-ring {
    width: 52px; height: 52px;
    border: 4px solid ${T.latex};
    border-top-color: ${T.moss};
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .cb-spinner p {
    margin-top: 18px; color: ${T.canopy};
    font-family: 'Playfair Display', serif; font-size: 1rem; font-style: italic;
  }

  @media (max-width: 600px) {
    .cb-hero { height: 400px; }
    .cb-slide-content { padding: 36px 24px; }
    .cb-controls { flex-direction: column; align-items: stretch; }
    .cb-create-btn { justify-content: center; }
    .cb-post-card-inner, .cb-comments-section { padding: 18px; }
    .cb-announcement-bar { flex-direction: column; text-align: center; }
    .cb-announcement-left { flex-direction: column; text-align: center; }
    .cb-carousel-btn.prev { left: 10px; }
    .cb-carousel-btn.next { right: 10px; }
  }
`;

const CommunityBlogspot = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', mediaFiles: [] });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [posting, setPosting] = useState(false);
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [newCommentMedia, setNewCommentMedia] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editMediaFiles, setEditMediaFiles] = useState([]);
  const [editingMedia, setEditingMedia] = useState(false);
  const [reportingItem, setReportingItem] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  // Add state for tracking filtered content
  const [filteredContent, setFilteredContent] = useState({});

  /* ── Carousel state ── */
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const autoplayRef = useRef(null);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  /* ── Carousel logic ── */
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setProgressKey(k => k + 1);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    setProgressKey(k => k + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
    setProgressKey(k => k + 1);
  }, []);

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      setCurrentSlide(s => {
        const next = (s + 1) % SLIDES.length;
        setProgressKey(k => k + 1);
        return next;
      });
    }, 5000);
    return () => clearInterval(autoplayRef.current);
  }, []);

  const resetAutoplay = useCallback(() => {
    clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrentSlide(s => {
        const next = (s + 1) % SLIDES.length;
        setProgressKey(k => k + 1);
        return next;
      });
    }, 5000);
  }, []);

  const handlePrev = () => { prevSlide(); resetAutoplay(); };
  const handleNext = () => { nextSlide(); resetAutoplay(); };
  const handleDot = (i) => { goToSlide(i); resetAutoplay(); };

  /* ── Auth & data ── */
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = API_BASE_URL;
  }, [API_BASE_URL]);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) { setAuthChecked(true); fetchPosts(); return; }
      const response = await axios.get('/api/v1/users/me', {
        withCredentials: true,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setUser(response.data.user);
      setAuthChecked(true); fetchPosts();
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthChecked(true); fetchPosts();
    }
  }, [navigate]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const fetchPosts = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/v1/community/search?q=${encodeURIComponent(searchQuery)}`
        : '/api/v1/community/posts';
      const response = await axios.get(url, { withCredentials: true });
      if (response.data.success) {
        setPosts(searchQuery ? response.data.data.posts || [] : response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
      showToast('Failed to load posts. Please try again.', 'error');
    } finally {
      setLoading(false); setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) { setIsSearching(true); fetchPosts(searchTerm.trim()); }
    else fetchPosts();
  };
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === '') fetchPosts();
  };
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const fetchComments = async (postId) => {
    try {
      const response = await axios.get(`/api/v1/community/posts/${postId}/comments`, { withCredentials: true });
      setComments(prev => ({ ...prev, [postId]: response.data.data || [] }));
    } catch (error) { console.error('Fetch comments error:', error); }
  };

  const handleMediaUpload = async (files, isForComment = false) => {
    const formData = new FormData();
    if (Array.isArray(files)) files.forEach(f => formData.append('media', f));
    else formData.append('media', files);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const endpoint = isForComment ? '/api/v1/upload/community/single' : '/api/v1/upload/community/multiple';
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
        withCredentials: true
      });
      return response.data;
    } catch (error) { console.error('Upload error:', error); throw error; }
  };

  // NEW: Filter bad words from any text content
  const filterBadWords = (text, type, id) => {
    if (!text) return text;
    
    // Filter the text using the badWordsFilter
    const filtered = badWordsFilter.filterText(text);
    
    // Store the filtered version (optional)
    setFilteredContent(prev => ({
      ...prev,
      [`${type}_${id}`]: filtered
    }));
    
    return filtered;
  };

  // MODIFIED: handleCreatePost with bad words filtering
  const handleCreatePost = async () => {
    if (!newPost.title.trim() && !newPost.content.trim() && newPost.mediaFiles.length === 0) {
      alert('Please add content or upload media'); 
      return;
    }
    
    setPosting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Filter bad words from title and content
      const filteredTitle = filterBadWords(newPost.title, 'post_title', 'new');
      const filteredContent_text = filterBadWords(newPost.content, 'post_content', 'new');
      
      let mediaUrls = [];
      if (newPost.mediaFiles.length > 0) {
        setUploadingMedia(true);
        const uploadResponse = await handleMediaUpload(newPost.mediaFiles, false);
        mediaUrls = uploadResponse.files || [uploadResponse.file];
        setUploadingMedia(false);
      }
      
      const postData = { 
        title: filteredTitle, 
        content: filteredContent_text, 
        media: mediaUrls 
      };
      
      const response = await axios.post('/api/v1/community/posts', postData, {
        withCredentials: true,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.data.success) {
        setPosts([response.data.data, ...posts]);
        setNewPost({ title: '', content: '', mediaFiles: [] });
        setShowCreateModal(false);
        
        // Show appropriate message
        if (filteredTitle !== newPost.title || filteredContent_text !== newPost.content) {
          showToast('Your post was published with some content filtered.', 'warning');
        } else {
          showToast('Post published successfully!', 'success');
        }
      }
    } catch (error) {
      console.error('Create post error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      } else {
        showToast('Failed to create post. Please try again.', 'error');
      }
    } finally { 
      setPosting(false); 
      setUploadingMedia(false); 
    }
  };

  // MODIFIED: handleUpdatePost with bad words filtering
  const handleUpdatePost = async (postId) => {
    if (!editingPost.title.trim() && !editingPost.content.trim() &&
        (!editingPost.media || editingPost.media.length === 0) && editMediaFiles.length === 0) {
      alert('Please fill in at least one field or upload media'); 
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Filter bad words from edited content
      const filteredTitle = filterBadWords(editingPost.title, 'post_title', postId);
      const filteredContent_text = filterBadWords(editingPost.content, 'post_content', postId);
      
      let updatedMedia = [...(editingPost.media || [])];
      if (editMediaFiles.length > 0) {
        setEditingMedia(true);
        const uploadResponse = await handleMediaUpload(editMediaFiles, false);
        const newMediaUrls = uploadResponse.files || [uploadResponse.file];
        updatedMedia = [...updatedMedia, ...newMediaUrls];
        setEditingMedia(false);
      }
      
      const postData = { 
        title: filteredTitle, 
        content: filteredContent_text, 
        media: updatedMedia 
      };
      
      const response = await axios.put(`/api/v1/community/posts/${postId}`, postData, {
        withCredentials: true, 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPosts(posts.map(p => p._id === postId ? response.data.data : p));
        setEditingPost(null); 
        setEditMediaFiles([]);
        
        if (filteredTitle !== editingPost.title || filteredContent_text !== editingPost.content) {
          showToast('Post updated with filtered content.', 'warning');
        } else {
          showToast('Post updated successfully!', 'success');
        }
      }
    } catch (error) {
      console.error('Update post error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      } else {
        showToast('Failed to update post.', 'error');
      }
    } finally { 
      setEditingMedia(false); 
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.delete(`/api/v1/community/posts/${postId}`, {
        withCredentials: true, headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setPosts(posts.filter(p => p._id !== postId));
        showToast('Post deleted successfully!', 'success');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      } else {
        showToast('Failed to delete post.', 'error');
      }
    }
  };

  // MODIFIED: handleAddComment with bad words filtering
  const handleAddComment = async (postId) => {
    const commentText = newComments[postId];
    const commentMedia = newCommentMedia[postId];
    
    if ((!commentText?.trim() && !commentMedia) || !user) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Filter bad words from comment
      const filteredComment = commentText ? filterBadWords(commentText, 'comment', postId) : '';
      
      let mediaUrl = null;
      if (commentMedia) {
        const uploadResponse = await handleMediaUpload(commentMedia, true);
        mediaUrl = uploadResponse.file || uploadResponse.files?.[0];
      }
      
      const commentData = { 
        content: filteredComment || '', 
        media: mediaUrl 
      };
      
      const response = await axios.post(`/api/v1/community/posts/${postId}/comments`, commentData, {
        withCredentials: true,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.data.success) {
        setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), response.data.data] }));
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        setNewCommentMedia(prev => ({ ...prev, [postId]: null }));
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
        
        if (filteredComment !== commentText) {
          showToast('Your comment was published with filtered content.', 'warning');
        } else {
          showToast('Comment added!', 'success');
        }
      }
    } catch (error) {
      console.error('Add comment error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      } else {
        showToast('Failed to add comment', 'error');
      }
    }
  };

  // MODIFIED: handleAddReply with bad words filtering
  const handleAddReply = async (postId, commentId) => {
    if (!replyText.trim()) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Filter bad words from reply
      const filteredReply = filterBadWords(replyText, 'reply', `${postId}_${commentId}`);
      
      const response = await axios.post(
        `/api/v1/community/posts/${postId}/comments`,
        { content: filteredReply, parentComment: commentId },
        { withCredentials: true, headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setComments(prev => {
          const postComments = prev[postId] || [];
          const updated = postComments.map(c => c._id === commentId
            ? { ...c, replies: [...(c.replies || []), response.data.data] } : c);
          return { ...prev, [postId]: updated };
        });
        setReplyText(''); 
        setReplyingTo(null);
        
        if (filteredReply !== replyText) {
          showToast('Your reply was published with filtered content.', 'warning');
        } else {
          showToast('Reply added!', 'success');
        }
      }
    } catch (error) {
      console.error('Add reply error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      } else {
        showToast('Failed to add reply', 'error');
      }
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.put(`/api/v1/community/posts/${postId}/like`, {}, {
        withCredentials: true, headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setPosts(prev => prev.map(p => p._id === postId
          ? { ...p, likes: response.data.data.likes, likesCount: response.data.data.likesCount, userLiked: !p.userLiked }
          : p));
      }
    } catch (error) {
      console.error('Like post error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      }
    }
  };

  const handleLikeComment = async (postId, commentId, isReply = false, parentCommentId = null) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.put(`/api/v1/community/comments/${commentId}/like`, {}, {
        withCredentials: true, headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        if (isReply && parentCommentId) {
          setComments(prev => {
            const updated = (prev[postId] || []).map(c => {
              if (c._id === parentCommentId) {
                const updatedReplies = c.replies.map(r => r._id === commentId
                  ? { ...r, likes: response.data.data.likes, likesCount: response.data.data.likesCount, userLiked: !r.userLiked }
                  : r);
                return { ...c, replies: updatedReplies };
              }
              return c;
            });
            return { ...prev, [postId]: updated };
          });
        } else {
          setComments(prev => {
            const updated = (prev[postId] || []).map(c => c._id === commentId
              ? { ...c, likes: response.data.data.likes, likesCount: response.data.data.likesCount, userLiked: !c.userLiked }
              : c);
            return { ...prev, [postId]: updated };
          });
        }
      }
    } catch (error) {
      console.error('Like comment error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      }
    }
  };

  const handleDeleteComment = async (postId, commentId, isReply = false, parentCommentId = null) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.delete(`/api/v1/community/comments/${commentId}`, {
        withCredentials: true, headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        if (isReply && parentCommentId) {
          setComments(prev => {
            const updated = (prev[postId] || []).map(c => {
              if (c._id === parentCommentId) return { ...c, replies: c.replies.filter(r => r._id !== commentId) };
              return c;
            });
            return { ...prev, [postId]: updated };
          });
        } else {
          setComments(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(c => c._id !== commentId) }));
        }
        if (!isReply) {
          setPosts(prev => prev.map(p => p._id === postId && p.commentsCount > 0
            ? { ...p, commentsCount: p.commentsCount - 1 } : p));
        }
        showToast('Comment deleted!', 'success');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      } else {
        showToast('Failed to delete comment', 'error');
      }
    }
  };

  const handleReportContent = async (itemType, itemId) => {
    if (!user) { showToast('Please login to report content', 'error'); return; }
    if (!reportReason) { showToast('Please select a reason for reporting', 'error'); return; }
    setReporting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post('/api/v1/community/report',
        { itemType, itemId, reason: reportReason, description: reportDescription },
        { withCredentials: true, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        setReportSuccess(true); setReportingItem(null);
        setReportReason(''); setReportDescription('');
        showToast('Content reported successfully. Our team will review it.', 'success');
        if (itemType === 'post') fetchPosts(searchTerm);
      }
    } catch (error) {
      console.error('Report content error:', error);
      if (error.response?.status === 400) showToast(error.response.data.message, 'error');
      else if (error.response?.status === 401) { 
        showToast('Session expired. Please login again.', 'error'); 
        navigate('/login'); 
      } else {
        showToast('Failed to report content. Please try again.', 'error');
      }
    } finally { setReporting(false); }
  };

  const togglePostExpanded = (postId) => {
    if (expandedPosts.includes(postId)) {
      setExpandedPosts(expandedPosts.filter(id => id !== postId));
    } else {
      setExpandedPosts([...expandedPosts, postId]);
      if (!comments[postId]) fetchComments(postId);
    }
  };

  /* ── File change handlers ── */
  const handleMediaFileChange = (e) => {
    const files = Array.from(e.target.files).filter(f => {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      const validVideo = ['video/mp4','video/mpeg','video/ogg','video/webm','video/quicktime','video/x-msvideo','video/x-ms-wmv'];
      return validImage.includes(f.type) || validVideo.includes(f.type);
    });
    if (files.length > 0) setNewPost(prev => ({ ...prev, mediaFiles: [...prev.mediaFiles, ...files] }));
    // Reset the input so selecting the same file again still triggers onChange
    e.target.value = '';
  };

  const handleEditMediaFileChange = (e) => {
    const files = Array.from(e.target.files).filter(f => {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      const validVideo = ['video/mp4','video/mpeg','video/ogg','video/webm','video/quicktime','video/x-msvideo','video/x-ms-wmv'];
      return validImage.includes(f.type) || validVideo.includes(f.type);
    });
    if (files.length > 0) setEditMediaFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const handleCommentMediaChange = (e, postId) => {
    const file = e.target.files[0];
    if (file) {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      if (validImage.includes(file.type)) setNewCommentMedia(prev => ({ ...prev, [postId]: file }));
      else alert('Please select a valid image file (JPEG, PNG, GIF, WebP, etc.)');
    }
    e.target.value = '';
  };

  const removeMediaFile = (index) => setNewPost(prev => ({ ...prev, mediaFiles: prev.mediaFiles.filter((_, i) => i !== index) }));
  const removeEditMediaFile = (index) => setEditMediaFiles(prev => prev.filter((_, i) => i !== index));
  const removeExistingMedia = (index) => {
    if (editingPost) {
      const updatedMedia = [...editingPost.media];
      updatedMedia.splice(index, 1);
      setEditingPost(prev => ({ ...prev, media: updatedMedia }));
    }
  };
  const removeCommentMedia = (postId) => setNewCommentMedia(prev => ({ ...prev, [postId]: null }));

  const renderMediaPreview = (file) => {
    if (file.type.startsWith('image/')) return <img src={URL.createObjectURL(file)} alt="Preview" />;
    if (file.type.startsWith('video/')) return <video src={URL.createObjectURL(file)} controls />;
    return null;
  };

  const renderPostMedia = (media) => {
    if (!media || media.length === 0) return null;
    return (
      <div className="cb-media-grid">
        {media.map((item, index) => (
          <div key={index}>
            {item.mimetype?.startsWith('image/') ? (
              <img src={`${API_BASE_URL}${item.url}`} alt={`Post media ${index + 1}`}
                onClick={() => window.open(`${API_BASE_URL}${item.url}`, '_blank')}
                onError={(e) => { e.target.style.display = 'none'; }} />
            ) : item.mimetype?.startsWith('video/') ? (
              <video src={`${API_BASE_URL}${item.url}`} controls
                onError={(e) => { e.target.style.display = 'none'; }} />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderCommentMedia = (media) => {
    if (!media) return null;
    return media.mimetype?.startsWith('image/') ? (
      <img src={`${API_BASE_URL}${media.url}`} alt="Comment attachment"
        className="cb-comment-img"
        onClick={() => window.open(`${API_BASE_URL}${media.url}`, '_blank')}
        onError={(e) => { e.target.style.display = 'none'; }} />
    ) : null;
  };

  // MODIFIED: showToast with warning type support
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = 'cb-toast';
    
    // Set background color based on type
    let bgColor;
    if (type === 'success') bgColor = T.canopy;
    else if (type === 'error') bgColor = T.danger;
    else if (type === 'warning') bgColor = T.warning;
    else bgColor = '#555';
    
    toast.style.background = bgColor;
    
    // Set icon based on type
    let icon;
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✕';
    else if (type === 'warning') icon = '⚠';
    else icon = 'i';
    
    toast.innerHTML = `<span style="font-size:16px;font-weight:700;margin-right:8px;">${icon}</span> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => { 
      toast.style.opacity = '0'; 
      toast.style.transform = 'translateX(30px)'; 
      toast.style.transition = 'all .3s'; 
    }, 2700);
    
    setTimeout(() => toast.remove(), 3100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateText = (text, length = 500) => text.length <= length ? text : text.substring(0, length) + '...';
  const isUserPostOwner = (postUserId) => user && user._id === postUserId;
  const isUserCommentOwner = (commentUserId) => user && user._id === commentUserId;
  const handleEditClick = (post) => {
    setEditingPost({ ...post, title: post.title || '', content: post.content || '', media: post.media || [] });
    setEditMediaFiles([]);
  };

  /* ── Avatar helpers ── */
  const AvatarLg = ({ user: u, onClick }) => (
    <div className="cb-avatar" onClick={onClick}>
      {u?.profilePicture ? <img src={`${API_BASE_URL}${u.profilePicture}`} alt={u?.name || 'User'} /> : (u?.name?.charAt(0)?.toUpperCase() || 'U')}
    </div>
  );
  const AvatarMd = ({ user: u, onClick }) => (
    <div className="cb-avatar-sm" onClick={onClick}>
      {u?.profilePicture ? <img src={`${API_BASE_URL}${u.profilePicture}`} alt={u?.name || 'User'} /> : (u?.name?.charAt(0)?.toUpperCase() || 'U')}
    </div>
  );
  const AvatarSm = ({ user: u, onClick }) => (
    <div className="cb-avatar-xs" onClick={onClick}>
      {u?.profilePicture ? <img src={`${API_BASE_URL}${u.profilePicture}`} alt={u?.name || 'User'} /> : (u?.name?.charAt(0)?.toUpperCase() || 'U')}
    </div>
  );

  /* ─────────────────── LOADING ─────────────────── */
  if (loading && !authChecked) {
    return (
      <>
        <style>{css}</style>
        <div className="cb-spinner">
          <div className="cb-spinner-ring" />
          <p>Loading the community grove…</p>
        </div>
      </>
    );
  }

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <>
      <style>{css}</style>
      <UserHeader />

      <div className="cb-root">

        {/* ══════════════════════════════
            HERO CAROUSEL
        ══════════════════════════════ */}
        <div className="cb-hero">
          {SLIDES.map((slide, i) => (
            <div key={i} className={`cb-slide${currentSlide === i ? ' active' : ''}`}>
              <div className="cb-slide-bg" style={{ backgroundImage: `url(${slide.img})` }} />
              <div className="cb-slide-overlay" />
              <div className="cb-slide-content">
                <div className="cb-hero-eyebrow">
                  <Leaf size={13} />
                  {slide.eyebrow}
                </div>
                <h1>{slide.title} <em>{slide.titleItalic}</em></h1>
                <p>{slide.subtitle}</p>
              </div>
            </div>
          ))}

          <button className="cb-carousel-btn prev" onClick={handlePrev} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button className="cb-carousel-btn next" onClick={handleNext} aria-label="Next slide">
            <ChevronRight size={20} />
          </button>

          <div className="cb-carousel-dots">
            {SLIDES.map((_, i) => (
              <button key={i} className={`cb-dot${currentSlide === i ? ' active' : ''}`}
                onClick={() => handleDot(i)} aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>

          <div className="cb-slide-counter">
            <span>{currentSlide + 1}</span> / {SLIDES.length}
          </div>

          <div key={progressKey} className="cb-progress-bar" />
        </div>

        {/* ── Body ── */}
        <div className="cb-body">

          {/* Announcement Bar */}
          <div className="cb-announcement-bar">
            <div className="cb-announcement-left">
              <div className="cb-announcement-icon">
                <Bell size={22} />
              </div>
              <div className="cb-announcement-content">
                <h3>Announcements</h3>
                <p>Stay updated with the latest news and updates from the community</p>
              </div>
            </div>
            <button className="cb-announcement-btn" onClick={() => navigate('/announcements')}>
              <Bell size={16} />
              View Announcements
            </button>
          </div>

          {/* Controls */}
          <div className="cb-controls">
            <div className="cb-search-wrap">
              <div className="cb-search-icon"><Search size={17} /></div>
              <input
                className="cb-search-input"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                placeholder="Search posts and growers…"
              />
              <button className="cb-search-btn" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 size={15} style={{ animation: 'spin .9s linear infinite' }} /> : <Search size={15} />}
                {isSearching ? 'Searching' : 'Search'}
              </button>
            </div>
            {user && (
              <button className="cb-create-btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} /> New Post
              </button>
            )}
          </div>

          {/* Search banner */}
          {searchTerm && (
            <div className="cb-search-banner">
              <span>Results for: &quot;{searchTerm}&quot;</span>
              <button className="cb-clear-btn" onClick={() => { setSearchTerm(''); fetchPosts(); }}>
                <X size={13} /> Clear
              </button>
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="cb-empty">
              <div className="cb-empty-icon">
                {searchTerm ? <Search size={28} /> : <Leaf size={28} />}
              </div>
              <h3>{searchTerm ? 'No results found' : 'The grove is quiet'}</h3>
              <p>
                {searchTerm
                  ? `No posts or growers found for "${searchTerm}"`
                  : user ? 'Be the first to plant a post and start the discussion!' : 'Login to create a post and join the discussion!'}
              </p>
              {!searchTerm && user && (
                <button className="cb-create-btn" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} /> Start the Conversation
                </button>
              )}
            </div>
          ) : (
            posts.map(post => (
              <div key={post._id} className="cb-post-card">
                <div className="cb-post-card-inner">
                  <div className="cb-post-header">
                    <div className="cb-author">
                      <AvatarLg user={post.user} onClick={() => navigate(`/user/${post.user?._id}`)} />
                      <div>
                        <div className="cb-author-name" onClick={() => navigate(`/user/${post.user?._id}`)}>
                          {post.user?.name || 'Anonymous'}
                        </div>
                        <div className="cb-author-meta">
                          <Clock size={11} />
                          <span>{formatDate(post.createdAt)}</span>
                          {post.isEdited && <span className="cb-edited-tag">Edited</span>}
                        </div>
                      </div>
                    </div>
                    <div className="cb-post-actions">
                      {user && isUserPostOwner(post.user?._id) && (
                        <>
                          <button className="cb-icon-btn edit" onClick={() => handleEditClick(post)} title="Edit post">
                            <Edit2 size={15} />
                          </button>
                          <button className="cb-icon-btn danger" onClick={() => handleDeletePost(post._id)} title="Delete post">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {user && !isUserPostOwner(post.user?._id) && (
                        <button className="cb-icon-btn warn" onClick={() => setReportingItem({ type: 'post', id: post._id })} title="Report post">
                          <Flag size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {post.title && <div className="cb-post-title">{post.title}</div>}
                  {post.content && (
                    <div className="cb-post-content">
                      {expandedPosts.includes(post._id) || post.content.length <= 500
                        ? post.content
                        : truncateText(post.content, 500)}
                      {post.content.length > 500 && !expandedPosts.includes(post._id) && (
                        <button className="cb-read-more" onClick={() => togglePostExpanded(post._id)}>Read more</button>
                      )}
                    </div>
                  )}

                  {renderPostMedia(post.media)}

                  <div className="cb-post-footer">
                    <button
                      className={`cb-action-pill${post.userLiked ? ' liked' : ''}`}
                      onClick={() => handleLikePost(post._id)}
                      disabled={!user}
                    >
                      <Heart size={15} fill={post.userLiked ? 'currentColor' : 'none'} />
                      {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
                    </button>
                    <button className="cb-action-pill" onClick={() => togglePostExpanded(post._id)}>
                      <MessageCircle size={15} />
                      {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
                      {expandedPosts.includes(post._id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* ── Comments section ── */}
                {expandedPosts.includes(post._id) && (
                  <div className="cb-comments-section">
                    {user && (
                      <div className="cb-comment-input-wrap">
                        <textarea
                          className="cb-textarea"
                          value={newComments[post._id] || ''}
                          onChange={(e) => setNewComments(prev => ({ ...prev, [post._id]: e.target.value }))}
                          placeholder="Share your thoughts with the grove…"
                        />
                        {newCommentMedia[post._id] ? (
                          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                            <img src={URL.createObjectURL(newCommentMedia[post._id])} alt="Preview"
                              style={{ maxWidth: '140px', maxHeight: '140px', borderRadius: '8px', border: `1px solid ${T.fog}` }} />
                            <button className="cb-remove-preview" onClick={() => removeCommentMedia(post._id)}>
                              <X size={10} />
                            </button>
                          </div>
                        ) : null}
                        <div className="cb-comment-footer">
                          <label className="cb-upload-label">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCommentMediaChange(e, post._id)}
                              style={{ display: 'none' }}
                            />
                            <Image size={15} /> Add Photo
                          </label>
                          <button
                            className="cb-submit-btn"
                            onClick={() => handleAddComment(post._id)}
                            disabled={!newComments[post._id]?.trim() && !newCommentMedia[post._id]}
                          >
                            <Send size={14} /> Post Comment
                          </button>
                        </div>
                      </div>
                    )}

                    {(!comments[post._id] || comments[post._id].length === 0) ? (
                      <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                        {user ? 'No comments yet — be the first to speak up.' : 'No comments yet. Login to comment.'}
                      </p>
                    ) : (
                      comments[post._id].map(comment => (
                        <div key={comment._id} className="cb-comment">
                          <div className="cb-comment-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <AvatarMd user={comment.user} onClick={() => navigate(`/user/${comment.user?._id}`)} />
                              <div>
                                <div className="cb-author-name" onClick={() => navigate(`/user/${comment.user?._id}`)}>
                                  {comment.user?.name || 'Anonymous'}
                                </div>
                                <div className="cb-author-meta">
                                  <Clock size={10} />
                                  <span>{formatDate(comment.createdAt)}</span>
                                  {comment.isEdited && <span className="cb-edited-tag">Edited</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '3px' }}>
                              {user && isUserCommentOwner(comment.user?._id) && (
                                <button className="cb-icon-btn danger" onClick={() => handleDeleteComment(post._id, comment._id)}>
                                  <Trash2 size={13} />
                                </button>
                              )}
                              {user && !isUserCommentOwner(comment.user?._id) && (
                                <button className="cb-icon-btn warn" onClick={() => setReportingItem({ type: 'comment', id: comment._id })}>
                                  <Flag size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="cb-comment-body">
                            {comment.content}
                            {renderCommentMedia(comment.media)}
                          </div>
                          <div className="cb-comment-actions">
                            <button className={`cb-like-btn${comment.userLiked ? ' liked' : ''}`}
                              onClick={() => handleLikeComment(post._id, comment._id)}
                              disabled={!user}>
                              <Heart size={13} fill={comment.userLiked ? 'currentColor' : 'none'} />
                              {comment.likesCount || 0}
                            </button>
                            {user && (
                              <button className="cb-reply-btn" onClick={() => {
                                if (replyingTo === comment._id) { setReplyingTo(null); }
                                else { setReplyingTo(comment._id); setReplyText(''); }
                              }}>
                                <CornerDownRight size={13} /> Reply
                              </button>
                            )}
                          </div>

                          {replyingTo === comment._id && (
                            <div className="cb-reply-input-wrap">
                              <textarea
                                className="cb-textarea"
                                style={{ minHeight: '60px', fontSize: '13px' }}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply…"
                              />
                              <div className="cb-reply-btns">
                                <button className="cb-submit-btn" style={{ fontSize: '13px', padding: '7px 16px' }}
                                  onClick={() => handleAddReply(post._id, comment._id)}
                                  disabled={!replyText.trim()}>
                                  <Send size={13} /> Reply
                                </button>
                                <button className="cb-cancel-btn" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                                  <X size={13} /> Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="cb-replies">
                              {comment.replies.map(reply => (
                                <div key={reply._id} className="cb-reply">
                                  <div className="cb-comment-header" style={{ marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <AvatarSm user={reply.user} onClick={() => navigate(`/user/${reply.user?._id}`)} />
                                      <div>
                                        <div className="cb-author-name" style={{ fontSize: '13px' }}
                                          onClick={() => navigate(`/user/${reply.user?._id}`)}>
                                          {reply.user?.name || 'Anonymous'}
                                        </div>
                                        <div className="cb-author-meta" style={{ fontSize: '11px' }}>
                                          <Clock size={9} />
                                          <span>{formatDate(reply.createdAt)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                      {user && isUserCommentOwner(reply.user?._id) && (
                                        <button className="cb-icon-btn danger" style={{ width: '28px', height: '28px' }}
                                          onClick={() => handleDeleteComment(post._id, reply._id, true, comment._id)}>
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                      {user && !isUserCommentOwner(reply.user?._id) && (
                                        <button className="cb-icon-btn warn" style={{ width: '28px', height: '28px' }}
                                          onClick={() => setReportingItem({ type: 'comment', id: reply._id })}>
                                          <Flag size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="cb-comment-body" style={{ fontSize: '13px' }}>
                                    {reply.content}
                                    {renderCommentMedia(reply.media)}
                                  </div>
                                  <div className="cb-comment-actions" style={{ marginTop: '8px' }}>
                                    <button className={`cb-like-btn${reply.userLiked ? ' liked' : ''}`}
                                      onClick={() => handleLikeComment(post._id, reply._id, true, comment._id)}
                                      disabled={!user}>
                                      <Heart size={12} fill={reply.userLiked ? 'currentColor' : 'none'} />
                                      {reply.likesCount || 0}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ Create Post Modal ═══ */}
      {showCreateModal && (
        <div className="cb-modal-overlay">
          <div className="cb-modal">
            <div className="cb-modal-header">
              <h2 className="cb-modal-title">Plant a New Post</h2>
              <button className="cb-modal-close" onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>
            <div className="cb-modal-body">
              <div className="cb-field">
                <label className="cb-label">Title <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                <input className="cb-input" type="text" value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your post a title…" />
              </div>
              <div className="cb-field">
                <label className="cb-label">Content <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                <textarea className="cb-textarea" style={{ minHeight: '150px' }}
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your knowledge, questions, or experiences with fellow growers…" />
              </div>
              <div className="cb-field">
                <label className="cb-label">Photos & Videos</label>
                <DropZone id="create-media-upload" onChange={handleMediaFileChange} />
                {newPost.mediaFiles.length > 0 && (
                  <div className="cb-preview-grid">
                    {newPost.mediaFiles.map((file, index) => (
                      <div key={index} className="cb-preview-item">
                        {renderMediaPreview(file)}
                        <button className="cb-remove-preview" onClick={() => removeMediaFile(index)}><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="cb-modal-footer">
                <button className="cb-cancel-btn" onClick={() => setShowCreateModal(false)}><X size={14} /> Cancel</button>
                <button className="cb-submit-btn"
                  onClick={handleCreatePost}
                  disabled={posting || uploadingMedia || (!newPost.title.trim() && !newPost.content.trim() && newPost.mediaFiles.length === 0)}>
                  {uploadingMedia ? <><Loader2 size={14} style={{ animation: 'spin .9s linear infinite' }} /> Uploading…</> :
                   posting ? <><Loader2 size={14} style={{ animation: 'spin .9s linear infinite' }} /> Publishing…</> :
                   <><Check size={14} /> Publish Post</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Edit Post Modal ═══ */}
      {editingPost && (
        <div className="cb-modal-overlay">
          <div className="cb-modal">
            <div className="cb-modal-header">
              <h2 className="cb-modal-title">Edit Post</h2>
              <button className="cb-modal-close" onClick={() => { setEditingPost(null); setEditMediaFiles([]); }}><X size={16} /></button>
            </div>
            <div className="cb-modal-body">
              <div className="cb-field">
                <label className="cb-label">Title</label>
                <input className="cb-input" type="text" value={editingPost.title || ''}
                  onChange={(e) => setEditingPost(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="cb-field">
                <label className="cb-label">Content</label>
                <textarea className="cb-textarea" style={{ minHeight: '180px' }}
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost(prev => ({ ...prev, content: e.target.value }))} />
              </div>
              {editingPost.media && editingPost.media.length > 0 && (
                <div className="cb-field">
                  <label className="cb-label">Existing Media</label>
                  <div className="cb-preview-grid">
                    {editingPost.media.map((item, index) => (
                      <div key={`existing-${index}`} className="cb-preview-item">
                        {item.mimetype?.startsWith('image/') ? (
                          <img src={`${API_BASE_URL}${item.url}`} alt={`Media ${index + 1}`} />
                        ) : item.mimetype?.startsWith('video/') ? (
                          <video src={`${API_BASE_URL}${item.url}`} controls />
                        ) : null}
                        <button className="cb-remove-preview" onClick={() => removeExistingMedia(index)}><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="cb-field">
                <label className="cb-label">Add More Photos & Videos</label>
                <DropZone id="edit-media-upload" onChange={handleEditMediaFileChange} />
                {editMediaFiles.length > 0 && (
                  <div className="cb-preview-grid">
                    {editMediaFiles.map((file, index) => (
                      <div key={`new-${index}`} className="cb-preview-item">
                        {renderMediaPreview(file)}
                        <button className="cb-remove-preview" onClick={() => removeEditMediaFile(index)}><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="cb-modal-footer">
                <button className="cb-cancel-btn" onClick={() => { setEditingPost(null); setEditMediaFiles([]); }}><X size={14} /> Cancel</button>
                <button className="cb-submit-btn"
                  onClick={() => handleUpdatePost(editingPost._id)}
                  disabled={editingMedia || (!editingPost.title?.trim() && !editingPost.content?.trim() &&
                    (!editingPost.media || editingPost.media.length === 0) && editMediaFiles.length === 0)}>
                  {editingMedia ? <><Loader2 size={14} style={{ animation: 'spin .9s linear infinite' }} /> Uploading…</> : <><Check size={14} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Report Modal ═══ */}
      {reportingItem && (
        <div className="cb-modal-overlay">
          <div className="cb-modal">
            <div className="cb-modal-header">
              <h2 className="cb-modal-title report">Report Content</h2>
              <button className="cb-modal-close" onClick={() => { setReportingItem(null); setReportReason(''); setReportDescription(''); }}><X size={16} /></button>
            </div>
            <div className="cb-modal-body">
              <p style={{ color: '#777', fontSize: '14px', marginBottom: '20px' }}>
                Please select a reason for reporting this {reportingItem.type}. Our moderation team will review it promptly.
              </p>
              <div className="cb-field">
                <label className="cb-label">Reason for Report</label>
                <div className="cb-radio-group">
                  {[
                    { value: 'spam', label: 'Spam or misleading content' },
                    { value: 'harassment', label: 'Harassment or bullying' },
                    { value: 'hate_speech', label: 'Hate speech or discrimination' },
                    { value: 'inappropriate_content', label: 'Inappropriate content' },
                    { value: 'false_information', label: 'False information' },
                    { value: 'other', label: 'Other' },
                  ].map(({ value, label }) => (
                    <label key={value} className="cb-radio-label">
                      <input type="radio" name="reportReason" value={value}
                        checked={reportReason === value}
                        onChange={(e) => setReportReason(e.target.value)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="cb-field">
                <label className="cb-label">Additional Details <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                <textarea className="cb-textarea" style={{ minHeight: '90px' }}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide more context to help our team review this report…" />
              </div>
              <div className="cb-modal-footer">
                <button className="cb-cancel-btn" onClick={() => { setReportingItem(null); setReportReason(''); setReportDescription(''); }}>
                  <X size={14} /> Cancel
                </button>
                <button
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    background: reporting || !reportReason ? '#ccc' : T.danger,
                    color: 'white', border: 'none', borderRadius: '8px',
                    padding: '9px 20px', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px', fontWeight: 600, cursor: reporting ? 'not-allowed' : 'pointer',
                    transition: 'background .2s'
                  }}
                  onClick={() => handleReportContent(reportingItem.type, reportingItem.id)}
                  disabled={reporting || !reportReason}>
                  {reporting
                    ? <><Loader2 size={14} style={{ animation: 'spin .9s linear infinite' }} /> Reporting…</>
                    : <><AlertTriangle size={14} /> Submit Report</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserFooter />
    </>
  );
};

export default CommunityBlogspot;