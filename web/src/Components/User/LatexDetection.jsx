import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Analytics as AnalyticsIcon,
  RestartAlt as RestartAltIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ColorLens as ColorLensIcon,
  Texture as TextureIcon,
  Spa as SpaIcon,
  Science as ScienceIcon,
  Healing as HealingIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Opacity as OpacityIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  FlipCameraAndroid as FlipCameraIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  WaterDrop as WaterDropIcon,
  MonetizationOn as MonetizationOnIcon,
  Factory as FactoryIcon,
  PriceCheck as PriceCheckIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
  Biotech as BiotechIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const LatexDetection = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('global_avg');
  const [batchID, setBatchID] = useState('');
  const [volume, setVolume] = useState('');
  const [dryWeight, setDryWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [liveMarketData, setLiveMarketData] = useState(null);

  // Source chooser
  const [chooserOpen, setChooserOpen] = useState(false);

  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Regions for market pricing
  const regions = [
    { value: 'global_avg', label: 'Global Average' },
    { value: 'thailand', label: 'Thailand' },
    { value: 'indonesia', label: 'Indonesia' },
    { value: 'malaysia', label: 'Malaysia' },
    { value: 'vietnam', label: 'Vietnam' },
    { value: 'india', label: 'India' }
  ];

  const fetchLiveMarketData = async (forceRefresh = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const endpoints = ['/api/v1/market/latest', '/api/market/latest'];
      for (const endpoint of endpoints) {
        try {
          const res = await axios.get(`${API_BASE_URL}${endpoint}`, {
            params: { force: forceRefresh },
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data?.success) {
            setLiveMarketData(res.data.data || null);
            return res.data.data || null;
          }
        } catch (requestError) {
          if (requestError?.response?.status === 404) {
            continue;
          }
          throw requestError;
        }
      }

      return null;
    } catch (err) {
      console.log('Market data fetch error:', err);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (res.data.success) setUser(res.data.user);
        else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSystemInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/latex/info`);
        if (res.data.success) setSystemInfo(res.data.data);
      } catch (err) {
        console.log('System info fetch error:', err);
      }
    };
    
    checkAuth();
    fetchSystemInfo();
    fetchLiveMarketData(false);
  }, [navigate, API_BASE_URL]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (cameraOpen) {
      startCamera();
    } else if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [cameraOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
      const file = new File([blob], `latex-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      setCameraOpen(false);
      setCapturing(false);
      setAnalysisResult(null);
      setSuccessMessage(null);
      setError(null);
    }, 'image/jpeg', 0.95);
  };

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select a JPEG, PNG, or WebP image.');
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }
    
    setError(null);
    setSelectedImage(file);
    setAnalysisResult(null);
    setSuccessMessage(null);
    if (!batchID) {
      setBatchID(`WEB-${Date.now().toString(36).toUpperCase()}`);
    }
    
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first.');
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('region', selectedRegion);
      formData.append('batchID', batchID || '');
      formData.append('volume', volume || '0');
      formData.append('dryWeight', dryWeight || '0');
      formData.append('notes', notes || '');
      
      const res = await axios.post(`${API_BASE_URL}/api/v1/latex/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 30000 // 30 second timeout
      });
      
      if (res.data.success) {
        setAnalysisResult(res.data.data);
        setSuccessMessage('Latex analysis completed successfully!');
        fetchLiveMarketData(false);
      } else {
        throw new Error(res.data.message || 'Analysis failed');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The server is taking too long to respond.');
      } else if (err.response?.status === 500) {
        setError('Server error: ' + (err.response?.data?.error || 'Internal server error.'));
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || err.message || 'Error analyzing image. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    setSuccessMessage(null);
    setBatchID('');
    setVolume('');
    setDryWeight('');
    setNotes('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getQualityColor = (qualityClass) => {
    switch (qualityClass?.toLowerCase()) {
      case 'high':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getQualityGradient = (qualityClass) => {
    switch (qualityClass?.toLowerCase()) {
      case 'high':
        return 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)';
      case 'medium':
        return 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)';
      case 'low':
        return 'linear-gradient(135deg, #b71c1c 0%, #f44336 100%)';
      default:
        return 'linear-gradient(135deg, #616161 0%, #9e9e9e 100%)';
    }
  };

  const getContaminationColor = (hasContamination, probability) => {
    if (!hasContamination) return '#4caf50';
    if (probability < 30) return '#ff9800';
    if (probability < 60) return '#f44336';
    return '#b71c1c';
  };

  const getColorSwatch = (colorHex) => {
    return colorHex || '#808080';
  };

  const getDrcCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'excellent':
        return '#4caf50';
      case 'good':
        return '#2196f3';
      case 'average':
        return '#ff9800';
      case 'below average':
      case 'poor':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    
    const reportData = {
      ...analysisResult,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.email,
      region: selectedRegion,
      analysisId: analysisResult.analysisId
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `latex-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CircularProgress size={60} thickness={4} sx={{ color: '#2e7d32' }} />
        </motion.div>
        <Typography variant="h6" sx={{ mt: 3, color: '#2e7d32', fontWeight: 500 }}>
          Loading Latex Quality Analysis System...
        </Typography>
      </Box>
    );
  }

  // Extract analysis data with proper null checks
  const analysis = analysisResult?.latex_analysis || {};
  const primaryClass = analysis.primary_classification || {};
  const contamination = analysis.contamination || {};
  const colorAnalysis = analysis.color_analysis || {};
  const quantity = analysis.quantity_estimation || {};
  const yield_est = analysis.estimated_yield || {};
  const market = analysisResult?.market_analysis || {};
  const recommendations = analysisResult?.product_recommendations || {};
  const modelInfo = analysisResult?.model_info || analysisResult?.modelInfo || {};
  const imageMetadata = analysisResult?.image_metadata || {};
  const image = analysisResult?.image || {};
  const activeModelLabel =
    analysisResult?.modelInfo?.modelUsed ||
    modelInfo?.model_file ||
    modelInfo?.modelUsed ||
    'Unknown model';
  const latexDetections = Array.isArray(analysisResult?.detections)
    ? analysisResult.detections
    : (Array.isArray(analysis?.detections) ? analysis.detections : []);
  const visualizationSrc = analysisResult?.visualization
    ? `data:image/jpeg;base64,${analysisResult.visualization}`
    : analysisResult?.processedImageURL || null;
  const analyzedAtValue = imageMetadata?.analyzedAt || imageMetadata?.analyzed_at;
  const fileNameValue = imageMetadata?.filename || imageMetadata?.fileName || '';
  const fileSizeValue = imageMetadata?.fileSizeKB || imageMetadata?.file_size_kb;
  const effectivePricePerKg = (() => {
    const livePrice = Number(liveMarketData?.price);
    if (Number.isFinite(livePrice) && livePrice > 0) return livePrice;
    const scanPrice = Number(market.price_per_kg);
    return Number.isFinite(scanPrice) ? scanPrice : 0;
  })();
  const effectiveDryYieldKg = (() => {
    const fromProfile = Number(analysisResult?.productYieldEstimation?.estimatedYield);
    if (Number.isFinite(fromProfile) && fromProfile > 0) return fromProfile;
    const fromLatex = Number(yield_est?.dry_weight_kg);
    if (Number.isFinite(fromLatex) && fromLatex > 0) return fromLatex;
    return 0;
  })();
  const effectiveTotalValue = (() => {
    if (effectivePricePerKg > 0 && effectiveDryYieldKg > 0) {
      return effectivePricePerKg * effectiveDryYieldKg;
    }
    const scanTotal = Number(market.estimated_total_value);
    return Number.isFinite(scanTotal) ? scanTotal : 0;
  })();
  const effectiveCurrency = liveMarketData?.currency || market.currency || 'PHP';
  const effectiveTrend = String(liveMarketData?.trend || market.market_trend || 'neutral');
  const effectiveTrendStrengthPct = (() => {
    const liveChange = Number(liveMarketData?.priceChange);
    if (Number.isFinite(liveChange)) return Math.abs(liveChange);
    const scanStrength = Number(market.trend_strength);
    return Number.isFinite(scanStrength) ? Math.abs(scanStrength * 100) : 0;
  })();
  const liveSourceLabel = liveMarketData
    ? `${String(liveMarketData.source || 'stooq').toUpperCase()}${liveMarketData.sourceSymbol ? ` (${liveMarketData.sourceSymbol})` : ''}`
    : null;

  return (
    <>
      <UserHeader />

      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: '80px', pb: '90px' }}>
        <Container maxWidth="lg">

          {/* HERO SECTION */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper elevation={3} sx={{
              p: { xs: 3, md: 5 },
              mb: 4,
              background: 'linear-gradient(135deg, #00695c 0%, #2e7d32 55%, #4caf50 100%)',
              color: 'white',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <Box sx={{ position: 'absolute', bottom: -40, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

              {/* History / Stats buttons */}
              <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 2, display: 'flex', gap: 1.5 }}>
                <Button
                  component={Link}
                  to="/latex-history"
                  variant="contained"
                  size="small"
                  startIcon={<HistoryIcon />}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.18)',
                    color: 'white',
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }
                  }}
                >
                  History
                </Button>
                <Button
                  component={Link}
                  to="/latex-stats"
                  variant="contained"
                  size="small"
                  startIcon={<AssessmentIcon />}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.18)',
                    color: 'white',
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }
                  }}
                >
                  Statistics
                </Button>
              </Box>

              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  🧪 Rubber Tree Latex Analysis
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.85, mb: 2.5 }}>
                  AI-Powered Quality Classification & Market Analysis System
                </Typography>
                {systemInfo && (
                  <Chip
                    icon={systemInfo.systemStatus?.mlReady ? <CheckCircleIcon /> : <WarningIcon />}
                    label={systemInfo.systemStatus?.mlReady ? 'ML Model Active' : 'Using Fallback Analysis'}
                    sx={{
                      bgcolor: systemInfo.systemStatus?.mlReady ? 'rgba(76,175,80,0.22)' : 'rgba(255,152,0,0.22)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* ALERTS */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <Alert
                  severity="error"
                  onClose={() => setError(null)}
                  icon={<ErrorIcon />}
                  sx={{ mb: 3, borderRadius: 2 }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <Alert
                  severity="success"
                  onClose={() => setSuccessMessage(null)}
                  icon={<CheckCircleIcon />}
                  sx={{ mb: 3, borderRadius: 2 }}
                >
                  {successMessage}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* REGION SELECTOR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #c8e6c9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PriceCheckIcon fontSize="small" /> Market Region:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    sx={{
                      bgcolor: '#f5f5f5',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9' }
                    }}
                  >
                    {regions.map(region => (
                      <MenuItem key={region.value} value={region.value}>{region.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  Affects market price calculations
                </Typography>
              </Box>
            </Paper>
          </motion.div>

          {/* PRE-SCAN INPUTS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #c8e6c9' }}>
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 700, mb: 2 }}>
                Pre-Scan Latex Inputs
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Batch Reference ID"
                    value={batchID}
                    onChange={(e) => setBatchID(e.target.value)}
                    placeholder="Auto or manual batch ID"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Volume (L)"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="0.0"
                    inputMode="decimal"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Dry Weight (%)"
                    value={dryWeight}
                    onChange={(e) => setDryWeight(e.target.value)}
                    placeholder="Optional"
                    inputMode="decimal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional note for this scan"
                  />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          {/* UPLOAD PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Paper elevation={3} sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              borderRadius: 4,
              border: '2px solid #2e7d32',
              bgcolor: 'white'
            }}>
              <Typography variant="h5" sx={{ color: '#2e7d32', mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon /> Upload or Capture Latex Sample Image
              </Typography>

              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <motion.img
                    src={imagePreview}
                    alt="Latex preview"
                    style={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'contain',
                      borderRadius: 16,
                      border: '3px solid #2e7d32',
                      display: 'block'
                    }}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                  />
                  <IconButton
                    onClick={handleReset}
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      bgcolor: 'rgba(244,67,54,0.9)',
                      color: 'white',
                      '&:hover': { bgcolor: '#d32f2f' }
                    }}
                  >
                    <RestartAltIcon />
                  </IconButton>
                </Box>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Box
                    onClick={() => setChooserOpen(true)}
                    sx={{
                      border: '3px dashed #2e7d32',
                      borderRadius: 4,
                      p: { xs: 5, md: 8 },
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: '#f1f8e9',
                      transition: 'all 0.25s',
                      '&:hover': {
                        bgcolor: '#e8f5e9',
                        borderColor: '#1b5e20'
                      }
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <AddPhotoAlternateIcon sx={{ fontSize: 90, color: '#2e7d32', mb: 2 }} />
                    </motion.div>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 700, mb: 0.5 }}>
                      Add Latex Sample Image
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Click to <strong>take a photo</strong> or <strong>upload from device</strong>
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      JPEG · PNG · WebP — max 10 MB
                    </Typography>
                  </Box>
                </motion.div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAnalyze}
                  disabled={!selectedImage || analyzing}
                  startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
                  sx={{
                    bgcolor: '#2e7d32',
                    px: 6,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
                    '&:hover': { bgcolor: '#1b5e20' },
                    '&:disabled': { bgcolor: '#c8e6c9', color: '#81c784' }
                  }}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Latex'}
                </Button>
                {selectedImage && !analyzing && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleReset}
                    startIcon={<RestartAltIcon />}
                    sx={{
                      borderColor: '#2e7d32',
                      color: '#2e7d32',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#1b5e20',
                        bgcolor: '#f1f8e9'
                      }
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* RESULTS SECTION */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.55 }}
              >

                {/* Cloudinary Image Info */}
                {image && image.url && (
                  <Alert 
                    severity="info" 
                    icon={<InfoIcon />} 
                    sx={{ mb: 3, borderRadius: 2 }}
                  >
                    <Typography variant="body2">
                      ✅ Image stored securely in cloud. Analysis ID: {analysisResult.analysisId}
                    </Typography>
                  </Alert>
                )}

                {/* ML Banner */}
                {modelInfo && (
                  <Alert
                    severity={modelInfo.fallback ? 'warning' : 'success'}
                    icon={modelInfo.fallback ? <WarningIcon /> : <ScienceIcon />}
                    sx={{ mb: 3, borderRadius: 2 }}
                  >
                    <Typography variant="body2">
                      {modelInfo.fallback
                        ? `⚠️ Fallback analysis: ${modelInfo.reason || 'ML model unavailable'}`
                        : `✅ Analyzed using trained ML model: ${activeModelLabel}`}
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon /> Latex Quality Analysis Results
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={downloadReport}
                    startIcon={<DownloadIcon />}
                    sx={{
                      borderColor: '#2e7d32',
                      color: '#2e7d32',
                      borderRadius: 3,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#1b5e20',
                        bgcolor: '#f1f8e9'
                      }
                    }}
                  >
                    Download Report
                  </Button>
                </Box>

                {/* ROW 1: Quality Hero Card */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card elevation={3} sx={{
                    borderRadius: 3,
                    mb: 3,
                    background: getQualityGradient(analysis.quality_class),
                    color: 'white'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                            Latex Quality
                          </Typography>
                          <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                            {analysis.quality_class || 'Unknown'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Classification Confidence</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {analysis.quality_score?.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={analysis.quality_score || 0}
                            sx={{
                              height: 16,
                              borderRadius: 99,
                              bgcolor: 'rgba(255,255,255,0.25)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'white',
                                borderRadius: 99
                              }
                            }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>0%</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>100%</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ROW 2: Key Metrics Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card elevation={2} sx={{
                        borderRadius: 3,
                        border: '2px solid #2e7d32',
                        height: '100%',
                        bgcolor: contamination.detected ? '#ffebee' : '#f1f8e9'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <WarningIcon sx={{ color: contamination.detected ? '#f44336' : '#4caf50' }} />
                            <Typography variant="body2" sx={{
                              color: contamination.detected ? '#b71c1c' : '#2e7d32',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              fontSize: '0.75rem'
                            }}>
                              Contamination Status
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{
                            color: contamination.detected ? '#b71c1c' : '#2e7d32',
                            fontWeight: 800,
                            mb: 1
                          }}>
                            {contamination.detected ? 'Contamination Detected' : 'Clean Sample'}
                          </Typography>
                          {contamination.detected && (
                            <Chip
                              label={`Probability: ${contamination.probability?.toFixed(1)}%`}
                              size="small"
                              sx={{
                                bgcolor: getContaminationColor(true, contamination.probability),
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          )}
                          {contamination.type && contamination.type !== 'none' && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Type: {contamination.type.replace('_', ' ')}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Card elevation={2} sx={{ borderRadius: 3, border: '2px solid #2e7d32', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <OpacityIcon sx={{ color: '#2e7d32' }} />
                            <Typography variant="body2" sx={{
                              color: '#388e3c',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              fontSize: '0.75rem'
                            }}>
                              Dry Rubber Content
                            </Typography>
                          </Box>
                          <Typography variant="h2" sx={{ color: '#1b5e20', fontWeight: 900, lineHeight: 1 }}>
                            {analysis.dry_rubber_content?.toFixed(1)}%
                          </Typography>
                          <Chip
                            label={`Category: ${analysis.drc_category || 'N/A'}`}
                            size="small"
                            sx={{
                              mt: 1,
                              bgcolor: getDrcCategoryColor(analysis.drc_category),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card elevation={2} sx={{ borderRadius: 3, border: '2px solid #2e7d32', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <ColorLensIcon sx={{ color: '#2e7d32' }} />
                            <Typography variant="body2" sx={{
                              color: '#388e3c',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              fontSize: '0.75rem'
                            }}>
                              Color Analysis
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: getColorSwatch(colorAnalysis.hex),
                              border: '2px solid #e0e0e0',
                              flexShrink: 0
                            }} />
                            <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>
                              {colorAnalysis.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* ROW 3: Visual & Physical Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                >
                  <Paper elevation={2} sx={{
                    borderRadius: 3,
                    border: '1px solid #c8e6c9',
                    p: 3,
                    mb: 3,
                    bgcolor: 'white'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <BubbleChartIcon sx={{ color: '#2e7d32' }} />
                      <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>
                        Physical Properties Analysis
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      {/* Left column - Color swatch */}
                      <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: 140,
                          height: 140,
                          borderRadius: '50%',
                          mx: 'auto',
                          mb: 2,
                          background: `linear-gradient(135deg, ${getColorSwatch(colorAnalysis.hex)}, #2e7d32)`,
                          border: '4px solid #e8f5e9',
                          boxShadow: `0 4px 24px ${getColorSwatch(colorAnalysis.hex)}66`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <OpacityIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.85)' }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'capitalize' }}>
                          {colorAnalysis.name || 'â€”'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Color</Typography>
                        
                        {colorAnalysis.hsv && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              H: {colorAnalysis.hsv.h?.toFixed(0)}° S: {colorAnalysis.hsv.s?.toFixed(0)}% V: {colorAnalysis.hsv.v?.toFixed(0)}%
                            </Typography>
                          </Box>
                        )}
                      </Grid>

                      {/* Right column - Metrics */}
                      <Grid item xs={12} sm={8}>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6}>
                            <Box sx={{
                              p: 2,
                              bgcolor: '#f1f8e9',
                              borderRadius: 2,
                              border: '1px solid #dcedc8'
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Consistency
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextureIcon sx={{ color: '#2e7d32' }} />
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1b5e20' }}>
                                  {analysis.consistency || 'â€”'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{
                              p: 2,
                              bgcolor: '#f1f8e9',
                              borderRadius: 2,
                              border: '1px solid #dcedc8'
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Impurity Particles
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WarningIcon sx={{ color: analysis.impurities?.detected ? '#f44336' : '#4caf50' }} />
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1b5e20' }}>
                                  {analysis.impurities?.count || 0}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Impurity details */}
                        {analysis.impurities && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#388e3c', fontWeight: 700, mb: 1 }}>
                              Impurity Analysis
                            </Typography>
                            <Box sx={{
                              p: 2,
                              bgcolor: analysis.impurities.detected ? '#fff3e0' : '#e8f5e9',
                              borderRadius: 2,
                              border: `1px solid ${analysis.impurities.detected ? '#ffb74d' : '#a5d6a7'}`
                            }}>
                              <Typography variant="body2">
                                {analysis.impurities.description || 'No impurities detected'}
                              </Typography>
                              {analysis.impurities.detected && (
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    size="small"
                                    label={`Severity: ${analysis.impurities.severity}`}
                                    sx={{
                                      bgcolor: analysis.impurities.severity === 'minimal' ? '#4caf50' :
                                              analysis.impurities.severity === 'low' ? '#2196f3' :
                                              analysis.impurities.severity === 'moderate' ? '#ff9800' : '#f44336',
                                      color: 'white',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>

                {/* ROW 4: Quantity & Yield Estimation */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <Paper elevation={2} sx={{
                    borderRadius: 3,
                    border: '1px solid #c8e6c9',
                    p: 3,
                    mb: 3,
                    bgcolor: 'white'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <AssessmentIcon sx={{ color: '#2e7d32' }} />
                      <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>
                        Quantity & Yield Estimation
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{
                          p: 2.5,
                          bgcolor: '#e3f2fd',
                          borderRadius: 2,
                          border: '1px solid #90caf9'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <OpacityIcon fontSize="small" /> Volume Estimation
                          </Typography>
                          <Typography variant="h3" sx={{ color: '#0d47a1', fontWeight: 900 }}>
                            {quantity.estimated_volume_ml?.toFixed(0)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>mL</span>
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Confidence: {quantity.confidence?.toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={quantity.confidence || 0}
                              sx={{
                                height: 8,
                                borderRadius: 99,
                                mt: 0.5,
                                bgcolor: '#bbdefb',
                                '& .MuiLinearProgress-bar': { bgcolor: '#1976d2' }
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Latex Area: {quantity.latex_area_percentage?.toFixed(1)}% of sample
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Box sx={{
                          p: 2.5,
                          bgcolor: '#e8f5e9',
                          borderRadius: 2,
                          border: '1px solid #a5d6a7'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <BiotechIcon fontSize="small" /> Dry Yield
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Wet Weight</Typography>
                              <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>
                                {yield_est.wet_weight_kg?.toFixed(2)} kg
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Dry Weight</Typography>
                              <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>
                                {yield_est.dry_weight_kg?.toFixed(2)} kg
                              </Typography>
                            </Grid>
                          </Grid>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />
                            Yield Efficiency: {yield_est.dry_yield_percentage?.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>

                {/* ROW 5: Market Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                >
                  <Paper elevation={3} sx={{
                    borderRadius: 3,
                    p: 3,
                    mb: 3,
                    background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                      <MonetizationOnIcon />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Market Price Analysis</Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                            Price per kg {liveMarketData ? '(Live RSS3)' : '(Scan Estimate)'}
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 900 }}>
                            PHP {effectivePricePerKg.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {effectiveCurrency}{liveSourceLabel ? ` | ${liveSourceLabel}` : ''}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>Total Value</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            PHP {effectiveTotalValue.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {effectiveDryYieldKg > 0 ? `Based on ${effectiveDryYieldKg.toFixed(2)} kg dry yield` : 'Estimated'}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>Market Trend</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <TimelineIcon />
                            <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                              {effectiveTrend.toLowerCase()}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            Strength: {effectiveTrendStrengthPct.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Regional Comparison */}
                    {market.regional_comparison && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>Regional Comparison (PHP/kg)</Typography>
                        <Grid container spacing={1}>
                          {Object.entries(market.regional_comparison).map(([region, price]) => (
                            <Grid item xs={6} sm={3} key={region}>
                              <Box sx={{
                                p: 1,
                                bgcolor: region === selectedRegion ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                borderRadius: 2,
                                textAlign: 'center'
                              }}>
                                <Typography variant="caption" sx={{ textTransform: 'capitalize', opacity: 0.8 }}>
                                  {region}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  PHP {price}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Paper>
                </motion.div>

                {/* ROW 6: Product Recommendations */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.36 }}
                    >
                      <Paper elevation={3} sx={{
                        borderRadius: 3,
                        p: 3,
                        height: '100%',
                        background: 'linear-gradient(135deg, #004d40 0%, #00695c 100%)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                          <FactoryIcon />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>Recommended Products</Typography>
                        </Box>

                        {recommendations.recommended_products?.length > 0 ? (
                          <List dense disablePadding>
                            {recommendations.recommended_products.map((product, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.36 + i * 0.06 }}
                              >
                                <ListItem disableGutters sx={{ py: 0.8, alignItems: 'flex-start' }}>
                                  <ListItemIcon sx={{ minWidth: 32, mt: 0.3 }}>
                                    <Box sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: 'rgba(255,255,255,0.2)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800 }}>{i + 1}</Typography>
                                    </Box>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={product.name || product}
                                    secondary={product.description || `DRC: ${product.drc_requirement || 'N/A'}`}
                                    primaryTypographyProps={{ variant: 'body2', sx: { color: 'white', fontWeight: 600 } }}
                                    secondaryTypographyProps={{ variant: 'caption', sx: { color: 'rgba(255,255,255,0.7)' } }}
                                  />
                                </ListItem>
                              </motion.div>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            No product recommendations available.
                          </Typography>
                        )}

                        {recommendations.processing_required && (
                          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                            <Typography variant="caption">
                              ⚠️ Pre-purification recommended before use
                            </Typography>
                          </Alert>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Paper elevation={3} sx={{
                        borderRadius: 3,
                        p: 3,
                        height: '100%',
                        background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                          <BiotechIcon />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>Processing Recommendations</Typography>
                        </Box>

                        {recommendations.suggested_applications?.length > 0 ? (
                          <List dense disablePadding>
                            {recommendations.suggested_applications.map((app, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.06 }}
                              >
                                <ListItem disableGutters sx={{ py: 0.8 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <CheckCircleIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
                                  </ListItemIcon>
                                  <ListItemText primary={app} primaryTypographyProps={{ variant: 'body2', sx: { color: 'rgba(255,255,255,0.9)' } }} />
                                </ListItem>
                              </motion.div>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            No specific applications available.
                          </Typography>
                        )}

                        {analysis.drc_category && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.8 }}>
                              Best suited for:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {analysis.drc_category === 'Excellent' ? 'Premium medical products' :
                               analysis.drc_category === 'Good' ? 'Industrial applications' :
                               analysis.drc_category === 'Average' ? 'General rubber goods' :
                               'Recycled products & fillers'}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* All Predictions */}
                {analysisResult.all_predictions?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.44 }}
                  >
                    <Paper elevation={2} sx={{ borderRadius: 3, border: '1px solid #c8e6c9', p: 3, mb: 3, bgcolor: 'white' }}>
                      <Typography variant="subtitle2" sx={{ color: '#388e3c', fontWeight: 700, mb: 1.5 }}>
                        Top Classifications
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResult.all_predictions.map((pred, i) => (
                          <Chip
                            key={i}
                            label={`${pred.class} (${pred.confidence.toFixed(0)}%)`}
                            size="small"
                            sx={i === 0
                              ? { bgcolor: '#2e7d32', color: 'white', fontWeight: 600 }
                              : { bgcolor: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7', fontWeight: 500 }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </motion.div>
                )}

                {/* Detection Boxes Summary */}
                {latexDetections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.46 }}
                  >
                    <Paper elevation={2} sx={{ borderRadius: 3, border: '1px solid #c8e6c9', p: 3, mb: 3, bgcolor: 'white' }}>
                      <Typography variant="subtitle2" sx={{ color: '#388e3c', fontWeight: 700, mb: 1.5 }}>
                        Detected Latex Boxes ({latexDetections.length})
                      </Typography>
                      <Grid container spacing={1.5}>
                        {latexDetections.slice(0, 6).map((det, i) => (
                          <Grid item xs={12} md={6} key={`det-${i}`}>
                            <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dcedc8', bgcolor: '#f9fff5' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1b5e20' }}>
                                {det.class || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Confidence: {Number(det.confidence || 0).toFixed(1)}%
                              </Typography>
                              {Array.isArray(det.bbox) && det.bbox.length === 4 && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Box: [{det.bbox.join(', ')}]
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* Visualization */}
                {visualizationSrc && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.48 }}
                  >
                    <Paper elevation={2} sx={{ borderRadius: 3, border: '1px solid #c8e6c9', p: 3, mb: 3, bgcolor: 'white' }}>
                      <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700, mb: 2 }}>
                        Analysis Visualization
                      </Typography>
                      <Box sx={{ textAlign: 'center' }}>
                        <motion.img
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={visualizationSrc}
                          alt="Analysis visualization"
                          style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '2px solid #c8e6c9' }}
                        />
                      </Box>
                    </Paper>
                  </motion.div>
                )}

                {/* Metadata */}
                {imageMetadata && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1 }}>
                    <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      Analyzed: {analyzedAtValue ? new Date(analyzedAtValue).toLocaleString() : 'N/A'} ·
                      File: {fileNameValue || 'N/A'} ·
                      Size: {fileSizeValue ?? 'N/A'} KB
                    </Typography>
                  </Box>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>

      {/* SOURCE CHOOSER DIALOG */}
      <Dialog
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>Add Latex Image</Typography>
          <IconButton onClick={() => setChooserOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
            How would you like to add your latex sample image?
          </Typography>
          <Grid container spacing={2} alignItems="stretch">
            {[
              { 
                icon: <CloudUploadIcon sx={{ fontSize: 52, color: '#2e7d32' }} />, 
                label: 'Upload Image', 
                sub: 'From your device', 
                onClick: () => { 
                  setChooserOpen(false); 
                  fileInputRef.current?.click(); 
                } 
              },
              { 
                icon: <PhotoCameraIcon sx={{ fontSize: 52, color: '#2e7d32' }} />, 
                label: 'Take a Photo', 
                sub: 'Use your camera', 
                onClick: () => { 
                  setChooserOpen(false); 
                  setCameraOpen(true); 
                } 
              }
            ].map(({ icon, label, sub, onClick }) => (
              <Grid item xs={6} key={label} sx={{ display: 'flex' }}>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ width: '100%' }}>
                  <Box
                    onClick={onClick}
                    sx={{
                      border: '2px dashed #2e7d32',
                      borderRadius: 3,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: '#f1f8e9',
                      transition: 'all 0.2s',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      '&:hover': {
                        bgcolor: '#e8f5e9',
                        borderColor: '#1b5e20'
                      }
                    }}
                  >
                    {icon}
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1b5e20' }}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{sub}</Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* CAMERA DIALOG */}
      <Dialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon />
            <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>Capture Latex Sample</Typography>
          </Box>
          <IconButton onClick={() => setCameraOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000', position: 'relative' }}>
          {cameraError ? (
            <Box sx={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 3 }}>
              <ErrorIcon sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
              <Typography variant="h6" color="error">Camera Error</Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>{cameraError}</Typography>
            </Box>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: 'auto', maxHeight: 500, objectFit: 'cover', display: 'block' }}
              />
              <Box sx={{ position: 'absolute', inset: 0, border: '4px solid #2e7d32', pointerEvents: 'none' }} />
              <Box sx={{
                position: 'absolute',
                bottom: 16,
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'white',
                textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                pointerEvents: 'none'
              }}>
                <Typography variant="body2">Position latex sample in frame and tap capture</Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 2.5, bgcolor: '#f5f5f5' }}>
          <Button
            variant="contained"
            onClick={handleFlipCamera}
            disabled={!!cameraError}
            startIcon={<FlipCameraIcon />}
            sx={{
              bgcolor: '#2e7d32',
              borderRadius: 99,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1b5e20' },
              '&:disabled': { bgcolor: '#ccc' }
            }}
          >
            Flip Camera
          </Button>
          <Fab
            onClick={captureImage}
            disabled={!stream || capturing || !!cameraError}
            sx={{
              bgcolor: '#f44336',
              '&:hover': { bgcolor: '#c62828' },
              width: 70,
              height: 70,
              boxShadow: '0 4px 18px rgba(244,67,54,0.45)'
            }}
          >
            {capturing ? <CircularProgress size={28} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 30 }} />}
          </Fab>
          <Button
            variant="outlined"
            onClick={() => setCameraOpen(false)}
            disabled={capturing}
            startIcon={<CloseIcon />}
            sx={{
              borderColor: '#bdbdbd',
              color: '#616161',
              borderRadius: 99,
              textTransform: 'none',
              '&:hover': { borderColor: '#9e9e9e' }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <UserFooter />
    </>
  );
};

export default LatexDetection;



