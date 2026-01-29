import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';

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
        background: '#f8f9fa' 
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #2d6a4f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ 
          marginTop: '20px',
          color: '#2d6a4f',
          fontSize: '16px' 
        }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      position: 'relative'
    }}>
      {/* User Header Component */}
      <UserHeader />
      
      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        minHeight: 'calc(100vh - 64px)',
      }}>
        {/* Page Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '50px'
        }}>
          <h1 style={{
            color: '#2d6a4f',
            fontSize: '3rem',
            marginBottom: '15px',
            fontWeight: '700'
          }}>
            About RubberSense
          </h1>
          <p style={{
            color: '#666',
            fontSize: '1.2rem',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Revolutionizing rubber tree cultivation through intelligent technology and AI-powered analysis.
          </p>
        </div>

        {/* Mission Statement */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          marginBottom: '50px',
          border: '1px solid #e8f5e9'
        }}>
          <h2 style={{
            color: '#2d6a4f',
            fontSize: '2rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{
              background: '#2d6a4f',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>🎯</span>
            Our Mission
          </h2>
          <p style={{
            color: '#555',
            fontSize: '1.1rem',
            lineHeight: '1.8',
            marginBottom: '30px'
          }}>
            At RubberSense, we're dedicated to transforming rubber tree farming through cutting-edge 
            technology. Our mission is to provide farmers with intelligent tools for precise latex 
            detection and tree health monitoring, maximizing yield while promoting sustainable practices.
          </p>
        </div>

        {/* Technology Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {/* Latex Detection Card */}
          <div style={{
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease',
            cursor: 'pointer',
            ':hover': {
              transform: 'translateY(-5px)'
            }
          }}>
            <div style={{
              background: '#2d6a4f',
              color: 'white',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              💧
            </div>
            <h3 style={{
              color: '#1b4332',
              fontSize: '1.5rem',
              marginBottom: '15px',
              fontWeight: '600'
            }}>
              Latex Detection Technology
            </h3>
            <p style={{
              color: '#555',
              lineHeight: '1.7',
              marginBottom: '20px'
            }}>
              Our advanced computer vision system detects latex flow with 95% accuracy using 
              high-resolution imaging and machine learning algorithms.
            </p>
            
            <div style={{
              background: 'rgba(45, 106, 79, 0.1)',
              borderRadius: '10px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h4 style={{
                color: '#2d6a4f',
                fontSize: '1.1rem',
                marginBottom: '10px',
                fontWeight: '600'
              }}>
              Key Features:
              </h4>
              <ul style={{
                color: '#666',
                paddingLeft: '20px',
                lineHeight: '1.8'
              }}>
                <li>Real-time latex flow monitoring</li>
                <li>Yield prediction algorithms</li>
                <li>Quality assessment based on color and viscosity</li>
                <li>Automated collection timing recommendations</li>
                <li>Historical data analysis and trends</li>
              </ul>
            </div>
          </div>

          {/* Rubber Tree Detection Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease',
            cursor: 'pointer',
            ':hover': {
              transform: 'translateY(-5px)'
            }
          }}>
            <div style={{
              background: '#4caf50',
              color: 'white',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              🌳
            </div>
            <h3 style={{
              color: '#1b5e20',
              fontSize: '1.5rem',
              marginBottom: '15px',
              fontWeight: '600'
            }}>
              Rubber Tree Health Monitoring
            </h3>
            <p style={{
              color: '#555',
              lineHeight: '1.7',
              marginBottom: '20px'
            }}>
              Comprehensive tree health analysis using multispectral imaging and AI-driven diagnostics 
              to ensure optimal growth conditions.
            </p>
            
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '10px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h4 style={{
                color: '#4caf50',
                fontSize: '1.1rem',
                marginBottom: '10px',
                fontWeight: '600'
              }}>
              Monitoring Capabilities:
              </h4>
              <ul style={{
                color: '#666',
                paddingLeft: '20px',
                lineHeight: '1.8'
              }}>
                <li>Disease detection and prevention</li>
                <li>Growth rate tracking</li>
                <li>Soil health correlation analysis</li>
                <li>Weather impact assessment</li>
                <li>Pruning and maintenance scheduling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Information Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          marginBottom: '50px'
        }}>
          <h2 style={{
            color: '#2d6a4f',
            fontSize: '2rem',
            marginBottom: '30px',
            textAlign: 'center',
            position: 'relative',
            paddingBottom: '15px'
          }}>
            <span style={{
              position: 'absolute',
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '4px',
              background: '#2d6a4f',
              borderRadius: '2px'
            }}></span>
            Technology Deep Dive
          </h2>

          {/* Latex Detection Details */}
          <div style={{
            marginBottom: '40px'
          }}>
            <h3 style={{
              color: '#1b4332',
              fontSize: '1.8rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <span style={{
                background: '#e8f5e9',
                color: '#2d6a4f',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>🔬</span>
              How Latex Detection Works
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: '#f1f8e9',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #2d6a4f'
              }}>
                <h4 style={{
                  color: '#2d6a4f',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>Image Capture</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  High-resolution cameras capture latex flow in real-time with specialized lighting.
                </p>
              </div>
              
              <div style={{
                background: '#f1f8e9',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #2d6a4f'
              }}>
                <h4 style={{
                  color: '#2d6a4f',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>AI Processing</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Machine learning models analyze images to detect latex presence and quality.
                </p>
              </div>
              
              <div style={{
                background: '#f1f8e9',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #2d6a4f'
              }}>
                <h4 style={{
                  color: '#2d6a4f',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>Yield Estimation</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Algorithms calculate latex volume and predict total yield based on flow patterns.
                </p>
              </div>
              
              <div style={{
                background: '#f1f8e9',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #2d6a4f'
              }}>
                <h4 style={{
                  color: '#2d6a4f',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>Quality Analysis</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Color and consistency analysis determines latex quality for optimal pricing.
                </p>
              </div>
            </div>
          </div>

          {/* Tree Detection Details */}
          <div>
            <h3 style={{
              color: '#1b4332',
              fontSize: '1.8rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <span style={{
                background: '#e8f5e9',
                color: '#2d6a4f',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>📊</span>
              Advanced Tree Health Monitoring
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: '#f9fbe7',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #4caf50'
              }}>
                <h4 style={{
                  color: '#4caf50',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>Multispectral Imaging</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Captures data beyond visible light to detect early signs of stress or disease.
                </p>
              </div>
              
              <div style={{
                background: '#f9fbe7',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #4caf50'
              }}>
                <h4 style={{
                  color: '#4caf50',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>Growth Tracking</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Monitors tree growth patterns and identifies optimal harvest times.
                </p>
              </div>
              
              <div style={{
                background: '#f9fbe7',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #4caf50'
              }}>
                <h4 style={{
                  color: '#4caf50',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>Disease Prevention</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Early detection of common rubber tree diseases with treatment recommendations.
                </p>
              </div>
              
              <div style={{
                background: '#f9fbe7',
                padding: '20px',
                borderRadius: '12px',
                borderLeft: '4px solid #4caf50'
              }}>
                <h4 style={{
                  color: '#4caf50',
                  marginBottom: '10px',
                  fontSize: '1.1rem'
                }}>Environmental Analysis</h4>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Correlates tree health with soil conditions, weather, and microclimate data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div style={{
          background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
          borderRadius: '20px',
          padding: '50px 40px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.2rem',
            marginBottom: '30px',
            fontWeight: '600'
          }}>
            Benefits for Rubber Farmers
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            marginTop: '40px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '15px'
              }}>📈</div>
              <h3 style={{
                fontSize: '1.3rem',
                marginBottom: '10px'
              }}>Increased Yield</h3>
              <p style={{
                opacity: '0.9',
                fontSize: '0.95rem'
              }}>
                Optimize latex collection timing and maximize production efficiency.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '15px'
              }}>💰</div>
              <h3 style={{
                fontSize: '1.3rem',
                marginBottom: '10px'
              }}>Cost Reduction</h3>
              <p style={{
                opacity: '0.9',
                fontSize: '0.95rem'
              }}>
                Reduce labor costs and minimize resource waste through precision farming.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '15px'
              }}>🌱</div>
              <h3 style={{
                fontSize: '1.3rem',
                marginBottom: '10px'
              }}>Sustainable Practices</h3>
              <p style={{
                opacity: '0.9',
                fontSize: '0.95rem'
              }}>
                Promote environmental sustainability with data-driven resource management.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '15px'
              }}>🤖</div>
              <h3 style={{
                fontSize: '1.3rem',
                marginBottom: '10px'
              }}>AI-Powered Insights</h3>
              <p style={{
                opacity: '0.9',
                fontSize: '0.95rem'
              }}>
                Get actionable recommendations based on real-time data and historical trends.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section (Optional) */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px'
        }}>
          <h2 style={{
            color: '#2d6a4f',
            fontSize: '2rem',
            marginBottom: '20px'
          }}>
            Our Vision
          </h2>
          <p style={{
            color: '#666',
            fontSize: '1.1rem',
            maxWidth: '800px',
            margin: '0 auto 40px',
            lineHeight: '1.8'
          }}>
            We envision a future where every rubber farmer has access to intelligent technology 
            that transforms traditional farming into precision agriculture, ensuring sustainable 
            production and improved livelihoods for generations to come.
          </p>
          
          <button
            onClick={() => navigate('/latex-detection')}
            style={{
              background: 'linear-gradient(135deg, #2d6a4f 0%, #4caf50 100%)',
              color: 'white',
              border: 'none',
              padding: '15px 40px',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              boxShadow: '0 4px 15px rgba(45, 106, 79, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(45, 106, 79, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(45, 106, 79, 0.3)';
            }}
          >
            Try Latex Detection →
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
          
          .main-title {
            font-size: 2.5rem;
          }
          
          .card-container {
            padding: 20px;
          }
        }
        
        @media (max-width: 480px) {
          .main-title {
            font-size: 2rem;
          }
          
          .section-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutUs;