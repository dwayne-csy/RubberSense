#!/usr/bin/env python3
"""
Rubber Tree Leaf Disease Detection System
Uses trained YOLO model (leaf-v2.pt) for accurate leaf disease classification
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
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('leaf_inference')

# Try importing YOLO
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    logger.info("✅ Ultralytics YOLO imported successfully")
except ImportError as e:
    YOLO_AVAILABLE = False
    logger.error(f"❌ Ultralytics YOLO not installed: {e}")
    logger.error("Run: pip install ultralytics")

class RubberTreeLeafAnalyzer:
    """
    Main analyzer class for rubber tree leaf disease detection
    Uses trained leaf-v2.pt model for accurate classification
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the leaf analyzer with trained model
        
        Args:
            model_path: Path to the trained leaf model (.pt)
        """
        self.model = None
        self.model_path = model_path or self._get_default_model_path()
        self.class_names = []
        self.health_status = "unknown"
        self.confidence_threshold = 0.35  # Minimum confidence for reliable detection
        self.inference_conf = float(os.getenv('LEAF_MODEL_CONF', '0.10'))
        self.inference_iou = float(os.getenv('LEAF_MODEL_IOU', '0.70'))
        
        # Load model on initialization
        self._load_model()
        logger.info("✅ RubberTreeLeafAnalyzer initialized")
        
    def _get_default_model_path(self):
        """Get the default model path based on file location"""
        current_dir = Path(__file__).parent.absolute()
        candidates = [
            current_dir / "leaf-v2.pt",
            current_dir / "Leaf-v2.pt",
            current_dir / "Leaf-obb.pt",
            current_dir / "Leaf-detect.pt",
            current_dir / "leaf.pt",
            current_dir / "Leaf.pt",
        ]
        for candidate in candidates:
            if candidate.exists():
                return str(candidate)
        return str(current_dir / "leaf-v2.pt")

    def _model_task(self):
        """Return model task if available (classify/detect/obb/segment...)."""
        task = getattr(self.model, 'task', None)
        if task:
            return str(task).lower()
        model_obj = getattr(self.model, 'model', None)
        inner_task = getattr(model_obj, 'task', None)
        return str(inner_task).lower() if inner_task else 'unknown'

    def _get_class_name(self, class_id):
        """Safely map class index to class name for dict/list class maps."""
        try:
            idx = int(class_id)
        except Exception:
            return str(class_id)

        if isinstance(self.class_names, dict):
            return self.class_names.get(idx, f"class_{idx}")
        if isinstance(self.class_names, (list, tuple)):
            if 0 <= idx < len(self.class_names):
                return self.class_names[idx]
            return f"class_{idx}"
        return f"class_{idx}"
    
    def _load_model(self):
        """Load the YOLO model"""
        if not YOLO_AVAILABLE:
            logger.error("❌ YOLO not available. Cannot load model.")
            return False
            
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"❌ Model not found at: {self.model_path}")
                return False
                
            logger.info(f"📦 Loading model from: {self.model_path}")
            self.model = YOLO(self.model_path)
            
            # Get class names
            if hasattr(self.model, 'names'):
                self.class_names = self.model.names
                logger.info(f"📋 Model classes ({len(self.class_names)}): {self.class_names}")
            else:
                # Try to get from model task
                try:
                    self.class_names = self.model.model.names
                except:
                    # Default classes for rubber tree leaf diseases
                    self.class_names = {
                        0: "healthy",
                        1: "corynespora_leaf_spot",
                        2: "colletotrichum_leaf_spot",
                        3: "oidium_leaf_mildew",
                        4: "phytophthora_leaf_fall",
                        5: "fusicladium_leaf_spot"
                    }
                    logger.warning("⚠️ Using default class names")
                    
            logger.info(f"✅ Model loaded successfully from {self.model_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {str(e)}")
            logger.debug(traceback.format_exc())
            return False
    
    def preprocess_image(self, image_input):
        """
        Load and preprocess image from various input types
        
        Args:
            image_input: Path, URL, or numpy array of image
            
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
                len(image_input) > 100  # Likely base64
            ):
                try:
                    # Remove header if present
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
    
    def analyze_leaf(self, image_input, return_visualization=True):
        """
        Main method to analyze leaf image
        
        Args:
            image_input: Path, URL, or numpy array of leaf image
            return_visualization: Whether to return annotated image
            
        Returns:
            dict: Analysis results
        """
        # Load and preprocess image
        img = self.preprocess_image(image_input)
        if img is None:
            return {
                "success": False,
                "error": "Failed to load image",
                "disease_detection": None
            }
        
        # Perform inference
        if self.model is None:
            logger.warning("⚠️ Model not loaded, using heuristic analysis")
            return self._heuristic_analysis(img, return_visualization)
        
        try:
            logger.info("🔬 Running inference on leaf image...")
            
            # Run inference
            model_task = self._model_task()
            if model_task == 'classify':
                results = self.model(img, verbose=False)
            else:
                results = self.model(
                    img,
                    conf=self.inference_conf,
                    iou=self.inference_iou,
                    verbose=False
                )
            
            # Process results based on model type
            if hasattr(results[0], 'probs') and results[0].probs is not None:
                # Classification model
                logger.info("📊 Processing classification results")
                return self._process_classification_results(results, img, return_visualization)
            else:
                # Detection model (fallback)
                logger.info("📊 Processing detection/OBB results")
                return self._process_detection_results(results, img, return_visualization)
                
        except Exception as e:
            logger.error(f"❌ Inference failed: {str(e)}")
            logger.debug(traceback.format_exc())
            
            # Fallback to heuristic analysis
            logger.warning("⚠️ Falling back to heuristic analysis")
            return self._heuristic_analysis(img, return_visualization)
    
    def _process_classification_results(self, results, original_img, return_visualization):
        """Process classification model results"""
        try:
            probs = results[0].probs
            
            # Get top predictions
            top5_indices = probs.top5
            top5_confidences = probs.top5conf
            
            # Primary prediction
            primary_class_idx = probs.top1
            primary_class_name = self._get_class_name(primary_class_idx)
            # Clean class name for display
            display_name = primary_class_name.replace('_', ' ').title()
            primary_confidence = float(probs.top1conf) * 100
            
            logger.info(f"🎯 Primary prediction: {display_name} ({primary_confidence:.1f}%)")
            
            # Get all predictions for detailed analysis
            all_predictions = []
            for idx, conf in zip(top5_indices, top5_confidences):
                class_name = self._get_class_name(int(idx))
                pred_display_name = class_name.replace('_', ' ').title()
                all_predictions.append({
                    "class": pred_display_name,
                    "original_class": class_name,
                    "confidence": float(conf) * 100,
                    "index": int(idx)
                })
            
            # Determine health status
            is_healthy = 'healthy' in primary_class_name.lower()
            health_status = "healthy" if is_healthy else "diseased"
            
            # Determine severity
            severity = self._determine_severity(primary_class_name, primary_confidence)
            
            # Perform visual analysis (spot counting, color)
            visual_analysis = self._analyze_visual_features(original_img)
            
            # Create visualization if requested
            visualization = None
            if return_visualization:
                visualization = self._create_visualization(
                    original_img, 
                    display_name, 
                    primary_confidence,
                    visual_analysis['spot_count']
                )
            
            # Prepare response
            result = {
                "success": True,
                "disease_detection": {
                    "primary_disease": display_name,
                    "original_class": primary_class_name,
                    "confidence": round(primary_confidence, 2),
                    "health_status": health_status,
                    "severity": severity,
                    "all_predictions": all_predictions[:3],  # Top 3
                    "is_confident": primary_confidence >= (self.confidence_threshold * 100)
                },
                "visual_analysis": visual_analysis,
                "model_info": {
                    "type": "classification",
                    "classes": len(self.class_names),
                    "model_path": self.model_path,
                    "model_file": os.path.basename(self.model_path),
                    "task": self._model_task()
                }
            }
            
            if visualization:
                result["visualization"] = visualization
                
            return result
            
        except Exception as e:
            logger.error(f"❌ Result processing failed: {e}")
            return self._heuristic_analysis(original_img, return_visualization)
    
    def _process_detection_results(self, results, original_img, return_visualization):
        """Process detection model results (regular boxes or OBB)."""
        try:
            result0 = results[0]
            obb = getattr(result0, 'obb', None)
            boxes = getattr(result0, 'boxes', None)
            use_obb = obb is not None
            det_obj = obb if use_obb else boxes

            detections = []
            if det_obj is not None and len(det_obj) > 0:
                for i in range(len(det_obj)):
                    conf = float(det_obj.conf[i])
                    cls_id = int(det_obj.cls[i])
                    class_name = self._get_class_name(cls_id)
                    display_name = str(class_name).replace('_', ' ').replace('-', ' ').title()
                    polygon = None

                    if use_obb and hasattr(det_obj, 'xyxyxyxy'):
                        polygon = det_obj.xyxyxyxy[i].tolist()
                        xs = [float(pt[0]) for pt in polygon]
                        ys = [float(pt[1]) for pt in polygon]
                        x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
                    else:
                        x1, y1, x2, y2 = det_obj.xyxy[i].tolist()

                    row = {
                        "class": display_name,
                        "original_class": class_name,
                        "confidence": conf * 100,
                        "bbox": [int(x1), int(y1), int(x2), int(y2)]
                    }
                    if polygon is not None:
                        row["obb_polygon"] = [[round(float(x), 2), round(float(y), 2)] for x, y in polygon]
                    detections.append(row)

            detections.sort(key=lambda d: d.get("confidence", 0), reverse=True)

            # Determine primary detection
            primary_detection = detections[0] if detections else {
                "class": "No Detection",
                "original_class": "no_detection",
                "confidence": 0,
                "bbox": None
            }

            # Visual analysis
            visual_analysis = self._analyze_visual_features(original_img)

            # Determine health + severity
            original_class_lower = str(primary_detection.get("original_class", "unknown")).lower()
            is_healthy = any(token in original_class_lower for token in ["healthy", "normal", "no_detection"])
            severity = self._determine_severity(
                primary_detection.get("original_class", "unknown"),
                primary_detection.get("confidence", 0)
            )

            # Create visualization
            visualization = None
            if return_visualization:
                visualization = self._create_detection_visualization(original_img, detections)

            result = {
                "success": True,
                "disease_detection": {
                    "primary_disease": primary_detection["class"],
                    "original_class": primary_detection["original_class"],
                    "confidence": round(primary_detection["confidence"], 2),
                    "health_status": "healthy" if is_healthy else "diseased",
                    "severity": severity,
                    "detections": detections,
                    "all_predictions": [
                        {
                            "class": d.get("class", "Unknown"),
                            "original_class": d.get("original_class", "unknown"),
                            "confidence": round(float(d.get("confidence", 0)), 2)
                        }
                        for d in detections[:5]
                    ],
                    "detection_count": len(detections),
                    "is_confident": primary_detection["confidence"] >= (self.confidence_threshold * 100)
                },
                "visual_analysis": visual_analysis,
                "model_info": {
                    "type": "obb_detection" if use_obb else "detection",
                    "classes": len(self.class_names),
                    "model_path": self.model_path,
                    "model_file": os.path.basename(self.model_path),
                    "task": self._model_task(),
                    "detection_count": len(detections),
                    "inference_conf": self.inference_conf,
                    "inference_iou": self.inference_iou
                }
            }

            if visualization:
                result["visualization"] = visualization

            return result

        except Exception as e:
            logger.error(f"? Detection processing failed: {e}")
            return self._heuristic_analysis(original_img, return_visualization)
    def _heuristic_analysis(self, img, return_visualization):
        """Fallback heuristic analysis when model fails"""
        logger.info("🔧 Running heuristic analysis...")
        
        # Basic visual analysis
        visual_analysis = self._analyze_visual_features(img)
        
        # Simple rule-based classification
        spot_count = visual_analysis['spot_count']
        dominant_color = visual_analysis['dominant_color']
        
        # Determine likely condition based on spots and color
        if spot_count == 0 and dominant_color == 'green':
            disease = "Healthy (Heuristic)"
            health = "healthy"
            severity = "none"
            confidence = 60
        elif spot_count < 10:
            disease = "Minor Spots (Heuristic)"
            health = "diseased"
            severity = "low"
            confidence = 50
        elif spot_count < 30:
            disease = "Moderate Leaf Spot (Heuristic)"
            health = "diseased"
            severity = "moderate"
            confidence = 55
        else:
            disease = "Severe Leaf Disease (Heuristic)"
            health = "diseased"
            severity = "high"
            confidence = 60
        
        # Create simple visualization
        visualization = None
        if return_visualization:
            vis_img = img.copy()
            cv2.putText(vis_img, f"Heuristic: {disease}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(vis_img, f"Spots: {spot_count}", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', vis_img)
            visualization = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "success": True,
            "disease_detection": {
                "primary_disease": disease,
                "confidence": confidence,
                "health_status": health,
                "severity": severity,
                "all_predictions": [
                    {"class": disease, "confidence": confidence}
                ],
                "is_confident": False,
                "note": "Heuristic analysis - ML model unavailable"
            },
            "visual_analysis": visual_analysis,
            "visualization": visualization,
            "is_heuristic": True
        }
    
    def _analyze_visual_features(self, img):
        """
        Analyze visual features of the leaf (spots, color, texture)
        
        Args:
            img: numpy array of leaf image
            
        Returns:
            dict: Visual analysis results
        """
        try:
            # Convert to different color spaces
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # 1. Spot detection
            spot_count, spot_areas, spot_mask = self._detect_spots(gray)
            
            # 2. Color analysis
            dominant_color, color_percentages = self._analyze_colors(hsv)
            
            # 3. Texture analysis
            texture = self._analyze_texture(gray)
            
            # 4. Leaf area estimation
            leaf_mask = self._create_leaf_mask(hsv)
            leaf_area_percentage = np.sum(leaf_mask > 0) / leaf_mask.size * 100 if leaf_mask.size > 0 else 100
            
            return {
                "spot_count": spot_count,
                "spot_areas": spot_areas[:10] if spot_areas else [],  # Top 10 areas
                "spot_mask_available": spot_mask is not None,
                "dominant_color": dominant_color,
                "color_distribution": color_percentages,
                "texture": texture,
                "leaf_coverage": round(leaf_area_percentage, 2),
                "has_significant_spots": spot_count > 10,
                "image_dimensions": {
                    "height": img.shape[0],
                    "width": img.shape[1],
                    "channels": img.shape[2] if len(img.shape) > 2 else 1
                }
            }
            
        except Exception as e:
            logger.error(f"Visual analysis failed: {e}")
            return {
                "spot_count": 0,
                "spot_areas": [],
                "dominant_color": "unknown",
                "color_distribution": {},
                "texture": "unknown",
                "leaf_coverage": 100,
                "has_significant_spots": False,
                "error": str(e)
            }
    
    def _detect_spots(self, gray_img):
        """Detect and count spots on leaf"""
        try:
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray_img, (5, 5), 0)
            
            # Use adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                blurred, 255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV, 11, 2
            )
            
            # Morphological operations to clean up
            kernel = np.ones((3, 3), np.uint8)
            cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=1)
            
            # Find contours
            contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter by area
            min_spot_area = 15
            max_spot_area = 800
            
            valid_spots = []
            areas = []
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if min_spot_area < area < max_spot_area:
                    # Check circularity (spots are roughly circular)
                    perimeter = cv2.arcLength(cnt, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                        if circularity > 0.3:  # Reasonably circular
                            valid_spots.append(cnt)
                            areas.append(round(area, 2))
            
            # Create spot mask for visualization
            spot_mask = np.zeros(gray_img.shape, dtype=np.uint8)
            cv2.drawContours(spot_mask, valid_spots, -1, 255, -1)
            
            logger.debug(f"🔍 Detected {len(valid_spots)} spots")
            return len(valid_spots), areas, spot_mask
            
        except Exception as e:
            logger.error(f"Spot detection failed: {e}")
            return 0, [], None
    
    def _analyze_colors(self, hsv_img):
        """Analyze color distribution in HSV space"""
        try:
            # Define color ranges in HSV
            color_ranges = {
                "green": ([35, 40, 40], [85, 255, 255]),
                "yellow": ([20, 40, 40], [35, 255, 255]),
                "brown": ([10, 40, 20], [20, 255, 150]),
                "dark_spots": ([0, 0, 0], [180, 255, 80]),
                "red": ([0, 40, 40], [10, 255, 255]),
                "orange": ([10, 40, 40], [20, 255, 255])
            }
            
            total_pixels = hsv_img.shape[0] * hsv_img.shape[1]
            color_percentages = {}
            
            for color_name, (lower, upper) in color_ranges.items():
                mask = cv2.inRange(hsv_img, np.array(lower), np.array(upper))
                color_pixels = np.sum(mask > 0)
                percentage = (color_pixels / total_pixels) * 100
                color_percentages[color_name] = round(percentage, 2)
            
            # Determine dominant color
            dominant = max(color_percentages, key=color_percentages.get)
            
            return dominant, color_percentages
            
        except Exception as e:
            logger.error(f"Color analysis failed: {e}")
            return "unknown", {}
    
    def _analyze_texture(self, gray_img):
        """Analyze leaf texture"""
        try:
            # Calculate variance of Laplacian (edge density)
            laplacian = cv2.Laplacian(gray_img, cv2.CV_64F)
            variance = laplacian.var()
            
            if variance < 100:
                return "smooth"
            elif variance < 300:
                return "moderate"
            elif variance < 600:
                return "rough"
            else:
                return "very rough/spotted"
                
        except Exception as e:
            logger.error(f"Texture analysis failed: {e}")
            return "unknown"
    
    def _create_leaf_mask(self, hsv_img):
        """Create mask to separate leaf from background"""
        try:
            # Green color range for rubber tree leaves
            lower_green = np.array([35, 40, 40])
            upper_green = np.array([85, 255, 255])
            
            mask = cv2.inRange(hsv_img, lower_green, upper_green)
            
            # Clean up mask
            kernel = np.ones((5, 5), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            
            return mask
            
        except Exception as e:
            logger.error(f"Leaf mask creation failed: {e}")
            return np.ones((hsv_img.shape[0], hsv_img.shape[1]), dtype=np.uint8) * 255
    
    def _determine_severity(self, disease_name, confidence):
        """Determine severity based on disease and confidence"""
        disease_lower = disease_name.lower()
        
        if 'healthy' in disease_lower:
            return "none"
        
        # Severity based on disease type
        severe_diseases = ['blight', 'phytophthora', 'anthracnose', 'canker']
        moderate_diseases = ['spot', 'mildew', 'mold', 'rust']
        
        if any(d in disease_lower for d in severe_diseases):
            base_severity = "high"
        elif any(d in disease_lower for d in moderate_diseases):
            base_severity = "moderate"
        else:
            base_severity = "low"
        
        # Adjust by confidence
        if confidence > 85:
            return base_severity
        elif confidence > 60:
            return base_severity
        else:
            return "low"  # Conservative when uncertain
    
    def _create_visualization(self, img, disease_name, confidence, spot_count):
        """Create annotated visualization"""
        try:
            vis_img = img.copy()
            
            # Add text overlay with background
            h, w = vis_img.shape[:2]
            
            # Semi-transparent background for text
            overlay = vis_img.copy()
            cv2.rectangle(overlay, (10, 10), (450, 120), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, vis_img, 0.4, 0, vis_img)
            
            # Add text
            cv2.putText(vis_img, f"Disease: {disease_name}", (20, 35),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(vis_img, f"Confidence: {confidence:.1f}%", (20, 65),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(vis_img, f"Spots Detected: {spot_count}", (20, 95),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Draw spots if we have them (using spot detection)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, _, spot_mask = self._detect_spots(gray)
            
            if spot_mask is not None:
                # Find contours from spot mask
                contours, _ = cv2.findContours(spot_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cv2.drawContours(vis_img, contours, -1, (0, 0, 255), 2)
            
            # Add timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(vis_img, timestamp, (w - 200, h - 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', vis_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return img_base64
            
        except Exception as e:
            logger.error(f"Visualization creation failed: {e}")
            return None
    
    def _create_detection_visualization(self, img, detections):
        """Create visualization with bounding boxes"""
        try:
            vis_img = img.copy()
            
            for det in detections:
                if det.get('bbox'):
                    x1, y1, x2, y2 = det['bbox']
                    color = (0, 255, 0) if 'healthy' in det['original_class'].lower() else (0, 0, 255)

                    # Draw polygon for OBB when present, otherwise axis-aligned rectangle.
                    if det.get('obb_polygon'):
                        pts = np.array(det['obb_polygon'], dtype=np.int32).reshape((-1, 1, 2))
                        cv2.polylines(vis_img, [pts], True, color, 2)
                    else:
                        cv2.rectangle(vis_img, (x1, y1), (x2, y2), color, 2)
                    
                    # Label background
                    label = f"{det['class']} ({det['confidence']:.1f}%)"
                    (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    cv2.rectangle(vis_img, (x1, y1-20), (x1+text_w, y1), color, -1)
                    
                    # Label text
                    cv2.putText(vis_img, label, (x1, y1-5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', vis_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            return base64.b64encode(buffer).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Detection visualization failed: {e}")
            return None
    
    def get_model_info(self):
        """Get information about the loaded model"""
        if self.model:
            model_task = self._model_task()
            class_values = (
                list(self.class_names.values())
                if isinstance(self.class_names, dict)
                else list(self.class_names or [])
            )
            return {
                "loaded": True,
                "model_path": self.model_path,
                "model_file": os.path.basename(self.model_path),
                "classes": class_values,
                "num_classes": len(self.class_names),
                "task": model_task,
                "type": "classification" if model_task == "classify" else ("obb_detection" if model_task == "obb" else "detection")
            }
        else:
            return {
                "loaded": False,
                "model_path": self.model_path,
                "error": "Model not loaded"
            }


# ============================================
# COMMAND LINE INTERFACE
# ============================================

def main():
    """Command-line entry point for the leaf analyzer"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Missing arguments. Usage: python leaf_inference.py <image_path> [output_format] [model_path]"
        }))
        return
    
    image_input = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else "json"
    model_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        # Initialize analyzer with explicit or default model path
        analyzer = RubberTreeLeafAnalyzer(model_path)
        
        # Analyze image
        result = analyzer.analyze_leaf(image_input, return_visualization=True)
        
        # Output result
        if output_format == "json":
            print(json.dumps(result))
        else:
            # Pretty print for debugging
            print(json.dumps(result, indent=2))
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }))


if __name__ == "__main__":
    main()

