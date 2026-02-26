// RubberSense/web/src/Components/landingpage/LandingHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingChatbotWidget from './LandingChatbotWidget';
import LandingHeader from './LandingHeader';

const LandingHome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  // Generate a unique session ID for this user
  const [chatSessionId] = useState(() => `landing-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const slides = [
    {
      id: 1,
      video: '/src/Components/slidingpics/slide1.mp4',
      alt: 'Rubber Tree Plantation',
      title: 'Efficient Tree Tapping Operations',
      description: 'Professional latex extraction with modern technology'
    },
    {
      id: 2,
      video: '/src/Components/slidingpics/slide2.mp4',
      alt: 'Latex Collection',
      title: 'Premium Latex Collection',
      description: 'High-quality latex from healthy rubber trees'
    },
    {
      id: 3,
      video: '/src/Components/slidingpics/slide3.mp4',
      alt: 'Plantation Management',
      title: 'Smart Plantation Management',
      description: 'Advanced monitoring for optimal growth conditions'
    },
    {
      id: 4,
      video: '/src/Components/slidingpics/slide4.mp4',
      alt: 'Sustainable Farming',
      title: 'Sustainable Rubber Farming',
      description: 'Eco-friendly practices for long-term yield'
    }
  ];

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options));
      const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
    };

    updateDateTime();
    const timeInterval = setInterval(updateDateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleLearnMore = () => navigate('/login');
  const handleFeatureClick = () => navigate('/login');
  
  // Toggle chat function
  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      
      <div style={{ minHeight: '100vh', background: '#f5f9f5', position: 'relative', fontFamily: "'DM Sans', sans-serif" }}>
        
        {/* Add the LandingHeader here - at the very top of the content */}
        <LandingHeader />

        {/* ===================== HERO CAROUSEL ===================== */}
        <div style={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#0d2818'
        }}>
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                opacity: index === currentSlide ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                pointerEvents: index === currentSlide ? 'auto' : 'none'
              }}
            >
              <video
                key={slide.video}
                autoPlay muted loop playsInline
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              >
                <source src={slide.video} type="video/mp4" />
              </video>

              {/* Multi-layer overlay for depth */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(13,40,24,0.75) 0%, rgba(13,40,24,0.3) 50%, rgba(13,40,24,0.6) 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,40,24,0.9) 0%, transparent 50%)' }} />

              {/* Decorative leaf pattern overlay */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(74,181,74,0.08) 0%, transparent 50%)', pointerEvents: 'none' }} />

              {/* Hero Text Content */}
              <div style={{
                position: 'absolute',
                bottom: '120px',
                left: '8%',
                zIndex: 2,
                maxWidth: '640px',
                animation: 'heroSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) both'
              }}>
                {/* Welcome to RubberSense - Added above the slide title */}
                <div style={{
                  fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
                  color: '#4ab54a',
                  fontWeight: '600',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  Welcome to RubberSense
                </div>
                
                <h2 style={{
                  fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
                  marginBottom: '16px',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: '1.15',
                  textShadow: '0 2px 20px rgba(0,0,0,0.3)'
                }}>
                  {slide.title}
                </h2>

                <p style={{
                  fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                  marginBottom: '36px',
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: '1.7',
                  fontWeight: '300'
                }}>
                  {slide.description}
                </p>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <button
                    onClick={handleLearnMore}
                    style={{
                      background: 'linear-gradient(135deg, #4ab54a, #2d6a4f)',
                      color: 'white',
                      padding: '14px 32px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      letterSpacing: '0.5px',
                      boxShadow: '0 8px 24px rgba(74,181,74,0.35)',
                      fontFamily: "'DM Sans', sans-serif"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(74,181,74,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,181,74,0.35)'; }}
                  >
                    Get Started →
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Prev Arrow */}
          <button
            onClick={goToPrevSlide}
            style={{
              position: 'absolute', left: '28px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
              color: 'white', border: '1px solid rgba(255,255,255,0.15)',
              width: '52px', height: '52px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: '300', zIndex: 10,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,181,74,0.5)'; e.currentTarget.style.borderColor = '#4ab54a'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >‹</button>

          {/* Next Arrow */}
          <button
            onClick={goToNextSlide}
            style={{
              position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
              color: 'white', border: '1px solid rgba(255,255,255,0.15)',
              width: '52px', height: '52px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: '300', zIndex: 10,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,181,74,0.5)'; e.currentTarget.style.borderColor = '#4ab54a'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >›</button>

          {/* Dot Indicators */}
          <div style={{
            position: 'absolute', bottom: '40px', left: '8%',
            display: 'flex', gap: '10px', zIndex: 10, alignItems: 'center'
          }}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  width: index === currentSlide ? '36px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: index === currentSlide ? '#4ab54a' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.4s ease',
                  padding: 0
                }}
              />
            ))}
          </div>

          {/* Scroll indicator */}
          <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 10, opacity: 0.6 }}>
            <span style={{ color: 'white', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Scroll</span>
            <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, white, transparent)', animation: 'scrollPulse 2s ease-in-out infinite' }}></div>
          </div>
        </div>

        {/* ===================== MAIN CONTENT ===================== */}
        <div style={{ background: '#f5f9f5' }}>

          {/* ── WELCOME SECTION ── */}
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '100px 40px 80px' }}>

            {/* Welcome to RubberSense heading for the main content */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div style={{
                color: '#4ab54a',
                fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
                fontWeight: '600',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                Welcome to RubberSense
              </div>
              <h2 style={{
                color: '#0d2818',
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontFamily: "'Playfair Display', serif",
                fontWeight: '700',
                margin: 0,
                lineHeight: '1.2'
              }}>
                AI-Powered Rubber Tree Intelligence
              </h2>
              <p style={{ color: '#4a6455', fontSize: '1rem', marginTop: '16px', fontWeight: '300', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                Transform your rubber plantation management with cutting-edge AI technology
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
              {/* Left: Text */}
              <div>
                <h2 style={{
                  color: '#0d2818',
                  fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
                  fontWeight: '700',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  lineHeight: '1.2',
                  marginBottom: '24px'
                }}>
                  AI-Powered{' '}
                  <span style={{ color: '#2d6a4f', fontStyle: 'italic' }}>Rubber Tree Detection</span>
                  {' '}at Your Fingertips
                </h2>

                <p style={{ color: '#4a6455', fontSize: '1.05rem', lineHeight: '1.85', marginBottom: '16px', fontWeight: '300' }}>
                  Upload or scan a photo of rubber tree <strong>leaves, trunks, or latex</strong> and our machine learning model will instantly identify quality, detect diseases, assess health, and provide actionable recommendations.
                </p>

                <p style={{ color: '#2d6a4f', fontSize: '1rem', fontWeight: '600', marginBottom: '32px' }}>
                  Scan. Detect. Recommend — Powered by Advanced ML
                </p>

                {/* Feature grid - all click to login except AI Assistant which opens chat */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[
                    { icon: '🧪', label: 'Latex Detection' },
                    { icon: '🌳', label: 'Trunk Analysis' },
                    { icon: '🤖', label: 'AI Assistant', action: 'chat' }, // Special action for chat
                    { icon: '🌤️', label: 'Weather Monitoring' },
                    { icon: '🍃', label: 'Leaf Detection' },
                    { icon: '📝', label: 'Community Blogspot' },
                    { icon: '🗺️', label: 'Plantation Mapping' }
                  ].map((feature, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (feature.action === 'chat') {
                          toggleChat(); // Open chat for AI Assistant
                        } else {
                          navigate('/login'); // Navigate to login for all other features
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '13px 16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: feature.action === 'chat' ? '2px solid #4ab54a' : '1px solid #d8eed8',
                        color: '#0d2818',
                        fontSize: '0.9rem',
                        fontWeight: feature.action === 'chat' ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: feature.action === 'chat' ? '0 4px 12px rgba(74,181,74,0.2)' : '0 2px 8px rgba(45,106,79,0.05)',
                        userSelect: 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (feature.action === 'chat') {
                          e.currentTarget.style.background = '#2d6a4f';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(74,181,74,0.35)';
                          e.currentTarget.style.borderColor = '#2d6a4f';
                        } else {
                          e.currentTarget.style.background = '#2d6a4f';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(45,106,79,0.25)';
                          e.currentTarget.style.borderColor = '#2d6a4f';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (feature.action === 'chat') {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.color = '#0d2818';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(74,181,74,0.2)';
                          e.currentTarget.style.borderColor = '#4ab54a';
                        } else {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.color = '#0d2818';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,106,79,0.05)';
                          e.currentTarget.style.borderColor = '#d8eed8';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{feature.icon}</span>
                        <span>{feature.label}</span>
                      </div>
                      {feature.action === 'chat' ? (
                        <span style={{ fontSize: '0.75rem', animation: 'pulse 2s ease-in-out infinite' }}>💬</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Stacked images with badge */}
              <div style={{ position: 'relative', minHeight: '560px' }}>
                {/* Top image */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '85%', height: '300px',
                  borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 24px 48px rgba(13,40,24,0.2)',
                  border: '4px solid white'
                }}>
                  <img
                    src="/src/Components/aboutrubber/latexproduct.jpg"
                    alt="Latex Product"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/480x300/2d6a4f/ffffff?text=Latex+Product'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,40,24,0.3) 0%, transparent 60%)' }}></div>
                </div>

                {/* Bottom image */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: '75%', height: '260px',
                  borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 24px 48px rgba(13,40,24,0.2)',
                  border: '4px solid white'
                }}>
                  <img
                    src="/src/Components/aboutrubber/rubbertree.jpg"
                    alt="Rubber Tree Plantation"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/380x260/1b4332/ffffff?text=Rubber+Tree'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,40,24,0.3) 0%, transparent 60%)' }}></div>
                </div>

                {/* Decorative circle */}
                <div style={{
                  position: 'absolute', top: '-30px', left: '-20px',
                  width: '180px', height: '180px',
                  background: 'radial-gradient(circle, rgba(74,181,74,0.12), transparent)',
                  borderRadius: '50%', zIndex: -1
                }}></div>
                <div style={{
                  position: 'absolute', bottom: '-20px', right: '30px',
                  width: '120px', height: '120px',
                  background: 'radial-gradient(circle, rgba(45,106,79,0.12), transparent)',
                  borderRadius: '50%', zIndex: -1
                }}></div>
              </div>
            </div>
          </div>

          {/* Attractive Green Line Divider */}
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 40px'
          }}>
            <div style={{
              position: 'relative',
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, #4ab54a 20%, #2d6a4f 50%, #4ab54a 80%, transparent 100%)',
              marginBottom: '20px'
            }} />
            
            {/* Decorative leaf icon in the center */}
            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '-22px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: '#f5f9f5',
                padding: '0 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.5rem', color: '#2d6a4f', animation: 'pulse 2s ease-in-out infinite' }}></span>
                <span style={{ fontSize: '1rem', color: '#4a6455', fontWeight: '300', letterSpacing: '2px' }}></span>
                <span style={{ fontSize: '1.5rem', color: '#2d6a4f', animation: 'pulse 2s ease-in-out infinite' }}></span>
              </div>
            </div>

            {/* Double line effect for extra visual appeal */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(74,181,74,0.3), rgba(45,106,79,0.5), rgba(74,181,74,0.3), transparent)',
              marginTop: '-10px',
              marginBottom: '40px'
            }} />
          </div>
        </div>
      </div>

      {/* Landing Chatbot Widget - Only for AI Assistant */}
      <LandingChatbotWidget 
        isOpen={isChatOpen}
        onClose={toggleChat}
        sessionId={chatSessionId}
      />

      {/* Optional Floating Chat Button - appears only when chat is closed */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0a1f0a, #166534)',
            border: '2px solid rgba(74,181,74,0.3)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 0 15px rgba(74,181,74,0.3)',
            cursor: 'pointer',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'all 0.3s ease',
            animation: 'float 3s ease-in-out infinite, glow 2.5s ease-in-out infinite',
            padding: 0,
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(-5deg)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4), 0 0 25px rgba(74,181,74,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3), 0 0 15px rgba(74,181,74,0.3)';
          }}
          title="Chat with RubberSense AI"
        >
          <span style={{ 
            transform: 'scaleX(-1)', 
            display: 'inline-block',
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))'
          }}>
            🤖
          </span>
        </button>
      )}

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { box-sizing: border-box; }
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 10px 25px rgba(0,0,0,0.3), 0 0 15px rgba(74,181,74,0.3); }
          50% { box-shadow: 0 15px 35px rgba(0,0,0,0.4), 0 0 30px rgba(74,181,74,0.6); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f5f9f5; }
        ::-webkit-scrollbar-thumb { background: #c8e6c9; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2d6a4f; }
      `}</style>
    </>
  );
};

export default LandingHome;