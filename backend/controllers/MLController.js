// backend/controllers/MLController.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');

class MLController {
    // Upload and process rubber tree image
    static async processRubberTree(req, res) {
        try {
            console.log('🔄 Processing rubber tree request...');
            
            if (!req.file) {
                console.error('❌ No file uploaded');
                return res.status(400).json({ 
                    error: 'No image uploaded',
                    details: 'Please select an image file to upload'
                });
            }

            const localImagePath = req.file.path;
            console.log('📁 Processing image from multer:', localImagePath);
            
            // Check if file exists
            if (!fs.existsSync(localImagePath)) {
                console.error('❌ File does not exist:', localImagePath);
                return res.status(400).json({ error: 'Uploaded file not found' });
            }

            // ----------------------
            // UPLOAD TO CLOUDINARY
            // ----------------------
            let cloudImage;
            try {
                console.log('☁️ Uploading image to Cloudinary...');
                cloudImage = await uploadToCloudinary(localImagePath, 'rubbersense/rubbertrees');
                console.log('✅ Cloudinary upload successful:', cloudImage.url);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload failed:', uploadError.message);
                // Clean up local file on error
                try { fs.unlinkSync(localImagePath); } catch(e) {}
                return res.status(500).json({ 
                    error: 'Failed to upload image to Cloudinary', 
                    details: uploadError.message 
                });
            }

            // Clean up local file after upload
            try {
                fs.unlinkSync(localImagePath);
                console.log('🗑️ Deleted local file');
            } catch (cleanupError) {
                console.warn('⚠️ Could not delete local file:', cleanupError.message);
            }

            // ----------------------
            // CALL PYTHON SCRIPT WITH CLOUDINARY URL
            // ----------------------
            console.log('🐍 Calling Python script with Cloudinary URL:', cloudImage.url);
            
            // Use real AI processing now that Python packages are installed
            // Set to true if you want to use mock data for testing
            const USE_MOCK_DATA = false;
            
            let pythonResult;
            
            if (USE_MOCK_DATA) {
                console.log('🎭 Using mock data (Python packages not installed)');
                pythonResult = MLController.getMockPredictionResult();
            } else {
                pythonResult = await MLController.callPythonPrediction(cloudImage.url);
            }
            
            console.log('📊 Python/Mock script result:', JSON.stringify(pythonResult, null, 2));

            // Check if result was successful
            if (!pythonResult.success) {
                // Optionally delete from Cloudinary if Python fails
                try {
                    await deleteFromCloudinary(cloudImage.public_id);
                } catch (e) {
                    console.warn('⚠️ Could not delete from Cloudinary:', e.message);
                }
                
                return res.status(500).json({ 
                    error: 'AI Analysis Failed', 
                    details: pythonResult.error || 'Failed to analyze image',
                    help: USE_MOCK_DATA ? 
                        'Using mock data. To enable real AI: pip install opencv-python ultralytics numpy pillow requests' :
                        'Python script returned an error'
                });
            }

            // Process predictions for frontend
            const results = MLController.processRubberTreeResults(pythonResult);

            res.json({
                success: true,
                results: results,
                image_url: cloudImage.url, // return Cloudinary URL for frontend display
                cloudinary_id: cloudImage.public_id, // for potential cleanup
                note: USE_MOCK_DATA ? 'Using mock data - Install Python packages for real AI detection' : 'Real AI analysis'
            });

        } catch (error) {
            console.error('💥 Error in processRubberTree:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: 'Failed to process image', 
                details: error.message 
            });
        }
    }

    // Call Python script with better error handling
    static async callPythonPrediction(imageUrl) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.resolve(__dirname, '../MLmodels/RubberTree/PredictRubberTree.py');

            // Check if Python script exists
            if (!fs.existsSync(scriptPath)) {
                console.error('❌ Python script not found:', scriptPath);
                reject(new Error(`Python script not found at: ${scriptPath}`));
                return;
            }

            console.log('📜 Executing Python script:', scriptPath);
            console.log('🖼️ With image URL:', imageUrl);

            // Remove quotes from the URL - they cause issues on Windows
            const cleanImageUrl = imageUrl.replace(/^["']|["']$/g, '');

            // Use virtual environment Python on Windows
            const isWindows = process.platform === 'win32';
            let pythonCommands;

            if (isWindows) {
                // Try virtual environment Python first, then system Python
                const venvPython = path.resolve(__dirname, '../../.venv/Scripts/python.exe');
                pythonCommands = [venvPython, 'python3', 'python', 'py'];
            } else {
                // On Unix-like systems, try python3 first
                pythonCommands = ['python3', 'python'];
            }

            let currentCommand = 0;
            
            const tryPython = () => {
                if (currentCommand >= pythonCommands.length) {
                    reject(new Error('Failed to execute Python with any available command'));
                    return;
                }
                
                const pythonCmd = pythonCommands[currentCommand];
                console.log(`🔄 Trying Python command: ${pythonCmd}`);
                
                const pythonProcess = spawn(pythonCmd, [scriptPath, cleanImageUrl], {
                    cwd: path.dirname(scriptPath),
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let result = '';
                let errorOutput = '';

                pythonProcess.stdout.on('data', (data) => {
                    const text = data.toString();
                    result += text;
                    console.log(`🐍 Python stdout: ${text.trim()}`);
                });

                pythonProcess.stderr.on('data', (data) => {
                    const text = data.toString();
                    errorOutput += text;
                    console.error(`🐍 Python stderr: ${text.trim()}`);
                });

                pythonProcess.on('close', (code) => {
                    console.log(`🐍 Python process exited with code: ${code}`);
                    
                    if (code === 0) {
                        try {
                            console.log('📄 Raw Python output:', result);
                            const parsedResult = JSON.parse(result);
                            resolve(parsedResult);
                        } catch (e) {
                            console.error('❌ Failed to parse Python output:', e.message);
                            // Try to extract JSON from output if there's extra text
                            const jsonMatch = result.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                try {
                                    const parsedResult = JSON.parse(jsonMatch[0]);
                                    resolve(parsedResult);
                                } catch (parseError) {
                                    reject(new Error(`Failed to parse Python output: ${parseError.message}`));
                                }
                            } else {
                                reject(new Error(`Failed to parse Python output: ${e.message}. Output: ${result.substring(0, 200)}`));
                            }
                        }
                    } else {
                        // Check if this is the "missing module" error
                        if (errorOutput.includes('ModuleNotFoundError') && errorOutput.includes('cv2')) {
                            const errorMsg = `Python packages not installed. Please run: pip install opencv-python ultralytics numpy pillow requests\nError: ${errorOutput}`;
                            reject(new Error(errorMsg));
                        } else if (currentCommand < pythonCommands.length - 1) {
                            // Try next Python command
                            currentCommand++;
                            console.log(`❌ ${pythonCmd} failed (code ${code}), trying next command...`);
                            tryPython();
                        } else {
                            reject(new Error(`Python script failed with code ${code}: ${errorOutput || 'No error output'}`));
                        }
                    }
                });

                pythonProcess.on('error', (err) => {
                    console.error(`❌ Failed to start Python with ${pythonCmd}:`, err.message);
                    if (currentCommand < pythonCommands.length - 1) {
                        currentCommand++;
                        tryPython();
                    } else {
                        reject(new Error(`Failed to start Python process: ${err.message}`));
                    }
                });
            };

            tryPython();
        });
    }

    // Generate mock prediction results for testing
    static getMockPredictionResult() {
        // Simulate different scenarios randomly
        const scenarios = [
            {
                name: 'Healthy Tree',
                treeConfidence: 0.92,
                hasDisease: false,
                hasNormal: true,
                diseaseCount: 0
            },
            {
                name: 'Tree with Minor Disease',
                treeConfidence: 0.87,
                hasDisease: true,
                diseaseType: 'leaf pustule disease',
                diseaseConfidence: 0.65,
                hasNormal: false,
                diseaseCount: 1
            },
            {
                name: 'Healthy Mature Tree',
                treeConfidence: 0.95,
                hasDisease: false,
                hasNormal: true,
                diseaseCount: 0
            }
        ];
        
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        console.log(`🎭 Using mock scenario: ${scenario.name}`);
        
        const detections = [
            {
                class_id: 2,
                class_name: 'Rubber tree',
                confidence: scenario.treeConfidence,
                bbox: [50, 60, 250, 400],
                width: 200,
                height: 340
            }
        ];
        
        if (scenario.hasNormal) {
            detections.push({
                class_id: 9,
                class_name: 'nayang-normal',
                confidence: 0.88,
                bbox: [80, 90, 220, 380],
                width: 140,
                height: 290
            });
        }
        
        if (scenario.hasDisease) {
            detections.push({
                class_id: 8,
                class_name: scenario.diseaseType,
                confidence: scenario.diseaseConfidence,
                bbox: [100, 120, 180, 280],
                width: 80,
                height: 160
            });
        }
        
        const diseaseCount = scenario.diseaseCount;
        const treeCount = 1;
        const normalCount = scenario.hasNormal ? 1 : 0;
        
        // Calculate health score
        let healthScore = 100;
        if (diseaseCount > 0) {
            healthScore = Math.max(0, 100 - (diseaseCount * 20));
        } else if (normalCount > 0) {
            healthScore = 85;
        }
        
        // Determine health status
        let healthStatus = 'Good';
        if (healthScore >= 80) {
            healthStatus = 'Good';
        } else if (healthScore >= 50) {
            healthStatus = 'Moderate';
        } else {
            healthStatus = 'Poor';
        }
        
        // Calculate diameter based on confidence
        const estimatedDiameter = 20 + (scenario.treeConfidence * 40);
        
        return {
            success: true,
            detections: detections,
            analysis: {
                health_assessment: {
                    status: healthStatus,
                    score: healthScore,
                    disease_count: diseaseCount,
                    normal_count: normalCount
                },
                trunk_analysis: {
                    estimated_diameter_cm: Math.round(estimatedDiameter * 10) / 10,
                    size_category: estimatedDiameter > 30 ? 'Medium' : 'Small',
                    tree_count: treeCount
                },
                productivity_metrics: {
                    tappability: diseaseCount === 0 ? 'Fully Tappable' : 'Conditionally Tappable',
                    latex_quality_prediction: normalCount > 0 ? 'High' : diseaseCount === 1 ? 'Medium' : 'Low',
                    expected_yield_kg_per_year: diseaseCount === 0 ? 35 : diseaseCount === 1 ? 20 : 10
                },
                primary_tree_type: 'Rubber tree'
            }
        };
    }

    // Rest of your MLController.js remains exactly the same...
    static processRubberTreeResults(pythonResult) {
        console.log('📊 Processing Python result with keys:', Object.keys(pythonResult));
        
        // Extract detections from Python result
        const detections = pythonResult.detections || [];
        const analysis = pythonResult.analysis || {};
        
        console.log(`🔍 Found ${detections.length} detections`);
        console.log('📈 Analysis keys:', Object.keys(analysis));

        const detectedDiseases = [];
        const treeTypes = [];
        let healthScore = 100;

        // Process detections
        detections.forEach(detection => {
            const className = detection.class_name;
            const confidence = detection.confidence;

            // Categorize detections
            if (className.includes('Rubber tree') || className.includes('Rubber leaves') || className.includes('Rubber root')) {
                treeTypes.push({
                    type: className,
                    confidence: (confidence * 100).toFixed(1)
                });
            } else if (className.includes('disease')) {
                detectedDiseases.push({
                    disease: className,
                    severity: this.calculateSeverity(confidence),
                    confidence: (confidence * 100).toFixed(1)
                });
                healthScore -= 20; // Deduct for each disease
            } else if (className === 'nayang-normal') {
                healthScore += 10; // Bonus for normal tree
            }
        });

        // Calculate tree characteristics based on detections
        let treeAge = 'Unknown';
        let tappability = 'Unknown';
        let latexQuality = 'Unknown';

        if (detections.length > 0) {
            treeAge = this.estimateTreeAge({ detections: detections });
            tappability = this.assessTappability({ detections: detections });
            latexQuality = this.predictLatexQuality({ detections: detections });
        }

        // Use analysis from Python if available
        if (analysis.health_assessment) {
            healthScore = this.convertHealthToScore(analysis.health_assessment.status);
        }

        if (analysis.productivity_metrics) {
            tappability = analysis.productivity_metrics.tappability || tappability;
            latexQuality = analysis.productivity_metrics.latex_quality_prediction || latexQuality;
        }

        return {
            tree_identification: {
                types: treeTypes,
                confidence: treeTypes.length > 0 ? treeTypes[0].confidence : '0',
                primary_tree_type: analysis.primary_tree_type || 'Unknown'
            },
            trunk_analysis: {
                age_estimate: treeAge,
                diameter_estimate: analysis.trunk_analysis?.estimated_diameter_cm ? 
                    `${analysis.trunk_analysis.estimated_diameter_cm} cm` : 
                    this.estimateDiameter({ detections: detections }),
                bark_texture: this.analyzeBarkTexture({ detections: detections }),
                bark_color: this.analyzeBarkColor({ detections: detections }),
                size_category: analysis.trunk_analysis?.size_category || 'Unknown'
            },
            disease_detection: {
                diseases: detectedDiseases,
                health_score: Math.max(0, healthScore),
                overall_health: healthScore >= 70 ? 'Healthy' : 
                               healthScore >= 40 ? 'Moderate' : 'Poor',
                analysis: analysis.health_assessment || {}
            },
            tappability_assessment: {
                status: tappability,
                recommendation: this.getTappabilityRecommendation(tappability),
                suitable_tapping_method: this.suggestTappingMethod(tappability)
            },
            latex_quality_prediction: {
                quality: latexQuality,
                predicted_flow: this.estimateLatexFlow(latexQuality),
                expected_yield: analysis.productivity_metrics?.expected_yield_kg_per_year ?
                    `${analysis.productivity_metrics.expected_yield_kg_per_year} kg/year` :
                    this.estimateYield({ detections: detections })
            },
            productivity_status: {
                status: this.assessProductivityStatus({ detections: detections }),
                recommendations: this.generateRecommendations({ detections: detections }, detectedDiseases),
                maintenance_tips: this.getMaintenanceTips(detectedDiseases),
                metrics: analysis.productivity_metrics || {}
            },
            raw_predictions: pythonResult // Include raw predictions for debugging
        };
    }

    // All your existing helper methods remain exactly the same...
    static convertHealthToScore(healthStatus) {
        switch(healthStatus) {
            case 'Good': return 85;
            case 'Moderate': return 60;
            case 'Poor': return 30;
            default: return 50;
        }
    }

    static calculateSeverity(confidence) {
        if (confidence > 0.8) return 'High';
        if (confidence > 0.5) return 'Medium';
        return 'Low';
    }

    static estimateTreeAge(predictions) {
        const treeDetections = predictions.detections.filter(d => 
            d.class_name.includes('Rubber tree') || d.class_name.includes('trunk')
        );
        
        if (treeDetections.length === 0) return 'Unknown';
        
        const avgConfidence = treeDetections.reduce((sum, d) => sum + d.confidence, 0) / treeDetections.length;
        
        if (avgConfidence > 0.8) return 'Mature (7-15 years)';
        if (avgConfidence > 0.5) return 'Young (3-7 years)';
        return 'Seedling (1-3 years)';
    }

    static assessTappability(predictions) {
        const diseases = predictions.detections.filter(d => 
            d.class_name.includes('disease') && !d.class_name.includes('normal')
        );
        
        const treeDetections = predictions.detections.filter(d => 
            d.class_name.includes('Rubber tree')
        );

        if (treeDetections.length === 0) return 'Cannot Assess';
        if (diseases.length > 2) return 'Not Tappable';
        if (diseases.length > 0) return 'Conditionally Tappable';
        
        return 'Fully Tappable';
    }

    static predictLatexQuality(predictions) {
        const diseases = predictions.detections.filter(d => 
            d.class_name.includes('disease')
        );
        
        const normalDetections = predictions.detections.filter(d => 
            d.class_name === 'nayang-normal'
        );

        if (normalDetections.length > 0 && diseases.length === 0) {
            return 'High Quality';
        } else if (diseases.length === 1) {
            return 'Medium Quality';
        } else if (diseases.length > 1) {
            return 'Low Quality';
        }
        
        return 'Unknown';
    }

    static estimateDiameter(predictions) {
        const treeDetections = predictions.detections.filter(d => 
            d.class_name.includes('Rubber tree')
        );
        
        if (treeDetections.length === 0) return 'Unknown';
        
        const avgConfidence = treeDetections.reduce((sum, d) => sum + d.confidence, 0) / treeDetections.length;
        
        if (avgConfidence > 0.8) return '40-60 cm (Mature)';
        if (avgConfidence > 0.5) return '20-40 cm (Growing)';
        return '10-20 cm (Young)';
    }

    static analyzeBarkTexture(predictions) {
        const diseases = predictions.detections.filter(d => 
            d.class_name.includes('rot') || d.class_name.includes('crust')
        );
        
        if (diseases.length > 0) return 'Rough/Damaged';
        
        const treeDetections = predictions.detections.filter(d => 
            d.class_name.includes('Rubber tree')
        );
        
        if (treeDetections.length > 0 && treeDetections[0].confidence > 0.7) {
            return 'Smooth/Healthy';
        }
        
        return 'Moderate';
    }

    static analyzeBarkColor(predictions) {
        const diseases = predictions.detections.filter(d => 
            d.class_name.includes('pink') || d.class_name.includes('white') || d.class_name.includes('brown')
        );
        
        if (diseases.some(d => d.class_name.includes('pink'))) return 'Pinkish (Possible Disease)';
        if (diseases.some(d => d.class_name.includes('white'))) return 'Whitish (Possible Disease)';
        if (diseases.some(d => d.class_name.includes('brown'))) return 'Brownish (Possible Disease)';
        
        return 'Normal Brown/Gray';
    }

    static getTappabilityRecommendation(tappability) {
        const recommendations = {
            'Fully Tappable': 'Tree is ready for tapping. Use standard tapping methods.',
            'Conditionally Tappable': 'Proceed with caution. Monitor tree health regularly.',
            'Not Tappable': 'Do not tap. Treat diseases first and reassess in 6 months.',
            'Cannot Assess': 'Need clearer image of trunk for proper assessment.'
        };
        return recommendations[tappability] || 'Consult with agricultural expert.';
    }

    static suggestTappingMethod(tappability) {
        if (tappability === 'Fully Tappable') return 'Half-spiral or full-spiral tapping';
        if (tappability === 'Conditionally Tappable') return 'Quarter-spiral tapping with rest periods';
        return 'No tapping recommended';
    }

    static estimateLatexFlow(quality) {
        const flowMap = {
            'High Quality': 'Strong (5-10 ml/tapping)',
            'Medium Quality': 'Moderate (2-5 ml/tapping)',
            'Low Quality': 'Weak (0-2 ml/tapping)',
            'Unknown': 'Cannot estimate'
        };
        return flowMap[quality] || 'Cannot estimate';
    }

    static estimateYield(predictions) {
        const treeDetections = predictions.detections.filter(d => 
            d.class_name.includes('Rubber tree')
        );
        
        if (treeDetections.length === 0) return 'Unknown';
        
        const avgConfidence = treeDetections.reduce((sum, d) => sum + d.confidence, 0) / treeDetections.length;
        
        if (avgConfidence > 0.8) return '30-50 kg/year';
        if (avgConfidence > 0.6) return '15-30 kg/year';
        if (avgConfidence > 0.4) return '5-15 kg/year';
        return '<5 kg/year';
    }

    static assessProductivityStatus(predictions) {
        const diseases = predictions.detections.filter(d => 
            d.class_name.includes('disease') && !d.class_name.includes('normal')
        );
        
        if (diseases.length >= 3) return 'Low Productivity';
        if (diseases.length >= 1) return 'Moderate Productivity';
        
        const normalDetections = predictions.detections.filter(d => 
            d.class_name === 'nayang-normal'
        );
        
        if (normalDetections.length > 0) return 'High Productivity';
        
        return 'Unknown Productivity';
    }

    static generateRecommendations(predictions, diseases) {
        const recommendations = [];
        
        if (diseases.length > 0) {
            recommendations.push('Apply appropriate fungicide for detected diseases');
            recommendations.push('Prune affected areas to prevent spread');
        }
        
        const treeDetections = predictions.detections.filter(d => 
            d.class_name.includes('Rubber tree')
        );
        
        if (treeDetections.length > 0) {
            recommendations.push('Regular watering during dry seasons');
            recommendations.push('Apply balanced fertilizer quarterly');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Maintain current care routine');
            recommendations.push('Regular monitoring for early disease detection');
        }
        
        return recommendations;
    }

    static getMaintenanceTips(diseases) {
        const tips = [
            'Monitor tree health monthly',
            'Keep base area weed-free',
            'Ensure proper drainage'
        ];
        
        if (diseases.some(d => d.disease.includes('root'))) {
            tips.push('Improve soil drainage for root diseases');
            tips.push('Avoid over-watering');
        }
        
        if (diseases.some(d => d.disease.includes('leaf'))) {
            tips.push('Remove fallen leaves to prevent fungal spread');
            tips.push('Ensure good air circulation');
        }
        
        return tips;
    }
}

module.exports = MLController;