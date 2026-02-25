const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Service for rubber tree leaf disease detection
 * Uses trained YOLO model (Leaf.pt) for accurate classification
 */
class LeafService {
  constructor() {
    this.modelPath = path.join(__dirname, '../ML-Models/Leaf.pt');
    this.pythonScriptPath = path.join(__dirname, '../ML-Models/leaf_inference.py');
    this.tempDir = path.join(__dirname, '../temp');
    this.modelInfo = null;
    this.diseaseDatabase = this.initializeDiseaseDatabase();
    this.initTempDir();
  }

  /**
   * Initialize temporary directory
   */
  async initTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  /**
   * Initialize disease database with comprehensive information
   */
  initializeDiseaseDatabase() {
    return {
      'healthy': {
        name: 'Healthy Leaf',
        scientificName: 'N/A',
        description: 'The leaf appears healthy with no visible disease symptoms.',
        symptoms: [
          'Uniform green color',
          'No visible spots or lesions',
          'Normal leaf texture',
          'No discoloration'
        ],
        severity: 'none',
        treatment: [
          'No treatment needed - tree is healthy',
          'Continue regular monitoring',
          'Maintain good agricultural practices'
        ],
        prevention: [
          'Regular inspection every 2 weeks',
          'Proper fertilization schedule',
          'Adequate watering',
          'Good air circulation'
        ],
        impact: 'Optimal growth and latex production'
      },
      
      'corynespora_leaf_spot': {
        name: 'Corynespora Leaf Spot',
        scientificName: 'Corynespora cassiicola',
        description: 'Fungal disease causing characteristic spots with dark borders and light centers.',
        symptoms: [
          'Circular to irregular brown spots',
          'Spots have dark brown borders with light brown/ash centers',
          'Spots may coalesce forming larger lesions',
          'Severe infection causes leaf yellowing and premature defoliation'
        ],
        causes: [
          'Fungal pathogen Corynespora cassiicola',
          'High humidity and rainfall',
          'Poor air circulation',
          'Wounding from wind or insects'
        ],
        severity: 'moderate',
        treatment: [
          'Apply copper-based fungicides (e.g., copper oxychloride)',
          'Use mancozeb or chlorothalonil at 7-14 day intervals',
          'Remove and destroy severely infected leaves',
          'Apply systemic fungicides like hexaconazole for severe cases'
        ],
        prevention: [
          'Improve air circulation through pruning',
          'Avoid overhead irrigation',
          'Maintain proper tree spacing (minimum 4-5m)',
          'Use disease-free planting material',
          'Apply preventive fungicides during wet season'
        ],
        impact: 'Can reduce photosynthetic area by 20-40%, affecting latex yield'
      },

      'colletotrichum_leaf_spot': {
        name: 'Colletotrichum Leaf Spot (Anthracnose)',
        scientificName: 'Colletotrichum gloeosporioides',
        description: 'Anthracnose causing dark lesions on leaves, especially on young foliage.',
        symptoms: [
          'Small water-soaked lesions on young leaves',
          'Dark brown to black spots with yellow halos',
          'Lesions may have concentric rings',
          'Leaf distortion and curling in severe cases',
          'Premature leaf fall'
        ],
        causes: [
          'Fungal pathogen Colletotrichum gloeosporioides',
          'Extended wet periods',
          'High humidity (>90%)',
          'Temperatures between 25-30°C',
          'Wounding from insects or mechanical damage'
        ],
        severity: 'moderate',
        treatment: [
          'Apply copper-based fungicides (e.g., copper hydroxide)',
          'Use mancozeb or propiconazole',
          'Remove and destroy infected plant material',
          'Apply every 7-10 days during active infection'
        ],
        prevention: [
          'Prune to improve air circulation',
          'Avoid working with wet foliage',
          'Apply protective fungicides before rainy season',
          'Maintain proper nutrition to reduce susceptibility'
        ],
        impact: 'Can cause significant defoliation in young trees, delaying maturity'
      },

      'oidium_leaf_mildew': {
        name: 'Powdery Mildew',
        scientificName: 'Oidium heveae',
        description: 'White powdery fungal growth on leaf surfaces, common in dry conditions.',
        symptoms: [
          'White to grayish powdery growth on leaf surfaces',
          'Distorted and curled young leaves',
          'Yellowing of affected areas',
          'Premature leaf drop',
          'Reduced photosynthetic capacity'
        ],
        causes: [
          'Fungal pathogen Oidium heveae',
          'Moderate temperatures (20-28°C)',
          'High humidity with dry leaf surfaces',
          'Dense canopy with poor air circulation',
          'Susceptible clones'
        ],
        severity: 'high',
        treatment: [
          'Apply sulfur-based fungicides',
          'Use wettable sulfur (2-3g/L water)',
          'Apply triadimefon or hexaconazole',
          'Treat every 10-14 days during active growth'
        ],
        prevention: [
          'Prune regularly for better air flow',
          'Avoid overcrowding during planting',
          'Use resistant clones where available',
          'Monitor young flushes closely',
          'Apply preventive sulfur dusting in high-risk periods'
        ],
        impact: 'Severe infection can reduce growth by 30-50% in young trees'
      },

      'phytophthora_leaf_fall': {
        name: 'Phytophthora Leaf Fall',
        scientificName: 'Phytophthora palmivora / P. meadii',
        description: 'Serious fungal-like pathogen causing leaf fall and pod rot.',
        symptoms: [
          'Water-soaked, dark green lesions',
          'Rapidly expanding irregular spots',
          'Leaves turn brown and hang on tree',
          'Characteristic chevron pattern on midrib',
          'Premature leaf fall'
        ],
        causes: [
          'Oomycete pathogens (water molds)',
          'Heavy rainfall and waterlogging',
          'Poor drainage',
          'Wounding from tapping',
          'Spores spread by rain splash'
        ],
        severity: 'critical',
        treatment: [
          'Apply metalaxyl or fosetyl-Al fungicides',
          'Use phosphorous acid treatments',
          'Improve drainage immediately',
          'Remove and destroy fallen leaves',
          'Apply fungicides to soil and foliage'
        ],
        prevention: [
          'Ensure proper drainage in plantation',
          'Avoid waterlogging',
          'Maintain clean orchard floor',
          'Use raised planting beds in wet areas',
          'Apply preventive treatments before rainy season'
        ],
        impact: 'Can cause 50-80% yield loss in severely affected areas'
      },

      'fusicladium_leaf_spot': {
        name: 'Fusicladium Leaf Spot (Bird\'s Eye Spot)',
        scientificName: 'Fusicladium macrosporum',
        description: 'Characteristic small spots resembling bird\'s eyes.',
        symptoms: [
          'Small circular spots (2-5mm)',
          'Dark brown borders with gray centers',
          'Spots resemble bird\'s eyes',
          'Numerous spots may coalesce',
          'Yellow halos around spots'
        ],
        causes: [
          'Fungal pathogen Fusicladium macrosporum',
          'Warm, humid conditions',
          'Poor air circulation',
          'Dense canopy'
        ],
        severity: 'moderate',
        treatment: [
          'Apply mancozeb or chlorothalonil',
          'Use copper-based fungicides',
          'Remove heavily infected leaves',
          'Treat at first sign of symptoms'
        ],
        prevention: [
          'Prune for better light penetration',
          'Maintain proper tree spacing',
          'Avoid overhead irrigation',
          'Monitor regularly during wet season'
        ],
        impact: 'Moderate impact on photosynthesis in severe cases'
      }
    };
  }

  /**
   * Check if the trained model file exists
   */
  async checkModelAvailability() {
    try {
      await fs.access(this.modelPath);
      console.log('✅ Leaf model found at:', this.modelPath);
      return true;
    } catch (error) {
      console.warn('❌ Leaf model not found at:', this.modelPath);
      return false;
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    try {
      if (require('fs').existsSync(this.modelPath)) {
        const stats = require('fs').statSync(this.modelPath);
        return {
          fileSize: stats.size,
          lastModified: stats.mtime,
          type: 'YOLO Classification Model'
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting model info:', error);
      return null;
    }
  }

  /**
   * Check if Python is available
   */
  async checkPythonAvailability() {
    try {
      const { stdout } = await execPromise('python --version');
      console.log('✅ Python available:', stdout.trim());
      return true;
    } catch (error) {
      console.warn('❌ Python not available:', error.message);
      return false;
    }
  }

  /**
   * Check if required Python packages are installed
   */
  async checkPythonPackages() {
    try {
      const packages = ['ultralytics', 'numpy', 'cv2'];
      for (const pkg of packages) {
        await execPromise(`python -c "import ${pkg}"`);
      }
      console.log('✅ All Python packages available');
      return true;
    } catch (error) {
      console.warn('❌ Some Python packages missing:', error.message);
      return false;
    }
  }

  /**
   * Get list of supported diseases
   */
  getSupportedDiseases() {
    return Object.keys(this.diseaseDatabase).map(key => ({
      id: key,
      name: this.diseaseDatabase[key].name,
      severity: this.diseaseDatabase[key].severity
    }));
  }

  /**
   * Get detailed information about a specific disease
   */
  getDiseaseInformation(diseaseName) {
    const normalizedName = diseaseName.toLowerCase().trim().replace(/\s+/g, '_');
    
    // Try exact match first
    if (this.diseaseDatabase[normalizedName]) {
      return this.diseaseDatabase[normalizedName];
    }
    
    // Try partial match
    for (const [key, value] of Object.entries(this.diseaseDatabase)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return value;
      }
    }
    
    // Return unknown disease info
    return {
      name: diseaseName,
      scientificName: 'Unknown',
      description: 'Information not available for this specific disease.',
      symptoms: ['Consult agricultural expert for accurate diagnosis'],
      severity: 'unknown',
      treatment: ['Seek professional agricultural advice'],
      prevention: ['Monitor regularly and maintain good agricultural practices'],
      impact: 'Unknown'
    };
  }

  /**
   * Save base64 image to temporary file
   */
  async saveBase64Image(base64Image) {
    try {
      // Extract base64 data
      const matches = base64Image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      
      let imageBuffer;
      let extension = 'jpg';

      if (matches && matches.length === 3) {
        extension = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        // Assume it's raw base64
        imageBuffer = Buffer.from(base64Image, 'base64');
      }

      // Generate unique filename
      const filename = `leaf_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      const filepath = path.join(this.tempDir, filename);

      // Save file
      await fs.writeFile(filepath, imageBuffer);

      return filepath;

    } catch (error) {
      console.error('Error saving base64 image:', error);
      throw new Error('Failed to save image');
    }
  }

  /**
   * Analyze leaf image using Python ML model
   * @param {string} imagePath - Path to the image file
   * @param {string} userId - Optional user ID for history
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzeLeaf(imagePath, userId = null, options = { returnVisualization: true }) {
    try {
      // Check if Python script exists
      await fs.access(this.pythonScriptPath);
      
      console.log('🔬 Running leaf analysis with trained model...');
      
      // Execute Python script
      const { stdout, stderr } = await execPromise(
        `python "${this.pythonScriptPath}" "${imagePath}" json`
      );

      if (stderr) {
        console.warn('Python stderr:', stderr);
      }

      // Parse JSON output
      const result = JSON.parse(stdout);
      
      if (!result.success) {
        throw new Error(result.error || 'Inference failed');
      }

      // Format the result with disease database information
      const formattedResult = this.formatAnalysisResult(result);
      
      // Add model info
      formattedResult.modelInfo = {
        modelUsed: 'Leaf.pt',
        modelPath: this.modelPath,
        mlModelUsed: true,
        ...result.model_info
      };
      
      // Save to history if userId provided
      if (userId) {
        await this.saveToHistory(userId, formattedResult, imagePath);
      }

      return formattedResult;

    } catch (error) {
      console.error('Analysis execution error:', error);
      
      // Fallback to heuristic analysis if ML fails
      console.warn('⚠️ Falling back to heuristic analysis');
      return this.fallbackAnalysis(imagePath, error.message);
    }
  }

  /**
   * Format analysis result from Python
   */
  formatAnalysisResult(rawResult) {
    const detection = rawResult.disease_detection || {};
    const visual = rawResult.visual_analysis || {};

    // Get detailed disease information
    const diseaseName = detection.primary_disease || 'Unknown';
    const originalClass = detection.original_class || diseaseName.toLowerCase().replace(/\s+/g, '_');
    const diseaseInfo = this.getDiseaseInformation(originalClass);

    return {
      diseaseInfo: {
        name: diseaseName,
        scientificName: diseaseInfo.scientificName,
        confidence: detection.confidence || 0,
        healthStatus: detection.health_status || 'unknown',
        severity: detection.severity || diseaseInfo.severity || 'unknown',
        isConfident: detection.is_confident || false,
        allPredictions: detection.all_predictions || [],
        description: diseaseInfo.description
      },
      // Add these fields for controller compatibility
      disease_detected: diseaseName,
      confidence: detection.confidence || 0,
      severity: detection.severity || diseaseInfo.severity || 'unknown',
      spots_count: visual.spot_count || 0,
      color_analysis: {
        primaryColor: visual.dominant_color || 'unknown',
        discoloration: visual.leaf_coverage ? 100 - visual.leaf_coverage : 0,
        healthyGreenPercentage: visual.leaf_coverage || 0,
        affectedAreaPercentage: 100 - (visual.leaf_coverage || 0)
      },
      treatment_recommendations: diseaseInfo.treatment || [],
      prevention_strategies: diseaseInfo.prevention || [],
      ml_model_used: true,
      processingTime: rawResult.processing_time || 'N/A',
      visualMetrics: {
        spotCount: visual.spot_count || 0,
        spotAreas: visual.spot_areas || [],
        dominantColor: visual.dominant_color || 'unknown',
        colorDistribution: visual.color_distribution || {},
        texture: visual.texture || 'unknown',
        leafCoverage: visual.leaf_coverage || 0,
        hasSpots: (visual.spot_count || 0) > 5
      },
      symptoms: diseaseInfo.symptoms || [],
      causes: diseaseInfo.causes || [],
      treatment: diseaseInfo.treatment || [],
      prevention: diseaseInfo.prevention || [],
      impact: diseaseInfo.impact || 'Unknown',
      recommendations: this.generateRecommendations(detection, visual, diseaseInfo),
      visualization: rawResult.visualization || null,
      timestamp: new Date().toISOString(),
      analysisId: `leaf_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      imageMetadata: {
        analyzedAt: new Date().toISOString(),
        filename: path.basename(imagePath),
        fileSizeKB: 0,
        source: 'ml_analysis'
      }
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(detection, visual, diseaseInfo) {
    const recommendations = [];
    const diseaseName = (detection.primary_disease || '').toLowerCase();
    const healthStatus = detection.health_status || 'unknown';
    const severity = detection.severity || diseaseInfo.severity || 'unknown';
    const spotCount = visual.spot_count || 0;

    // Health-based recommendations
    if (healthStatus === 'healthy') {
      recommendations.push('✅ Tree is healthy - continue regular monitoring (every 2 weeks)');
      recommendations.push('🌱 Maintain proper fertilization schedule (NPK 12-12-17)');
      recommendations.push('💧 Ensure adequate but not excessive watering');
      recommendations.push('📅 Schedule next inspection in 2 weeks');
    } else {
      recommendations.push(`⚠️ Disease detected: ${detection.primary_disease}`);
      
      // Severity-based urgency
      if (severity === 'critical' || severity === 'high') {
        recommendations.push('🚨 URGENT: Begin treatment within 24-48 hours');
        recommendations.push('⏸️ STOP TAPPING until tree shows recovery');
        recommendations.push('🧪 Consider sending sample to plant pathology lab');
      } else if (severity === 'moderate') {
        recommendations.push('⚠️ Begin treatment within 3-5 days');
        recommendations.push('📋 Increase monitoring frequency to weekly');
      }

      // Spot-based recommendations
      if (spotCount > 50) {
        recommendations.push('📈 SEVERE: High spot density - immediate treatment required');
      } else if (spotCount > 20) {
        recommendations.push('🔍 Multiple spots detected - start treatment soon');
      }

      // Disease-specific recommendations from database
      if (diseaseInfo.treatment && diseaseInfo.treatment.length > 0) {
        diseaseInfo.treatment.slice(0, 3).forEach(t => recommendations.push(t));
      }
    }

    // Add prevention tips
    if (diseaseInfo.prevention && diseaseInfo.prevention.length > 0) {
      recommendations.push('📋 Prevention tips:');
      diseaseInfo.prevention.slice(0, 3).forEach(p => recommendations.push(`  • ${p}`));
    }

    return recommendations;
  }

  /**
   * Fallback analysis when Python/ML is not available
   */
  async fallbackAnalysis(imagePath, reason = 'ML model unavailable') {
    console.log(`Using fallback analysis. Reason: ${reason}`);
    
    const stats = require('fs').statSync(imagePath);
    const fileSizeKB = stats.size / 1024;
    
    return {
      diseaseInfo: {
        name: 'Unknown (Heuristic Analysis)',
        scientificName: 'N/A',
        confidence: 0,
        healthStatus: 'unknown',
        severity: 'unknown',
        isConfident: false,
        description: 'ML model unavailable - basic analysis only'
      },
      // Add these fields for controller compatibility
      disease_detected: 'Unknown',
      confidence: 0,
      severity: 'unknown',
      spots_count: 0,
      color_analysis: {
        primaryColor: 'unknown',
        discoloration: 0,
        healthyGreenPercentage: 0,
        affectedAreaPercentage: 0
      },
      treatment_recommendations: [
        'Please install Python dependencies: numpy, ultralytics, opencv-python',
        'Ensure Leaf.pt model file exists in ML-Models directory'
      ],
      prevention_strategies: [
        'Check system configuration',
        'Verify Python and required packages are installed'
      ],
      ml_model_used: false,
      processingTime: '0s',
      visualMetrics: {
        spotCount: 0,
        spotAreas: [],
        dominantColor: 'unknown',
        colorDistribution: {},
        texture: 'unknown',
        leafCoverage: 100,
        hasSpots: false
      },
      symptoms: ['Unable to detect symptoms without ML model'],
      treatment: ['Please ensure ML model is properly configured'],
      prevention: ['Check system configuration and model availability'],
      impact: 'Unknown',
      recommendations: [
        '⚠️ ML model unavailable - using basic analysis',
        'Check if Leaf.pt exists in ML-Models directory',
        'Verify Python and required packages are installed',
        'Run: pip install numpy ultralytics opencv-python'
      ],
      timestamp: new Date().toISOString(),
      analysisId: `leaf_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      modelInfo: {
        modelUsed: null,
        reason: reason,
        fallback: true,
        mlModelUsed: false
      },
      imageMetadata: {
        analyzedAt: new Date().toISOString(),
        filename: path.basename(imagePath),
        fileSizeKB: Math.round(fileSizeKB),
        source: 'fallback_analysis'
      }
    };
  }

  /**
   * Save analysis to user history
   */
  async saveToHistory(userId, analysisResult, imagePath) {
    try {
      // This would integrate with your database
      console.log(`✅ Analysis saved for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to save to history:', error);
      return false;
    }
  }

  /**
   * Get user's analysis history
   */
  async getUserHistory(userId, options = { limit: 20, page: 1 }) {
    try {
      // This would fetch from your database
      return {
        analyses: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        pages: 0
      };
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      // This would compute from database
      return {
        totalAnalyses: 0,
        healthyCount: 0,
        diseasedCount: 0,
        mostCommonDisease: 'None',
        averageConfidence: 0,
        lastAnalysisDate: null,
        diseasesDetected: []
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Delete a specific analysis
   */
  async deleteAnalysis(userId, analysisId) {
    try {
      // This would delete from database
      console.log(`Deleting analysis ${analysisId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  }
}

module.exports = new LeafService();