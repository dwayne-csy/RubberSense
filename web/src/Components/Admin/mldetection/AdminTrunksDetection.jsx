import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LeftNavigationBar from '../../layouts/LeftNavigationBar';
import {
  Box, Container, Typography, Button, Paper, CircularProgress,
  Alert, Grid, Card, CardContent, LinearProgress, Chip,
  IconButton, List, ListItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Fab,
  Tooltip, Table, TableBody, TableCell, TableContainer, TableRow,
} from '@mui/material';
import {
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
  Forest as ForestIcon,
  BugReport as BugReportIcon,
  Agriculture as AgricultureIcon,
  Timeline as TimelineIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  FlipCameraAndroid as FlipCameraIcon,
  Assessment as AssessmentIcon,
  Biotech as BiotechIcon,
  WaterDrop as WaterDropIcon,
  FileUpload as FileUploadIcon,
  Park as ParkIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const SectionLabel = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: '#8B4513', flexShrink: 0 }} />
    {icon}
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#3E2723', letterSpacing: 0.3 }}>
      {label}
    </Typography>
  </Box>
);

const AdminTrunksDetection = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);

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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || user.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
      
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setLoading(false);
      } catch {
        navigate('/admin/login');
      }
    };
    
    const fetchSystemInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/admin/ml/trunks/info`);
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
      const file = new File([blob], `trunk-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setCameraOpen(false); setCapturing(false);
      setAnalysisResult(null); setSuccessMessage(null); setError(null);
    }, 'image/jpeg', 0.95);
  };

  const handleImageSelect = e => { if (e.target.files?.[0]) processSelectedFile(e.target.files[0]); };

  const processSelectedFile = file => {
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
      const fd = new FormData();
      fd.append('image', selectedImage);
      
      const res = await axios.post(`${API_BASE_URL}/api/v1/admin/ml/trunks/analyze`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000,
      });
      
      if (res.data.success) {
        setAnalysisResult(res.data.data);
        setSuccessMessage('Analysis completed successfully!');
      } else {
        setError(res.data.message || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') setError('Analysis timed out. Please try again.');
      else if (err.response?.status === 401) { setError('Authentication failed. Please login again.'); localStorage.removeItem('token'); navigate('/admin/login'); }
      else setError(err.response?.data?.message || 'Error analyzing image. Please try again.');
    } finally { setAnalyzing(false); }
  };

  const handleReset = () => {
    setSelectedImage(null); setImagePreview(null); setAnalysisResult(null);
    setError(null); setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helpers
  const getHealthScoreGradient = score => {
    if (score >= 80) return 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #e65100 0%, #ef6c00 60%, #f57c00 100%)';
    if (score >= 40) return 'linear-gradient(135deg, #b71c1c 0%, #c62828 60%, #d32f2f 100%)';
    return 'linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)';
  };

  const getHealthScoreLabel = score => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Critical';
  };

  const getMaturityIcon = cls =>
    cls?.toLowerCase() === 'immature'
      ? <GrassIcon sx={{ color: '#8B4513' }} />
      : <ForestIcon sx={{ color: '#8B4513' }} />;

  const getTextureIcon = type => {
    switch (type?.toLowerCase()) {
      case 'smooth': return <SpaIcon sx={{ color: '#2e7d32' }} />;
      case 'moderately rough':
      case 'rough': return <TextureIcon sx={{ color: '#e65100' }} />;
      case 'very rough / cracked': return <WarningIcon sx={{ color: '#c62828' }} />;
      default: return <TextureIcon sx={{ color: '#8B4513' }} />;
    }
  };

  const getSeverityColor = s => {
    switch (s?.toLowerCase()) {
      case 'none': return '#2e7d32';
      case 'low': return '#1565c0';
      case 'moderate': return '#e65100';
      case 'high': case 'critical': return '#b71c1c';
      default: return '#546e7a';
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify({
      ...analysisResult, generatedAt: new Date().toISOString(),
      analysisType: 'admin',
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `admin-trunk-analysis-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f5f0eb' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <CircularProgress size={52} thickness={3} sx={{ color: '#8B4513' }} />
      </motion.div>
      <Typography variant="body1" sx={{ mt: 3, color: '#8B4513', fontWeight: 600 }}>Loading Admin Trunk Detection System...</Typography>
    </Box>
  );

  // Data extraction
  const image = analysisResult?.image || {};
  const primaryDetection = analysisResult?.primary_detection || {};
  const maturity = analysisResult?.maturity || {};
  const visualAnalysis = analysisResult?.visual_analysis || {};
  const disease = analysisResult?.disease || {};
  const detections = analysisResult?.all_detections || analysisResult?.detections || [];
  const detectionCount = Array.isArray(detections) ? detections.length : 0;
  const meanDetectionConfidence = detectionCount > 0
    ? Math.round(detections.reduce((sum, d) => sum + Number(d?.confidence || 0), 0) / detectionCount) : 0;
  const hasColorAnalysis = Boolean(visualAnalysis?.color && Object.keys(visualAnalysis.color).length > 0);
  const hasTextureAnalysis = Boolean(visualAnalysis?.texture && Object.keys(visualAnalysis.texture).length > 0);
  const isHealthy = !disease?.detected;
  const visualizationValue = analysisResult?.visualization;
  const visualizationSrc =
    typeof visualizationValue === 'string' && visualizationValue.length > 0
      ? (visualizationValue.startsWith('data:image') || visualizationValue.startsWith('http')
          ? visualizationValue : `data:image/jpeg;base64,${visualizationValue}`)
      : null;
  const hasBoxCoordinates = detectionCount > 0 && detections.some(d => Array.isArray(d?.bbox) && d.bbox.length === 4);
  const healthScore = analysisResult?.health_score || analysisResult?.healthScore || 0;

  return (
    <>
  
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f0eb', pt: '80px', pb: '90px' }}>
        <Container maxWidth="lg">
          {/* HERO */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Paper elevation={0} sx={{
              p: { xs: 3, md: 4.5 }, mb: 3,
              background: 'linear-gradient(135deg, #1a0a00 0%, #3E2723 55%, #5D3A1A 100%)',
              color: 'white', borderRadius: 3, position: 'relative', overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <Box sx={{ position: 'absolute', bottom: -50, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8 }}>
                  <ParkIcon sx={{ fontSize: 30 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>Admin Trunk Analysis</Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.72, maxWidth: 480 }}>
                  ML-powered maturity detection & disease classification system
                </Typography>
                {systemInfo?.mlModel?.status === 'Active' && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                    label={`Model: ${systemInfo.mlModel.name}`}
                    size="small"
                    sx={{ mt: 1.5, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.72rem' }}
                  />
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* ALERTS */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>
              </motion.div>
            )}
            {successMessage && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2.5, borderRadius: 2 }}>{successMessage}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* UPLOAD PANEL */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: 3, border: '1.5px solid #d7ccc8', bgcolor: 'white' }}>
              {!imagePreview && (
                <Grid container spacing={2}>
                  {[
                    { icon: <FileUploadIcon sx={{ color: '#8B4513', fontSize: 28 }} />, title: 'Upload Image', sub: 'Select from your device', hint: 'JPEG · PNG · WebP · max 10 MB', onClick: () => fileInputRef.current?.click() },
                    { icon: <PhotoCameraIcon sx={{ color: '#8B4513', fontSize: 28 }} />, title: 'Take a Photo', sub: 'Use your device camera', hint: 'Capture trunk sample live', onClick: () => setCameraOpen(true) },
                  ].map(({ icon, title, sub, hint, onClick }) => (
                    <Grid item xs={12} sm={6} key={title}>
                      <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                        <Box onClick={onClick} sx={{
                          border: '1.5px solid #d7ccc8', borderRadius: 2.5, p: 3.5,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2,
                          cursor: 'pointer', bgcolor: '#fdf8f5', transition: 'all 0.18s',
                          '&:hover': { bgcolor: '#f5ede6', borderColor: '#8B4513', boxShadow: '0 2px 16px rgba(139,69,19,0.1)' },
                        }}>
                          <Box sx={{ width: 58, height: 58, borderRadius: '50%', bgcolor: '#efebe9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>{title}</Typography>
                          <Typography variant="body2" sx={{ color: '#546e7a', textAlign: 'center' }}>{sub}</Typography>
                          <Typography variant="caption" sx={{ color: '#90a4ae', textAlign: 'center' }}>{hint}</Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              )}

              {imagePreview && (
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <motion.img src={imagePreview} alt="Trunk preview"
                    style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 12, border: '2px solid #d7ccc8', display: 'block' }}
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  />
                  <IconButton onClick={handleReset} size="small" sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(198,40,40,0.9)', color: 'white', '&:hover': { bgcolor: '#b71c1c' } }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <Chip icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} label={selectedImage?.name || 'Image ready'} size="small"
                    sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(62,39,35,0.85)', color: 'white', fontSize: '0.7rem', backdropFilter: 'blur(4px)' }}
                  />
                </Box>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageSelect} style={{ display: 'none' }} />

              {imagePreview && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2.5 }}>
                  <Button variant="contained" size="large" onClick={handleAnalyze}
                    disabled={!selectedImage || analyzing}
                    startIcon={analyzing ? <CircularProgress size={18} color="inherit" /> : <AnalyticsIcon />}
                    sx={{ bgcolor: '#8B4513', px: 5, py: 1.4, borderRadius: 2, fontSize: '0.95rem', fontWeight: 700, textTransform: 'none', boxShadow: '0 3px 10px rgba(139,69,19,0.28)', '&:hover': { bgcolor: '#5D3A1A' }, '&:disabled': { bgcolor: '#d7ccc8', color: '#a1887f', boxShadow: 'none' } }}>
                    {analyzing ? 'Analyzing...' : 'Analyze Trunk'}
                  </Button>
                  {!analyzing && (
                    <Button variant="outlined" size="large" onClick={handleReset} startIcon={<RestartAltIcon />}
                      sx={{ borderColor: '#bcaaa4', color: '#8B4513', px: 3, py: 1.4, borderRadius: 2, fontSize: '0.95rem', textTransform: 'none', '&:hover': { borderColor: '#8B4513', bgcolor: '#f5ede6' } }}>
                      Reset
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          </motion.div>

          {/* RESULTS */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
                {/* Results header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon sx={{ color: '#8B4513' }} />
                    <Typography variant="h6" sx={{ color: '#3E2723', fontWeight: 800 }}>Analysis Results</Typography>
                  </Box>
                  <Button variant="outlined" size="small" onClick={downloadReport} startIcon={<DownloadIcon />}
                    sx={{ borderColor: '#bcaaa4', color: '#8B4513', borderRadius: 2, textTransform: 'none', '&:hover': { borderColor: '#8B4513', bgcolor: '#f5ede6' } }}>
                    Download Report
                  </Button>
                </Box>

                {/* Health Score Hero */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
                  <Card elevation={0} sx={{ borderRadius: 3, mb: 3, background: getHealthScoreGradient(healthScore), color: 'white', overflow: 'hidden', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -24, right: -24, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" sx={{ opacity: 0.65, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Health Score</Typography>
                          <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1, mt: 0.5, letterSpacing: -1 }}>{healthScore}%</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, fontWeight: 600 }}>{getHealthScoreLabel(healthScore)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <Box sx={{ mb: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>Health Progress</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>{healthScore}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={healthScore}
                              sx={{ height: 10, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.22)', '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 99 } }}
                            />
                          </Box>
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.13)', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ opacity: 0.65 }}>Disease</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.3, lineHeight: 1.2 }}>
                                  {disease.name || 'None'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.13)', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ opacity: 0.65 }}>Maturity</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.3 }}>{maturity.class || '—'}</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Maturity + Disease + Detections */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1.5px solid #d7ccc8', bgcolor: '#fdf8f5' }}>
                        <SectionLabel icon={getMaturityIcon(maturity.class)} label="Maturity" />
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#3E2723', lineHeight: 1, letterSpacing: -0.5 }}>
                          {maturity.class || 'Unknown'}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Confidence</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#8B4513' }}>{maturity.confidence}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={maturity.confidence || 0}
                            sx={{ height: 6, borderRadius: 99, bgcolor: '#d7ccc8', '& .MuiLinearProgress-bar': { bgcolor: '#8B4513', borderRadius: 99 } }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: `1.5px solid ${disease.detected ? '#ffcdd2' : '#d7ccc8'}`, bgcolor: disease.detected ? '#fffafa' : '#fdf8f5' }}>
                        <SectionLabel
                          icon={disease.detected ? <BugReportIcon sx={{ color: '#c62828', fontSize: 17 }} /> : <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 17 }} />}
                          label="Disease Status"
                        />
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 2, bgcolor: disease.detected ? '#ffebee' : '#e8f5e9', mb: 1.5 }}>
                          {disease.detected
                            ? <ErrorIcon sx={{ color: '#c62828', fontSize: 17 }} />
                            : <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 17 }} />}
                          <Typography variant="body2" sx={{ fontWeight: 700, color: disease.detected ? '#c62828' : '#2e7d32' }}>
                            {disease.name || 'Healthy'}
                          </Typography>
                        </Box>
                        {disease.detected && (
                          <Chip label={`Severity: ${disease.severity}`} size="small" sx={{ bgcolor: getSeverityColor(disease.severity), color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1.5px solid #d7ccc8', bgcolor: '#fdf8f5' }}>
                        <SectionLabel icon={<TimelineIcon sx={{ color: '#8B4513', fontSize: 17 }} />} label="Detections" />
                        <Typography variant="h2" sx={{ fontWeight: 900, color: '#3E2723', lineHeight: 1, letterSpacing: -1 }}>
                          {detectionCount}
                          <Typography component="span" variant="h5" sx={{ fontWeight: 400, ml: 0.6, color: '#8B4513' }}>
                            {detectionCount === 1 ? 'object' : 'objects'}
                          </Typography>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                          Avg confidence: {meanDetectionConfidence}%
                        </Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* Color Analysis */}
                {hasColorAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #d7ccc8', bgcolor: 'white' }}>
                      <SectionLabel icon={<ColorLensIcon sx={{ color: '#8B4513', fontSize: 17 }} />} label="Color Analysis" />
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 72, height: 72, borderRadius: 2, mx: 'auto', mb: 1.5,
                            bgcolor: visualAnalysis?.color?.hex || '#8B4513',
                            border: '3px solid #efebe9',
                            boxShadow: `0 2px 10px ${visualAnalysis?.color?.hex || '#8B4513'}55`,
                          }} />
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>{visualAnalysis?.color?.name || '—'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={9}>
                          {visualAnalysis?.color?.rgb && (
                            <Grid container spacing={1.5}>
                              {[{ l: 'R', v: visualAnalysis.color.rgb.r }, { l: 'G', v: visualAnalysis.color.rgb.g }, { l: 'B', v: visualAnalysis.color.rgb.b }].map(({ l, v }) => (
                                <Grid item xs={4} key={l}>
                                  <Box sx={{ p: 1.5, bgcolor: '#fdf8f5', borderRadius: 1.5, textAlign: 'center', border: '1px solid #efebe9' }}>
                                    <Typography variant="caption" sx={{ color: '#78909c', fontWeight: 600, display: 'block' }}>{l}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>{v}</Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* Texture Analysis */}
                {hasTextureAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #d7ccc8', bgcolor: 'white' }}>
                      <SectionLabel icon={<TextureIcon sx={{ color: '#8B4513', fontSize: 17 }} />} label="Texture Analysis" />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        {getTextureIcon(visualAnalysis?.texture?.type)}
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#3E2723', textTransform: 'capitalize' }}>
                          {visualAnalysis?.texture?.type || '—'}
                        </Typography>
                      </Box>
                      {visualAnalysis?.texture?.description && (
                        <Typography variant="body2" color="text.secondary">{visualAnalysis.texture.description}</Typography>
                      )}
                    </Paper>
                  </motion.div>
                )}

                {/* Disease Analysis */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #d7ccc8', bgcolor: 'white' }}>
                    <SectionLabel icon={<BugReportIcon sx={{ color: '#8B4513', fontSize: 17 }} />} label="Disease Analysis" />
                    {isHealthy ? (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1.2, borderRadius: 2, bgcolor: '#e8f5e9' }}>
                        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>Tree is Healthy</Typography>
                          <Typography variant="caption" color="text.secondary">No signs of disease detected.</Typography>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 2, bgcolor: '#ffebee', mb: 2.5 }}>
                          <ErrorIcon sx={{ color: '#c62828', fontSize: 17 }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#c62828' }}>
                            {disease.name} — Confidence: {disease.confidence}%
                          </Typography>
                        </Box>
                        {disease.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, px: 0.5 }}>{disease.description}</Typography>
                        )}
                      </>
                    )}
                  </Paper>
                </motion.div>

                {/* Care Recommendations */}
                {analysisResult.care_recommendations?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #3E2723 0%, #5D3A1A 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                      <Box sx={{ position: 'absolute', right: -30, bottom: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                        <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.55)' }} />
                        <AgricultureIcon sx={{ fontSize: 18 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Care Recommendations</Typography>
                      </Box>
                      <List dense disablePadding>
                        {analysisResult.care_recommendations.map((rec, i) => (
                          <ListItem key={i} disableGutters sx={{ py: 0.9, alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ minWidth: 34, mt: 0.3 }}>
                              <Box sx={{
                                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: rec.priority === 'immediate' ? '#f44336' : rec.priority === 'soon' ? '#ff9800' : rec.priority === 'monitor' ? '#2196f3' : '#4caf50',
                              }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'white' }}>{i + 1}</Typography>
                              </Box>
                            </ListItemIcon>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3, flexWrap: 'wrap' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>{rec.action}</Typography>
                                <Chip label={rec.priority} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: rec.priority === 'immediate' ? '#f44336' : rec.priority === 'soon' ? '#ff9800' : rec.priority === 'monitor' ? '#2196f3' : '#4caf50', color: 'white' }} />
                              </Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>{rec.description}</Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </motion.div>
                )}

                {/* Visualization */}
                {(visualizationSrc || hasBoxCoordinates) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #d7ccc8', bgcolor: 'white' }}>
                      <SectionLabel icon={<ScienceIcon sx={{ color: '#8B4513', fontSize: 17 }} />} label="Detection Visualization" />
                      {visualizationSrc && (
                        <Box sx={{ textAlign: 'center', mb: hasBoxCoordinates ? 2.5 : 0 }}>
                          <motion.img
                            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                            src={visualizationSrc} alt="Detection visualization"
                            style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.09)', border: '2px solid #d7ccc8' }}
                          />
                        </Box>
                      )}
                      {hasBoxCoordinates && (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table size="small">
                            <TableBody>
                              {detections.filter(d => Array.isArray(d?.bbox) && d.bbox.length === 4).map((det, idx) => {
                                const [x1, y1, x2, y2] = det.bbox.map(v => Number(v).toFixed(1));
                                return (
                                  <TableRow key={`box-${idx}`}>
                                    <TableCell sx={{ fontWeight: 700, color: '#3E2723', width: '32%' }}>
                                      {det.display_name || det.class_name || det.class || `Detection ${idx + 1}`}
                                    </TableCell>
                                    <TableCell sx={{ color: '#8B4513', width: '20%' }}>{Number(det.confidence || 0).toFixed(2)}%</TableCell>
                                    <TableCell sx={{ color: '#616161' }}>[{x1}, {y1}] to [{x2}, {y2}]</TableCell>
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
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>

      {/* CAMERA DIALOG */}
      <Dialog open={cameraOpen} onClose={() => setCameraOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogTitle sx={{ bgcolor: '#3E2723', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PhotoCameraIcon />
            <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>Capture Trunk Sample</Typography>
          </Box>
          <IconButton onClick={() => setCameraOpen(false)} sx={{ color: 'white' }} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000', position: 'relative', minHeight: 260 }}>
          {cameraError ? (
            <Box sx={{ height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', p: 3 }}>
              <ErrorIcon sx={{ fontSize: 50, color: '#c62828', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 700 }}>Camera Unavailable</Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>{cameraError}</Typography>
            </Box>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto', maxHeight: 480, objectFit: 'cover', display: 'block' }} />
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: '68%', maxWidth: 320, aspectRatio: '4/3', border: '2px solid rgba(255,255,255,0.65)', borderRadius: 2, boxShadow: '0 0 0 9999px rgba(0,0,0,0.38)' }} />
              </Box>
              <Box sx={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  Position trunk within the frame
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2.5, p: 2.5, bgcolor: '#fafafa' }}>
          <Button variant="outlined" onClick={handleFlipCamera} disabled={!!cameraError} startIcon={<FlipCameraIcon />}
            sx={{ borderColor: '#bcaaa4', color: '#8B4513', borderRadius: 2, textTransform: 'none', '&:hover': { borderColor: '#8B4513', bgcolor: '#f5ede6' }, '&:disabled': { borderColor: '#e0e0e0', color: '#bdbdbd' } }}>
            Flip
          </Button>
          <Fab onClick={captureImage} disabled={!stream || capturing || !!cameraError}
            sx={{ bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' }, width: 62, height: 62, boxShadow: '0 3px 14px rgba(198,40,40,0.38)' }}>
            {capturing ? <CircularProgress size={22} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 26 }} />}
          </Fab>
          <Button variant="outlined" onClick={() => setCameraOpen(false)} disabled={capturing} startIcon={<CloseIcon />}
            sx={{ borderColor: '#e0e0e0', color: '#757575', borderRadius: 2, textTransform: 'none', '&:hover': { borderColor: '#bdbdbd' } }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default AdminTrunksDetection;