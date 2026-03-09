const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

// Import services
const latexService = require('../services/LatexService');
const leafService = require('../services/LeafServices');
const trunksService = require('../services/TrunksService');
const leafGroqAdvisor = require('../services/LeafGroqAdvisor');
const trunkGroqAdvisor = require('../services/TrunkGroqAdvisor');

// Import Cloudinary utilities
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');

// ============================================
// SHARED HELPER FUNCTIONS
// ============================================

const toNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseNumeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

const titleCaseWord = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'Unknown';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// ============================================
// LATEX ANALYSIS HELPERS
// ============================================

const mapQualityClass = (analysis) => {
  const rawClass = analysis.latex_analysis?.quality_class || 
                   analysis.latex_analysis?.primary_classification?.class;
  
  if (!rawClass) return 'Unknown';
  
  const classStr = String(rawClass).toLowerCase();
  
  if (classStr.includes('high')) return 'High';
  if (classStr.includes('medium')) return 'Medium';
  if (classStr.includes('low')) return 'Low';
  
  return 'Unknown';
};

const extractImpurities = (analysis) => {
  const impurities = [];
  
  if (analysis.latex_analysis?.impurities?.detected) {
    const type = analysis.latex_analysis.impurities.type;
    if (type && type !== 'none') {
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
// LEAF ANALYSIS HELPERS
// ============================================

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

const getSeverityLevel = (severityNum) => {
  if (severityNum >= 80) return 'Critical';
  if (severityNum >= 60) return 'High';
  if (severityNum >= 40) return 'Medium';
  if (severityNum >= 20) return 'Low';
  return 'Very Low';
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
  const recommendationList = normalizeTextList(
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

  const recommendationList = normalizeTextList(
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

  const species = analysis.species || 'Hevea brasiliensis';

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
    isRubberTree: existingTreeIdentification.isRubberTree ?? true,
    detectedPart: 'leaf',
    confidence,
    maturity: 'unknown',
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
// TRUNK ANALYSIS HELPERS
// ============================================

const clampScore = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

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

  analysis.tree = {
    ...(analysis.tree || {}),
    species: analysis.species,
    healthStatus
  };
};

// ============================================
// MULTER CONFIGURATION
// ============================================

const upload = multer({
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
// LATEX ANALYSIS
// ============================================

exports.analyzeLatex = async (req, res) => {
  const singleUpload = upload.single('image');
  
  singleUpload(req, res, async (err) => {
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
    
    console.log(`Admin Latex Analysis - File uploaded: ${req.file.originalname}`);
    
    let cloudinaryResult = null;
    let tempFilePath = null;
    
    try {
      // Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      
      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      tempFilePath = path.join(tempDir, `admin-latex-${Date.now()}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      
      cloudinaryResult = await uploadToCloudinary(tempFilePath, 'rubbersense/admin/latex');
      console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.url}`);
      
      const region = req.body.region || 'global_avg';
      
      // Check model availability
      const modelAvailable = latexService.checkModelAvailability();
      
      if (!modelAvailable) {
        console.warn('⚠️ Warning: Trained model not found at expected path');
      }
      
      // Analyze the image
      const analysis = await latexService.analyzeLatex(tempFilePath, {
        region: region,
        returnVisualization: true
      });

      const inputOverrides = applyUserLatexInputs(analysis, req.body);
      analysis.scanType = analysis.scanType || 'latex';
      
      // Add Cloudinary image info
      analysis.image = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.url,
        secure_url: cloudinaryResult.secure_url
      };
      
      // Add admin info
      analysis.analyzedBy = req.user ? req.user.id : 'admin';
      analysis.analysisType = 'admin';
      
      // Map quality class
      const qualityClass = mapQualityClass(analysis);
      
      // Extract impurities and recommendations
      const impuritiesDetected = extractImpurities(analysis);
      const recommendations = extractRecommendations(analysis);
      
      console.log('✅ Admin analysis completed:');
      console.log(`   Quality: ${qualityClass}`);
      console.log(`   Confidence: ${analysis.latex_analysis?.quality_score || 0}%`);
      
      res.status(200).json({
        success: true,
        message: 'Latex analysis completed successfully',
        timestamp: new Date().toISOString(),
        data: {
          ...analysis,
          analysisId: `admin-${Date.now()}`,
          image: {
            url: cloudinaryResult.url,
            public_id: cloudinaryResult.public_id
          }
        },
        meta: {
          modelUsed: analysis.ml_model_used,
          modelAvailable: modelAvailable,
          processingTime: analysis.processingTime || 'unknown',
          region: region,
          analysisType: 'admin'
        }
      });
      
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
        if (message.includes('not found')) return 404;
        if (message.includes('timeout')) return 504;
        return 500;
      })();

      res.status(statusCode).json({
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
        });
      }
    }
  });
};

// ============================================
// LEAF ANALYSIS
// ============================================

exports.analyzeLeaf = async (req, res) => {
  const singleUpload = upload.single('image');
  
  singleUpload(req, res, async (err) => {
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

    console.log(`Admin Leaf Analysis - File uploaded: ${req.file.originalname}`);

    let cloudinaryResult = null;
    let tempFilePath = null;

    try {
      console.log('Uploading to Cloudinary...');

      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      tempFilePath = path.join(tempDir, `admin-leaf-${Date.now()}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);

      cloudinaryResult = await uploadToCloudinary(tempFilePath, 'rubbersense/admin/leaf');

      const modelAvailable = await leafService.checkModelAvailability();

      const analysis = await leafService.analyzeLeaf(
        tempFilePath,
        null, // No user ID for admin
        { returnVisualization: true }
      );

      applyLeafCompatibility(analysis);

      if (!isLeafDetected(analysis)) {
        if (cloudinaryResult?.public_id) {
          await deleteFromCloudinary(cloudinaryResult.public_id).catch(() => {});
          cloudinaryResult = null;
        }

        return res.status(422).json({
          success: false,
          message: 'Leaf not detected. Please upload a clear image focused on a rubber tree leaf.',
          error: 'LEAF_NOT_DETECTED'
        });
      }

      // Generate AI insights
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

      analysis.analyzedBy = req.user ? req.user.id : 'admin';
      analysis.analysisType = 'admin';

      const diseaseInfo = analysis.diseaseInfo || {};
      const visualMetrics = analysis.visualMetrics || {};
      const primaryDisease = Array.isArray(analysis.diseaseDetection) ? analysis.diseaseDetection[0] : null;
      const severityString =
        primaryDisease?.severity ||
        diseaseInfo.severity ||
        analysis.severity ||
        'unknown';
      const severityNumber = severityToNumber(severityString);

      res.status(200).json({
        success: true,
        message: 'Leaf analysis completed successfully',
        data: {
          ...analysis,
          analysisId: `admin-${Date.now()}`,
          image: {
            url: cloudinaryResult.url,
            public_id: cloudinaryResult.public_id
          },
          severityNumber,
          severityLevel: getSeverityLevel(severityNumber)
        }
      });

    } catch (analysisError) {
      console.error('Analysis error:', analysisError);

      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await deleteFromCloudinary(cloudinaryResult.public_id);
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary:', deleteError);
        }
      }

      const statusCode = (() => {
        const message = String(analysisError.message || '').toLowerCase();
        if (message.includes('not detected')) return 422;
        if (message.includes('not found')) return 404;
        if (message.includes('invalid')) return 400;
        return 500;
      })();

      res.status(statusCode).json({
        success: false,
        message: 'Error analyzing leaf image',
        error: analysisError.message
      });
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, () => {});
      }
    }
  });
};

// ============================================
// TRUNK ANALYSIS
// ============================================

exports.analyzeTrunk = async (req, res) => {
  const singleUpload = upload.single('image');
  
  singleUpload(req, res, async (err) => {
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
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Please provide an image file with field name "image"'
      });
    }
    
    console.log(`📤 Admin Trunk Analysis - File uploaded: ${req.file.originalname}`);
    
    let cloudinaryResult = null;
    let tempFilePath = null;
    
    try {
      // Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      
      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      tempFilePath = path.join(tempDir, `admin-trunk-${Date.now()}${path.extname(req.file.originalname)}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      
      cloudinaryResult = await uploadToCloudinary(tempFilePath, 'rubbersense/admin/trunks');
      
      // Check model availability
      const modelAvailable = trunksService.checkModelAvailability();
      
      // Generate cache key
      const cacheKey = `admin_${req.file.originalname}_${Date.now()}`;
      
      // Analyze the image
      const analysis = await trunksService.analyzeTrunk(tempFilePath, {
        returnVisualization: true,
        detailedAnalysis: true,
        useCache: true,
        cacheKey: cacheKey,
        timeoutMs: 120000
      });

      if (!isTrunkDetected(analysis)) {
        if (cloudinaryResult?.public_id) {
          await deleteFromCloudinary(cloudinaryResult.public_id).catch(() => {});
          cloudinaryResult = null;
        }

        return res.status(422).json({
          success: false,
          message: 'Trunk not detected. Please upload a clear image focused on a rubber tree trunk.',
          error: 'TRUNK_NOT_DETECTED'
        });
      }

      // Generate Groq insights
      const groqInsights = await trunkGroqAdvisor.generate(analysis);
      analysis.disease = groqInsights.disease;
      analysis.care_recommendations = groqInsights.care_recommendations;
      analysis.ai_guidance = groqInsights.source;
      applyLegacyTrunkCompatibility(analysis);
      
      // Add Cloudinary image info
      analysis.image = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.url,
        secure_url: cloudinaryResult.secure_url
      };
      
      // Add admin info
      analysis.analyzedBy = req.user ? req.user.id : 'admin';
      analysis.analysisType = 'admin';
      
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
          severity: trunksService.mapSeverityToEnum ? trunksService.mapSeverityToEnum(rawSeverity) : rawSeverity
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
        severity: trunksService.mapSeverityToEnum ? trunksService.mapSeverityToEnum(
          sourcePrimary.severity ||
          analysis.disease?.severity ||
          (String(sourcePrimary.health_status || '').toLowerCase() === 'healthy' ? 'none' : 'low')
        ) : (sourcePrimary.severity || 'unknown')
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

      console.log(`✅ Admin trunk analysis complete`);
      
      res.status(200).json({
        success: true,
        message: 'Trunk analysis completed successfully',
        data: {
          ...analysis,
          analysisId: `admin-${Date.now()}`,
          primary_detection: normalizedPrimaryDetection,
          all_detections: normalizedAllDetections,
          care_recommendations: normalizedCareRecommendations,
          image: {
            url: cloudinaryResult.url,
            public_id: cloudinaryResult.public_id
          }
        }
      });
      
    } catch (analysisError) {
      console.error('❌ Analysis error:', analysisError);
      
      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await deleteFromCloudinary(cloudinaryResult.public_id);
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary:', deleteError);
        }
      }
      
      const statusCode = analysisError.message.toLowerCase().includes('not found') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: 'Error analyzing trunk image',
        error: analysisError.message
      });
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, () => {});
      }
    }
  });
};

// ============================================
// SYSTEM INFO ENDPOINTS
// ============================================

exports.getLatexInfo = async (req, res) => {
  try {
    const modelAvailable = latexService.checkModelAvailability();
    const modelInfo = latexService.getModelInfo ? latexService.getModelInfo() : {};
    const activeModelName = modelInfo?.modelFile || latexService.getActiveModelName ? latexService.getActiveModelName() : 'latex-model.pt';
    
    const pythonAvailable = await latexService.checkPythonAvailability();
    const packagesAvailable = pythonAvailable ? await latexService.checkPythonPackages() : false;
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        name: 'RubberSense Admin Latex Detection',
        version: '1.0.0',
        description: 'Admin ML-powered latex quality analysis system',
        capabilities: [
          'Latex Quality Classification (High/Medium/Low)',
          'Contamination Detection',
          'Dry Rubber Content (DRC) Estimation',
          'Color Analysis',
          'Consistency Analysis',
          'Impurity Detection',
          'Quantity Estimation',
          'Product Recommendations'
        ],
        specifications: {
          supportedFormats: ['JPEG', 'PNG', 'WebP'],
          maxFileSize: '10MB',
          processingTime: '2-5 seconds'
        },
        mlModel: {
          name: activeModelName,
          type: 'YOLO (PyTorch)',
          status: modelAvailable ? 'Active' : 'Not Found',
          details: modelInfo
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          packagesAvailable: packagesAvailable,
          mlReady: modelAvailable && pythonAvailable && packagesAvailable,
          environment: process.env.NODE_ENV || 'development'
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

exports.getLeafInfo = async (req, res) => {
  try {
    const modelAvailable = await leafService.checkModelAvailability();
    const modelInfo = leafService.getModelInfo ? leafService.getModelInfo() : {};
    const activeModelName = leafService.getActiveModelName ? leafService.getActiveModelName() : 'leaf-model.pt';
    
    const pythonAvailable = await leafService.checkPythonAvailability();
    const packagesAvailable = pythonAvailable ? await leafService.checkPythonPackages() : false;
    
    const diseases = leafService.getSupportedDiseases ? leafService.getSupportedDiseases() : [];
    
    res.status(200).json({
      success: true,
      data: {
        name: 'RubberSense Admin Leaf Disease Detection',
        version: '1.0.0',
        description: 'Admin AI-powered rubber tree leaf disease detection system',
        features: [
          'Disease Detection & Classification',
          'Leaf Not Detected Validation',
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
          name: activeModelName,
          type: modelInfo?.type || 'YOLO Model',
          status: modelAvailable ? 'Active' : 'Not Found',
          ...modelInfo
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          packagesAvailable: packagesAvailable,
          mlReady: modelAvailable && pythonAvailable && packagesAvailable
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

exports.getTrunksInfo = async (req, res) => {
  try {
    const modelAvailable = trunksService.checkModelAvailability();
    const modelInfo = trunksService.getModelInfo ? trunksService.getModelInfo() : {};
    const pythonAvailable = await trunksService.checkPythonAvailability();
    const packagesAvailable = pythonAvailable ? await trunksService.checkPythonPackages() : false;
    
    const mlReady = modelAvailable && pythonAvailable && packagesAvailable;
    const diseaseClasses = trunksService.getDiseaseClasses ? trunksService.getDiseaseClasses() : {};
    const detectedClassCount = Object.keys(diseaseClasses).length;
    const activeModelName = modelInfo?.path ? path.basename(modelInfo.path) : 'Trunks-v2.pt';
    
    res.status(200).json({
      success: true,
      data: {
        name: 'RubberSense Admin Trunk Analysis',
        version: '1.0.0',
        description: 'Admin AI-powered rubber tree trunk analysis system',
        features: [
          detectedClassCount > 0 ? `${detectedClassCount} Model Classes` : 'Model classes available after first successful inference',
          'Maturity Classification (Immature/Mature)',
          'Color Analysis',
          'Texture Analysis',
          'Health Score Assessment',
          'Age Estimation',
          'Groq AI Disease Guidance & Care Recommendations'
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
          ...modelInfo
        },
        systemStatus: {
          pythonAvailable: pythonAvailable,
          packagesAvailable: packagesAvailable,
          mlReady: mlReady,
          mlOnlyMode: true
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
