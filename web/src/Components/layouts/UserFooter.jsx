import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoImage from '../logo/LOGO.png';

const UserFooter = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        .user-footer {
          background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%);
          color: white;
          margin-top: auto;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
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
        }

        .footer-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }

        .footer-logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .ai-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .copyright {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .footer-divider {
          height: 1px;
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0.5rem 0;
        }

        .version {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.5px;
        }

        /* Animation for logo */
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

        .footer-logo {
          animation: logoGlow 3s ease-in-out infinite;
        }
      `}</style>

      <footer className="user-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="logo-area" onClick={() => navigate('/home')}>
              <div className="footer-logo">
                <img src={LogoImage} alt="RubberSense Logo" className="footer-logo-img" />
              </div>
              <div className="footer-logo-text">
                RubberSense
               
              </div>
            </div>
            
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