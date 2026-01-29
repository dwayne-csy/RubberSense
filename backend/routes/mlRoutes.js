// backend/routes/mlRoutes.js
const express = require('express');
const router = express.Router();
const MLController = require('../controllers/MLController');
const { upload } = require('../utils/Multer'); // Import multer

// ------------------------
// Rubber Tree Processing Route - UPDATED with multer
// ------------------------
router.post('/process-rubber-tree', upload.single('image'), MLController.processRubberTree);

// Get all available models
router.get('/models', (req, res) => {
    res.json({
        available_models: [
            {
                id: 'rubber_tree',
                name: 'Rubber Tree Analysis',
                description: 'Analyzes rubber tree health, diseases, and productivity',
                capabilities: [
                    'Tree type identification',
                    'Disease detection',
                    'Trunk characteristics analysis',
                    'Tappability assessment',
                    'Latex quality prediction',
                    'Productivity recommendations'
                ]
            }
        ]
    });
});

// Get model status
router.get('/status', (req, res) => {
    res.json({
        status: 'operational',
        models_loaded: ['rubber_tree'],
        last_updated: new Date().toISOString()
    });
});

// Test route
router.get('/test', (req, res) => {
    res.json({
        message: 'ML API is working',
        endpoints: [
            'POST /api/ml/process-rubber-tree',
            'GET /api/ml/models',
            'GET /api/ml/status'
        ]
    });
});

module.exports = router;