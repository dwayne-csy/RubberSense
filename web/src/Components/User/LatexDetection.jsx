import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';
import {
  Box, Container, Typography, Button, Paper, CircularProgress,
  Alert, Grid, Card, CardContent, LinearProgress, Chip, Divider,
  IconButton, List, ListItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Fab,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  RestartAlt as RestartAltIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ColorLens as ColorLensIcon,
  Texture as TextureIcon,
  Science as ScienceIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Opacity as OpacityIcon,
  Assessment as AssessmentIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  FlipCameraAndroid as FlipCameraIcon,
  MonetizationOn as MonetizationOnIcon,
  Factory as FactoryIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
  Biotech as BiotechIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const SectionLabel = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: '#2e7d32', flexShrink: 0 }} />
    {icon}
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1b5e20', letterSpacing: 0.3 }}>
      {label}
    </Typography>
  </Box>
);

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
  const [selectedRegion] = useState('global_avg');
  const [liveMarketData, setLiveMarketData] = useState(null);
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

  const fetchLiveMarketData = async (forceRefresh = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const endpoints = ['/api/v1/market/latest', '/api/market/latest'];
      for (const endpoint of endpoints) {
        try {
          const res = await axios.get(`${API_BASE_URL}${endpoint}`, {
            params: { force: forceRefresh },
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.success) { setLiveMarketData(res.data.data || null); return res.data.data || null; }
        } catch (e) { if (e?.response?.status === 404) continue; throw e; }
      }
      return null;
    } catch { return null; }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (res.data.success) setUser(res.data.user);
        else { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
      } catch { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
      finally { setLoading(false); }
    };
    const fetchSystemInfo = async () => {
      try { const res = await axios.get(`${API_BASE_URL}/api/v1/latex/info`); if (res.data.success) setSystemInfo(res.data.data); } catch {}
    };
    checkAuth(); fetchSystemInfo(); fetchLiveMarketData(false);
  }, [navigate, API_BASE_URL]);

  useEffect(() => { return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, [stream]);

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
    } catch { setCameraError('Unable to access camera. Please ensure camera permissions are granted.'); }
  };

  const handleFlipCamera = () => setFacingMode(p => p === 'user' ? 'environment' : 'user');

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => {
      const file = new File([blob], `latex-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setCameraOpen(false); setCapturing(false); setAnalysisResult(null); setSuccessMessage(null); setError(null);
    }, 'image/jpeg', 0.95);
  };

  const handleImageSelect = e => { if (e.target.files?.[0]) processSelectedFile(e.target.files[0]); };

  const processSelectedFile = file => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Please select a JPEG, PNG, or WebP image.'); return;
    }
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum size is 10MB.'); return; }
    setError(null); setSelectedImage(file); setAnalysisResult(null); setSuccessMessage(null);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) { setError('Please select an image first.'); return; }
    setAnalyzing(true); setError(null); setSuccessMessage(null);
    try {
      const fd = new FormData();
      fd.append('image', selectedImage); fd.append('region', selectedRegion);
      fd.append('batchID', ''); fd.append('volume', '0'); fd.append('dryWeight', '0'); fd.append('notes', '');
      const res = await axios.post(`${API_BASE_URL}/api/v1/latex/analyze`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000,
      });
      if (res.data.success) {
        setAnalysisResult(res.data.data); setSuccessMessage('Analysis completed successfully!'); fetchLiveMarketData(false);
      } else throw new Error(res.data.message || 'Analysis failed');
    } catch (err) {
      if (err.code === 'ECONNABORTED') setError('Request timeout. The server is taking too long to respond.');
      else if (err.response?.status === 500) setError('Server error: ' + (err.response?.data?.error || 'Internal server error.'));
      else if (err.response?.status === 401) { setError('Authentication failed. Please login again.'); localStorage.removeItem('token'); navigate('/login'); }
      else setError(err.response?.data?.message || err.message || 'Error analyzing image. Please try again.');
    } finally { setAnalyzing(false); }
  };

  const handleReset = () => {
    setSelectedImage(null); setImagePreview(null); setAnalysisResult(null); setError(null); setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getQualityGradient = q => {
    switch (q?.toLowerCase()) {
      case 'high': return 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)';
      case 'medium': return 'linear-gradient(135deg, #e65100 0%, #ef6c00 60%, #f57c00 100%)';
      case 'low': return 'linear-gradient(135deg, #b71c1c 0%, #c62828 60%, #d32f2f 100%)';
      default: return 'linear-gradient(135deg, #37474f 0%, #546e7a 100%)';
    }
  };

  const getContaminationColor = (detected, p) => {
    if (!detected) return '#2e7d32';
    if (p < 30) return '#f57c00'; if (p < 60) return '#d32f2f'; return '#b71c1c';
  };

  const getColorSwatch = hex => hex || '#808080';

  const getDrcColor = cat => {
    switch (cat?.toLowerCase()) {
      case 'excellent': return '#2e7d32'; case 'good': return '#1565c0';
      case 'average': return '#e65100'; default: return '#c62828';
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify({ ...analysisResult, generatedAt: new Date().toISOString(), generatedBy: user?.email, region: selectedRegion }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `latex-report-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  };

  // Confidence threshold
  const NOT_DETECTED_THRESHOLD = 35;

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#070f1a' }}>
      <UserHeader />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <CircularProgress size={52} thickness={3} sx={{ color: '#00c853' }} />
      </motion.div>
      <Typography variant="body1" sx={{ mt: 3, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Loading Analysis System...</Typography>
    </Box>
  );

  // Data extraction
  const analysis = analysisResult?.latex_analysis || {};
  const contamination = analysis.contamination || {};
  const colorAnalysis = analysis.color_analysis || {};
  const quantity = analysis.quantity_estimation || {};
  const yield_est = analysis.estimated_yield || {};
  const market = analysisResult?.market_analysis || {};
  const recommendations = analysisResult?.product_recommendations || {};
  const imageMetadata = analysisResult?.image_metadata || {};
  const latexDetections = Array.isArray(analysisResult?.detections) ? analysisResult.detections : (Array.isArray(analysis?.detections) ? analysis.detections : []);
  const visualizationSrc = analysisResult?.visualization ? `data:image/jpeg;base64,${analysisResult.visualization}` : analysisResult?.processedImageURL || null;
  const analyzedAtValue = imageMetadata?.analyzedAt || imageMetadata?.analyzed_at;
  const fileNameValue = imageMetadata?.filename || imageMetadata?.fileName || '';
  const fileSizeValue = imageMetadata?.fileSizeKB || imageMetadata?.file_size_kb;
  const latexMainConfidence = analysisResult ? Number(analysis?.quality_score ?? analysisResult?.confidence ?? 0) : null;
  const isLatexNotDetected = latexMainConfidence !== null && latexMainConfidence < NOT_DETECTED_THRESHOLD;

  const effectivePricePerKg = (() => { const lp = Number(liveMarketData?.price); if (Number.isFinite(lp) && lp > 0) return lp; const sp = Number(market.price_per_kg); return Number.isFinite(sp) ? sp : 0; })();
  const effectiveDryYieldKg = (() => { const fp = Number(analysisResult?.productYieldEstimation?.estimatedYield); if (Number.isFinite(fp) && fp > 0) return fp; const fl = Number(yield_est?.dry_weight_kg); if (Number.isFinite(fl) && fl > 0) return fl; return 0; })();
  const effectiveTotalValue = (() => { if (effectivePricePerKg > 0 && effectiveDryYieldKg > 0) return effectivePricePerKg * effectiveDryYieldKg; const st = Number(market.estimated_total_value); return Number.isFinite(st) ? st : 0; })();
  const effectiveCurrency = liveMarketData?.currency || market.currency || 'PHP';
  const effectiveTrend = String(liveMarketData?.trend || market.market_trend || 'neutral');
  const effectiveTrendStrengthPct = (() => { const lc = Number(liveMarketData?.priceChange); if (Number.isFinite(lc)) return Math.abs(lc); const ss = Number(market.trend_strength); return Number.isFinite(ss) ? Math.abs(ss * 100) : 0; })();
  const liveSourceLabel = liveMarketData ? `${String(liveMarketData.source || 'stooq').toUpperCase()}${liveMarketData.sourceSymbol ? ` (${liveMarketData.sourceSymbol})` : ''}` : null;

  return (
    <>
      <UserHeader />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f9f5', pt: '80px', pb: '90px' }}>
        <Container maxWidth="lg">

          {/* HERO */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{
              p: { xs: 3, md: '44px 48px' }, mb: 3,
              background: 'linear-gradient(135deg, #f7fdf9 0%, #e8f5ee 50%, #d8f3dc 100%)',
              color: '#1b4332', borderRadius: '20px', position: 'relative', overflow: 'hidden',
              border: '1px solid #95d5b2',
              boxShadow: '0 8px 32px rgba(13,40,24,0.12)'
            }}>
              <Box sx={{ position: 'absolute', right: '-40px', top: '-30px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(82,183,136,0.08)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', right: '80px', bottom: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(52,143,96,0.08)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#d8f3dc', border: '1px solid #95d5b2', borderRadius: '8px', px: 1.5, py: 0.5, mb: 2 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#2d6a4f', boxShadow: '0 0 8px #2d6a4f' }} />
                  <Typography sx={{ color: '#1b4332', fontWeight: 800, fontSize: '0.72rem', letterSpacing: 1.2, textTransform: 'uppercase' }}>Latex Analysis</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: -1, lineHeight: 1, mb: 1, color: '#1b4332' }}>
                  Rubber Tree <Box component="span" sx={{ color: '#2d6a4f' }}>Latex</Box> Detection
                </Typography>
                <Typography sx={{ opacity: 0.85, maxWidth: 460, lineHeight: 1.7, fontSize: '1rem', color: '#40916c' }}>
                  AI-powered quality classification and market analysis system.
                </Typography>
              </Box>
            </Box>
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
            <Box sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: '16px', border: '1px solid #95d5b2', bgcolor: 'white', boxShadow: '0 4px 16px rgba(13,40,24,0.08)' }}>

              {!imagePreview && (
                <Grid container spacing={2}>
                  {[
                    { icon: <FileUploadIcon sx={{ color: '#00c853', fontSize: 28 }} />, title: 'Upload Image', sub: 'Select from your device', hint: 'JPEG · PNG · WebP · max 10 MB', onClick: () => fileInputRef.current?.click() },
                    { icon: <PhotoCameraIcon sx={{ color: '#00c853', fontSize: 28 }} />, title: 'Take a Photo', sub: 'Use your device camera', hint: 'Capture latex sample live', onClick: () => setCameraOpen(true) },
                  ].map(({ icon, title, sub, hint, onClick }) => (
                    <Grid item xs={12} sm={6} key={title}>
                      <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                        <Box onClick={onClick} sx={{
                          border: '1px solid #95d5b2', borderRadius: '12px', p: 3.5,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2,
                          cursor: 'pointer', bgcolor: '#f7fdf9', transition: 'all 0.18s',
                          '&:hover': { bgcolor: '#d8f3dc', borderColor: '#52b788', boxShadow: '0 4px 20px rgba(45,106,79,0.15)' },
                        }}>
                          <Box sx={{ width: 58, height: 58, borderRadius: '50%', bgcolor: '#d8f3dc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#1b4332' }}>{title}</Typography>
                          <Typography variant="body2" sx={{ color: '#6b705c', textAlign: 'center' }}>{sub}</Typography>
                          <Typography variant="caption" sx={{ color: '#a3b18a', textAlign: 'center' }}>{hint}</Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              )}

              {imagePreview && (
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <motion.img
                    src={imagePreview} alt="Latex preview"
                    style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 12, border: '2px solid #c8e6c9', display: 'block' }}
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  />
                  <IconButton onClick={handleReset} size="small" sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(198,40,40,0.9)', color: 'white', '&:hover': { bgcolor: '#b71c1c' } }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                    label={selectedImage?.name || 'Image ready'} size="small"
                    sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(27,94,32,0.85)', color: 'white', fontSize: '0.7rem', backdropFilter: 'blur(4px)' }}
                  />
                </Box>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageSelect} style={{ display: 'none' }} />

              {imagePreview && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained" size="large" onClick={handleAnalyze}
                    disabled={!selectedImage || analyzing}
                    startIcon={analyzing ? <CircularProgress size={18} color="inherit" /> : <AnalyticsIcon />}
                    sx={{ bgcolor: '#00c853', color: '#000', px: 5, py: 1.4, borderRadius: '12px', fontSize: '0.95rem', fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 20px rgba(0,200,83,0.35)', '&:hover': { bgcolor: '#00e676', boxShadow: '0 6px 24px rgba(0,200,83,0.45)' }, '&:disabled': { bgcolor: '#dcefe4', color: '#7a8a81', boxShadow: 'none' } }}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze Latex'}
                  </Button>
                  {!analyzing && (
                    <Button
                      variant="outlined" size="large" onClick={handleReset} startIcon={<RestartAltIcon />}
                      sx={{ borderColor: '#95d5b2', color: '#2d6a4f', px: 3, py: 1.4, borderRadius: '12px', fontSize: '0.95rem', textTransform: 'none', '&:hover': { borderColor: '#52b788', bgcolor: '#f1f8f3' } }}
                    >
                      Reset
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </motion.div>

          {/* RESULTS */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>

                {/* NOT DETECTED GATE */}
                {isLatexNotDetected ? (
                  <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#ffffff', borderRadius: '20px', border: '1px dashed #c8e6c9', mb: 3 }}>
                    <Box sx={{ fontSize: 72, mb: 2, opacity: 0.15 }}>🧪</Box>
                    <Typography variant="h4" sx={{ color: '#1b5e20', fontWeight: 900, mb: 1 }}>Latex Not Detected</Typography>
                    <Typography sx={{ color: '#4e6b5f', maxWidth: 400, mx: 'auto', mb: 1.5, lineHeight: 1.6 }}>
                      The model's confidence is too low ({latexMainConfidence?.toFixed(1)}%) to confirm rubber tree latex.
                      Please upload a clearer, well-lit photo of the latex sample.
                    </Typography>
                    <Chip label={`Confidence: ${latexMainConfidence?.toFixed(1)}%`} sx={{ bgcolor: '#ffebee', color: '#b71c1c', border: '1px solid #ef9a9a', fontWeight: 700 }} />
                  </Box>
                ) : (<>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon sx={{ color: '#2e7d32' }} />
                    <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 800 }}>Analysis Results</Typography>
                  </Box>
                </Box>

                {/* 1 — Quality Hero */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
                  <Card elevation={0} sx={{ borderRadius: 3, mb: 3, background: getQualityGradient(analysis.quality_class), color: 'white', overflow: 'hidden', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -24, right: -24, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <Typography variant="caption" sx={{ opacity: 0.65, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Quality Grade</Typography>
                          <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1, mt: 0.5, letterSpacing: -1 }}>{analysis.quality_class || 'Unknown'}</Typography>
                          {analysisResult.all_predictions?.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7, mt: 1.5 }}>
                              {analysisResult.all_predictions.map((p, i) => (
                                <Chip key={i} label={`${p.class} ${Number(p.confidence || 0).toFixed(0)}%`} size="small"
                                  sx={i === 0
                                    ? { bgcolor: 'rgba(255,255,255,0.28)', color: 'white', fontWeight: 700, fontSize: '0.7rem' }
                                    : { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }
                                  }
                                />
                              ))}
                            </Box>
                          )}
                        </Grid>
                        <Grid item xs={12} md={7}>
                          <Box sx={{ mb: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>Classification Confidence</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>{analysis.quality_score?.toFixed(1)}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={analysis.quality_score || 0}
                              sx={{ height: 10, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.22)', '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 99 } }}
                            />
                          </Box>
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.13)', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ opacity: 0.65 }}>Dry Rubber Content</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.3 }}>{analysis.dry_rubber_content?.toFixed(1)}%</Typography>
                                <Chip label={analysis.drc_category || 'N/A'} size="small"
                                  sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.22)', color: 'white', fontSize: '0.65rem', fontWeight: 700 }}
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.13)', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ opacity: 0.65 }}>Consistency</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.5 }}>
                                  <TextureIcon sx={{ fontSize: 18 }} />
                                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{analysis.consistency || '—'}</Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 2 — Contamination + Color + DRC */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: `1px solid ${contamination.detected ? '#ef9a9a' : '#c8e6c9'}`, bgcolor: contamination.detected ? '#fff5f5' : 'white' }}>
                        <SectionLabel icon={<WarningIcon sx={{ color: contamination.detected ? '#ef5350' : '#4caf50', fontSize: 17 }} />} label="Contamination" />
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 2, bgcolor: contamination.detected ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)', mb: 1.5 }}>
                          {contamination.detected
                            ? <ErrorIcon sx={{ color: '#ef5350', fontSize: 17 }} />
                            : <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 17 }} />
                          }
                          <Typography variant="body2" sx={{ fontWeight: 700, color: contamination.detected ? '#c62828' : '#2e7d32' }}>
                            {contamination.detected ? 'Detected' : 'Clean Sample'}
                          </Typography>
                        </Box>
                        {contamination.detected && (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#607d8b' }}>Probability</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#ef9a9a' }}>{contamination.probability?.toFixed(1)}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={contamination.probability || 0}
                              sx={{ height: 6, borderRadius: 99, bgcolor: 'rgba(244,67,54,0.2)', mb: 1.5, '& .MuiLinearProgress-bar': { bgcolor: '#ef5350' } }}
                            />
                            {contamination.type && contamination.type !== 'none' && (
                              <Chip label={contamination.type.replace('_', ' ')} size="small"
                                sx={{ bgcolor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #c8e6c9', bgcolor: 'white' }}>
                        <SectionLabel icon={<ColorLensIcon sx={{ color: '#4caf50', fontSize: 17 }} />} label="Color Analysis" />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: getColorSwatch(colorAnalysis.hex), border: '3px solid rgba(255,255,255,0.1)', boxShadow: `0 2px 10px ${getColorSwatch(colorAnalysis.hex)}55`, flexShrink: 0 }} />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20', textTransform: 'capitalize', lineHeight: 1.2 }}>{colorAnalysis.name || 'Unknown'}</Typography>
                            <Typography variant="caption" sx={{ color: '#607d8b' }}>{colorAnalysis.hex || '—'}</Typography>
                          </Box>
                        </Box>
                        {colorAnalysis.hsv && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {[{ l: 'H', v: `${colorAnalysis.hsv.h?.toFixed(0)}°` }, { l: 'S', v: `${colorAnalysis.hsv.s?.toFixed(0)}%` }, { l: 'V', v: `${colorAnalysis.hsv.v?.toFixed(0)}%` }].map(({ l, v }) => (
                              <Box key={l} sx={{ flex: 1, p: 1, bgcolor: '#f7fdf9', borderRadius: 1.5, textAlign: 'center', border: '1px solid #dcefdc' }}>
                                <Typography variant="caption" sx={{ color: '#607d8b', fontWeight: 600, display: 'block' }}>{l}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1b4332' }}>{v}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #c8e6c9', bgcolor: 'white' }}>
                        <SectionLabel icon={<OpacityIcon sx={{ color: '#4caf50', fontSize: 17 }} />} label="Dry Rubber Content" />
                        <Typography variant="h2" sx={{ fontWeight: 900, color: '#1b5e20', lineHeight: 1, letterSpacing: -1 }}>
                          {analysis.dry_rubber_content?.toFixed(1)}
                          <Typography component="span" variant="h5" sx={{ fontWeight: 400, ml: 0.4, color: '#2e7d32' }}>%</Typography>
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress variant="determinate" value={Math.min(analysis.dry_rubber_content || 0, 100)}
                            sx={{ height: 8, borderRadius: 99, bgcolor: '#e8f5e9', mb: 1.5, '& .MuiLinearProgress-bar': { bgcolor: getDrcColor(analysis.drc_category), borderRadius: 99 } }}
                          />
                          <Chip label={`Category: ${analysis.drc_category || 'N/A'}`} size="small"
                            sx={{ bgcolor: getDrcColor(analysis.drc_category), color: 'white', fontWeight: 700, fontSize: '0.72rem', border: 'none' }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* 3 — Physical Properties */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #c8e6c9', bgcolor: 'white' }}>
                    <SectionLabel icon={<BubbleChartIcon sx={{ color: '#4caf50', fontSize: 17 }} />} label="Physical Properties" />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2.5, bgcolor: '#f7fdf9', borderRadius: 2, border: '1px solid #dcefdc', height: '100%' }}>
                          <Typography variant="caption" sx={{ color: '#607d8b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>Consistency</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextureIcon sx={{ color: '#a5d6a7' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b4332' }}>{analysis.consistency || '—'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2.5, bgcolor: analysis.impurities?.detected ? '#fff8f1' : '#f7fdf9', borderRadius: 2, border: `1px solid ${analysis.impurities?.detected ? '#ffd699' : '#dcefdc'}`, height: '100%' }}>
                          <Typography variant="caption" sx={{ color: '#607d8b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>Impurity Particles</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: analysis.impurities?.detected ? 1.5 : 0 }}>
                            <WarningIcon sx={{ color: analysis.impurities?.detected ? '#ffb74d' : '#a5d6a7' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b4332' }}>{analysis.impurities?.count || 0} detected</Typography>
                          </Box>
                          {analysis.impurities?.detected && (
                            <>
                              {analysis.impurities.description && <Typography variant="body2" sx={{ color: '#546e7a', mb: 1 }}>{analysis.impurities.description}</Typography>}
                              <Chip label={`Severity: ${analysis.impurities.severity}`} size="small" sx={{
                                bgcolor: analysis.impurities.severity === 'minimal' ? 'rgba(76,175,80,0.1)' : analysis.impurities.severity === 'low' ? 'rgba(33,150,243,0.1)' : analysis.impurities.severity === 'moderate' ? 'rgba(255,152,0,0.1)' : 'rgba(244,67,54,0.1)',
                                color: analysis.impurities.severity === 'minimal' ? '#2e7d32' : analysis.impurities.severity === 'low' ? '#1565c0' : analysis.impurities.severity === 'moderate' ? '#e65100' : '#c62828',
                                border: '1px solid', borderColor: analysis.impurities.severity === 'minimal' ? 'rgba(76,175,80,0.3)' : analysis.impurities.severity === 'low' ? 'rgba(33,150,243,0.3)' : analysis.impurities.severity === 'moderate' ? 'rgba(255,152,0,0.3)' : 'rgba(244,67,54,0.3)',
                                fontWeight: 600, fontSize: '0.7rem',
                              }} />
                            </>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>

                {/* 4 — Quantity & Yield */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #c8e6c9', bgcolor: 'white' }}>
                    <SectionLabel icon={<AssessmentIcon sx={{ color: '#2e7d32', fontSize: 17 }} />} label="Quantity & Yield Estimation" />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2.5, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid #bbdefb', height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <OpacityIcon sx={{ color: '#1565c0', fontSize: 16 }} />
                            <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Volume Estimation</Typography>
                          </Box>
                          <Typography variant="h3" sx={{ color: '#0d47a1', fontWeight: 900, lineHeight: 1 }}>
                            {quantity.estimated_volume_ml?.toFixed(0)}
                            <Typography component="span" variant="body1" sx={{ color: '#1976d2', ml: 0.8, fontWeight: 400 }}>mL</Typography>
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">Confidence</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1565c0' }}>{quantity.confidence?.toFixed(1)}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={quantity.confidence || 0}
                              sx={{ height: 6, borderRadius: 99, bgcolor: '#bbdefb', '& .MuiLinearProgress-bar': { bgcolor: '#1976d2' } }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Latex area: {quantity.latex_area_percentage?.toFixed(1)}% of sample
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2.5, bgcolor: '#fafef9', borderRadius: 2, border: '1px solid #c8e6c9', height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <BiotechIcon sx={{ color: '#2e7d32', fontSize: 16 }} />
                            <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Dry Yield</Typography>
                          </Box>
                          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                            {[{ l: 'Wet Weight', v: `${yield_est.wet_weight_kg?.toFixed(2)} kg` }, { l: 'Dry Weight', v: `${yield_est.dry_weight_kg?.toFixed(2)} kg` }].map(({ l, v }) => (
                              <Grid item xs={6} key={l}>
                                <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1.5, textAlign: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{l}</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#1b5e20' }}>{v}</Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 16 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1b5e20' }}>
                              Yield Efficiency: {yield_est.dry_yield_percentage?.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>

                {/* 5 — Market */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', right: -30, bottom: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                      <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.55)' }} />
                      <MonetizationOnIcon sx={{ fontSize: 18 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Market Price Analysis</Typography>
                      {liveMarketData && <Chip label="Live" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.65rem', fontWeight: 700 }} />}
                    </Box>
                    <Grid container spacing={2} sx={{ mb: market.regional_comparison ? 2.5 : 0 }}>
                      {[
                        { label: `Price / kg${liveMarketData ? ' (Live RSS3)' : ''}`, main: `PHP ${effectivePricePerKg.toFixed(2)}`, sub: `${effectiveCurrency}${liveSourceLabel ? ` · ${liveSourceLabel}` : ''}` },
                        { label: 'Total Value', main: `PHP ${effectiveTotalValue.toFixed(2)}`, sub: effectiveDryYieldKg > 0 ? `${effectiveDryYieldKg.toFixed(2)} kg dry yield` : 'Estimated' },
                        { label: 'Market Trend', main: effectiveTrend.charAt(0).toUpperCase() + effectiveTrend.slice(1).toLowerCase(), sub: `Strength: ${effectiveTrendStrengthPct.toFixed(2)}%`, icon: <TimelineIcon sx={{ fontSize: 18, mr: 0.5 }} /> },
                      ].map(({ label, main, sub, icon }) => (
                        <Grid item xs={12} sm={4} key={label}>
                          <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2.5, textAlign: 'center', height: '100%' }}>
                            <Typography variant="caption" sx={{ opacity: 0.72, display: 'block', mb: 0.5 }}>{label}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {icon}
                              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>{main}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>{sub}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    {market.regional_comparison && (
                      <Box>
                        <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Regional Comparison (PHP/kg)</Typography>
                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          {Object.entries(market.regional_comparison).map(([region, price]) => (
                            <Grid item xs={6} sm={3} key={region}>
                              <Box sx={{ p: 1.2, bgcolor: region === selectedRegion ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ opacity: 0.72, textTransform: 'capitalize', display: 'block' }}>{region}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>PHP {price}</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Paper>
                </motion.div>

                {/* 6 — Recommendations */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', background: 'linear-gradient(160deg, #004d40 0%, #00695c 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                          <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' }} />
                          <FactoryIcon sx={{ fontSize: 17 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recommended Products</Typography>
                        </Box>
                        {recommendations.recommended_products?.length > 0 ? (
                          <List dense disablePadding>
                            {recommendations.recommended_products.map((product, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.27 + i * 0.05 }}>
                                <ListItem disableGutters sx={{ py: 0.8, alignItems: 'flex-start' }}>
                                  <ListItemIcon sx={{ minWidth: 30, mt: 0.3 }}>
                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 800 }}>{i + 1}</Typography>
                                    </Box>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={product.name || product}
                                    secondary={product.description || `DRC: ${product.drc_requirement || 'N/A'}`}
                                    primaryTypographyProps={{ variant: 'body2', sx: { color: 'white', fontWeight: 600 } }}
                                    secondaryTypographyProps={{ variant: 'caption', sx: { color: 'rgba(255,255,255,0.65)' } }}
                                  />
                                </ListItem>
                              </motion.div>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>No product recommendations available.</Typography>
                        )}
                        {recommendations.processing_required && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,193,7,0.16)', borderRadius: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <WarningIcon sx={{ fontSize: 16, color: '#ffc107', mt: 0.1 }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>Pre-purification recommended before use</Typography>
                          </Box>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', background: 'linear-gradient(160deg, #37474f 0%, #455a64 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                          <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.5)' }} />
                          <BiotechIcon sx={{ fontSize: 17 }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Processing Recommendations</Typography>
                        </Box>
                        {recommendations.suggested_applications?.length > 0 ? (
                          <List dense disablePadding>
                            {recommendations.suggested_applications.map((app, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                                <ListItem disableGutters sx={{ py: 0.8 }}>
                                  <ListItemIcon sx={{ minWidth: 26 }}>
                                    <CheckCircleIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }} />
                                  </ListItemIcon>
                                  <ListItemText primary={app} primaryTypographyProps={{ variant: 'body2', sx: { color: 'rgba(255,255,255,0.88)' } }} />
                                </ListItem>
                              </motion.div>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>No specific applications available.</Typography>
                        )}
                        {analysis.drc_category && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ opacity: 0.65, display: 'block', mb: 0.3 }}>Best suited for:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {analysis.drc_category === 'Excellent' ? 'Premium medical products' : analysis.drc_category === 'Good' ? 'Industrial applications' : analysis.drc_category === 'Average' ? 'General rubber goods' : 'Recycled products & fillers'}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* 7 — Detections */}
                {latexDetections.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #c8e6c9', bgcolor: 'white' }}>
                      <SectionLabel icon={<AnalyticsIcon sx={{ color: '#2e7d32', fontSize: 17 }} />} label={`Detected Regions (${latexDetections.length})`} />
                      <Grid container spacing={1.5}>
                        {latexDetections.slice(0, 6).map((det, i) => (
                          <Grid item xs={12} sm={6} md={4} key={`det-${i}`}>
                            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #dcedc8', bgcolor: '#fafef9' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1b5e20' }}>{det.class || 'Unknown'}</Typography>
                                <Chip label={`${Number(det.confidence || 0).toFixed(0)}%`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.7rem' }} />
                              </Box>
                              {Array.isArray(det.bbox) && det.bbox.length === 4 && (
                                <Typography variant="caption" color="text.secondary">Box: [{det.bbox.join(', ')}]</Typography>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* 8 — Visualization */}
                {visualizationSrc && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #c8e6c9', bgcolor: 'white' }}>
                      <SectionLabel icon={<ScienceIcon sx={{ color: '#2e7d32', fontSize: 17 }} />} label="Analysis Visualization" />
                      <Box sx={{ textAlign: 'center' }}>
                        <motion.img
                          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                          src={visualizationSrc} alt="Analysis visualization"
                          style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.09)', border: '2px solid #c8e6c9' }}
                        />
                      </Box>
                    </Paper>
                  </motion.div>
                )}

                {/* Metadata */}
                {imageMetadata && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 0.5, pb: 1 }}>
                    <InfoIcon sx={{ fontSize: 13, color: '#bdbdbd' }} />
                    <Typography variant="caption" color="text.disabled">
                      Analyzed: {analyzedAtValue ? new Date(analyzedAtValue).toLocaleString() : 'N/A'}
                      {fileNameValue ? ` · ${fileNameValue}` : ''}
                      {fileSizeValue != null ? ` · ${fileSizeValue} KB` : ''}
                    </Typography>
                  </Box>
                )}
              </>
              )}
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>

      {/* CAMERA DIALOG */}
      <Dialog open={cameraOpen} onClose={() => setCameraOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PhotoCameraIcon />
            <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>Capture Latex Sample</Typography>
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
                  Position latex sample within the frame
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2.5, p: 2.5, bgcolor: '#fafafa' }}>
          <Button variant="outlined" onClick={handleFlipCamera} disabled={!!cameraError} startIcon={<FlipCameraIcon />}
            sx={{ borderColor: '#a5d6a7', color: '#2e7d32', borderRadius: 2, textTransform: 'none', '&:hover': { borderColor: '#2e7d32', bgcolor: '#f1f8e9' }, '&:disabled': { borderColor: '#e0e0e0', color: '#bdbdbd' } }}>
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
      <UserFooter />
    </>
  );
};

export default LatexDetection;
