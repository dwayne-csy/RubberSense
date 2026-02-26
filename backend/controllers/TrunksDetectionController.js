const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const trunksService = require('../services/TrunksService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const TrunkAnalysis = require('../models/TrunksAnalysis');

// Use memory storage
const trunksUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: JPEG, PNG, WebP'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  }
});

// ============================================
// CONTROLLER ROUTES
// ============================================

/**
 * @desc    Upload and analyze trunk image using trained ML model
 * @route   POST /api/v1/trunks/analyze
 * @access  Private
 */
exports.analyzeTrunk = async (req, res) => {
  const upload = trunksUpload.single('image');
  
  upload(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      console.error('📤 Upload error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Please provide an image file with field name "image"'
      });
    }
    
    console.log(`📤 File uploaded: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);
    
    let cloudinaryResult = null;
    let tempFilePath = null;
    
    try {
      // Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      
      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      tempFilePath = path.join(tempDir, `trunk-${Date.now()}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      
      cloudinaryResult = await uploadToCloudinary(tempFilePath, 'rubbersense/trunks');
      console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.url}`);
      
      // Check model availability first (for logging)
      const modelAvailable = trunksService.checkModelAvailability();
      const modelInfo = trunksService.getModelInfo();
      
      console.log(`🤖 ML Model status: ${modelAvailable ? '✅ Available' : '❌ Not found'}`);
      if (modelAvailable) {
        console.log(`📊 Model info: ${modelInfo.sizeKB} KB, modified: ${modelInfo.modifiedAt}`);
      }
      
      // Generate cache key based on file content for deduplication
      const cacheKey = req.user ? 
        `user_${req.user.id}_${req.file.originalname}_${Date.now()}` : 
        `anon_${req.file.originalname}_${Date.now()}`;
      
      // Analyze the image using the service with trained model
      const analysis = await trunksService.analyzeTrunk(tempFilePath, {
        returnVisualization: true,
        detailedAnalysis: true,
        useCache: true,
        cacheKey: cacheKey
      });
      
      // Add Cloudinary image info
      analysis.image = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.url,
        secure_url: cloudinaryResult.secure_url
      };
      
      // Add user info if authenticated
      if (req.user) {
        analysis.user = {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name
        };
      }
      
      // Add request metadata
      analysis.request = {
        id: crypto.randomBytes(16).toString('hex'),
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - (req.timestamp || Date.now())
      };
      
     const dbAnalysisData = {
  userId: req.user?.id,
  imageUrl: cloudinaryResult.url,
  imagePublicId: cloudinaryResult.public_id,
  primaryDetection: analysis.primary_detection || analysis.primaryDetection || {},
  allDetections: analysis.all_detections || analysis.detections || [],
  maturity: analysis.maturity || {},
  colorAnalysis: analysis.color_analysis || analysis.visual_analysis?.color || {},
  textureAnalysis: analysis.texture_analysis || analysis.visual_analysis?.texture || {}, // This is now an object
  healthScore: analysis.health_score || analysis.healthScore || 0,
  ageEstimate: analysis.age_estimate || analysis.age_estimation?.estimated_years || null,
  careRecommendations: analysis.care_recommendations || analysis.recommendations || [],
  fullAnalysis: analysis,
  processingTime: analysis.processingTime || 'N/A',
  mlModelUsed: analysis.model_used !== false,
  disease: analysis.disease || null,
  age_estimation: analysis.age_estimation || null,
  visual_analysis: analysis.visual_analysis || null,
  model_info: analysis.model_info || null,
  image_metadata: analysis.image_metadata || null
};
      
      // Save analysis to database
      const trunkAnalysis = new TrunkAnalysis(dbAnalysisData);
      
      await trunkAnalysis.save();
      console.log(`✅ Analysis saved to database with ID: ${trunkAnalysis._id}`);
      
      // Log success
      console.log(`✅ Analysis complete for ${req.file.originalname}`);
      if (analysis.primary_detection) {
        console.log(`🎯 Result: ${analysis.primary_detection.display_name} (${analysis.primary_detection.confidence}%)`);
      }
      
      // Send response
      res.status(200).json({
        success: true,
        message: 'Trunk analysis completed successfully',
        data: {
          ...analysis,
          analysisId: trunkAnalysis._id,
          image: {
            url: cloudinaryResult.url,
            public_id: cloudinaryResult.public_id
          }
        }
      });
      
    } catch (analysisError) {
      console.error('❌ Analysis error:', analysisError);
      console.error('📝 Error details:', analysisError.stack);
      
      // If analysis failed and we uploaded to Cloudinary, delete the image
      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await deleteFromCloudinary(cloudinaryResult.public_id);
          console.log('✅ Deleted failed analysis image from Cloudinary');
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary:', deleteError);
        }
      }
      
      // Determine appropriate status code
      const statusCode = analysisError.message.includes('not found') ? 404 :
                        analysisError.message.includes('format') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: 'Error analyzing trunk image',
        error: analysisError.message,
        suggestion: 'Please try again with a different image or contact support if the problem persists'
      });
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
          else console.log('🗑️ Temp file deleted');
        });
      }
    }
  });
};

/**
 * @desc    Get trunk analysis history for user
 * @route   GET /api/v1/trunks/history
 * @access  Private
 */
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { limit = 10, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;
    
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
      query.$or = [
        { 'primaryDetection.class': req.query.disease },
        { 'primaryDetection.display_name': { $regex: req.query.disease, $options: 'i' } },
        { 'disease.name': { $regex: req.query.disease, $options: 'i' } }
      ];
    }
    
    if (req.query.maturity) {
      query['maturity.class'] = { $regex: req.query.maturity, $options: 'i' };
    }
    
    if (req.query.minHealthScore) {
      query.healthScore = { $gte: parseInt(req.query.minHealthScore) };
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get total count for pagination
    const total = await TrunkAnalysis.countDocuments(query);
    
    // Get analyses with pagination
    const analyses = await TrunkAnalysis.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum);
    
    // Format the response to match frontend expectations
    const formattedAnalyses = analyses.map(analysis => {
      // Extract primary detection info from various possible locations
      let primaryClass = 'Unknown';
      let primaryDisplayName = 'Unknown';
      let primaryConfidence = 0;
      
      if (analysis.primaryDetection) {
        primaryClass = analysis.primaryDetection.class || analysis.primaryDetection.class_name || 'Unknown';
        primaryDisplayName = analysis.primaryDetection.display_name || analysis.primaryDetection.name || primaryClass;
        primaryConfidence = analysis.primaryDetection.confidence || 0;
      } else if (analysis.disease) {
        primaryClass = analysis.disease.class || analysis.disease.name || 'Unknown';
        primaryDisplayName = analysis.disease.name || primaryClass;
        primaryConfidence = analysis.disease.confidence || 0;
      }
      
      // Extract maturity info
      let maturityClass = analysis.maturity?.class || 'Unknown';
      let maturityConfidence = analysis.maturity?.confidence || 0;
      
      return {
        _id: analysis._id,
        imageUrl: analysis.imageUrl,
        createdAt: analysis.createdAt,
        primaryDetection: {
          class: primaryClass,
          display_name: primaryDisplayName,
          confidence: primaryConfidence
        },
        maturity: {
          class: maturityClass,
          confidence: maturityConfidence
        },
        healthScore: analysis.healthScore || 0,
        ageEstimate: analysis.ageEstimate || analysis.age_estimation?.estimated_years || null,
        disease: primaryDisplayName,
        confidence: primaryConfidence
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        history: formattedAnalyses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('❌ Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching history',
      error: error.message
    });
  }
};

/**
 * @desc    Get trunk analysis statistics for user
 * @route   GET /api/v1/trunks/stats
 * @access  Private
 */
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
    const stats = await TrunkAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgHealthScore: { $avg: '$healthScore' },
          avgConfidence: { $avg: '$primaryDetection.confidence' },
          avgAgeEstimate: { $avg: '$ageEstimate' }
        }
      }
    ]);
    
    // Get disease distribution
    const diseaseDistribution = await TrunkAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: { $ifNull: ['$primaryDetection.class', '$disease.name', 'Unknown'] },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$primaryDetection.confidence' },
          avgHealthScore: { $avg: '$healthScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get maturity distribution
    const maturityDistribution = await TrunkAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: { $ifNull: ['$maturity.class', 'Unknown'] },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get health score distribution
    const healthScoreDistribution = await TrunkAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $bucket: {
          groupBy: '$healthScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    // Get recent trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTrend = await TrunkAnalysis.aggregate([
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
          avgHealthScore: { $avg: '$healthScore' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalAnalyses: 0,
          avgHealthScore: 0,
          avgConfidence: 0,
          avgAgeEstimate: 0
        },
        diseaseDistribution: diseaseDistribution.map(item => ({
          disease: item._id || 'Unknown',
          count: item.count,
          avgConfidence: item.avgConfidence,
          avgHealthScore: item.avgHealthScore
        })),
        maturityDistribution: maturityDistribution.map(item => ({
          maturity: item._id || 'Unknown',
          count: item.count
        })),
        healthScoreDistribution,
        recentTrend,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get specific trunk analysis by ID
 * @route   GET /api/v1/trunks/analysis/:id
 * @access  Private
 */
exports.getAnalysisById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    
    const analysis = await TrunkAnalysis.findOne({
      _id: id,
      userId: userId
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }
    
    // Format the analysis for frontend
    const formattedAnalysis = analysis.toObject();
    
    // Ensure primary detection is available
    if (!formattedAnalysis.primaryDetection && formattedAnalysis.disease) {
      formattedAnalysis.primaryDetection = {
        class: formattedAnalysis.disease.class || formattedAnalysis.disease.name,
        display_name: formattedAnalysis.disease.name,
        confidence: formattedAnalysis.disease.confidence,
        health_status: formattedAnalysis.disease.detected ? 'diseased' : 'healthy'
      };
    }
    
    res.status(200).json({
      success: true,
      data: formattedAnalysis
    });
  } catch (error) {
    console.error('❌ Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a specific analysis
 * @route   DELETE /api/v1/trunks/analysis/:id
 * @access  Private
 */
exports.deleteAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    
    // Find the analysis and ensure it belongs to the user
    const analysis = await TrunkAnalysis.findOne({
      _id: id,
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
        // Continue with deletion even if Cloudinary delete fails
      }
    }
    
    // Delete from database
    await TrunkAnalysis.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting analysis',
      error: error.message
    });
  }
};

/**
 * @desc    Batch delete multiple analyses
 * @route   DELETE /api/v1/trunks/history/batch
 * @access  Private
 */
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
    const analyses = await TrunkAnalysis.find({
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
          return null; // Continue with other deletions
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(deletePromises);
    
    // Delete from database
    const result = await TrunkAnalysis.deleteMany({
      _id: { $in: analysisIds },
      userId: userId
    });
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} analyses`,
      data: {
        deletedCount: result.deletedCount,
        deletedIds: analyses.map(a => a._id)
      }
    });
  } catch (error) {
    console.error('❌ Batch delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during batch delete',
      error: error.message
    });
  }
};

/**
 * @desc    Get trunks detection system information
 * @route   GET /api/v1/trunks/info
 * @access  Public
 */
exports.getTrunksInfo = async (req, res) => {
  try {
    // Check system status
    const startTime = Date.now();
    
    const modelAvailable = trunksService.checkModelAvailability();
    const modelInfo = trunksService.getModelInfo();
    const pythonAvailable = await trunksService.checkPythonAvailability();
    const packagesAvailable = pythonAvailable ? await trunksService.checkPythonPackages() : false;
    
    const mlReady = modelAvailable && pythonAvailable && packagesAvailable;
    
    // Get disease classes
    const diseaseClasses = trunksService.getDiseaseClasses();
    
    // Get cache stats
    const cacheStats = trunksService.getCacheStats();
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      success: true,
      data: {
        name: 'RubberSense Trunk Analysis',
        version: '2.0.0',
        description: 'AI-powered rubber tree trunk analysis and disease detection system using trained YOLO model',
        features: [
          '8 Disease Classes Detection',
          'Maturity Classification (Immature/Mature)',
          'Color Analysis',
          'Texture Analysis',
          'Health Score Assessment',
          'Age Estimation',
          'Priority-based Care Recommendations',
          'Visual Annotations'
        ],
        diseaseClasses: Object.values(diseaseClasses).map(d => ({
          id: d.id,
          name: d.name,
          severity: d.severity,
          description: d.description
        })),
        supportedFormats: ['JPEG', 'PNG', 'WebP'],
        maxFileSize: '10MB',
        mlModel: {
          name: 'Trunks.pt',
          type: 'YOLO (Ultralytics)',
          status: modelAvailable ? 'Active' : 'Not Found',
          path: modelAvailable ? '../ML-Models/Trunks.pt' : null,
          ...modelInfo
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          packagesAvailable: packagesAvailable,
          mlReady: mlReady,
          usingFallback: !mlReady,
          cacheSize: cacheStats.size,
          responseTime: `${responseTime}ms`,
          imageStorage: 'Cloudinary (Cloud-based)'
        },
        endpoints: {
          analyze: 'POST /api/v1/trunks/analyze',
          history: 'GET /api/v1/trunks/history',
          stats: 'GET /api/v1/trunks/stats',
          analysis: 'GET /api/v1/trunks/analysis/:id',
          delete: 'DELETE /api/v1/trunks/analysis/:id',
          batchDelete: 'DELETE /api/v1/trunks/history/batch',
          info: 'GET /api/v1/trunks/info'
        }
      }
    });
  } catch (error) {
    console.error('❌ Get info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving system information',
      error: error.message
    });
  }
};