import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

import aboutUsPic from '../otherpictures/aboutus.jpg';
import pic1 from '../studentpic/picture1.jpg';
import pic2 from '../studentpic/picture2.jpg';
import pic3 from '../studentpic/picture3.jpg';
import pic4 from '../studentpic/picture4.jpg';

const teamMembers = [
  {
    name: 'Aris Thea Lyn Arnado',
    email: 'aristhealyn.arnado@tup.edu.ph',
    contact: '090909090909',
    school: 'Technological University of the Philippines - Taguig',
    photo: pic1,
    facebook: 'https://web.facebook.com/llrxnxn',
    github: 'https://github.com/llrxnxn',
  },
  {
    name: 'Dwayne Casay',
    email: 'dwayne.casay@tup.edu.ph',
    contact: '090909090909',
    school: 'Technological University of the Philippines - Taguig',
    photo: pic2,
    facebook: 'https://web.facebook.com/dwayne.casay',
    github: 'https://github.com/dwayne-csy',
  },
  {
    name: 'Lance David',
    email: 'lance.david@tup.edu.ph',
    contact: '090909090909',
    school: 'Technological University of the Philippines - Taguig',
    photo: pic3,
    facebook: 'https://web.facebook.com/lance.david.10236',
    github: 'https://github.com/allan-78',
  },
  {
    name: 'Allan Roi Monforte',
    email: 'allanroi.monforte@tup.edu.ph',
    contact: '090909090909',
    school: 'Technological University of the Philippines - Taguig',
    photo: pic4,
    facebook: 'https://web.facebook.com/allan.monforte.1',
    github: 'https://github.com/allan-78',
  },
];

/* ── Facebook SVG Icon ── */
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

/* ── GitHub SVG Icon ── */
const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

/* ── SVG leaf decorations ── */
const LeafSVG = ({ style }) => (
  <svg viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path
      d="M60 195 C60 195 10 140 10 80 C10 30 60 5 60 5 C60 5 110 30 110 80 C110 140 60 195 60 195Z"
      fill="url(#leafGrad)"
      opacity="0.18"
    />
    <path d="M60 195 L60 5" stroke="#2d6a2d" strokeWidth="1.5" opacity="0.3" />
    <path d="M60 80 C60 80 30 60 20 40" stroke="#2d6a2d" strokeWidth="1" opacity="0.2" />
    <path d="M60 100 C60 100 90 80 100 55" stroke="#2d6a2d" strokeWidth="1" opacity="0.2" />
    <defs>
      <linearGradient id="leafGrad" x1="60" y1="5" x2="60" y2="195" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5a9f3e" />
        <stop offset="100%" stopColor="#1a4a1a" />
      </linearGradient>
    </defs>
  </svg>
);

/* ── Green Section Divider ── */
const GreenSectionDivider = () => (
  <div style={{
    margin: '0 40px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, #4ab54a 20%, #2d6a4f 50%, #4ab54a 80%, transparent 100%)',
  }} />
);

/* ── Ring divider ── */
const RingDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '0 0 32px 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #5a8a3a)' }} />
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5a8a3a' }} />
    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8ab86a' }} />
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5a8a3a' }} />
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #5a8a3a)' }} />
  </div>
);

const AboutUs = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate, API_BASE_URL]);

  /* Intersection observer for scroll-in animations */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.dataset.section]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 100%)',
      }}>
        <div style={{
          width: '56px', height: '56px',
          border: '3px solid rgba(90,160,60,0.2)',
          borderTop: '3px solid #7ec850',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ marginTop: '20px', color: '#7ec850', fontSize: '16px', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '2px' }}>
          Growing RubberSense…
        </p>
      </div>
    );
  }

  const sectionFade = (key) => ({
    opacity: visibleSections.has(key) ? 1 : 0,
    transform: visibleSections.has(key) ? 'translateY(0)' : 'translateY(40px)',
    transition: 'opacity 0.8s ease, transform 0.8s ease',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Serif+Display:ital@0;1&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          margin: 0;
          padding: 0;
          background: #f4f8f0;
          font-family: 'Lato', sans-serif;
        }

        footer {
          margin: 0 !important;
          padding-top: 0 !important;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes drip {
          0% { transform: translateY(0) scaleY(1); opacity: 0.8; }
          80% { transform: translateY(18px) scaleY(1.2); opacity: 1; }
          100% { transform: translateY(24px) scaleY(0.8); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(126,200,80,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(126,200,80,0); }
        }
        @keyframes leafSway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }

        /* ── WHO WE ARE ── */
        .section-who {
          background: linear-gradient(160deg, #e8f2e0 0%, #f4f8f0 60%, #eaf3e2 100%);
          padding: 100px 8vw 120px;
          position: relative;
          overflow: hidden;
        }

        .section-label {
          font-family: 'Lato', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: #7ec850;
          margin-bottom: 12px;
        }

        .section-heading {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(2.2rem, 5vw, 3.6rem);
          line-height: 1.1;
          color: #e8f5e0;
          margin-bottom: 28px;
        }

        .section-heading.dark { color: #1a3a1a; }

        .section-body {
          font-size: 17px;
          line-height: 1.9;
          color: #b5d49a;
          max-width: 680px;
          font-weight: 300;
        }

        .section-body.dark { color: #3a5a2a; }

        /* ── TEAM GRID ── */
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2px;
          margin-top: 70px;
        }

        .team-card {
          background: #0d200d;
          padding: 36px 28px;
          position: relative;
          overflow: hidden;
        }
        .team-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(to right, #3a6a20, #7ec850, #3a6a20);
        }

        .team-photo-wrap {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 20px;
          border: 2px solid #3a6a20;
          animation: pulseGlow 4s ease-in-out infinite;
        }
        .team-photo-wrap img {
          width: 100%; height: 100%;
          object-fit: cover;
        }

        .team-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #c8e8a0;
          text-align: center;
          margin-bottom: 14px;
        }

        /* ── SOCIAL ICONS ── */
        .social-links {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .social-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          text-decoration: none;
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
          cursor: pointer;
        }

        .social-btn.facebook {
          background: rgba(24, 119, 242, 0.12);
          color: #7ab8ff;
          border: 1px solid rgba(24, 119, 242, 0.3);
        }
        .social-btn.facebook:hover {
          background: #1877F2;
          color: #ffffff;
          transform: translateY(-3px);
          border-color: #1877F2;
        }

        .social-btn.github {
          background: rgba(200, 232, 160, 0.08);
          color: #a0c878;
          border: 1px solid rgba(200, 232, 160, 0.2);
        }
        .social-btn.github:hover {
          background: #c8e8a0;
          color: #0d200d;
          transform: translateY(-3px);
          border-color: #c8e8a0;
        }

        .team-info-reveal {
          margin-top: 4px;
          border-top: 1px solid #1e3e1e;
          padding-top: 18px;
        }

        .info-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .info-row:last-child { margin-bottom: 0; }
        .info-icon { font-size: 13px; margin-top: 2px; flex-shrink: 0; }
        .info-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #4a7a30;
          margin-bottom: 2px;
        }
        .info-value {
          font-size: 13px;
          color: #a0c878;
          word-break: break-word;
          line-height: 1.5;
        }

        /* ── LIGHT SECTIONS ── */
        .section-light {
          padding: 100px 8vw;
          position: relative;
          background: #f4f8f0;
        }

        .section-light + .section-light {
          border-top: 1px solid #dbe8d0;
        }

        .tap-mark {
          position: absolute;
          left: 6vw;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 80px;
          background: linear-gradient(to bottom, #7ec850, #3a6a20);
          border-radius: 2px;
          opacity: 0.5;
        }
        .tap-mark::after {
          content: '';
          position: absolute;
          bottom: -16px;
          left: -4px;
          width: 12px;
          height: 18px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 18'%3E%3Cellipse cx='6' cy='9' rx='5' ry='8' fill='%237ec850' opacity='.5'/%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
          animation: drip 3s ease-in-out infinite;
        }

        .content-col { max-width: 700px; margin-left: 5vw; }
        .content-col.right { margin-left: auto; margin-right: 5vw; }

        /* ── OBJECTIVES ── */
        .section-objectives {
          background: linear-gradient(160deg, #edf5e5 0%, #f4f8f0 60%, #e8f2e0 100%);
          padding: 100px 8vw;
          position: relative;
          overflow: hidden;
        }

        .obj-bg-leaf {
          position: absolute;
          right: -40px; bottom: -60px;
          width: 340px;
          opacity: 0.06;
          transform: rotate(30deg);
          pointer-events: none;
        }

        .obj-heading {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          color: #1a3a1a;
          margin-bottom: 32px;
          line-height: 1.1;
        }

        .obj-body {
          font-size: 18px;
          line-height: 1.95;
          color: #3a5a2a;
          font-weight: 300;
          max-width: 720px;
        }

        .obj-highlight {
          display: block;
          background: linear-gradient(to right, rgba(90,138,58,0.12), transparent);
          border-left: 3px solid #5a8a3a;
          padding-left: 16px;
          margin-top: 28px;
          font-style: italic;
          color: #4a7a2a;
          font-size: 17px;
          line-height: 1.8;
        }

        @media (max-width: 768px) {
          .section-who, .section-light, .section-objectives { padding-left: 5vw; padding-right: 5vw; }
          .content-col, .content-col.right { margin-left: 0; margin-right: 0; }
          .tap-mark { display: none; }
        }
      `}</style>

      <UserHeader />

      {/* ══ WHO WE ARE ══ */}
      <section className="section-who" data-section="who" style={sectionFade('who')}>
        <div style={{ display: 'flex', gap: '60px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left: text */}
          <div style={{ flex: '1 1 400px' }}>
            <div className="section-label" style={{ color: '#5a8a3a' }}>Our Roots</div>
            <h2 className="section-heading dark">Who We Are</h2>
            <p className="section-body dark">
              We are a team of Information Technology researchers and developers committed to creating
              intelligent, data-driven solutions for real-world challenges. Our expertise lies in artificial
              intelligence, machine learning, image processing, and system development. Through innovation
              and research, we aim to design systems that transform traditional processes into smarter,
              technology-enabled solutions.
            </p>
          </div>

          {/* Right: image */}
          <div style={{ flex: '0 0 340px', position: 'relative' }}>
            <div style={{
              borderRadius: '4px 40px 4px 40px',
              overflow: 'hidden',
              border: '2px solid #7ec850',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              position: 'relative',
              background: '#e8f2e0',
            }}>
              <img
                src={aboutUsPic}
                alt="About Us"
                style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(7,20,7,0.4) 0%, transparent 60%)',
                pointerEvents: 'none',
              }} />
            </div>
            <div style={{
              position: 'absolute', top: -12, right: -12,
              width: 60, height: 60,
              border: '2px solid #7ec850',
              borderRadius: '0 20px 0 0',
              opacity: 0.4, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -12, left: -12,
              width: 60, height: 60,
              border: '2px solid #3a6a20',
              borderRadius: '0 0 0 20px',
              opacity: 0.4, pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Team cards */}
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-photo-wrap">
                <img
                  src={member.photo}
                  alt={member.name}
                  onError={(e) => {
                    e.currentTarget.parentElement.innerHTML = `
                      <div style="width:100%;height:100%;background:#1e4a1e;display:flex;align-items:center;justify-content:center;color:#7ec850;font-size:2rem;font-family:'Playfair Display',serif;font-weight:700">
                        ${member.name.charAt(0)}
                      </div>`;
                  }}
                />
              </div>

              <div className="team-name">{member.name}</div>

              {/* Social Icons */}
              <div className="social-links">
                <a
                  href={member.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn facebook"
                  title="Facebook"
                >
                  <FacebookIcon />
                </a>
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn github"
                  title="GitHub"
                >
                  <GitHubIcon />
                </a>
              </div>

              <div className="team-info-reveal">
                <div className="info-row">
                  <span className="info-icon">📧</span>
                  <div>
                    <div className="info-label">Email</div>
                    <div className="info-value">{member.email}</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">📞</span>
                  <div>
                    <div className="info-label">Contact</div>
                    <div className="info-value">{member.contact}</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">🏫</span>
                  <div>
                    <div className="info-label">School</div>
                    <div className="info-value">{member.school}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <GreenSectionDivider />

      {/* ══ MISSION ══ */}
      <section className="section-light" data-section="mission" style={sectionFade('mission')}>
        <div className="tap-mark" />
        <div className="content-col">
          <div className="section-label" style={{ color: '#5a8a3a' }}>What Drives Us</div>
          <h2 className="section-heading dark">Our Mission</h2>
          <RingDivider />
          <p className="section-body dark">
            Our mission is to develop intelligent systems that enhance accuracy, efficiency, and
            decision-making through artificial intelligence and machine learning technologies. We aim
            to bridge the gap between traditional industry practices and modern AI-driven solutions —
            much like a skilled tapper who knows exactly where to score the bark for the richest yield.
          </p>
        </div>
        <LeafSVG style={{
          position: 'absolute', right: '8vw', top: '50%',
          transform: 'translateY(-50%) rotate(15deg)',
          width: 140, opacity: 0.12,
          animation: 'leafSway 7s ease-in-out infinite',
          transformOrigin: 'bottom center',
        }} />
      </section>

      <GreenSectionDivider />

      {/* ══ VISION ══ */}
      <section
        className="section-light"
        data-section="vision"
        style={{ ...sectionFade('vision'), background: '#edf5e5' }}
      >
        <div className="tap-mark" style={{ left: 'auto', right: '6vw' }} />
        <div className="content-col right">
          <div className="section-label" style={{ color: '#5a8a3a' }}>Our Horizon</div>
          <h2 className="section-heading dark">Our Vision</h2>
          <RingDivider />
          <p className="section-body dark">
            Our vision is to contribute to the advancement of smart technologies by building innovative
            systems that support sustainable development, economic growth, and technological transformation
            across industries — planting seeds of progress that will grow and branch into communities
            worldwide.
          </p>
        </div>
        <LeafSVG style={{
          position: 'absolute', left: '8vw', top: '50%',
          transform: 'translateY(-50%) rotate(-20deg) scaleX(-1)',
          width: 120, opacity: 0.1,
          animation: 'leafSway 9s ease-in-out infinite',
          transformOrigin: 'bottom center',
        }} />
      </section>

      <GreenSectionDivider />

      {/* ══ OBJECTIVES ══ */}
      <section className="section-objectives" data-section="objectives" style={sectionFade('objectives')}>
        <svg viewBox="0 0 120 200" className="obj-bg-leaf" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M60 195 C60 195 10 140 10 80 C10 30 60 5 60 5 C60 5 110 30 110 80 C110 140 60 195 60 195Z"
            fill="#7ec850"
          />
        </svg>

        <div className="section-label" style={{ color: '#5a8a3a' }}>What We Aim to Achieve</div>
        <h2 className="obj-heading">Our Objectives</h2>
        <p className="obj-body">
          To design a multi-task, image-based machine learning system that aids rubber farmers in
          examining the condition of the rubber trees, quality and quantity of the latex, as well as
          projected product output and other market values.
        </p>
        <blockquote className="obj-highlight">
          Enhancing productivity, decision-making, and financial results in rubber farming —
          one intelligent prediction at a time.
        </blockquote>
      </section>

      <GreenSectionDivider />

      <UserFooter />
    </>
  );
};

export default AboutUs;