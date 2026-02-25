import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Logo from '../logo/LOGO.png';

const ChatbotWidget = ({ isOpen, onClose, sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [user, setUser] = useState(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const widgetSessionId = useRef(
    sessionId || `rubber-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ─── CSS ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'rs-styles-v2';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

      @keyframes rs-up   { from{transform:translateY(24px) scale(.97);opacity:0} to{transform:none;opacity:1} }
      @keyframes rs-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      @keyframes rs-ring { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.7);opacity:0} }
      @keyframes rs-blink{ 0%,80%,100%{transform:scale(.55);opacity:.35} 40%{transform:scale(1);opacity:1} }
      @keyframes rs-float{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      @keyframes rs-glow { 0%,100%{box-shadow:0 0 18px rgba(74,181,74,.28),0 8px 28px rgba(0,0,0,.4)} 50%{box-shadow:0 0 34px rgba(74,181,74,.52),0 12px 34px rgba(0,0,0,.5)} }

      /* shell */
      .rs-w {
        position:fixed; bottom:24px; right:24px;
        width:382px; height:608px;
        display:flex; flex-direction:column;
        z-index:9999;
        animation:rs-up .38s cubic-bezier(.16,1,.3,1);
        font-family:'DM Sans',sans-serif;
      }

      .rs-inner {
        width:100%; height:100%;
        display:flex; flex-direction:column;
        border-radius:24px; overflow:hidden;
        transition:background .3s,border-color .3s,box-shadow .3s;
      }
      .rs-inner.dark {
        background:#0d1117;
        border:1px solid rgba(255,255,255,.07);
        box-shadow:0 32px 80px rgba(0,0,0,.58),0 0 0 1px rgba(74,181,74,.07),inset 0 1px 0 rgba(255,255,255,.04);
      }
      .rs-inner.light {
        background:#f5faf5;
        border:1px solid rgba(45,106,79,.1);
        box-shadow:0 20px 60px rgba(0,0,0,.1),0 0 0 1px rgba(45,106,79,.06);
      }

      /* header */
      .rs-header {
        padding:14px 16px;
        display:flex; align-items:center; justify-content:space-between;
        flex-shrink:0; position:relative; overflow:hidden;
        transition:background .3s,border-color .3s;
      }
      .rs-inner.dark .rs-header  { background:linear-gradient(135deg,#0a1f0a,#112211); border-bottom:1px solid rgba(255,255,255,.05); }
      .rs-inner.light .rs-header { background:linear-gradient(135deg,#e9f5ea,#f2faf2); border-bottom:1px solid rgba(45,106,79,.09); }
      .rs-header::before {
        content:''; position:absolute; inset:0; pointer-events:none;
        background:radial-gradient(ellipse at top left, rgba(74,181,74,.07) 0%, transparent 65%);
      }

      .rs-header-left { display:flex; align-items:center; gap:11px; }

      /* logo box */
      .rs-logo-wrap { position:relative; width:40px; height:40px; flex-shrink:0; }
      .rs-logo-box {
        width:40px; height:40px; border-radius:13px; overflow:hidden;
        display:flex; align-items:center; justify-content:center;
        border:1.5px solid rgba(74,181,74,.28); transition:background .3s;
      }
      .rs-inner.dark  .rs-logo-box { background:linear-gradient(135deg,#1a4a1a,#2d6a4f); }
      .rs-inner.light .rs-logo-box { background:linear-gradient(135deg,#d1fae5,#a7f3d0); }
      .rs-logo-box img { width:26px; height:26px; object-fit:contain; }

      .rs-dot {
        position:absolute; bottom:-2px; right:-2px;
        width:11px; height:11px; border-radius:50%;
        background:#4ade80; z-index:2; transition:border-color .3s;
        border:2px solid;
      }
      .rs-inner.dark  .rs-dot { border-color:#0d1117; }
      .rs-inner.light .rs-dot { border-color:#f5faf5; }
      .rs-dot::after {
        content:''; position:absolute; inset:-3px; border-radius:50%;
        background:#4ade80; animation:rs-ring 2s ease-out infinite;
      }

      .rs-header-info h3 {
        margin:0; font-family:'Syne',sans-serif; font-size:14.5px; font-weight:700;
        letter-spacing:-.02em; transition:color .3s;
      }
      .rs-inner.dark  .rs-header-info h3 { color:#e8f5e8; }
      .rs-inner.light .rs-header-info h3 { color:#1b4332; }
      .rs-sub { font-size:10.5px; margin-top:2px; transition:color .3s; }
      .rs-inner.dark  .rs-sub { color:rgba(255,255,255,.3); }
      .rs-inner.light .rs-sub { color:rgba(27,67,50,.42); }

      /* icon buttons */
      .rs-actions { display:flex; align-items:center; gap:5px; }
      .rs-ibtn {
        width:32px; height:32px; border-radius:10px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        border:1px solid; background:none; transition:all .2s;
      }
      .rs-inner.dark  .rs-ibtn { border-color:rgba(255,255,255,.07); color:rgba(255,255,255,.42); }
      .rs-inner.light .rs-ibtn { border-color:rgba(0,0,0,.08); color:rgba(27,67,50,.46); }
      .rs-inner.dark  .rs-ibtn:hover { background:rgba(255,255,255,.09); color:rgba(255,255,255,.9); border-color:rgba(255,255,255,.13); }
      .rs-inner.light .rs-ibtn:hover { background:rgba(45,106,79,.07); color:#1b4332; border-color:rgba(45,106,79,.18); }
      .rs-ibtn.danger:hover { background:rgba(239,68,68,.11)!important; color:#f87171!important; border-color:rgba(239,68,68,.22)!important; }

      /* error */
      .rs-err {
        padding:7px 15px; font-size:11px; color:#f87171; flex-shrink:0;
        display:flex; align-items:center; gap:6px;
        background:rgba(239,68,68,.07); border-bottom:1px solid rgba(239,68,68,.13);
      }

      /* messages */
      .rs-msgs {
        flex:1; overflow-y:auto; padding:18px 14px;
        display:flex; flex-direction:column; gap:14px;
        transition:background .3s; scrollbar-width:thin;
      }
      .rs-inner.dark  .rs-msgs { background:#0d1117; scrollbar-color:rgba(255,255,255,.06) transparent; }
      .rs-inner.light .rs-msgs { background:#f5faf5; scrollbar-color:rgba(0,0,0,.07) transparent; }
      .rs-msgs::-webkit-scrollbar { width:4px; }
      .rs-msgs::-webkit-scrollbar-thumb { border-radius:4px; }
      .rs-inner.dark  .rs-msgs::-webkit-scrollbar-thumb { background:rgba(255,255,255,.06); }
      .rs-inner.light .rs-msgs::-webkit-scrollbar-thumb { background:rgba(0,0,0,.07); }

      .rs-row { display:flex; align-items:flex-end; gap:8px; animation:rs-in .28s ease; }
      .rs-row.user { flex-direction:row-reverse; }

      /* bot icon in messages */
      .rs-bot-ico {
        width:28px; height:28px; border-radius:9px; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        overflow:hidden; border:1px solid rgba(74,181,74,.2); transition:background .3s;
      }
      .rs-inner.dark  .rs-bot-ico { background:linear-gradient(135deg,#1a4a1a,#2d6a4f); }
      .rs-inner.light .rs-bot-ico { background:linear-gradient(135deg,#d1fae5,#a7f3d0); }
      .rs-bot-ico img { width:18px; height:18px; object-fit:contain; }

      /* user avatar */
      .rs-uavatar {
        width:28px; height:28px; border-radius:9px; flex-shrink:0;
        overflow:hidden; border:1.5px solid; transition:border-color .3s;
      }
      .rs-inner.dark  .rs-uavatar { border-color:rgba(255,255,255,.1); }
      .rs-inner.light .rs-uavatar { border-color:rgba(45,106,79,.2); }
      .rs-uavatar img { width:100%; height:100%; object-fit:cover; display:block; }

      .rs-bwrap { max-width:73%; display:flex; flex-direction:column; gap:3px; }
      .rs-row.user .rs-bwrap { align-items:flex-end; }

      .rs-bubble {
        padding:10px 14px; border-radius:18px; border:1px solid;
        font-size:13.5px; line-height:1.65; word-wrap:break-word; white-space:pre-line;
        transition:background .3s,color .3s,border-color .3s;
      }
      .rs-bubble.bot  { border-bottom-left-radius:5px; }
      .rs-bubble.user { border-bottom-right-radius:5px; }
      .rs-inner.dark  .rs-bubble.bot  { background:#161d16; border-color:rgba(255,255,255,.06); color:rgba(255,255,255,.86); }
      .rs-inner.light .rs-bubble.bot  { background:#ffffff; border-color:rgba(45,106,79,.11); color:#1b4332; }
      .rs-inner.dark  .rs-bubble.user { background:linear-gradient(135deg,#166534,#15803d); border-color:rgba(74,181,74,.24); color:#dcfce7; }
      .rs-inner.light .rs-bubble.user { background:linear-gradient(135deg,#2d6a4f,#40916c); border-color:rgba(45,106,79,.28); color:#f0fdf4; }
      .rs-bubble.err  { background:rgba(239,68,68,.07)!important; border-color:rgba(239,68,68,.18)!important; color:#fca5a5!important; }

      .rs-time { font-size:10px; padding:0 3px; transition:color .3s; }
      .rs-inner.dark  .rs-time { color:rgba(255,255,255,.18); }
      .rs-inner.light .rs-time { color:rgba(0,0,0,.25); }

      .rs-divider { display:flex; align-items:center; gap:10px; margin:2px 0; }
      .rs-divider span { font-size:10px; font-weight:500; letter-spacing:.05em; text-transform:uppercase; white-space:nowrap; transition:color .3s; }
      .rs-inner.dark  .rs-divider span { color:rgba(255,255,255,.17); }
      .rs-inner.light .rs-divider span { color:rgba(0,0,0,.26); }
      .rs-divider::before,.rs-divider::after { content:''; flex:1; height:1px; transition:background .3s; }
      .rs-inner.dark  .rs-divider::before,.rs-inner.dark  .rs-divider::after { background:rgba(255,255,255,.05); }
      .rs-inner.light .rs-divider::before,.rs-inner.light .rs-divider::after { background:rgba(0,0,0,.07); }

      /* typing */
      .rs-typing { display:flex; gap:4px; align-items:center; padding:3px 0; }
      .rs-typing span { width:6px; height:6px; border-radius:50%; display:inline-block; animation:rs-blink 1.2s infinite ease-in-out; }
      .rs-inner.dark  .rs-typing span { background:#4ade80; }
      .rs-inner.light .rs-typing span { background:#2d6a4f; }
      .rs-typing span:nth-child(2){animation-delay:.2s}
      .rs-typing span:nth-child(3){animation-delay:.4s}

      /* chips */
      .rs-chips-wrap {
        flex-shrink:0; border-top:1px solid; transition:background .3s,border-color .3s;
      }
      .rs-inner.dark  .rs-chips-wrap { background:#0d1117; border-color:rgba(255,255,255,.04); }
      .rs-inner.light .rs-chips-wrap { background:#f5faf5; border-color:rgba(45,106,79,.07); }

      .rs-chips {
        display:flex; flex-wrap:wrap; gap:7px; padding:10px 14px;
      }

      .rs-chip {
        padding:6px 12px; border-radius:20px; border:1px solid;
        font-size:11.5px; cursor:pointer; transition:all .2s; white-space:nowrap;
        font-family:'DM Sans',sans-serif;
      }
      .rs-inner.dark  .rs-chip { background:rgba(255,255,255,.04); border-color:rgba(255,255,255,.08); color:rgba(255,255,255,.52); }
      .rs-inner.light .rs-chip { background:rgba(45,106,79,.05); border-color:rgba(45,106,79,.13); color:rgba(27,67,50,.62); }
      .rs-inner.dark  .rs-chip:hover:not(:disabled) { background:rgba(74,181,74,.1); border-color:rgba(74,181,74,.3); color:#86efac; }
      .rs-inner.light .rs-chip:hover:not(:disabled) { background:rgba(45,106,79,.1); border-color:rgba(45,106,79,.28); color:#1b4332; }
      .rs-chip:disabled { opacity:.38; cursor:not-allowed; }

      /* input */
      .rs-input-area {
        padding:11px 14px 15px; flex-shrink:0; border-top:1px solid;
        transition:background .3s,border-color .3s;
      }
      .rs-inner.dark  .rs-input-area { background:#0d1117; border-color:rgba(255,255,255,.04); }
      .rs-inner.light .rs-input-area { background:#f5faf5; border-color:rgba(45,106,79,.07); }

      .rs-input-row {
        display:flex; align-items:flex-end; gap:9px;
        border-radius:16px; padding:9px 9px 9px 15px; border:1px solid;
        transition:all .3s;
      }
      .rs-inner.dark  .rs-input-row { background:#161d16; border-color:rgba(255,255,255,.07); }
      .rs-inner.light .rs-input-row { background:#ffffff; border-color:rgba(45,106,79,.13); }
      .rs-inner.dark  .rs-input-row:focus-within { border-color:rgba(74,181,74,.36); box-shadow:0 0 0 3px rgba(74,181,74,.06); }
      .rs-inner.light .rs-input-row:focus-within { border-color:rgba(45,106,79,.4); box-shadow:0 0 0 3px rgba(45,106,79,.06); }

      .rs-textarea {
        flex:1; background:none; border:none; outline:none; resize:none;
        font-size:13.5px; font-family:'DM Sans',sans-serif; line-height:1.5;
        max-height:90px; transition:color .3s;
      }
      .rs-inner.dark  .rs-textarea { color:rgba(255,255,255,.84); }
      .rs-inner.light .rs-textarea { color:#1b4332; }
      .rs-inner.dark  .rs-textarea::placeholder { color:rgba(255,255,255,.22); }
      .rs-inner.light .rs-textarea::placeholder { color:rgba(27,67,50,.33); }

      .rs-send {
        width:34px; height:34px; border-radius:11px; border:none;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        flex-shrink:0; transition:all .2s;
        background:linear-gradient(135deg,#166534,#15803d);
      }
      .rs-send svg { display:block; stroke:#ffffff !important; color:#ffffff !important; }
      .rs-send:hover:not(:disabled) { background:linear-gradient(135deg,#15803d,#16a34a); transform:scale(1.06); }
      .rs-send:disabled { background:rgba(100,100,100,.15); cursor:not-allowed; transform:none; }
      .rs-send:disabled svg { stroke:rgba(130,130,130,.5) !important; }

      /* chat head */
      .rs-head {
        position:fixed; bottom:24px; right:24px;
        width:58px; height:58px; border-radius:18px;
        background:linear-gradient(135deg,#0a1f0a,#166534);
        border:1.5px solid rgba(74,181,74,.24);
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; z-index:9999; overflow:hidden;
        transition:all .22s cubic-bezier(.34,1.56,.64,1);
        animation:rs-float 4s ease-in-out infinite, rs-glow 3.5s ease-in-out infinite;
      }
      .rs-head img { width:34px; height:34px; object-fit:contain; }
      .rs-head:hover { transform:scale(1.1) rotate(-4deg); }
    `;
    if (!document.getElementById('rs-styles-v2')) document.head.appendChild(el);
    return () => { const s = document.getElementById('rs-styles-v2'); if (s) s.remove(); };
  }, []);

  // ─── data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) { fetchUserProfile(); checkApiHealth(); }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setIsFetchingUser(true);
    const token = localStorage.getItem('token');
    if (!token) { setIsFetchingUser(false); return; }
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
      if (res.data.success) setUser(res.data.user);
    } catch (e) { console.error('Profile fetch:', e); }
    finally { setIsFetchingUser(false); }
  };

  const checkApiHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/groqchatbot/health`);
      const data = await res.json();
      setConnectionError(data.groqInitialized ? null : 'Chatbot service is not properly configured');
    } catch {
      setConnectionError('Cannot connect to chatbot service');
    }
  };

  // ─── welcome message ──────────────────────────────────────────────────────────
  const buildWelcome = (u) => {
    const first = u?.name?.split(' ')[0] || null;
    return `Hey${first ? ` ${first}` : ''}! 👋\n\nI'm **RubberSense AI** — your plantation intelligence assistant. Ask me anything about rubber tree farming, and I'll give you expert advice.\n\nWhat's on your mind today?`;
  };

  useEffect(() => {
    if (isOpen && messages.length === 0 && !isFetchingUser) {
      setMessages([{ id: Date.now(), text: buildWelcome(user), sender: 'bot', timestamp: new Date() }]);
    }
  }, [isOpen, user, isFetchingUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── send ─────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMsg = { id: Date.now(), text: inputMessage, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setConnectionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/groqchatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: widgetSessionId.current,
          userContext: user ? { name: user.name, location: user.address, contact: user.contact } : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.success) {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: data.response, sender: 'bot', timestamp: new Date() }]);
      } else throw new Error(data.error || 'Unknown error');
    } catch (err) {
      let txt = "Sorry, I'm having trouble connecting. ";
      if (err.message.includes('Failed to fetch')) txt += "Please check if the server is running.";
      else if (err.message.includes('500')) txt += "Server error — please try again.";
      else txt += err.message;
      setMessages(prev => [...prev, { id: Date.now() + 1, text: txt, sender: 'bot', timestamp: new Date(), isError: true }]);
    } finally { setIsLoading(false); }
  };

  // ─── clear ────────────────────────────────────────────────────────────────────
  const handleClearChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/groqchatbot/chat/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({ sessionId: widgetSessionId.current })
      });
    } catch (e) { console.error(e); }
    setMessages([{ id: Date.now(), text: buildWelcome(user), sender: 'bot', timestamp: new Date() }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Resolve user avatar — prefers uploaded photo, falls back to initials avatar
  const avatarSrc = user?.avatar?.url
    || (user?.name
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=56&background=166534&color=fff&bold=true`
      : null);

  // Chips — no emojis, text only
  const chips = [
    'Best time for tapping?',
    'White root disease',
    'Increase latex yield',
    'Tapping frequency',
    'Fertilizer schedule',
    'Weather impact',
  ];

  const theme = isDark ? 'dark' : 'light';

  // ─── Closed state (chat head) ─────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className="rs-head" onClick={onClose} title="Open RubberSense AI">
        <img src={Logo} alt="RubberSense AI" />
      </div>
    );
  }

  // ─── Open widget ──────────────────────────────────────────────────────────────
  return (
    <div className="rs-w">
      <div className={`rs-inner ${theme}`}>

        {/* ── HEADER ── */}
        <div className="rs-header">
          <div className="rs-header-left">
            <div className="rs-logo-wrap">
              <div className="rs-logo-box">
                <img src={Logo} alt="RubberSense" />
              </div>
              <div className="rs-dot" />
            </div>
            <div className="rs-header-info">
              <h3>RubberSense AI</h3>
              <div className="rs-sub">AI Assistance</div>
            </div>
          </div>

          <div className="rs-actions">
            {/* Clear chat */}
            <button className="rs-ibtn" onClick={handleClearChat} title="Clear chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>

            {/* Dark / Light */}
            <button className="rs-ibtn" onClick={() => setIsDark(p => !p)} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
                </svg>
              )}
            </button>

            {/* Close */}
            <button className="rs-ibtn danger" onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Error */}
        {connectionError && (
          <div className="rs-err">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zm-1 5v5h2v-5h-2zm0 6v2h2v-2h-2z"/>
            </svg>
            {connectionError}
          </div>
        )}

        {/* ── MESSAGES ── */}
        <div className="rs-msgs">
          <div className="rs-divider"><span>Today</span></div>

          {messages.map(msg => (
            <div key={msg.id} className={`rs-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="rs-bot-ico">
                  <img src={Logo} alt="bot" />
                </div>
              )}

              <div className="rs-bwrap">
                <div className={`rs-bubble ${msg.sender}${msg.isError ? ' err' : ''}`}>
                  {msg.text}
                </div>
                <span className="rs-time">{formatTime(msg.timestamp)}</span>
              </div>

              {msg.sender === 'user' && avatarSrc && (
                <div className="rs-uavatar">
                  <img src={avatarSrc} alt="You" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="rs-row bot">
              <div className="rs-bot-ico"><img src={Logo} alt="bot" /></div>
              <div className="rs-bwrap">
                <div className="rs-bubble bot">
                  <div className="rs-typing"><span/><span/><span/></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── CHIPS — wrapped grid, all visible ── */}
        <div className="rs-chips-wrap">
          <div className="rs-chips">
            {chips.map((c, i) => (
              <button
                key={i}
                className="rs-chip"
                disabled={isLoading}
                onClick={() => { setInputMessage(c); inputRef.current?.focus(); }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── INPUT ── */}
        <div className="rs-input-area">
          <div className="rs-input-row">
            <textarea
              ref={inputRef}
              className="rs-textarea"
              rows={1}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about rubber trees..."
              disabled={isLoading}
            />
            <button
              className="rs-send"
              onClick={handleSend}
              disabled={isLoading || !inputMessage.trim()}
              title="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#ffffff" stroke="#ffffff"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatbotWidget;