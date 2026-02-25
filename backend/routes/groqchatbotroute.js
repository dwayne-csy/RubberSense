// RubberSense/backend/routes/groqchatbotroute.js
const express = require('express');
const router = express.Router();
const groqChatbotController = require('../controllers/groqchatbot');

// Chat endpoints
router.post('/chat', (req, res, next) => {
  console.log('📨 Received chat request:', { 
    body: req.body,
    headers: req.headers['content-type'],
    time: new Date().toISOString()
  });
  
  // Check if GROQ_API_KEY is configured
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is not configured!');
    return res.status(500).json({
      success: false,
      error: 'GROQ_API_KEY is not configured on the server'
    });
  }
  
  groqChatbotController.sendMessage(req, res, next);
});

router.post('/chat/clear', (req, res, next) => {
  console.log('🧹 Clearing chat for session:', req.body.sessionId);
  groqChatbotController.clearConversation(req, res, next);
});

router.get('/chat/history/:sessionId', groqChatbotController.getHistory);

// Health check
router.get('/health', groqChatbotController.healthCheck);

// New endpoint to check available models
router.get('/models', groqChatbotController.getAvailableModels);

// Debug endpoint to check sessions
router.get('/sessions', groqChatbotController.getActiveSessions);

module.exports = router;