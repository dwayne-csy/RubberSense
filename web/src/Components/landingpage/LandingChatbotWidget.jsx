// RubberSense/web/src/Components/landingpage/LandingChatbotWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import Logo from '../logo/LOGO.png';

const LandingChatbotWidget = ({ isOpen, onClose, sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Generate a consistent session ID if not provided
  const widgetSessionId = useRef(
    sessionId || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Welcome message
  const welcomeMessage = {
    id: 1,
    text: "👋 Hello! I'm your **RubberSense AI Assistant** for guests.\n\nI can help you with:\n• General information about rubber tree farming\n• How our AI detection works\n• Features of RubberSense platform\n• Basic latex tapping tips\n• Rubber tree disease overview\n\nWhat would you like to know about?",
    sender: 'bot',
    timestamp: new Date()
  };

  // Pre-defined responses for common questions
  const getBotResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return "Hello! How can I assist you with RubberSense today?";
    }
    else if (lowerMsg.includes('feature') || lowerMsg.includes('what can you do')) {
      return "RubberSense offers:\n• AI-powered rubber tree disease detection\n• Latex quality analysis\n• Trunk health assessment\n• Weather monitoring\n• Plantation mapping\n• Community blog\n\nTo access all features, please login/signup!";
    }
    else if (lowerMsg.includes('disease') || lowerMsg.includes('sick')) {
      return "Common rubber tree diseases:\n• White Root Disease\n• Pink Disease\n• Abnormal Leaf Fall\n• Patch Canker\n\nLogin to upload photos and get AI-powered disease detection!";
    }
    else if (lowerMsg.includes('tapping') || lowerMsg.includes('latex')) {
      return "Best tapping practices:\n• Tap early morning (2-6 AM)\n• Use sharp knives\n• Maintain proper depth (1-1.5mm from cambium)\n• Alternate tapping panels\n• Frequency: Every 2-3 days";
    }
    else if (lowerMsg.includes('yield') || lowerMsg.includes('production')) {
      return "To increase latex yield:\n• Proper fertilization\n• Regular disease monitoring\n• Optimal tapping frequency\n• Climate-appropriate clones\n• Adequate rest periods";
    }
    else if (lowerMsg.includes('login') || lowerMsg.includes('signup') || lowerMsg.includes('register')) {
      return "To access full features including AI detection, personal dashboard, and detailed analytics, please click 'Get Started' or 'Login' on the main page!";
    }
    else if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
      return "RubberSense offers both free and premium plans. Please login to see available subscription options tailored to your needs!";
    }
    else if (lowerMsg.includes('weather') || lowerMsg.includes('climate')) {
      return "Weather plays a crucial role in rubber farming. Ideal conditions:\n• Temperature: 24-28°C\n• Rainfall: 2000-2500mm annually\n• Humidity: 75-85%\n\nLogin for detailed weather monitoring!";
    }
    else if (lowerMsg.includes('thank')) {
      return "You're welcome! Feel free to ask if you have more questions. When you're ready to explore all features, just click 'Get Started' above! 😊";
    }
    else {
      return "That's a great question! For detailed information about this topic, I'd recommend logging in to access our comprehensive knowledge base and AI-powered tools. In the meantime, would you like to know about our key features or how to get started?";
    }
  };

  useEffect(() => {
    // Set initial welcome message when chat opens
    if (isOpen && messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleClearChat = () => {
    setMessages([welcomeMessage]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Suggestion chips for quick questions
  const suggestions = [
    "What features do you offer?",
    "Tell me about rubber tapping",
    "Common tree diseases",
    "How to increase yield?",
    "Do I need to login?",
    "Weather requirements"
  ];

  // CSS Styles
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'landing-chat-styles';
    styleEl.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

      @keyframes lc-up { 
        from { transform: translateY(24px) scale(0.97); opacity: 0; } 
        to { transform: none; opacity: 1; } 
      }
      @keyframes lc-in { 
        from { opacity: 0; transform: translateY(8px); } 
        to { opacity: 1; transform: none; } 
      }
      @keyframes lc-ring { 
        0% { transform: scale(1); opacity: 0.5; } 
        100% { transform: scale(1.7); opacity: 0; } 
      }
      @keyframes lc-blink { 
        0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; } 
        40% { transform: scale(1); opacity: 1; } 
      }
      @keyframes lc-float { 
        0%, 100% { transform: translateY(0); } 
        50% { transform: translateY(-5px); } 
      }
      @keyframes lc-glow { 
        0%, 100% { box-shadow: 0 0 18px rgba(74, 181, 74, 0.28), 0 8px 28px rgba(0, 0, 0, 0.4); } 
        50% { box-shadow: 0 0 34px rgba(74, 181, 74, 0.52), 0 12px 34px rgba(0, 0, 0, 0.5); } 
      }

      /* Widget shell */
      .lc-w {
        position: fixed; bottom: 24px; right: 24px;
        width: 382px; height: 608px;
        display: flex; flex-direction: column;
        z-index: 9999;
        animation: lc-up 0.38s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'DM Sans', sans-serif;
      }

      .lc-inner {
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        border-radius: 24px; overflow: hidden;
        transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
      }
      .lc-inner.dark {
        background: #0d1117;
        border: 1px solid rgba(255, 255, 255, 0.07);
        box-shadow: 0 32px 80px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(74, 181, 74, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }
      .lc-inner.light {
        background: #f5faf5;
        border: 1px solid rgba(45, 106, 79, 0.1);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(45, 106, 79, 0.06);
      }

      /* Header */
      .lc-header {
        padding: 14px 16px;
        display: flex; align-items: center; justify-content: space-between;
        flex-shrink: 0; position: relative; overflow: hidden;
        transition: background 0.3s, border-color 0.3s;
      }
      .lc-inner.dark .lc-header { 
        background: linear-gradient(135deg, #0a1f0a, #112211); 
        border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
      }
      .lc-inner.light .lc-header { 
        background: linear-gradient(135deg, #e9f5ea, #f2faf2); 
        border-bottom: 1px solid rgba(45, 106, 79, 0.09); 
      }
      .lc-header::before {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(ellipse at top left, rgba(74, 181, 74, 0.07) 0%, transparent 65%);
      }

      .lc-header-left { 
        display: flex; align-items: center; gap: 11px; 
      }

      /* Logo box */
      .lc-logo-wrap { 
        position: relative; width: 40px; height: 40px; flex-shrink: 0; 
      }
      .lc-logo-box {
        width: 40px; height: 40px; border-radius: 13px; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
        border: 1.5px solid rgba(74, 181, 74, 0.28); transition: background 0.3s;
      }
      .lc-inner.dark .lc-logo-box { 
        background: linear-gradient(135deg, #1a4a1a, #2d6a4f); 
      }
      .lc-inner.light .lc-logo-box { 
        background: linear-gradient(135deg, #d1fae5, #a7f3d0); 
      }
      .lc-logo-box img { 
        width: 26px; height: 26px; object-fit: contain; 
      }

      .lc-dot {
        position: absolute; bottom: -2px; right: -2px;
        width: 11px; height: 11px; border-radius: 50%;
        background: #4ade80; z-index: 2; transition: border-color 0.3s;
        border: 2px solid;
      }
      .lc-inner.dark .lc-dot { border-color: #0d1117; }
      .lc-inner.light .lc-dot { border-color: #f5faf5; }
      .lc-dot::after {
        content: ''; position: absolute; inset: -3px; border-radius: 50%;
        background: #4ade80; animation: lc-ring 2s ease-out infinite;
      }

      .lc-header-info h3 {
        margin: 0; font-family: 'Syne', sans-serif; font-size: 14.5px; font-weight: 700;
        letter-spacing: -0.02em; transition: color 0.3s;
      }
      .lc-inner.dark .lc-header-info h3 { color: #e8f5e8; }
      .lc-inner.light .lc-header-info h3 { color: #1b4332; }
      .lc-sub { 
        font-size: 10.5px; margin-top: 2px; transition: color 0.3s; 
      }
      .lc-inner.dark .lc-sub { color: rgba(255, 255, 255, 0.3); }
      .lc-inner.light .lc-sub { color: rgba(27, 67, 50, 0.42); }

      /* Icon buttons */
      .lc-actions { 
        display: flex; align-items: center; gap: 5px; 
      }
      .lc-ibtn {
        width: 32px; height: 32px; border-radius: 10px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        border: 1px solid; background: none; transition: all 0.2s;
      }
      .lc-inner.dark .lc-ibtn { 
        border-color: rgba(255, 255, 255, 0.07); color: rgba(255, 255, 255, 0.42); 
      }
      .lc-inner.light .lc-ibtn { 
        border-color: rgba(0, 0, 0, 0.08); color: rgba(27, 67, 50, 0.46); 
      }
      .lc-inner.dark .lc-ibtn:hover { 
        background: rgba(255, 255, 255, 0.09); color: rgba(255, 255, 255, 0.9); border-color: rgba(255, 255, 255, 0.13); 
      }
      .lc-inner.light .lc-ibtn:hover { 
        background: rgba(45, 106, 79, 0.07); color: #1b4332; border-color: rgba(45, 106, 79, 0.18); 
      }
      .lc-ibtn.danger:hover { 
        background: rgba(239, 68, 68, 0.11) !important; color: #f87171 !important; border-color: rgba(239, 68, 68, 0.22) !important; 
      }

      /* Messages container */
      .lc-msgs {
        flex: 1; overflow-y: auto; padding: 18px 14px;
        display: flex; flex-direction: column; gap: 14px;
        transition: background 0.3s; scrollbar-width: thin;
      }
      .lc-inner.dark .lc-msgs { 
        background: #0d1117; scrollbar-color: rgba(255, 255, 255, 0.06) transparent; 
      }
      .lc-inner.light .lc-msgs { 
        background: #f5faf5; scrollbar-color: rgba(0, 0, 0, 0.07) transparent; 
      }
      .lc-msgs::-webkit-scrollbar { width: 4px; }
      .lc-msgs::-webkit-scrollbar-thumb { border-radius: 4px; }
      .lc-inner.dark .lc-msgs::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); }
      .lc-inner.light .lc-msgs::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.07); }

      .lc-row { 
        display: flex; align-items: flex-end; gap: 8px; animation: lc-in 0.28s ease; 
      }
      .lc-row.user { 
        flex-direction: row-reverse; 
      }

      /* Bot icon in messages */
      .lc-bot-ico {
        width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden; border: 1px solid rgba(74, 181, 74, 0.2); transition: background 0.3s;
      }
      .lc-inner.dark .lc-bot-ico { 
        background: linear-gradient(135deg, #1a4a1a, #2d6a4f); 
      }
      .lc-inner.light .lc-bot-ico { 
        background: linear-gradient(135deg, #d1fae5, #a7f3d0); 
      }
      .lc-bot-ico img { 
        width: 18px; height: 18px; object-fit: contain; 
      }

      /* User avatar (guest icon) */
      .lc-uavatar {
        width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
        overflow: hidden; border: 1.5px solid; transition: border-color 0.3s;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
      }
      .lc-inner.dark .lc-uavatar { 
        border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.5);
      }
      .lc-inner.light .lc-uavatar { 
        border-color: rgba(45, 106, 79, 0.2); background: rgba(45, 106, 79, 0.05);
        color: #1b4332;
      }

      .lc-bwrap { 
        max-width: 73%; display: flex; flex-direction: column; gap: 3px; 
      }
      .lc-row.user .lc-bwrap { 
        align-items: flex-end; 
      }

      .lc-bubble {
        padding: 10px 14px; border-radius: 18px; border: 1px solid;
        font-size: 13.5px; line-height: 1.65; word-wrap: break-word; white-space: pre-line;
        transition: background 0.3s, color 0.3s, border-color 0.3s;
      }
      .lc-bubble.bot { 
        border-bottom-left-radius: 5px; 
      }
      .lc-bubble.user { 
        border-bottom-right-radius: 5px; 
      }
      .lc-inner.dark .lc-bubble.bot { 
        background: #161d16; border-color: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.86); 
      }
      .lc-inner.light .lc-bubble.bot { 
        background: #ffffff; border-color: rgba(45, 106, 79, 0.11); color: #1b4332; 
      }
      .lc-inner.dark .lc-bubble.user { 
        background: linear-gradient(135deg, #166534, #15803d); border-color: rgba(74, 181, 74, 0.24); color: #dcfce7; 
      }
      .lc-inner.light .lc-bubble.user { 
        background: linear-gradient(135deg, #2d6a4f, #40916c); border-color: rgba(45, 106, 79, 0.28); color: #f0fdf4; 
      }

      .lc-time { 
        font-size: 10px; padding: 0 3px; transition: color 0.3s; 
      }
      .lc-inner.dark .lc-time { color: rgba(255, 255, 255, 0.18); }
      .lc-inner.light .lc-time { color: rgba(0, 0, 0, 0.25); }

      .lc-divider { 
        display: flex; align-items: center; gap: 10px; margin: 2px 0; 
      }
      .lc-divider span { 
        font-size: 10px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; transition: color 0.3s; 
      }
      .lc-inner.dark .lc-divider span { color: rgba(255, 255, 255, 0.17); }
      .lc-inner.light .lc-divider span { color: rgba(0, 0, 0, 0.26); }
      .lc-divider::before, .lc-divider::after { 
        content: ''; flex: 1; height: 1px; transition: background 0.3s; 
      }
      .lc-inner.dark .lc-divider::before, .lc-inner.dark .lc-divider::after { 
        background: rgba(255, 255, 255, 0.05); 
      }
      .lc-inner.light .lc-divider::before, .lc-inner.light .lc-divider::after { 
        background: rgba(0, 0, 0, 0.07); 
      }

      /* Typing indicator */
      .lc-typing { 
        display: flex; gap: 4px; align-items: center; padding: 3px 0; 
      }
      .lc-typing span { 
        width: 6px; height: 6px; border-radius: 50%; display: inline-block; 
        animation: lc-blink 1.2s infinite ease-in-out; 
      }
      .lc-inner.dark .lc-typing span { background: #4ade80; }
      .lc-inner.light .lc-typing span { background: #2d6a4f; }
      .lc-typing span:nth-child(2) { animation-delay: 0.2s; }
      .lc-typing span:nth-child(3) { animation-delay: 0.4s; }

      /* Chips */
      .lc-chips-wrap {
        flex-shrink: 0; border-top: 1px solid; transition: background 0.3s, border-color 0.3s;
      }
      .lc-inner.dark .lc-chips-wrap { 
        background: #0d1117; border-color: rgba(255, 255, 255, 0.04); 
      }
      .lc-inner.light .lc-chips-wrap { 
        background: #f5faf5; border-color: rgba(45, 106, 79, 0.07); 
      }

      .lc-chips {
        display: flex; flex-wrap: wrap; gap: 7px; padding: 10px 14px;
      }

      .lc-chip {
        padding: 6px 12px; border-radius: 20px; border: 1px solid;
        font-size: 11.5px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        font-family: 'DM Sans', sans-serif;
      }
      .lc-inner.dark .lc-chip { 
        background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.52); 
      }
      .lc-inner.light .lc-chip { 
        background: rgba(45, 106, 79, 0.05); border-color: rgba(45, 106, 79, 0.13); color: rgba(27, 67, 50, 0.62); 
      }
      .lc-inner.dark .lc-chip:hover:not(:disabled) { 
        background: rgba(74, 181, 74, 0.1); border-color: rgba(74, 181, 74, 0.3); color: #86efac; 
      }
      .lc-inner.light .lc-chip:hover:not(:disabled) { 
        background: rgba(45, 106, 79, 0.1); border-color: rgba(45, 106, 79, 0.28); color: #1b4332; 
      }
      .lc-chip:disabled { 
        opacity: 0.38; cursor: not-allowed; 
      }

      /* Input area */
      .lc-input-area {
        padding: 11px 14px 15px; flex-shrink: 0; border-top: 1px solid;
        transition: background 0.3s, border-color 0.3s;
      }
      .lc-inner.dark .lc-input-area { 
        background: #0d1117; border-color: rgba(255, 255, 255, 0.04); 
      }
      .lc-inner.light .lc-input-area { 
        background: #f5faf5; border-color: rgba(45, 106, 79, 0.07); 
      }

      .lc-input-row {
        display: flex; align-items: flex-end; gap: 9px;
        border-radius: 16px; padding: 9px 9px 9px 15px; border: 1px solid;
        transition: all 0.3s;
      }
      .lc-inner.dark .lc-input-row { 
        background: #161d16; border-color: rgba(255, 255, 255, 0.07); 
      }
      .lc-inner.light .lc-input-row { 
        background: #ffffff; border-color: rgba(45, 106, 79, 0.13); 
      }
      .lc-inner.dark .lc-input-row:focus-within { 
        border-color: rgba(74, 181, 74, 0.36); box-shadow: 0 0 0 3px rgba(74, 181, 74, 0.06); 
      }
      .lc-inner.light .lc-input-row:focus-within { 
        border-color: rgba(45, 106, 79, 0.4); box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.06); 
      }

      .lc-textarea {
        flex: 1; background: none; border: none; outline: none; resize: none;
        font-size: 13.5px; font-family: 'DM Sans', sans-serif; line-height: 1.5;
        max-height: 90px; transition: color 0.3s;
      }
      .lc-inner.dark .lc-textarea { color: rgba(255, 255, 255, 0.84); }
      .lc-inner.light .lc-textarea { color: #1b4332; }
      .lc-inner.dark .lc-textarea::placeholder { color: rgba(255, 255, 255, 0.22); }
      .lc-inner.light .lc-textarea::placeholder { color: rgba(27, 67, 50, 0.33); }

      .lc-send {
        width: 34px; height: 34px; border-radius: 11px; border: none;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: all 0.2s;
        background: linear-gradient(135deg, #166534, #15803d);
      }
      .lc-send svg { 
        display: block; stroke: #ffffff !important; color: #ffffff !important; 
      }
      .lc-send:hover:not(:disabled) { 
        background: linear-gradient(135deg, #15803d, #16a34a); transform: scale(1.06); 
      }
      .lc-send:disabled { 
        background: rgba(100, 100, 100, 0.15); cursor: not-allowed; transform: none; 
      }
      .lc-send:disabled svg { 
        stroke: rgba(130, 130, 130, 0.5) !important; 
      }

      /* Guest watermark */
      .lc-guest-badge {
        text-align: center; font-size: 9px; margin-top: 6px; 
        letter-spacing: 0.3px; transition: color 0.3s;
      }
      .lc-inner.dark .lc-guest-badge { color: rgba(255, 255, 255, 0.2); }
      .lc-inner.light .lc-guest-badge { color: rgba(27, 67, 50, 0.3); }

      /* Chat head (closed state) */
      .lc-head {
        position: fixed; bottom: 24px; right: 24px;
        width: 58px; height: 58px; border-radius: 18px;
        background: linear-gradient(135deg, #0a1f0a, #166534);
        border: 1.5px solid rgba(74, 181, 74, 0.24);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 9999; overflow: hidden;
        transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        animation: lc-float 4s ease-in-out infinite, lc-glow 3.5s ease-in-out infinite;
      }
      .lc-head img { 
        width: 34px; height: 34px; object-fit: contain; 
      }
      .lc-head:hover { 
        transform: scale(1.1) rotate(-4deg); 
      }
    `;

    if (!document.getElementById('landing-chat-styles')) {
      document.head.appendChild(styleEl);
    }

    return () => {
      const style = document.getElementById('landing-chat-styles');
      if (style) style.remove();
    };
  }, []);

  // Closed state (chat head)
  if (!isOpen) {
    return (
      <div className="lc-head" onClick={onClose} title="Ask RubberSense AI">
        <img src={Logo} alt="RubberSense AI" />
      </div>
    );
  }

  const theme = isDark ? 'dark' : 'light';

  // Open widget
  return (
    <div className="lc-w">
      <div className={`lc-inner ${theme}`}>
        {/* Header */}
        <div className="lc-header">
          <div className="lc-header-left">
            <div className="lc-logo-wrap">
              <div className="lc-logo-box">
                <img src={Logo} alt="RubberSense" />
              </div>
              <div className="lc-dot" />
            </div>
            <div className="lc-header-info">
              <h3>RubberSense AI</h3>
              <div className="lc-sub">Guest Assistant</div>
            </div>
          </div>

          <div className="lc-actions">
            {/* Clear chat */}
            <button className="lc-ibtn" onClick={handleClearChat} title="Clear chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>

            {/* Dark / Light mode toggle */}
            <button className="lc-ibtn" onClick={() => setIsDark(p => !p)} title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
                </svg>
              )}
            </button>

            {/* Close */}
            <button className="lc-ibtn danger" onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="lc-msgs">
          <div className="lc-divider"><span>Today</span></div>

          {messages.map((msg) => (
            <div key={msg.id} className={`lc-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="lc-bot-ico">
                  <img src={Logo} alt="bot" />
                </div>
              )}

              <div className="lc-bwrap">
                <div className={`lc-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
                <span className="lc-time">{formatTime(msg.timestamp)}</span>
              </div>

              {msg.sender === 'user' && (
                <div className="lc-uavatar">
                  👤
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="lc-row bot">
              <div className="lc-bot-ico">
                <img src={Logo} alt="bot" />
              </div>
              <div className="lc-bwrap">
                <div className="lc-bubble bot">
                  <div className="lc-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="lc-chips-wrap">
          <div className="lc-chips">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="lc-chip"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isTyping}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="lc-input-area">
          <div className="lc-input-row">
            <textarea
              ref={inputRef}
              className="lc-textarea"
              rows="1"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about rubber farming..."
              disabled={isTyping}
            />
            <button
              className="lc-send"
              onClick={handleSendMessage}
              disabled={isTyping || !inputMessage.trim()}
              title="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#ffffff" stroke="#ffffff"/>
              </svg>
            </button>
          </div>
          <div className="lc-guest-badge">
            Login for full AI-powered features
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingChatbotWidget;