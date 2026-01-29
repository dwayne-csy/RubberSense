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
  const messagesEndRef = useRef(null);
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

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
      position: 'relative'
    }}>
      {/* User Header Component */}
      <UserHeader />
      
      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px 40px',
        minHeight: 'calc(100vh - 64px)', // Subtract header height
      }}>
        {/* Welcome Text */}
        <h1 style={{ 
          color: 'white', 
          textAlign: 'center',
          fontSize: '2.5rem',
          marginBottom: '30px',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Welcome {user?.name || 'User'}
        </h1>

        {/* Optional Avatar */}
        {user?.avatar?.url && (
          <img
            src={user.avatar.url}
            alt="User Avatar"
            style={{ 
              width: '140px', 
              height: '140px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              marginBottom: '30px', 
              border: '6px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
            }}
          />
        )}

        {/* Welcome Message */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            color: 'white', 
            marginBottom: '15px',
            fontSize: '1.8rem'
          }}>
            Welcome to RubberSense
          </h2>
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            lineHeight: '1.6',
            fontSize: '1.1rem',
            marginBottom: '20px'
          }}>
            Your intelligent assistant for rubber tree analysis and cultivation insights.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '20px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '10px 20px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '0.9rem'
            }}>
              🌿 Latex Detection
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '10px 20px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '0.9rem'
            }}>
              🌳 Trunk Analysis
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '10px 20px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '0.9rem'
            }}>
              🤖 AI Assistant
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
      `}</style>
    </div>
  );
};

export default Home;