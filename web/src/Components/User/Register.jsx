import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ── SVG Icons ─────────────────────────────────────────────── */
const LeafIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 20C11 20 2 14.5 2 8.5C2 5.46 6 3 11 3C16 3 20 5.46 20 8.5C20 14.5 11 20 11 20Z" fill="#52b788"/>
    <line x1="11" y1="20" x2="11" y2="8" stroke="#1b4332" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="11" y1="14" x2="7.5" y2="11" stroke="#1b4332" strokeWidth="1" strokeLinecap="round"/>
    <line x1="11" y1="11" x2="14.5" y2="8.5" stroke="#1b4332" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="5" r="2.8" stroke="#9ab5a4" strokeWidth="1.3"/>
    <path d="M1.5 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#9ab5a4" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="1" y="3" width="13" height="9" rx="1.8" stroke="#9ab5a4" strokeWidth="1.3"/>
    <path d="M1 5.5l6.5 4 6.5-4" stroke="#9ab5a4" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="2.5" y="6.5" width="10" height="7" rx="1.8" stroke="#9ab5a4" strokeWidth="1.3"/>
    <path d="M4.5 6.5V5a3 3 0 016 0v1.5" stroke="#9ab5a4" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="7.5" cy="10" r="0.9" fill="#9ab5a4"/>
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M1 7.5s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1 7.5 1 7.5z" stroke="#9ab5a4" strokeWidth="1.3"/>
    <circle cx="7.5" cy="7.5" r="1.8" stroke="#9ab5a4" strokeWidth="1.3"/>
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M1 7.5s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1 7.5 1 7.5z" stroke="#9ab5a4" strokeWidth="1.3"/>
    <circle cx="7.5" cy="7.5" r="1.8" stroke="#9ab5a4" strokeWidth="1.3"/>
    <line x1="2" y1="2" x2="13" y2="13" stroke="#9ab5a4" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
    <circle cx="7" cy="7" r="6" stroke="#c0392b" strokeWidth="1.3"/>
    <line x1="7" y1="4" x2="7" y2="7.5" stroke="#c0392b" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="0.8" fill="#c0392b"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
    <circle cx="7" cy="7" r="6" stroke="#2d6a4f" strokeWidth="1.3"/>
    <path d="M3.5 7l2.5 2.5 4.5-5" stroke="#2d6a4f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Component ──────────────────────────────────────────────── */
const Register = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/register`,
        { name: formData.name, email: formData.email, password: formData.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        setError(err.response.data.message || 'Registration failed. Please try again.');
      } else if (err.request) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rs-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Jost', sans-serif;
          background: #0c1a10;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        .rs-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 65% 55% at 10% 5%,  rgba(45,106,79,0.40) 0%, transparent 60%),
            radial-gradient(ellipse 55% 50% at 90% 95%, rgba(27,67,50,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(64,145,108,0.06) 0%, transparent 70%),
            #0c1a10;
        }

        .rs-bg-leaves {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.20;
        }

        @keyframes lf1 {
          0%,100% { transform: translateY(0)   rotate(0deg); }
          50%      { transform: translateY(-16px) rotate(4deg); }
        }
        @keyframes lf2 {
          0%,100% { transform: translateY(0)   rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes lf3 {
          0%,100% { transform: translateY(0)   rotate(0deg); }
          50%      { transform: translateY(-20px) rotate(5deg); }
        }
        .lf1 { animation: lf1 9s  ease-in-out infinite; }
        .lf2 { animation: lf2 11s ease-in-out 2s infinite; }
        .lf3 { animation: lf3 8s  ease-in-out 4s infinite; }

        /* ── Card ── */
        .rs-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);
          padding: 40px 42px 36px;
          animation: cardIn 0.5s cubic-bezier(.22,.68,0,1.15) both;
        }

        @keyframes cardIn {
          from { opacity:0; transform: translateY(20px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1); }
        }

        /* Logo row */
        .rs-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
        }

        .rs-logo-mark {
          width: 38px;
          height: 38px;
          background: linear-gradient(140deg, #2d6a4f 0%, #52b788 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(45,106,79,0.38);
          flex-shrink: 0;
        }

        .rs-logo-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 700;
          color: #1a2e20;
          letter-spacing: 0.2px;
        }

        .rs-logo-name em {
          font-style: normal;
          color: #2d6a4f;
        }

        /* Heading */
        .rs-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 700;
          color: #1a2e20;
          letter-spacing: -0.3px;
          line-height: 1.15;
          margin-bottom: 5px;
        }

        .rs-sub {
          font-size: 13px;
          color: #7c907f;
          margin-bottom: 22px;
        }

        .rs-sub a {
          color: #2d6a4f;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid rgba(45,106,79,0.25);
          transition: border-color 0.2s;
        }
        .rs-sub a:hover { border-color: #2d6a4f; }

        .rs-rule {
          height: 1px;
          background: linear-gradient(90deg, transparent, #dde9e2, transparent);
          margin-bottom: 22px;
        }

        /* Alert */
        .rs-alert {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 13px;
          border-radius: 9px;
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.45;
        }
        .rs-alert-err { background:#fff5f5; border:1px solid #f5c6c6; color:#b03030; }
        .rs-alert-ok  { background:#f0faf4; border:1px solid #a8dfc0; color:#1a7048; }

        /* Field */
        .rs-field { margin-bottom: 15px; }

        .rs-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 500;
          color: #3d5244;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .rs-star { color: #c0392b; font-size: 10px; }

        .rs-input-wrap { position: relative; display: flex; align-items: center; }

        .rs-ico {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          display: flex;
        }

        .rs-input {
          width: 100%;
          padding: 11px 14px 11px 38px;
          border: 1.5px solid #dbe8e0;
          border-radius: 9px;
          font-size: 14px;
          font-family: 'Jost', sans-serif;
          color: #1a2e20;
          background: #f8fbf9;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .rs-input::placeholder { color: #b3c5bc; }
        .rs-input:focus {
          border-color: #2d6a4f;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.10);
        }
        .rs-input:disabled { background:#f1f5f2; color:#999; cursor:not-allowed; }

        .rs-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          color: #9ab5a4;
          transition: color 0.2s;
        }
        .rs-eye:hover { color: #2d6a4f; }

        .rs-hint {
          display: block;
          font-size: 11px;
          color: #a5b8ae;
          margin-top: 4px;
          font-weight: 300;
        }

        /* Button */
        .rs-btn {
          width: 100%;
          padding: 13px;
          margin-top: 8px;
          background: linear-gradient(130deg, #2d6a4f 0%, #40916c 100%);
          color: #fff;
          border: none;
          border-radius: 9px;
          font-size: 14px;
          font-family: 'Jost', sans-serif;
          font-weight: 500;
          letter-spacing: 0.3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: box-shadow 0.2s, transform 0.15s, opacity 0.2s;
        }
        .rs-btn:hover:not(:disabled) {
          box-shadow: 0 10px 26px rgba(45,106,79,0.38);
          transform: translateY(-1px);
        }
        .rs-btn:active:not(:disabled) { transform: translateY(0); }
        .rs-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .rs-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .rs-foot {
          text-align: center;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #eaf0ec;
          font-size: 13px;
          color: #7c907f;
        }
        .rs-foot a {
          color: #2d6a4f;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid rgba(45,106,79,0.25);
          transition: border-color 0.2s;
        }
        .rs-foot a:hover { border-color: #2d6a4f; }
      `}</style>

      <div className="rs-page">
        <div className="rs-bg" />

        {/* Ambient background leaves */}
        <svg className="rs-bg-leaves" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <g className="lf1" style={{transformOrigin:'100px 180px'}}>
            <path d="M100 180 C60 110 10 70 -40 0 C50 35 110 100 145 175Z" fill="#52b788"/>
            <path d="M100 180 C60 110 10 70 -40 0" stroke="#74c69d" strokeWidth="2" fill="none"/>
          </g>
          <g className="lf2" style={{transformOrigin:'1100px 120px'}}>
            <path d="M1100 120 C1140 60 1175 20 1230 -30 C1185 45 1135 90 1105 115Z" fill="#40916c"/>
          </g>
          <g className="lf3" style={{transformOrigin:'80px 700px'}}>
            <path d="M80 700 C35 650 -20 620 -60 560 C20 595 75 650 100 695Z" fill="#2d6a4f"/>
            <path d="M80 700 C35 650 -20 620 -60 560" stroke="#52b788" strokeWidth="1.5" fill="none"/>
          </g>
          <g className="lf1" style={{transformOrigin:'1150px 680px'}}>
            <path d="M1150 680 C1185 630 1215 595 1255 545 C1210 600 1165 645 1145 678Z" fill="#52b788"/>
          </g>
          <ellipse cx="220" cy="420" rx="100" ry="38" fill="#2d6a4f" opacity="0.3" transform="rotate(-28 220 420)"/>
          <ellipse cx="980" cy="340" rx="80" ry="32" fill="#40916c" opacity="0.25" transform="rotate(22 980 340)"/>
        </svg>

        {/* ── Card ── */}
        <div className="rs-card">

          {/* Logo */}
          <div className="rs-logo">
            <div className="rs-logo-mark">
              <LeafIcon />
            </div>
            <span className="rs-logo-name">Rubber<em>Sense</em></span>
          </div>

          <h2 className="rs-heading">Create Account</h2>
          <p className="rs-sub">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <div className="rs-rule" />

          {error && (
            <div className="rs-alert rs-alert-err">
              <AlertCircleIcon />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="rs-alert rs-alert-ok">
              <CheckCircleIcon />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="rs-field">
              <label htmlFor="name" className="rs-label">
                Full Name <span className="rs-star">*</span>
              </label>
              <div className="rs-input-wrap">
                <span className="rs-ico"><UserIcon /></span>
                <input
                  type="text" id="name" name="name"
                  className="rs-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required disabled={loading}
                />
              </div>
            </div>

            <div className="rs-field">
              <label htmlFor="email" className="rs-label">
                Email Address <span className="rs-star">*</span>
              </label>
              <div className="rs-input-wrap">
                <span className="rs-ico"><MailIcon /></span>
                <input
                  type="email" id="email" name="email"
                  className="rs-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required disabled={loading}
                />
              </div>
            </div>

            <div className="rs-field">
              <label htmlFor="password" className="rs-label">
                Password <span className="rs-star">*</span>
              </label>
              <div className="rs-input-wrap">
                <span className="rs-ico"><LockIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password" name="password"
                  className="rs-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required disabled={loading}
                  style={{ paddingRight: '36px' }}
                />
                <button type="button" className="rs-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              <small className="rs-hint">Minimum 6 characters</small>
            </div>

            <div className="rs-field">
              <label htmlFor="confirmPassword" className="rs-label">
                Confirm Password <span className="rs-star">*</span>
              </label>
              <div className="rs-input-wrap">
                <span className="rs-ico"><LockIcon /></span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword" name="confirmPassword"
                  className="rs-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required disabled={loading}
                  style={{ paddingRight: '36px' }}
                />
                <button type="button" className="rs-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                  {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="rs-btn" disabled={loading}>
              {loading
                ? <><span className="rs-spinner" /> Creating Account...</>
                : 'Create Account'
              }
            </button>
          </form>

          <div className="rs-foot">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default Register;