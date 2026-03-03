#!/usr/bin/env python3
"""
Rubber Tree Latex Quality Analysis System
Uses trained YOLO model for accurate latex quality classification
Integrated with RubberSense backend ML models
"""

import os
import sys
import json
import base64
import argparse
import numpy as np
import cv2
from pathlib import Path
import logging
import traceback
import warnings
import datetime
import colorsys
import hashlib
from typing import Optional, Dict, Any, Union, List
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('latex_inference')

# Try importing YOLO
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    logger.info("✅ Ultralytics YOLO imported successfully")
except ImportError as e:
    YOLO_AVAILABLE = False
    logger.error(f"❌ Ultralytics YOLO not installed: {e}")
    logger.error("Run: pip install ultralytics")


class RubberTreeLatexAnalyzer:
    """
    Main analyzer class for rubber tree latex quality assessment
    Uses trained Latex-v2.pt model for accurate quality classification
    Integrated with RubberSense backend ML models
    """
    
    # Define class mappings for latex quality
    LATEX_CLASSES = {
        0: {
            "name": "high_quality_latex",
            "display_name": "Premium Latex",
            "quality_class": "High Class",
            "drc_range": (80, 95),
            "price_multiplier": 1.3,
            "color_profile": "pure_white",
            "characteristics": ["Pure white", "Creamy consistency", "High purity"]
        },
        1: {
            "name": "medium_quality_latex",
            "display_name": "Standard Latex",
            "quality_class": "Medium Class",
            "drc_range": (60, 79),
            "price_multiplier": 1.0,
            "color_profile": "off_white",
            "characteristics": ["Off-white", "Good consistency", "Standard grade"]
        },
        2: {
            "name": "low_quality_latex",
            "display_name": "Basic Latex",
            "quality_class": "Low Class",
            "drc_range": (40, 59),
            "price_multiplier": 0.7,
            "color_profile": "yellowish",
            "characteristics": ["Yellowish tint", "Thinner consistency", "Lower grade"]
        },
        3: {
            "name": "contaminated_latex",
            "display_name": "Contaminated Latex",
            "quality_class": "Low Class",
            "drc_range": (20, 39),
            "price_multiplier": 0.4,
            "color_profile": "dark",
            "characteristics": ["Visible impurities", "Discolored", "Needs purification"]
        },
        4: {
            "name": "watery_latex",
            "display_name": "Watery Latex",
            "quality_class": "Low Class",
            "drc_range": (15, 25),
            "price_multiplier": 0.3,
            "color_profile": "translucent",
            "characteristics": ["High water content", "Thin consistency", "Low concentration"]
        },
        5: {
            "name": "coagulated_latex",
            "display_name": "Coagulated Latex",
            "quality_class": "Medium Class",
            "drc_range": (65, 80),
            "price_multiplier": 0.8,
            "color_profile": "lumpy",
            "characteristics": ["Partially coagulated", "Lumpy texture", "Requires processing"]
        }
    }
    
    # Regional market prices (PHP per kg)
    REGIONAL_PRICES = {
        "thailand": {"high": 195, "medium": 130, "low": 75},
        "indonesia": {"high": 180, "medium": 120, "low": 70},
        "malaysia": {"high": 190, "medium": 125, "low": 72},
        "vietnam": {"high": 175, "medium": 115, "low": 68},
        "india": {"high": 170, "medium": 110, "low": 65},
        "global_avg": {"high": 182, "medium": 120, "low": 70}
    }
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the latex analyzer with trained model
        
        Args:
            model_path: Path to the trained Latex model (.pt)
        """
        self.model = None
        self.model_path = model_path or self._get_default_model_path()
        self.class_names = {}
        self.class_info = self.LATEX_CLASSES
        self.quality_status = "unknown"
        self.confidence_threshold = 0.35  # Minimum confidence for reliable detection
        self.model_metadata = {}
        
        # Load model on initialization
        self._load_model()
        logger.info("✅ RubberTreeLatexAnalyzer initialized")

    def _build_class_profile_from_name(self, class_name: str) -> Dict[str, Any]:
        """Infer class profile from model class label."""
        normalized = class_name.lower().replace('-', ' ').replace('_', ' ')

        if any(term in normalized for term in ['water', 'watery', 'dilute']):
            return {
                "name": class_name,
                "display_name": "Watery Latex",
                "quality_class": "Low Class",
                "drc_range": (15, 35),
                "price_multiplier": 0.35,
                "color_profile": "translucent",
                "characteristics": ["High water content", "Low concentration", "Needs reprocessing"]
            }

        if any(term in normalized for term in ['contaminated', 'contamination', 'impure', 'dirty']):
            return {
                "name": class_name,
                "display_name": "Contaminated Latex",
                "quality_class": "Low Class",
                "drc_range": (20, 40),
                "price_multiplier": 0.45,
                "color_profile": "dark",
                "characteristics": ["Visible impurities", "Discolored", "Requires purification"]
            }

        if any(term in normalized for term in ['coagulated', 'coagulation', 'lump']):
            return {
                "name": class_name,
                "display_name": "Coagulated Latex",
                "quality_class": "Medium Class",
                "drc_range": (55, 75),
                "price_multiplier": 0.8,
                "color_profile": "lumpy",
                "characteristics": ["Partial coagulation", "Uneven texture", "Requires filtering"]
            }

        if any(term in normalized for term in ['yellow', 'oxidized', 'aged']):
            return {
                "name": class_name,
                "display_name": "Yellow Latex",
                "quality_class": "Medium Class",
                "drc_range": (45, 65),
                "price_multiplier": 0.75,
                "color_profile": "yellowish",
                "characteristics": ["Oxidation signs", "Reduced purity", "Moderate quality"]
            }

        if any(term in normalized for term in ['white', 'premium', 'high', 'pure']):
            return {
                "name": class_name,
                "display_name": "White Latex",
                "quality_class": "High Class",
                "drc_range": (75, 92),
                "price_multiplier": 1.2,
                "color_profile": "pure_white",
                "characteristics": ["Clean latex", "High purity", "Suitable for premium products"]
            }

        return {
            "name": class_name,
            "display_name": self._format_class_name(class_name),
            "quality_class": "Medium Class",
            "drc_range": (40, 75),
            "price_multiplier": 0.9,
            "color_profile": "unknown",
            "characteristics": ["Model-defined class"]
        }
        
    def _get_default_model_path(self) -> str:
        """Get default model path, preferring Latex-v2.pt then Latex.pt."""
        current_dir = Path(__file__).parent
        base_dirs = [
            current_dir / "RubberSense" / "backend" / "ML-models",
            current_dir / "backend" / "ML-models",
            current_dir / "ML-models",
            current_dir,
            Path("/app/backend/ML-models"),
        ]
        candidate_names = ["Latex-v2.pt", "Latex.pt"]

        for base_dir in base_dirs:
            for filename in candidate_names:
                model_candidate = base_dir / filename
                if model_candidate.exists():
                    logger.info(f"✅ Found model at: {model_candidate}")
                    return str(model_candidate)

        # Return the preferred default path even if not found yet.
        return str(current_dir / "RubberSense" / "backend" / "ML-models" / "Latex-v2.pt")
    
    def _load_model(self) -> bool:
        """Load the YOLO model with enhanced metadata extraction"""
        if not YOLO_AVAILABLE:
            logger.error("❌ YOLO not available. Cannot load model.")
            return False
            
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"❌ Model not found at: {self.model_path}")
                logger.info(f"📁 Current directory: {os.getcwd()}")
                logger.info(f"📁 File directory: {Path(__file__).parent}")
                return False
                
            logger.info(f"📦 Loading model from: {self.model_path}")
            
            # Get file info
            model_stats = os.stat(self.model_path)
            self.model_metadata = {
                "file_size_mb": round(model_stats.st_size / (1024 * 1024), 2),
                "modified": datetime.datetime.fromtimestamp(model_stats.st_mtime).isoformat(),
                "path": self.model_path
            }
            
            # Load model
            self.model = YOLO(self.model_path)
            
            # Extract model info
            if hasattr(self.model, 'names'):
                self.class_names = self.model.names
                logger.info(f"📋 Model classes ({len(self.class_names)}): {self.class_names}")

                # Override class mapping from actual model labels (not fixed indices)
                self.class_info = {}
                for idx, name in self.class_names.items():
                    self.class_info[idx] = self._build_class_profile_from_name(str(name))
            else:
                # Use default class info
                self.class_names = {i: info["name"] for i, info in self.class_info.items()}
                logger.warning("⚠️ Using default class names")
            
            # Extract additional model metadata
            if hasattr(self.model, 'model') and hasattr(self.model.model, 'yaml'):
                self.model_metadata['architecture'] = self.model.model.yaml.get('backbone', 'unknown')
            
            logger.info(f"✅ Model loaded successfully from {self.model_path}")
            logger.info(f"📊 Model size: {self.model_metadata['file_size_mb']} MB")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {str(e)}")
            logger.debug(traceback.format_exc())
            return False
    
    def preprocess_image(self, image_input: Union[str, np.ndarray, bytes]) -> Optional[np.ndarray]:
        """
        Load and preprocess image from various input types
        
        Args:
            image_input: Path, URL, numpy array, or bytes of image
            
        Returns:
            numpy array: Preprocessed image
        """
        img = None
        
        try:
            # Case 1: Already numpy array
            if isinstance(image_input, np.ndarray):
                img = image_input
                logger.debug("✅ Image from numpy array")
                
            # Case 2: Bytes object
            elif isinstance(image_input, bytes):
                img_array = np.frombuffer(image_input, np.uint8)
                img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                if img is None:
                    raise ValueError("Failed to decode bytes image")
                logger.debug("✅ Image loaded from bytes")
                
            # Case 3: File path
            elif isinstance(image_input, str) and os.path.exists(image_input):
                img = cv2.imread(image_input)
                if img is None:
                    raise ValueError(f"Failed to read image from path: {image_input}")
                logger.debug(f"✅ Image loaded from path: {image_input}")
                
            # Case 4: Base64 string
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
                    
            # Case 5: URL
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
                
            # Convert BGR to RGB if needed (YOLO expects RGB)
            if len(img.shape) == 3 and img.shape[2] == 3:
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            else:
                img_rgb = img
            
            # Resize if too large (for performance)
            h, w = img_rgb.shape[:2]
            if max(h, w) > 1280:
                scale = 1280 / max(h, w)
                new_w = int(w * scale)
                new_h = int(h * scale)
                img_rgb = cv2.resize(img_rgb, (new_w, new_h))
                logger.debug(f"📏 Resized image to {new_w}x{new_h}")
                
            return img_rgb
            
        except Exception as e:
            logger.error(f"❌ Image preprocessing failed: {str(e)}")
            logger.debug(traceback.format_exc())
            return None
    
    def analyze_latex(self, 
                     image_input: Union[str, np.ndarray, bytes], 
                     return_visualization: bool = True,
                     region: str = "global_avg") -> Dict[str, Any]:
        """
        Main method to analyze latex image using trained model
        
        Args:
            image_input: Path, URL, numpy array, or bytes of latex image
            return_visualization: Whether to return annotated image
            region: Market region for price calculation
            
        Returns:
            dict: Comprehensive analysis results
        """
        # Load and preprocess image
        img = self.preprocess_image(image_input)
        if img is None:
            return {
                "success": False,
                "error": "Failed to load image",
                "latex_analysis": None,
                "timestamp": datetime.datetime.now().isoformat()
            }
        
        # Perform inference with trained model
        if self.model is None:
            logger.warning("⚠️ Model not loaded, using heuristic analysis")
            return self._heuristic_analysis(img, return_visualization)
        
        try:
            logger.info(f"🔬 Running inference with trained {os.path.basename(self.model_path)} model...")
            
            # Run inference with optimized parameters
            results = self.model(
                img, 
                verbose=False,
                conf=self.confidence_threshold,
                iou=0.45,
                max_det=1  # Only need top detection for classification
            )
            
            # Process results from trained model
            return self._process_classification_results(
                results, img, return_visualization, region, image_input
            )
                
        except Exception as e:
            logger.error(f"❌ Inference failed: {str(e)}")
            logger.debug(traceback.format_exc())
            
            # Fallback to heuristic analysis
            logger.warning("⚠️ Falling back to heuristic analysis")
            return self._heuristic_analysis(img, return_visualization)
    
    def _process_classification_results(self, 
                                       results, 
                                       original_img: np.ndarray, 
                                       return_visualization: bool,
                                       region: str,
                                       image_input: Optional[Union[str, np.ndarray, bytes]] = None) -> Dict[str, Any]:
        """Process classification results from trained model"""
        try:
            # Get predictions
            probs = results[0].probs
            
            if probs is None:
                # Handle detection model instead of classification
                return self._process_detection_results(
                    results,
                    original_img,
                    return_visualization,
                    region,
                    image_input=image_input
                )
            
            # Get top predictions
            top5_indices = probs.top5
            top5_confidences = probs.top5conf
            
            # Primary prediction
            primary_class_idx = int(probs.top1)
            primary_class_name = self.class_names.get(primary_class_idx, f"class_{primary_class_idx}")
            
            # Get detailed class info
            class_details = self.class_info.get(primary_class_idx, {})
            display_name = class_details.get("display_name", self._format_class_name(primary_class_name))
            quality_class = class_details.get("quality_class", "Standard Class")
            
            primary_confidence = float(probs.top1conf) * 100
            
            logger.info(f"🎯 Primary prediction: {display_name} ({primary_confidence:.1f}%)")
            
            # Get all predictions for detailed analysis
            all_predictions = []
            for idx, conf in zip(top5_indices, top5_confidences):
                idx = int(idx)
                class_name = self.class_names.get(idx, f"class_{idx}")
                details = self.class_info.get(idx, {})
                all_predictions.append({
                    "class": details.get("display_name", self._format_class_name(class_name)),
                    "original_class": class_name,
                    "confidence": float(conf) * 100,
                    "index": idx,
                    "quality_class": details.get("quality_class", "Unknown"),
                    "characteristics": details.get("characteristics", [])
                })
            
            # Determine quality and contamination
            quality_info = self._determine_quality_from_model(primary_class_idx, primary_confidence)
            
            # Perform visual analysis
            visual_analysis = self._analyze_visual_features(original_img)
            
            # Calculate dry rubber content using class-specific range
            drc = self._calculate_drc_from_model(
                primary_class_idx, 
                primary_confidence, 
                visual_analysis
            )
            
            # Estimate quantity
            quantity_estimation = self._estimate_quantity(original_img, display_name)
            
            # Get product recommendations
            product_recommendations = self._get_product_recommendations(
                quality_class, 
                quality_info['has_contamination'],
                primary_class_idx
            )
            
            # Calculate market price with regional adjustment
            estimated_volume_ml = quantity_estimation.get('estimated_volume_ml', 0.0)
            market_price = self._calculate_market_price_regional(
                quality_class,
                estimated_volume_ml,
                drc,
                region
            )
            
            # Generate unique analysis ID
            analysis_id = hashlib.md5(
                f"{datetime.datetime.now().isoformat()}{primary_confidence}".encode()
            ).hexdigest()[:8]
            
            # Create visualization if requested
            visualization = None
            if return_visualization:
                visualization = self._create_enhanced_visualization(
                    original_img, 
                    display_name, 
                    primary_confidence,
                    visual_analysis,
                    class_details
                )
            
            # Prepare comprehensive response
            result = {
                "success": True,
                "analysis_id": analysis_id,
                "timestamp": datetime.datetime.now().isoformat(),
                "ml_model_used": True,
                "model_info": {
                    "type": "YOLO Classification",
                    "model_path": self.model_path,
                    "model_file": os.path.basename(self.model_path),
                    "model_size_mb": self.model_metadata.get('file_size_mb', 0),
                    "num_classes": len(self.class_names),
                    "classes_detected": [p["class"] for p in all_predictions[:3]]
                },
                "latex_analysis": {
                    "primary_classification": {
                        "class": display_name,
                        "quality_class": quality_class,
                        "confidence": round(primary_confidence, 2),
                        "is_confident": primary_confidence >= (self.confidence_threshold * 100),
                        "characteristics": class_details.get("characteristics", [])
                    },
                    "quality_score": round(primary_confidence, 2),
                    "quality_class": quality_class,
                    "contamination": {
                        "detected": quality_info['has_contamination'],
                        "probability": round(quality_info['contamination_prob'], 2),
                        "type": quality_info.get('contamination_type', 'none')
                    },
                    "dry_rubber_content": round(drc, 2),
                    "drc_category": self._categorize_drc(drc),
                    "color_analysis": visual_analysis['color_analysis'],
                    "consistency": visual_analysis['consistency'],
                    "impurities": visual_analysis['impurities'],
                    "quantity_estimation": quantity_estimation,
                    "estimated_yield": self._estimate_yield(estimated_volume_ml, drc)
                },
                "product_recommendations": {
                    "recommended_products": product_recommendations,
                    "processing_required": quality_info['has_contamination'],
                    "suggested_applications": self._get_applications(quality_class, drc)
                },
                "market_analysis": market_price,
                "all_predictions": all_predictions,
                "visualization": visualization
            }
            
            # Add image metadata if input is a file path
            if isinstance(image_input, str) and os.path.exists(image_input):
                image_stats = os.stat(image_input)
                result["image_metadata"] = {
                    "filename": os.path.basename(image_input),
                    "file_size_kb": round(image_stats.st_size / 1024, 1),
                    "analyzed_at": result["timestamp"]
                }
                
            return result
            
        except Exception as e:
            logger.error(f"❌ Result processing failed: {e}")
            logger.debug(traceback.format_exc())
            return self._heuristic_analysis(original_img, return_visualization)
    
    def _process_detection_results(self,
                                   results,
                                   original_img,
                                   return_visualization,
                                   region,
                                   image_input: Optional[Union[str, np.ndarray, bytes]] = None):
        """Handle detection model results (regular boxes or OBB)."""
        try:
            result0 = results[0]
            obb = getattr(result0, 'obb', None)
            boxes = getattr(result0, 'boxes', None)
            use_obb = obb is not None and len(obb) > 0
            detections_obj = obb if use_obb else boxes

            if detections_obj is None or len(detections_obj) == 0:
                return {
                    "success": False,
                    "error": "Detected part non-latex only. Please capture a clear latex sample image and try again.",
                    "timestamp": datetime.datetime.now().isoformat(),
                    "ml_model_used": True,
                    "model_info": {
                        "type": "YOLO OBB Detection" if use_obb else "YOLO Detection",
                        "model_path": self.model_path,
                        "model_file": os.path.basename(self.model_path),
                        "num_classes": len(self.class_names),
                        "task": "obb_detection" if use_obb else "detection",
                        "detection_count": 0
                    }
                }

            detections = []
            for i in range(len(detections_obj)):
                cls_id = int(detections_obj.cls[i])
                confidence = float(detections_obj.conf[i]) * 100
                class_name = self.class_names.get(cls_id, f"class_{cls_id}")
                class_details = self.class_info.get(cls_id, self._build_class_profile_from_name(str(class_name)))
                display_name = class_details.get("display_name", self._format_class_name(str(class_name)))
                polygon = None

                if use_obb and hasattr(detections_obj, 'xyxyxyxy'):
                    polygon = detections_obj.xyxyxyxy[i].tolist()
                    xs = [float(pt[0]) for pt in polygon]
                    ys = [float(pt[1]) for pt in polygon]
                    x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
                else:
                    x1, y1, x2, y2 = detections_obj.xyxy[i].tolist()

                bbox = [int(x1), int(y1), int(x2), int(y2)]
                area_px = max(0, bbox[2] - bbox[0]) * max(0, bbox[3] - bbox[1])

                row = {
                    "class_id": cls_id,
                    "class": display_name,
                    "original_class": str(class_name),
                    "quality_class": class_details.get("quality_class", "Medium Class"),
                    "confidence": round(confidence, 2),
                    "bbox": bbox,
                    "area_px": int(area_px)
                }
                if polygon is not None:
                    row["obb_polygon"] = [[round(float(x), 2), round(float(y), 2)] for x, y in polygon]
                detections.append(row)

            detections.sort(key=lambda d: d.get("confidence", 0), reverse=True)
            primary = detections[0]
            primary_class_idx = int(primary.get("class_id", 0))
            primary_confidence = float(primary.get("confidence", 0))
            primary_quality_class = primary.get("quality_class", "Medium Class")

            quality_info = self._determine_quality_from_model(primary_class_idx, primary_confidence)
            visual_analysis = self._analyze_visual_features(original_img)
            drc = self._calculate_drc_from_model(primary_class_idx, primary_confidence, visual_analysis)
            quantity_estimation = self._estimate_quantity(original_img, primary.get("class", "Latex"))
            estimated_volume_ml = quantity_estimation.get('estimated_volume_ml', 0.0)
            market_price = self._calculate_market_price_regional(
                primary_quality_class,
                estimated_volume_ml,
                drc,
                region
            )
            product_recommendations = self._get_product_recommendations(
                primary_quality_class,
                quality_info.get('has_contamination', False),
                primary_class_idx
            )

            all_predictions = [
                {
                    "class": d.get("class", "Unknown"),
                    "original_class": d.get("original_class", "unknown"),
                    "confidence": round(float(d.get("confidence", 0)), 2),
                    "quality_class": d.get("quality_class", "Unknown")
                }
                for d in detections[:5]
            ]

            analysis_id = hashlib.md5(
                f"{datetime.datetime.now().isoformat()}{primary_confidence}{len(detections)}".encode()
            ).hexdigest()[:8]

            visualization = None
            if return_visualization:
                visualization = self._create_detection_visualization(original_img, detections)

            result = {
                "success": True,
                "analysis_id": analysis_id,
                "timestamp": datetime.datetime.now().isoformat(),
                "ml_model_used": True,
                "model_info": {
                    "type": "YOLO OBB Detection" if use_obb else "YOLO Detection",
                    "model_path": self.model_path,
                    "model_file": os.path.basename(self.model_path),
                    "model_size_mb": self.model_metadata.get('file_size_mb', 0),
                    "num_classes": len(self.class_names),
                    "task": "obb_detection" if use_obb else "detection",
                    "detection_count": len(detections)
                },
                "latex_analysis": {
                    "primary_classification": {
                        "class": primary.get("class", "Unknown"),
                        "quality_class": primary_quality_class,
                        "confidence": round(primary_confidence, 2),
                        "is_confident": primary_confidence >= (self.confidence_threshold * 100),
                        "characteristics": self.class_info.get(primary_class_idx, {}).get("characteristics", [])
                    },
                    "quality_score": round(primary_confidence, 2),
                    "quality_class": primary_quality_class,
                    "contamination": {
                        "detected": quality_info.get('has_contamination', False),
                        "probability": round(float(quality_info.get('contamination_prob', 0)), 2),
                        "type": quality_info.get('contamination_type', 'none')
                    },
                    "dry_rubber_content": round(drc, 2),
                    "drc_category": self._categorize_drc(drc),
                    "color_analysis": visual_analysis.get('color_analysis', {}),
                    "consistency": visual_analysis.get('consistency', 'unknown'),
                    "impurities": visual_analysis.get('impurities', {}),
                    "quantity_estimation": quantity_estimation,
                    "estimated_yield": self._estimate_yield(estimated_volume_ml, drc),
                    "detection_count": len(detections),
                    "detections": detections[:10]
                },
                "detections": detections[:10],
                "all_predictions": all_predictions,
                "product_recommendations": {
                    "recommended_products": product_recommendations,
                    "processing_required": quality_info.get('has_contamination', False),
                    "suggested_applications": self._get_applications(primary_quality_class, drc)
                },
                "market_analysis": market_price
            }

            if visualization:
                result["visualization"] = visualization

            if isinstance(image_input, str) and os.path.exists(image_input):
                image_stats = os.stat(image_input)
                result["image_metadata"] = {
                    "filename": os.path.basename(image_input),
                    "file_size_kb": round(image_stats.st_size / 1024, 1),
                    "analyzed_at": result["timestamp"]
                }

            return result

        except Exception as e:
            logger.error(f"Detection processing failed: {e}")
            logger.debug(traceback.format_exc())
            return {
                "success": False,
                "error": f"Latex detection result processing failed: {str(e)}",
                "timestamp": datetime.datetime.now().isoformat(),
                "ml_model_used": True
            }
    
    def _determine_quality_from_model(self, class_idx: int, confidence: float) -> Dict[str, Any]:
        """Determine quality based on model classification"""
        class_info = self.class_info.get(class_idx, {})
        class_name = class_info.get("name", "").lower()
        
        # Quality mapping from class info
        quality_class = class_info.get("quality_class", "Medium Class")
        
        # Contamination detection
        contamination_terms = ['contaminated', 'watery', 'coagulated', 'impure']
        has_contamination = any(term in class_name for term in contamination_terms)
        
        # Determine contamination type
        contamination_type = "none"
        if has_contamination:
            if 'contaminated' in class_name:
                contamination_type = "impurities"
            elif 'watery' in class_name:
                contamination_type = "excess_water"
            elif 'coagulated' in class_name:
                contamination_type = "pre_coagulation"
        
        contamination_prob = confidence if has_contamination else max(5, 100 - confidence)
        
        return {
            'quality_class': quality_class,
            'has_contamination': has_contamination,
            'contamination_prob': contamination_prob,
            'contamination_type': contamination_type
        }
    
    def _calculate_drc_from_model(self, class_idx: int, confidence: float, visual_analysis: Dict) -> float:
        """Calculate Dry Rubber Content using model-specific ranges"""
        class_info = self.class_info.get(class_idx, {})
        drc_range = class_info.get("drc_range", (40, 80))
        
        # Base DRC from class range
        base_drc = (drc_range[0] + drc_range[1]) / 2
        
        # Adjust based on confidence
        confidence_factor = confidence / 100
        adjusted_drc = base_drc * (0.85 + 0.15 * confidence_factor)
        
        # Adjust based on visual analysis
        color = visual_analysis.get('color_analysis', {}).get('name', '').lower()
        color_multipliers = {
            'white': 1.05,
            'pure white': 1.1,
            'yellowish': 0.95,
            'water': 0.8,
            'dark': 0.85
        }
        
        for color_key, multiplier in color_multipliers.items():
            if color_key in color:
                adjusted_drc *= multiplier
                break
        
        # Constrain to reasonable range
        return min(95, max(10, adjusted_drc))
    
    def _categorize_drc(self, drc: float) -> str:
        """Categorize DRC value"""
        if drc >= 80:
            return "Excellent"
        elif drc >= 65:
            return "Good"
        elif drc >= 50:
            return "Average"
        elif drc >= 35:
            return "Below Average"
        else:
            return "Poor"
    
    def _estimate_yield(self, volume: float, drc: float) -> Dict[str, float]:
        """Estimate dry rubber yield"""
        dry_weight = volume * (drc / 100)  # grams
        return {
            "wet_weight_kg": round(volume / 1000, 2),
            "dry_weight_kg": round(dry_weight / 1000, 2),
            "dry_yield_percentage": round((dry_weight / volume) * 100 if volume > 0 else 0, 1)
        }
    
    def _get_applications(self, quality_class: str, drc: float) -> List[str]:
        """Get suggested applications based on quality"""
        applications = {
            'High Class': [
                "Medical-grade products",
                "Surgical gloves",
                "Catheters",
                "High-end condoms",
                "Dental dams"
            ],
            'Medium Class': [
                "Industrial gloves",
                "Tire manufacturing",
                "Rubber bands",
                "Seals and gaskets",
                "Adhesives"
            ],
            'Low Class': [
                "Rubber mats",
                "Footwear soles",
                "Industrial flooring",
                "Recycled products",
                "Asphalt modification"
            ]
        }
        
        base_apps = applications.get(quality_class, ["General rubber products"])
        
        # Adjust based on DRC
        if drc < 30:
            base_apps = ["Concentrate before use"] + base_apps[:2]
        elif drc > 85:
            base_apps = ["Premium applications"] + base_apps
        
        return base_apps[:4]
    
    def _calculate_market_price_regional(self, 
                                        quality_class: str, 
                                        estimated_volume: float, 
                                        drc: float,
                                        region: str = "global_avg") -> Dict[str, Any]:
        """Calculate market price with regional adjustments"""
        # Map quality class to price tier
        if "High" in quality_class:
            tier = "high"
        elif "Medium" in quality_class:
            tier = "medium"
        else:
            tier = "low"
        
        # Get regional price
        regional_prices = self.REGIONAL_PRICES.get(region, self.REGIONAL_PRICES["global_avg"])
        base_price = regional_prices.get(tier, 120)
        
        # Adjust for DRC
        drc_factor = drc / 70  # Normalize to average DRC of 70%
        adjusted_price = base_price * (0.8 + 0.4 * drc_factor)
        
        # Calculate total value
        estimated_weight = estimated_volume  # grams
        total_value = (estimated_weight / 1000) * adjusted_price
        
        # Get market trend (simulated based on region and quality)
        market_trend = self._simulate_market_trend(region, tier)
        
        return {
            "price_per_kg": round(adjusted_price, 2),
            "currency": "PHP",
            "region": region.replace('_', ' ').title(),
            "estimated_total_value": round(total_value, 2),
            "market_trend": market_trend["trend"],
            "trend_strength": market_trend["strength"],
            "regional_comparison": {
                r: self.REGIONAL_PRICES.get(r, {}).get(tier, 0) 
                for r in ["thailand", "indonesia", "malaysia", "vietnam"]
            }
        }
    
    def _simulate_market_trend(self, region: str, tier: str) -> Dict[str, Any]:
        """Simulate market trend (can be replaced with real API)"""
        import random
        from datetime import datetime, timedelta
        
        # Deterministic but realistic simulation
        random.seed(f"{region}_{tier}_{datetime.now().strftime('%Y%m')}")
        
        trends = [
            {"trend": "increasing", "strength": round(random.uniform(0.1, 0.3), 2)},
            {"trend": "stable", "strength": round(random.uniform(0, 0.1), 2)},
            {"trend": "decreasing", "strength": round(random.uniform(0.1, 0.2), 2)}
        ]
        
        # Higher quality tiers tend to be more stable
        weights = [0.3, 0.5, 0.2] if tier == "high" else [0.35, 0.3, 0.35]
        
        return random.choices(trends, weights=weights)[0]
    
    def _format_class_name(self, class_name: str) -> str:
        """Format class name for display"""
        return class_name.replace('_', ' ').title()
    
    def _analyze_visual_features(self, img: np.ndarray) -> Dict[str, Any]:
        """Analyze visual features of latex (color, consistency)"""
        try:
            # Convert to different color spaces
            img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            
            # Color analysis
            color_analysis = self._analyze_latex_color(hsv)
            
            # Consistency analysis
            consistency = self._analyze_consistency(gray)
            
            # Detect impurities
            impurities = self._detect_impurities(hsv, gray)
            
            return {
                'color_analysis': color_analysis,
                'consistency': consistency,
                'impurities': impurities,
                'image_dimensions': {
                    'height': img.shape[0],
                    'width': img.shape[1],
                    'channels': img.shape[2] if len(img.shape) > 2 else 1
                }
            }
            
        except Exception as e:
            logger.error(f"Visual analysis failed: {e}")
            return {
                'color_analysis': {'name': 'Unknown', 'hex': '#808080'},
                'consistency': 'unknown',
                'impurities': {'detected': False, 'count': 0}
            }
    
    def _analyze_latex_color(self, hsv_img: np.ndarray) -> Dict[str, Any]:
        """Analyze latex color in HSV space"""
        try:
            # Create mask for latex region (bright regions)
            lower = np.array([0, 0, 180])
            upper = np.array([180, 50, 255])
            mask = cv2.inRange(hsv_img, lower, upper)
            
            if np.sum(mask) == 0:
                mask = np.ones(hsv_img.shape[:2], dtype=np.uint8) * 255
            
            # Calculate average color in latex region
            avg_hue = np.mean(hsv_img[:,:,0][mask > 0])
            avg_saturation = np.mean(hsv_img[:,:,1][mask > 0])
            avg_value = np.mean(hsv_img[:,:,2][mask > 0])
            
            # Convert to RGB for hex
            rgb = colorsys.hsv_to_rgb(avg_hue/180, avg_saturation/255, avg_value/255)
            rgb = tuple(int(x * 255) for x in rgb)
            hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
            
            # Determine color name and quality indicators
            if avg_value > 220 and avg_saturation < 20:
                color_name = "Pure White Latex"
                color_desc = "Excellent quality - pure latex with minimal impurities"
                quality_indicator = "excellent"
            elif avg_value > 200 and avg_saturation < 30:
                color_name = "White Latex"
                color_desc = "Good quality - clean latex with slight natural variation"
                quality_indicator = "good"
            elif avg_hue > 20 and avg_hue < 40 and avg_saturation > 30:
                color_name = "Yellowish Latex"
                color_desc = "Moderate quality - may indicate age or oxidation"
                quality_indicator = "moderate"
            elif avg_saturation > 60:
                color_name = "Discolored Latex"
                color_desc = "Poor quality - likely contaminated or degraded"
                quality_indicator = "poor"
            elif avg_value < 150:
                color_name = "Dark Latex"
                color_desc = "Poor quality - heavy contamination or coagulation"
                quality_indicator = "very_poor"
            else:
                color_name = "Latex with Water"
                color_desc = "Variable quality - high water content likely"
                quality_indicator = "variable"
            
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
                'quality_indicator': quality_indicator
            }
            
        except Exception as e:
            logger.error(f"Color analysis failed: {e}")
            return {
                'name': 'Unknown',
                'hex': '#808080',
                'description': 'Color analysis failed',
                'quality_indicator': 'unknown'
            }
    
    def _analyze_consistency(self, gray_img: np.ndarray) -> str:
        """Analyze latex consistency/texture"""
        try:
            # Calculate texture metrics
            variance = np.var(gray_img)
            laplacian = cv2.Laplacian(gray_img, cv2.CV_64F).var()
            
            if variance < 800 and laplacian < 80:
                return "Very smooth and uniform (excellent consistency)"
            elif variance < 1500 and laplacian < 150:
                return "Smooth and uniform (good consistency)"
            elif variance < 3000:
                return "Slightly grainy (acceptable consistency)"
            elif variance < 5000:
                return "Grainy texture (moderate consistency)"
            elif variance < 8000:
                return "Coarse texture (poor consistency)"
            else:
                return "Coagulated or lumpy (very poor consistency)"
                
        except Exception:
            return "Unknown consistency"
    
    def _detect_impurities(self, hsv_img: np.ndarray, gray_img: np.ndarray) -> Dict[str, Any]:
        """Detect impurities in latex"""
        try:
            # Method 1: Detect dark spots (potential impurities)
            _, thresh = cv2.threshold(gray_img, 100, 255, cv2.THRESH_BINARY_INV)
            
            # Method 2: Detect color anomalies
            lower_impurity = np.array([0, 50, 0])
            upper_impurity = np.array([180, 255, 150])
            color_mask = cv2.inRange(hsv_img, lower_impurity, upper_impurity)
            
            # Combine methods
            combined_mask = cv2.bitwise_or(thresh, color_mask)
            
            # Apply morphological operations to clean up
            kernel = np.ones((3,3), np.uint8)
            cleaned = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter by size
            min_area = gray_img.shape[0] * gray_img.shape[1] * 0.001  # 0.1% of image
            impurities = [cnt for cnt in contours if cv2.contourArea(cnt) > min_area]
            
            # Calculate impurity percentage
            impurity_pixels = np.sum(cleaned > 0)
            total_pixels = cleaned.size
            impurity_percentage = (impurity_pixels / total_pixels) * 100
            
            # Determine severity
            if impurity_percentage < 1:
                severity = "minimal"
            elif impurity_percentage < 3:
                severity = "low"
            elif impurity_percentage < 7:
                severity = "moderate"
            elif impurity_percentage < 15:
                severity = "high"
            else:
                severity = "severe"
            
            return {
                'detected': len(impurities) > 0,
                'count': len(impurities),
                'percentage': round(impurity_percentage, 2),
                'severity': severity,
                'description': f'Found {len(impurities)} impurity particles ({impurity_percentage:.1f}% of sample)'
            }
            
        except Exception as e:
            logger.error(f"Impurity detection failed: {e}")
            return {
                'detected': False,
                'count': 0,
                'percentage': 0,
                'severity': 'unknown',
                'description': 'Impurity detection failed'
            }
    
    def _estimate_quantity(self, img: np.ndarray, class_name: str) -> Dict[str, Any]:
        """Estimate latex quantity from image"""
        h, w = img.shape[:2]
        
        # Convert to HSV for latex region detection
        img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        
        # Detect latex regions (white/off-white colors)
        lower_latex = np.array([0, 0, 180])
        upper_latex = np.array([180, 50, 255])
        
        mask = cv2.inRange(hsv, lower_latex, upper_latex)
        
        # Calculate latex percentage
        latex_pixels = np.sum(mask > 0)
        total_pixels = mask.size
        latex_percentage = (latex_pixels / total_pixels) * 100
        
        # Estimate volume based on image size and latex percentage
        # Using empirical formula: base_volume = (image_area / reference_area) * reference_volume
        reference_area = 640 * 480  # Reference image size
        reference_volume = 500  # ml for full latex at reference size
        
        area_ratio = (h * w) / reference_area
        base_volume = reference_volume * area_ratio
        
        estimated_volume = base_volume * (latex_percentage / 100)
        
        # Adjust based on class
        class_lower = class_name.lower()
        volume_multipliers = {
            'premium': 1.2,
            'high': 1.1,
            'standard': 1.0,
            'low': 0.8,
            'watery': 0.6,
            'contaminated': 0.7
        }
        
        for key, multiplier in volume_multipliers.items():
            if key in class_lower:
                estimated_volume *= multiplier
                break
        
        # Confidence based on detection clarity
        confidence = min(95, 50 + (latex_percentage / 2))
        
        return {
            'estimated_volume_ml': round(estimated_volume, 1),
            'confidence': round(confidence, 1),
            'latex_area_percentage': round(latex_percentage, 1),
            'estimation_method': 'image_analysis',
            'volume_range': {
                'min': round(estimated_volume * 0.8, 1),
                'max': round(estimated_volume * 1.2, 1)
            }
        }
    
    def _get_product_recommendations(self, 
                                    quality_class: str, 
                                    has_contamination: bool,
                                    class_idx: int) -> List[Dict[str, str]]:
        """Get detailed product recommendations based on latex quality"""
        
        # Detailed product database
        product_db = {
            'High Class': [
                {
                    "name": "Premium Medical Gloves",
                    "type": "Medical",
                    "description": "High-grade examination gloves",
                    "drc_requirement": ">80%",
                    "market_demand": "Very High"
                },
                {
                    "name": "Surgical Tubing",
                    "type": "Medical",
                    "description": "Sterile tubing for medical devices",
                    "drc_requirement": ">85%",
                    "market_demand": "High"
                },
                {
                    "name": "Catheters",
                    "type": "Medical",
                    "description": "Flexible medical catheters",
                    "drc_requirement": ">82%",
                    "market_demand": "High"
                },
                {
                    "name": "Condoms",
                    "type": "Medical",
                    "description": "High-quality prophylactics",
                    "drc_requirement": ">80%",
                    "market_demand": "Very High"
                }
            ],
            'Medium Class': [
                {
                    "name": "Industrial Gloves",
                    "type": "Industrial",
                    "description": "Chemical-resistant work gloves",
                    "drc_requirement": "60-75%",
                    "market_demand": "High"
                },
                {
                    "name": "Tire Components",
                    "type": "Automotive",
                    "description": "Inner liners and sidewalls",
                    "drc_requirement": "65-80%",
                    "market_demand": "Very High"
                },
                {
                    "name": "Rubber Bands",
                    "type": "Stationery",
                    "description": "High-elasticity bands",
                    "drc_requirement": "60-70%",
                    "market_demand": "Medium"
                },
                {
                    "name": "Seals and Gaskets",
                    "type": "Industrial",
                    "description": "Custom rubber seals",
                    "drc_requirement": "65-75%",
                    "market_demand": "High"
                }
            ],
            'Low Class': [
                {
                    "name": "Rubber Mats",
                    "type": "Flooring",
                    "description": "Anti-fatigue mats",
                    "drc_requirement": "40-55%",
                    "market_demand": "Medium"
                },
                {
                    "name": "Recycled Rubber Products",
                    "type": "Recycled",
                    "description": "Ground rubber applications",
                    "drc_requirement": "30-50%",
                    "market_demand": "Growing"
                },
                {
                    "name": "Asphalt Modifier",
                    "type": "Construction",
                    "description": "Rubberized asphalt",
                    "drc_requirement": "25-45%",
                    "market_demand": "High"
                }
            ]
        }
        
        # Get base recommendations
        base_recs = product_db.get(quality_class, product_db['Medium Class'])
        
        # Adjust for contamination
        if has_contamination:
            base_recs = [
                {
                    "name": "Pre-purification Required",
                    "type": "Processing",
                    "description": "Latex needs purification before use",
                    "drc_requirement": "N/A",
                    "market_demand": "N/A"
                }
            ] + base_recs[:2]
        
        # Add class-specific notes
        class_info = self.class_info.get(class_idx, {})
        if class_info.get("characteristics"):
            base_recs[0]["characteristics"] = class_info["characteristics"]
        
        return base_recs

    def _create_detection_visualization(self, img: np.ndarray, detections: List[Dict[str, Any]]) -> Optional[str]:
        """Create visualization with detection boxes/polygons and labels."""
        try:
            vis_img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            h, w = vis_img.shape[:2]

            # Compact top bar with detection summary.
            overlay = vis_img.copy()
            cv2.rectangle(overlay, (10, 10), (min(520, w - 10), 70), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, vis_img, 0.4, 0, vis_img)
            cv2.putText(
                vis_img,
                f"Latex Detections: {len(detections)}",
                (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2
            )

            for det in detections[:10]:
                bbox = det.get('bbox')
                if not bbox or len(bbox) != 4:
                    continue

                x1, y1, x2, y2 = [int(v) for v in bbox]
                confidence = float(det.get('confidence', 0))
                class_name = det.get('class', 'Latex')
                quality_class = str(det.get('quality_class', '')).lower()

                if 'high' in quality_class:
                    color = (34, 197, 94)
                elif 'low' in quality_class:
                    color = (60, 76, 231)
                else:
                    color = (59, 130, 246)

                polygon = det.get('obb_polygon')
                if polygon:
                    pts = np.array(polygon, dtype=np.int32).reshape((-1, 1, 2))
                    cv2.polylines(vis_img, [pts], True, color, 2)
                else:
                    cv2.rectangle(vis_img, (x1, y1), (x2, y2), color, 2)

                label = f"{class_name} {confidence:.1f}%"
                (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
                text_top = max(16, y1 - text_h - 8)
                cv2.rectangle(
                    vis_img,
                    (x1, text_top),
                    (min(w - 5, x1 + text_w + 10), text_top + text_h + 8),
                    color,
                    -1
                )
                cv2.putText(
                    vis_img,
                    label,
                    (x1 + 5, text_top + text_h + 1),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (255, 255, 255),
                    1
                )

            _, buffer = cv2.imencode('.jpg', vis_img, [cv2.IMWRITE_JPEG_QUALITY, 92])
            return base64.b64encode(buffer).decode('utf-8')

        except Exception as e:
            logger.error(f"Detection visualization failed: {e}")
            return None
    
    def _create_enhanced_visualization(self, 
                                      img: np.ndarray, 
                                      quality_name: str, 
                                      confidence: float,
                                      visual_analysis: Dict,
                                      class_details: Dict) -> str:
        """Create enhanced annotated visualization"""
        try:
            vis_img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            h, w = vis_img.shape[:2]
            
            # Create semi-transparent overlays
            overlay = vis_img.copy()
            
            # Top info bar
            cv2.rectangle(overlay, (10, 10), (450, 140), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, vis_img, 0.3, 0, vis_img)
            
            # Add main text
            cv2.putText(vis_img, f"RubberSense Analysis", (20, 35),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(vis_img, f"Quality: {quality_name}", (20, 65),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 255, 100), 2)
            cv2.putText(vis_img, f"Confidence: {confidence:.1f}%", (20, 95),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 100), 2)
            
            # Color indicator
            color_hex = visual_analysis['color_analysis'].get('hex', '#808080')
            color_rgb = tuple(int(color_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            cv2.rectangle(vis_img, (20, 110), (50, 130), color_rgb, -1)
            cv2.putText(vis_img, f"Color: {visual_analysis['color_analysis']['name']}", (60, 125),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Impurity indicator
            impurities = visual_analysis.get('impurities', {})
            if impurities.get('detected', False):
                imp_text = f"Impurities: {impurities['count']} ({impurities.get('severity', 'unknown')})"
                imp_color = (0, 0, 255)  # Red for impurities
            else:
                imp_text = "No visible impurities"
                imp_color = (0, 255, 0)  # Green for clean
            
            cv2.putText(vis_img, imp_text, (20, 155),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, imp_color, 1)
            
            # Add quality characteristics
            y_offset = 180
            characteristics = class_details.get("characteristics", [])
            for i, char in enumerate(characteristics[:2]):
                cv2.putText(vis_img, f"• {char}", (20, y_offset + i*20),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 255), 1)
            
            # Add timestamp and ID
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            analysis_id = hashlib.md5(timestamp.encode()).hexdigest()[:6]
            cv2.putText(vis_img, f"ID: {analysis_id} | {timestamp}", (w - 250, h - 20),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (150, 150, 150), 1)
            
            # Add "Powered by RubberSense" watermark
            cv2.putText(vis_img, "RubberSense AI", (w - 150, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)
            
            # Convert to base64 with high quality
            _, buffer = cv2.imencode('.jpg', vis_img, [cv2.IMWRITE_JPEG_QUALITY, 92])
            return base64.b64encode(buffer).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Enhanced visualization failed: {e}")
            return None
    
    def _heuristic_analysis(self, img: np.ndarray, return_visualization: bool) -> Dict[str, Any]:
        """Fallback heuristic analysis when model fails"""
        logger.info("🔧 Running heuristic analysis...")
        
        # Basic visual analysis
        visual_analysis = self._analyze_visual_features(img)
        
        # Simple rule-based classification
        color_name = visual_analysis['color_analysis']['name'].lower()
        impurities = visual_analysis.get('impurities', {})
        
        if 'pure white' in color_name and not impurities.get('detected', False):
            quality_class = "High Class"
            confidence = 75
            contamination = False
            drc_base = 82
        elif 'white' in color_name and impurities.get('severity', 'low') in ['minimal', 'low']:
            quality_class = "High Class"
            confidence = 70
            contamination = False
            drc_base = 78
        elif 'yellowish' in color_name:
            quality_class = "Medium Class"
            confidence = 65
            contamination = False
            drc_base = 62
        elif 'water' in color_name or impurities.get('severity') == 'high':
            quality_class = "Low Class"
            confidence = 55
            contamination = True
            drc_base = 35
        else:
            quality_class = "Medium Class"
            confidence = 60
            contamination = impurities.get('detected', False)
            drc_base = 55
        
        # Calculate DRC with adjustments
        drc = drc_base
        if contamination:
            drc *= 0.7
        if impurities.get('severity') == 'moderate':
            drc *= 0.9
        elif impurities.get('severity') == 'severe':
            drc *= 0.6
        
        drc = min(90, max(15, drc))
        
        # Estimate quantity
        quantity = self._estimate_quantity(img, quality_class)
        
        # Get recommendations
        recommendations = self._get_product_recommendations(quality_class, contamination, 2)
        
        # Calculate price
        price = self._calculate_market_price_regional(quality_class, quantity['estimated_volume_ml'], drc)
        
        # Create simple visualization
        visualization = None
        if return_visualization:
            vis_img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            cv2.putText(vis_img, f"HEURISTIC MODE", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(vis_img, f"Quality: {quality_class}", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(vis_img, f"Color: {visual_analysis['color_analysis']['name']}", (10, 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            _, buffer = cv2.imencode('.jpg', vis_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            visualization = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "success": True,
            "timestamp": datetime.datetime.now().isoformat(),
            "ml_model_used": False,
            "latex_analysis": {
                "primary_classification": {
                    "class": quality_class,
                    "confidence": confidence,
                    "is_confident": confidence >= 60
                },
                "quality_class": quality_class,
                "quality_score": confidence,
                "contamination": {
                    "detected": contamination,
                    "probability": 70 if contamination else 20
                },
                "dry_rubber_content": round(drc, 2),
                "color_analysis": visual_analysis['color_analysis'],
                "consistency": visual_analysis['consistency'],
                "impurities": visual_analysis['impurities'],
                "quantity_estimation": quantity
            },
            "product_recommendations": {
                "recommended_products": recommendations[:3],
                "processing_required": contamination
            },
            "market_analysis": price,
            "visualization": visualization,
            "note": "Heuristic analysis fallback used (low-confidence/no-detection or model processing fallback)."
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive information about the loaded model"""
        if self.model:
            return {
                "loaded": True,
                "model_path": self.model_path,
                "model_exists": os.path.exists(self.model_path),
                "model_metadata": self.model_metadata,
                "classes": [
                    {
                        "index": idx,
                        "name": self.class_names.get(idx, f"class_{idx}"),
                        "details": self.class_info.get(idx, {})
                    }
                    for idx in sorted(self.class_names.keys())
                ],
                "num_classes": len(self.class_names),
                "type": "classification/detection",
                "confidence_threshold": self.confidence_threshold
            }
        else:
            return {
                "loaded": False,
                "model_path": self.model_path,
                "model_exists": os.path.exists(self.model_path),
                "error": "Model not loaded",
                "suggestion": "Ensure Latex-v2.pt (or Latex.pt) is in RubberSense/backend/ML-models/"
            }
    
    def batch_analyze(self, image_paths: List[str], **kwargs) -> List[Dict[str, Any]]:
        """Analyze multiple images in batch"""
        results = []
        for path in image_paths:
            try:
                result = self.analyze_latex(path, **kwargs)
                result["input_file"] = path
                results.append(result)
            except Exception as e:
                results.append({
                    "success": False,
                    "input_file": path,
                    "error": str(e)
                })
        return results


# ============================================
# COMMAND LINE INTERFACE
# ============================================

def main():
    """Command-line entry point for the latex analyzer"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Missing arguments. Usage: python latex_inference.py <image_path> [output_format] [region]",
            "usage": {
                "example": "python latex_inference.py sample.jpg json thailand",
                "formats": ["json", "pretty"],
                "regions": ["thailand", "indonesia", "malaysia", "vietnam", "india", "global_avg"]
            }
        }, indent=2))
        return

    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("image_path", nargs="?", default=None)
    parser.add_argument("output_format", nargs="?", default="json")
    parser.add_argument("legacy_region", nargs="?", default=None)
    parser.add_argument("--model", dest="model_path", default=None)
    parser.add_argument("--region", dest="region", default=None)
    parser.add_argument("--format", dest="format_arg", default=None)
    parser.add_argument("--visualize", action="store_true")
    parser.add_argument("--no-visualize", action="store_true")
    parser.add_argument("--info", action="store_true")
    parser.add_argument("--help", action="store_true")
    args, _ = parser.parse_known_args(sys.argv[1:])

    if args.help:
        print(json.dumps({
            "success": True,
            "usage": {
                "legacy": "python latex_inference.py <image_path> [json|pretty] [region]",
                "recommended": "python latex_inference.py <image_path> --model <path> --region <region> [--visualize]",
                "flags": ["--model", "--region", "--format", "--visualize", "--no-visualize", "--info"]
            }
        }))
        return

    output_format = args.format_arg or args.output_format or "json"
    region = args.region or args.legacy_region or "global_avg"
    return_visualization = args.visualize and not args.no_visualize

    if args.info:
        analyzer = RubberTreeLatexAnalyzer(model_path=args.model_path)
        print(json.dumps({
            "success": True,
            "model_info": analyzer.get_model_info()
        }))
        return

    image_input = args.image_path
    if not image_input:
        print(json.dumps({
            "success": False,
            "error": "Missing image path"
        }))
        return
    
    try:
        # Initialize analyzer with model from RubberSense structure
        analyzer = RubberTreeLatexAnalyzer(model_path=args.model_path)
        
        # Check if model exists
        model_info = analyzer.get_model_info()
        if not model_info["loaded"]:
            logger.warning(f"⚠️ Model not loaded. Check path: {model_info['model_path']}")
        
        # Analyze image
        result = analyzer.analyze_latex(
            image_input, 
            return_visualization=return_visualization,
            region=region
        )
        
        # Add model info to result
        result["model_status"] = model_info
        
        # Output result
        if output_format == "json":
            print(json.dumps(result))
        elif output_format == "pretty":
            print(json.dumps(result, indent=2, ensure_ascii=False))
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
