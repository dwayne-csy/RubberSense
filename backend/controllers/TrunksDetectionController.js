const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const trunksService = require('../services/TrunksService');
const trunkGroqAdvisor = require('../services/TrunkGroqAdvisor');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const TrunkAnalysis = require('../models/TrunksAnalysis');
const Tree = require('../models/Tree');

const clampScore = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const parseNumeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const titleCaseWord = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'Unknown';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const isTrunkDetected = (analysis) => {
  const detections = analysis?.all_detections || analysis?.detections || [];
  if (Array.isArray(detections) && detections.length > 0) {
    return true;
  }

  const primary = analysis?.primary_detection || analysis?.primaryDetection || {};
  const primaryClass = String(primary.class_name || primary.class || '').trim().toLowerCase();
  const primaryConfidence = parseNumeric(primary.confidence, 0);

  if (!primaryClass && primaryConfidence <= 0) {
    return false;
  }

  if (
    ['no_detection', 'no detection', 'unknown', 'none'].includes(primaryClass) &&
    primaryConfidence <= 0
  ) {
    return false;
  }

  return true;
};

const buildTapabilityAssessment = (analysis) => {
  const healthScore = parseNumeric(analysis?.health_score ?? analysis?.healthScore, 0);
  const diseaseDetected = Boolean(analysis?.disease?.detected);
  const severity = String(
    analysis?.disease?.severity ||
    analysis?.primary_detection?.severity ||
    'none'
  ).trim().toLowerCase();
  const maturityClass = String(analysis?.maturity?.class || 'unknown').trim().toLowerCase();

  const severityPenaltyMap = {
    none: 0,
    low: 10,
    medium: 20,
    high: 35,
    critical: 50
  };

  const severityPenalty = severityPenaltyMap[severity] ?? (diseaseDetected ? 25 : 0);
  let score = clampScore(Math.round(healthScore - severityPenalty));

  if (maturityClass === 'immature') {
    score = Math.min(score, 45);
  }

  let status = 'Not Recommended';
  let recommendation = 'Avoid tapping and focus on recovery actions first.';
  if (score >= 80) {
    status = 'Highly Tappable';
    recommendation = 'Suitable for regular tapping.';
  } else if (score >= 60) {
    status = 'Tappable With Caution';
    recommendation = 'Can be tapped with careful monitoring.';
  } else if (score >= 40) {
    status = 'Limited Tapping';
    recommendation = 'Limit tapping frequency and monitor tree condition.';
  }

  return {
    score,
    tapability_score: score,
    max_score: 100,
    status,
    recommendation,
    isTappable: score >= 60 && maturityClass !== 'immature',
    reason: recommendation
  };
};

const applyLegacyTrunkCompatibility = (analysis) => {
  if (!analysis || typeof analysis !== 'object') return;

  analysis.species = analysis.species || analysis.tree_species || 'Hevea brasiliensis';
  analysis.tree_species = analysis.tree_species || analysis.species;

  const maturity = analysis.maturity && typeof analysis.maturity === 'object' ? analysis.maturity : {};
  let maturityClass = String(maturity.class || 'unknown').trim().toLowerCase() || 'unknown';
  if (maturityClass === 'unknown') {
    const estimatedYears = parseNumeric(
      analysis.age_estimation?.estimated_years ??
      analysis.age_estimate,
      NaN
    );
    if (Number.isFinite(estimatedYears) && estimatedYears > 0) {
      maturityClass = estimatedYears >= 6 ? 'mature' : 'immature';
    }
  }
  analysis.maturity = {
    ...maturity,
    class: maturityClass,
    confidence: parseNumeric(maturity.confidence, 0)
  };
  analysis.maturity_class = maturityClass;
  analysis.maturity_label = titleCaseWord(maturityClass);
  analysis.maturityClass = analysis.maturity_label;

  const colorAnalysis = analysis.color_analysis || analysis.visual_analysis?.color || {};
  const textureAnalysis = analysis.texture_analysis || analysis.visual_analysis?.texture || {};
  const barkCondition = analysis.visual_analysis?.bark_condition || {};

  let barkColor = String(colorAnalysis.name || colorAnalysis.primaryColor || 'Unknown');
  let barkTexture = String(textureAnalysis.type || textureAnalysis.texture || 'Unknown');

  if (maturityClass === 'unknown') {
    const textureHint = barkTexture.toLowerCase();
    if (textureHint.includes('smooth')) {
      maturityClass = 'immature';
    } else if (textureHint.includes('rough') || textureHint.includes('crack')) {
      maturityClass = 'mature';
    } else {
      maturityClass = 'mature';
    }
    analysis.maturity.class = maturityClass;
    analysis.maturity_class = maturityClass;
    analysis.maturity_label = titleCaseWord(maturityClass);
    analysis.maturityClass = analysis.maturity_label;
  }

  if (barkColor.toLowerCase() === 'unknown') {
    barkColor = 'Brown';
  }
  if (barkTexture.toLowerCase() === 'unknown') {
    barkTexture = maturityClass === 'immature' ? 'Smooth' : 'Moderately Rough';
  }

  analysis.color_analysis = colorAnalysis;
  analysis.texture_analysis = textureAnalysis;
  analysis.bark_color = barkColor;
  analysis.barkColor = barkColor;
  analysis.bark_color_hex = colorAnalysis.hex || null;
  analysis.bark_texture = barkTexture;
  analysis.barkTexture = barkTexture;
  analysis.bark_condition = barkCondition.condition || colorAnalysis.barkCondition || 'Unknown';
  analysis.barkCondition = analysis.bark_condition;

  const tapabilityAssessment = buildTapabilityAssessment(analysis);
  analysis.tapability_assessment = tapabilityAssessment;
  analysis.tappability_assessment = tapabilityAssessment;
  analysis.tapabilityAssessment = tapabilityAssessment;
  analysis.tapability_score = tapabilityAssessment.score;
  analysis.tappability_score = tapabilityAssessment.score;
  analysis.scanType = analysis.scanType || 'tree';
  analysis.scanSubType = analysis.scanSubType || 'trunk';

  // Mobile-app compatible camelCase shape (ScanDetailScreen expects these keys).
  const existingTreeIdentification = analysis.treeIdentification && typeof analysis.treeIdentification === 'object'
    ? analysis.treeIdentification
    : {};
  const existingTrunkAnalysis = analysis.trunkAnalysis && typeof analysis.trunkAnalysis === 'object'
    ? analysis.trunkAnalysis
    : {};
  const existingTappability = analysis.tappabilityAssessment && typeof analysis.tappabilityAssessment === 'object'
    ? analysis.tappabilityAssessment
    : {};

  const primaryDetection = analysis.primary_detection || analysis.primaryDetection || {};
  const primaryConfidence = parseNumeric(
    primaryDetection.confidence ??
    analysis.disease?.confidence ??
    analysis.maturity?.confidence,
    0
  );
  const detectedPart = String(
    existingTreeIdentification.detectedPart ||
    analysis.detectedPart ||
    'trunk'
  ).toLowerCase();
  const healthStatus = analysis.disease?.detected ? 'diseased' : 'healthy';

  analysis.treeIdentification = {
    ...existingTreeIdentification,
    isRubberTree: existingTreeIdentification.isRubberTree ?? true,
    detectedPart,
    maturity: maturityClass,
    confidence: primaryConfidence,
    species: analysis.species
  };

  analysis.trunkAnalysis = {
    ...existingTrunkAnalysis,
    texture: barkTexture,
    color: barkColor,
    barkCondition: analysis.bark_condition,
    maturity: maturityClass,
    healthStatus,
    species: analysis.species
  };

  analysis.tappabilityAssessment = {
    ...existingTappability,
    score: parseNumeric(existingTappability.score, tapabilityAssessment.score),
    isTappable: existingTappability.isTappable ?? tapabilityAssessment.isTappable,
    reason: existingTappability.reason || tapabilityAssessment.reason,
    status: existingTappability.status || tapabilityAssessment.status
  };
  analysis.tapabilityAssessment = analysis.tappabilityAssessment;

  const detections = Array.isArray(analysis.all_detections)
    ? analysis.all_detections
    : (Array.isArray(analysis.detections) ? analysis.detections : []);
  const fallbackDetection = {
    name: analysis.disease?.name || primaryDetection.display_name || 'Unknown',
    confidence: parseNumeric(analysis.disease?.confidence ?? primaryDetection.confidence, 0),
    severity: analysis.disease?.severity || primaryDetection.severity || 'unknown',
    recommendation: analysis.disease?.treatment || analysis.tappabilityAssessment.reason || 'Monitor tree condition.'
  };
  const normalizedDiseaseDetection = detections.length > 0
    ? detections.slice(0, 10).map((det) => ({
        name: det.display_name || det.class_name || det.class || analysis.disease?.name || 'Unknown',
        confidence: parseNumeric(det.confidence, 0),
        severity: String(det.severity || analysis.disease?.severity || 'unknown').toLowerCase(),
        recommendation: analysis.disease?.treatment || analysis.tappabilityAssessment.reason || 'Monitor tree condition.'
      }))
    : (fallbackDetection.confidence > 0 ? [fallbackDetection] : []);
  analysis.diseaseDetection = normalizedDiseaseDetection;

  const existingTree = analysis.tree && typeof analysis.tree === 'object' ? analysis.tree : {};
  const existingTreeID = existingTree.treeID || existingTree.treeId || analysis.treeID || analysis.treeId;
  const fallbackTreeID = analysis.analysisId ? `TR-${String(analysis.analysisId).slice(-6)}` : 'RUBBER-TREE';
  analysis.tree = {
    ...existingTree,
    treeID: existingTreeID || fallbackTreeID,
    treeId: existingTreeID || fallbackTreeID,
    species: existingTree.species || analysis.species,
    healthStatus: existingTree.healthStatus || healthStatus
  };
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
    healthStatus: tree.healthStatus || 'unknown',
    isTappable: Boolean(tree.isTappable),
    tappabilityScore: parseNumeric(tree.tappabilityScore, 0),
    lastScannedAt: tree.lastScannedAt || null
  };
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

  analysis.treeIdentification = {
    ...(analysis.treeIdentification || {}),
    isRubberTree: tree.isRubberTree !== false,
    species: analysis.species
  };

  analysis.trunkAnalysis = {
    ...(analysis.trunkAnalysis || {}),
    species: analysis.species,
    healthStatus: analysis.trunkAnalysis?.healthStatus || tree.healthStatus || 'unknown'
  };

  analysis.tappabilityAssessment = {
    ...(analysis.tappabilityAssessment || {}),
    score: parseNumeric(analysis.tappabilityAssessment?.score, tree.tappabilityScore || 0),
    isTappable:
      analysis.tappabilityAssessment?.isTappable ??
      Boolean(tree.isTappable)
  };
  analysis.tapabilityAssessment = analysis.tappabilityAssessment;
};

const buildApiAnalysisFromStored = (storedAnalysis) => {
  const base = storedAnalysis && typeof storedAnalysis === 'object' ? { ...storedAnalysis } : {};
  const full = base.fullAnalysis && typeof base.fullAnalysis === 'object' ? base.fullAnalysis : {};

  const payload = {
    ...full,
    ...base,
    primary_detection: base.primaryDetection || full.primary_detection || full.primaryDetection || {},
    all_detections: base.allDetections || full.all_detections || full.detections || [],
    care_recommendations: base.careRecommendations || full.care_recommendations || [],
    maturity: base.maturity || full.maturity || {},
    disease: base.disease || full.disease || {},
    health_score: parseNumeric(base.healthScore ?? full.health_score ?? full.healthScore, 0),
    age_estimate:
      base.ageEstimate ??
      full.age_estimate ??
      base.age_estimation?.estimated_years ??
      full.age_estimation?.estimated_years ??
      null,
    age_estimation: base.age_estimation || full.age_estimation || null,
    visual_analysis: base.visual_analysis || full.visual_analysis || {},
    color_analysis: base.colorAnalysis || full.color_analysis || base.visual_analysis?.color || full.visual_analysis?.color || {},
    texture_analysis: base.textureAnalysis || full.texture_analysis || base.visual_analysis?.texture || full.visual_analysis?.texture || {},
    model_info: base.model_info || full.model_info || {},
    image_metadata: base.image_metadata || full.image_metadata || {},
    ml_model_used: base.mlModelUsed ?? full.model_used ?? true,
    treeProfileId: base.treeProfileId || full.treeProfileId || null,
    tree: base.treeSnapshot || base.tree || full.tree || null,
    image: {
      url: base.imageUrl || full.image?.url || null,
      public_id: base.imagePublicId || full.image?.public_id || null
    }
  };

  payload.primaryDetection = payload.primary_detection;
  payload.allDetections = payload.all_detections;
  payload.healthScore = payload.health_score;
  payload.careRecommendations = payload.care_recommendations;
  payload.colorAnalysis = payload.color_analysis;
  payload.textureAnalysis = payload.texture_analysis;

  applyLegacyTrunkCompatibility(payload);
  return payload;
};

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

      if (!isTrunkDetected(analysis)) {
        if (cloudinaryResult?.public_id) {
          await deleteFromCloudinary(cloudinaryResult.public_id).catch((deleteError) => {
            console.error('Error deleting non-trunk image from Cloudinary:', deleteError);
          });
          cloudinaryResult = null;
        }

        return res.status(422).json({
          success: false,
          message: 'Trunk not detected. Please upload a clear image focused on a rubber tree trunk.',
          error: 'TRUNK_NOT_DETECTED'
        });
      }

      // Use Groq to generate non-static disease guidance and care recommendations.
      const groqInsights = await trunkGroqAdvisor.generate(analysis);
      analysis.disease = groqInsights.disease;
      analysis.care_recommendations = groqInsights.care_recommendations;
      analysis.ai_guidance = groqInsights.source;
      applyLegacyTrunkCompatibility(analysis);

      const selectedTreeProfile = await resolveTreeProfileForUser(req);
      if (selectedTreeProfile) {
        attachTreeProfileToAnalysis(analysis, selectedTreeProfile);
      }
      
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
      
      const sourcePrimary = analysis.primary_detection || analysis.primaryDetection || {};
      const normalizedAllDetections = (analysis.all_detections || analysis.detections || []).map((det) => {
        const rawSeverity =
          det?.severity ||
          det?.disease?.severity ||
          (String(det?.health_status || '').toLowerCase() === 'healthy' ? 'none' : 'low');

        return {
          ...det,
          class:
            det?.class ||
            det?.class_name ||
            det?.display_name ||
            det?.name ||
            'unknown',
          confidence: Number(det?.confidence || 0),
          severity: trunksService.mapSeverityToEnum(rawSeverity)
        };
      });

      const normalizedPrimaryDetection = {
        ...sourcePrimary,
        class:
          sourcePrimary.class ||
          sourcePrimary.class_name ||
          analysis.disease?.class ||
          'unknown',
        class_name:
          sourcePrimary.class_name ||
          sourcePrimary.class ||
          analysis.disease?.class ||
          'unknown',
        display_name:
          sourcePrimary.display_name ||
          sourcePrimary.name ||
          analysis.disease?.name ||
          sourcePrimary.class_name ||
          sourcePrimary.class ||
          'Unknown',
        confidence: Number(sourcePrimary.confidence || analysis.disease?.confidence || 0),
        severity: trunksService.mapSeverityToEnum(
          sourcePrimary.severity ||
          analysis.disease?.severity ||
          (String(sourcePrimary.health_status || '').toLowerCase() === 'healthy' ? 'none' : 'low')
        )
      };

      const normalizedCareRecommendations = (analysis.care_recommendations || [])
        .map((item, index) => {
          if (!item) return null;

          if (typeof item === 'string') {
            const clean = item.replace(/^[^A-Za-z0-9]+/, '').trim();
            return {
              priority: 'monitor',
              action: clean || `Recommendation ${index + 1}`,
              description: clean || item,
              timeframe: 'As needed'
            };
          }

          if (typeof item === 'object') {
            const rawPriority = String(item.priority || '').toLowerCase();
            const allowedPriorities = new Set(['immediate', 'soon', 'monitor', 'routine', 'low', 'medium', 'high', 'critical']);
            return {
              priority: allowedPriorities.has(rawPriority) ? rawPriority : 'monitor',
              action: item.action || item.title || item.recommendation || `Recommendation ${index + 1}`,
              description: item.description || item.details || item.action || '',
              timeframe: item.timeframe || item.schedule || 'As needed'
            };
          }

          return null;
        })
        .filter(Boolean);

      const dbAnalysisData = {
        userId: req.user?.id,
        imageUrl: cloudinaryResult.url,
        imagePublicId: cloudinaryResult.public_id,
        treeProfileId: analysis.treeProfileId || null,
        treeSnapshot: analysis.tree || null,
        primaryDetection: normalizedPrimaryDetection,
        allDetections: normalizedAllDetections,
        maturity: analysis.maturity || {},
        colorAnalysis: analysis.color_analysis || analysis.visual_analysis?.color || {},
        textureAnalysis: analysis.texture_analysis || analysis.visual_analysis?.texture || {},
        healthScore: analysis.health_score || analysis.healthScore || 0,
        ageEstimate: analysis.age_estimate || analysis.age_estimation?.estimated_years || null,
        careRecommendations: normalizedCareRecommendations,
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
      if (selectedTreeProfile?._id) {
        const nextHealthStatus = analysis.tree?.healthStatus || (analysis.disease?.detected ? 'diseased' : 'healthy');
        const nextBarkTexture = String(analysis.trunkAnalysis?.texture || '').trim().toLowerCase();
        await Tree.findByIdAndUpdate(selectedTreeProfile._id, {
          $set: {
            species: analysis.species || selectedTreeProfile.species,
            healthStatus: nextHealthStatus,
            barkTexture: nextBarkTexture || selectedTreeProfile.barkTexture || 'unknown',
            barkColor: analysis.trunkAnalysis?.color || analysis.bark_color || selectedTreeProfile.barkColor || null,
            isTappable: Boolean(analysis.tappabilityAssessment?.isTappable),
            tappabilityScore: parseNumeric(analysis.tappabilityAssessment?.score, 0),
            lastScannedAt: new Date()
          },
          $inc: { totalScans: 1 }
        }).catch((treeUpdateError) => {
          console.error('Failed to update tree profile after trunk analysis:', treeUpdateError);
        });
      }
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
      const statusCode =
                        analysisError.message.toLowerCase().includes('tree profile not found') ? 404 :
                        analysisError.message.includes('not found') ? 404 :
                        analysisError.message.includes('format') ? 400 :
                        analysisError.message.toLowerCase().includes('groq') ? 503 : 500;
      
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
    
    // Format the response to match frontend/mobile expectations
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

      const compat = buildApiAnalysisFromStored(analysis.toObject());
      
      return {
        _id: analysis._id,
        imageUrl: analysis.imageUrl,
        treeProfileId: compat.treeProfileId || analysis.treeProfileId || null,
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
        confidence: primaryConfidence,
        species: compat.species,
        bark_color: compat.bark_color,
        bark_texture: compat.bark_texture,
        tapability_score: compat.tapability_score,
        tappability_score: compat.tappability_score,
        tapability_assessment: compat.tapability_assessment,
        tappability_assessment: compat.tappability_assessment,
        treeIdentification: compat.treeIdentification,
        trunkAnalysis: compat.trunkAnalysis,
        tappabilityAssessment: compat.tappabilityAssessment,
        diseaseDetection: compat.diseaseDetection,
        tree: compat.tree
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
    
    // Format the analysis for frontend/mobile
    const formattedAnalysis = buildApiAnalysisFromStored(analysis.toObject());
    
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
    
    // Get classes discovered from actual model output (if available)
    const diseaseClasses = trunksService.getDiseaseClasses();
    const detectedClassCount = Object.keys(diseaseClasses).length;
    const activeModelName = modelInfo?.path ? path.basename(modelInfo.path) : 'Trunks-v2.pt';
    
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
          detectedClassCount > 0
            ? `${detectedClassCount} Model Classes (from ${activeModelName})`
            : 'Model classes available after first successful inference',
          'Maturity Classification (Immature/Mature)',
          'Color Analysis',
          'Texture Analysis',
          'Health Score Assessment',
          'Age Estimation',
          'Groq AI Disease Guidance & Care Recommendations',
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
          name: activeModelName,
          type: 'YOLO (Ultralytics)',
          status: modelAvailable ? 'Active' : 'Not Found',
          path: modelAvailable ? `../ML-models/${activeModelName}` : null,
          ...modelInfo
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          packagesAvailable: packagesAvailable,
          mlReady: mlReady,
          mlOnlyMode: true,
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
