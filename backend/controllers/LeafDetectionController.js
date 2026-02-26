const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const leafService = require('../services/LeafServices');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const LeafAnalysis = require('../models/LeafAnalysis');

// Use memory storage
const leafUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: JPEG, PNG, WebP'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Helper function to convert severity string to number
const severityToNumber = (severity) => {
  if (!severity) return 0;
  switch (severity.toLowerCase()) {
    case 'none': return 0;
    case 'low': return 20;
    case 'moderate': return 50;
    case 'high': return 75;
    case 'critical': return 95;
    default: return 0;
  }
};

// Helper function to get severity level from number
const getSeverityLevel = (severityNum) => {
  if (severityNum >= 80) return 'Critical';
  if (severityNum >= 60) return 'High';
  if (severityNum >= 40) return 'Medium';
  if (severityNum >= 20) return 'Low';
  return 'Very Low';
};

// ============================================
// CONTROLLER ROUTES
// ============================================

// @desc    Upload and analyze leaf image for disease detection
// @route   POST /api/v1/leaf/analyze
// @access  Private
exports.analyzeLeaf = async (req, res) => {
  const upload = leafUpload.single('image');
  
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Please provide an image file with field name "image"'
      });
    }
    
    console.log(`📸 Leaf image uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log('User:', req.user ? req.user.email : 'No user');
    
    let cloudinaryResult = null;
    let tempFilePath = null;
    
    try {
      // Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      
      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      tempFilePath = path.join(tempDir, `leaf-${Date.now()}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      console.log('✅ Temp file created:', tempFilePath);
      
      cloudinaryResult = await uploadToCloudinary(tempFilePath, 'rubbersense/leaf');
      console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.url}`);
      
      // Check model availability first
      const modelAvailable = await leafService.checkModelAvailability();
      console.log('Model available:', modelAvailable);
      
      // Analyze the image using the service with trained model
      console.log('Starting analysis...');
      const analysis = await leafService.analyzeLeaf(
        tempFilePath,
        req.user?._id || req.user?.id,
        { returnVisualization: true }
      );
      
      console.log('Analysis completed:', analysis.disease_detected);
      console.log('Confidence:', analysis.confidence);
      console.log('ML Model Used:', analysis.ml_model_used);
      
      // Add Cloudinary image info
      analysis.image = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.url,
        secure_url: cloudinaryResult.secure_url
      };
      
      // Add user info
      if (req.user) {
        analysis.userId = req.user.id || req.user._id;
        analysis.userEmail = req.user.email;
      }
      
      // Extract data with fallback values
      const diseaseInfo = analysis.diseaseInfo || {};
      const visualMetrics = analysis.visualMetrics || {};
      
      // Calculate severity number from string or use default
      const severityString = diseaseInfo.severity || analysis.severity || 'unknown';
      const severityNumber = severityToNumber(severityString);
      
      // Save analysis to database with proper fallback values
      const leafAnalysis = new LeafAnalysis({
        userId: req.user.id || req.user._id,
        imageUrl: cloudinaryResult.url,
        imagePublicId: cloudinaryResult.public_id,
        diseaseDetected: diseaseInfo.name || analysis.disease_detected || 'Unknown',
        confidence: diseaseInfo.confidence || analysis.confidence || 0,
        severity: severityNumber,
        severityLevel: getSeverityLevel(severityNumber),
        spotsCount: visualMetrics.spotCount || analysis.spots_count || 0,
        colorAnalysis: {
          primaryColor: visualMetrics.dominantColor || 'unknown',
          discoloration: visualMetrics.leafCoverage ? 100 - visualMetrics.leafCoverage : 0,
          healthyGreenPercentage: visualMetrics.leafCoverage || 0,
          affectedAreaPercentage: 100 - (visualMetrics.leafCoverage || 0)
        },
        treatmentRecommendations: analysis.treatment_recommendations || analysis.treatment || [],
        preventionStrategies: analysis.prevention_strategies || analysis.prevention || [],
        fullAnalysis: analysis,
        processingTime: analysis.processingTime || 'N/A',
        mlModelUsed: analysis.modelInfo?.mlModelUsed || analysis.ml_model_used || false
      });
      
      await leafAnalysis.save();
      console.log(`✅ Analysis saved to database with ID: ${leafAnalysis._id}`);
      
      res.status(200).json({
        success: true,
        message: 'Leaf analysis completed successfully',
        data: {
          ...analysis,
          analysisId: leafAnalysis._id,
          image: {
            url: cloudinaryResult.url,
            public_id: cloudinaryResult.public_id
          }
        }
      });
      
    } catch (analysisError) {
      console.error('❌ Analysis error:', analysisError);
      console.error('Error stack:', analysisError.stack);
      
      // If analysis failed and we uploaded to Cloudinary, delete the image
      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await deleteFromCloudinary(cloudinaryResult.public_id);
          console.log('✅ Deleted failed analysis image from Cloudinary');
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary:', deleteError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Error analyzing leaf image',
        error: analysisError.message,
        stack: process.env.NODE_ENV === 'development' ? analysisError.stack : undefined
      });
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
    }
  });
};

// @desc    Get leaf analysis history for user
// @route   GET /api/v1/leaf/history
// @access  Private
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { limit = 20, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    const query = { userId };
    
    // Optional filters
    if (req.query.disease) {
      query.diseaseDetected = req.query.disease;
    }
    
    if (req.query.severity) {
      query.severityLevel = req.query.severity;
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get total count for pagination
    const total = await LeafAnalysis.countDocuments(query);
    
    // Get analyses with pagination
    const analyses = await LeafAnalysis.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .select('-fullAnalysis');
    
    res.status(200).json({
      success: true,
      data: analyses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching history',
      error: error.message
    });
  }
};

// @desc    Get leaf analysis statistics for user
// @route   GET /api/v1/leaf/stats
// @access  Private
exports.getAnalysisStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Get overall statistics
    const stats = await LeafAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgSeverity: { $avg: '$severity' },
          avgSpotsCount: { $avg: '$spotsCount' }
        }
      }
    ]);
    
    // Get disease distribution
    const diseaseDistribution = await LeafAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$diseaseDetected',
          count: { $sum: 1 },
          avgSeverity: { $avg: '$severity' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get severity distribution
    const severityDistribution = await LeafAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$severityLevel',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTrend = await LeafAnalysis.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          avgSeverity: { $avg: '$severity' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalAnalyses: 0,
          avgConfidence: 0,
          avgSeverity: 0,
          avgSpotsCount: 0
        },
        diseaseDistribution: diseaseDistribution.map(item => ({
          disease: item._id || 'Unknown',
          count: item.count,
          avgSeverity: item.avgSeverity
        })),
        severityDistribution,
        recentTrend,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
      error: error.message
    });
  }
};

// @desc    Delete a specific analysis from history
// @route   DELETE /api/v1/leaf/history/:analysisId
// @access  Private
exports.deleteAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { analysisId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        message: 'Analysis ID is required'
      });
    }
    
    // Find the analysis and ensure it belongs to the user
    const analysis = await LeafAnalysis.findOne({
      _id: analysisId,
      userId: userId
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found or you do not have permission to delete it'
      });
    }
    
    // Delete image from Cloudinary
    if (analysis.imagePublicId) {
      try {
        await deleteFromCloudinary(analysis.imagePublicId);
        console.log(`✅ Deleted image from Cloudinary: ${analysis.imagePublicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    
    // Delete from database
    await LeafAnalysis.findByIdAndDelete(analysisId);
    
    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting analysis',
      error: error.message
    });
  }
};

// @desc    Get single analysis by ID
// @route   GET /api/v1/leaf/analysis/:analysisId
// @access  Private
exports.getAnalysisById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { analysisId } = req.params;
    
    const analysis = await LeafAnalysis.findOne({
      _id: analysisId,
      userId: userId
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis',
      error: error.message
    });
  }
};

// @desc    Batch delete multiple analyses
// @route   DELETE /api/v1/leaf/history/batch
// @access  Private
exports.batchDeleteAnalyses = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { analysisIds } = req.body;
    
    if (!analysisIds || !Array.isArray(analysisIds) || analysisIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of analysis IDs to delete'
      });
    }
    
    // Find all analyses belonging to the user
    const analyses = await LeafAnalysis.find({
      _id: { $in: analysisIds },
      userId: userId
    });
    
    if (analyses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No analyses found to delete'
      });
    }
    
    // Delete images from Cloudinary
    const deletePromises = analyses.map(analysis => {
      if (analysis.imagePublicId) {
        return deleteFromCloudinary(analysis.imagePublicId).catch(err => {
          console.error(`Error deleting ${analysis.imagePublicId} from Cloudinary:`, err);
          return null;
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(deletePromises);
    
    // Delete from database
    await LeafAnalysis.deleteMany({
      _id: { $in: analysisIds },
      userId: userId
    });
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${analyses.length} analyses`,
      data: {
        deletedCount: analyses.length,
        deletedIds: analyses.map(a => a._id)
      }
    });
    
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during batch delete',
      error: error.message
    });
  }
};

// @desc    Get leaf detection info and system status
// @route   GET /api/v1/leaf/info
// @access  Public
exports.getLeafInfo = async (req, res) => {
  try {
    // Check model availability
    const modelAvailable = await leafService.checkModelAvailability();
    const modelInfo = leafService.getModelInfo();
    
    // Check Python availability
    const pythonAvailable = await leafService.checkPythonAvailability();
    const packagesAvailable = pythonAvailable ? await leafService.checkPythonPackages() : false;
    
    // Get list of supported diseases
    const diseases = leafService.getSupportedDiseases();
    
    res.status(200).json({
      success: true,
      data: {
        name: 'RubberSense Leaf Disease Detection',
        version: '1.0.0',
        description: 'AI-powered rubber tree leaf disease detection and analysis system',
        features: [
          'Disease Detection & Classification',
          'Severity Assessment',
          'Spot Counting & Analysis',
          'Color Analysis',
          'Treatment Recommendations',
          'Prevention Strategies'
        ],
        supportedFormats: ['JPEG', 'PNG', 'WebP'],
        maxFileSize: '10MB',
        supportedDiseases: diseases,
        mlModel: {
          name: 'Leaf.pt',
          type: 'YOLO Classification Model',
          status: modelAvailable ? 'Active' : 'Not Found',
          path: modelAvailable ? '../ML-Models/Leaf.pt' : null,
          ...modelInfo
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          packagesAvailable: packagesAvailable,
          mlReady: modelAvailable && pythonAvailable && packagesAvailable,
          usingFallback: !(modelAvailable && pythonAvailable && packagesAvailable)
        },
        endpoints: {
          analyze: 'POST /api/v1/leaf/analyze',
          history: 'GET /api/v1/leaf/history',
          stats: 'GET /api/v1/leaf/stats',
          analysis: 'GET /api/v1/leaf/analysis/:analysisId',
          delete: 'DELETE /api/v1/leaf/history/:analysisId',
          info: 'GET /api/v1/leaf/info'
        }
      }
    });
  } catch (error) {
    console.error('Get info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};