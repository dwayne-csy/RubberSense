const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Trunks Detection Service
 * This service handles communication between Node.js and Python ML inference
 * for rubber tree trunk analysis using the trained trunks model
 * Updated to work with enhanced ML model output and strict ML-only flow
 */

class TrunksService {
  constructor() {
    // Update paths to match RubberSense structure
    this.projectRoot = path.join(__dirname, '..');
    this.pythonScript = path.join(__dirname, '..', 'ML-models', 'trunks_inference.py');
    this.modelPath = this.resolveModelPath();
    this.isPythonAvailable = null;
    this.pythonCmd = this.resolvePythonCommand();
    this.lastPackageCheckDetails = null;
    this.lastKnownModelClasses = null;
    
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
   * Resolve trunk model path, preferring Trunks-v2.pt.
   */
  resolveModelPath() {
    const candidates = ['Trunks-v2.pt', 'Trunks.pt'];
    for (const file of candidates) {
      const fullPath = path.join(this.projectRoot, 'ML-models', file);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    // Keep predictable default even if file is missing.
    return path.join(this.projectRoot, 'ML-models', 'Trunks-v2.pt');
  }

  /**
   * Resolve Python command, preferring the project virtual environment.
   */
  resolvePythonCommand() {
    const candidates = process.platform === 'win32'
      ? [
          path.join(this.projectRoot, 'venv', 'Scripts', 'python.exe'),
          'python'
        ]
      : [
          path.join(this.projectRoot, 'venv', 'bin', 'python'),
          'python3',
          'python'
        ];

    for (const candidate of candidates) {
      if (!path.isAbsolute(candidate) || fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return process.platform === 'win32' ? 'python' : 'python3';
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
      const proc = spawn(this.pythonCmd, ['--version'], { shell: false });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (error) => {
        console.warn(`⚠️ Python check failed for "${this.pythonCmd}": ${error.message}`);
        this.isPythonAvailable = false;
        resolve(false);
      });

      proc.on('close', (code) => {
        this.isPythonAvailable = code === 0;
        if (this.isPythonAvailable) {
          const version = (stdout || stderr).trim();
          console.log(`✅ Python is available: ${version} (${this.pythonCmd})`);
        } else {
          console.warn(`⚠️ Python is not available: ${this.pythonCmd}`);
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
      const requiredModules = ['ultralytics', 'torch', 'cv2', 'numpy'];
      const proc = spawn(this.pythonCmd, [
        '-c',
        'import ultralytics, torch, cv2, numpy'
      ], { shell: false });

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        const success = code === 0;
        if (success) {
          this.lastPackageCheckDetails = null;
          console.log(`✅ Required Python packages are installed (${this.pythonCmd})`);
        } else {
          const missing = [];
          const moduleRegex = /No module named ['"]([^'"]+)['"]/gi;
          let match;
          while ((match = moduleRegex.exec(stderr)) !== null) {
            missing.push(match[1]);
          }
          const uniqueMissing = [...new Set(missing)];
          this.lastPackageCheckDetails = {
            requiredModules,
            missing: uniqueMissing,
            stderr: stderr.trim()
          };
          const missingText = uniqueMissing.length > 0 ? uniqueMissing.join(', ') : 'unknown';
          console.warn(`⚠️ Some Python packages are missing (${this.pythonCmd}): ${missingText}`);
          if (stderr.trim()) {
            console.warn(`⚠️ Python package check stderr: ${stderr.trim()}`);
          }
        }
        resolve(success);
      });

      proc.on('error', (error) => {
        this.lastPackageCheckDetails = {
          missing: [],
          stderr: error.message
        };
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
      'None': 'none',
      'none': 'none',
      'healthy': 'none',
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
    if (['none', 'low', 'medium', 'high', 'critical'].includes(normalizedSeverity)) {
      return normalizedSeverity;
    }
    
    // Try to map from the severityMap
    for (const [key, value] of Object.entries(severityMap)) {
      if (key.toLowerCase() === normalizedSeverity) {
        return value;
      }
    }
    
    return 'low'; // Default fallback
  }

  normalizeClassLabel(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');
  }

  isDiseaseClass(className) {
    const label = this.normalizeClassLabel(className);
    if (!label) return false;
    const healthyKeywords = ['healthy', 'normal', 'rubber tree', 'rubber root', 'rubber leaf', 'rubber leaves'];
    if (healthyKeywords.some((k) => label.includes(k))) return false;
    const diseaseKeywords = ['disease', 'rot', 'mildew', 'mold', 'canker', 'blight', 'pustule', 'fishbone', 'black line', 'dry crust'];
    return diseaseKeywords.some((k) => label.includes(k));
  }

  inferSeverityFromClass(className) {
    const label = this.normalizeClassLabel(className);
    if (!this.isDiseaseClass(label)) return 'none';
    if (['white root', 'brown root', 'black line', 'rot'].some((k) => label.includes(k))) return 'high';
    if (['mildew', 'mold', 'fishbone', 'dry crust', 'pustule'].some((k) => label.includes(k))) return 'medium';
    return 'low';
  }

  formatClassName(className) {
    return String(className || 'unknown')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  inferMaturity(result) {
    const existing = result?.maturity && typeof result.maturity === 'object' ? result.maturity : null;
    const existingClass = String(existing?.class || '').trim().toLowerCase();

    if (existingClass === 'mature' || existingClass === 'immature') {
      return {
        class: existingClass,
        confidence: Number(existing?.confidence || 85),
        source: 'model'
      };
    }

    const estimatedYears = Number(
      result?.age_estimation?.estimated_years ??
      result?.age_estimate
    );
    if (Number.isFinite(estimatedYears) && estimatedYears > 0) {
      return {
        class: estimatedYears >= 6 ? 'mature' : 'immature',
        confidence: 68,
        source: 'age_estimation'
      };
    }

    const textureType = String(
      result?.visual_analysis?.texture?.type ||
      result?.texture_analysis?.type ||
      ''
    ).toLowerCase();
    if (textureType.includes('rough')) {
      return {
        class: 'mature',
        confidence: 56,
        source: 'texture'
      };
    }
    if (textureType.includes('smooth')) {
      return {
        class: 'immature',
        confidence: 56,
        source: 'texture'
      };
    }

    return {
      class: 'unknown',
      confidence: 0,
      source: 'insufficient_data'
    };
  }

  /**
   * Get all available disease classes from the model
   */
  getDiseaseClasses() {
    const classes = this.lastKnownModelClasses;
    if (!classes || typeof classes !== 'object') {
      return {};
    }

    const entries = Object.entries(classes).sort((a, b) => Number(a[0]) - Number(b[0]));
    const output = {};

    for (const [idRaw, classNameRaw] of entries) {
      const className = String(classNameRaw || '').trim();
      if (!className) continue;
      const id = Number.isFinite(Number(idRaw)) ? Number(idRaw) : -1;
      const slug = this.normalizeClassLabel(className).replace(/\s+/g, '_');
      const diseased = this.isDiseaseClass(className);
      output[slug] = {
        id,
        name: this.formatClassName(className),
        severity: this.inferSeverityFromClass(className),
        description: diseased
          ? `Model class: ${this.formatClassName(className)}`
          : `Model class interpreted as non-disease: ${this.formatClassName(className)}`
      };
    }

    return output;
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

    // ML-only mode: fail fast if requirements are missing
    if (!pythonAvailable || !modelAvailable || !packagesAvailable) {
      const reasons = [];
      if (!pythonAvailable) reasons.push('Python not available');
      if (!modelAvailable) reasons.push('Model not found');
      if (!packagesAvailable) {
        const missingPkgs = this.lastPackageCheckDetails?.missing?.length
          ? `: ${this.lastPackageCheckDetails.missing.join(', ')}`
          : '';
        reasons.push(`Packages missing${missingPkgs}`);
      }
      throw new Error(`Trunk ML analysis unavailable: ${reasons.join(', ')}`);
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
        shell: false,
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1'  // Ensure real-time output
        }
      });

      let stdout = '';
      let stderr = '';

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
        reject(new Error(`Failed to run ${path.basename(this.modelPath)} inference: ${error.message}`));
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
          
          reject(new Error(`${path.basename(this.modelPath)} inference script failed (code ${code})`));
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
          
          reject(new Error(`Invalid JSON output from ${path.basename(this.modelPath)} inference`));
          return;
        }

        if (jsonOutput.success === false) {
          console.error('❌ ML inference returned error:', jsonOutput.error);
          if (jsonOutput.traceback) {
            console.error('📋 Traceback:', jsonOutput.traceback);
          }
          
          reject(new Error(jsonOutput.error || `${path.basename(this.modelPath)} inference failed`));
          return;
        }

        const returnedFallback =
          jsonOutput.model_used === false ||
          jsonOutput.ml_model_used === false ||
          jsonOutput.is_heuristic === true ||
          jsonOutput.fallback === true ||
          jsonOutput.fallback_reason;
        if (returnedFallback) {
          reject(new Error('Trunks inference returned non-ML fallback output'));
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

    // Normalize optional model extras (some models provide only detection outputs).
    if (!result.visual_analysis || typeof result.visual_analysis !== 'object') {
      result.visual_analysis = {};
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

    // Ensure required aliases exist for downstream DB schema compatibility.
    if (!result.primary_detection || typeof result.primary_detection !== 'object') {
      result.primary_detection = {};
    }
    result.primary_detection.class =
      result.primary_detection.class ||
      result.primary_detection.class_name ||
      'unknown';
    result.primary_detection.class_name =
      result.primary_detection.class_name ||
      result.primary_detection.class;
    result.primary_detection.display_name =
      result.primary_detection.display_name ||
      result.primary_detection.class_name ||
      'Unknown';
    if (typeof result.primary_detection.confidence !== 'number') {
      result.primary_detection.confidence = Number(result.primary_detection.confidence || 0);
    }

    // Ensure disease status comes from model detection.
    const detected = String(result.primary_detection?.health_status || '').toLowerCase() === 'diseased';
    if (!result.disease || typeof result.disease !== 'object') {
      result.disease = {};
    }
    result.disease.detected = detected;
    result.disease.class = result.primary_detection?.class_name || result.primary_detection?.class || 'unknown';
    result.disease.name = result.primary_detection?.display_name || result.disease.name || 'Unknown';
    result.disease.confidence = Number(result.primary_detection?.confidence || result.disease.confidence || 0);
    result.disease.severity = this.mapSeverityToEnum(
      result.disease.severity || result.primary_detection?.severity || (detected ? 'medium' : 'none')
    );

    // Normalize age estimate alias only if model provides an age output.
    result.age_estimate =
      (result.age_estimation && typeof result.age_estimation.estimated_years === 'number')
        ? Number(result.age_estimation.estimated_years)
        : null;

    const inferredMaturity = this.inferMaturity(result);
    const existingMaturity = result.maturity && typeof result.maturity === 'object'
      ? result.maturity
      : {};
    const existingMaturityConfidence = Number(existingMaturity.confidence);

    result.maturity = {
      ...existingMaturity,
      class: inferredMaturity.class,
      confidence:
        Number.isFinite(existingMaturityConfidence) && existingMaturityConfidence > 0
          ? existingMaturityConfidence
          : inferredMaturity.confidence
    };
    if (!result.maturity.source && inferredMaturity.source !== 'model') {
      result.maturity.source = inferredMaturity.source;
    }

    // Map texture section for downstream consumers only when provided.
    if (!result.texture_analysis) {
      result.texture_analysis = result.visual_analysis.texture || {};
    }

    if (!result.color_analysis) {
      result.color_analysis = result.visual_analysis.color || {};
    }

    // Add model info
    result.model_info = {
      ...result.model_info,
      model_used: result.model_used !== false,
      fallback: false,
      reason: null,
      model_path: this.modelPath,
      model_file: path.basename(this.modelPath),
      inference_time: new Date().toISOString()
    };

    if (result.model_info?.classes && typeof result.model_info.classes === 'object') {
      this.lastKnownModelClasses = result.model_info.classes;
    }

    return result;
  }

  /**
   * Fallback analysis when Python/ML is not available
   * @param {string} imagePath - Path to the image file
   * @param {string} reason - Reason for fallback
   * @returns {Promise<Object>} - Enhanced fallback analysis result
   */
  async fallbackAnalysis(imagePath, reason = 'ML model unavailable') {
    throw new Error(`Mock trunk fallback is disabled: ${reason}`);
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
        Math.min(...Array.from(this.analysisCache.values()).map(v => v.timestamp)) : null,
      pythonCommand: this.pythonCmd,
      lastPackageCheckDetails: this.lastPackageCheckDetails
    };
  }
}

// Export singleton instance
module.exports = new TrunksService();
