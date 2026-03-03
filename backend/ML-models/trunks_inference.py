#!/usr/bin/env python3
"""
Rubber Tree Trunks Disease Detection System
Uses trained YOLO model (Trunks.pt) for accurate trunk disease classification
Optimized for RubberSense backend integration
"""

import os
import sys
import json
import base64
import numpy as np
import cv2
from pathlib import Path
import logging
import traceback
import warnings
import datetime
import colorsys
from typing import Dict, List, Union, Optional, Tuple
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('rubbersense.trunks')

# Try importing YOLO
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    logger.info("✅ Ultralytics YOLO imported successfully")
except ImportError as e:
    YOLO_AVAILABLE = False
    logger.error(f"❌ Ultralytics YOLO not installed: {e}")
    logger.error("Run: pip install ultralytics")

class RubberTreeTrunksAnalyzer:
    """
    Main analyzer class for rubber tree trunks disease detection
    Uses trained Trunks.pt model for accurate classification
    
    The model is trained to detect:
    - healthy_trunk: Healthy rubber tree trunk
    - white_root_disease: White root disease (Rigidoporus microporus)
    - brown_root_disease: Brown root disease (Phellinus noxius)
    - rigidoporus: Rigidoporus infection
    - pink_disease: Pink disease (Corticium salmonicolor)
    - bark_cracking: Physical bark damage/cracking
    - gummosis: Gum exudation from trunk
    - canker: Canker lesions on bark
    """
    
    # Disease database with detailed information
    DISEASE_DATABASE = {
        0: {
            'class': 'healthy_trunk',
            'name': 'Healthy',
            'severity': 'None',
            'description': 'Tree trunk appears healthy with no signs of disease',
            'treatment': 'No treatment needed. Continue regular monitoring and preventive care.',
            'symptoms': ['Normal bark appearance', 'Healthy color', 'No lesions or abnormalities', 'Consistent texture'],
            'latex_impact': 'Normal latex production expected',
            'urgency': 'low'
        },
        1: {
            'class': 'white_root_disease',
            'name': 'White Root Disease',
            'severity': 'Moderate to Severe',
            'description': 'Fungal infection caused by Rigidoporus microporus affecting the root system and lower trunk',
            'treatment': 'Apply fungicides to soil (Trichoderma spp.), improve drainage, remove infected roots, create isolation trenches',
            'symptoms': ['White fungal strands on roots', 'Yellowing leaves', 'Reduced latex flow', 'Tree wilting', 'Mushrooms at base'],
            'latex_impact': 'Severe reduction in latex yield (40-60%)',
            'urgency': 'high'
        },
        2: {
            'class': 'brown_root_disease',
            'name': 'Brown Root Disease',
            'severity': 'Moderate',
            'description': 'Fungal disease caused by Phellinus noxius, affecting roots and lower trunk with brown crust formation',
            'treatment': 'Remove infected bark, apply fungicide (Bayleton), improve soil conditions, remove infected trees',
            'symptoms': ['Brown crust on roots', 'Decayed wood', 'Fruiting bodies near base', 'Tree decline', 'Brown fungal mats'],
            'latex_impact': 'Moderate to severe reduction (30-50%)',
            'urgency': 'high'
        },
        3: {
            'class': 'rigidoporus',
            'name': 'Rigidoporus',
            'severity': 'Severe',
            'description': 'Serious fungal infection causing white rot in trunk and roots, often fatal if untreated',
            'treatment': 'Surgical removal of infected tissue, fungicide application (systemic fungicides), consider tree removal if severe',
            'symptoms': ['Yellowish bracket fungi', 'White rot', 'Decayed trunk', 'Tree instability', 'Spore masses'],
            'latex_impact': 'Complete loss if severe',
            'urgency': 'critical'
        },
        4: {
            'class': 'pink_disease',
            'name': 'Pink Disease',
            'severity': 'Moderate',
            'description': 'Fungal infection caused by Corticium salmonicolor affecting branches and trunk with pinkish coating',
            'treatment': 'Prune affected branches, apply copper-based fungicides, improve air circulation',
            'symptoms': ['Pinkish coating on bark', 'Branch dieback', 'Cracking bark', 'Gum exudation', 'White mycelium'],
            'latex_impact': 'Moderate reduction (20-30%)',
            'urgency': 'medium'
        },
        5: {
            'class': 'bark_cracking',
            'name': 'Bark Cracking',
            'severity': 'Mild to Moderate',
            'description': 'Physical damage to bark causing vertical cracks and fissures, may lead to secondary infections',
            'treatment': 'Apply wound dressing, avoid mechanical damage, ensure proper nutrition, monitor for fungal entry',
            'symptoms': ['Vertical cracks in bark', 'Exposed inner tissue', 'Possible secondary infections', 'Gum exudation'],
            'latex_impact': 'Mild reduction (10-15%)',
            'urgency': 'low'
        },
        6: {
            'class': 'gummosis',
            'name': 'Gummosis',
            'severity': 'Moderate',
            'description': 'Gum exudation from trunk, often due to fungal infection (Phytophthora) or physiological stress',
            'treatment': 'Improve drainage, apply fungicides (Metalaxyl), reduce tapping frequency, scrape affected area',
            'symptoms': ['Gum oozing from bark', 'Darkened areas', 'Bark necrosis', 'Wounds with gum'],
            'latex_impact': 'Moderate reduction (25-35%)',
            'urgency': 'medium'
        },
        7: {
            'class': 'canker',
            'name': 'Canker',
            'severity': 'Moderate to Severe',
            'description': 'Localized dead areas on bark with sunken lesions, often caused by fungal pathogens (Botryodiplodia)',
            'treatment': 'Excise affected area, apply fungicidal paste, improve tree vigor, avoid wounding',
            'symptoms': ['Sunken lesions', 'Cracked bark', 'Discolored areas', 'Gum exudation', 'Dead bark patches'],
            'latex_impact': 'Localized reduction (15-25%)',
            'urgency': 'medium'
        }
    }
    
    # Class names mapping
    CLASS_NAMES = {
        0: "healthy_trunk",
        1: "white_root_disease", 
        2: "brown_root_disease",
        3: "rigidoporus",
        4: "pink_disease",
        5: "bark_cracking",
        6: "gummosis",
        7: "canker"
    }
    
    def __init__(self, model_path: Optional[str] = None, confidence_threshold: float = 0.35):
        """
        Initialize the trunks analyzer with trained model
        
        Args:
            model_path: Path to the trained trunk model (.pt)
            confidence_threshold: Minimum confidence for reliable detection (0.0-1.0)
        """
        self.model = None
        self.model_path = model_path or self._get_default_model_path()
        self.confidence_threshold = confidence_threshold
        # Detection inference thresholds (can be overridden via env).
        self.inference_conf = float(os.getenv('TRUNKS_MODEL_CONF', '0.02'))
        self.inference_iou = float(os.getenv('TRUNKS_MODEL_IOU', '0.70'))
        self.min_inference_conf = float(os.getenv('TRUNKS_MODEL_MIN_CONF', '0.001'))
        self.class_names = self.CLASS_NAMES.copy()
        self.model_loaded = False
        self.model_info = {}
        
        # Load model on initialization
        self._load_model()
        logger.info("✅ RubberTreeTrunksAnalyzer initialized")
        
    def _get_default_model_path(self) -> str:
        """Get the default model path for RubberSense backend"""
        # Try multiple possible locations (prefer Trunks-v2.pt, then Trunks.pt)
        possible_paths = [
            # Current working directory
            Path.cwd() / "RubberSense" / "backend" / "ML-models" / "Trunks-v2.pt",
            Path.cwd() / "RubberSense" / "backend" / "ML-models" / "Trunks.pt",
            Path.cwd() / "backend" / "ML-models" / "Trunks-v2.pt",
            Path.cwd() / "backend" / "ML-models" / "Trunks.pt",
            Path.cwd() / "ML-models" / "Trunks-v2.pt",
            Path.cwd() / "ML-models" / "Trunks.pt",
            Path.cwd() / "Trunks-v2.pt",
            Path.cwd() / "Trunks.pt",
            # Script directory
            Path(__file__).parent / "RubberSense" / "backend" / "ML-models" / "Trunks-v2.pt",
            Path(__file__).parent / "RubberSense" / "backend" / "ML-models" / "Trunks.pt",
            Path(__file__).parent / "backend" / "ML-models" / "Trunks-v2.pt",
            Path(__file__).parent / "backend" / "ML-models" / "Trunks.pt",
            Path(__file__).parent / "ML-models" / "Trunks-v2.pt",
            Path(__file__).parent / "ML-models" / "Trunks.pt",
            Path(__file__).parent / "Trunks-v2.pt",
            Path(__file__).parent / "Trunks.pt",
            # Absolute path for RubberSense
            Path("/app/RubberSense/backend/ML-models/Trunks-v2.pt"),
            Path("/app/RubberSense/backend/ML-models/Trunks.pt"),
            Path("/app/backend/ML-models/Trunks-v2.pt"),
            Path("/app/backend/ML-models/Trunks.pt"),
        ]
        
        for path in possible_paths:
            if path.exists():
                logger.info(f"✅ Found model at: {path}")
                return str(path)
        
        # Return the most likely path as default
        default_path = Path(__file__).parent / "RubberSense" / "backend" / "ML-models" / "Trunks-v2.pt"
        logger.warning(f"⚠️ Model not found in any standard location, using: {default_path}")
        return str(default_path)
    
    def _load_model(self) -> bool:
        """Load the YOLO trunk model from .pt file."""
        if not YOLO_AVAILABLE:
            logger.error("❌ YOLO not available. Cannot load model.")
            return False
            
        try:
            # Check if model file exists
            model_file = Path(self.model_path)
            if not model_file.exists():
                logger.error(f"❌ Model not found at: {self.model_path}")
                # Try to find in parent directories
                self.model_path = self._search_for_model()
                if not self.model_path:
                    return False
            
            logger.info(f"📦 Loading model from: {self.model_path}")
            self.model = YOLO(self.model_path)
            
            # Get model info
            self.model_loaded = True
            
            # Get class names from model if available
            if hasattr(self.model, 'names') and self.model.names:
                self.class_names = self.model.names
                logger.info(f"📋 Model classes ({len(self.class_names)}): {self.class_names}")
            else:
                logger.info(f"📋 Using predefined classes: {self.CLASS_NAMES}")
            
            # Store model metadata
            self.model_info = {
                'path': self.model_path,
                'classes': self.class_names,
                'num_classes': len(self.class_names),
                'task': 'classify',
                'loaded': True
            }
                
            logger.info(f"✅ Model loaded successfully from {self.model_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {str(e)}")
            logger.debug(traceback.format_exc())
            self.model_loaded = False
            return False
    
    def _search_for_model(self) -> Optional[str]:
        """Search for trunk model in common locations."""
        search_paths = [
            Path.cwd(),
            Path(__file__).parent,
            Path(__file__).parent.parent,
            Path(__file__).parent.parent.parent,
            Path("/app"),
        ]
        
        for base_path in search_paths:
            for pattern in [
                "**/Trunks-v2.pt", "**/ML-models/Trunks-v2.pt",
                "**/Trunks.pt", "**/ML-models/Trunks.pt"
            ]:
                matches = list(base_path.glob(pattern))
                if matches:
                    model_path = str(matches[0])
                    logger.info(f"✅ Found model via search: {model_path}")
                    return model_path
        
        logger.error("❌ Could not find trunk model file")
        return None
    
    def preprocess_image(self, image_input: Union[str, np.ndarray, bytes]) -> Optional[np.ndarray]:
        """
        Load and preprocess image from various input types
        
        Args:
            image_input: Path, URL, base64 string, bytes, or numpy array of image
            
        Returns:
            numpy array: Preprocessed image
        """
        img = None
        
        try:
            # Case 1: Already numpy array
            if isinstance(image_input, np.ndarray):
                img = image_input
                logger.debug("✅ Image from numpy array")
                
            # Case 2: File path
            elif isinstance(image_input, str) and os.path.exists(image_input):
                img = cv2.imread(image_input)
                if img is None:
                    raise ValueError(f"Failed to read image from path: {image_input}")
                logger.debug(f"✅ Image loaded from path: {image_input}")
                
            # Case 3: Base64 string
            elif isinstance(image_input, str) and (
                image_input.startswith('data:image') or 
                len(image_input) > 100
            ):
                try:
                    if 'base64,' in image_input:
                        base64_data = image_input.split('base64,')[1]
                    else:
                        base64_data = image_input
                        
                    img_bytes = base64.b64decode(base64_data)
                    img_array = np.frombuffer(img_bytes, np.uint8)
                    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                    if img is None:
                        raise ValueError("Failed to decode base64 image")
                    logger.debug("✅ Image loaded from base64")
                except Exception as e:
                    logger.error(f"Base64 decoding failed: {e}")
                    return None
                    
            # Case 4: URL
            elif isinstance(image_input, str) and image_input.startswith(('http://', 'https://')):
                try:
                    import requests
                    from io import BytesIO
                    
                    response = requests.get(image_input, timeout=10)
                    if response.status_code == 200:
                        img_array = np.asarray(bytearray(response.content), dtype=np.uint8)
                        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                        logger.debug("✅ Image loaded from URL")
                    else:
                        raise ValueError(f"HTTP {response.status_code}")
                except Exception as e:
                    logger.error(f"URL fetch failed: {e}")
                    return None
                    
            # Case 5: Bytes
            elif isinstance(image_input, bytes):
                try:
                    img_array = np.frombuffer(image_input, np.uint8)
                    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                    if img is None:
                        raise ValueError("Failed to decode bytes image")
                    logger.debug("✅ Image loaded from bytes")
                except Exception as e:
                    logger.error(f"Bytes decoding failed: {e}")
                    return None
                    
            if img is None:
                raise ValueError("Could not load image from input")
                
            # Validate image dimensions
            if img.shape[0] < 50 or img.shape[1] < 50:
                logger.warning(f"⚠️ Image too small: {img.shape}")
                return None
                
            # Resize if too large (for performance)
            h, w = img.shape[:2]
            if max(h, w) > 1280:
                scale = 1280 / max(h, w)
                new_w = int(w * scale)
                new_h = int(h * scale)
                img = cv2.resize(img, (new_w, new_h))
                logger.debug(f"📏 Resized image to {new_w}x{new_h}")
                
            return img
            
        except Exception as e:
            logger.error(f"❌ Image preprocessing failed: {str(e)}")
            logger.debug(traceback.format_exc())
            return None
    
    def analyze_trunk(self, image_input: Union[str, np.ndarray, bytes], 
                     return_visualization: bool = True,
                     detailed_analysis: bool = True) -> Dict:
        """
        Main method to analyze trunk image using trained model
        
        Args:
            image_input: Path, URL, bytes, or numpy array of trunk image
            return_visualization: Whether to return annotated image
            detailed_analysis: Whether to perform detailed visual analysis
            
        Returns:
            dict: Comprehensive analysis results
        """
        # Load and preprocess image
        img = self.preprocess_image(image_input)
        if img is None:
            return {
                "success": False,
                "error": "Failed to load image",
                "trunk_analysis": None
            }
        
        # Perform inference with trained model (ML-only mode; no heuristic fallback).
        if self.model_loaded and self.model is not None:
            return self._run_model_inference(img, return_visualization, detailed_analysis)

        logger.warning("⚠️ Model not loaded, attempting to reload...")
        if self._load_model():
            return self._run_model_inference(img, return_visualization, detailed_analysis)

        return {
            "success": False,
            "error": "Trunks.pt model could not be loaded",
            "model_used": False,
            "model_info": {
                "loaded": False,
                "model_path": self.model_path
            }
        }
    
    def _run_model_inference(self, img: np.ndarray, 
                            return_visualization: bool,
                            detailed_analysis: bool) -> Dict:
        """Run inference using the trained YOLO model"""
        try:
            logger.info(f"🔬 Running inference with trained {Path(self.model_path).name} model...")
            
            # Run inference
            applied_conf = self.inference_conf
            results = self.model(
                img,
                conf=self.inference_conf,
                iou=self.inference_iou,
                verbose=False
            )
            result0 = results[0]

            # For detection/OBB models, retry with lower confidence thresholds before
            # declaring no detections to reduce false "No Detection" outcomes.
            if (hasattr(result0, 'obb') or hasattr(result0, 'boxes')) and self._count_result_detections(result0) == 0:
                for retry_conf in self._iter_backoff_conf_thresholds(self.inference_conf):
                    logger.info(f"🔁 No detections at conf={applied_conf:.4f}; retrying at conf={retry_conf:.4f}")
                    retry_results = self.model(
                        img,
                        conf=retry_conf,
                        iou=self.inference_iou,
                        verbose=False
                    )
                    retry_result0 = retry_results[0]
                    if self._count_result_detections(retry_result0) > 0:
                        results = retry_results
                        result0 = retry_result0
                        applied_conf = retry_conf
                        logger.info(
                            f"✅ Detection recovered at conf={applied_conf:.4f} "
                            f"with {self._count_result_detections(result0)} detection(s)"
                        )
                        break
            
            # Process results based on model type.
            # Note: some result objects expose `probs` attribute but set it to None.
            if hasattr(result0, 'probs') and result0.probs is not None:
                # Classification model
                return self._process_classification_results(
                    results, img, return_visualization, detailed_analysis
                )
            elif hasattr(result0, 'obb') or hasattr(result0, 'boxes'):
                # Detection model
                return self._process_detection_results(
                    results, img, return_visualization, detailed_analysis, applied_conf=applied_conf
                )
            else:
                return {
                    "success": False,
                    "error": "Unsupported Trunks.pt output type: expected classification or detection results",
                    "model_used": True,
                    "model_info": {
                        "model_file": os.path.basename(self.model_path),
                        "classes": self.class_names
                    }
                }
                
        except Exception as e:
            logger.error(f"❌ Inference failed: {str(e)}")
            logger.debug(traceback.format_exc())
            return {
                "success": False,
                "error": f"Trunks.pt inference failed: {str(e)}",
                "model_used": True,
                "model_info": {
                    "model_file": os.path.basename(self.model_path),
                    "classes": self.class_names
                }
            }

    def _count_result_detections(self, result_obj) -> int:
        """Count detections from either OBB or regular boxes result objects."""
        try:
            obb = getattr(result_obj, 'obb', None)
            if obb is not None:
                return len(obb)
            boxes = getattr(result_obj, 'boxes', None)
            if boxes is not None:
                return len(boxes)
        except Exception:
            return 0
        return 0

    def _iter_backoff_conf_thresholds(self, start_conf: float) -> List[float]:
        """Yield lower confidence levels to retry when initial inference has zero detections."""
        min_conf = max(min(float(self.min_inference_conf), 1.0), 0.0001)
        base_levels = [0.01, 0.005, 0.003, 0.001]
        output = []
        seen = set()

        for level in base_levels:
            value = max(min(float(level), 1.0), 0.0001)
            if value < start_conf and value >= min_conf and value not in seen:
                output.append(value)
                seen.add(value)

        if min_conf < start_conf and min_conf not in seen:
            output.append(min_conf)

        return output
    
    def _process_classification_results(self, results, original_img, 
                                       return_visualization, detailed_analysis):
        """Process classification model results"""
        try:
            probs = results[0].probs
            if probs is None:
                logger.info("📊 Classification probabilities unavailable; switching to detection parser")
                return self._process_detection_results(results, original_img, return_visualization, detailed_analysis)
            
            # Get top predictions
            top5_indices = probs.top5
            top5_confidences = probs.top5conf
            
            # Primary prediction
            primary_class_idx = int(probs.top1)
            primary_confidence = float(probs.top1conf)
            
            # Get class name from model or database
            class_name = self.class_names.get(primary_class_idx, f"class_{primary_class_idx}")
            display_name = self._format_class_name(class_name)
            
            logger.info(f"🎯 Model prediction: {display_name} ({primary_confidence*100:.1f}%)")
            
            # Check if confident enough
            is_confident = primary_confidence >= self.confidence_threshold
            
            # Get disease info from database
            disease_info = self._get_disease_info(primary_class_idx, primary_confidence, class_name)
            
            # Get all predictions for transparency
            all_predictions = []
            for idx, conf in zip(top5_indices, top5_confidences):
                class_id = int(idx)
                class_name = self.class_names.get(class_id, f"class_{class_id}")
                display_name = self._format_class_name(class_name)
                
                # Get disease info for this prediction
                pred_disease = self._get_disease_info(class_id, float(conf), class_name)
                
                all_predictions.append({
                    "class": display_name,
                    "original_class": class_name,
                    "class_id": class_id,
                    "confidence": round(float(conf) * 100, 2),
                    "severity": pred_disease['severity']
                })
            
            # Perform detailed visual analysis if requested
            visual_analysis = None
            if detailed_analysis:
                visual_analysis = self._analyze_visual_features(original_img)
            
            # Determine health status by class semantics instead of fixed class index.
            is_healthy = not self._is_diseased_label(class_name)
            health_status = "healthy" if is_healthy else "diseased"
            
            # Calculate health score
            health_score = self._calculate_health_score(
                primary_class_idx,
                primary_confidence,
                visual_analysis,
                class_name=class_name,
                severity=disease_info.get('severity')
            )
            
            # Estimate tree age based on visual features
            age_estimation = None
            if visual_analysis:
                age_estimation = self._estimate_tree_age_from_visuals(visual_analysis)
            
            # Get care recommendations
            care_recommendations = self._get_care_recommendations(
                disease_info,
                health_score,
                visual_analysis
            )
            
            # Create visualization if requested
            visualization = None
            if return_visualization:
                visualization = self._create_visualization(
                    original_img,
                    disease_info,
                    primary_confidence,
                    visual_analysis
                )
            
            # Prepare comprehensive response
            result = {
                "success": True,
                "model_used": True,
                "model_info": {
                    "type": "YOLO Classification",
                    "model_file": os.path.basename(self.model_path),
                    "classes": self.class_names,
                    "num_classes": len(self.class_names),
                    "confidence_threshold": self.confidence_threshold
                },
                "primary_detection": {
                    "class_id": primary_class_idx,
                    "class_name": class_name,
                    "display_name": display_name,
                    "confidence": round(primary_confidence * 100, 2),
                    "is_confident": is_confident,
                    "health_status": health_status
                },
                "disease": disease_info,
                "all_predictions": all_predictions[:5],  # Top 5 predictions
                "health_score": round(health_score, 2),
                "care_recommendations": care_recommendations
            }
            
            # Add optional sections
            if visual_analysis:
                result["visual_analysis"] = visual_analysis
                
            if age_estimation:
                result["age_estimation"] = age_estimation
                
            if visualization:
                result["visualization"] = visualization
                
            return result
            
        except Exception as e:
            logger.error(f"❌ Result processing failed: {e}")
            logger.debug(traceback.format_exc())
            return {
                "success": False,
                "error": f"Trunks.pt classification result processing failed: {str(e)}",
                "model_used": True,
                "model_info": {
                    "type": "YOLO Classification",
                    "model_file": os.path.basename(self.model_path),
                    "classes": self.class_names
                }
            }
    
    def _process_detection_results(self, results, original_img, 
                                   return_visualization, detailed_analysis,
                                   applied_conf: Optional[float] = None):
        """Process detection model results (if model is detection-based)"""
        try:
            result0 = results[0]
            obb = getattr(result0, 'obb', None)
            boxes = getattr(result0, 'boxes', None)
            use_obb = obb is not None
            detections_obj = obb if use_obb else boxes
            num_detections = 0 if detections_obj is None else len(detections_obj)
            used_conf = float(self.inference_conf if applied_conf is None else applied_conf)

            if detections_obj is None or num_detections == 0:
                # No detections: return model-only shape without heuristic analysis.
                disease_info = {
                    'name': 'No Disease Detected',
                    'class': 'no_detection',
                    'severity': 'None',
                    'confidence': 0.0,
                    'description': 'No trunk disease detections found in the uploaded image.',
                    'treatment': 'Continue routine monitoring and good agronomic practices.',
                    'symptoms': ['No disease detections produced by the model for this image.'],
                    'latex_impact': 'No disease-related latex impact identified from this image.',
                    'urgency': 'low',
                    'detected': False
                }
                visual_analysis = self._build_detection_visual_analysis([], original_img.shape)
                detailed_visual = None
                age_estimation = None
                if detailed_analysis:
                    detailed_visual = self._analyze_visual_features(original_img)
                    if isinstance(detailed_visual, dict):
                        # Keep model-derived lesion summary as primary signal while exposing color/texture context.
                        visual_analysis = {**detailed_visual, **visual_analysis}
                        visual_analysis['source'] = 'model_detection_plus_visual'
                        age_estimation = self._estimate_tree_age_from_visuals(detailed_visual)
                health_score = self._calculate_health_score(
                    -1,
                    0.0,
                    None,
                    class_name='no_detection',
                    severity='none'
                )
                care_recommendations = self._get_care_recommendations(
                    disease_info, health_score, None
                )

                result = {
                    "success": True,
                    "model_used": True,
                    "model_info": {
                        "type": "YOLO OBB Detection" if use_obb else "YOLO Detection",
                        "model_file": os.path.basename(self.model_path),
                        "classes": self.class_names,
                        "num_classes": len(self.class_names),
                        "num_detections": 0,
                        "inference_conf": used_conf,
                        "inference_iou": self.inference_iou
                    },
                    "primary_detection": {
                        "class_id": -1,
                        "class_name": "no_detection",
                        "display_name": "No Detection",
                        "confidence": 0.0,
                        "is_confident": False,
                        "health_status": "healthy",
                        "severity": "none"
                    },
                    "disease": disease_info,
                    "all_predictions": [],
                    "detections": [],
                    "all_detections": [],
                    "has_disease": False,
                    "health_score": round(health_score, 2),
                    "care_recommendations": care_recommendations,
                    "visual_analysis": visual_analysis,
                    "message": "No trunk diseases detected"
                }

                if age_estimation:
                    result["age_estimation"] = age_estimation
                
                if return_visualization:
                    visualization = self._create_detection_visualization(original_img, [])
                    if visualization:
                        result["visualization"] = visualization
                
                return result
            
            # Process each detection
            detections = []
            for i in range(num_detections):
                class_id = int(detections_obj.cls[i])
                confidence = float(detections_obj.conf[i])
                polygon = None
                if use_obb and hasattr(detections_obj, 'xyxyxyxy'):
                    polygon = detections_obj.xyxyxyxy[i].tolist()
                    xs = [float(pt[0]) for pt in polygon]
                    ys = [float(pt[1]) for pt in polygon]
                    bbox = [min(xs), min(ys), max(xs), max(ys)]
                else:
                    bbox = detections_obj.xyxy[i].tolist()  # [x1, y1, x2, y2]
                
                class_name = self.class_names.get(class_id, f"class_{class_id}")
                disease_info = self._get_disease_info(class_id, confidence, class_name)
                
                det_row = {
                    "class_id": class_id,
                    "class_name": class_name,
                    "display_name": self._format_class_name(class_name),
                    "confidence": round(confidence * 100, 2),
                    "bbox": bbox,
                    "severity": disease_info.get("severity", "Unknown"),
                    "health_status": "diseased" if disease_info.get("detected") else "healthy",
                    "disease": disease_info
                }
                if polygon is not None:
                    det_row["obb_polygon"] = [[round(float(x), 2), round(float(y), 2)] for x, y in polygon]
                detections.append(det_row)
            
            # Sort by confidence
            detections.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Get primary detection
            primary = detections[0] if detections else None
            primary_disease = primary.get('disease') if primary else None
            
            # Determine overall health status
            has_disease = any(d.get('disease', {}).get('detected', False) for d in detections)
            primary_health_status = "diseased" if (primary_disease and primary_disease.get('detected')) else "healthy"

            primary_class_id = primary['class_id'] if primary else 0
            primary_class_name = primary['class_name'] if primary else "no_detection"
            primary_conf_raw = (primary['confidence'] / 100.0) if primary else 0.0
            health_score = self._calculate_health_score(
                primary_class_id,
                primary_conf_raw,
                None,
                class_name=primary_class_name,
                severity=(primary_disease or {}).get('severity')
            )

            care_recommendations = self._get_care_recommendations(
                primary_disease if primary_disease else {
                    'name': 'Unknown Condition',
                    'class': 'unknown',
                    'severity': 'Unknown',
                    'confidence': 0.0,
                    'description': 'No primary disease info available.',
                    'treatment': 'Consult agricultural expert.',
                    'symptoms': ['Insufficient detection context'],
                    'latex_impact': 'Unknown',
                    'urgency': 'medium',
                    'detected': False
                },
                health_score,
                None
            )

            visual_analysis = self._build_detection_visual_analysis(detections, original_img.shape)
            detailed_visual = None
            age_estimation = None
            if detailed_analysis:
                detailed_visual = self._analyze_visual_features(original_img)
                if isinstance(detailed_visual, dict):
                    # Keep model-derived lesion summary as primary signal while exposing color/texture context.
                    visual_analysis = {**detailed_visual, **visual_analysis}
                    visual_analysis['source'] = 'model_detection_plus_visual'
                    age_estimation = self._estimate_tree_age_from_visuals(detailed_visual)
            
            result = {
                "success": True,
                "model_used": True,
                "model_info": {
                    "type": "YOLO OBB Detection" if use_obb else "YOLO Detection",
                    "model_file": os.path.basename(self.model_path),
                    "classes": self.class_names,
                    "num_classes": len(self.class_names),
                    "num_detections": len(detections),
                    "inference_conf": used_conf,
                    "inference_iou": self.inference_iou
                },
                "primary_detection": {
                    "class_id": primary["class_id"] if primary else -1,
                    "class_name": primary["class_name"] if primary else "unknown",
                    "display_name": primary["display_name"] if primary else "Unknown",
                    "confidence": primary["confidence"] if primary else 0.0,
                    "is_confident": (primary["confidence"] >= (self.confidence_threshold * 100)) if primary else False,
                    "health_status": primary_health_status,
                    "severity": primary.get("severity", "Unknown") if primary else "Unknown"
                },
                "disease": primary_disease if primary_disease else {
                    'name': 'Unknown Condition',
                    'class': 'unknown',
                    'severity': 'Unknown',
                    'confidence': 0.0,
                    'description': 'No primary disease info available.',
                    'treatment': 'Consult agricultural expert.',
                    'symptoms': ['Insufficient detection context'],
                    'latex_impact': 'Unknown',
                    'urgency': 'medium',
                    'detected': False
                },
                "all_predictions": [
                    {
                        "class": d["display_name"],
                        "original_class": d["class_name"],
                        "class_id": d["class_id"],
                        "confidence": d["confidence"],
                        "severity": d.get("severity", "Unknown")
                    }
                    for d in detections[:5]
                ],
                "detections": detections[:10],  # Limit to 10 detections
                "all_detections": detections[:10],
                "has_disease": has_disease,
                "health_score": round(health_score, 2),
                "care_recommendations": care_recommendations,
                "visual_analysis": visual_analysis
            }

            if age_estimation:
                result["age_estimation"] = age_estimation
            
            # Add visualization if requested
            if return_visualization:
                visualization = self._create_detection_visualization(
                    original_img, detections
                )
                if visualization:
                    result["visualization"] = visualization
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Detection processing failed: {e}")
            logger.debug(traceback.format_exc())
            return {
                "success": False,
                "error": f"Trunks.pt detection result processing failed: {str(e)}",
                "model_used": True,
                "model_info": {
                    "type": "YOLO Detection",
                    "model_file": os.path.basename(self.model_path),
                    "classes": self.class_names
                }
            }

    def _build_detection_visual_analysis(self, detections: List[Dict], image_shape) -> Dict:
        """Build model-only visual summary from YOLO detections (no heuristic CV analysis)."""
        try:
            height = int(image_shape[0]) if image_shape is not None else 0
            width = int(image_shape[1]) if image_shape is not None else 0
            total_area = float(max(1, height * width))

            disease_detections = [d for d in detections if d.get('health_status') == 'diseased']
            healthy_detections = [d for d in detections if d.get('health_status') != 'diseased']

            all_area = 0.0
            disease_area = 0.0
            box_rows = []
            for d in detections[:10]:
                x1, y1, x2, y2 = [float(v) for v in (d.get('bbox') or [0, 0, 0, 0])]
                w = max(0.0, x2 - x1)
                h = max(0.0, y2 - y1)
                area = w * h
                all_area += area
                if d.get('health_status') == 'diseased':
                    disease_area += area
                box_rows.append({
                    'class_name': d.get('class_name'),
                    'display_name': d.get('display_name'),
                    'confidence': d.get('confidence', 0),
                    'bbox': [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                    'area_percentage': round(min(100.0, (area / total_area) * 100.0), 2)
                })

            disease_coverage = round(min(100.0, (disease_area / total_area) * 100.0), 2)
            all_coverage = round(min(100.0, (all_area / total_area) * 100.0), 2)

            if disease_coverage == 0:
                lesion_severity = 'none'
            elif disease_coverage < 5:
                lesion_severity = 'low'
            elif disease_coverage < 15:
                lesion_severity = 'medium'
            else:
                lesion_severity = 'high'

            disease_types = sorted({d.get('display_name', 'Unknown') for d in disease_detections})

            return {
                'source': 'model_detection',
                'image_dimensions': {
                    'height': height,
                    'width': width,
                    'aspect_ratio': round((width / height), 2) if height > 0 else 0
                },
                'detections_summary': {
                    'count': len(detections),
                    'disease_count': len(disease_detections),
                    'healthy_count': len(healthy_detections),
                    'coverage_percentage': all_coverage
                },
                'lesions': {
                    'detected': len(disease_detections) > 0,
                    'count': len(disease_detections),
                    'affected_area_percentage': disease_coverage,
                    'severity': lesion_severity,
                    'types': disease_types[:5],
                    'description': (
                        'No disease detections from model boxes.'
                        if len(disease_detections) == 0
                        else f"Model detected {len(disease_detections)} disease box(es)."
                    )
                },
                'model_boxes': box_rows
            }
        except Exception as e:
            logger.error(f"Model visual summary build failed: {e}")
            return {
                'source': 'model_detection',
                'detections_summary': {
                    'count': len(detections),
                    'disease_count': 0,
                    'healthy_count': len(detections),
                    'coverage_percentage': 0.0
                }
            }
    
    def _normalize_class_label(self, class_name: str) -> str:
        return str(class_name or '').strip().lower().replace('_', ' ').replace('-', ' ')

    def _is_diseased_label(self, class_name: str) -> bool:
        label = self._normalize_class_label(class_name)
        if not label:
            return False
        disease_keywords = [
            'disease', 'rot', 'mildew', 'mold', 'blight',
            'canker', 'pustule', 'fishbone', 'black line', 'dry crust'
        ]
        healthy_keywords = [
            'healthy', 'normal', 'nayang normal', 'rubber tree',
            'rubber leaf', 'rubber leaves', 'rubber root'
        ]
        if any(k in label for k in healthy_keywords):
            return False
        return any(k in label for k in disease_keywords)

    def _infer_generic_severity(self, class_name: str) -> str:
        label = self._normalize_class_label(class_name)
        if not self._is_diseased_label(label):
            return 'None'
        if any(k in label for k in ['white root', 'brown root', 'black line', 'rot']):
            return 'Moderate to Severe'
        if any(k in label for k in ['mildew', 'mold', 'fishbone', 'dry crust']):
            return 'Moderate'
        return 'Low'

    def _urgency_from_severity(self, severity: str) -> str:
        sev = str(severity or '').strip().lower()
        if 'critical' in sev:
            return 'critical'
        if 'severe' in sev or sev in ['high', 'moderate to severe']:
            return 'high'
        if 'moderate' in sev or sev == 'medium':
            return 'medium'
        return 'low'

    def _get_disease_info(self, class_id: int, confidence: float, class_name: Optional[str] = None) -> Dict:
        """Get comprehensive disease information from database."""
        # Prefer class-name mapping first because custom-trained models may not
        # preserve legacy class-id ordering.
        base_info = None
        normalized_class = self._normalize_class_label(class_name)

        if normalized_class:
            for info in self.DISEASE_DATABASE.values():
                info_class = self._normalize_class_label(info.get('class', ''))
                info_name = self._normalize_class_label(info.get('name', ''))
                if normalized_class == info_class or normalized_class == info_name or info_class in normalized_class:
                    base_info = info
                    break

        # Fall back to class-id mapping only when class-name mapping is unavailable.
        if base_info is None:
            base_info = self.DISEASE_DATABASE.get(class_id)

        # Generic profile for unseen custom classes.
        if base_info is None:
            detected = self._is_diseased_label(normalized_class)
            generic_severity = self._infer_generic_severity(normalized_class)
            display_name = self._format_class_name(class_name) if class_name else 'Unknown Condition'
            base_info = {
                'class': class_name if class_name else 'unknown',
                'name': display_name if display_name else ('Healthy' if not detected else 'Unknown Disease'),
                'severity': generic_severity,
                'description': (
                    f"Model identified class '{display_name}'."
                    if class_name else
                    'Condition not in local disease database.'
                ),
                'treatment': (
                    'Continue monitoring and maintain standard tapping hygiene.'
                    if not detected else
                    'Apply targeted disease management and verify with field inspection.'
                ),
                'symptoms': (
                    ['No disease label keywords detected for this class.']
                    if not detected else
                    [f"Detected model class: {display_name}"]
                ),
                'latex_impact': (
                    'No direct disease impact inferred from this class label.'
                    if not detected else
                    'Potential reduction in latex yield; inspect affected panel and nearby roots.'
                ),
                'urgency': self._urgency_from_severity(generic_severity)
            }

        detected = self._is_diseased_label(class_name if class_name else base_info.get('class', ''))

        return {
            'name': base_info['name'],
            'class': base_info['class'],
            'severity': base_info['severity'],
            'confidence': round(confidence * 100, 2),
            'description': base_info['description'],
            'treatment': base_info['treatment'],
            'symptoms': base_info['symptoms'],
            'latex_impact': base_info['latex_impact'],
            'urgency': base_info.get('urgency', self._urgency_from_severity(base_info.get('severity', 'low'))),
            'detected': detected
        }
    
    def _format_class_name(self, class_name: str) -> str:
        """Format class name for display"""
        if not class_name:
            return "Unknown"
        return str(class_name).replace('_', ' ').replace('-', ' ').title()
    
    def _analyze_visual_features(self, img: np.ndarray) -> Dict:
        """Analyze visual features of trunk (color, texture, lesions)"""
        try:
            # Convert to different color spaces
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Color analysis
            color_analysis = self._analyze_trunk_color(hsv)
            
            # Texture analysis
            texture_analysis = self._analyze_texture(gray)
            
            # Detect lesions/abnormalities
            lesions = self._detect_lesions(gray, hsv)
            
            # Analyze bark condition
            bark_condition = self._analyze_bark_condition(gray, hsv)
            
            return {
                'color': color_analysis,
                'texture': texture_analysis,
                'lesions': lesions,
                'bark_condition': bark_condition,
                'image_dimensions': {
                    'height': img.shape[0],
                    'width': img.shape[1],
                    'aspect_ratio': round(img.shape[1] / img.shape[0], 2)
                }
            }
            
        except Exception as e:
            logger.error(f"Visual analysis failed: {e}")
            return {
                'color': {'name': 'Unknown', 'hex': '#808080'},
                'texture': {'type': 'unknown', 'metrics': {}},
                'lesions': {'detected': False, 'count': 0},
                'bark_condition': {'condition': 'unknown'}
            }
    
    def _analyze_trunk_color(self, hsv_img: np.ndarray) -> Dict:
        """Analyze trunk color in HSV space"""
        try:
            # Calculate average color
            avg_hue = np.mean(hsv_img[:,:,0])
            avg_saturation = np.mean(hsv_img[:,:,1])
            avg_value = np.mean(hsv_img[:,:,2])
            
            # Convert to RGB for hex
            rgb = colorsys.hsv_to_rgb(avg_hue/180, avg_saturation/255, avg_value/255)
            rgb = tuple(int(x * 255) for x in rgb)
            hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
            
            # Determine color name based on HSV values
            if avg_value > 200:  # Very bright
                if avg_saturation < 50:
                    color_name = "Light Brown / Pale"
                    color_desc = "Unusually pale bark, may indicate stress or nutrient deficiency"
                else:
                    color_name = "Reddish Brown"
                    color_desc = "Reddish tint, may indicate certain bark conditions or fungal activity"
            elif avg_value > 150:  # Bright
                if avg_saturation > 80:
                    color_name = "Dark Brown"
                    color_desc = "Dark brown bark, common in healthy mature trees"
                else:
                    color_name = "Medium Brown"
                    color_desc = "Medium brown bark, typical of healthy trees"
            elif avg_value > 100:  # Moderate
                if avg_hue < 30:
                    color_name = "Very Dark Brown"
                    color_desc = "Very dark bark, may indicate age or environmental stress"
                else:
                    color_name = "Grayish Brown"
                    color_desc = "Grayish tint, may indicate lichen growth or aging"
            else:  # Dark
                if avg_saturation < 30:
                    color_name = "Blackish"
                    color_desc = "Blackish discoloration, may indicate disease or severe damage"
                else:
                    color_name = "Dark Brown/Black"
                    color_desc = "Very dark coloration, monitor for potential issues"
            
            # Calculate color uniformity
            color_std = np.std(hsv_img[:,:,2])  # Std of value channel
            uniformity = "Uniform" if color_std < 50 else "Variable"
            
            return {
                'name': color_name,
                'hex': hex_color,
                'rgb': {
                    'r': rgb[0], 'g': rgb[1], 'b': rgb[2]
                },
                'hsv': {
                    'h': round(avg_hue, 1),
                    's': round(avg_saturation, 2),
                    'v': round(avg_value, 2)
                },
                'description': color_desc,
                'uniformity': uniformity,
                'variability': round(float(color_std), 2)
            }
            
        except Exception as e:
            logger.error(f"Color analysis failed: {e}")
            return {
                'name': 'Unknown',
                'hex': '#808080',
                'description': 'Color analysis failed'
            }
    
    def _analyze_texture(self, gray_img: np.ndarray) -> Dict:
        """Analyze trunk texture"""
        try:
            # Calculate texture metrics
            variance = np.var(gray_img)
            laplacian_var = cv2.Laplacian(gray_img, cv2.CV_64F).var()
            
            # Calculate entropy (randomness)
            hist = cv2.calcHist([gray_img], [0], None, [256], [0, 256])
            hist = hist / hist.sum()
            entropy = -np.sum(hist * np.log2(hist + 1e-10))
            
            # Calculate local binary pattern-like features
            kernel_size = 5
            local_std = cv2.GaussianBlur(gray_img, (kernel_size, kernel_size), 0)
            local_std = cv2.absdiff(gray_img, local_std)
            roughness = np.mean(local_std)
            
            # Determine texture type based on metrics
            if entropy < 4.0:
                texture_type = "Very Smooth"
                texture_desc = "Exceptionally smooth bark, unusual for mature rubber trees"
            elif entropy < 5.0:
                texture_type = "Smooth"
                texture_desc = "Smooth bark surface, typical of young or well-maintained trees"
            elif entropy < 6.0:
                texture_type = "Moderately Rough"
                texture_desc = "Normal rough bark texture for mature rubber trees"
            elif entropy < 7.0:
                texture_type = "Rough"
                texture_desc = "Rough bark surface, common in older trees"
            else:
                texture_type = "Very Rough / Cracked"
                texture_desc = "Very rough or cracked bark, may indicate stress or disease"
            
            # Calculate texture health indicator
            texture_health = 100
            if roughness > 30:
                texture_health -= 15
            if laplacian_var > 500:
                texture_health -= 10
            if entropy > 7:
                texture_health -= 20
                
            return {
                'type': texture_type,
                'description': texture_desc,
                'metrics': {
                    'contrast': round(float(np.std(gray_img)), 2),
                    'roughness': round(float(roughness), 2),
                    'entropy': round(float(entropy), 2),
                    'laplacian_variance': round(float(laplacian_var), 2),
                    'uniformity': round(float(1 / (1 + variance)), 3)
                },
                'health_indicator': round(max(0, texture_health), 2)
            }
            
        except Exception as e:
            logger.error(f"Texture analysis failed: {e}")
            return {
                'type': 'unknown',
                'description': 'Texture analysis failed',
                'metrics': {},
                'health_indicator': 50
            }
    
    def _detect_lesions(self, gray_img: np.ndarray, hsv_img: np.ndarray) -> Dict:
        """Detect lesions or abnormalities on trunk"""
        try:
            # Use adaptive thresholding to find dark/bright spots
            blurred = cv2.GaussianBlur(gray_img, (5, 5), 0)
            
            # Detect dark spots (potential lesions, cankers)
            _, dark_thresh = cv2.threshold(blurred, 70, 255, cv2.THRESH_BINARY_INV)
            
            # Detect bright spots (fungal growth, exudates)
            _, bright_thresh = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY)
            
            # Detect color anomalies in HSV space
            # Unusual colors (e.g., pink, white, yellow)
            h = hsv_img[:,:,0]
            s = hsv_img[:,:,1]
            
            # Pink/reddish areas (potential pink disease)
            pink_mask = cv2.inRange(hsv_img, (160, 50, 50), (180, 255, 255))
            
            # White/yellow fungal areas
            fungal_mask = cv2.inRange(hsv_img, (20, 30, 180), (40, 100, 255))
            
            # Combine all detections
            combined = cv2.bitwise_or(dark_thresh, bright_thresh)
            combined = cv2.bitwise_or(combined, pink_mask)
            combined = cv2.bitwise_or(combined, fungal_mask)
            
            # Apply morphological operations to clean up
            kernel = np.ones((3, 3), np.uint8)
            combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel)
            combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter by size and analyze
            lesions = []
            lesion_types = []
            total_area = 0
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > 50:  # Minimum size threshold
                    lesions.append(cnt)
                    total_area += area
                    
                    # Classify lesion type
                    if area < 200:
                        lesion_types.append("Small spot")
                    elif area < 500:
                        lesion_types.append("Medium lesion")
                    else:
                        lesion_types.append("Large lesion area")
                    
                    # Check if it might be fungal (based on color)
                    x, y, w, h = cv2.boundingRect(cnt)
                    roi_hue = np.mean(hsv_img[y:y+h, x:x+w, 0])
                    if 160 <= roi_hue <= 180 or 20 <= roi_hue <= 40:
                        lesion_types.append("Possible fungal growth")
            
            # Calculate affected area percentage
            img_area = gray_img.shape[0] * gray_img.shape[1]
            affected_percentage = (total_area / img_area) * 100
            
            # Determine severity based on affected area
            if affected_percentage < 1:
                severity = "Minimal"
            elif affected_percentage < 5:
                severity = "Mild"
            elif affected_percentage < 15:
                severity = "Moderate"
            else:
                severity = "Severe"
            
            return {
                'detected': len(lesions) > 0,
                'count': len(lesions),
                'types': list(set(lesion_types))[:5],
                'affected_area_percentage': round(affected_percentage, 2),
                'severity': severity,
                'description': f'Found {len(lesions)} abnormal areas covering {affected_percentage:.1f}% of trunk'
            }
            
        except Exception as e:
            logger.error(f"Lesion detection failed: {e}")
            return {
                'detected': False,
                'count': 0,
                'types': [],
                'affected_area_percentage': 0,
                'severity': 'Unknown',
                'description': 'Lesion detection failed'
            }
    
    def _analyze_bark_condition(self, gray_img: np.ndarray, hsv_img: np.ndarray) -> Dict:
        """Analyze overall bark condition"""
        try:
            # Detect cracks (using edge detection)
            edges = cv2.Canny(gray_img, 50, 150)
            crack_density = np.sum(edges > 0) / edges.size
            
            # Detect peeling or damaged areas
            blurred = cv2.GaussianBlur(gray_img, (15, 15), 0)
            _, damaged = cv2.threshold(blurred, 180, 255, cv2.THRESH_BINARY)
            damaged_density = np.sum(damaged > 0) / damaged.size
            
            # Determine condition
            if crack_density < 0.05 and damaged_density < 0.1:
                condition = "Excellent"
                description = "Bark appears healthy with minimal damage"
            elif crack_density < 0.1 and damaged_density < 0.2:
                condition = "Good"
                description = "Normal bark condition for rubber tree"
            elif crack_density < 0.2 and damaged_density < 0.3:
                condition = "Fair"
                description = "Some bark deterioration visible"
            elif crack_density < 0.3 and damaged_density < 0.4:
                condition = "Poor"
                description = "Significant bark damage detected"
            else:
                condition = "Critical"
                description = "Severe bark deterioration, immediate attention needed"
            
            return {
                'condition': condition,
                'description': description,
                'metrics': {
                    'crack_density': round(float(crack_density), 3),
                    'damaged_area_density': round(float(damaged_density), 3)
                }
            }
            
        except Exception as e:
            logger.error(f"Bark condition analysis failed: {e}")
            return {
                'condition': 'Unknown',
                'description': 'Analysis failed',
                'metrics': {}
            }
    
    def _calculate_health_score(self, class_id: int, confidence: float,
                               visual_analysis: Optional[Dict],
                               class_name: Optional[str] = None,
                               severity: Optional[str] = None) -> float:
        """Calculate overall health score (0-100)"""
        label = class_name or self.class_names.get(class_id, '')
        normalized_label = self._normalize_class_label(label)
        if normalized_label in ['no detection', 'unknown'] and float(confidence) <= 0:
            return 0.0
        inferred_severity = str(severity or self._infer_generic_severity(label)).lower()
        is_diseased = self._is_diseased_label(label)

        if (not is_diseased) or ('none' in inferred_severity):
            base_score = 92
        elif 'critical' in inferred_severity:
            base_score = 22
        elif 'severe' in inferred_severity or inferred_severity in ['high', 'moderate to severe']:
            base_score = 35
        elif 'moderate' in inferred_severity or inferred_severity == 'medium':
            base_score = 52
        else:
            base_score = 68

        # Use confidence as weighting while avoiding collapse to near-zero scores.
        conf = max(0.0, min(1.0, float(confidence)))
        score = base_score * (0.55 + (0.45 * conf))
        
        # Adjust based on visual analysis if available
        if visual_analysis:
            # Lesion impact
            lesions = visual_analysis.get('lesions', {})
            if lesions.get('detected'):
                affected = lesions.get('affected_area_percentage', 0)
                score -= min(30, affected * 2)
            
            # Texture impact
            texture_health = visual_analysis.get('texture', {}).get('health_indicator', 50)
            score = score * (texture_health / 100)
            
            # Bark condition impact
            bark_condition = visual_analysis.get('bark_condition', {}).get('condition')
            if bark_condition == 'Poor':
                score *= 0.7
            elif bark_condition == 'Critical':
                score *= 0.4
            elif bark_condition == 'Fair':
                score *= 0.9
        
        # Ensure score is within 0-100
        return max(0, min(100, score))
    
    def _estimate_tree_age_from_visuals(self, visual_analysis: Dict) -> Dict:
        """Estimate tree age based on visual features"""
        try:
            texture = visual_analysis['texture']
            bark = visual_analysis['bark_condition']
            
            # Base age estimation from texture
            if texture['type'] in ['Very Smooth', 'Smooth']:
                base_age = 3
                age_range = "1-5 years"
                confidence = 60
            elif texture['type'] == 'Moderately Rough':
                base_age = 8
                age_range = "5-12 years"
                confidence = 70
            elif texture['type'] == 'Rough':
                base_age = 15
                age_range = "10-20 years"
                confidence = 75
            else:  # Very Rough / Cracked
                base_age = 20
                age_range = "15-30+ years"
                confidence = 65
            
            # Adjust based on bark condition
            if bark['condition'] == 'Excellent' and base_age > 10:
                # Well-maintained older tree
                confidence += 5
            elif bark['condition'] == 'Poor' and base_age < 8:
                # Young tree with poor condition
                confidence -= 10
            
            # Calculate estimated age with range
            estimated = base_age
            min_age = max(1, estimated - 3)
            max_age = estimated + 5
            
            return {
                'estimated_years': estimated,
                'range': f"{min_age}-{max_age} years",
                'confidence': round(confidence, 2),
                'basis': f"Based on {texture['type'].lower()} texture"
            }
            
        except Exception as e:
            logger.error(f"Age estimation failed: {e}")
            return {
                'estimated_years': 10,
                'range': "5-15 years",
                'confidence': 50,
                'basis': "Default estimation"
            }
    
    def _get_care_recommendations(self, disease_info: Dict, 
                                  health_score: float,
                                  visual_analysis: Optional[Dict]) -> List[str]:
        """Get prioritized care recommendations"""
        recommendations = []
        
        # Urgency-based recommendations
        if disease_info['urgency'] == 'critical':
            recommendations.append("🔴 CRITICAL: Immediate action required - Consult agricultural expert urgently")
            recommendations.append("🔴 Consider tree removal if more than 50% affected")
        elif disease_info['urgency'] == 'high':
            recommendations.append("🟠 HIGH PRIORITY: Take action within 1-2 weeks")
        elif disease_info['urgency'] == 'medium':
            recommendations.append("🟡 MEDIUM PRIORITY: Schedule treatment within the month")
        
        # Disease-specific treatment
        if disease_info['detected']:
            recommendations.append(f"💊 Treatment: {disease_info['treatment']}")
        
        # Health score based recommendations
        if health_score < 30:
            recommendations.append("⚠️ Tree health is critically low - Immediate intervention needed")
        elif health_score < 50:
            recommendations.append("⚠️ Tree health is poor - Active treatment required")
        elif health_score < 70:
            recommendations.append("📋 Tree health is fair - Continue monitoring and treatment")
        else:
            recommendations.append("✅ Tree health is good - Maintain regular care")
        
        # Visual analysis based recommendations
        if visual_analysis:
            if visual_analysis['lesions']['detected']:
                if visual_analysis['lesions']['severity'] in ['Moderate', 'Severe']:
                    recommendations.append("🔍 Monitor lesion areas weekly for changes")
            
            if visual_analysis['bark_condition']['condition'] in ['Poor', 'Critical']:
                recommendations.append("🛡️ Apply protective bark treatment")
        
        # General recommendations
        recommendations.extend([
            "💧 Ensure proper irrigation during dry periods",
            "🌱 Apply balanced fertilizer as per schedule",
            "📝 Document changes with regular photos",
            "👨‍🌾 Consult local agricultural extension for field visit"
        ])
        
        # Remove duplicates and return top 7
        seen = set()
        unique_recs = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recs.append(rec)
        
        return unique_recs[:7]
    
    def _create_visualization(self, img: np.ndarray, disease_info: Dict,
                             confidence: float, visual_analysis: Optional[Dict]) -> Optional[str]:
        """Create annotated visualization"""
        try:
            vis_img = img.copy()
            h, w = vis_img.shape[:2]
            
            # Create semi-transparent overlays
            overlay = vis_img.copy()
            
            # Top info bar
            cv2.rectangle(overlay, (0, 0), (w, 80), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, vis_img, 0.3, 0, vis_img)
            
            # Bottom status bar
            cv2.rectangle(overlay, (0, h-40), (w, h), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, vis_img, 0.3, 0, vis_img)
            
            # Add main text
            color = (0, 255, 0) if disease_info['name'] == 'Healthy' else (0, 0, 255)
            cv2.putText(vis_img, f"Condition: {disease_info['name']}", (20, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            cv2.putText(vis_img, f"Confidence: {disease_info['confidence']:.1f}%", (20, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Add severity
            if disease_info['detected']:
                cv2.putText(vis_img, f"Severity: {disease_info['severity']}", (w - 250, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
            
            # Add timestamp and watermark
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(vis_img, f"RubberSense | {timestamp}", (20, h-15),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            # Add model info
            cv2.putText(vis_img, f"Model: Trunks.pt", (w - 200, h-15),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            # Highlight lesions if detected
            if visual_analysis and visual_analysis['lesions']['detected']:
                # Simple circle markers at potential lesion areas
                # (In production, you'd draw actual contours)
                cv2.putText(vis_img, f"Lesions: {visual_analysis['lesions']['count']}", 
                           (w - 250, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', vis_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            return base64.b64encode(buffer).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Visualization creation failed: {e}")
            return None
    
    def _create_detection_visualization(self, img: np.ndarray, 
                                       detections: List[Dict]) -> Optional[str]:
        """Create visualization with bounding boxes for detection model"""
        try:
            vis_img = img.copy()
            
            # Define colors for different classes
            colors = {}
            for det in detections:
                class_id = det['class_id']
                if class_id not in colors:
                    # Generate consistent color based on class_id
                    hue = (class_id * 30) % 180
                    colors[class_id] = colorsys.hsv_to_rgb(hue/180, 1, 1)
                    colors[class_id] = tuple(int(x * 255) for x in colors[class_id])
            
            # Draw bounding boxes
            for det in detections:
                bbox = det['bbox']
                x1, y1, x2, y2 = map(int, bbox)
                color = colors.get(det['class_id'], (0, 255, 0))
                
                # Draw box
                cv2.rectangle(vis_img, (x1, y1), (x2, y2), color, 2)
                
                # Add label
                label = f"{det['display_name']} {det['confidence']:.1f}%"
                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                
                # Draw label background
                cv2.rectangle(vis_img, (x1, y1 - 25), (x1 + label_size[0], y1), color, -1)
                
                # Draw label text
                cv2.putText(vis_img, label, (x1, y1 - 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
            
            # Add title
            cv2.putText(vis_img, f"Detections: {len(detections)}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', vis_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            return base64.b64encode(buffer).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Detection visualization failed: {e}")
            return None
    
    def _heuristic_analysis(self, img: np.ndarray, return_visualization: bool) -> Dict:
        """Fallback heuristic analysis when model fails"""
        logger.info("🔧 Running heuristic analysis (model unavailable)...")
        
        # Basic visual analysis
        visual_analysis = self._analyze_visual_features(img)
        
        # Simple rule-based classification
        texture_type = visual_analysis['texture']['type']
        color_name = visual_analysis['color']['name']
        has_lesions = visual_analysis['lesions']['detected']
        bark_condition = visual_analysis['bark_condition']['condition']
        
        # Determine likely condition
        if not has_lesions and bark_condition in ['Excellent', 'Good']:
            condition = "Likely Healthy"
            confidence = 65
            class_id = 0
        elif has_lesions and texture_type in ['Very Rough / Cracked', 'Rough']:
            condition = "Possible Disease"
            confidence = 55
            class_id = 1
        elif bark_condition in ['Poor', 'Critical']:
            condition = "Damaged Bark"
            confidence = 60
            class_id = 5
        else:
            condition = "Requires Expert Inspection"
            confidence = 50
            class_id = 7
        
        # Get disease info
        disease_info = self._get_disease_info(class_id, confidence/100)
        disease_info['name'] = condition
        disease_info['description'] = f"Heuristic analysis: {condition}"
        
        # Calculate health score
        health_score = self._calculate_health_score(class_id, confidence/100, visual_analysis)
        
        # Get care recommendations
        care_recommendations = self._get_care_recommendations(
            disease_info, health_score, visual_analysis
        )
        
        # Estimate age
        age_estimation = self._estimate_tree_age_from_visuals(visual_analysis)
        
        # Create simple visualization
        visualization = None
        if return_visualization:
            vis_img = img.copy()
            cv2.putText(vis_img, f"Heuristic: {condition}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(vis_img, f"Confidence: {confidence}%", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            
            _, buffer = cv2.imencode('.jpg', vis_img)
            visualization = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "success": True,
            "model_used": False,
            "model_info": {
                "type": "Heuristic",
                "model_file": None,
                "note": "ML model unavailable - using rule-based analysis"
            },
            "primary_detection": {
                "class_id": class_id,
                "class_name": condition.lower().replace(' ', '_'),
                "display_name": condition,
                "confidence": confidence,
                "is_confident": confidence >= (self.confidence_threshold * 100),
                "health_status": "healthy" if class_id == 0 else "diseased"
            },
            "disease": disease_info,
            "visual_analysis": visual_analysis,
            "health_score": round(health_score, 2),
            "age_estimation": age_estimation,
            "care_recommendations": care_recommendations,
            "visualization": visualization,
            "note": "Heuristic analysis - ML model unavailable"
        }
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if self.model_loaded:
            return {
                "loaded": True,
                "model_path": self.model_path,
                "classes": list(self.class_names.values()),
                "num_classes": len(self.class_names),
                "type": "classification",
                "confidence_threshold": self.confidence_threshold
            }
        else:
            return {
                "loaded": False,
                "model_path": self.model_path,
                "error": "Model not loaded",
                "suggestion": "Ensure Trunks-v2.pt (or Trunks.pt) exists in RubberSense/backend/ML-models/"
            }
    
    def batch_analyze(self, image_paths: List[str], 
                     return_visualization: bool = False) -> List[Dict]:
        """Analyze multiple images in batch"""
        results = []
        for i, image_path in enumerate(image_paths):
            logger.info(f"Processing image {i+1}/{len(image_paths)}: {image_path}")
            result = self.analyze_trunk(image_path, return_visualization)
            results.append(result)
        return results


# ============================================
# COMMAND LINE INTERFACE
# ============================================

def main():
    """Command-line entry point for the trunks analyzer"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Missing arguments. Usage: python trunks_inference.py <image_path> [output_format] [model_path]"
        }))
        return
    
    image_input = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else "json"
    model_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        # Initialize analyzer with model from RubberSense path
        if not model_path:
            # Use default path for RubberSense
            base_dir = Path(__file__).parent
            while base_dir.name != "RubberSense" and base_dir.parent != base_dir:
                base_dir = base_dir.parent
            
            if base_dir.name == "RubberSense":
                model_path = str(base_dir / "backend" / "ML-models" / "Trunks-v2.pt")
            else:
                model_path = os.path.join(os.path.dirname(__file__), "Trunks-v2.pt")
        
        logger.info(f"🔧 Initializing analyzer with model: {model_path}")
        analyzer = RubberTreeTrunksAnalyzer(model_path)
        
        # Analyze image
        result = analyzer.analyze_trunk(image_input, return_visualization=True)
        
        # Output result
        if output_format == "pretty":
            print(json.dumps(result, indent=2))
        else:
            print(json.dumps(result))
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }))


if __name__ == "__main__":
    main()
