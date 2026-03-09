const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const leafService = require('../services/LeafServices');
const leafGroqAdvisor = require('../services/LeafGroqAdvisor');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const LeafAnalysis = require('../models/LeafAnalysis');
const Tree = require('../models/Tree');

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

const parseNumeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSeverity = (value, fallback = 'unknown') => {
  const severity = String(value || '').trim().toLowerCase();
  if (['none', 'healthy', 'no disease'].includes(severity)) return 'none';
  if (['low', 'mild'].includes(severity)) return 'low';
  if (['moderate', 'medium'].includes(severity)) return 'moderate';
  if (['high', 'severe'].includes(severity)) return 'high';
  if (severity === 'critical') return 'critical';
  return fallback;
};

const looksHealthyName = (value) => {
  const text = String(value || '').toLowerCase();
  return /healthy|no disease|disease[-\s]?free|normal/.test(text);
};

const normalizeHealthStatus = (diseaseName, severity, existingStatus) => {
  const normalizedSeverity = normalizeSeverity(severity, 'unknown');
  const existing = String(existingStatus || '').toLowerCase();
  if (normalizedSeverity === 'none' || looksHealthyName(diseaseName)) return 'healthy';
  if (['low', 'moderate', 'high', 'critical'].includes(normalizedSeverity)) return 'diseased';
  return ['healthy', 'diseased', 'unknown'].includes(existing) ? existing : 'unknown';
};

const toRecommendationList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || '').trim()).filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.values(value).map((entry) => String(entry || '').trim()).filter(Boolean);
  }
  return String(value)
    .split(/\n|;\s+|\|\s*/)
    .map((entry) => entry.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
};

const normalizeTreeReference = (value) => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'object') {
    return (
      value._id ||
      value.id ||
      value.treeProfileId ||
      value.treeId ||
      value.treeID ||
      null
    );
  }

  const text = String(value).trim();
  if (!text) return null;

  const lowered = text.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined' || lowered === '[object object]') {
    return null;
  }

  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      return normalizeTreeReference(parsed);
    } catch (parseError) {
      return text;
    }
  }

  return text;
};

const deriveMaturityFromTree = (tree = null) => {
  if (!tree) return 'unknown';

  const ageYears = parseNumeric(tree.age, NaN);
  if (Number.isFinite(ageYears) && ageYears > 0) {
    return ageYears >= 6 ? 'mature' : 'immature';
  }

  if (tree.plantedDate) {
    const planted = new Date(tree.plantedDate);
    if (!Number.isNaN(planted.getTime())) {
      const years = (Date.now() - planted.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (Number.isFinite(years) && years >= 0) {
        return years >= 6 ? 'mature' : 'immature';
      }
    }
  }

  return 'unknown';
};

const mapTreeProfile = (treeDoc) => {
  if (!treeDoc) return null;
  const tree = typeof treeDoc.toObject === 'function' ? treeDoc.toObject() : treeDoc;
  return {
    _id: tree._id,
    treeID: tree.treeID,
    treeId: tree.treeID,
    species: tree.species || 'Rubber',
    isRubberTree: tree.isRubberTree !== false,
    location: tree.location || null,
    plantedDate: tree.plantedDate || null,
    age: tree.age || null,
    barkTexture: tree.barkTexture || 'unknown',
    barkColor: tree.barkColor || null,
    healthStatus: tree.healthStatus || 'unknown',
    isTappable: Boolean(tree.isTappable),
    tappabilityScore: parseNumeric(tree.tappabilityScore, 0),
    lastScannedAt: tree.lastScannedAt || null
  };
};

const resolveTreeProfileForUser = async (req) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return null;

  const requestedTreeRef = normalizeTreeReference(
    req.body?.treeId ||
    req.body?.treeProfileId ||
    req.body?.tree ||
    null
  );

  const requestedTreeCode = normalizeTreeReference(
    req.body?.treeID ||
    req.body?.treeCode ||
    null
  );

  if (requestedTreeRef) {
    const query = { owner: userId };
    if (String(requestedTreeRef).match(/^[0-9a-fA-F]{24}$/)) {
      query._id = requestedTreeRef;
    } else {
      query.treeID = String(requestedTreeRef).trim();
    }

    const explicitTree = await Tree.findOne(query);
    if (!explicitTree) {
      throw new Error('Selected tree profile not found for this user');
    }
    return explicitTree;
  }

  if (requestedTreeCode) {
    const byCode = await Tree.findOne({
      owner: userId,
      treeID: String(requestedTreeCode).trim()
    });
    if (byCode) return byCode;
  }

  return await Tree.findOne({ owner: userId })
    .sort({ lastScannedAt: -1, updatedAt: -1, createdAt: -1 });
};

const buildLeafDiseaseDetection = (analysis = {}) => {
  if (Array.isArray(analysis.diseaseDetection) && analysis.diseaseDetection.length > 0) {
    return analysis.diseaseDetection.slice(0, 8).map((entry) => ({
      name: String(entry?.name || 'Unknown').trim(),
      confidence: parseNumeric(entry?.confidence, 0),
      severity: normalizeSeverity(entry?.severity, 'unknown'),
      recommendation: String(entry?.recommendation || '').trim(),
      ai_diagnosis: entry?.ai_diagnosis || null
    }));
  }

  const diseaseInfo = analysis.diseaseInfo || {};
  const recommendationList = toRecommendationList(
    analysis.treatment_recommendations ||
    analysis.recommendations ||
    analysis.treatment ||
    []
  );

  const primaryName = String(diseaseInfo.name || analysis.disease_detected || 'Unknown').trim();
  const primarySeverity = normalizeSeverity(diseaseInfo.severity || analysis.severity, 'unknown');
  const primaryRecommendation = recommendationList.length > 0
    ? recommendationList.slice(0, 3).join('; ')
    : 'Monitor tree condition and re-scan with a clearer leaf image if needed.';

  const primaryDetection = {
    name: primaryName || 'Unknown',
    confidence: parseNumeric(diseaseInfo.confidence ?? analysis.confidence, 0),
    severity: primarySeverity,
    recommendation: primaryRecommendation,
    ai_diagnosis: null
  };

  const allPredictions = Array.isArray(diseaseInfo.allPredictions)
    ? diseaseInfo.allPredictions
    : [];

  const secondary = allPredictions
    .map((pred) => ({
      name: String(pred?.class || pred?.name || pred?.original_class || 'Unknown').trim(),
      confidence: parseNumeric(pred?.confidence, 0),
      severity: primarySeverity,
      recommendation: primaryRecommendation,
      ai_diagnosis: null
    }))
    .filter((pred) => pred.name && pred.name.toLowerCase() !== primaryDetection.name.toLowerCase())
    .slice(0, 5);

  return [primaryDetection, ...secondary];
};

const buildLeafTappabilityAssessment = (healthStatus, severity) => {
  const normalizedSeverity = normalizeSeverity(severity, 'unknown');
  const healthy = String(healthStatus || '').toLowerCase() === 'healthy' || normalizedSeverity === 'none';

  if (healthy) {
    return {
      isTappable: true,
      score: 75,
      reason: 'Leaf condition is healthy. Confirm trunk condition before tapping.'
    };
  }

  const scoreMap = {
    low: 55,
    moderate: 40,
    high: 25,
    critical: 15,
    unknown: 35
  };

  return {
    isTappable: false,
    score: scoreMap[normalizedSeverity] ?? 35,
    reason: 'Treat the detected leaf disease first, then reassess before tapping.'
  };
};

const applyLeafCompatibility = (analysis) => {
  if (!analysis || typeof analysis !== 'object') return;

  const diseaseDetection = buildLeafDiseaseDetection(analysis);
  const primaryDisease = diseaseDetection[0] || {
    name: 'Unknown',
    confidence: 0,
    severity: 'unknown',
    recommendation: ''
  };

  const leafHealthStatus = normalizeHealthStatus(
    primaryDisease.name,
    primaryDisease.severity,
    analysis?.leafAnalysis?.healthStatus || analysis?.diseaseInfo?.healthStatus
  );

  const colorName =
    analysis?.leafAnalysis?.color ||
    analysis?.visualMetrics?.dominantColor ||
    analysis?.color_analysis?.primaryColor ||
    'unknown';

  const spotCount = parseNumeric(
    analysis?.leafAnalysis?.spotCount ??
    analysis?.visualMetrics?.spotCount ??
    analysis?.spots_count,
    0
  );

  const recommendationList = toRecommendationList(
    primaryDisease.recommendation ||
    analysis?.recommendations ||
    analysis?.treatment_recommendations ||
    []
  );

  const existingTreeIdentification =
    analysis.treeIdentification && typeof analysis.treeIdentification === 'object'
      ? analysis.treeIdentification
      : {};

  const existingLeafAnalysis =
    analysis.leafAnalysis && typeof analysis.leafAnalysis === 'object'
      ? analysis.leafAnalysis
      : {};

  const treeSnapshot = analysis.tree && typeof analysis.tree === 'object' ? analysis.tree : {};
  const species = treeSnapshot.species || existingTreeIdentification.species || analysis.species || 'Hevea brasiliensis';

  const inferredMaturity =
    existingTreeIdentification.maturity ||
    analysis.maturity ||
    deriveMaturityFromTree(treeSnapshot) ||
    'unknown';

  const confidence = parseNumeric(
    existingTreeIdentification.confidence ??
    primaryDisease.confidence ??
    analysis.confidence,
    0
  );

  analysis.species = species;
  analysis.tree_species = species;

  analysis.treeIdentification = {
    ...existingTreeIdentification,
    isRubberTree: existingTreeIdentification.isRubberTree ?? (treeSnapshot.isRubberTree !== false),
    detectedPart: 'leaf',
    confidence,
    maturity: String(inferredMaturity || 'unknown').toLowerCase(),
    species
  };

  analysis.leafAnalysis = {
    ...existingLeafAnalysis,
    healthStatus: leafHealthStatus,
    color: String(colorName || 'unknown'),
    spotCount,
    diseases: diseaseDetection.map((item) => ({
      name: item.name,
      confidence: item.confidence,
      severity: item.severity
    })),
    detailed_analysis: existingLeafAnalysis.detailed_analysis || analysis.diseaseInfo?.description || null
  };

  analysis.diseaseDetection = diseaseDetection;
  analysis.tappabilityAssessment = buildLeafTappabilityAssessment(leafHealthStatus, primaryDisease.severity);
  analysis.tapabilityAssessment = analysis.tappabilityAssessment;
  analysis.productivityRecommendation = {
    status: leafHealthStatus === 'healthy' ? 'optimal' : 'at_risk',
    suggestions: recommendationList.length > 0
      ? recommendationList.slice(0, 8)
      : ['Continue regular monitoring and upload a clearer image if uncertainty remains.']
  };

  analysis.scanType = analysis.scanType || 'tree';
  analysis.scanSubType = analysis.scanSubType || 'leaf';
};

const attachTreeProfileToAnalysis = (analysis, treeDoc) => {
  if (!analysis || !treeDoc) return;

  const tree = mapTreeProfile(treeDoc);
  if (!tree) return;

  analysis.tree = {
    ...(analysis.tree || {}),
    ...tree
  };
  analysis.treeProfileId = tree._id;
  analysis.treeID = tree.treeID;
  analysis.treeId = tree.treeID;
  analysis.species = tree.species || analysis.species;
  analysis.tree_species = analysis.species;

  applyLeafCompatibility(analysis);
};

const buildApiAnalysisFromStored = (storedAnalysis) => {
  const base = storedAnalysis && typeof storedAnalysis === 'object' ? { ...storedAnalysis } : {};
  const full = base.fullAnalysis && typeof base.fullAnalysis === 'object' ? base.fullAnalysis : {};

  const payload = {
    ...full,
    ...base,
    disease_detected: base.diseaseDetected || full.disease_detected || full.diseaseInfo?.name || 'Unknown',
    confidence: parseNumeric(base.confidence ?? full.confidence, 0),
    severity: full.severity || normalizeSeverity(base.severityLevel, 'unknown'),
    spots_count: parseNumeric(base.spotsCount ?? full.spots_count, 0),
    color_analysis: base.colorAnalysis || full.color_analysis || {},
    treatment_recommendations: base.treatmentRecommendations || full.treatment_recommendations || [],
    prevention_strategies: base.preventionStrategies || full.prevention_strategies || [],
    aiInsights: base.aiInsights || full.aiInsights || null,
    ml_model_used: base.mlModelUsed ?? full.ml_model_used ?? false,
    processingTime: base.processingTime || full.processingTime || 'N/A',
    treeProfileId: base.treeProfileId || full.treeProfileId || null,
    tree: base.treeSnapshot || base.tree || full.tree || null,
    image: {
      url: base.imageUrl || full.image?.url || null,
      public_id: base.imagePublicId || full.image?.public_id || null
    }
  };

  if (!payload.diseaseInfo || typeof payload.diseaseInfo !== 'object') {
    payload.diseaseInfo = {
      name: payload.disease_detected,
      confidence: payload.confidence,
      severity: normalizeSeverity(payload.severity, 'unknown'),
      healthStatus: 'unknown',
      allPredictions: []
    };
  }

  applyLeafCompatibility(payload);
  return payload;
};

const isLeafDetected = (analysis) => {
  if (!analysis || typeof analysis !== 'object') return false;

  const mlModelUsed = analysis?.modelInfo?.mlModelUsed ?? analysis?.ml_model_used;
  if (mlModelUsed === false) return false;

  const detections = Array.isArray(analysis?.detections) ? analysis.detections : [];
  const detectionCount = parseNumeric(analysis?.detection_count, detections.length);
  if (detectionCount > 0 || detections.length > 0) return true;

  const primaryName = String(analysis?.diseaseInfo?.name || analysis?.disease_detected || '').trim().toLowerCase();
  const confidence = parseNumeric(analysis?.diseaseInfo?.confidence ?? analysis?.confidence, 0);
  const leafCoverage = parseNumeric(
    analysis?.visualMetrics?.leafCoverage ?? analysis?.color_analysis?.healthyGreenPercentage,
    0
  );

  if (!primaryName) return false;

  if (['unknown', 'no detection', 'system error', 'error', 'not detected'].some((token) => primaryName.includes(token))) {
    return false;
  }

  if (confidence < 15) return false;
  if (leafCoverage <= 1 && confidence < 35) return false;

  return true;
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

    console.log(`Leaf image uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log('User:', req.user ? req.user.email : 'No user');

    let cloudinaryResult = null;
    let tempFilePath = null;

    try {
      console.log('Uploading to Cloudinary...');

      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      tempFilePath = path.join(tempDir, `leaf-${Date.now()}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      console.log('Temp file created:', tempFilePath);

      cloudinaryResult = await uploadToCloudinary(tempFilePath, 'rubbersense/leaf');
      console.log(`Uploaded to Cloudinary: ${cloudinaryResult.url}`);

      const modelAvailable = await leafService.checkModelAvailability();
      console.log('Model available:', modelAvailable);

      console.log('Starting analysis...');
      const analysis = await leafService.analyzeLeaf(
        tempFilePath,
        req.user?._id || req.user?.id,
        { returnVisualization: true }
      );

      console.log('Analysis completed:', analysis.disease_detected);
      console.log('Confidence:', analysis.confidence);
      console.log('ML Model Used:', analysis.ml_model_used);

      applyLeafCompatibility(analysis);

      if (!isLeafDetected(analysis)) {
        if (cloudinaryResult?.public_id) {
          await deleteFromCloudinary(cloudinaryResult.public_id).catch((deleteError) => {
            console.error('Error deleting non-leaf image from Cloudinary:', deleteError);
          });
          cloudinaryResult = null;
        }

        return res.status(422).json({
          success: false,
          message: 'Leaf not detected. Please upload a clear image focused on a rubber tree leaf.',
          error: 'LEAF_NOT_DETECTED'
        });
      }

      const selectedTreeProfile = await resolveTreeProfileForUser(req);
      if (selectedTreeProfile) {
        attachTreeProfileToAnalysis(analysis, selectedTreeProfile);
      }

      const aiInsights = await leafGroqAdvisor.generate(analysis);
      analysis.aiInsights = aiInsights;
      if (Array.isArray(analysis.diseaseDetection) && analysis.diseaseDetection[0]) {
        analysis.diseaseDetection[0].ai_diagnosis = aiInsights?.diagnosis || null;
      }
      applyLeafCompatibility(analysis);

      analysis.image = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.url,
        secure_url: cloudinaryResult.secure_url
      };

      if (req.user) {
        analysis.userId = req.user.id || req.user._id;
        analysis.userEmail = req.user.email;
      }

      const diseaseInfo = analysis.diseaseInfo || {};
      const visualMetrics = analysis.visualMetrics || {};
      const primaryDisease = Array.isArray(analysis.diseaseDetection) ? analysis.diseaseDetection[0] : null;
      const severityString =
        primaryDisease?.severity ||
        diseaseInfo.severity ||
        analysis.severity ||
        'unknown';
      const severityNumber = severityToNumber(severityString);

      const leafAnalysis = new LeafAnalysis({
        userId: req.user.id || req.user._id,
        imageUrl: cloudinaryResult.url,
        imagePublicId: cloudinaryResult.public_id,
        treeProfileId: analysis.treeProfileId || null,
        treeSnapshot: analysis.tree || null,
        diseaseDetected: primaryDisease?.name || diseaseInfo.name || analysis.disease_detected || 'Unknown',
        confidence: primaryDisease?.confidence || diseaseInfo.confidence || analysis.confidence || 0,
        severity: severityNumber,
        severityLevel: getSeverityLevel(severityNumber),
        spotsCount: visualMetrics.spotCount || analysis.spots_count || 0,
        colorAnalysis: {
          primaryColor: analysis.leafAnalysis?.color || visualMetrics.dominantColor || 'unknown',
          discoloration: visualMetrics.leafCoverage ? 100 - visualMetrics.leafCoverage : 0,
          healthyGreenPercentage: visualMetrics.leafCoverage || 0,
          affectedAreaPercentage: 100 - (visualMetrics.leafCoverage || 0)
        },
        treatmentRecommendations: analysis.treatment_recommendations || analysis.treatment || [],
        preventionStrategies: analysis.prevention_strategies || analysis.prevention || [],
        aiInsights: analysis.aiInsights || null,
        fullAnalysis: analysis,
        processingTime: analysis.processingTime || 'N/A',
        mlModelUsed: analysis.modelInfo?.mlModelUsed ?? analysis.ml_model_used ?? false
      });

      await leafAnalysis.save();

      if (selectedTreeProfile?._id) {
        const nextHealthStatus = analysis.leafAnalysis?.healthStatus || selectedTreeProfile.healthStatus || 'unknown';
        await Tree.findByIdAndUpdate(selectedTreeProfile._id, {
          $set: {
            species: analysis.species || selectedTreeProfile.species,
            healthStatus: nextHealthStatus,
            lastScannedAt: new Date()
          },
          $inc: { totalScans: 1 }
        }).catch((treeUpdateError) => {
          console.error('Failed to update tree profile after leaf analysis:', treeUpdateError);
        });
      }

      console.log(`Analysis saved to database with ID: ${leafAnalysis._id}`);

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
      console.error('Analysis error:', analysisError);
      console.error('Error stack:', analysisError.stack);

      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await deleteFromCloudinary(cloudinaryResult.public_id);
          console.log('Deleted failed analysis image from Cloudinary');
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary:', deleteError);
        }
      }

      const statusCode = (() => {
        const message = String(analysisError.message || '').toLowerCase();
        if (message.includes('tree profile not found')) return 404;
        if (message.includes('not detected')) return 422;
        if (message.includes('not found')) return 404;
        if (message.includes('invalid')) return 400;
        return 500;
      })();

      res.status(statusCode).json({
        success: false,
        message: 'Error analyzing leaf image',
        error: analysisError.message,
        stack: process.env.NODE_ENV === 'development' ? analysisError.stack : undefined
      });
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, (unlinkError) => {
          if (unlinkError) console.error('Error deleting temp file:', unlinkError);
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
      .lean();

    // Format analyses for frontend
    const formattedAnalyses = analyses.map((analysis) => {
      const severityLevel = analysis.severityLevel || 
        (analysis.severity >= 80 ? 'Critical' : 
         analysis.severity >= 60 ? 'High' : 
         analysis.severity >= 40 ? 'Medium' : 
         analysis.severity >= 20 ? 'Low' : 'Very Low');
      
      return {
        _id: analysis._id,
        id: analysis._id,
        imageUrl: analysis.imageUrl,
        image: analysis.imageUrl,
        createdAt: analysis.createdAt,
        status: 'Completed',
        confidence: analysis.confidence || 0,
        diseaseDetected: analysis.diseaseDetected || 'Unknown',
        diseaseType: analysis.diseaseDetected || 'None',
        diseaseStatus: analysis.diseaseDetected === 'Healthy' ? 'Healthy' : 'Infected',
        severity: analysis.severity || 0,
        severityLevel: severityLevel,
        affectedArea: analysis.colorAnalysis?.affectedAreaPercentage || 0,
        spotsCount: analysis.spotsCount || 0,
        recommendation: analysis.treatmentRecommendations?.[0] || 'Monitor'
      };
    });
    
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

// @desc    Get single leaf analysis by ID
// @route   GET /api/v1/leaf/analysis/:analysisId
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
    const analysis = await LeafAnalysis.findOne({
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
    const diseaseInfo = fullAnalysis.diseaseInfo || analysis.diseaseInfo || {};
    const visualMetrics = fullAnalysis.visualMetrics || analysis.visualMetrics || {};
    const colorAnalysis = analysis.colorAnalysis || fullAnalysis.color_analysis || {};
    
    // Determine disease status
    const isHealthy = analysis.diseaseDetected?.toLowerCase() === 'healthy' || 
                      diseaseInfo.healthStatus?.toLowerCase() === 'healthy' ||
                      !analysis.diseaseDetected || 
                      analysis.diseaseDetected === 'None' ||
                      analysis.diseaseDetected === 'Unknown';
    
    const diseaseStatus = isHealthy ? 'Healthy' : 'Infected';
    
    // Determine severity level
    let severityLevel = analysis.severityLevel || 'None';
    if (analysis.severity >= 80) severityLevel = 'Critical';
    else if (analysis.severity >= 60) severityLevel = 'High';
    else if (analysis.severity >= 40) severityLevel = 'Medium';
    else if (analysis.severity >= 20) severityLevel = 'Low';
    else if (analysis.severity > 0) severityLevel = 'Very Low';
    
    // Get disease name
    const diseaseName = analysis.diseaseDetected || 
                        diseaseInfo.name || 
                        (isHealthy ? 'Healthy' : 'Unknown Disease');
    
    // Get treatment recommendations
    const treatmentRecommendations = analysis.treatmentRecommendations || 
                                     fullAnalysis.treatment_recommendations ||
                                     fullAnalysis.treatment ||
                                     [];
    
    // Get prevention strategies
    const preventionStrategies = analysis.preventionStrategies || 
                                 fullAnalysis.prevention_strategies ||
                                 fullAnalysis.prevention ||
                                 [];
    
    // Get all predictions
    const allPredictions = diseaseInfo.allPredictions || 
                          fullAnalysis.all_predictions || 
                          [];
    
    // Get symptoms and causes
    const symptoms = fullAnalysis.symptoms || [];
    const causes = fullAnalysis.causes || [];
    
    // Get AI insights
    const aiInsights = analysis.aiInsights || fullAnalysis.aiInsights || null;
    
    // Format for frontend (matches AnalysisDetails.jsx expectations)
    const formattedAnalysis = {
      _id: analysis._id,
      id: analysis._id,
      type: 'Leaf',
      imageUrl: analysis.imageUrl,
      image: analysis.imageUrl,
      createdAt: analysis.createdAt,
      status: 'Completed',
      confidence: analysis.confidence || diseaseInfo.confidence || 0,
      
      // Disease info
      diseaseDetected: diseaseName,
      diseaseType: diseaseName,
      diseaseStatus: diseaseStatus,
      diseaseName: diseaseName,
      diseaseDescription: diseaseInfo.description || fullAnalysis.description || '',
      
      // Severity
      severity: analysis.severity || 0,
      severityLevel: severityLevel,
      severityNumber: analysis.severity || 0,
      
      // Visual metrics
      spotsCount: analysis.spotsCount || visualMetrics.spotCount || 0,
      affectedArea: analysis.colorAnalysis?.affectedAreaPercentage || 
                    (100 - (visualMetrics.leafCoverage || 0)) || 0,
      leafCoverage: visualMetrics.leafCoverage || 
                    analysis.colorAnalysis?.healthyGreenPercentage || 0,
      
      // Color analysis
      dominantColor: colorAnalysis.primaryColor || 
                     visualMetrics.dominantColor || 
                     'Unknown',
      colorHex: colorAnalysis.hex || 
                (visualMetrics.dominantColor === 'Green' ? '#4caf50' : 
                 visualMetrics.dominantColor === 'Yellow' ? '#ffeb3b' : 
                 visualMetrics.dominantColor === 'Brown' ? '#795548' : '#2e7d32'),
      
      // Texture
      texture: visualMetrics.texture || 'Unknown',
      
      // Color distribution
      colorDistribution: visualMetrics.colorDistribution || {},
      
      // Recommendations
      treatmentRecommendations: treatmentRecommendations,
      preventionStrategies: preventionStrategies,
      recommendation: treatmentRecommendations[0] || 
                     fullAnalysis.recommendations?.[0] || 
                     'Monitor leaf condition regularly',
      
      // Additional data
      symptoms: symptoms,
      causes: causes,
      allPredictions: allPredictions,
      aiInsights: aiInsights,
      
      // Model info
      mlModelUsed: analysis.mlModelUsed || fullAnalysis.ml_model_used || false,
      modelInfo: fullAnalysis.modelInfo || {},
      
      // Tree info (if linked)
      treeProfileId: analysis.treeProfileId || null,
      treeSnapshot: analysis.treeSnapshot || null,
      
      // Detailed results for renderLeafResults()
      result: {
        diseaseStatus: diseaseStatus,
        diseaseType: diseaseName,
        severity: severityLevel,
        affectedArea: analysis.colorAnalysis?.affectedAreaPercentage || 
                      (100 - (visualMetrics.leafCoverage || 0)) || 0,
        recommendation: treatmentRecommendations[0] || 'Monitor'
      }
    };
    
    res.status(200).json({
      success: true,
      data: formattedAnalysis,
      analysis: formattedAnalysis, // Include both formats for compatibility
      message: 'Analysis retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Get leaf analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis',
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
    const activeModelName = leafService.getActiveModelName();
    
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
          'Bounding Box / OBB Detection (when detection model is used)',
          'Leaf Not Detected Validation',
          'Severity Assessment',
          'Spot Counting & Analysis',
          'Color Analysis',
          'Treatment Recommendations',
          'Prevention Strategies',
          'AI Insights Summary'
        ],
        supportedFormats: ['JPEG', 'PNG', 'WebP'],
        maxFileSize: '10MB',
        supportedDiseases: diseases,
        mlModel: {
          name: activeModelName,
          type: modelInfo?.type || 'YOLO Model',
          status: modelAvailable ? 'Active' : 'Not Found',
          path: modelAvailable ? `../ML-models/${activeModelName}` : null,
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

