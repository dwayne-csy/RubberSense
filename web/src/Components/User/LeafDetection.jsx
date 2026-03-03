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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
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
  Grass as GrassIcon,
  BugReport as BugReportIcon,
  Agriculture as AgricultureIcon,
  Opacity as OpacityIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  FlipCameraAndroid as FlipCameraIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const LeafDetection = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);

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

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (res.data.success) setUser(res.data.user);
        else { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
      } catch {
        localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
      } finally { setLoading(false); }
    };
    const fetchSystemInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/leaf/info`);
        if (res.data.success) setSystemInfo(res.data.data);
      } catch {}
    };
    checkAuth();
    fetchSystemInfo();
  }, [navigate, API_BASE_URL]);

  useEffect(() => () => { if (stream) stream.getTracks().forEach(t => t.stop()); }, [stream]);

  useEffect(() => {
    if (cameraOpen) startCamera();
    else if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
  }, [cameraOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch {
      setCameraError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const handleFlipCamera = () => setFacingMode(p => p === 'user' ? 'environment' : 'user');

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => {
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setCameraOpen(false); setCapturing(false);
      setAnalysisResult(null); setSuccessMessage(null); setError(null);
    }, 'image/jpeg', 0.95);
  };

  const handleImageSelect = e => { if (e.target.files[0]) processSelectedFile(e.target.files[0]); };

  const processSelectedFile = (file) => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type))
      return setError('Invalid file type. Please select a JPEG, PNG, or WebP image.');
    if (file.size > 10 * 1024 * 1024) return setError('File too large. Maximum size is 10MB.');
    setError(null); setSelectedImage(file); setAnalysisResult(null); setSuccessMessage(null);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return setError('Please select an image first.');
    setAnalyzing(true); setError(null); setSuccessMessage(null);
    try {
      const fd = new FormData(); fd.append('image', selectedImage);
      const res = await axios.post(`${API_BASE_URL}/api/v1/leaf/analyze`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      });
      if (res.data.success) { 
        setAnalysisResult(res.data.data); 
        setSuccessMessage('Analysis completed successfully!'); 
      }
      else throw new Error(res.data.message || 'Analysis failed');
    } catch (err) {
      if (err.code === 'ECONNABORTED') setError('Request timeout. The server is taking too long to respond.');
      else if (err.response?.status === 500) setError('Server error: ' + (err.response?.data?.error || 'Internal server error.'));
      else if (err.response?.status === 401) { setError('Authentication failed. Please login again.'); localStorage.removeItem('token'); navigate('/login'); }
      else setError(err.response?.data?.message || err.message || 'Error analyzing image. Please try again.');
    } finally { setAnalyzing(false); }
  };

  const handleReset = () => {
    setSelectedImage(null); setImagePreview(null); setAnalysisResult(null);
    setError(null); setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getHealthStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':  return '#4caf50';
      case 'diseased': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getHealthGradient = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':  return 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
      case 'diseased': return 'linear-gradient(135deg, #f44336 0%, #b71c1c 100%)';
      default: return 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'none':     return '#4caf50';
      case 'low':      return '#2196f3';
      case 'moderate': return '#ff9800';
      case 'high':
      case 'critical': return '#f44336';
      default: return '#757575';
    }
  };

  const getColorHex = (colorName) => {
    switch (colorName?.toLowerCase()) {
      case 'green':      return '#4caf50';
      case 'yellow':     return '#ffeb3b';
      case 'brown':      return '#795548';
      case 'dark_spots': return '#212121';
      default: return '#2e7d32';
    }
  };

  const getTextureIcon = (texture) => {
    switch (texture?.toLowerCase()) {
      case 'smooth':   return <SpaIcon sx={{ color: '#4caf50' }} />;
      case 'moderate': return <TextureIcon sx={{ color: '#ff9800' }} />;
      default:         return <WarningIcon sx={{ color: '#f44336' }} />;
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const reportData = {
      ...analysisResult,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.email,
      analysisId: analysisResult.analysisId
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `leaf-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#2e7d32' }} />
      </motion.div>
      <Typography variant="h6" sx={{ mt: 3, color: '#2e7d32', fontWeight: 500 }}>Loading Leaf Detection System...</Typography>
    </Box>
  );

  // Extract data with proper null checks
  const diseaseInfo = analysisResult?.diseaseInfo || {};
  const visualMetrics = analysisResult?.visualMetrics || {};
  const image = analysisResult?.image || {};
  const modelInfo = analysisResult?.modelInfo || {};
  const imageMetadata = analysisResult?.imageMetadata || {};
  const isHealthy = diseaseInfo?.healthStatus?.toLowerCase() === 'healthy';
  const detections = Array.isArray(analysisResult?.detections) ? analysisResult.detections : [];
  const hasDetectionBoxes = detections.some((d) => Array.isArray(d?.bbox) && d.bbox.length === 4);
  const visualizationValue = analysisResult?.visualization;
  const visualizationSrc =
    typeof visualizationValue === 'string' && visualizationValue.length > 0
      ? (visualizationValue.startsWith('data:image') || visualizationValue.startsWith('http')
          ? visualizationValue
          : `data:image/jpeg;base64,${visualizationValue}`)
      : null;

  return (
    <>
      <UserHeader />

      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: '80px', pb: '90px' }}>
        <Container maxWidth="lg">

          {/* ── HERO ── */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Paper elevation={3} sx={{
              p: { xs: 3, md: 5 }, mb: 4,
              background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 55%, #388e3c 100%)',
              color: 'white', borderRadius: 4, position: 'relative', overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <Box sx={{ position: 'absolute', bottom: -40, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

              {/* History / Stats buttons */}
              <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 2, display: 'flex', gap: 1.5 }}>
                <Button component={Link} to="/leaf-history" variant="contained" size="small" startIcon={<HistoryIcon />}
                  sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2, textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                  History
                </Button>
                <Button component={Link} to="/leaf-stats" variant="contained" size="small" startIcon={<AssessmentIcon />}
                  sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2, textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                  Statistics
                </Button>
              </Box>

              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>🌿 Rubber Tree Leaf Analysis</Typography>
                <Typography variant="h6" sx={{ opacity: 0.85, mb: 2.5 }}>
                  AI-Powered Disease Detection &amp; Classification System
                </Typography>
                {systemInfo && (
                  <Chip
                    icon={systemInfo.systemStatus?.mlReady ? <CheckCircleIcon /> : <WarningIcon />}
                    label={systemInfo.systemStatus?.mlReady ? 'ML Model Active' : 'Using Fallback Analysis'}
                    sx={{
                      bgcolor: systemInfo.systemStatus?.mlReady ? 'rgba(76,175,80,0.22)' : 'rgba(255,152,0,0.22)',
                      color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* ── ALERTS ── */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="error" onClose={() => setError(null)} icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
              </motion.div>
            )}
            {successMessage && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="success" onClose={() => setSuccessMessage(null)} icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>{successMessage}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── UPLOAD PANEL ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, border: '2px solid #2e7d32', bgcolor: 'white' }}>
              <Typography variant="h5" sx={{ color: '#2e7d32', mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon /> Upload or Capture Leaf Image
              </Typography>

              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <motion.img
                    src={imagePreview} alt="Leaf preview"
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 16, border: '3px solid #2e7d32', display: 'block' }}
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  />
                  <IconButton onClick={handleReset} sx={{
                    position: 'absolute', top: 10, right: 10,
                    bgcolor: 'rgba(244,67,54,0.9)', color: 'white', '&:hover': { bgcolor: '#d32f2f' }
                  }}>
                    <RestartAltIcon />
                  </IconButton>
                </Box>
              ) : (
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Box onClick={() => setChooserOpen(true)} sx={{
                    border: '3px dashed #2e7d32', borderRadius: 4, p: { xs: 5, md: 8 },
                    textAlign: 'center', cursor: 'pointer', bgcolor: '#f1f8e9',
                    transition: 'all 0.25s',
                    '&:hover': { bgcolor: '#e8f5e9', borderColor: '#1b5e20' }
                  }}>
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                      <AddPhotoAlternateIcon sx={{ fontSize: 90, color: '#2e7d32', mb: 2 }} />
                    </motion.div>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 700, mb: 0.5 }}>Add Leaf Image</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Click to <strong>take a photo</strong> or <strong>upload from device</strong>
                    </Typography>
                    <Typography variant="caption" color="text.disabled">JPEG · PNG · WebP — max 10 MB</Typography>
                  </Box>
                </motion.div>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect} style={{ display: 'none' }} />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
                <Button variant="contained" size="large" onClick={handleAnalyze}
                  disabled={!selectedImage || analyzing}
                  startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
                  sx={{
                    bgcolor: '#2e7d32', px: 6, py: 1.5, borderRadius: 3, fontSize: '1.1rem',
                    fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
                    '&:hover': { bgcolor: '#1b5e20' },
                    '&:disabled': { bgcolor: '#c8e6c9', color: '#81c784' }
                  }}>
                  {analyzing ? 'Analyzing...' : 'Analyze Leaf'}
                </Button>
                {selectedImage && !analyzing && (
                  <Button variant="outlined" size="large" onClick={handleReset} startIcon={<RestartAltIcon />}
                    sx={{
                      borderColor: '#2e7d32', color: '#2e7d32', px: 4, py: 1.5,
                      borderRadius: 3, fontSize: '1.1rem', textTransform: 'none',
                      '&:hover': { borderColor: '#1b5e20', bgcolor: '#f1f8e9' }
                    }}>
                    Reset
                  </Button>
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* ══════════ RESULTS ══════════ */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.55 }}>

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

                {/* ML banner */}
                {modelInfo && (
                  <Alert severity={modelInfo.fallback ? 'warning' : 'success'} 
                    icon={modelInfo.fallback ? <WarningIcon /> : <ScienceIcon />} 
                    sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      {modelInfo.fallback
                        ? '⚠️ Fallback analysis: ML model unavailable'
                        : `✅ Analyzed using ML model: ${modelInfo.model_file || modelInfo.modelUsed || 'Leaf.pt'}`}
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon /> Analysis Results
                  </Typography>
                  <Button variant="outlined" size="small" onClick={downloadReport} startIcon={<DownloadIcon />}
                    sx={{ borderColor: '#2e7d32', color: '#2e7d32', borderRadius: 3, textTransform: 'none',
                      '&:hover': { borderColor: '#1b5e20', bgcolor: '#f1f8e9' } }}>
                    Download Report
                  </Button>
                </Box>

                {/* ── ROW 1: Health Status hero ── */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card elevation={3} sx={{ borderRadius: 3, mb: 3, background: getHealthGradient(diseaseInfo.healthStatus), color: 'white' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                            Health Status
                          </Typography>
                          <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.1, textTransform: 'capitalize' }}>
                            {diseaseInfo.healthStatus || 'Unknown'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Detection Confidence</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {diseaseInfo.confidence?.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={diseaseInfo.confidence || 0}
                            sx={{ height: 16, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.25)',
                              '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 99 } }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>0%</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>100%</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ── ROW 2: Disease · Spots · Color ── */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Card elevation={2} sx={{ borderRadius: 3, border: '2px solid #2e7d32', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem', mb: 1.5 }}>
                            Disease Detected
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 800, mb: 1.5 }}>
                            {diseaseInfo.name || 'Unknown'}
                          </Typography>
                          <Chip
                            label={`Severity: ${diseaseInfo.severity || 'Unknown'}`}
                            size="small"
                            sx={{ bgcolor: getSeverityColor(diseaseInfo.severity), color: 'white', fontWeight: 600 }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      <Card elevation={2} sx={{ borderRadius: 3, border: '2px solid #2e7d32', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <BugReportIcon sx={{ color: '#2e7d32' }} />
                            <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                              Spots Detected
                            </Typography>
                          </Box>
                          <Typography variant="h2" sx={{ color: '#1b5e20', fontWeight: 900, lineHeight: 1 }}>
                            {visualMetrics.spotCount ?? 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Card elevation={2} sx={{ borderRadius: 3, border: '2px solid #2e7d32', height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <ColorLensIcon sx={{ color: '#2e7d32' }} />
                            <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                              Dominant Color
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 36, height: 36, borderRadius: '50%',
                              bgcolor: getColorHex(visualMetrics.dominantColor),
                              border: '2px solid #e0e0e0', flexShrink: 0
                            }} />
                            <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 800, textTransform: 'capitalize' }}>
                              {visualMetrics.dominantColor || 'Unknown'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* ── ROW 3: Visual Analysis ── */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                  <Paper elevation={2} sx={{ borderRadius: 3, border: '1px solid #c8e6c9', p: 3, mb: 3, bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <ColorLensIcon sx={{ color: '#2e7d32' }} />
                      <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>Visual Analysis</Typography>
                    </Box>
                    <Grid container spacing={3} alignItems="center">
                      {/* Color swatch */}
                      <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: 110, height: 110, borderRadius: '50%', mx: 'auto', mb: 1.5,
                          background: `linear-gradient(135deg, ${getColorHex(visualMetrics.dominantColor)}, #2e7d32)`,
                          border: '4px solid #e8f5e9',
                          boxShadow: `0 4px 24px ${getColorHex(visualMetrics.dominantColor)}66`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <ColorLensIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.85)' }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'capitalize' }}>
                          {visualMetrics.dominantColor || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Dominant Color</Typography>
                      </Grid>

                      {/* Metrics */}
                      <Grid item xs={12} sm={9}>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ p: 2, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #dcedc8' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Texture</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTextureIcon(visualMetrics.texture)}
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1b5e20', textTransform: 'capitalize' }}>
                                  {visualMetrics.texture || '—'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ p: 2, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #dcedc8' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Leaf Coverage</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1b5e20' }}>
                                {visualMetrics.leafCoverage ?? 0}%
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Color distribution bars */}
                        {visualMetrics.colorDistribution && (
                          <>
                            <Typography variant="subtitle2" sx={{ color: '#388e3c', fontWeight: 700, mb: 1.5 }}>Color Distribution</Typography>
                            {Object.entries(visualMetrics.colorDistribution).map(([color, pct]) => (
                              <Box key={color} sx={{ mb: 1.2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                  <Typography variant="caption" sx={{ textTransform: 'capitalize', color: '#555' }}>{color}</Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1b5e20' }}>{pct}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={pct}
                                  sx={{ height: 8, borderRadius: 99, bgcolor: '#e8f5e9',
                                    '& .MuiLinearProgress-bar': { bgcolor: getColorHex(color), borderRadius: 99 } }} />
                              </Box>
                            ))}
                          </>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>

                {/* ── ROW 4: Disease Analysis (symptoms + causes) ── */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                  <Paper elevation={2} sx={{ borderRadius: 3, border: '1px solid #c8e6c9', p: 3, mb: 3, bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <BugReportIcon sx={{ color: '#2e7d32' }} />
                      <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 700 }}>Disease Analysis</Typography>
                    </Box>

                    {isHealthy ? (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Tree is Healthy</Typography>
                        <Typography variant="body2">No signs of disease detected. Continue regular monitoring.</Typography>
                      </Alert>
                    ) : (
                      <>
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {diseaseInfo.name} Detected
                          </Typography>
                          <Typography variant="body2">Confidence: {diseaseInfo.confidence?.toFixed(1)}%</Typography>
                        </Alert>

                        {diseaseInfo.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 0.5 }}>
                            {diseaseInfo.description}
                          </Typography>
                        )}

                        <Grid container spacing={3}>
                          {/* Symptoms */}
                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                              <Typography variant="subtitle2" sx={{ color: '#e65100', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <WarningIcon sx={{ fontSize: 16 }} /> Symptoms
                              </Typography>
                              <List dense disablePadding>
                                {analysisResult.symptoms?.length ? analysisResult.symptoms.map((s, i) => (
                                  <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                                    <ListItemIcon sx={{ minWidth: 28 }}><WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} /></ListItemIcon>
                                    <ListItemText primary={s} primaryTypographyProps={{ variant: 'body2' }} />
                                  </ListItem>
                                )) : <ListItem disableGutters><ListItemText primary="No symptom information available" primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} /></ListItem>}
                              </List>
                            </Box>
                          </Grid>

                          {/* Causes */}
                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                              <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <InfoIcon sx={{ fontSize: 16 }} /> Causes
                              </Typography>
                              <List dense disablePadding>
                                {analysisResult.causes?.length ? analysisResult.causes.map((c, i) => (
                                  <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                                    <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: '#2196f3', fontSize: 16 }} /></ListItemIcon>
                                    <ListItemText primary={c} primaryTypographyProps={{ variant: 'body2' }} />
                                  </ListItem>
                                )) : <ListItem disableGutters><ListItemText primary="No cause information available" primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} /></ListItem>}
                              </List>
                            </Box>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Paper>
                </motion.div>

                {/* ── ROW 5: Treatment + Recommendations ── */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Treatment */}
                  <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                      <Paper elevation={3} sx={{
                        borderRadius: 3, p: 3, height: '100%',
                        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                        color: 'white', position: 'relative', overflow: 'hidden'
                      }}>
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                          <HealingIcon />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>Treatment</Typography>
                        </Box>
                        {analysisResult.treatment?.length ? (
                          <List dense disablePadding>
                            {analysisResult.treatment.map((t, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 + i * 0.06 }}>
                                <ListItem disableGutters sx={{ py: 0.6, alignItems: 'flex-start' }}>
                                  <ListItemIcon sx={{ minWidth: 32, mt: 0.3 }}>
                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800 }}>{i + 1}</Typography>
                                    </Box>
                                  </ListItemIcon>
                                  <ListItemText primary={t} primaryTypographyProps={{ variant: 'body2', sx: { color: 'rgba(255,255,255,0.9)' } }} />
                                </ListItem>
                              </motion.div>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>No treatment information available.</Typography>
                        )}

                        {analysisResult.prevention?.length > 0 && (
                          <>
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 2 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, opacity: 0.9 }}>Prevention</Typography>
                            <List dense disablePadding>
                              {analysisResult.prevention.map((p, i) => (
                                <ListItem key={i} disableGutters sx={{ py: 0.4 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleIcon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }} /></ListItemIcon>
                                  <ListItemText primary={p} primaryTypographyProps={{ variant: 'body2', sx: { color: 'rgba(255,255,255,0.85)' } }} />
                                </ListItem>
                              ))}
                            </List>
                          </>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>

                  {/* Recommendations */}
                  <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}>
                      <Paper elevation={3} sx={{
                        borderRadius: 3, p: 3, height: '100%',
                        background: 'linear-gradient(135deg, #4e342e 0%, #3e2723 100%)',
                        color: 'white', position: 'relative', overflow: 'hidden'
                      }}>
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                          <AgricultureIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>Care Recommendations</Typography>
                        </Box>
                        {analysisResult.recommendations?.length ? (
                          <List dense disablePadding>
                            {analysisResult.recommendations.map((r, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.37 + i * 0.06 }}>
                                <ListItem disableGutters sx={{ py: 0.6, alignItems: 'flex-start' }}>
                                  <ListItemIcon sx={{ minWidth: 32, mt: 0.3 }}>
                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800 }}>{i + 1}</Typography>
                                    </Box>
                                  </ListItemIcon>
                                  <ListItemText primary={r} primaryTypographyProps={{ variant: 'body2', sx: { color: 'rgba(255,255,255,0.9)' } }} />
                                </ListItem>
                              </motion.div>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>No recommendations available.</Typography>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* ── Top Predictions chips ── */}
                {diseaseInfo.allPredictions?.length > 1 && (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
                    <Paper elevation={2} sx={{ borderRadius: 3, border: '1px solid #c8e6c9', p: 3, mb: 3, bgcolor: 'white' }}>
                      <Typography variant="subtitle2" sx={{ color: '#388e3c', fontWeight: 700, mb: 1.5 }}>Top Predictions</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {diseaseInfo.allPredictions.map((pred, i) => (
                          <Chip key={i}
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

                {/* Detection Visualization */}
                {(visualizationSrc || hasDetectionBoxes) && (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
                    <Paper elevation={2} sx={{ borderRadius: 3, border: '1px solid #c8e6c9', p: 3, mb: 3, bgcolor: 'white' }}>
                      <Typography variant='h6' sx={{ color: '#1b5e20', fontWeight: 700, mb: 2 }}>Detection Visualization</Typography>
                      {visualizationSrc && (
                        <Box sx={{ textAlign: 'center', mb: hasDetectionBoxes ? 2 : 0 }}>
                          <motion.img
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            src={visualizationSrc}
                            alt='Analysis visualization'
                            style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '2px solid #c8e6c9' }}
                          />
                        </Box>
                      )}

                      {hasDetectionBoxes && (
                        <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                          <Table size='small'>
                            <TableBody>
                              {detections
                                .filter((d) => Array.isArray(d?.bbox) && d.bbox.length === 4)
                                .map((det, idx) => {
                                  const [x1, y1, x2, y2] = det.bbox.map((v) => Number(v).toFixed(1));
                                  return (
                                    <TableRow key={`leaf-box-${idx}`}>
                                      <TableCell sx={{ fontWeight: 700, color: '#1b5e20', width: '34%' }}>
                                        {det.class || det.display_name || det.original_class || `Detection ${idx + 1}`}
                                      </TableCell>
                                      <TableCell sx={{ color: '#2e7d32', width: '22%' }}>
                                        {Number(det.confidence || 0).toFixed(2)}%
                                      </TableCell>
                                      <TableCell sx={{ color: '#616161' }}>
                                        [{x1}, {y1}] to [{x2}, {y2}]
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Paper>
                  </motion.div>
                )}

                {/* Metadata */}
                {imageMetadata && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1 }}>
                    <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      Analyzed: {new Date(imageMetadata.analyzedAt).toLocaleString()} ·
                      File: {imageMetadata.filename} ·
                      Size: {imageMetadata.fileSizeKB} KB
                      {imageMetadata.source === 'camera' ? ' · Camera capture' : ''}
                    </Typography>
                  </Box>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>

      {/* ══════════ SOURCE CHOOSER DIALOG ══════════ */}
      <Dialog open={chooserOpen} onClose={() => setChooserOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>Add Leaf Image</Typography>
          <IconButton onClick={() => setChooserOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
            How would you like to add your image?
          </Typography>
          <Grid container spacing={2} alignItems="stretch">
            {[
              { icon: <CloudUploadIcon sx={{ fontSize: 52, color: '#2e7d32' }} />, label: 'Upload Image', sub: 'From your device', onClick: () => { setChooserOpen(false); fileInputRef.current?.click(); } },
              { icon: <PhotoCameraIcon sx={{ fontSize: 52, color: '#2e7d32' }} />, label: 'Take a Photo', sub: 'Use your camera', onClick: () => { setChooserOpen(false); setCameraOpen(true); } }
            ].map(({ icon, label, sub, onClick }) => (
              <Grid item xs={6} key={label} sx={{ display: 'flex' }}>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ width: '100%' }}>
                  <Box onClick={onClick} sx={{
                    border: '2px dashed #2e7d32', borderRadius: 3, p: 3, textAlign: 'center',
                    cursor: 'pointer', bgcolor: '#f1f8e9', transition: 'all 0.2s',
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                    '&:hover': { bgcolor: '#e8f5e9', borderColor: '#1b5e20' }
                  }}>
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

      {/* ══════════ CAMERA DIALOG ══════════ */}
      <Dialog open={cameraOpen} onClose={() => setCameraOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon />
            <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>Capture Leaf Image</Typography>
          </Box>
          <IconButton onClick={() => setCameraOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
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
              <video ref={videoRef} autoPlay playsInline
                style={{ width: '100%', height: 'auto', maxHeight: 500, objectFit: 'cover', display: 'block' }} />
              <Box sx={{ position: 'absolute', inset: 0, border: '4px solid #2e7d32', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center',
                color: 'white', textShadow: '1px 1px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
                <Typography variant="body2">Position leaf in frame and tap capture</Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 2.5, bgcolor: '#f5f5f5' }}>
          <Button variant="contained" onClick={handleFlipCamera} disabled={!!cameraError} startIcon={<FlipCameraIcon />}
            sx={{ bgcolor: '#2e7d32', borderRadius: 99, textTransform: 'none', '&:hover': { bgcolor: '#1b5e20' }, '&:disabled': { bgcolor: '#ccc' } }}>
            Flip Camera
          </Button>
          <Fab onClick={captureImage} disabled={!stream || capturing || !!cameraError}
            sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#c62828' }, width: 70, height: 70, boxShadow: '0 4px 18px rgba(244,67,54,0.45)' }}>
            {capturing ? <CircularProgress size={28} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 30 }} />}
          </Fab>
          <Button variant="outlined" onClick={() => setCameraOpen(false)} disabled={capturing} startIcon={<CloseIcon />}
            sx={{ borderColor: '#bdbdbd', color: '#616161', borderRadius: 99, textTransform: 'none', '&:hover': { borderColor: '#9e9e9e' } }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <UserFooter />
    </>
  );
};

export default LeafDetection;
