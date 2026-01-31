import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

const AboutUs = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, API_BASE_URL]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' 
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '5px solid rgba(76, 175, 80, 0.2)',
          borderTop: '5px solid #4caf50',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ 
          marginTop: '25px',
          color: '#4caf50',
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}>
          Loading RubberSense...
        </p>
      </div>
    );
  }

  const features = [
    {
      icon: "🌳",
      title: "Rubber Tree Identification",
      description: "AI-powered identification of rubber tree species and clones",
      color: "#10b981"
    },
    {
      icon: "📏",
      title: "Trunk Characteristics Analysis",
      description: "Precise measurement of girth, bark texture, and color analysis",
      color: "#059669"
    },
    {
      icon: "🛡️",
      title: "Disease Detection",
      description: "Early detection of tree diseases with preventive recommendations",
      color: "#14b8a6"
    },
    {
      icon: "⚡",
      title: "Tappability Assessment",
      description: "Smart evaluation of tree readiness for latex extraction",
      color: "#06b6d4"
    },
    {
      icon: "🧠",
      title: "Latex Quality Prediction",
      description: "Predict latex quality before extraction using tree-based analysis",
      color: "#0ea5e9"
    },
    {
      icon: "💧",
      title: "Latex Flow Estimation",
      description: "Estimate flow intensity (weak, moderate, strong) for optimal timing",
      color: "#3b82f6"
    }
  ];

  const latexFeatures = [
    {
      icon: "🎨",
      title: "Color Analysis",
      description: "Milky white to golden yellow classification",
      color: "#f59e0b"
    },
    {
      icon: "🧪",
      title: "Quality Classification",
      description: "High-class vs low-class latex identification",
      color: "#f97316"
    },
    {
      icon: "🛡️",
      title: "Contamination Detection",
      description: "Water and impurity detection in latex samples",
      color: "#ef4444"
    },
    {
      icon: "📦",
      title: "Yield Estimation",
      description: "Product quantity estimation from collected latex",
      color: "#ec4899"
    },
    {
      icon: "💰",
      title: "Market Price Estimation",
      description: "Real-time market value based on latex quality",
      color: "#d946ef"
    },
    {
      icon: "📊",
      title: "Product Recommendation",
      description: "Optimal product suggestions based on latex characteristics",
      color: "#a855f7"
    }
  ];

  const benefits = [
    { icon: "📈", title: "30% Higher Yield", desc: "Optimized tapping schedules", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
    { icon: "💰", title: "20% Cost Reduction", desc: "Reduced labor and resource waste", gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" },
    { icon: "🎯", title: "95% Accuracy", desc: "AI-powered precision analysis", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
    { icon: "🌿", title: "Sustainable", desc: "Eco-friendly farming practices", gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" },
    { icon: "⚡", title: "Real-time", desc: "Instant analysis and recommendations", gradient: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)" },
    { icon: "📊", title: "Data-driven", desc: "Actionable insights and trends", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }
  ];

  return (
    <>
      {/* User Header Component */}
      <UserHeader />
      
      {/* Main Content */}
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 20px 80px',
          minHeight: 'calc(100vh - 134px)', // Adjusted for header and footer
        }}>
          {/* Hero Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '70px',
            padding: '60px 30px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
            borderRadius: '32px',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 100px rgba(16, 185, 129, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated background effect */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite'
            }}></div>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '10px 28px',
              borderRadius: '50px',
              marginBottom: '30px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              position: 'relative',
              zIndex: 1
            }}>
              <span style={{ fontSize: '20px' }}>✨</span>
              <span style={{
                color: 'white',
                fontWeight: '700',
                fontSize: '1rem',
                letterSpacing: '1px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                AI-POWERED RUBBER TREE ANALYTICS
              </span>
            </div>
            
            <h1 style={{
              color: '#ffffff',
              fontSize: '4rem',
              marginBottom: '25px',
              fontWeight: '900',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 80px rgba(16, 185, 129, 0.5)',
              position: 'relative',
              zIndex: 1
            }}>
              RubberSense AI
            </h1>
            
            <p style={{
              color: '#e2e8f0',
              fontSize: '1.4rem',
              maxWidth: '900px',
              margin: '0 auto 40px',
              lineHeight: '1.8',
              fontWeight: '400',
              position: 'relative',
              zIndex: 1
            }}>
              Revolutionizing rubber plantation management through advanced computer vision 
              and machine learning. Our dual-module system provides complete analysis from 
              tree health to latex valuation.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              <button
                onClick={() => navigate('/latex-detection')}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '18px 40px',
                  borderRadius: '50px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.2)';
                }}
              >
                <span style={{ fontSize: '24px' }}>💧</span>
                Try Latex Analysis
              </button>
              
              <button
                onClick={() => navigate('/trunks-detection')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '2px solid #10b981',
                  padding: '18px 40px',
                  borderRadius: '50px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backdropFilter: 'blur(10px)',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.2)';
                }}
              >
                <span style={{ fontSize: '24px' }}>🌳</span>
                Analyze Trunks
              </button>
            </div>
          </div>

          {/* Two Module System */}
          <div style={{
            marginBottom: '70px'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '50px'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '3rem',
                marginBottom: '20px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Dual-Module Intelligent System
              </h2>
              <p style={{
                color: '#cbd5e1',
                fontSize: '1.2rem',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                Complete rubber plantation management powered by AI
              </p>
            </div>

            {/* Module Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '40px',
              marginBottom: '60px'
            }}>
              {/* Module A */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 100px rgba(16, 185, 129, 0.1)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 120px rgba(16, 185, 129, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 100px rgba(16, 185, 129, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    width: '70px',
                    height: '70px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
                  }}>
                    🌳
                  </div>
                  <div>
                    <div style={{
                      color: '#10b981',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      letterSpacing: '2px',
                      marginBottom: '5px'
                    }}>
                      MODULE A
                    </div>
                    <h3 style={{
                      color: '#ffffff',
                      fontSize: '1.8rem',
                      fontWeight: '800',
                      margin: 0
                    }}>
                      Rubber Tree Analysis
                    </h3>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gap: '16px',
                  marginBottom: '25px'
                }}>
                  {features.map((feature, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '15px',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                      <div style={{
                        flexShrink: 0,
                        fontSize: '28px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)`,
                        borderRadius: '12px'
                      }}>
                        {feature.icon}
                      </div>
                      <div>
                        <div style={{
                          color: '#ffffff',
                          fontWeight: '700',
                          marginBottom: '6px',
                          fontSize: '1.05rem'
                        }}>
                          {feature.title}
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '0.9rem',
                          lineHeight: '1.6'
                        }}>
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module B */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 100px rgba(59, 130, 246, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 120px rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 100px rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    width: '70px',
                    height: '70px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
                  }}>
                    💧
                  </div>
                  <div>
                    <div style={{
                      color: '#3b82f6',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      letterSpacing: '2px',
                      marginBottom: '5px'
                    }}>
                      MODULE B
                    </div>
                    <h3 style={{
                      color: '#ffffff',
                      fontSize: '1.8rem',
                      fontWeight: '800',
                      margin: 0
                    }}>
                      Latex Quality Analysis
                    </h3>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gap: '16px'
                }}>
                  {latexFeatures.map((feature, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '15px',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                      <div style={{
                        flexShrink: 0,
                        fontSize: '28px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)`,
                        borderRadius: '12px'
                      }}>
                        {feature.icon}
                      </div>
                      <div>
                        <div style={{
                          color: '#ffffff',
                          fontWeight: '700',
                          marginBottom: '6px',
                          fontSize: '1.05rem'
                        }}>
                          {feature.title}
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '0.9rem',
                          lineHeight: '1.6'
                        }}>
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div style={{
            marginBottom: '70px'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '50px'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '3rem',
                marginBottom: '20px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Transform Your Rubber Farm
              </h2>
              <p style={{
                color: '#cbd5e1',
                fontSize: '1.2rem',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                Experience the power of AI-driven precision agriculture
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '30px'
            }}>
              {benefits.map((benefit, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '24px',
                  padding: '40px',
                  textAlign: 'center',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 25px',
                    background: benefit.gradient,
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                  }}>
                    {benefit.icon}
                  </div>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '1.4rem',
                    marginBottom: '12px',
                    fontWeight: '700'
                  }}>
                    {benefit.title}
                  </h3>
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    fontWeight: '400'
                  }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '32px',
            padding: '60px 40px',
            color: 'white',
            marginBottom: '70px',
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3), 0 0 100px rgba(16, 185, 129, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }}></div>

            <div style={{
              textAlign: 'center',
              marginBottom: '50px',
              position: 'relative',
              zIndex: 1
            }}>
              <h2 style={{
                fontSize: '3rem',
                marginBottom: '20px',
                fontWeight: '800',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}>
                How RubberSense Works
              </h2>
              <p style={{
                fontSize: '1.2rem',
                maxWidth: '800px',
                margin: '0 auto',
                opacity: '0.95'
              }}>
                Simple three-step process to optimize your rubber production
            </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '35px',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Step 1 */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '40px',
                borderRadius: '24px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.25)',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-20px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#1e293b',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.5rem',
                  boxShadow: '0 5px 20px rgba(251, 191, 36, 0.5)'
                }}>
                  1
                </div>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '25px',
                  textAlign: 'center'
                }}>
                  📸
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  marginBottom: '18px',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  Capture Images
                </h3>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  textAlign: 'center',
                  opacity: '0.95'
                }}>
                  Upload photos of rubber trees or latex samples through our intuitive interface
                </p>
              </div>

              {/* Step 2 */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '40px',
                borderRadius: '24px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.25)',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-20px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#1e293b',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.5rem',
                  boxShadow: '0 5px 20px rgba(251, 191, 36, 0.5)'
                }}>
                  2
                </div>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '25px',
                  textAlign: 'center'
                }}>
                  🤖
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  marginBottom: '18px',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  AI Analysis
                </h3>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  textAlign: 'center',
                  opacity: '0.95'
                }}>
                  Our advanced algorithms process images to provide detailed insights and predictions
                </p>
              </div>

              {/* Step 3 */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '40px',
                borderRadius: '24px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.25)',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-20px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#1e293b',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.5rem',
                  boxShadow: '0 5px 20px rgba(251, 191, 36, 0.5)'
                }}>
                  3
                </div>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '25px',
                  textAlign: 'center'
                }}>
                  📊
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  marginBottom: '18px',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  Get Results
                </h3>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  textAlign: 'center',
                  opacity: '0.95'
                }}>
                  Receive actionable recommendations, yield predictions, and market valuations
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div style={{
            textAlign: 'center',
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
            borderRadius: '32px',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite'
            }}></div>

            <div style={{ 
              fontSize: '64px', 
              marginBottom: '25px',
              position: 'relative',
              zIndex: 1
            }}>🎯</div>
            
            <h2 style={{
              color: '#ffffff',
              fontSize: '3rem',
              marginBottom: '25px',
              fontWeight: '800',
              position: 'relative',
              zIndex: 1
            }}>
              Ready to Transform Your Rubber Farm?
            </h2>
            
            <p style={{
              color: '#cbd5e1',
              fontSize: '1.2rem',
              maxWidth: '800px',
              margin: '0 auto 40px',
              lineHeight: '1.8',
              position: 'relative',
              zIndex: 1
            }}>
              Join hundreds of farmers who have already increased their yield and profitability 
              with RubberSense AI. Start with our free trial today.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              <button
                onClick={() => navigate('/home')}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '20px 50px',
                  borderRadius: '50px',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 40px rgba(139, 92, 246, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 15px 50px rgba(139, 92, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(139, 92, 246, 0.5)';
                }}
              >
                <span style={{ fontSize: '24px' }}>📈</span>
                Go to Home
              </button>
              
              <button
                onClick={() => navigate('/about-rubber')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '2px solid #8b5cf6',
                  padding: '20px 50px',
                  borderRadius: '50px',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backdropFilter: 'blur(10px)',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#a78bfa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#8b5cf6';
                }}
              >
                <span style={{ fontSize: '24px' }}>🧠</span>
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
            50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8); }
          }
          
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
          
          @media (max-width: 1024px) {
            h1 {
              font-size: 3rem !important;
            }
            
            h2 {
              font-size: 2.2rem !important;
            }
          }
          
          @media (max-width: 768px) {
            h1 {
              font-size: 2.5rem !important;
            }
            
            h2 {
              font-size: 1.8rem !important;
            }
            
            p {
              font-size: 1rem !important;
            }
            
            button {
              padding: 16px 32px !important;
              font-size: 1rem !important;
            }
          }
          
          @media (max-width: 480px) {
            h1 {
              font-size: 2rem !important;
            }
            
            h2 {
              font-size: 1.5rem !important;
            }
            
            .cta-buttons {
              flex-direction: column;
              align-items: stretch;
            }
            
            .cta-buttons button {
              width: 100%;
              justify-content: center;
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }
          
          /* Smooth scroll */
          html {
            scroll-behavior: smooth;
          }
        `}</style>
      </div>

      {/* User Footer Component */}
      <UserFooter />
    </>
  );
};

export default AboutUs;