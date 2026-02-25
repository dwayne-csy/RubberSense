const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');
const dotenv = require('dotenv');

// ========== LOAD ENVIRONMENT VARIABLES ==========
// Load .env from config folder before anything else
const envPath = path.join(__dirname, 'config/.env');
console.log('📁 Loading .env from:', envPath);

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found at:', envPath);
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error('❌ Failed to load .env file:', result.error);
  } else {
    console.log('✅ .env file loaded successfully from config folder');
    console.log('🔑 GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
    console.log('🚀 NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('🔌 PORT:', process.env.PORT || '4001');
  }
} else {
  console.error('❌ .env file NOT found at:', envPath);
  console.error('Please create the .env file in the config folder with GROQ_API_KEY=your_key_here');
}

const app = express();

// ========== DYNAMIC CORS CONFIGURATION ==========
const corsOptions = {
  origin: function (origin, callback) {
    // Development: Allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Production: Only allow specific origins
    const allowedOrigins = [
      'https://your-production-domain.com', // Your production frontend
      'https://admin.your-domain.com'       // Your admin panel
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// ========== BODY PARSING ==========
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== STATIC FILE SERVING ==========
// Create upload directory if it doesn't exist
const communityUploadDir = path.join(os.tmpdir(), 'rubbersense_community_uploads');
if (!fs.existsSync(communityUploadDir)) {
  fs.mkdirSync(communityUploadDir, { recursive: true });
  console.log('Created community upload directory:', communityUploadDir);
}

// Serve community uploads statically
app.use('/uploads/community', express.static(communityUploadDir, {
  setHeaders: (res, filePath) => {
    // Set CORS headers for static files
    res.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? 'https://your-production-domain.com' : '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set cache headers (1 day cache for images/videos)
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || 
        filePath.endsWith('.png') || filePath.endsWith('.gif') ||
        filePath.endsWith('.webp') || filePath.endsWith('.mp4') ||
        filePath.endsWith('.webm') || filePath.endsWith('.avi')) {
      res.set('Cache-Control', 'public, max-age=86400'); // 1 day cache
    }
  }
}));

// Health check endpoint for upload directory
app.get('/api/v1/upload/health', (req, res) => {
  const dirExists = fs.existsSync(communityUploadDir);
  let fileCount = 0;
  let totalSize = 0;
  
  if (dirExists) {
    try {
      const files = fs.readdirSync(communityUploadDir);
      fileCount = files.length;
      
      // Calculate total size
      files.forEach(file => {
        const filePath = path.join(communityUploadDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
    } catch (err) {
      console.error('Error reading upload directory:', err);
    }
  }
  
  res.status(200).json({
    success: true,
    uploadDirectory: {
      path: communityUploadDir,
      exists: dirExists,
      fileCount: fileCount,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    }
  });
});

// ========== USER ROUTES ==========
const userRoutes = require('./routes/User');
const saveLocationRoutes = require('./routes/SaveLocationRoutes');
const contactRoutes = require('./routes/Contact');
const mailRoutes = require('./routes/Mail');
const communityRoutes = require('./routes/communityRoutes');
const userProfileRoutes = require('./routes/UserProfile');
const messageRoutes = require('./routes/Message');
const manageUserRoutes = require('./routes/ManageUser');
const uploadRoutes = require('./routes/uploadRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const notificationRoutes = require('./routes/Notification');
const latexDetectionRoutes = require('./routes/latexDetectionRoutes');
const leafRoutes = require('./routes/LeafDetectionRoutes');
const trunksDetectionRoutes = require('./routes/TrunksDetectionRoutes');
const groqChatbotRoutes = require('./routes/groqchatbotroute');

// ========== API ROUTES ==========
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/locations', saveLocationRoutes); 
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/mail', mailRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/users', userProfileRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/users', manageUserRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin/reports', adminReportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/latex', latexDetectionRoutes);
app.use('/api/v1/leaf', leafRoutes);
app.use('/api/v1/trunks', trunksDetectionRoutes);
app.use('/api/v1/groqchatbot', groqChatbotRoutes);

// ========== GROQ CHATBOT HEALTH CHECK ==========
// Add a specific health check for the chatbot
app.get('/api/v1/groqchatbot/health', (req, res) => {
  try {
    // Check if GROQ_API_KEY is configured
    const apiConfigured = !!process.env.GROQ_API_KEY;
    
    res.status(200).json({
      status: 'healthy',
      service: 'RubberSense AI Assistant',
      apiConfigured: apiConfigured,
      groqInitialized: apiConfigured, // Will be true if API key exists
      timestamp: new Date().toISOString(),
      message: apiConfigured ? 
        '✅ RubberSense AI is ready to chat!' : 
        '❌ GROQ_API_KEY is not configured. Please add it to your .env file.'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      service: 'RubberSense AI Assistant',
      error: error.message
    });
  }
});

// ========== GENERAL HEALTH CHECK =========
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 4001,
    clientOrigin: req.headers.origin || 'No origin (likely mobile app)',
    clientIP: req.ip,
    uploadsAvailable: true,
    uploadEndpoint: '/uploads/community',
    groqChatbot: {
      configured: !!process.env.GROQ_API_KEY,
      endpoint: '/api/v1/groqchatbot/chat'
    }
  });
});

// ========== 404 HANDLER ==========
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/v1/health',
      '/api/v1/groqchatbot/health',
      '/api/v1/upload/health',
      '/api/v1/community/posts',
      '/api/v1/upload/community/single',
      '/api/v1/upload/community/multiple'
    ]
  });
});

module.exports = app;