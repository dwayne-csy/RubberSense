// RubberSense/Web/src/Components/Admin/AdminContactMessages.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LeftNavigationBar from '../layouts/LeftNavigationBar';
import { exportRowsToPdf } from '../../utils/pdfExport';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Inbox: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
    </svg>
  ),
  MailUnread: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
      <circle cx="18" cy="5" r="3.5" fill="#e53935" stroke="white" strokeWidth="1.5"/>
    </svg>
  ),
  MailRead: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
      <polyline points="7,13 10,16 17,9" stroke="#2e7d32" strokeWidth="2.5"/>
    </svg>
  ),
  Eye: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Chat: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  Reply: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7"/>
      <path d="M20 18v-2a4 4 0 00-4-4H4"/>
    </svg>
  ),
  Archive: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  ),
  Trash: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  Mail: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Send: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Download: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Clock: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Check: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  MessageSquare: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
};

// ── Inline CSS ────────────────────────────────────────────────────────────────
const styles = `
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
  .acm-hero {
    position: relative; height: 220px;
    border-radius: var(--radius); overflow: hidden;
    margin-bottom: 32px; display: flex;
    align-items: flex-end; padding: 28px 32px;
  }
  .acm-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 30%; filter: brightness(.55);
  }
  .acm-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(27,94,32,.75) 0%, rgba(0,191,165,.35) 100%);
  }
  .acm-hero-content { position: relative; z-index: 1; }
  .acm-hero-title {
    font-family: 'Playfair Display', serif; font-size: 2.2rem;
    color: #fff; margin: 0 0 4px; line-height: 1.1; letter-spacing: -.5px;
  }
  .acm-hero-sub {
    font-family: 'DM Sans', sans-serif; font-size: .92rem;
    color: rgba(255,255,255,.8); margin: 0; font-weight: 300;
  }
  .acm-hero-badge {
    position: absolute; top: 20px; right: 20px; z-index: 1;
    background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.25); border-radius: 50px;
    padding: 6px 14px; font-family: 'DM Sans', sans-serif;
    font-size: .78rem; color: #fff; font-weight: 500;
    display: flex; align-items: center; gap: 7px;
  }

  /* ── STATS ROW (3 cards) ────────────────────────────────── */
  .acm-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 14px; margin-bottom: 28px;
  }
  .acm-stat-card {
    background: var(--white); border-radius: 12px;
    padding: 20px 18px; display: flex; align-items: center; gap: 16px;
    box-shadow: var(--shadow-sm); border: 1.5px solid transparent;
    cursor: pointer; transition: transform .18s, box-shadow .18s, border-color .18s;
    font-family: 'DM Sans', sans-serif;
  }
  .acm-stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .acm-stat-card.active { border-color: var(--green-mid); background: var(--green-pale); }
  .acm-stat-icon-wrap {
    width: 52px; height: 52px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .acm-stat-icon-wrap.all    { background: #e8f5e9; color: var(--green-mid); }
  .acm-stat-icon-wrap.unread { background: #ffebee; color: var(--red); }
  .acm-stat-icon-wrap.read   { background: #e0f7fa; color: var(--teal); }
  .acm-stat-info { flex: 1; }
  .acm-stat-count { font-size: 1.7rem; font-weight: 700; color: var(--grey-dark); line-height: 1; }
  .acm-stat-label { font-size: .72rem; color: var(--grey-mid); margin-top: 4px; text-transform: uppercase; letter-spacing: .6px; font-weight: 500; }

  /* ── FILTER BAR ─────────────────────────────────────────── */
  .acm-filter-bar {
    display: flex; align-items: center; gap: 14px;
    background: var(--white); padding: 14px 20px;
    border-radius: 10px; box-shadow: var(--shadow-sm);
    margin-bottom: 24px; font-family: 'DM Sans', sans-serif;
  }
  .acm-filter-bar label { font-weight: 600; font-size: .88rem; color: var(--grey-dark); white-space: nowrap; }
  .acm-filter-select {
    padding: 8px 14px; border: 1.5px solid #cfd8dc; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .88rem;
    color: var(--grey-dark); background: var(--grey-light);
    cursor: pointer; outline: none; transition: border-color .2s;
  }
  .acm-filter-select:focus { border-color: var(--green-mid); background: #fff; }
  .acm-filter-count { margin-left: auto; font-size: .82rem; color: var(--grey-mid); font-weight: 500; }

  /* ── MESSAGE CARD ───────────────────────────────────────── */
  .acm-card {
    background: var(--white); border-radius: var(--radius);
    padding: 24px 26px; margin-bottom: 18px;
    box-shadow: var(--shadow-sm); border: 1.5px solid #e0e7ef;
    transition: box-shadow .22s, border-color .22s, transform .22s;
    font-family: 'DM Sans', sans-serif; position: relative; overflow: hidden;
  }
  .acm-card::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 4px; height: 100%; background: var(--green-mid);
    border-radius: 4px 0 0 4px; opacity: 0; transition: opacity .2s;
  }
  .acm-card:hover { box-shadow: var(--shadow-md); border-color: #b2dfdb; transform: translateY(-2px); }
  .acm-card:hover::before { opacity: 1; }
  .acm-card.unread { background: #f9fffe; border-color: #b2dfdb; }
  .acm-card.unread::before { opacity: 1; }
  .acm-card.replied, .acm-card.conversation { cursor: pointer; }
  .acm-card.replied::before, .acm-card.conversation::before { background: var(--amber); }
  .acm-card-click-hint {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: .72rem; color: #90a4ae; font-style: italic; margin-top: 4px;
  }

  .acm-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .acm-sender-name { font-size: 1.1rem; font-weight: 700; color: var(--grey-dark); margin: 0 0 4px; font-family: 'Playfair Display', serif; }
  .acm-sender-email { font-size: .82rem; color: var(--grey-mid); margin: 0; display: flex; align-items: center; gap: 5px; }
  .acm-card-meta { text-align: right; }
  .acm-card-date { font-size: .74rem; color: #90a4ae; margin-top: 6px; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
  .acm-message-body { font-size: .93rem; line-height: 1.7; color: #546e7a; margin: 0 0 16px; white-space: pre-wrap; }

  /* ── STATUS BADGE ───────────────────────────────────────── */
  .acm-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 13px; border-radius: 50px;
    font-size: .7rem; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  }
  .acm-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .acm-badge.unread       { background: #ffebee; color: var(--red); }
  .acm-badge.unread       .acm-badge-dot { background: var(--red); }
  .acm-badge.read         { background: #e0f7fa; color: var(--teal); }
  .acm-badge.read         .acm-badge-dot { background: var(--teal); }
  .acm-badge.replied      { background: #e8f5e9; color: var(--green-mid); }
  .acm-badge.replied      .acm-badge-dot { background: var(--green-mid); }
  .acm-badge.conversation { background: #fff8e1; color: #f57f17; }
  .acm-badge.conversation .acm-badge-dot { background: var(--amber); }
  .acm-badge.archived     { background: #eceff1; color: var(--grey-mid); }
  .acm-badge.archived     .acm-badge-dot { background: var(--grey-mid); }

  /* ── REPLY PREVIEW ──────────────────────────────────────── */
  .acm-reply-preview {
    background: linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%);
    border: 1px solid #b3d4ff; border-radius: 10px;
    padding: 14px 18px; margin-bottom: 16px; font-size: .86rem;
  }
  .acm-reply-preview-label { font-weight: 700; color: #1976d2; font-size: .78rem; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .acm-reply-preview-text  { color: var(--grey-dark); margin: 0 0 4px; }
  .acm-reply-preview-date  { font-size: .73rem; color: #90a4ae; margin: 0; display: flex; align-items: center; gap: 4px; }
  .acm-user-replies-info   { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #b3d4ff; font-size: .8rem; color: var(--grey-mid); }

  /* ── ACTION BUTTONS ─────────────────────────────────────── */
  .acm-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
  .acm-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: .83rem; font-weight: 600;
    cursor: pointer; transition: all .18s; letter-spacing: .2px;
  }
  .acm-btn:active { transform: scale(.97); }
  .acm-btn-read:hover    { background: var(--teal); color: #fff; }
  .acm-btn-read          { background: #e0f7fa; color: var(--teal); }
  .acm-btn-view          { background: #fff8e1; color: #f57f17; }
  .acm-btn-view:hover    { background: var(--amber); color: #fff; }
  .acm-btn-reply         { background: var(--green-pale); color: var(--green-mid); }
  .acm-btn-reply:hover   { background: var(--green-mid); color: #fff; }
  .acm-btn-archive       { background: #eceff1; color: var(--grey-mid); }
  .acm-btn-archive:hover { background: var(--grey-mid); color: #fff; }
  .acm-btn-delete        { background: #ffebee; color: var(--red); }
  .acm-btn-delete:hover  { background: var(--red); color: #fff; }

  /* ── MODAL ──────────────────────────────────────────────── */
  .acm-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.65);
    backdrop-filter: blur(4px); display: flex; justify-content: center;
    align-items: center; z-index: 1000; padding: 20px;
  }
  .acm-modal {
    background: var(--white); border-radius: 18px;
    width: 100%; max-width: 640px; max-height: 90vh;
    overflow-y: auto; box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
  }
  .acm-modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 28px 0; position: sticky; top: 0; background: #fff;
    border-radius: 18px 18px 0 0; z-index: 1;
  }
  .acm-modal-title { font-family: 'Playfair Display', serif; font-size: 1.45rem; color: var(--grey-dark); margin: 0; }
  .acm-modal-close {
    width: 36px; height: 36px; border-radius: 50%;
    border: none; background: var(--grey-light); color: var(--grey-mid);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .18s;
  }
  .acm-modal-close:hover { background: #cfd8dc; }
  .acm-modal-divider { height: 2px; background: linear-gradient(90deg, var(--green-mid), var(--accent)); margin: 12px 28px 0; border-radius: 2px; }
  .acm-modal-body { padding: 20px 28px 28px; }

  .acm-original-box { background: var(--grey-light); border-radius: 10px; padding: 18px; margin-bottom: 20px; }
  .acm-original-box-label { font-size: .75rem; font-weight: 700; color: var(--green-mid); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .acm-original-box-text  { font-size: .93rem; line-height: 1.65; color: var(--grey-dark); white-space: pre-wrap; margin: 0; }
  .acm-textarea-label { font-size: .88rem; font-weight: 600; color: var(--grey-dark); display: block; margin-bottom: 8px; }
  .acm-textarea {
    width: 100%; padding: 13px 14px; border: 1.5px solid #cfd8dc;
    border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: .92rem; line-height: 1.6; resize: vertical; outline: none;
    transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
  }
  .acm-textarea:focus { border-color: var(--green-mid); box-shadow: 0 0 0 3px rgba(46,125,50,.12); }
  .acm-modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
  .acm-btn-cancel       { background: #eceff1; color: var(--grey-mid); }
  .acm-btn-cancel:hover { background: #cfd8dc; }
  .acm-btn-send         { background: var(--green-mid); color: #fff; }
  .acm-btn-send:hover   { background: var(--green-dark); }
  .acm-btn-send:disabled { opacity: .55; cursor: not-allowed; }

  /* ── CONVERSATION MODAL ─────────────────────────────────── */
  .acm-conv-modal {
    background: var(--white); border-radius: 18px;
    width: 100%; max-width: 820px; max-height: 92vh;
    overflow-y: auto; box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
  }
  .acm-conv-bubble { border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; font-size: .9rem; line-height: 1.65; }
  .acm-conv-bubble.user-msg  { background: #f5f5f5; }
  .acm-conv-bubble.admin-msg { background: #e3f2fd; margin-left: 40px; }
  .acm-conv-bubble-name      { font-weight: 700; font-size: .84rem; margin: 0 0 3px; }
  .acm-conv-bubble-name.admin { color: #1976d2; }
  .acm-conv-bubble-sub       { font-size: .75rem; color: #90a4ae; margin: 0; }
  .acm-conv-bubble-header    { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .acm-conv-bubble-date      { font-size: .73rem; color: #90a4ae; display: flex; align-items: center; gap: 4px; }
  .acm-conv-bubble-text      { margin: 0; white-space: pre-wrap; color: var(--grey-dark); }
  .acm-admin-reply-nested    { background: #e3f2fd; border-radius: 8px; padding: 13px 15px; margin-top: 10px; margin-left: 20px; font-size: .84rem; }
  .acm-inline-reply-box      { margin-top: 20px; padding: 18px 20px; background: var(--grey-light); border-radius: 10px; border-left: 4px solid var(--green-mid); }

  /* ── NOTIFICATION ───────────────────────────────────────── */
  .acm-notification {
    position: fixed; top: 22px; right: 22px; padding: 13px 22px;
    border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: .9rem; font-weight: 600; box-shadow: var(--shadow-md);
    z-index: 2000; display: flex; align-items: center; gap: 8px;
    animation: slideIn .3s ease;
  }
  .acm-notification.success { background: var(--green-mid); color: #fff; }
  .acm-notification.error   { background: var(--red); color: #fff; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

  /* ── EMPTY / LOADING ────────────────────────────────────── */
  .acm-empty { text-align: center; padding: 60px 20px; font-family: 'DM Sans', sans-serif; color: var(--grey-mid); }
  .acm-empty-icon { margin-bottom: 16px; display: flex; justify-content: center; opacity: .35; }
  .acm-empty-text { font-size: 1rem; }
`;

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedReply, setSelectedReply] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [viewingConversation, setViewingConversation] = useState(false);
  const [conversationMessage, setConversationMessage] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [exportingPdf, setExportingPdf] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => { fetchMessages(); }, [filter]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/admin/login'); return; }
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/v1/contact/admin`);
      if (response.data.success) {
        let filteredMessages = response.data.data;
        if (filter !== 'all') filteredMessages = filteredMessages.filter(msg => msg.status === filter);
        setMessages(filteredMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
    } finally { setLoading(false); }
  };

  const replyToUserMessage = async (messageId, userReplyId, replyText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/contact/admin/${messageId}/reply-to-user`,
        { userReplyId, replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) { fetchMessages(); return true; }
    } catch (error) { console.error('Error replying to user message:', error); }
    return false;
  };

  const handleReplyToUser = async () => {
    if (!selectedReply || !replyText.trim()) { showNotification('Please enter a reply message', 'error'); return; }
    setReplying(true);
    const success = await replyToUserMessage(selectedReply.messageId, selectedReply.userReplyId, replyText);
    if (success) {
      showNotification('Reply sent successfully');
      setSelectedReply(null); setReplyText('');
      if (viewingConversation) { setViewingConversation(false); setConversationMessage(null); }
    } else { showNotification('Failed to send reply', 'error'); }
    setReplying(false);
  };

  const updateMessageStatus = async (messageId, status, reply = '', isConversation = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/contact/admin/${messageId}/status`,
        { status, reply, isConversation },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) { fetchMessages(); return true; }
    } catch (error) { console.error('Error updating message status:', error); }
    return false;
  };

  const handleMarkAsRead    = async (messageId) => { const s = await updateMessageStatus(messageId, 'read');     if (s) showNotification('Message marked as read'); };
  const handleArchiveMessage = async (messageId) => { const s = await updateMessageStatus(messageId, 'archived'); if (s) showNotification('Message archived'); };

  const handleFirstTimeReply = async () => {
    if (!selectedMessage || !replyText.trim()) { showNotification('Please enter a reply message', 'error'); return; }
    setReplying(true);
    const success = await updateMessageStatus(selectedMessage._id, 'replied', replyText);
    if (success) { showNotification('Reply sent successfully'); setSelectedMessage(null); setReplyText(''); }
    else showNotification('Failed to send reply', 'error');
    setReplying(false);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/contact/admin/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) { showNotification('Message deleted successfully'); fetchMessages(); }
    } catch (error) { console.error('Error deleting message:', error); showNotification('Failed to delete message', 'error'); }
  };

  const handleViewConversation  = (message) => { setConversationMessage(message); setViewingConversation(true); };
  const handleReplyToUserReply  = (messageId, userReplyId, userName) => setSelectedReply({ messageId, userReplyId, userName });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleExportPdf = () => {
    if (!messages.length) {
      showNotification('No messages to export', 'error');
      return;
    }

    try {
      setExportingPdf(true);
      const now = new Date();
      exportRowsToPdf({
        title: 'RubberSense - Contact Inquiries',
        subtitleLines: [
          `Generated: ${now.toLocaleString()}`,
          `Filter: ${filter} | Records: ${messages.length}`,
        ],
        headers: ['Name', 'Email', 'Status', 'Date', 'Message', 'Admin Reply', 'User Replies'],
        rows: messages.map((message) => [
          message.name || 'N/A',
          message.email || 'N/A',
          message.status || 'unknown',
          formatDate(message.createdAt),
          message.message || 'N/A',
          message.reply || 'N/A',
          message.userReplies?.length || 0,
        ]),
        fileName: `contact-inquiries-${now.toISOString().slice(0, 10)}.pdf`,
      });
      showNotification('Messages exported to PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      showNotification('Failed to export PDF', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  const allCount    = messages.length;
  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const readCount   = messages.filter(m => m.status === 'read').length;

  const statItems = [
    { key: 'all',    IconComp: Icon.Inbox,       colorClass: 'all',    label: 'All Messages', count: allCount },
    { key: 'unread', IconComp: Icon.MailUnread,   colorClass: 'unread', label: 'Unread',       count: unreadCount },
    { key: 'read',   IconComp: Icon.MailRead,     colorClass: 'read',   label: 'Read',         count: readCount },
  ];

  const renderConversationView = () => {
    if (!conversationMessage) return null;
    return (
      <div className="acm-modal-overlay" style={{ zIndex: 2000 }}>
        <div className="acm-conv-modal">
          <div className="acm-modal-header">
            <h2 className="acm-modal-title">Conversation with {conversationMessage.name}</h2>
            <button className="acm-modal-close" onClick={() => { setViewingConversation(false); setConversationMessage(null); }}>
              <Icon.X size={16} />
            </button>
          </div>
          <div className="acm-modal-divider" />
          <div className="acm-modal-body">
            {/* Original message */}
            <div className="acm-conv-bubble user-msg">
              <div className="acm-conv-bubble-header">
                <div>
                  <p className="acm-conv-bubble-name">{conversationMessage.name}</p>
                  <p className="acm-conv-bubble-sub">{conversationMessage.email}</p>
                </div>
                <span className="acm-conv-bubble-date"><Icon.Clock size={12} /> {formatDate(conversationMessage.createdAt)}</span>
              </div>
              <p className="acm-conv-bubble-text">{conversationMessage.message}</p>
            </div>

            {/* Admin first reply */}
            {conversationMessage.reply && (
              <div className="acm-conv-bubble admin-msg">
                <div className="acm-conv-bubble-header">
                  <div>
                    <p className="acm-conv-bubble-name admin">Admin Reply</p>
                    <p className="acm-conv-bubble-sub">You</p>
                  </div>
                  <span className="acm-conv-bubble-date"><Icon.Clock size={12} /> {formatDate(conversationMessage.repliedAt)}</span>
                </div>
                <p className="acm-conv-bubble-text">{conversationMessage.reply}</p>
              </div>
            )}

            {/* User replies */}
            {conversationMessage.userReplies && conversationMessage.userReplies.map((userReply, index) => (
              <div key={index} className="acm-conv-bubble user-msg">
                <div className="acm-conv-bubble-header">
                  <div>
                    <p className="acm-conv-bubble-name">{conversationMessage.name}</p>
                    <p className="acm-conv-bubble-sub">{conversationMessage.email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="acm-conv-bubble-date"><Icon.Clock size={12} /> {formatDate(userReply.date)}</span>
                    <button
                      className="acm-btn acm-btn-reply"
                      style={{ padding: '5px 12px', fontSize: '.75rem' }}
                      onClick={() => handleReplyToUserReply(conversationMessage._id, userReply._id || index, conversationMessage.name)}
                    >
                      <Icon.Reply size={13} /> Reply
                    </button>
                  </div>
                </div>
                <p className="acm-conv-bubble-text">{userReply.text}</p>

                {userReply.adminReplies && userReply.adminReplies.length > 0 && userReply.adminReplies.map((adminReply, ai) => (
                  <div key={ai} className="acm-admin-reply-nested">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#1976d2', fontSize: '.8rem' }}>Admin Reply</p>
                        <p style={{ margin: 0, color: '#90a4ae', fontSize: '.72rem' }}>You</p>
                      </div>
                      <span style={{ fontSize: '.72rem', color: '#90a4ae', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Icon.Clock size={11} /> {formatDate(adminReply.date)}
                      </span>
                    </div>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '.84rem', color: '#37474f' }}>{adminReply.text}</p>
                  </div>
                ))}
              </div>
            ))}

            {/* Inline reply form */}
            {selectedReply && selectedReply.messageId === conversationMessage._id && (
              <div className="acm-inline-reply-box">
                <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#37474f', fontSize: '.9rem' }}>
                  Replying to {selectedReply.userName}
                </p>
                <textarea className="acm-textarea" rows="4" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply here..." />
                <div className="acm-modal-footer">
                  <button className="acm-btn acm-btn-cancel" disabled={replying} onClick={() => { setSelectedReply(null); setReplyText(''); }}>Cancel</button>
                  <button className="acm-btn acm-btn-send" disabled={replying} onClick={handleReplyToUser}>
                    <Icon.Send size={14} /> {replying ? 'Sending…' : 'Send Reply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div style={{ display: 'flex' }}>
        <LeftNavigationBar />

        <div style={{ marginLeft: 250, padding: '28px 32px', width: 'calc(100% - 250px)', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>

          {/* Notification */}
          {notification.show && (
            <div className={`acm-notification ${notification.type}`}>
              {notification.type === 'success' ? <Icon.Check size={15} /> : <Icon.X size={15} />}
              {notification.message}
            </div>
          )}

          {/* Hero Banner */}
          <div className="acm-hero">
            <img className="acm-hero-img" src="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1200&q=80" alt="Contact messages" />
            <div className="acm-hero-overlay" />
            <div className="acm-hero-content">
              <h1 className="acm-hero-title">Contact Messages</h1>
              <p className="acm-hero-sub">Manage and respond to customer inquiries</p>
            </div>
            <div className="acm-hero-badge">
              <Icon.Inbox size={16} /> Inbox
            </div>
          </div>

          {/* Stats Row — All / Unread / Read */}
          <div className="acm-stats">
            {statItems.map(({ key, IconComp, colorClass, label, count }) => (
              <div key={key} className={`acm-stat-card${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>
                <div className={`acm-stat-icon-wrap ${colorClass}`}>
                  <IconComp size={24} />
                </div>
                <div className="acm-stat-info">
                  <div className="acm-stat-count">{count}</div>
                  <div className="acm-stat-label">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="acm-filter-bar">
            <label htmlFor="statusFilter">Filter by status:</label>
            <select id="statusFilter" className="acm-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <button
              className="acm-btn acm-btn-read"
              style={{ marginLeft: 8, opacity: loading || exportingPdf || messages.length === 0 ? 0.6 : 1 }}
              onClick={handleExportPdf}
              disabled={loading || exportingPdf || messages.length === 0}
            >
              <Icon.Download size={13} /> {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </button>
            <span className="acm-filter-count">Showing {messages.length} message{messages.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Messages */}
          {loading ? (
            <div className="acm-empty">
              <div className="acm-empty-icon"><Icon.Inbox size={52} /></div>
              <p className="acm-empty-text">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="acm-empty">
              <div className="acm-empty-icon"><Icon.Mail size={52} /></div>
              <p className="acm-empty-text">No messages found.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`acm-card ${message.status}`}
                style={{ cursor: (message.status === 'replied' || message.status === 'conversation') ? 'pointer' : 'default' }}
                onClick={() => { if (message.status === 'replied' || message.status === 'conversation') handleViewConversation(message); }}
              >
                <div className="acm-card-header">
                  <div>
                    <h3 className="acm-sender-name">{message.name}</h3>
                    <p className="acm-sender-email"><Icon.Mail size={13} /> {message.email}</p>
                  </div>
                  <div className="acm-card-meta">
                    <span className={`acm-badge ${message.status}`}>
                      <span className="acm-badge-dot" />
                      {message.status.toUpperCase()}
                      {message.userReplies && message.userReplies.length > 0 && ` (${message.userReplies.length})`}
                    </span>
                    <p className="acm-card-date"><Icon.Clock size={12} /> {formatDate(message.createdAt)}</p>
                    {(message.status === 'replied' || message.status === 'conversation') && (
                      <p className="acm-card-click-hint"><Icon.Chat size={11} /> Click to view conversation</p>
                    )}
                  </div>
                </div>

                <p className="acm-message-body">{message.message}</p>

                {message.reply && (
                  <div className="acm-reply-preview">
                    <p className="acm-reply-preview-label"><Icon.MessageSquare size={12} /> Admin Reply</p>
                    <p className="acm-reply-preview-text">{message.reply.substring(0, 120)}…</p>
                    <p className="acm-reply-preview-date"><Icon.Clock size={11} /> {formatDate(message.repliedAt)}</p>
                    {message.userReplies && message.userReplies.length > 0 && (
                      <div className="acm-user-replies-info">
                        <strong>User replied {message.userReplies.length} time(s)</strong>
                        <span> · Last: {formatDate(message.userReplies[message.userReplies.length - 1].date)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="acm-actions">
                  {message.status !== 'read' && message.status !== 'archived' && (
                    <button className="acm-btn acm-btn-read" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(message._id); }}>
                      <Icon.Eye size={15} /> Mark as Read
                    </button>
                  )}
                  {(message.status !== 'replied' && message.status !== 'conversation' && message.status !== 'archived') && (
                    <button className="acm-btn acm-btn-reply" onClick={(e) => { e.stopPropagation(); setSelectedMessage(message); }}>
                      <Icon.Reply size={15} /> Reply
                    </button>
                  )}
                  <button className="acm-btn acm-btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message._id); }}>
                    <Icon.Trash size={15} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}

          {/* First-time Reply Modal */}
          {selectedMessage && (
            <div className="acm-modal-overlay">
              <div className="acm-modal">
                <div className="acm-modal-header">
                  <h2 className="acm-modal-title">Reply to {selectedMessage.name}</h2>
                  <button className="acm-modal-close" onClick={() => { setSelectedMessage(null); setReplyText(''); }}><Icon.X size={16} /></button>
                </div>
                <div className="acm-modal-divider" />
                <div className="acm-modal-body">
                  <div className="acm-original-box">
                    <p className="acm-original-box-label"><Icon.Mail size={13} /> Original Message</p>
                    <p className="acm-original-box-text">{selectedMessage.message}</p>
                  </div>
                  <label className="acm-textarea-label" htmlFor="replyText">Your Reply:</label>
                  <textarea id="replyText" className="acm-textarea" rows="6" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply here…" />
                  <div className="acm-modal-footer">
                    <button className="acm-btn acm-btn-cancel" disabled={replying} onClick={() => { setSelectedMessage(null); setReplyText(''); }}>Cancel</button>
                    <button className="acm-btn acm-btn-send" disabled={replying} onClick={handleFirstTimeReply}>
                      <Icon.Send size={14} /> {replying ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reply to specific user reply modal */}
          {selectedReply && !viewingConversation && !selectedMessage && (
            <div className="acm-modal-overlay">
              <div className="acm-modal">
                <div className="acm-modal-header">
                  <h2 className="acm-modal-title">Reply to {selectedReply.userName}</h2>
                  <button className="acm-modal-close" onClick={() => { setSelectedReply(null); setReplyText(''); }}><Icon.X size={16} /></button>
                </div>
                <div className="acm-modal-divider" />
                <div className="acm-modal-body">
                  <label className="acm-textarea-label" htmlFor="replyText2">Your Reply:</label>
                  <textarea id="replyText2" className="acm-textarea" rows="6" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply here…" />
                  <div className="acm-modal-footer">
                    <button className="acm-btn acm-btn-cancel" disabled={replying} onClick={() => { setSelectedReply(null); setReplyText(''); }}>Cancel</button>
                    <button className="acm-btn acm-btn-send" disabled={replying} onClick={handleReplyToUser}>
                      <Icon.Send size={14} /> {replying ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation View */}
          {viewingConversation && renderConversationView()}
        </div>
      </div>
    </>
  );
};

export default AdminContactMessages;
