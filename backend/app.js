const express = require('express');
const cors = require('cors');

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



// ========== USER ROUTES ==========
const userRoutes = require('./routes/User');
const mlRoutes = require('./routes/mlRoutes');
const saveLocationRoutes = require('./routes/SaveLocationRoutes');


app.use('/api/v1/users', userRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/v1/locations', saveLocationRoutes); 



// ========== HEALTH CHECK ==========
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    clientOrigin: req.headers.origin || 'No origin (likely mobile app)',
    clientIP: req.ip
  });
});

module.exports = app;