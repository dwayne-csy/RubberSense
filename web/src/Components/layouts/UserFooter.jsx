import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoImage from '../logo/LOGO.png';

const UserFooter = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');

        .user-footer {
          background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%);
          color: white;
          margin-top: auto;
          font-family: 'DM Sans', sans-serif;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1.5rem;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .logo-area:hover {
          transform: translateY(-2px);
        }

        .footer-logo {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: logoGlow 3s ease-in-out infinite;
        }

        .footer-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }

        .footer-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .footer-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-nav-link {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.75);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
          letter-spacing: 0.2px;
          white-space: nowrap;
        }

        .footer-nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .footer-nav-sep {
          color: rgba(255, 255, 255, 0.25);
          font-size: 0.85rem;
          user-select: none;
        }

        .footer-divider {
          height: 1px;
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
        }

        .copyright {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .version {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.5px;
        }

        @keyframes logoGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.15);
          }
        }
      `}</style>

      <footer className="user-footer">
        <div className="footer-container">
          <div className="footer-content">

            <div className="logo-area" onClick={() => navigate('/home')}>
              <div className="footer-logo">
                <img src={LogoImage} alt="RubberSense Logo" className="footer-logo-img" />
              </div>
              <div className="footer-logo-text">RubberSense</div>
            </div>

            <nav className="footer-nav">
              <button className="footer-nav-link" onClick={() => navigate('/about')}>About Us</button>
              <span className="footer-nav-sep">·</span>
              <button className="footer-nav-link" onClick={() => navigate('/contact-us')}>Contact Us</button>
              <span className="footer-nav-sep">·</span>
              <button className="footer-nav-link" onClick={() => navigate('/about-rubber')}>About Rubber</button>
              <span className="footer-nav-sep">·</span>
              <button className="footer-nav-link" onClick={() => navigate('/market')}>Market Page</button>
              <span className="footer-nav-sep">·</span>
              <button className="footer-nav-link" onClick={() => navigate('/analysis/history')}>Recent Analysis</button>
            </nav>

            <div className="footer-divider" />

            <div className="copyright">
              © {currentYear} RubberSense AI. All rights reserved.
            </div>

            <div className="version">
              Version 1.0.0 • Powering Sustainable Rubber Production
            </div>

          </div>
        </div>
      </footer>
    </>
  );
};

export default UserFooter;