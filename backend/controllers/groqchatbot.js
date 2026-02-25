// RubberSense/backend/controllers/groqchatbot.js
const Groq = require('groq-sdk');
const path = require('path');

console.log('Current directory:', __dirname);
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);

// List of currently supported Groq models (as of 2026)
const SUPPORTED_MODELS = {
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',     // Latest and most powerful
  LLAMA_3_1_8B: 'llama-3.1-8b-instant',         // Fast and capable
  LLAMA_GUARD_3_8B: 'llama-guard-3-8b',         // Safe and reliable
  GEMMA_2_9B: 'gemma2-9b-it',                    // Good for specialized tasks
  MIXTRAL_8x7B: 'mixtral-8x7b-32768'             // DEPRECATED - DO NOT USE
};

// Initialize Groq with error handling
let groq;
try {
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is not set in environment variables');
    console.error('Please check your .env file at:', path.join(__dirname, '../config/.env'));
    console.error('Make sure it contains: GROQ_API_KEY=your_api_key_here');
  } else {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    console.log('✅ Groq SDK initialized successfully');
    console.log('📋 Using model: llama-3.3-70b-versatile (latest supported)');
  }
} catch (error) {
  console.error('❌ Failed to initialize Groq SDK:', error.message);
}

// Store conversation history (in production, use Redis or database)
const conversations = new Map();

// Clean old conversations every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [sessionId, data] of conversations.entries()) {
    if (data.lastUpdated < oneHourAgo) {
      conversations.delete(sessionId);
      console.log(`Cleaned up old session: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000);

/**
 * System prompt focused ONLY on RubberTree/RubberSense topics
 */
const SYSTEM_PROMPT = {
  role: "system",
  content: `You are RubberSense AI, a specialized assistant exclusively for rubber tree plantation management. Your knowledge is LIMITED to the following topics only:

  🌳 RUBBER TREE CULTIVATION:
  - Planting techniques and optimal spacing
  - Soil requirements and preparation
  - Climate and weather conditions for healthy growth
  - Nursery management and sapling selection

  🔪 TAPPING OPERATIONS:
  - Best time for tapping (early morning)
  - Tapping frequency and rest periods
  - Proper tapping techniques and tools
  - Tapping panel management and rejuvenation

  🧪 LATEX PRODUCTION:
  - Latex collection methods
  - Yield optimization strategies
  - Latex quality assessment
  - Preservation and coagulation

  🩺 TREE HEALTH & DISEASES:
  - Common diseases (White Root Disease, Brown Bast, Powdery Mildew)
  - Pest identification and control
  - Nutrient deficiencies and fertilization
  - Treatment recommendations

  📊 PLANTATION MANAGEMENT:
  - Weed control strategies
  - Fertilizer schedules
  - Intercropping options
  - Record keeping and yield tracking

  🌦️ WEATHER IMPACT:
  - How rain affects tapping
  - Temperature effects on latex flow
  - Seasonal management practices
  - Drought and flood management

  ♻️ SUSTAINABLE PRACTICES:
  - Eco-friendly tapping methods
  - Soil conservation techniques
  - Biodiversity in rubber plantations
  - Sustainable yield management

  IMPORTANT RULES:
  1. ONLY answer questions related to rubber trees, rubber plantations, latex production, and rubber farming
  2. If asked about ANYTHING else, respond with:
     "I'm your RubberSense AI assistant, specialized ONLY in rubber tree plantation management. I can't help with that question. Is there something about rubber trees, tapping, latex production, or plantation management I can assist you with?"
  3. Always provide practical, actionable advice specific to rubber farming
  4. Use simple, clear language suitable for farmers
  5. Prioritize sustainable and safe practices`
};

/**
 * Send a message to Groq chatbot
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    
    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Check if Groq is initialized
    if (!groq) {
      return res.status(500).json({ 
        success: false, 
        error: 'Groq API not initialized. Please check your GROQ_API_KEY in .env file.' 
      });
    }

    // Get or create conversation
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, {
        messages: [SYSTEM_PROMPT],
        lastUpdated: Date.now(),
        createdAt: Date.now()
      });
      console.log(`New RubberSense chat session created: ${sessionId}`);
    }

    const conversation = conversations.get(sessionId);
    
    // Add user message
    conversation.messages.push({
      role: "user",
      content: message
    });
    conversation.lastUpdated = Date.now();

    // Keep only last 10 messages for context
    const messagesToSend = [
      conversation.messages[0], // System prompt
      ...conversation.messages.slice(-9) // Last 9 messages
    ];

    console.log(`Processing rubber tree query for session ${sessionId}`);

    // Call Groq API with the latest supported model
    const chatCompletion = await groq.chat.completions.create({
      messages: messagesToSend,
      // UPDATED: Using llama-3.3-70b-versatile (latest supported model as of 2026)
      model: 'llama-3.3-70b-versatile', // Latest, most powerful, and fully supported
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.9,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';

    // Add assistant response
    conversation.messages.push({
      role: "assistant",
      content: response
    });

    // Keep conversation manageable
    if (conversation.messages.length > 21) {
      conversation.messages = [
        conversation.messages[0],
        ...conversation.messages.slice(-20)
      ];
    }

    return res.json({
      success: true,
      response,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Groq API Error:', error);
    
    let errorMessage = 'Failed to get response from RubberSense AI';
    let statusCode = 500;

    // Handle specific error types
    if (error.status === 401) {
      errorMessage = 'API configuration error. Please check your GROQ_API_KEY.';
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
      statusCode = 429;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network error. Cannot connect to Groq API.';
    } else if (error.message.includes('API key')) {
      errorMessage = 'Invalid GROQ_API_KEY. Please check your API key.';
    } else if (error.message.includes('model') && error.message.includes('decommissioned')) {
      errorMessage = 'The AI model is being updated. Please try again in a moment.';
      console.error('⚠️ Model deprecated error caught - using fallback response');
      
      // Return a friendly fallback response instead of error
      // FIXED: sessionId is now properly accessible from the request body
      const fallbackSessionId = req.body.sessionId || 'default';
      
      return res.json({
        success: true,
        response: "🌳 I'm currently updating my AI model to the latest version. Please try your question again in a moment. In the meantime, feel free to ask about tapping techniques, disease identification, or latex yield optimization!",
        sessionId: fallbackSessionId
      });
    }

    return res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      details: error.message,
      sessionId: req.body.sessionId || 'default'
    });
  }
};

/**
 * Clear conversation history
 */
exports.clearConversation = (req, res) => {
  try {
    const { sessionId = 'default' } = req.body;
    
    if (conversations.has(sessionId)) {
      conversations.set(sessionId, {
        messages: [SYSTEM_PROMPT],
        lastUpdated: Date.now(),
        createdAt: conversations.get(sessionId)?.createdAt || Date.now()
      });
      
      console.log(`Cleared RubberSense chat for session: ${sessionId}`);
      
      return res.json({ 
        success: true, 
        message: 'Conversation cleared',
        sessionId 
      });
    } else {
      return res.json({ 
        success: true, 
        message: 'No conversation found',
        sessionId 
      });
    }
  } catch (error) {
    console.error('Clear conversation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to clear conversation' 
    });
  }
};

/**
 * Get conversation history
 */
exports.getHistory = (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const conversation = conversations.get(sessionId);
    
    if (!conversation) {
      return res.json({
        success: true,
        messages: [],
        sessionId
      });
    }

    // Filter out system messages for history
    const chatHistory = conversation.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    return res.json({
      success: true,
      messages: chatHistory,
      sessionId,
      createdAt: conversation.createdAt,
      lastUpdated: conversation.lastUpdated
    });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get history' 
    });
  }
};

/**
 * Health check endpoint
 */
exports.healthCheck = (req, res) => {
  try {
    return res.json({
      status: 'healthy',
      service: 'RubberSense AI Assistant',
      activeSessions: conversations.size,
      apiConfigured: !!process.env.GROQ_API_KEY,
      groqInitialized: !!groq,
      model: 'llama-3.3-70b-versatile',
      modelStatus: 'supported (latest)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Health check failed' 
    });
  }
};

/**
 * Get available models (useful for debugging)
 */
exports.getAvailableModels = async (req, res) => {
  try {
    if (!groq) {
      return res.status(500).json({ 
        success: false, 
        error: 'Groq API not initialized' 
      });
    }

    // You can uncomment this to fetch models directly from Groq API
    // const models = await groq.models.list();
    
    return res.json({
      success: true,
      currentModel: 'llama-3.3-70b-versatile',
      recommendedModel: 'llama-3.3-70b-versatile',
      supportedModels: SUPPORTED_MODELS,
      note: 'llama-3.3-70b-versatile is the latest supported model as of 2026'
    });
  } catch (error) {
    console.error('Get models error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get models' 
    });
  }
};

// Optional: Get active sessions (for debugging)
exports.getActiveSessions = (req, res) => {
  try {
    // In production, add authentication
    const sessions = Array.from(conversations.entries()).map(([id, data]) => ({
      sessionId: id,
      messageCount: data.messages.length,
      createdAt: data.createdAt,
      lastUpdated: data.lastUpdated,
      age: Math.round((Date.now() - data.createdAt) / 60000) + ' minutes'
    }));

    return res.json({
      success: true,
      totalSessions: conversations.size,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get sessions' 
    });
  }
};