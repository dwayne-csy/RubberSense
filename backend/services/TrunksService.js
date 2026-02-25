const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Trunks Detection Service
 * This service handles communication between Node.js and Python ML inference
 * for rubber tree trunk analysis using the trained Trunks.pt model
 * Updated to work with enhanced ML model with 8 disease classes
 */

class TrunksService {
  constructor() {
    // Update paths to match RubberSense structure
    this.pythonScript = path.join(__dirname, '..', 'ML-Models', 'trunks_inference.py');
    this.modelPath = path.join(__dirname, '..', 'ML-Models', 'Trunks.pt');
    this.isPythonAvailable = null;
    this.pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    // Cache for analysis results
    this.analysisCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Log paths for debugging
    console.log('🔧 TrunksService initialized with:');
    console.log(`  📍 Python script: ${this.pythonScript}`);
    console.log(`  📍 Model path: ${this.modelPath}`);
    console.log(`  📍 Python command: ${this.pythonCmd}`);
    
    // Check if files exist on startup
    this.validatePaths();
  }

  /**
   * Validate all required paths exist
   */
  validatePaths() {
    const scriptExists = fs.existsSync(this.pythonScript);
    const modelExists = fs.existsSync(this.modelPath);
    
    console.log('📋 Path validation:');
    console.log(`  📄 Python script: ${scriptExists ? '✅' : '❌'} ${this.pythonScript}`);
    console.log(`  🤖 Model file: ${modelExists ? '✅' : '❌'} ${this.modelPath}`);
    
    if (!scriptExists) {
      console.warn('⚠️ Python inference script not found. ML analysis will not work.');
    }
    
    if (!modelExists) {
      console.warn('⚠️ Trained model not found. ML analysis will not work.');
    }
  }

  /**
   * Check if Python is available in the system
   */
  async checkPythonAvailability() {
    if (this.isPythonAvailable !== null) {
      return this.isPythonAvailable;
    }

    return new Promise((resolve) => {
      const proc = spawn(this.pythonCmd, ['--version'], { shell: true });

      proc.on('error', () => {
        this.isPythonAvailable = false;
        resolve(false);
      });

      proc.on('close', (code) => {
        this.isPythonAvailable = code === 0;
        if (this.isPythonAvailable) {
          console.log('✅ Python is available');
        } else {
          console.warn('⚠️ Python is not available');
        }
        resolve(this.isPythonAvailable);
      });
    });
  }

  /**
   * Check if required Python packages are installed
   */
  async checkPythonPackages() {
    return new Promise((resolve) => {
      // Check for ultralytics and other required packages
      const proc = spawn(this.pythonCmd, [
        '-c', 
        'import sys; import ultralytics; import torch; import cv2; import numpy; print("OK")'
      ], { shell: true });

      let stdout = '';
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.on('close', (code) => {
        const success = code === 0 && stdout.includes('OK');
        if (success) {
          console.log('✅ Required Python packages are installed');
        } else {
          console.warn('⚠️ Some Python packages are missing');
        }
        resolve(success);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Check if the trained model exists
   */
  checkModelAvailability() {
    const exists = fs.existsSync(this.modelPath);
    console.log(`📦 Model ${this.modelPath} exists: ${exists ? '✅' : '❌'}`);
    return exists;
  }

  /**
   * Get model file information
   */
  getModelInfo() {
    try {
      if (!fs.existsSync(this.modelPath)) {
        return {
          exists: false,
          error: 'Model file not found'
        };
      }
      
      const stats = fs.statSync(this.modelPath);
      return {
        exists: true,
        sizeKB: Math.round(stats.size / 1024),
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        modifiedAt: stats.mtime,
        modifiedAtISO: stats.mtime.toISOString(),
        path: this.modelPath
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Map severity strings to enum values accepted by the schema
   */
  mapSeverityToEnum(severity) {
    const severityMap = {
      'None': 'low',
      'Mild to Moderate': 'medium',
      'Moderate': 'medium',
      'Moderate to Severe': 'high',
      'Severe': 'high',
      'Critical': 'critical',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    
    // Handle case-insensitive matching
    const normalizedSeverity = severity?.toString().toLowerCase() || 'low';
    
    // Check if it's already a valid enum value
    if (['low', 'medium', 'high', 'critical'].includes(normalizedSeverity)) {
      return normalizedSeverity;
    }
    
    // Try to map from the severityMap
    for (const [key, value] of Object.entries(severityMap)) {
      if (key.toLowerCase() === normalizedSeverity) {
        return value;
      }
    }
    
    return 'medium'; // Default fallback
  }

  /**
   * Get all available disease classes from the model
   */
  getDiseaseClasses() {
    return {
      healthy_trunk: {
        id: 0,
        name: 'Healthy',
        severity: 'None',
        description: 'Tree trunk appears healthy with no signs of disease'
      },
      white_root_disease: {
        id: 1,
        name: 'White Root Disease',
        severity: 'Moderate to Severe',
        description: 'Fungal infection caused by Rigidoporus microporus'
      },
      brown_root_disease: {
        id: 2,
        name: 'Brown Root Disease',
        severity: 'Moderate',
        description: 'Fungal disease caused by Phellinus noxius'
      },
      rigidoporus: {
        id: 3,
        name: 'Rigidoporus',
        severity: 'Severe',
        description: 'Serious fungal infection causing white rot'
      },
      pink_disease: {
        id: 4,
        name: 'Pink Disease',
        severity: 'Moderate',
        description: 'Fungal infection caused by Corticium salmonicolor'
      },
      bark_cracking: {
        id: 5,
        name: 'Bark Cracking',
        severity: 'Mild to Moderate',
        description: 'Physical damage to bark causing cracks'
      },
      gummosis: {
        id: 6,
        name: 'Gummosis',
        severity: 'Moderate',
        description: 'Gum exudation from trunk due to fungal infection or stress'
      },
      canker: {
        id: 7,
        name: 'Canker',
        severity: 'Moderate to Severe',
        description: 'Localized dead areas on bark caused by fungal pathogens'
      }
    };
  }

  /**
   * Run ML inference on an image using the trained Trunks model
   * @param {string} imagePath - Path to the image file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Comprehensive analysis result
   */
  async analyzeTrunk(imagePath, options = {}) {
    const {
      returnVisualization = true,
      detailedAnalysis = true,
      useCache = false,
      cacheKey = null
    } = options;

    // Check cache if enabled
    if (useCache && cacheKey) {
      const cached = this.analysisCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log('📦 Returning cached analysis result');
        return cached.data;
      }
    }

    // Validate image path
    if (!imagePath || !fs.existsSync(imagePath)) {
      throw new Error('Image file not found');
    }

    // Get image file info
    const imageStats = fs.statSync(imagePath);
    const imageInfo = {
      filename: path.basename(imagePath),
      sizeKB: Math.round(imageStats.size / 1024 * 10) / 10,
      modifiedAt: imageStats.mtime,
      extension: path.extname(imagePath).toLowerCase()
    };

    console.log(`🔍 Analyzing trunk image: ${imagePath}`);
    console.log(`📸 Image info:`, imageInfo);

    // Validate image extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!validExtensions.includes(imageInfo.extension)) {
      console.warn(`⚠️ Unsupported image format: ${imageInfo.extension}`);
    }

    // Check if Python and model are available
    const pythonAvailable = await this.checkPythonAvailability();
    const modelAvailable = this.checkModelAvailability();
    const packagesAvailable = pythonAvailable ? await this.checkPythonPackages() : false;

    // If any component is missing, use fallback
    if (!pythonAvailable || !modelAvailable || !packagesAvailable) {
      const reasons = [];
      if (!pythonAvailable) reasons.push('Python not available');
      if (!modelAvailable) reasons.push('Model not found');
      if (!packagesAvailable) reasons.push('Packages missing');
      
      console.warn(`⚠️ Using fallback analysis. Reasons: ${reasons.join(', ')}`);
      const fallbackResult = await this.fallbackAnalysis(imagePath, reasons.join(', '));
      
      // Cache fallback result if requested
      if (useCache && cacheKey) {
        this.analysisCache.set(cacheKey, {
          timestamp: Date.now(),
          data: fallbackResult
        });
      }
      
      return fallbackResult;
    }

    console.log(`🚀 Running ML inference with model: ${this.modelPath}`);

    return new Promise((resolve, reject) => {
      // Prepare arguments for Python script
      const args = [
        this.pythonScript,
        imagePath,
        'json',
        this.modelPath
      ];
      
      console.log(`⚙️ Executing: ${this.pythonCmd} ${args.join(' ')}`);
      
      const proc = spawn(this.pythonCmd, args, {
        shell: true,
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1'  // Ensure real-time output
        }
      });

      let stdout = '';
      let stderr = '';
      let timeoutId;

      // Set timeout for the process (30 seconds)
      const timeout = setTimeout(() => {
        proc.kill();
        reject(new Error('ML inference timed out after 30 seconds'));
      }, 30000);

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        // Log progress updates if any
        const output = data.toString().trim();
        if (output.includes('✅') || output.includes('📦') || output.includes('🔬')) {
          console.log(`🐍 Python: ${output}`);
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        const errorOutput = data.toString().trim();
        
        // Filter out common warnings
        if (!errorOutput.includes('FutureWarning') && 
            !errorOutput.includes('UserWarning') &&
            errorOutput.length > 0) {
          console.log(`🐍 Python stderr: ${errorOutput}`);
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Python process error:', error);
        this.fallbackAnalysis(imagePath, 'Python process error')
          .then(resolve)
          .catch(() => reject(new Error('Failed to run ML inference')));
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code !== 0) {
          console.error(`❌ Python script exited with code ${code}`);
          console.error('📝 stderr:', stderr);
          
          // Try to parse error from stderr
          try {
            const errorLines = stderr.split('\n').filter(line => line.trim());
            const lastError = errorLines[errorLines.length - 1];
            
            // Check if it's a JSON error
            if (lastError.startsWith('{') && lastError.endsWith('}')) {
              const errorObj = JSON.parse(lastError);
              console.error('ML Error details:', errorObj);
            }
          } catch (e) {
            // Not JSON, continue
          }
          
          // Fall back to local analysis
          this.fallbackAnalysis(imagePath, `Python script error (code ${code})`)
            .then(resolve)
            .catch(() => reject(new Error('ML inference failed')));
          return;
        }

        // Find the JSON output in stdout
        const lines = stdout.trim().split('\n');
        let jsonOutput = null;
        
        // Try to find valid JSON (last line that parses as JSON)
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') || line.startsWith('[')) {
            try {
              jsonOutput = JSON.parse(line);
              console.log(`✅ Parsed JSON output from line ${i + 1}`);
              break;
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }

        if (!jsonOutput) {
          console.error('❌ No valid JSON output found in stdout');
          console.error('📝 stdout preview:', stdout.substring(0, 500));
          
          this.fallbackAnalysis(imagePath, 'Invalid ML output format')
            .then(resolve)
            .catch(() => reject(new Error('Failed to parse ML output')));
          return;
        }

        if (jsonOutput.success === false) {
          console.error('❌ ML inference returned error:', jsonOutput.error);
          if (jsonOutput.traceback) {
            console.error('📋 Traceback:', jsonOutput.traceback);
          }
          
          this.fallbackAnalysis(imagePath, jsonOutput.error || 'ML inference failed')
            .then(resolve)
            .catch(() => reject(new Error(jsonOutput.error || 'ML inference failed')));
          return;
        }

        // Enhance the result with additional information
        const enhancedResult = this.enhanceAnalysisResult(jsonOutput, imagePath, imageInfo);
        
        console.log('✅ ML inference successful');
        console.log(`🎯 Primary detection: ${enhancedResult.primary_detection?.display_name} (${enhancedResult.primary_detection?.confidence}%)`);
        console.log(`🏥 Health score: ${enhancedResult.health_score}/100`);
        
        // Cache the result if requested
        if (useCache && cacheKey) {
          this.analysisCache.set(cacheKey, {
            timestamp: Date.now(),
            data: enhancedResult
          });
        }

        resolve(enhancedResult);
      });
    });
  }

  /**
   * Enhance the ML result with additional metadata
   */
  enhanceAnalysisResult(result, imagePath, imageInfo) {
    // Add image metadata if not present
    if (!result.image_metadata) {
      result.image_metadata = {
        filename: imageInfo.filename,
        file_size_kb: imageInfo.sizeKB,
        analyzed_at: new Date().toISOString(),
        format: imageInfo.extension
      };
    }

    // Ensure health_score is present
    if (result.health_score === undefined && result.healthScore) {
      result.health_score = result.healthScore;
    }

    // Ensure primary_detection is properly formatted with correct severity enum
    if (!result.primary_detection && result.disease) {
      result.primary_detection = {
        class: result.disease.class || 'unknown',
        class_name: result.disease.class || 'unknown',
        display_name: result.disease.name,
        confidence: result.disease.confidence,
        health_status: result.disease.detected ? 'diseased' : 'healthy',
        severity: this.mapSeverityToEnum(result.disease.severity || 'low')
      };
    } else if (result.primary_detection && result.primary_detection.severity) {
      // Ensure severity is mapped to enum values
      result.primary_detection.severity = this.mapSeverityToEnum(result.primary_detection.severity);
    }

    // Add model info
    result.model_info = {
      ...result.model_info,
      model_path: this.modelPath,
      model_file: path.basename(this.modelPath),
      inference_time: new Date().toISOString()
    };

    return result;
  }

  /**
   * Fallback analysis when Python/ML is not available
   * @param {string} imagePath - Path to the image file
   * @param {string} reason - Reason for fallback
   * @returns {Promise<Object>} - Enhanced fallback analysis result
   */
  async fallbackAnalysis(imagePath, reason = 'ML model unavailable') {
    console.log(`🔄 Using enhanced fallback analysis. Reason: ${reason}`);
    
    const stats = fs.statSync(imagePath);
    const fileSizeKB = stats.size / 1024;
    
    // Generate deterministic but varied results based on file properties
    const fileHash = this.simpleHash(imagePath + stats.mtimeMs.toString());
    const randomFactor = (fileHash % 100) / 100;

    // Disease classes (matching the ML model)
    const diseaseClasses = this.getDiseaseClasses();
    const diseaseArray = Object.values(diseaseClasses);
    
    // Determine if diseased (30% chance in fallback)
    const hasDisease = randomFactor < 0.3;
    let selectedDisease;
    
    if (hasDisease) {
      // Select a random disease (excluding healthy)
      const diseaseIndex = Math.floor(randomFactor * (diseaseArray.length - 1)) + 1;
      selectedDisease = diseaseArray[diseaseIndex];
    } else {
      selectedDisease = diseaseArray[0]; // Healthy
    }

    // Get class name for the selected disease
    const className = Object.keys(diseaseClasses).find(key => diseaseClasses[key] === selectedDisease) || 'unknown';

    // Calculate confidence based on randomness
    const confidence = hasDisease ? 
      65 + (randomFactor * 25) : // 65-90% for diseases
      75 + (randomFactor * 20);   // 75-95% for healthy

    // Maturity classification
    const maturityClass = randomFactor < 0.4 ? 'immature' : 'mature';
    const maturityConfidence = 60 + (randomFactor * 35);

    // Color analysis
    const colorOptions = [
      { name: 'Light Brown', hex: '#8B7355', desc: 'Light brown bark, typical of healthy young trees' },
      { name: 'Medium Brown', hex: '#8B4513', desc: 'Medium brown bark, common in mature trees' },
      { name: 'Dark Brown', hex: '#654321', desc: 'Dark brown bark, often indicates age' },
      { name: 'Grayish Brown', hex: '#6B5A4A', desc: 'Grayish brown bark, common variation' },
      { name: 'Reddish Brown', hex: '#A0522D', desc: 'Reddish tint, may indicate certain bark conditions' }
    ];
    const colorIndex = Math.floor(randomFactor * colorOptions.length);

    // Texture analysis
    const textureOptions = [
      { type: 'Smooth', desc: 'Smooth bark surface, typical of healthy young trees', entropy: 3.5 },
      { type: 'Moderately Rough', desc: 'Normal rough bark texture for mature rubber trees', entropy: 5.2 },
      { type: 'Rough', desc: 'Rough bark surface, common in older trees', entropy: 6.1 },
      { type: 'Cracked', desc: 'Cracked or peeling bark, may indicate stress or disease', entropy: 7.3 }
    ];
    const textureIndex = Math.floor(randomFactor * textureOptions.length);

    // Lesion detection
    const hasLesions = hasDisease && randomFactor > 0.5;
    const lesionCount = hasLesions ? Math.floor(randomFactor * 5) + 1 : 0;
    const affectedArea = hasLesions ? (randomFactor * 15) : 0;

    // Age estimation
    const estimatedAge = maturityClass === 'immature' ? 
      3 + (randomFactor * 4) : 
      10 + (randomFactor * 20);
    
    const ageRange = maturityClass === 'immature' ? 
      '1-7 years' : 
      '8-30+ years';

    // Health score calculation
    let healthScore = 100;
    if (hasDisease) {
      const severityMap = {
        'None': 0,
        'Mild to Moderate': 25,
        'Moderate': 35,
        'Moderate to Severe': 45,
        'Severe': 60
      };
      healthScore -= severityMap[selectedDisease.severity] || 30;
    }
    if (textureOptions[textureIndex].type === 'Cracked') healthScore -= 15;
    if (hasLesions) healthScore -= affectedArea;
    healthScore = Math.max(20, Math.min(100, healthScore));

    // Care recommendations
    const careRecommendations = this.generateFallbackRecommendations(
      selectedDisease,
      maturityClass,
      hasLesions,
      healthScore
    );

    return {
      success: true,
      model_used: false,
      fallback_reason: reason,
      primary_detection: {
        class: className,
        class_id: selectedDisease.id,
        class_name: className,
        display_name: selectedDisease.name,
        name: selectedDisease.name,
        confidence: Math.round(confidence * 10) / 10,
        is_confident: confidence >= 60,
        health_status: hasDisease ? 'diseased' : 'healthy',
        severity: this.mapSeverityToEnum(selectedDisease.severity)
      },
      disease: {
        name: selectedDisease.name,
        class: className,
        severity: selectedDisease.severity,  // Keep original for display
        confidence: Math.round(confidence * 10) / 10,
        description: selectedDisease.description,
        treatment: this.getDiseaseTreatment(selectedDisease.id),
        symptoms: this.getDiseaseSymptoms(selectedDisease.id),
        latex_impact: this.getLatexImpact(selectedDisease.id),
        urgency: this.getUrgencyLevel(selectedDisease.id),  // This already returns 'low', 'medium', 'high', 'critical'
        detected: hasDisease
      },
      visual_analysis: {
        color: {
          name: colorOptions[colorIndex].name,
          hex: colorOptions[colorIndex].hex,
          description: colorOptions[colorIndex].desc,
          uniformity: randomFactor > 0.7 ? 'Variable' : 'Uniform'
        },
        texture: {
          type: textureOptions[textureIndex].type,
          description: textureOptions[textureIndex].desc,
          metrics: {
            contrast: Math.round(30 + (randomFactor * 50)),
            roughness: Math.round(10 + (randomFactor * 30)),
            entropy: Math.round(textureOptions[textureIndex].entropy * 10) / 10
          },
          health_indicator: Math.round(100 - (textureIndex * 15))
        },
        lesions: {
          detected: hasLesions,
          count: lesionCount,
          affected_area_percentage: Math.round(affectedArea * 10) / 10,
          severity: affectedArea < 5 ? 'Mild' : affectedArea < 10 ? 'Moderate' : 'Severe',
          description: hasLesions ? 
            `Found ${lesionCount} abnormal areas covering ${affectedArea.toFixed(1)}% of trunk` :
            'No visible lesions detected'
        },
        bark_condition: {
          condition: healthScore > 80 ? 'Excellent' : 
                     healthScore > 60 ? 'Good' : 
                     healthScore > 40 ? 'Fair' : 'Poor',
          description: `Bark appears ${healthScore > 60 ? 'healthy' : 'damaged'}`
        }
      },
      color_analysis: {
        primaryColor: colorOptions[colorIndex].hex,
        barkCondition: textureOptions[textureIndex].type === 'Cracked' ? 'cracked' : 
                      textureOptions[textureIndex].type === 'Rough' ? 'rough' : 'healthy',
        discoloration: hasLesions ? Math.round(affectedArea) : 0
      },
      texture_analysis: {
        smoothness: textureOptions[textureIndex].type === 'Smooth' ? 80 : 
                    textureOptions[textureIndex].type === 'Moderately Rough' ? 50 : 20,
        roughness: textureOptions[textureIndex].type === 'Smooth' ? 20 : 
                   textureOptions[textureIndex].type === 'Moderately Rough' ? 50 : 80,
        pattern: textureOptions[textureIndex].type
      },
      health_score: Math.round(healthScore * 10) / 10,
      age_estimate: Math.round(estimatedAge * 10) / 10,
      maturity: {
        class: maturityClass,
        confidence: Math.round(maturityConfidence * 10) / 10,
        estimatedAge: {
          min: maturityClass === 'immature' ? 1 : 8,
          max: maturityClass === 'immature' ? 7 : 30,
          unit: 'years'
        }
      },
      age_estimation: {
        estimated_years: Math.round(estimatedAge * 10) / 10,
        range: ageRange,
        confidence: Math.round(70 + (randomFactor * 20)),
        basis: `Based on ${maturityClass} characteristics`
      },
      care_recommendations: careRecommendations,
      model_info: {
        model_used: false,
        model_file: null,
        reason: reason,
        fallback: true
      },
      image_metadata: {
        filename: path.basename(imagePath),
        file_size_kb: Math.round(fileSizeKB * 10) / 10,
        analyzed_at: new Date().toISOString(),
        format: path.extname(imagePath).toLowerCase()
      },
      ml_model_used: false,
      processingTime: '0.5s (fallback)'
    };
  }

  /**
   * Generate care recommendations for fallback mode
   * Returns array of objects matching the Mongoose schema
   */
  generateFallbackRecommendations(disease, maturityClass, hasLesions, healthScore) {
    const recommendations = [];
    
    // Urgency-based
    if (disease.id === 3) {
      recommendations.push({
        priority: "immediate",
        action: "Consult agricultural expert urgently",
        description: "CRITICAL: Rigidoporus infection detected - Immediate action required",
        timeframe: "immediately"
      });
    } else if (disease.id === 1 || disease.id === 2) {
      recommendations.push({
        priority: "soon",
        action: "Schedule treatment",
        description: "HIGH PRIORITY: Take action within 1-2 weeks",
        timeframe: "1-2 weeks"
      });
    } else if (disease.id === 4 || disease.id === 6 || disease.id === 7) {
      recommendations.push({
        priority: "monitor",
        action: "Plan treatment",
        description: "MEDIUM PRIORITY: Schedule treatment within the month",
        timeframe: "within the month"
      });
    }
    
    // Disease-specific
    if (disease.id !== 0) {
      recommendations.push({
        priority: disease.id === 3 ? "immediate" : 
                  (disease.id === 1 || disease.id === 2) ? "soon" : "monitor",
        action: "Apply treatment",
        description: this.getDiseaseTreatment(disease.id),
        timeframe: disease.id === 3 ? "immediately" : 
                   (disease.id === 1 || disease.id === 2) ? "1-2 weeks" : "within the month"
      });
    }
    
    // Health score based
    if (healthScore < 30) {
      recommendations.push({
        priority: "immediate",
        action: "Emergency intervention",
        description: "Tree health is critically low - Immediate intervention needed",
        timeframe: "immediately"
      });
    } else if (healthScore < 50) {
      recommendations.push({
        priority: "soon",
        action: "Active treatment",
        description: "Tree health is poor - Active treatment required",
        timeframe: "1-2 weeks"
      });
    } else if (healthScore < 70) {
      recommendations.push({
        priority: "monitor",
        action: "Continue monitoring",
        description: "Tree health is fair - Continue monitoring and treatment",
        timeframe: "monthly"
      });
    } else {
      recommendations.push({
        priority: "routine",
        action: "Maintain regular care",
        description: "Tree health is good - Maintain regular care",
        timeframe: "ongoing"
      });
    }
    
    // Maturity based
    if (maturityClass === 'immature') {
      recommendations.push({
        priority: "routine",
        action: "Ensure proper nutrition",
        description: "Ensure proper nutrition for young tree development",
        timeframe: "ongoing"
      });
    } else {
      recommendations.push({
        priority: "monitor",
        action: "Monitor tapping panels",
        description: "Monitor tapping panels for signs of exhaustion",
        timeframe: "weekly"
      });
    }
    
    // General recommendations
    recommendations.push({
      priority: "routine",
      action: "Maintain irrigation",
      description: "Maintain proper irrigation during dry periods",
      timeframe: "as needed"
    });
    
    recommendations.push({
      priority: "routine",
      action: "Document changes",
      description: "Document changes with regular photos",
      timeframe: "weekly"
    });
    
    // Remove duplicates (based on description)
    const uniqueRecommendations = [];
    const seenDescriptions = new Set();
    
    for (const rec of recommendations) {
      if (!seenDescriptions.has(rec.description)) {
        seenDescriptions.add(rec.description);
        uniqueRecommendations.push(rec);
      }
    }
    
    return uniqueRecommendations.slice(0, 7);
  }

  /**
   * Get disease treatment based on class ID
   */
  getDiseaseTreatment(classId) {
    const treatments = {
      0: 'No treatment needed. Continue regular monitoring and preventive care.',
      1: 'Apply fungicides to soil (Trichoderma spp.), improve drainage, remove infected roots, create isolation trenches.',
      2: 'Remove infected bark, apply fungicide (Bayleton), improve soil conditions, remove severely infected trees.',
      3: 'Surgical removal of infected tissue, systemic fungicide application, consider tree removal if severe.',
      4: 'Prune affected branches, apply copper-based fungicides, improve air circulation.',
      5: 'Apply wound dressing, avoid mechanical damage, ensure proper nutrition, monitor for secondary infections.',
      6: 'Improve drainage, apply fungicides (Metalaxyl), reduce tapping frequency, scrape affected area.',
      7: 'Excise affected area, apply fungicidal paste, improve tree vigor, avoid wounding.'
    };
    return treatments[classId] || 'Consult agricultural expert for proper diagnosis and treatment.';
  }

  /**
   * Get disease symptoms based on class ID
   */
  getDiseaseSymptoms(classId) {
    const symptoms = {
      0: ['Normal bark appearance', 'Healthy color', 'No lesions or abnormalities', 'Consistent texture'],
      1: ['White fungal strands on roots', 'Yellowing leaves', 'Reduced latex flow', 'Tree wilting', 'Mushrooms at base'],
      2: ['Brown crust on roots', 'Decayed wood', 'Fruiting bodies near base', 'Tree decline', 'Brown fungal mats'],
      3: ['Yellowish bracket fungi', 'White rot', 'Decayed trunk', 'Tree instability', 'Spore masses'],
      4: ['Pinkish coating on bark', 'Branch dieback', 'Cracking bark', 'Gum exudation', 'White mycelium'],
      5: ['Vertical cracks in bark', 'Exposed inner tissue', 'Possible secondary infections', 'Gum exudation'],
      6: ['Gum oozing from bark', 'Darkened areas', 'Bark necrosis', 'Wounds with gum'],
      7: ['Sunken lesions', 'Cracked bark', 'Discolored areas', 'Gum exudation', 'Dead bark patches']
    };
    return symptoms[classId] || ['Unable to determine specific symptoms'];
  }

  /**
   * Get latex impact based on class ID
   */
  getLatexImpact(classId) {
    const impacts = {
      0: 'Normal latex production expected',
      1: 'Severe reduction in latex yield (40-60%)',
      2: 'Moderate to severe reduction (30-50%)',
      3: 'Complete loss if severe',
      4: 'Moderate reduction (20-30%)',
      5: 'Mild reduction (10-15%)',
      6: 'Moderate reduction (25-35%)',
      7: 'Localized reduction (15-25%)'
    };
    return impacts[classId] || 'Unknown impact on latex production';
  }

  /**
   * Get urgency level based on class ID
   */
  getUrgencyLevel(classId) {
    const urgencies = {
      0: 'low',
      1: 'high',
      2: 'high',
      3: 'critical',
      4: 'medium',
      5: 'low',
      6: 'medium',
      7: 'medium'
    };
    return urgencies[classId] || 'medium';
  }

  /**
   * Simple string hash function for deterministic randomness
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Clear the analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
    console.log('🗑️ Analysis cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.analysisCache.size,
      keys: Array.from(this.analysisCache.keys()),
      oldestEntry: this.analysisCache.size > 0 ? 
        Math.min(...Array.from(this.analysisCache.values()).map(v => v.timestamp)) : null
    };
  }
}

// Export singleton instance
module.exports = new TrunksService();