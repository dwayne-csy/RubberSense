const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const latexService = require('../services/LatexService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const LatexAnalysis = require('../models/LatexAnalysis'); // You'll need to create this model
const MarketData = require('../models/MarketData');

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

const toNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const mapQualityGrade = (qualityClass, score) => {
  const quality = String(qualityClass || '').toLowerCase();
  const numericScore = toNumber(score, 0);

  if (quality === 'high') {
    return numericScore >= 85 ? 'A' : 'B';
  }
  if (quality === 'medium') {
    return numericScore >= 55 ? 'C' : 'D';
  }
  if (quality === 'low') return 'F';
  return 'F';
};

const normalizeTextList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'object') return Object.values(value).map((item) => String(item || '').trim()).filter(Boolean);
  return String(value)
    .split(/\n|;\s+|\|\s*/)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
};

const applyUserLatexInputs = (analysis, body = {}) => {
  if (!analysis || typeof analysis !== 'object') return {
    volumeInput: 0,
    dryWeightInput: 0,
    batchID: '',
    notes: ''
  };

  const volumeInput = toNumber(body.volume, 0);
  const dryWeightInput = toNumber(body.dryWeight, 0);
  const batchID = String(body.batchID || '').trim();
  const notes = String(body.notes || '').trim();

  if (!analysis.latex_analysis || typeof analysis.latex_analysis !== 'object') {
    analysis.latex_analysis = {};
  }

  if (!analysis.latex_analysis.quantity_estimation || typeof analysis.latex_analysis.quantity_estimation !== 'object') {
    analysis.latex_analysis.quantity_estimation = {};
  }

  const existingMlVolumeLiters = toNumber(analysis.latex_analysis.quantity_estimation.estimated_volume_ml, 0) / 1000;
  const resolvedVolumeLiters = volumeInput > 0 ? volumeInput : existingMlVolumeLiters;

  if (volumeInput > 0) {
    analysis.latex_analysis.quantity_estimation = {
      ...analysis.latex_analysis.quantity_estimation,
      estimated_volume_ml: round2(volumeInput * 1000),
      confidence: 100,
      source: 'user_input'
    };
  }

  const existingDrc = toNumber(analysis.latex_analysis.dry_rubber_content, 0);
  const resolvedDrc = clamp(dryWeightInput > 0 ? dryWeightInput : existingDrc, 0, 100);

  if (dryWeightInput > 0) {
    analysis.latex_analysis.dry_rubber_content = round2(resolvedDrc);
  }

  const dryYieldKg = round2(resolvedVolumeLiters * (resolvedDrc / 100));
  analysis.latex_analysis.estimated_yield = {
    wet_weight_kg: round2(resolvedVolumeLiters),
    dry_weight_kg: dryYieldKg,
    dry_yield_percentage: round2(resolvedDrc)
  };

  analysis.quantityEstimation = {
    volume: round2(resolvedVolumeLiters),
    weight: round2(resolvedVolumeLiters),
    confidence: volumeInput > 0 ? 100 : toNumber(analysis.latex_analysis.quantity_estimation.confidence, 0)
  };

  analysis.productYieldEstimation = {
    dryRubberContent: round2(resolvedDrc),
    estimatedYield: dryYieldKg,
    confidence: dryWeightInput > 0 ? 100 : toNumber(analysis.latex_analysis.primary_classification?.confidence, 0),
    productType:
      analysis.product_recommendations?.recommended_products?.[0]?.name ||
      analysis.productYieldEstimation?.productType ||
      'General latex products'
  };

  const qualityClass = mapQualityClass(analysis);
  const qualityScore = toNumber(
    analysis.latex_analysis?.quality_score ||
    analysis.latex_analysis?.primary_classification?.confidence,
    0
  );
  const qualityGrade = mapQualityGrade(qualityClass, qualityScore);

  analysis.qualityClassification = {
    grade: qualityGrade,
    confidence: qualityScore,
    description: analysis.latex_analysis?.primary_classification?.class || `${qualityClass} quality latex`
  };

  analysis.colorAnalysis = {
    primaryColor: analysis.latex_analysis?.color_analysis?.name || 'Unknown',
    hex: analysis.latex_analysis?.color_analysis?.hex || ''
  };

  analysis.contaminationDetection = {
    hasContamination: Boolean(analysis.latex_analysis?.contamination?.detected),
    hasWater: String(analysis.latex_analysis?.contamination?.type || '').toLowerCase().includes('water'),
    contaminationLevel: analysis.latex_analysis?.contamination?.detected ? 'detected' : 'none',
    contaminantTypes: normalizeTextList(analysis.latex_analysis?.impurities?.type),
    details: analysis.latex_analysis?.impurities?.description || ''
  };

  const productNames = Array.isArray(analysis.product_recommendations?.recommended_products)
    ? analysis.product_recommendations.recommended_products.map((item) => item?.name || item).filter(Boolean)
    : [];
  const suggestedApplications = normalizeTextList(analysis.product_recommendations?.suggested_applications);

  analysis.productRecommendation = {
    recommendedProduct: productNames[0] || analysis.productYieldEstimation.productType,
    reason: suggestedApplications[0] || productNames[0] || 'No recommendation available',
    expectedQuality: `Grade ${qualityGrade}`,
    recommendedUses: [...new Set([...productNames, ...suggestedApplications])].slice(0, 8),
    marketValueInsight: analysis.market_analysis?.market_trend || 'No market trend available',
    preservation: analysis.latex_analysis?.contamination?.detected
      ? 'Purify/filter before processing to improve quality.'
      : 'Store properly and avoid contamination during handling.'
  };

  analysis.marketPriceEstimation = {
    pricePerKg: toNumber(analysis.market_analysis?.price_per_kg, 0),
    totalEstimatedValue: round2(toNumber(analysis.market_analysis?.price_per_kg, 0) * round2(resolvedVolumeLiters)),
    currency: analysis.market_analysis?.currency || 'PHP',
    region: analysis.market_analysis?.region || body.region || 'global_avg'
  };

  const contaminationTypes = [...new Set(normalizeTextList(analysis.latex_analysis?.impurities?.type))];
  const hasContamination = Boolean(analysis.latex_analysis?.contamination?.detected);
  const overallReport = `Latex quality is ${qualityClass} (${qualityScore.toFixed(1)}% confidence) with DRC ${resolvedDrc.toFixed(1)}% and estimated dry yield ${dryYieldKg.toFixed(2)} kg.`;
  const diagnosis = hasContamination
    ? `Contamination detected${contaminationTypes.length ? ` (${contaminationTypes.join(', ')})` : ''}.`
    : 'No major contamination detected from current scan.';
  const treatmentPlan = hasContamination
    ? [
        'Filter latex using clean mesh before storage.',
        'Remove bark/debris contamination before processing.',
        'Use sealed containers to prevent additional impurities.'
      ]
    : [
        'Maintain clean collection cups and tools.',
        'Store latex in cool, shaded conditions.',
        'Preserve collection timing consistency for stable quality.'
      ];
  const preventionPlan = [
    'Avoid rainwater mixing during tapping.',
    'Clean tapping cuts and collection points regularly.',
    'Record batch quality and compare trends weekly.'
  ];
  const promptRecommendations = [
    'How can I increase dry rubber content in my next harvest?',
    'What contamination controls should I prioritize for this batch?',
    `Is ${analysis.productRecommendation.recommendedProduct} the best product for this latex grade?`
  ];
  const suggestionPool = [
    ...suggestedApplications.slice(0, 4),
    analysis.productRecommendation.preservation,
    diagnosis,
    `Market trend: ${analysis.marketPriceEstimation.region} / ${analysis.productRecommendation.marketValueInsight}`
  ].filter(Boolean);

  if (!analysis.aiInsights || typeof analysis.aiInsights !== 'object') {
    analysis.aiInsights = {};
  }

  analysis.aiInsights = {
    ...analysis.aiInsights,
    overallReport: analysis.aiInsights.overallReport || overallReport,
    diagnosis: analysis.aiInsights.diagnosis || diagnosis,
    treatmentPlan: Array.isArray(analysis.aiInsights.treatmentPlan) && analysis.aiInsights.treatmentPlan.length
      ? analysis.aiInsights.treatmentPlan
      : treatmentPlan,
    preventionPlan: Array.isArray(analysis.aiInsights.preventionPlan) && analysis.aiInsights.preventionPlan.length
      ? analysis.aiInsights.preventionPlan
      : preventionPlan,
    promptRecommendations: Array.isArray(analysis.aiInsights.promptRecommendations) && analysis.aiInsights.promptRecommendations.length
      ? analysis.aiInsights.promptRecommendations
      : promptRecommendations,
    suggestions: Array.isArray(analysis.aiInsights.suggestions) && analysis.aiInsights.suggestions.length
      ? analysis.aiInsights.suggestions
      : [...new Set(suggestionPool)].slice(0, 10),
    analysisTimestamp: analysis.aiInsights.analysisTimestamp || new Date().toISOString(),
    version: analysis.aiInsights.version || 2
  };

  if (analysis.visualization) {
    analysis.processedImageURL = `data:image/jpeg;base64,${analysis.visualization}`;
  }

  analysis.batchID = batchID || analysis.batchID || null;
  analysis.notes = notes || analysis.notes || '';

  return {
    volumeInput,
    dryWeightInput,
    batchID,
    notes
  };
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
      
      // Get request metadata (mobile-compatible inputs)
      const region = req.body.region || 'global_avg';
      const requestBatchID = String(req.body.batchID || '').trim();
      const requestNotes = String(req.body.notes || '').trim();
      
      // Check model availability first
      const modelAvailable = latexService.checkModelAvailability();
      const modelInfo = latexService.getModelInfo();
      const activeModelName = modelInfo?.modelFile || latexService.getActiveModelName();
      
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

      const inputOverrides = applyUserLatexInputs(analysis, req.body);
      analysis.scanType = analysis.scanType || 'latex';
      analysis.batchID = requestBatchID || inputOverrides.batchID || null;
      analysis.notes = requestNotes || inputOverrides.notes || '';

      // Align latex scan result pricing with latest market page snapshot when available.
      try {
        const latestMarket = await MarketData.findOne({ source: 'stooq' }).sort({ timestamp: -1 }).lean();
        const livePricePerKg = Number(latestMarket?.price);
        if (Number.isFinite(livePricePerKg) && livePricePerKg > 0) {
          const dryYieldKg = toNumber(
            analysis.productYieldEstimation?.estimatedYield ||
            analysis.latex_analysis?.estimated_yield?.dry_weight_kg,
            0
          );
          const fallbackWeightKg = toNumber(analysis.quantityEstimation?.weight || analysis.quantityEstimation?.volume, 0);
          const effectiveWeightKg = dryYieldKg > 0 ? dryYieldKg : fallbackWeightKg;
          const estimatedTotalValue = round2(livePricePerKg * effectiveWeightKg);

          analysis.market_analysis = {
            ...(analysis.market_analysis || {}),
            price_per_kg: round2(livePricePerKg),
            currency: latestMarket?.currency || 'PHP',
            region: 'live_rss3',
            market_trend: String(latestMarket?.trend || analysis.market_analysis?.market_trend || 'neutral').toLowerCase(),
            trend_strength: round2(Math.abs(toNumber(latestMarket?.priceChange, 0)) / 100),
            estimated_total_value: estimatedTotalValue,
            source: latestMarket?.source || 'stooq',
            source_symbol: latestMarket?.sourceSymbol || ''
          };

          analysis.marketPriceEstimation = {
            ...(analysis.marketPriceEstimation || {}),
            pricePerKg: round2(livePricePerKg),
            totalEstimatedValue: estimatedTotalValue,
            currency: latestMarket?.currency || 'PHP',
            region: 'live_rss3'
          };
        }
      } catch (marketSyncError) {
        console.warn('Could not sync live market snapshot into latex analysis:', marketSyncError.message);
      }
      
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
        batchID: analysis.batchID || null,
        notes: analysis.notes || '',
        inputVolume: inputOverrides.volumeInput || 0,
        inputDryWeight: inputOverrides.dryWeightInput || 0,
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
        quantityEstimate: analysis.quantityEstimation?.volume || (analysis.latex_analysis?.quantity_estimation?.estimated_volume_ml / 1000),
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
          modelPath: modelAvailable ? `../ML-models/${activeModelName}` : null,
          modelFile: modelAvailable ? activeModelName : null,
          fallbackUsed: !analysis.ml_model_used,
          processingTime: analysis.processingTime || 'unknown',
          region: region,
          userInputs: {
            batchID: analysis.batchID || null,
            volume: inputOverrides.volumeInput || 0,
            dryWeight: inputOverrides.dryWeightInput || 0
          }
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
      
      const statusCode = (() => {
        const message = String(analysisError?.message || '').toLowerCase();
        if (message.includes('non-latex') || message.includes('not latex')) return 400;
        if (message.includes('detected part')) return 400;
        if (message.includes('not found')) return 404;
        if (message.includes('timeout')) return 504;
        return 500;
      })();
      const userMessage = statusCode === 400
        ? analysisError.message
        : 'Error analyzing latex image';

      res.status(statusCode).json({
        success: false,
        message: userMessage,
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
      .lean(); // Use lean() for better performance
    
    // Format analyses for frontend
    const formattedAnalyses = analyses.map(analysis => ({
      _id: analysis._id,
      id: analysis._id,
      imageUrl: analysis.imageUrl,
      image: analysis.imageUrl,
      createdAt: analysis.createdAt,
      status: 'Completed',
      confidence: analysis.qualityScore || 0,
      quality: analysis.qualityClass || 'Standard',
      purity: analysis.dryRubberContent || 0,
      moisture: analysis.dryRubberContent ? (100 - analysis.dryRubberContent) : 0,
      drc: analysis.dryRubberContent || 0,
      contaminationLevel: analysis.contaminationDetected ? 'Medium' : 'Low',
      detectedParticles: analysis.impuritiesDetected?.length || 0
    }));
    
    res.status(200).json({
      success: true,
      data: formattedAnalyses,
      analyses: formattedAnalyses, // Include both formats for compatibility
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

// @desc    Get single latex analysis by ID
// @route   GET /api/v1/latex/analysis/:analysisId
// @access  Private
exports.getAnalysisById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { analysisId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Find the analysis and ensure it belongs to the user
    const analysis = await LatexAnalysis.findOne({
      _id: analysisId,
      userId: userId
    }).lean();
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }
    
    // Extract data from fullAnalysis if available
    const fullAnalysis = analysis.fullAnalysis || {};
    const latexAnalysis = fullAnalysis.latex_analysis || {};
    const contamination = latexAnalysis.contamination || {};
    const colorAnalysis = latexAnalysis.color_analysis || {};
    const quantityEstimation = latexAnalysis.quantity_estimation || {};
    const yieldEstimation = latexAnalysis.estimated_yield || {};
    const marketAnalysis = fullAnalysis.market_analysis || analysis.marketPrice || {};
    const recommendations = fullAnalysis.product_recommendations || {};
    
    // Determine quality class
    const qualityClass = analysis.qualityClass || 
                         latexAnalysis.quality_class || 
                         (analysis.qualityScore >= 80 ? 'High' : 
                          analysis.qualityScore >= 50 ? 'Medium' : 'Low');
    
    // Determine contamination level
    let contaminationLevel = 'Low';
    if (analysis.contaminationDetected || contamination.detected) {
      const contaminantCount = analysis.impuritiesDetected?.length || 
                               contamination.type ? 1 : 0;
      if (contaminantCount > 3) contaminationLevel = 'High';
      else if (contaminantCount > 1) contaminationLevel = 'Medium';
      else contaminationLevel = 'Low';
    }
    
    // Format for frontend (matches AnalysisDetails.jsx expectations)
    const formattedAnalysis = {
      _id: analysis._id,
      id: analysis._id,
      type: 'Latex',
      imageUrl: analysis.imageUrl,
      image: analysis.imageUrl,
      createdAt: analysis.createdAt,
      status: 'Completed',
      confidence: analysis.qualityScore || latexAnalysis.quality_score || 0,
      
      // Quality metrics
      quality: qualityClass,
      purity: analysis.dryRubberContent || latexAnalysis.dry_rubber_content || 0,
      moisture: analysis.dryRubberContent ? (100 - analysis.dryRubberContent) : 
                (latexAnalysis.dry_rubber_content ? 100 - latexAnalysis.dry_rubber_content : 0),
      drc: analysis.dryRubberContent || latexAnalysis.dry_rubber_content || 0,
      drcCategory: latexAnalysis.drc_category || 
                   (analysis.dryRubberContent >= 40 ? 'Excellent' : 
                    analysis.dryRubberContent >= 30 ? 'Good' : 
                    analysis.dryRubberContent >= 20 ? 'Average' : 'Poor'),
      
      // Contamination info
      contaminationDetected: analysis.contaminationDetected || contamination.detected || false,
      contaminationLevel: contaminationLevel,
      contaminationType: contamination.type || (analysis.impuritiesDetected?.[0] || 'none'),
      contaminationProbability: contamination.probability || 0,
      detectedParticles: analysis.impuritiesDetected?.length || 
                         (contamination.detected ? 1 : 0),
      impuritiesDetected: analysis.impuritiesDetected || 
                          (contamination.type ? [contamination.type] : []),
      
      // Color analysis
      colorName: colorAnalysis.name || 'Unknown',
      colorHex: colorAnalysis.hex || '#ffffff',
      colorHSV: colorAnalysis.hsv || {},
      
      // Consistency
      consistency: latexAnalysis.consistency || 
                   (analysis.qualityScore >= 70 ? 'Smooth' : 'Moderate'),
      
      // Quantity estimation
      estimatedVolume: quantityEstimation.estimated_volume_ml || 0,
      quantityConfidence: quantityEstimation.confidence || 0,
      latexAreaPercentage: quantityEstimation.latex_area_percentage || 0,
      
      // Yield estimation
      wetWeight: yieldEstimation.wet_weight_kg || 0,
      dryWeight: yieldEstimation.dry_weight_kg || 0,
      dryYieldPercentage: yieldEstimation.dry_yield_percentage || 0,
      
      // Market analysis
      marketPrice: marketAnalysis.price_per_kg || analysis.marketPrice?.amount || 0,
      marketCurrency: marketAnalysis.currency || analysis.marketPrice?.currency || 'PHP',
      marketRegion: marketAnalysis.region || analysis.region || 'global_avg',
      marketTrend: marketAnalysis.market_trend || 'neutral',
      estimatedTotalValue: marketAnalysis.estimated_total_value || 
                          (analysis.marketPrice?.amount * (analysis.quantityEstimate || 0)) || 0,
      
      // Recommendations
      recommendedProducts: recommendations.recommended_products || [],
      suggestedApplications: recommendations.suggested_applications || [],
      processingRequired: recommendations.processing_required || false,
      
      // AI Insights
      aiInsights: fullAnalysis.aiInsights || {},
      
      // Batch info
      batchID: analysis.batchID || fullAnalysis.batchID || null,
      notes: analysis.notes || fullAnalysis.notes || '',
      
      // Detailed results for renderLatexResults()
      result: {
        quality: qualityClass,
        purity: analysis.dryRubberContent || latexAnalysis.dry_rubber_content || 0,
        moisture: analysis.dryRubberContent ? (100 - analysis.dryRubberContent) : 
                  (latexAnalysis.dry_rubber_content ? 100 - latexAnalysis.dry_rubber_content : 0),
        drc: analysis.dryRubberContent || latexAnalysis.dry_rubber_content || 0,
        contaminationLevel: contaminationLevel,
        detectedParticles: analysis.impuritiesDetected?.length || 
                          (contamination.detected ? 1 : 0)
      }
    };
    
    res.status(200).json({
      success: true,
      data: formattedAnalysis,
      analysis: formattedAnalysis, // Include both formats for compatibility
      message: 'Analysis retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Get latex analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis',
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


// @desc    Get latex detection info and system status
// @route   GET /api/v1/latex/info
// @access  Public
exports.getLatexInfo = async (req, res) => {
  try {
    // Check model availability
    const modelAvailable = latexService.checkModelAvailability();
    const modelInfo = latexService.getModelInfo();
    const activeModelName = modelInfo?.modelFile || latexService.getActiveModelName();
    
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
          name: activeModelName,
          type: 'YOLO (PyTorch)',
          architecture: 'YOLOv8',
          status: modelAvailable ? 'Active' : 'Not Found',
          path: modelAvailable ? `../ML-models/${activeModelName}` : null,
          details: {
            ...modelInfo,
            ...modelDetails
          }
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          pythonVersion: pythonAvailable ? await latexService.getPythonVersion() : null,
          packagesAvailable: packagesAvailable,
          requiredPackages: ['ultralytics', 'torch', 'numpy', 'opencv-python'],
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
