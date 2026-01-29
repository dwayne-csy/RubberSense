import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const messagesEndRef = useRef(null);
  const slideIntervalRef = useRef(null);
  const mapIframeRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Import your slide images - adjust the paths as needed
  const slides = [
    {
      id: 1,
      image: '/src/Components/slidingpics/slide1.jpg',
      alt: 'Rubber Tree Plantation',
      title: 'Efficient Tree Tapping Operations',
      description: 'Professional latex extraction with modern technology'
    },
    {
      id: 2,
      image: '/src/Components/slidingpics/slide2.jpg',
      alt: 'Latex Collection',
      title: 'Premium Latex Collection',
      description: 'High-quality latex from healthy rubber trees'
    },
    {
      id: 3,
      image: '/src/Components/slidingpics/slide4.jpg',
      alt: 'Plantation Management',
      title: 'Smart Plantation Management',
      description: 'Advanced monitoring for optimal growth conditions'
    },
    {
      id: 4,
      image: '/src/Components/slidingpics/slide5.jpg',
      alt: 'Sustainable Farming',
      title: 'Sustainable Rubber Farming',
      description: 'Eco-friendly practices for long-term yield'
    }
  ];

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

  // Auto slide functionality
  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [slides.length]);

  // Update current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Format date
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
      
      // Format time
      const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      };
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
    };

    updateDateTime();
    const timeInterval = setInterval(updateDateTime, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Get user's location and weather
  useEffect(() => {
    if (loading) return;

    const fetchUserLocationAndWeather = async () => {
      try {
        // First get weather data from backend
        const weatherResponse = await axios.get(`${API_BASE_URL}/api/v1/weather`);
        if (weatherResponse.data.success) {
          setWeather(weatherResponse.data.weather);
          setForecast(weatherResponse.data.forecast);
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        // Set fallback weather data
        setWeather({
          temp: 28,
          condition: 'Partly Cloudy',
          humidity: 75,
          wind: 12,
          location: 'Rubber Plantation',
          icon: '//cdn.weatherapi.com/weather/64x64/day/116.png'
        });
        setForecast([
          { day: 'Mon', temp: 29, icon: '☀️', condition: 'Sunny' },
          { day: 'Tue', temp: 27, icon: '⛅', condition: 'Partly Cloudy' },
          { day: 'Wed', temp: 25, icon: '🌧️', condition: 'Rain' },
          { day: 'Thu', temp: 26, icon: '⛅', condition: 'Partly Cloudy' },
          { day: 'Fri', temp: 30, icon: '☀️', condition: 'Sunny' }
        ]);
      } finally {
        setWeatherLoading(false);
      }

      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setMapLoading(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Default to coordinates for Taguig, Philippines
            setUserLocation({ lat: 14.5176, lng: 121.0509 });
            setMapLoading(false);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
        // Default to coordinates for Taguig, Philippines
        setUserLocation({ lat: 14.5176, lng: 121.0509 });
        setMapLoading(false);
      }
    };

    fetchUserLocationAndWeather();
  }, [loading, API_BASE_URL]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Handle slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
    // Reset auto-slide timer
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  // Function to go to user location on map
const goToMyLocation = () => {
  if (userLocation) {
    const zoom = 16; // Higher zoom level for street level
    const lat = userLocation.lat;
    const lng = userLocation.lng;
    
    // Use center parameter for accurate positioning
    const iframe = document.querySelector('iframe[title="OpenStreetMap"]');
    if (iframe) {
      iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}&center=${lat},${lng}`;
    }
  }
};

  const extractTextFromResponse = (response) => {
    console.log('Response received:', response);

    // Handle string response
    if (typeof response === 'string') {
      return response;
    }

    // Handle object response
    if (response && typeof response === 'object') {
      // Handle OpenAI-style response
      if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
        const choice = response.choices[0];
        if (choice.message && choice.message.content) {
          return choice.message.content;
        }
        if (choice.text) {
          return choice.text;
        }
      }

      // Handle direct message object
      if (response.role && response.content) {
        return response.content;
      }

      // Handle nested message
      if (response.message && typeof response.message === 'object' && response.message.content) {
        return response.message.content;
      }

      // Try different possible response formats
      if (response.content) {
        return response.content;
      }
      if (response.message) {
        return response.message;
      }
      if (response.text) {
        return response.text;
      }
      if (response.response) {
        return response.response;
      }
      if (response.answer) {
        return response.answer;
      }
      if (response.result) {
        return response.result;
      }
      if (response.toString) {
        return response.toString();
      }

      // Try to find any string property
      for (const key in response) {
        if (typeof response[key] === 'string' && response[key].trim()) {
          return response[key];
        }
      }

      // If no string found, return a default message
      return 'Unable to extract text from response.';
    }

    // Handle other types
    return String(response || 'No response received');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setChatLoading(true);

    try {
      // Check if Puter.js is available
      if (window.puter && window.puter.ai && window.puter.ai.chat) {
        console.log('Calling Puter AI with message:', userMessage);
        
        // Direct Puter.js call
        const response = await window.puter.ai.chat(userMessage, {
          model: 'gpt-5-nano',
        });
        
        console.log('Puter AI response:', response);
        
        // Extract text from response
        const botResponse = extractTextFromResponse(response);
        
        setChatMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
      } else {
        console.log('Puter.js not available, using fallback');
        // Fallback: Use a local AI simulation
        await simulateAIChat(userMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      // Provide more specific error messages
      if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Rate limit exceeded. Please try again in a moment.";
      } else if (error.message?.includes('authentication')) {
        errorMessage = "Authentication error. Puter.js may need configuration.";
      }
      
      setChatMessages(prev => [...prev, { 
        text: errorMessage, 
        sender: 'bot' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const simulateAIChat = async (message) => {
    // Add a delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enhanced fallback responses
    const responses = [
      "I'm RubberSense AI! I can help with questions about rubber trees, general knowledge, coding, and much more. What would you like to know?",
      "That's an interesting question! As an AI assistant, I'm here to help you with various topics. Feel free to ask me anything!",
      "Thanks for your question! I'm designed to assist with a wide range of topics. How can I help you today?",
      "I'm here to answer your questions! Whether it's about rubber tree cultivation, technology, science, or general knowledge, I'm ready to help.",
      "Hello! I'm your AI assistant. I can help with questions, explanations, brainstorming, and more. What's on your mind?"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    setChatMessages(prev => [...prev, { text: randomResponse, sender: 'bot' }]);
  };

  // Clear chat history
  const clearChat = () => {
    setChatMessages([]);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh', 
        background: '#667eea' 
      }}>
        <p style={{ 
          textAlign: 'center', 
          color: 'white',
          fontSize: '18px' 
        }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#667eea',
      position: 'relative',
      paddingTop: '64px' // Add padding for fixed header
    }}>
      {/* User Header Component - Fixed at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 2000
      }}>
        <UserHeader />
      </div>
      
      {/* Full Screen Image Carousel - Sticky to header */}
      <div style={{
        position: 'relative',
        height: 'calc(100vh - 64px)', // Full screen minus header
        width: '100%',
        marginTop: 0
      }}>
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Slide Image */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7)'
            }} />
            
            {/* Slide Content */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              color: 'white',
              padding: '40px',
              maxWidth: '800px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'fadeIn 1s ease-out'
            }}>
              <h2 style={{
                fontSize: '3.5rem',
                marginBottom: '20px',
                textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
                fontWeight: 'bold'
              }}>
                {slide.title}
              </h2>
              <p style={{
                fontSize: '1.5rem',
                marginBottom: '30px',
                opacity: 0.9
              }}>
                {slide.description}
              </p>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                padding: '15px 40px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
              }}
              >
                Learn More
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '15px',
          zIndex: 10
        }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentSlide ? '#4CAF50' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'background 0.3s, transform 0.3s',
                transform: index === currentSlide ? 'scale(1.2)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (index !== currentSlide) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentSlide) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Below Carousel */}
      <div style={{
        background: '#667eea',
        padding: '40px 20px'
      }}>
        {/* Welcome Section - Below sliding pictures */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 40px',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            color: 'white', 
            marginBottom: '20px',
            fontSize: '2.2rem',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Welcome to RubberSense
          </h2>
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            lineHeight: '1.8',
            fontSize: '1.2rem',
            marginBottom: '30px',
            textAlign: 'center',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Your intelligent assistant for rubber tree analysis and cultivation insights.
            Monitor weather conditions, track plantation locations, and optimize your rubber farming operations.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🌿 Latex Detection
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🌳 Trunk Analysis
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🤖 AI Assistant
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '15px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              🌤️ Weather Monitoring
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Weather and Maps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Weather Card */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: 'white', 
              marginBottom: '25px',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🌤️ Current Weather
              {weatherLoading && (
                <span style={{
                  fontSize: '0.9rem',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  Loading...
                </span>
              )}
            </h2>
            
            {/* Date and Time */}
            <div style={{
              marginBottom: '25px',
              padding: '15px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '1rem',
                marginBottom: '5px' 
              }}>
                📅 {currentDate}
              </div>
              <div style={{ 
                color: '#4CAF50', 
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                🕒 {currentTime}
              </div>
            </div>
            
            {weather && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '25px'
                }}>
                  <div>
                    <div style={{ fontSize: '3.5rem', color: 'white', fontWeight: 'bold' }}>
                      {weather.temp}°C
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.3rem', marginTop: '5px' }}>
                      {weather.condition}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', marginTop: '10px' }}>
                      📍 {weather.location}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '4rem',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}>
                    {weather.icon?.startsWith('//') ? (
                      <img 
                        src={`https:${weather.icon}`} 
                        alt="Weather icon" 
                        style={{ width: '100px', height: '100px' }}
                      />
                    ) : (
                      <span>{weather.icon}</span>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '30px',
                  marginBottom: '30px',
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '15px',
                    borderRadius: '12px',
                    flex: 1,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '5px' }}>Humidity</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4CAF50' }}>{weather.humidity}%</div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '15px',
                    borderRadius: '12px',
                    flex: 1,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '5px' }}>Wind Speed</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4CAF50' }}>{weather.wind} km/h</div>
                  </div>
                </div>

                {/* 5-Day Forecast */}
                <div>
                  <h3 style={{ 
                    color: 'white', 
                    marginBottom: '20px',
                    fontSize: '1.3rem',
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📅 5-Day Forecast
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    {forecast.map((day, index) => (
                      <div key={index} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '15px',
                        textAlign: 'center',
                        flex: 1,
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ 
                          color: 'white', 
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          marginBottom: '10px'
                        }}>
                          {day.day}
                        </div>
                        <div style={{ 
                          fontSize: '1.8rem', 
                          margin: '10px 0',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}>
                          {day.icon}
                        </div>
                        <div style={{ 
                          color: '#4CAF50', 
                          fontWeight: 'bold',
                          fontSize: '1.5rem',
                          marginBottom: '5px'
                        }}>
                          {day.temp}°
                        </div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.7)', 
                          fontSize: '0.8rem'
                        }}>
                          {day.condition}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Card */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h2 style={{ 
              color: 'white', 
              marginBottom: '25px',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🗺️ Your Location
              {mapLoading && (
                <span style={{
                  fontSize: '0.9rem',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  Detecting...
                </span>
              )}
            </h2>

            <div style={{
              height: '350px',
              borderRadius: '15px',
              overflow: 'hidden',
              background: '#2c3e50',
              position: 'relative',
              marginBottom: '20px',
              border: '2px solid rgba(255,255,255,0.1)'
            }}>
              {userLocation ? (
                <iframe
                  ref={mapIframeRef}
                  title="OpenStreetMap"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.005},${userLocation.lat - 0.005},${userLocation.lng + 0.005},${userLocation.lat + 0.005}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}&center=${userLocation.lat},${userLocation.lng}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  loading="lazy"
                />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📍</div>
                    <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Loading map...</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      Please allow location access
                    </div>
                  </div>
                </div>
              )}

              {/* Go to My Location Button - Inside the map */}
              {userLocation && (
                <button
                  onClick={goToMyLocation}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#333',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s, background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                  }}
                  title="Go to my location"
                >
                  ↗
                </button>
              )}
            </div>

            <div style={{
              marginTop: '20px',
              color: 'white'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '15px',
                    height: '15px',
                    background: '#ff4757',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(255, 71, 87, 0.5)'
                  }} />
                  <span style={{ fontSize: '1rem' }}>Your current location marker (static)</span>
                </div>
              </div>
              
              {userLocation && (
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '20px',
                  borderRadius: '12px',
                  marginTop: '15px',
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>📍 Coordinates:</span>
                    <span>{userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</span>
                  </div>
                  <div style={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>🌍 Location:</span>
                    <span>Taguig City, Metro Manila, Philippines</span>
                  </div>
                  <div style={{ marginTop: '10px', opacity: 0.8, fontSize: '0.85rem' }}>
                    <em>Note: The red marker is fixed and won't move when you interact with the map. Use the ↗ button to recenter.</em>
                  </div>
                </div>
              )}

              <a
                href={`https://www.openstreetmap.org/#map=15/${userLocation?.lat}/${userLocation?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  padding: '12px 25px',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  marginTop: '20px',
                  fontSize: '1rem',
                  transition: 'background 0.2s, transform 0.2s',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>View Full Map</span>
                <span style={{ fontSize: '1.2rem' }}>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Bot Icon Button */}
      <button
        onClick={() => setChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
        {!chatOpen && chatMessages.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {chatMessages.filter(m => m.sender === 'bot' && m.text).length}
          </span>
        )}
      </button>

      {/* Chat Bot Window */}
      {chatOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '350px',
          height: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          overflow: 'hidden',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {/* Chat Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            padding: '12px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                backdropFilter: 'blur(10px)',
                flexShrink: 0
              }}>
                🤖
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  RubberSense AI
                </h3>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Powered by GPT-5 nano
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              <button
                onClick={clearChat}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                title="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div style={{
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            background: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Welcome message - only show if no messages yet */}
            {chatMessages.length === 0 && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'white',
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                maxWidth: '85%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}>
                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>
                  👋 Hello! I'm <strong>RubberSense AI</strong>, powered by GPT-5 nano. I can help you with:
                </p>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#555' }}>
                  <li>Questions about rubber trees and latex</li>
                  <li>General knowledge and information</li>
                  <li>Coding and technical questions</li>
                  <li>Creative writing and brainstorming</li>
                  <li>Math, science, and history</li>
                  <li>And much more!</li>
                </ul>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555' }}>
                  Ask me anything! What would you like to know?
                </p>
              </div>
            )}

            {/* Chat messages */}
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' 
                    : 'white',
                  color: msg.sender === 'user' ? 'white' : '#333',
                  padding: '10px 15px',
                  borderRadius: msg.sender === 'user' 
                    ? '18px 4px 18px 18px' 
                    : '4px 18px 18px 18px',
                  maxWidth: '85%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e0e0e0',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </div>
            ))}

            {/* Loading indicator */}
            {chatLoading && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'white',
                padding: '12px 16px',
                borderRadius: '4px 18px 18px 18px',
                maxWidth: '85%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    animation: 'bounce 1.4s infinite ease-in-out both'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    animation: 'bounce 1.4s infinite ease-in-out both 0.2s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    animation: 'bounce 1.4s infinite ease-in-out both 0.4s'
                  }}></div>
                </div>
                <span style={{ fontSize: '13px', color: '#666' }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <form onSubmit={handleChatSubmit} style={{
            borderTop: '1px solid #e0e0e0',
            padding: '12px',
            background: 'white',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '14px',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #4CAF50'}
              onBlur={(e) => e.target.style.border = '1px solid #e0e0e0'}
              disabled={chatLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                  // Allow Shift+Enter for new line
                  return;
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  handleChatSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
              height: '40px',
                cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                transition: 'opacity 0.2s, transform 0.2s'
              }}
              disabled={chatLoading || !chatInput.trim()}
              onMouseEnter={(e) => {
                if (!chatLoading && chatInput.trim()) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!chatLoading && chatInput.trim()) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {chatLoading ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
                '→'
              )}
            </button>
          </form>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 
          40% { 
            transform: scale(1.0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 71, 87, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 71,87, 0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;