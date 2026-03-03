const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

/**
 * Latex Detection Service
 * This service handles communication between Node.js and Python ML inference
 * for latex quality analysis using the trained Latex-v2.pt model
 * Integrated with enhanced Python inference script
 */

class LatexService {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.pythonScript = path.join(__dirname, '..', 'ML-models', 'latex_inference.py');
    this.modelPath = this.resolveModelPath();
    this.isPythonAvailable = null;
    this.pythonVersion = null;
    this.pythonCmd = this.resolvePythonCommand();
    this.fallbackReason = null;
    this.lastPackageCheckDetails = null;
    
    // Log paths for debugging
    this._logInitialization();
  }

  /**
   * Resolve Python command, preferring project virtual environment.
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
   * Resolve latex model path, preferring Latex-v2.pt.
   */
  resolveModelPath() {
    const candidates = ['Latex-v2.pt', 'Latex.pt'];
    for (const file of candidates) {
      const fullPath = path.join(this.projectRoot, 'ML-models', file);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    // Keep predictable default even if file is missing.
    return path.join(this.projectRoot, 'ML-models', 'Latex-v2.pt');
  }

  getActiveModelName() {
    this.modelPath = this.resolveModelPath();
    return path.basename(this.modelPath || 'Latex-v2.pt');
  }

  /**
   * Log initialization details
   * @private
   */
  _logInitialization() {
    console.log('🔧 LatexService initialized with:');
    console.log(`  📁 Python script: ${this.pythonScript}`);
    console.log(`  📁 Model path: ${this.modelPath}`);
    console.log(`  🐍 Python command: ${this.pythonCmd}`);
    console.log(`  💻 Platform: ${process.platform}`);
    
    // Check if script exists
    const scriptExists = fs.existsSync(this.pythonScript);
    console.log(`  📄 Script exists: ${scriptExists}`);
    
    // Check if model exists
    const modelExists = fs.existsSync(this.modelPath);
    console.log(`  🎯 Model exists: ${modelExists}`);
    
    if (!scriptExists) {
      console.warn(`⚠️ Warning: Python script not found at: ${this.pythonScript}`);
    }
    
    if (!modelExists) {
      console.warn(`⚠️ Warning: Trained model not found at: ${this.modelPath}`);
      this.fallbackReason = 'Trained model not found';
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
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', () => {
        this.isPythonAvailable = false;
        this.fallbackReason = 'Python not available';
        resolve(false);
      });

      proc.on('close', (code) => {
        this.isPythonAvailable = code === 0;
        if (this.isPythonAvailable) {
          this.pythonVersion = output.trim();
          console.log(`✅ Python available: ${this.pythonVersion}`);
        } else {
          this.fallbackReason = 'Python check failed';
        }
        resolve(this.isPythonAvailable);
      });
    });
  }

  /**
   * Get Python version
   */
  async getPythonVersion() {
    if (this.pythonVersion) return this.pythonVersion;
    
    return new Promise((resolve) => {
      const proc = spawn(this.pythonCmd, ['--version'], { shell: false });
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', () => {
        this.pythonVersion = output.trim() || 'Unknown';
        resolve(this.pythonVersion);
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
        const available = code === 0;
        if (available) {
          this.lastPackageCheckDetails = null;
          console.log(`✅ Required Python packages are installed (${this.pythonCmd})`);
          resolve(true);
          return;
        }

        const missing = [];
        const moduleRegex = /No module named ['"]([^'"]+)['"]/gi;
        let match;
        while ((match = moduleRegex.exec(stderr)) !== null) {
          missing.push(match[1]);
        }
        const uniqueMissing = [...new Set(missing)];
        const missingText = uniqueMissing.length ? uniqueMissing.join(', ') : 'unknown';

        this.lastPackageCheckDetails = {
          requiredModules,
          missing: uniqueMissing,
          stderr: stderr.trim()
        };
        this.fallbackReason = `Required Python packages missing: ${missingText}`;
        console.warn(`⚠️ Latex Python packages missing (${this.pythonCmd}): ${missingText}`);
        resolve(available);
      });

      proc.on('error', (error) => {
        this.lastPackageCheckDetails = {
          requiredModules,
          missing: [],
          stderr: error.message
        };
        this.fallbackReason = `Required Python packages missing: ${error.message}`;
        resolve(false);
      });
    });
  }

  /**
   * Check if the trained model exists
   */
  checkModelAvailability() {
    this.modelPath = this.resolveModelPath();
    const exists = fs.existsSync(this.modelPath);
    console.log(`Model ${this.modelPath} exists: ${exists}`);
    return exists;
  }

  /**
   * Get model file details
   */
  getModelInfo() {
    try {
      this.modelPath = this.resolveModelPath();
      if (!fs.existsSync(this.modelPath)) {
        return {
          exists: false,
          error: 'Model file not found',
          path: this.modelPath,
          modelFile: path.basename(this.modelPath || 'Latex-v2.pt')
        };
      }
      
      const stats = fs.statSync(this.modelPath);
      return {
        exists: true,
        path: this.modelPath,
        modelFile: path.basename(this.modelPath),
        sizeKB: Math.round(stats.size / 1024),
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        modifiedAt: stats.mtime.toISOString(),
        createdAt: stats.birthtime.toISOString()
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Get detailed model information from Python
   */
  async getModelDetails() {
    this.modelPath = this.resolveModelPath();
    if (!fs.existsSync(this.pythonScript) || !fs.existsSync(this.modelPath)) {
      return { error: 'Model or script not found' };
    }

    return new Promise((resolve) => {
      const args = [this.pythonScript, '--info', '--model', this.modelPath];
      const proc = spawn(this.pythonCmd, args, { shell: false });
      
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          resolve({ error: 'Failed to get model details', stderr });
          return;
        }

        try {
          // Try to parse JSON from output
          const lines = stdout.trim().split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const jsonOutput = JSON.parse(lines[i]);
              if (jsonOutput.model_info) {
                resolve(jsonOutput.model_info);
                return;
              }
            } catch (e) {
              // Not JSON, continue
            }
          }
          resolve({ error: 'No valid model info found' });
        } catch (e) {
          resolve({ error: 'Failed to parse model info' });
        }
      });
    });
  }

  /**
   * Get fallback reason
   */
  getFallbackReason() {
    return this.fallbackReason || 'Unknown reason';
  }

  /**
   * Run ML inference on an image using the trained Latex model
   * @param {string} imagePath - Path to the image file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Analysis result from the ML model
   */
  async analyzeLatex(imagePath, options = {}) {
    const startTime = Date.now();
    const {
      region = 'global_avg',
      returnVisualization = true,
      timeout = 30000 // 30 second timeout
    } = options;

    // Validate image path
    if (!imagePath || !fs.existsSync(imagePath)) {
      throw new Error('Image file not found');
    }

    // Resolve active model path before any checks.
    this.modelPath = this.resolveModelPath();

    // Get image file info
    const imageStats = fs.statSync(imagePath);
    const imageInfo = {
      filename: path.basename(imagePath),
      sizeKB: Math.round(imageStats.size / 1024 * 10) / 10,
      modifiedAt: imageStats.mtime.toISOString()
    };

    console.log(`\n📸 Analyzing latex image: ${imagePath}`);
    console.log(`📊 Image info:`, imageInfo);
    console.log(`🌍 Region: ${region}`);

    // Check if Python is available
    const pythonAvailable = await this.checkPythonAvailability();
    
    if (!pythonAvailable) {
      this.fallbackReason = 'Python not available';
      throw new Error('Latex ML analysis unavailable: Python not available');
    }

    // Check if required packages are installed
    const packagesAvailable = await this.checkPythonPackages();
    if (!packagesAvailable) {
      const missing = this.lastPackageCheckDetails?.missing?.length
        ? ` (${this.lastPackageCheckDetails.missing.join(', ')})`
        : '';
      throw new Error(`Latex ML analysis unavailable: Required Python packages missing${missing}`);
    }

    // Check if the Python script exists
    if (!fs.existsSync(this.pythonScript)) {
      this.fallbackReason = 'Inference script not found';
      throw new Error('Latex ML analysis unavailable: Inference script not found');
    }

    // Check if the trained model exists
    const modelInfo = this.getModelInfo();
    if (!modelInfo.exists) {
      this.fallbackReason = 'Trained model not found';
      throw new Error('Latex ML analysis unavailable: Trained model not found');
    }

    console.log(`✅ Using trained model: ${this.modelPath} (${modelInfo.sizeKB} KB)`);

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        proc.kill();
        reject(new Error('ML inference timeout exceeded'));
      }, timeout);

      // Arguments for the Python script
      const args = [
        this.pythonScript,
        imagePath,
        '--model', this.modelPath,
        '--region', region
      ];
      
      if (returnVisualization) {
        args.push('--visualize');
      }
      
      console.log(`🚀 Running ML inference: ${this.pythonCmd} ${args.join(' ')}`);
      
      const proc = spawn(this.pythonCmd, args, {
        shell: false,
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1'
        }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        const errorMsg = data.toString().trim();
        if (errorMsg) {
          console.log(`🐍 Python stderr: ${errorMsg}`);
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Python process error:', error);
        reject(new Error(`Failed to run ${path.basename(this.modelPath || 'Latex-v2.pt')} inference: ${error.message}`));
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code !== 0) {
          console.error(`❌ Python script exited with code ${code}`);
          if (stderr) {
            console.error('Error details:', stderr);
          }
          
          // Try to parse any error output
          try {
            const lines = stderr.trim().split('\n');
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i];
              if (line.startsWith('{') && line.endsWith('}')) {
                const errorResult = JSON.parse(line);
                if (errorResult.error) {
                  console.error('ML Error:', errorResult.error);
                }
                break;
              }
            }
          } catch (e) {
            // Not JSON output
          }
          
          reject(new Error(`${path.basename(this.modelPath || 'Latex-v2.pt')} inference script failed (code ${code})`));
          return;
        }

        // Find the JSON output in stdout (last line should be JSON)
        const lines = stdout.trim().split('\n');
        let jsonOutput = null;
        
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            jsonOutput = JSON.parse(lines[i]);
            break;
          } catch (e) {
            // Not JSON, continue
          }
        }

        if (!jsonOutput) {
          console.error('❌ No valid JSON output found in stdout');
          console.error('Stdout preview:', stdout.substring(0, 500));
          reject(new Error(`Invalid JSON output from ${path.basename(this.modelPath || 'Latex-v2.pt')} inference`));
          return;
        }

        if (jsonOutput.success === false) {
          console.error('❌ ML inference returned error:', jsonOutput.error);
          if (jsonOutput.traceback) {
            console.error('Traceback:', jsonOutput.traceback);
          }
          
          reject(new Error(jsonOutput.error || `${path.basename(this.modelPath || 'Latex-v2.pt')} inference failed`));
          return;
        }

        let usedFallback = false;
        const returnedFallback =
          jsonOutput.ml_model_used === false ||
          jsonOutput.model_used === false ||
          jsonOutput.is_heuristic === true ||
          jsonOutput.fallback === true ||
          jsonOutput.fallback_reason;
        if (returnedFallback) {
          const fallbackReason =
            jsonOutput.fallback_reason ||
            jsonOutput.note ||
            (jsonOutput.is_heuristic ? 'Heuristic analysis mode' : 'Fallback output from inference');
          console.warn(`⚠️ Latex inference returned fallback output: ${fallbackReason}`);
          // Keep compatibility keys explicit so callers can branch cleanly.
          jsonOutput.ml_model_used = false;
          jsonOutput.model_used = false;
          jsonOutput.fallback_reason = fallbackReason;
          usedFallback = true;
        }

        // Add processing time
        const processingTime = Date.now() - startTime;
        jsonOutput.processingTime = `${processingTime}ms`;
        jsonOutput.processingTimeSeconds = (processingTime / 1000).toFixed(2);

        // Add model information to the result
        jsonOutput.modelInfo = {
          ...jsonOutput.modelInfo,
          modelUsed: path.basename(this.modelPath || 'Latex-v2.pt'),
          modelPath: this.modelPath,
          modelType: 'YOLO (PyTorch)',
          trained: true,
          modelSizeKB: modelInfo.sizeKB,
          modelSizeMB: modelInfo.sizeMB
        };

        // Add image metadata if not already present
        if (!jsonOutput.imageMetadata) {
          jsonOutput.imageMetadata = {
            filename: path.basename(imagePath),
            fileSizeKB: imageInfo.sizeKB,
            analyzedAt: new Date().toISOString()
          };
        }

        if (usedFallback) {
          console.warn(`⚠️ Inference completed in fallback mode in ${(processingTime / 1000).toFixed(2)}s`);
        } else {
          console.log(`✅ ML inference successful in ${(processingTime / 1000).toFixed(2)}s`);
        }
        console.log(`   Quality: ${jsonOutput.latex_analysis?.quality_class || 'Unknown'}`);
        console.log(`   Confidence: ${jsonOutput.latex_analysis?.quality_score || 0}%`);
        
        resolve(jsonOutput);
      });
    });
  }

  /**
   * Fallback analysis when Python/ML is not available
   * @param {string} imagePath - Path to the image file
   * @param {string} reason - Reason for fallback
   * @param {number} startTime - Start time for processing time calculation
   * @returns {Promise<Object>} - Analysis result
   */
  async fallbackAnalysis(imagePath, reason = 'ML model unavailable', startTime = Date.now()) {
    console.log(`⚠️ Using fallback analysis. Reason: ${reason}`);
    
    const stats = fs.statSync(imagePath);
    const fileSizeKB = stats.size / 1024;
    
    // Generate deterministic but varied results based on file properties
    const fileHash = this._simpleHash(imagePath + stats.mtimeMs.toString());
    const randomFactor = (fileHash % 100) / 100;

    // Quality score based on file properties and hash
    let qualityScore = 50 + (randomFactor * 40); // Range: 50-90
    
    // Determine quality class - FIXED to match schema enum values
    let qualityClass;
    if (qualityScore >= 80) {
      qualityClass = 'High';
    } else if (qualityScore >= 50) {
      qualityClass = 'Medium';
    } else {
      qualityClass = 'Low';
    }

    // Contamination detection
    const hasContamination = randomFactor < 0.2;
    const contaminationProb = hasContamination ? 0.6 + (randomFactor * 0.3) : 0.1 + (randomFactor * 0.2);

    // Dry rubber content
    const dryRubberContent = qualityScore * 0.4 + 20; // Range: 40-56%

    // Color analysis
    let colorName, colorHex, colorDesc, rgb;
    if (randomFactor < 0.33) {
      colorName = "Pure White Latex";
      colorHex = "#FFFFFF";
      rgb = { r: 255, g: 255, b: 255 };
      colorDesc = "Pure white latex, indicates high quality and minimal impurities";
    } else if (randomFactor < 0.66) {
      colorName = "Yellowish Latex";
      colorHex = "#FFE55C";
      rgb = { r: 255, g: 229, b: 92 };
      colorDesc = "Yellowish tint, may indicate age or slight oxidation";
    } else {
      colorName = "Latex with Water";
      colorHex = "#F0F8FF";
      rgb = { r: 240, g: 248, b: 255 };
      colorDesc = "Watery appearance, may have high water content or dilution";
    }

    // Consistency analysis
    const consistencyOptions = [
      "Smooth and uniform",
      "Slightly grainy",
      "Grainy texture",
      "Coagulated or lumpy"
    ];
    const consistency = consistencyOptions[Math.floor(randomFactor * consistencyOptions.length)];

    // Impurity detection
    const impurityCount = Math.floor(randomFactor * 15);
    const impurityPercentage = randomFactor * 8;
    let impuritySeverity = "minimal";
    if (impurityPercentage > 5) impuritySeverity = "moderate";
    if (impurityPercentage > 10) impuritySeverity = "high";

    // Quantity estimation
    const estimatedVolume = 200 + (randomFactor * 600); // 200-800 ml
    const quantityConfidence = 50 + (randomFactor * 40);

    // Product recommendations
    let recommendedProducts;
    if (qualityClass === 'High') {
      recommendedProducts = [
        { name: "Medical Gloves", type: "Medical", description: "High-grade examination gloves", drc_requirement: ">80%" },
        { name: "Surgical Tubing", type: "Medical", description: "Sterile tubing for medical devices", drc_requirement: ">85%" },
        { name: "Catheters", type: "Medical", description: "Flexible medical catheters", drc_requirement: ">82%" }
      ];
    } else if (qualityClass === 'Medium') {
      recommendedProducts = [
        { name: "Industrial Gloves", type: "Industrial", description: "Chemical-resistant work gloves", drc_requirement: "60-75%" },
        { name: "Tire Components", type: "Automotive", description: "Inner liners and sidewalls", drc_requirement: "65-80%" },
        { name: "Rubber Bands", type: "Stationery", description: "High-elasticity bands", drc_requirement: "60-70%" }
      ];
    } else {
      recommendedProducts = [
        { name: "Rubber Mats", type: "Flooring", description: "Anti-fatigue mats", drc_requirement: "40-55%" },
        { name: "Recycled Rubber Products", type: "Recycled", description: "Ground rubber applications", drc_requirement: "30-50%" },
        { name: "Asphalt Modifier", type: "Construction", description: "Rubberized asphalt", drc_requirement: "25-45%" }
      ];
    }

    if (hasContamination) {
      recommendedProducts = recommendedProducts.slice(0, 2);
    }

    // Market price
    const pricePerKg = qualityClass === 'High' ? 180 : (qualityClass === 'Medium' ? 120 : 70);
    const totalValue = (estimatedVolume / 1000) * pricePerKg;
    const trends = ['stable', 'increasing', 'decreasing'];
    const marketTrend = trends[Math.floor(randomFactor * 3)];

    // Processing time
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      processingTimeSeconds: (processingTime / 1000).toFixed(2),
      ml_model_used: false,
      fallback_reason: reason,
      latex_analysis: {
        primary_classification: {
          class: qualityClass,
          confidence: Math.round(qualityScore * 10) / 10,
          is_confident: qualityScore >= 60
        },
        quality_score: Math.round(qualityScore * 10) / 10,
        quality_class: qualityClass,
        contamination: {
          detected: hasContamination,
          probability: Math.round(contaminationProb * 100 * 10) / 10,
          type: hasContamination ? (randomFactor < 0.5 ? 'impurities' : 'excess_water') : 'none'
        },
        dry_rubber_content: Math.round(dryRubberContent * 10) / 10,
        drc_category: dryRubberContent >= 65 ? 'Good' : (dryRubberContent >= 45 ? 'Average' : 'Below Average'),
        color_analysis: {
          name: colorName,
          hex: colorHex,
          rgb: rgb,
          description: colorDesc,
          quality_indicator: qualityClass === 'High' ? 'excellent' : (qualityClass === 'Medium' ? 'good' : 'moderate')
        },
        consistency: consistency,
        impurities: {
          detected: impurityCount > 0,
          count: impurityCount,
          percentage: Math.round(impurityPercentage * 10) / 10,
          severity: impuritySeverity,
          description: impurityCount > 0 ? `Found ${impurityCount} impurity particles` : 'No visible impurities'
        },
        quantity_estimation: {
          estimated_volume_ml: Math.round(estimatedVolume * 10) / 10,
          confidence: Math.round(quantityConfidence * 10) / 10,
          latex_area_percentage: Math.round(randomFactor * 100),
          volume_range: {
            min: Math.round(estimatedVolume * 0.8 * 10) / 10,
            max: Math.round(estimatedVolume * 1.2 * 10) / 10
          }
        },
        estimated_yield: {
          wet_weight_kg: Math.round(estimatedVolume / 1000 * 100) / 100,
          dry_weight_kg: Math.round((estimatedVolume * (dryRubberContent / 100)) / 1000 * 100) / 100,
          dry_yield_percentage: Math.round(dryRubberContent * 10) / 10
        }
      },
      product_recommendations: {
        recommended_products: recommendedProducts,
        processing_required: hasContamination,
        suggested_applications: recommendedProducts.map(p => p.name)
      },
      market_analysis: {
        price_per_kg: pricePerKg,
        currency: 'PHP',
        region: 'global_avg',
        estimated_total_value: Math.round(totalValue * 100) / 100,
        market_trend: marketTrend,
        trend_strength: Math.round((randomFactor * 0.3 + 0.1) * 100) / 100,
        regional_comparison: {
          thailand: qualityClass === 'High' ? 195 : (qualityClass === 'Medium' ? 130 : 75),
          indonesia: qualityClass === 'High' ? 180 : (qualityClass === 'Medium' ? 120 : 70),
          malaysia: qualityClass === 'High' ? 190 : (qualityClass === 'Medium' ? 125 : 72),
          vietnam: qualityClass === 'High' ? 175 : (qualityClass === 'Medium' ? 115 : 68)
        }
      },
      model_info: {
        modelUsed: null,
        reason: reason,
        fallback: true
      },
      image_metadata: {
        filename: path.basename(imagePath),
        fileSizeKB: Math.round(fileSizeKB * 10) / 10,
        analyzedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Simple string hash function for deterministic randomness
   * @private
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate a unique analysis ID
   * @private
   */
  _generateAnalysisId() {
    return crypto.randomBytes(4).toString('hex');
  }
}

// Export singleton instance
module.exports = new LatexService();
