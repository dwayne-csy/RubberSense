import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from '../../config/firebase';

/* ── SVG Icons ─────────────────────────────────────────────── */
const LeafIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 20C11 20 2 14.5 2 8.5C2 5.46 6 3 11 3C16 3 20 5.46 20 8.5C20 14.5 11 20 11 20Z" fill="#52b788"/>
    <line x1="11" y1="20" x2="11" y2="8" stroke="#1b4332" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="11" y1="14" x2="7.5" y2="11" stroke="#1b4332" strokeWidth="1" strokeLinecap="round"/>
    <line x1="11" y1="11" x2="14.5" y2="8.5" stroke="#1b4332" strokeWidth="1" strokeLinecap="round"/>
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
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0, marginTop:'2px'}}>
    <circle cx="7" cy="7" r="6" stroke="#c0392b" strokeWidth="1.3"/>
    <line x1="7" y1="4" x2="7" y2="7.5" stroke="#c0392b" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="0.8" fill="#c0392b"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
    <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#c0392b" strokeWidth="1.3" strokeLinejoin="round"/>
    <line x1="8" y1="6" x2="8" y2="9.5" stroke="#c0392b" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="8" cy="11" r="0.7" fill="#c0392b"/>
  </svg>
);

/* ── Component ──────────────────────────────────────────────── */
const Login = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);

  const navigate = useNavigate();
  const isAnyLoading = loading || isGoogleLoading || isFacebookLoading;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/login`,
        formData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        if (error.response.status === 403 && error.response.data.deactivationMessage) {
          const deactivationMsg = error.response.data.deactivationMessage;
          const deactivatedAt = error.response.data.deactivatedAt;
          setError({ type: 'deactivated', msg: deactivationMsg, date: deactivatedAt });
        } else {
          setError(error.response.data.message || 'Login failed. Please try again.');
        }
      } else if (error.request) {
        setError('Cannot connect to server. Please check if backend is running on port 4001.');
      } else {
        setError('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await axios.post(`${API_BASE_URL}/api/v1/users/firebase/auth/google`, { idToken });
      if (!data.token) throw new Error("No JWT token received from backend");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ name: data.user.name, email: data.user.email, role: data.user.role, id: data.user._id, avatar: data.user.avatar }));
      data.user.role === "admin" ? navigate("/admin/dashboard") : navigate("/home");
    } catch (error) {
      console.error("Google login error:", error);
      if (error.code === 'auth/popup-closed-by-user') setError("Google login was cancelled.");
      else if (error.code === 'auth/popup-blocked') setError("Popup blocked. Please allow popups for this site.");
      else if (error.code === 'auth/network-request-failed') setError("Network error. Check your connection.");
      else setError("Google login failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    setIsFacebookLoading(true);
    try {
      await auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await signInWithPopup(auth, facebookProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await axios.post(`${API_BASE_URL}/api/v1/users/firebase/auth/facebook`, { idToken });
      if (!data.token) throw new Error("No JWT token received from backend");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ name: data.user.name, email: data.user.email, role: data.user.role, id: data.user._id, avatar: data.user.avatar }));
      data.user.role === "admin" ? navigate("/admin/dashboard") : navigate("/home");
    } catch (error) {
      console.error("Facebook login error:", error);
      if (error.code === 'auth/popup-closed-by-user') { setError(""); return; }
      else if (error.code === 'auth/popup-blocked') setError("Popup blocked. Please allow popups for this site.");
      else if (error.code === 'auth/network-request-failed') setError("Network error. Check your connection.");
      else if (error.code === 'auth/account-exists-with-different-credential') setError("Account exists with a different sign-in method.");
      else setError("Facebook login failed. Please try again.");
    } finally {
      setIsFacebookLoading(false);
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
          opacity: 1;
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
        .rs-logo-name em { font-style: normal; color: #2d6a4f; }

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

        /* Deactivated special alert */
        .rs-deact {
          background: #fff5f5;
          border: 1px solid #f5c6c6;
          border-radius: 9px;
          padding: 14px;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .rs-deact-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
          color: #b03030;
          font-size: 13.5px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f5c6c6;
        }
        .rs-deact-msg { color: #b03030; line-height: 1.5; margin-bottom: 8px; }
        .rs-deact-date {
          font-size: 12px;
          color: #888;
          background: #f9f9f9;
          border-radius: 5px;
          padding: 6px 9px;
          margin-bottom: 8px;
        }
        .rs-deact-help {
          font-size: 12px;
          background: #fff8f0;
          border: 1px solid #ffe0b2;
          border-radius: 5px;
          padding: 8px 10px;
          color: #7a5a2a;
          line-height: 1.45;
        }

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
          transition: color 0.2s;
        }
        .rs-eye:hover svg line, .rs-eye:hover svg path, .rs-eye:hover svg circle { stroke: #2d6a4f; }

        /* Form options row */
        .rs-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 14px 0 18px;
        }

        .rs-check-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: #6a8070;
          cursor: pointer;
          user-select: none;
        }

        .rs-check {
          width: 15px;
          height: 15px;
          accent-color: #2d6a4f;
          cursor: pointer;
        }

        .rs-forgot {
          font-size: 13px;
          color: #2d6a4f;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid rgba(45,106,79,0.25);
          transition: border-color 0.2s;
        }
        .rs-forgot:hover { border-color: #2d6a4f; }

        /* Button */
        .rs-btn {
          width: 100%;
          padding: 13px;
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
          margin-bottom: 20px;
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

        /* OR divider */
        .rs-or {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #9ab5a4;
        }
        .rs-or::before, .rs-or::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e4ede8;
        }

        /* Social buttons */
        .rs-socials {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .rs-social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          border: 1.5px solid #dbe8e0;
          border-radius: 9px;
          background: #f8fbf9;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #3d5244;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .rs-social-btn:hover:not(:disabled) {
          background: #fff;
          border-color: #2d6a4f;
          box-shadow: 0 4px 12px rgba(45,106,79,0.12);
          transform: translateY(-1px);
        }
        .rs-social-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .rs-social-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(45,106,79,0.2);
          border-top-color: #2d6a4f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* Footer */
        .rs-foot {
          text-align: center;
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

        {/* Animated background leaves */}
        <svg className="rs-bg-leaves" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <g className="lf1" style={{transformOrigin:'160px 220px'}}>
            <path d="M160 220 C100 140 30 90 -60 20 C40 60 130 130 190 210Z" fill="#2d6a4f" opacity="0.9"/>
            <path d="M160 220 C100 140 30 90 -60 20" stroke="#52b788" strokeWidth="2.5" fill="none" opacity="0.7"/>
            <line x1="60" y1="72" x2="90" y2="100" stroke="#52b788" strokeWidth="1.2" opacity="0.5"/>
            <line x1="90" y1="110" x2="115" y2="135" stroke="#52b788" strokeWidth="1" opacity="0.4"/>
          </g>
          <g className="lf2" style={{transformOrigin:'60px 120px'}}>
            <path d="M60 120 C20 70 -20 30 -80 -10 C0 30 50 80 80 115Z" fill="#40916c" opacity="0.75"/>
            <path d="M60 120 C20 70 -20 30 -80 -10" stroke="#74c69d" strokeWidth="1.8" fill="none" opacity="0.6"/>
          </g>
          <g className="lf3" style={{transformOrigin:'220px 80px'}}>
            <path d="M220 80 C200 30 190 -10 200 -60 C220 -20 230 30 235 75Z" fill="#52b788" opacity="0.6"/>
          </g>
          <g className="lf2" style={{transformOrigin:'1050px 180px'}}>
            <path d="M1050 180 C1110 100 1170 50 1260 -10 C1175 55 1105 120 1065 175Z" fill="#2d6a4f" opacity="0.9"/>
            <path d="M1050 180 C1110 100 1170 50 1260 -10" stroke="#52b788" strokeWidth="2.5" fill="none" opacity="0.7"/>
            <line x1="1160" y1="42" x2="1130" y2="72" stroke="#52b788" strokeWidth="1.2" opacity="0.5"/>
            <line x1="1130" y1="85" x2="1105" y2="110" stroke="#52b788" strokeWidth="1" opacity="0.4"/>
          </g>
          <g className="lf1" style={{transformOrigin:'1160px 80px'}}>
            <path d="M1160 80 C1195 35 1220 -5 1270 -40 C1230 10 1185 50 1165 75Z" fill="#40916c" opacity="0.75"/>
          </g>
          <g className="lf3" style={{transformOrigin:'980px 60px'}}>
            <path d="M980 60 C1010 20 1050 -10 1100 -40 C1060 5 1015 40 990 55Z" fill="#52b788" opacity="0.55"/>
            <path d="M980 60 C1010 20 1050 -10 1100 -40" stroke="#74c69d" strokeWidth="1.5" fill="none" opacity="0.5"/>
          </g>
          <g className="lf3" style={{transformOrigin:'120px 680px'}}>
            <path d="M120 680 C60 630 -10 600 -80 540 C10 580 80 640 130 675Z" fill="#2d6a4f" opacity="0.9"/>
            <path d="M120 680 C60 630 -10 600 -80 540" stroke="#52b788" strokeWidth="2.5" fill="none" opacity="0.65"/>
            <line x1="-10" y1="598" x2="30" y2="622" stroke="#52b788" strokeWidth="1.2" opacity="0.5"/>
          </g>
          <g className="lf1" style={{transformOrigin:'30px 750px'}}>
            <path d="M30 750 C-20 710 -70 680 -120 640 C-60 675 0 715 40 745Z" fill="#40916c" opacity="0.7"/>
          </g>
          <g className="lf2" style={{transformOrigin:'240px 780px'}}>
            <path d="M240 780 C210 740 200 700 220 650 C240 695 248 742 245 778Z" fill="#52b788" opacity="0.6"/>
          </g>
          <g className="lf2" style={{transformOrigin:'1100px 700px'}}>
            <path d="M1100 700 C1150 645 1200 610 1270 570 C1205 615 1145 660 1110 695Z" fill="#2d6a4f" opacity="0.9"/>
            <path d="M1100 700 C1150 645 1200 610 1270 570" stroke="#52b788" strokeWidth="2.5" fill="none" opacity="0.65"/>
            <line x1="1200" y1="610" x2="1165" y2="640" stroke="#52b788" strokeWidth="1.2" opacity="0.5"/>
          </g>
          <g className="lf3" style={{transformOrigin:'1200px 780px'}}>
            <path d="M1200 780 C1235 740 1260 700 1280 650 C1255 700 1218 745 1205 778Z" fill="#40916c" opacity="0.75"/>
          </g>
          <g className="lf1" style={{transformOrigin:'980px 760px'}}>
            <path d="M980 760 C1010 720 1060 700 1110 675 C1065 705 1010 730 990 758Z" fill="#52b788" opacity="0.55"/>
          </g>
        </svg>

        {/* ── Card ── */}
        <div className="rs-card">

          {/* Logo */}
          <div className="rs-logo">
            <div className="rs-logo-mark"><LeafIcon /></div>
            <span className="rs-logo-name">Rubber<em>Sense</em></span>
          </div>

          <h2 className="rs-heading">Welcome Back</h2>
          <p className="rs-sub">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>

          <div className="rs-rule" />

          {/* Error alerts */}
          {error && typeof error === 'string' && (
            <div className="rs-alert rs-alert-err">
              <AlertCircleIcon />
              <span>{error}</span>
            </div>
          )}
          {error && typeof error === 'object' && error.type === 'deactivated' && (
            <div className="rs-deact">
              <div className="rs-deact-title">
                <WarningIcon /> Account Deactivated
              </div>
              <div className="rs-deact-msg">{error.msg}</div>
              {error.date && (
                <div className="rs-deact-date">
                  Deactivated on: {new Date(error.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
              <div className="rs-deact-help">
                <strong>Need help?</strong> Please contact our support team if you believe this is a mistake or need assistance.
              </div>
            </div>
          )}

          <form onSubmit={handleLocalLogin} noValidate>

            <div className="rs-field">
              <label htmlFor="email" className="rs-label">Email Address</label>
              <div className="rs-input-wrap">
                <span className="rs-ico"><MailIcon /></span>
                <input
                  type="email" id="email" name="email"
                  className="rs-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required disabled={isAnyLoading}
                />
              </div>
            </div>

            <div className="rs-field">
              <label htmlFor="password" className="rs-label">Password</label>
              <div className="rs-input-wrap">
                <span className="rs-ico"><LockIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password" name="password"
                  className="rs-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required disabled={isAnyLoading}
                  style={{ paddingRight: '36px' }}
                />
                <button type="button" className="rs-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} disabled={isAnyLoading}>
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            <div className="rs-options">
              <label className="rs-check-label">
                <input type="checkbox" className="rs-check" disabled={isAnyLoading} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="rs-forgot">Forgot password?</Link>
            </div>

            <button type="submit" className="rs-btn" disabled={isAnyLoading}>
              {loading
                ? <><span className="rs-spinner" /> Signing In...</>
                : 'Sign In'
              }
            </button>
          </form>

          <div className="rs-or">or sign in with</div>

          {/* Social buttons */}
          <div className="rs-socials">
            <button
              type="button"
              className="rs-social-btn"
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
              title="Continue with Google"
            >
              {isGoogleLoading
                ? <span className="rs-social-spinner" />
                : <><GoogleIcon /> Google</>
              }
            </button>

            <button
              type="button"
              className="rs-social-btn"
              onClick={handleFacebookLogin}
              disabled={isAnyLoading}
              title="Continue with Facebook"
            >
              {isFacebookLoading
                ? <span className="rs-social-spinner" />
                : <><FacebookIcon /> Facebook</>
              }
            </button>
          </div>

          <div className="rs-foot">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default Login;