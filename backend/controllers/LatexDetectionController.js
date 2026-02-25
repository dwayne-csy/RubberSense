const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const latexService = require('../services/LatexService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const LatexAnalysis = require('../models/LatexAnalysis'); // You'll need to create this model

// Use memory storage instead of disk storage since we're uploading to Cloudinary
const latexUpload = multer({
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Map quality class from analysis to schema enum values
 * @param {Object} analysis - The analysis result
 * @returns {string} - Mapped quality class (High, Medium, Low, Unknown)
 */
const mapQualityClass = (analysis) => {
  // Try to get quality class from different possible paths in the response
  const rawClass = analysis.latex_analysis?.quality_class || 
                   analysis.latex_analysis?.primary_classification?.class;
  
  if (!rawClass) return 'Unknown';
  
  // Convert to string and clean up
  const classStr = String(rawClass).toLowerCase();
  
  // Map the values to schema enum
  if (classStr.includes('high')) return 'High';
  if (classStr.includes('medium')) return 'Medium';
  if (classStr.includes('low')) return 'Low';
  
  return 'Unknown';
};

/**
 * Extract impurities as array of strings
 * @param {Object} analysis - The analysis result
 * @returns {Array} - Array of impurity types
 */
const extractImpurities = (analysis) => {
  const impurities = [];
  
  if (analysis.latex_analysis?.impurities?.detected) {
    const type = analysis.latex_analysis.impurities.type;
    if (type && type !== 'none') {
      // Map to valid enum values
      if (type.includes('dirt')) impurities.push('dirt');
      else if (type.includes('bark')) impurities.push('bark');
      else if (type.includes('leaves')) impurities.push('leaves');
      else if (type.includes('water')) impurities.push('water');
      else if (type.includes('chemical')) impurities.push('chemicals');
      else impurities.push('other');
    }
  }
  
  return impurities;
};

/**
 * Extract recommendations as array of strings
 * @param {Object} analysis - The analysis result
 * @returns {Array} - Array of recommendation strings
 */
const extractRecommendations = (analysis) => {
  const recommendations = [];
  
  if (analysis.product_recommendations?.recommended_products) {
    analysis.product_recommendations.recommended_products.forEach(product => {
      if (typeof product === 'string') {
        recommendations.push(product);
      } else if (product.name) {
        recommendations.push(product.name);
      }
    });
  }
  
  if (analysis.product_recommendations?.suggested_applications) {
    analysis.product_recommendations.suggested_applications.forEach(app => {
      if (!recommendations.includes(app)) {
        recommendations.push(app);
      }
    });
  }
  
  return recommendations;
};

// ============================================
// CONTROLLER ROUTES
// ============================================

// @desc    Upload and analyze latex image
// @route   POST /api/v1/latex/analyze
// @access  Private
exports.analyzeLatex = async (req, res) => {
  const upload = latexUpload.single('image');
  
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
    
    console.log(`File uploaded: ${req.file.originalname}`);
    console.log(`File size: ${(req.file.size / 1024).toFixed(2)} KB`);
    
    let cloudinaryResult = null;
    let tempFilePath = null;
    
    try {
      // Upload to Cloudinary first
      console.log('📤 Uploading to Cloudinary...');
      
      // Create a temp file path for Cloudinary upload
      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      tempFilePath = path.join(tempDir, `latex-${Date.now()}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      
      // Upload to Cloudinary
      cloudinaryResult = await uploadToCloudinary(tempFilePath, 'rubbersense/latex');
      console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.url}`);
      
      // Get region from request body (default to global_avg)
      const region = req.body.region || 'global_avg';
      
      // Check model availability first
      const modelAvailable = latexService.checkModelAvailability();
      const modelInfo = latexService.getModelInfo();
      
      if (!modelAvailable) {
        console.warn('⚠️ Warning: Trained model not found at expected path');
      } else {
        console.log(`✅ Model found: ${modelInfo.sizeKB} KB, modified: ${modelInfo.modifiedAt}`);
      }
      
      // Check Python environment
      const pythonAvailable = await latexService.checkPythonAvailability();
      const packagesAvailable = pythonAvailable ? await latexService.checkPythonPackages() : false;
      
      console.log(`Python available: ${pythonAvailable}, Packages available: ${packagesAvailable}`);
      
      // Analyze the image using the service with trained model
      const analysis = await latexService.analyzeLatex(tempFilePath, {
        region: region,
        returnVisualization: true
      });
      
      // Add Cloudinary image info to analysis
      analysis.image = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.url,
        secure_url: cloudinaryResult.secure_url
      };
      
      // Add user info
      if (req.user) {
        analysis.userId = req.user.id;
        analysis.userEmail = req.user.email;
        analysis.userName = req.user.name;
      }
      
      // Map quality class to schema enum values
      const qualityClass = mapQualityClass(analysis);
      
      // Extract impurities and recommendations
      const impuritiesDetected = extractImpurities(analysis);
      const recommendations = extractRecommendations(analysis);
      
      // Save analysis to database
      const latexAnalysis = new LatexAnalysis({
        userId: req.user.id,
        imageUrl: cloudinaryResult.url,
        imagePublicId: cloudinaryResult.public_id,
        region: region,
        qualityClass: qualityClass,
        qualityScore: analysis.latex_analysis?.quality_score || 
                      analysis.latex_analysis?.primary_classification?.confidence,
        dryRubberContent: analysis.latex_analysis?.dry_rubber_content,
        contaminationDetected: analysis.latex_analysis?.contamination?.detected || false,
        colorScore: analysis.latex_analysis?.color_score,
        consistencyScore: analysis.latex_analysis?.consistency_score,
        impuritiesDetected: impuritiesDetected,
        quantityEstimate: analysis.latex_analysis?.quantity_estimation?.estimated_volume_ml,
        recommendations: recommendations,
        marketPrice: {
          amount: analysis.market_analysis?.price_per_kg,
          currency: analysis.market_analysis?.currency || 'PHP',
          region: region
        },
        fullAnalysis: analysis,
        processingTime: analysis.processingTime,
        mlModelUsed: analysis.ml_model_used || false
      });
      
      await latexAnalysis.save();
      console.log(`✅ Analysis saved to database with ID: ${latexAnalysis._id}`);
      
      // Prepare response with comprehensive data
      const response = {
        success: true,
        message: 'Latex analysis completed successfully',
        timestamp: new Date().toISOString(),
        data: {
          ...analysis,
          analysisId: latexAnalysis._id,
          image: {
            url: cloudinaryResult.url,
            public_id: cloudinaryResult.public_id
          }
        },
        meta: {
          modelUsed: analysis.ml_model_used,
          modelPath: modelAvailable ? '../ML-Models/Latex.pt' : null,
          fallbackUsed: !analysis.ml_model_used,
          processingTime: analysis.processingTime || 'unknown',
          region: region
        }
      };
      
      // Log analysis summary
      console.log('✅ Analysis completed:');
      console.log(`   Quality: ${qualityClass}`);
      console.log(`   Confidence: ${analysis.latex_analysis?.quality_score || 0}%`);
      console.log(`   DRC: ${analysis.latex_analysis?.dry_rubber_content || 0}%`);
      
      res.status(200).json(response);
      
    } catch (analysisError) {
      console.error('❌ Analysis error:', analysisError);
      
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
        message: 'Error analyzing latex image',
        error: analysisError.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
          else console.log('✅ Temp file deleted');
        });
      }
    }
  });
};

// @desc    Get latex analysis history for user
// @route   GET /api/v1/latex/history
// @access  Private
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    const query = { userId };
    
    // Optional filters
    if (req.query.qualityClass) {
      query.qualityClass = req.query.qualityClass;
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get total count for pagination
    const total = await LatexAnalysis.countDocuments(query);
    
    // Get analyses with pagination
    const analyses = await LatexAnalysis.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .select('-fullAnalysis'); // Exclude full analysis data to keep response size manageable
    
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
      },
      timestamp: new Date().toISOString()
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

// @desc    Get latex analysis statistics for user
// @route   GET /api/v1/latex/stats
// @access  Private
exports.getAnalysisStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get overall statistics
    const stats = await LatexAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgQualityScore: { $avg: '$qualityScore' },
          avgDryRubberContent: { $avg: '$dryRubberContent' },
          avgConfidence: { $avg: '$qualityScore' },
          totalContaminationDetected: {
            $sum: { $cond: ['$contaminationDetected', 1, 0] }
          }
        }
      }
    ]);
    
    // Get quality distribution
    const qualityDistribution = await LatexAnalysis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$qualityClass',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTrend = await LatexAnalysis.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          avgQuality: { $avg: '$qualityScore' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalAnalyses: 0,
          avgQualityScore: 0,
          avgDryRubberContent: 0,
          avgConfidence: 0,
          totalContaminationDetected: 0
        },
        qualityDistribution: qualityDistribution.map(item => ({
          class: item._id || 'Unknown',
          count: item.count
        })),
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
// @route   DELETE /api/v1/latex/history/:analysisId
// @access  Private
exports.deleteAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { analysisId } = req.params;
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        message: 'Analysis ID is required'
      });
    }
    
    // Find the analysis and ensure it belongs to the user
    const analysis = await LatexAnalysis.findOne({
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
        // Continue with deletion even if Cloudinary delete fails
      }
    }
    
    // Delete from database
    await LatexAnalysis.findByIdAndDelete(analysisId);
    
    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully',
      data: {
        deletedId: analysisId
      }
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
// @route   GET /api/v1/latex/analysis/:analysisId
// @access  Private
exports.getAnalysisById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { analysisId } = req.params;
    
    const analysis = await LatexAnalysis.findOne({
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

// @desc    Get latex detection info and system status
// @route   GET /api/v1/latex/info
// @access  Public
exports.getLatexInfo = async (req, res) => {
  try {
    // Check model availability
    const modelAvailable = latexService.checkModelAvailability();
    const modelInfo = latexService.getModelInfo();
    
    // Check Python availability
    const pythonAvailable = await latexService.checkPythonAvailability();
    const packagesAvailable = pythonAvailable ? await latexService.checkPythonPackages() : false;
    
    // Get detailed model info
    let modelDetails = {};
    if (modelAvailable) {
      try {
        modelDetails = await latexService.getModelDetails();
      } catch (e) {
        console.warn('Could not get detailed model info:', e.message);
      }
    }
    
    // System health status
    const mlReady = modelAvailable && pythonAvailable && packagesAvailable;
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        name: 'RubberSense Latex Detection System',
        version: '2.0.0',
        description: 'AI-powered latex quality analysis and classification system using trained YOLO model',
        capabilities: [
          'Latex Quality Classification (High/Medium/Low)',
          'Contamination Detection',
          'Dry Rubber Content (DRC) Estimation',
          'Color Analysis',
          'Consistency Analysis',
          'Impurity Detection',
          'Quantity Estimation',
          'Product Recommendations',
          'Regional Market Pricing',
          'Batch Analysis Support'
        ],
        specifications: {
          supportedFormats: ['JPEG', 'PNG', 'WebP'],
          maxFileSize: '10MB',
          processingTime: '2-5 seconds',
          confidenceThreshold: '35%',
          drcAccuracy: '±5%',
          imageStorage: 'Cloudinary (Cloud-based)'
        },
        mlModel: {
          name: 'Latex.pt',
          type: 'YOLO (PyTorch)',
          architecture: 'YOLOv8',
          status: modelAvailable ? 'Active' : 'Not Found',
          path: modelAvailable ? '../ML-Models/Latex.pt' : null,
          details: {
            ...modelInfo,
            ...modelDetails
          }
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          pythonVersion: pythonAvailable ? await latexService.getPythonVersion() : null,
          packagesAvailable: packagesAvailable,
          requiredPackages: ['torch', 'torchvision', 'ultralytics', 'PIL', 'numpy', 'opencv-python'],
          mlReady: mlReady,
          usingFallback: !mlReady,
          fallbackReason: !mlReady ? latexService.getFallbackReason() : null,
          environment: process.env.NODE_ENV || 'development',
          platform: process.platform
        },
        regionalPricing: {
          supportedRegions: ['thailand', 'indonesia', 'malaysia', 'vietnam', 'india', 'global_avg'],
          currency: 'PHP',
          lastUpdated: new Date().toISOString().split('T')[0]
        },
        endpoints: {
          analyze: 'POST /api/v1/latex/analyze',
          history: 'GET /api/v1/latex/history',
          stats: 'GET /api/v1/latex/stats',
          analysis: 'GET /api/v1/latex/analysis/:analysisId',
          delete: 'DELETE /api/v1/latex/history/:analysisId',
          info: 'GET /api/v1/latex/info'
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

// @desc    Batch delete multiple analyses
// @route   DELETE /api/v1/latex/history/batch
// @access  Private
exports.batchDeleteAnalyses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { analysisIds } = req.body;
    
    if (!analysisIds || !Array.isArray(analysisIds) || analysisIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of analysis IDs to delete'
      });
    }
    
    // Find all analyses belonging to the user
    const analyses = await LatexAnalysis.find({
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
    await LatexAnalysis.deleteMany({
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