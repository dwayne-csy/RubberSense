// RubberSense/Web/src/Components/User/LandingContactUs.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader'; // Import LandingHeader

// SVG Icons (keeping all your existing icons)
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// Rubber Tree SVG Illustration (keeping your existing illustration)
const RubberTreeIllustration = () => (
  <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '260px' }}>
    {/* Pot */}
    <rect x="122" y="318" width="76" height="48" rx="6" fill="#5D4037" opacity="0.85"/>
    <rect x="112" y="310" width="96" height="15" rx="6" fill="#795548"/>
    <ellipse cx="160" cy="318" rx="38" ry="7" fill="#3E2723" opacity="0.65"/>
    {/* Stem */}
    <path d="M160 312 Q157 275 154 236 Q151 198 157 158 Q161 128 159 98" stroke="#4CAF50" strokeWidth="6" strokeLinecap="round"/>
    {/* Branches */}
    <path d="M157 198 Q128 183 108 172" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round"/>
    <path d="M159 238 Q184 222 204 208" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round"/>
    <path d="M156 158 Q133 146 113 138" stroke="#4CAF50" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M158 128 Q177 116 194 108" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round"/>
    {/* Leaves */}
    <ellipse cx="92" cy="165" rx="33" ry="15" fill="#2E7D32" transform="rotate(-20 92 165)"/>
    <line x1="108" y1="172" x2="76" y2="158" stroke="#1B5E20" strokeWidth="1.5"/>
    <ellipse cx="214" cy="200" rx="30" ry="14" fill="#388E3C" transform="rotate(15 214 200)"/>
    <line x1="201" y1="208" x2="226" y2="193" stroke="#2E7D32" strokeWidth="1.5"/>
    <ellipse cx="98" cy="130" rx="26" ry="13" fill="#43A047" transform="rotate(-25 98 130)"/>
    <line x1="113" y1="138" x2="84" y2="123" stroke="#2E7D32" strokeWidth="1.2"/>
    <ellipse cx="198" cy="100" rx="24" ry="12" fill="#66BB6A" transform="rotate(20 198 100)"/>
    <line x1="186" y1="110" x2="210" y2="93" stroke="#388E3C" strokeWidth="1.2"/>
    <ellipse cx="150" cy="72" rx="22" ry="11" fill="#81C784" transform="rotate(-10 150 72)"/>
    <ellipse cx="168" cy="65" rx="20" ry="10" fill="#A5D6A7" transform="rotate(15 168 65)"/>
    {/* Message bubble */}
    <rect x="218" y="58" width="72" height="44" rx="10" fill="#E8F5E9" stroke="#81C784" strokeWidth="1.5"/>
    <line x1="224" y1="72" x2="282" y2="72" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
    <line x1="224" y1="82" x2="268" y2="82" stroke="#A5D6A7" strokeWidth="2" strokeLinecap="round"/>
    <line x1="224" y1="92" x2="276" y2="92" stroke="#A5D6A7" strokeWidth="2" strokeLinecap="round"/>
    <path d="M218 102 L228 112 L238 102" fill="#E8F5E9" stroke="#81C784" strokeWidth="1.5"/>
    {/* Phone bubble */}
    <circle cx="42" cy="128" r="22" fill="#E8F5E9" stroke="#81C784" strokeWidth="1.5"/>
    <path d="M36 122 Q36 119 39 119 L40 119 Q41.5 119 42 121 L42.5 124 Q43 125.5 41.5 126.5 L40.5 127.5 Q42 130 44 132 L45 131 Q46.5 129.5 48 130 L50 130.5 Q51.5 131.5 51.5 133 L51.5 134 Q51.5 137 48.5 137 Q37 137 36 122Z" fill="#4CAF50"/>
    {/* Decorative dots */}
    <circle cx="30" cy="258" r="5" fill="#C8E6C9" opacity="0.7"/>
    <circle cx="290" cy="150" r="7" fill="#C8E6C9" opacity="0.5"/>
    <circle cx="50" cy="316" r="4" fill="#A5D6A7" opacity="0.6"/>
    <circle cx="278" cy="298" r="6" fill="#C8E6C9" opacity="0.5"/>
  </svg>
);

const LandingContactUs = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Check if user is logged in when component mounts
  useEffect(() => {
    // Check for user token in localStorage or your auth system
    const userToken = localStorage.getItem('token'); // Adjust this based on your auth implementation
    const user = localStorage.getItem('user'); // Or check for user data
    setIsLoggedIn(!!(userToken || user));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!isLoggedIn) {
      setNotification({ 
        show: true, 
        message: 'Please login first to send a message.', 
        type: 'error' 
      });
      
      // Auto hide after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      
      // Optional: Navigate to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
      return;
    }

    setSending(true);

    // Simulate form submission
    setTimeout(() => {
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Show success message
      setNotification({ 
        show: true, 
        message: 'Message sent successfully! We\'ll get back to you soon.', 
        type: 'success' 
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      
      setSending(false);
    }, 1500); // Simulate network delay
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatLeaf { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-10px) rotate(2deg); } }
        @keyframes notifSlide { from { opacity:0; transform:translateX(50px); } to { opacity:1; transform:translateX(0); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .crs-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #F1F8E9;
        }

        /* HERO */
        .crs-hero {
          background: linear-gradient(135deg, #1a3d2b 0%, #2d6a4f 55%, #2d6a4f 100%);
          padding: 60px 24px 90px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .crs-hero::before {
          content:'';
          position:absolute;
          inset:0;
          background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='xMidYMid slice'%3E%3C!-- Left large tree --%3E%3Cg opacity='0.13' fill='%23ffffff'%3E%3Crect x='98' y='260' width='18' height='60'/%3E%3Cellipse cx='107' cy='200' rx='55' ry='45'/%3E%3Cellipse cx='72' cy='220' rx='38' ry='30'/%3E%3Cellipse cx='142' cy='218' rx='38' ry='30'/%3E%3Cellipse cx='107' cy='155' rx='40' ry='32'/%3E%3C/g%3E%3C!-- Second tree --%3E%3Cg opacity='0.09' fill='%23ffffff'%3E%3Crect x='268' y='275' width='14' height='45'/%3E%3Cellipse cx='275' cy='220' rx='42' ry='35'/%3E%3Cellipse cx='248' cy='238' rx='28' ry='22'/%3E%3Cellipse cx='302' cy='235' rx='28' ry='22'/%3E%3Cellipse cx='275' cy='183' rx='32' ry='26'/%3E%3C/g%3E%3C!-- Center background tree --%3E%3Cg opacity='0.07' fill='%23ffffff'%3E%3Crect x='698' y='255' width='22' height='65'/%3E%3Cellipse cx='709' cy='185' rx='70' ry='58'/%3E%3Cellipse cx='660' cy='210' rx='50' ry='40'/%3E%3Cellipse cx='758' cy='207' rx='50' ry='40'/%3E%3Cellipse cx='709' cy='130' rx='52' ry='42'/%3E%3Cellipse cx='709' cy='88' rx='36' ry='30'/%3E%3C/g%3E%3C!-- Right tree --%3E%3Cg opacity='0.1' fill='%23ffffff'%3E%3Crect x='1158' y='268' width='16' height='52'/%3E%3Cellipse cx='1166' cy='210' rx='50' ry='42'/%3E%3Cellipse cx='1136' cy='228' rx='34' ry='27'/%3E%3Cellipse cx='1196' cy='226' rx='34' ry='27'/%3E%3Cellipse cx='1166' cy='168' rx='38' ry='30'/%3E%3C/g%3E%3C!-- Far right tree --%3E%3Cg opacity='0.08' fill='%23ffffff'%3E%3Crect x='1358' y='272' width='14' height='48'/%3E%3Cellipse cx='1365' cy='218' rx='44' ry='36'/%3E%3Cellipse cx='1340' cy='235' rx='30' ry='24'/%3E%3Cellipse cx='1390' cy='233' rx='30' ry='24'/%3E%3Cellipse cx='1365' cy='180' rx='34' ry='28'/%3E%3C/g%3E%3C!-- Ground line / roots suggestion --%3E%3Crect x='0' y='315' width='1440' height='5' fill='%23ffffff' opacity='0.06'/%3E%3C/svg%3E") center bottom / cover no-repeat;
        }
        .crs-hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2rem, 5vw, 3.2rem);
          color: #fff;
          margin: 0 0 10px;
          position: relative;
          animation: fadeUp 0.55s ease both;
        }
        .crs-hero p {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.76);
          margin: 0;
          position: relative;
          animation: fadeUp 0.55s 0.1s ease both;
        }

        /* CARD GRID */
        .crs-wrap {
          max-width: 1040px;
          margin: -52px auto 64px;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 340px 1fr;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(27,94,32,0.14);
          animation: fadeUp 0.65s 0.2s ease both;
        }
        @media(max-width:820px) {
          .crs-wrap { grid-template-columns: 1fr; margin-top:-36px; }
          .crs-left { border-radius:0!important; }
          .crs-right { border-radius:0!important; }
        }

        /* LEFT */
        .crs-left {
          background: linear-gradient(160deg, #1a3d2b 0%, #2d6a4f 60%, #2d6a4f 100%);
          padding: 44px 32px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
        }

        .crs-illus { animation: floatLeaf 5s ease-in-out infinite; }

        .crs-info-list { width:100%; display:flex; flex-direction:column; gap:14px; }

        .crs-info-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.11);
          border-radius: 10px;
          padding: 13px 16px;
          color: #fff;
          backdrop-filter: blur(6px);
        }

        .crs-info-icon {
          width: 38px;
          height: 38px;
          background: rgba(255,255,255,0.18);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .crs-info-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 2px;
        }

        .crs-info-value { font-size: 0.9rem; color: #fff; }

        /* RIGHT */
        .crs-right {
          background: #fff;
          padding: 48px 44px;
        }
        @media(max-width:580px) { .crs-right { padding:32px 22px; } }

        .crs-form-head h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.85rem;
          color: #1B5E20;
          margin: 0 0 6px;
        }
        .crs-form-head p {
          font-size: 0.93rem;
          color: #78909C;
          margin: 0 0 26px;
        }

        .crs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media(max-width:540px) { .crs-row { grid-template-columns:1fr; } }

        .crs-fg { margin-bottom: 18px; }

        .crs-fg label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: #37474F;
          margin-bottom: 7px;
          text-transform: uppercase;
        }

        .crs-fg input,
        .crs-fg textarea {
          width: 100%;
          padding: 11px 14px;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          border: 1.5px solid #CFD8DC;
          border-radius: 8px;
          background: #FAFAFA;
          color: #263238;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
          outline: none;
        }

        .crs-fg input:focus,
        .crs-fg textarea:focus {
          border-color: #4CAF50;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(76,175,80,0.14);
        }

        .crs-fg textarea { resize: vertical; min-height: 118px; }

        .crs-login-overlay {
          position: relative;
        }

        .crs-login-message {
          background: #FFF3E0;
          border: 1px solid #FFB74D;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 15px;
          animation: shake 0.5s ease-in-out;
        }

        .crs-login-message-icon {
          width: 40px;
          height: 40px;
          background: #FF9800;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .crs-login-message-content {
          flex: 1;
        }

        .crs-login-message-title {
          font-weight: 700;
          color: #E65100;
          margin-bottom: 4px;
        }

        .crs-login-message-text {
          font-size: 0.9rem;
          color: #BF360C;
        }

        .crs-login-button {
          background: #FB8C00;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .crs-login-button:hover {
          background: #F57C00;
        }

        .crs-btn {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #ffffff !important;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 18px rgba(46,125,50,0.3);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-top: 6px;
          -webkit-text-fill-color: #ffffff;
        }
        .crs-btn * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff;
        }
        .crs-btn svg {
          stroke: #ffffff !important;
          flex-shrink: 0;
        }
        .crs-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 7px 22px rgba(46,125,50,0.38);
        }
        .crs-btn:disabled {
          background: #A5D6A7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .crs-spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Notification */
        .crs-notif {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
          min-width: 270px;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          animation: notifSlide 0.3s ease;
          z-index: 1000;
        }
        .crs-notif-icon {
          width: 30px;
          height: 30px;
          background: rgba(255,255,255,0.2);
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .crs-notif-close {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          margin-left: auto;
          padding: 2px;
          display: flex;
          align-items: center;
          opacity: 0.7;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .crs-notif-close:hover { opacity: 1; }
      `}</style>

      <div className="crs-root">
        {/* Add LandingHeader here */}
        <LandingHeader />
        
        <div className="crs-hero">
          <h1>Get in Touch</h1>
          <p>Have questions about RubberSense? We'd love to hear from you.</p>
        </div>

        <div className="crs-wrap">
          {/* Left */}
          <div className="crs-left">
            <div className="crs-illus">
              <RubberTreeIllustration />
            </div>

            <div className="crs-info-list">
              <div className="crs-info-item">
                <div className="crs-info-icon"><MailIcon /></div>
                <div>
                  <div className="crs-info-label">Email</div>
                  <div className="crs-info-value">rubbersense@gmail.com</div>
                </div>
              </div>
              <div className="crs-info-item">
                <div className="crs-info-icon"><PhoneIcon /></div>
                <div>
                  <div className="crs-info-label">Phone</div>
                  <div className="crs-info-value">+63 948-083-8630</div>
                </div>
              </div>
              <div className="crs-info-item">
                <div className="crs-info-icon"><MapPinIcon /></div>
                <div>
                  <div className="crs-info-label">Address</div>
                  <div className="crs-info-value">Km. 14 East Service Road Western Bicutan, Taguig City</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="crs-right">
            <div className="crs-form-head">
              <h2>Send us a message</h2>
              <p>Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>

            {/* Show login message if not logged in */}
            {!isLoggedIn && (
              <div className="crs-login-message">
                <div className="crs-login-message-icon">
                  <LockIcon />
                </div>
                <div className="crs-login-message-content">
                  <div className="crs-login-message-title">Login Required</div>
                  <div className="crs-login-message-text">Please login to send us a message</div>
                </div>
                <button className="crs-login-button" onClick={handleLoginRedirect}>
                  Login Now
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="crs-row">
                <div className="crs-fg">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    disabled={sending || !isLoggedIn}
                  />
                </div>

                <div className="crs-fg">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    disabled={sending || !isLoggedIn}
                  />
                </div>
              </div>

              <div className="crs-fg">
                <label>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this about?"
                  required
                  disabled={sending || !isLoggedIn}
                />
              </div>

              <div className="crs-fg">
                <label>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message here..."
                  required
                  disabled={sending || !isLoggedIn}
                  rows={5}
                />
              </div>

              <button 
                type="submit" 
                className="crs-btn" 
                disabled={sending || !isLoggedIn} 
                style={{color:'#ffffff'}}
              >
                {sending ? (
                  <><div className="crs-spinner" /><span style={{color:'#ffffff',fontWeight:600}}>Sending...</span></>
                ) : (
                  <><SendIcon /><span style={{color:'#ffffff',fontWeight:600}}>Submit</span></>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className="crs-notif"
            style={{
              background: notification.type === 'success'
                ? 'linear-gradient(135deg, #2E7D32, #43A047)'
                : 'linear-gradient(135deg, #c62828, #e53935)'
            }}
          >
            <div className="crs-notif-icon">
              {notification.type === 'success' ? <CheckIcon /> : <XIcon />}
            </div>
            <span>{notification.message}</span>
            <button
              className="crs-notif-close"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <XIcon />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default LandingContactUs;