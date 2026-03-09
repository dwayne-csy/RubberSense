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
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
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

// ── Shared label component (mirrors Latex.jsx) ───────────────────────────────
const SectionLabel = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: '#8B4513', flexShrink: 0 }} />
    {icon}
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#3E2723', letterSpacing: 0.3 }}>
      {label}
    </Typography>
  </Box>
);

const TrunksDetection = () => {
  const [user, setUser] = useState(null);
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

  // Tree profiles
  const [treeProfiles, setTreeProfiles] = useState([]);
  const [selectedTreeId, setSelectedTreeId] = useState('');
  const [loadingTrees, setLoadingTrees] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const fetchUserTrees = async () => {
    setLoadingTrees(true);
    try {
      let response;
      try { response = await axios.get(`${API_BASE_URL}/api/v1/trees`); }
      catch { response = await axios.get(`${API_BASE_URL}/api/trees`); }
      const trees = Array.isArray(response.data?.data) ? response.data.data : [];
      setTreeProfiles(trees);
      setSelectedTreeId(prev =>
        prev && trees.some(t => t?._id === prev) ? prev : trees[0]?._id || ''
      );
    } catch { setTreeProfiles([]); setSelectedTreeId(''); }
    finally { setLoadingTrees(false); }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (res.data.success) { setUser(res.data.user); fetchUserTrees(); }
        else { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
      } catch { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
      finally { setLoading(false); }
    };
    const fetchSystemInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/trunks/info`);
        if (res.data.success) setSystemInfo(res.data.data);
      } catch {}
    };
    checkAuth(); fetchSystemInfo();
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
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
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
    if (treeProfiles.length > 0 && !selectedTreeId) return setError('Please select a tree profile before analyzing.');
    setAnalyzing(true); setError(null); setSuccessMessage(null);
    try {
      const fd = new FormData();
      fd.append('image', selectedImage);
      if (selectedTreeId) {
        fd.append('treeId', selectedTreeId);
        const tree = treeProfiles.find(t => t?._id === selectedTreeId);
        if (tree?.treeID) fd.append('treeID', tree.treeID);
      }
      const res = await axios.post(`${API_BASE_URL}/api/v1/trunks/analyze`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 120000,
      });
      if (res.data.success) {
        setAnalysisResult(res.data.data);
        setSuccessMessage(`Analysis completed successfully! ID: ${res.data.data.analysisId}`);
      } else setError(res.data.message || 'Analysis failed. Please try again.');
    } catch (err) {
      if (err.code === 'ECONNABORTED') setError('Analysis timed out after 2 minutes. Please try again with a clearer image.');
      else if (err.response?.status === 413) setError('File too large. Please upload a smaller image.');
      else if (err.response?.status === 400) setError(err.response.data.message || 'Invalid image format.');
      else if (err.response?.status === 404) setError('ML service unavailable. Please try again later.');
      else setError(err.response?.data?.message || 'Error analyzing image. Please try again.');
    } finally { setAnalyzing(false); }
  };

  const handleReset = () => {
    setSelectedImage(null); setImagePreview(null); setAnalysisResult(null);
    setError(null); setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
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
      case 'low': case 'mild to moderate': return '#1565c0';
      case 'moderate': return '#e65100';
      case 'moderate to severe': return '#c62828';
      case 'severe': case 'critical': return '#b71c1c';
      default: return '#546e7a';
    }
  };

  const getUrgencyColor = u => {
    switch (u?.toLowerCase()) {
      case 'low': return '#2e7d32';
      case 'medium': return '#e65100';
      case 'high': return '#c62828';
      case 'critical': return '#b71c1c';
      default: return '#546e7a';
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify({
      ...analysisResult, generatedAt: new Date().toISOString(),
      generatedBy: user?.email, reportId: `TRUNK-${Date.now()}`,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `trunk-analysis-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const NOT_DETECTED_THRESHOLD = 35;

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#070f1a' }}>
      <UserHeader />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <CircularProgress size={52} thickness={3} sx={{ color: '#ffa726' }} />
      </motion.div>
      <Typography variant="body1" sx={{ mt: 3, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Loading Trunk Detection System...</Typography>
    </Box>
  );

  // ── Data extraction ───────────────────────────────────────────────────────────
  const image = analysisResult?.image || {};
  const primaryDetection = analysisResult?.primary_detection || {};
  const maturity = analysisResult?.maturity || {};
  const visualAnalysis = analysisResult?.visual_analysis || {};
  const disease = analysisResult?.disease || {};
  const modelInfo = analysisResult?.model_info || {};
  const detections = analysisResult?.all_detections || analysisResult?.detections || [];
  const detectionCount = Array.isArray(detections) ? detections.length : 0;
  const meanDetectionConfidence = detectionCount > 0
    ? Math.round(detections.reduce((sum, d) => sum + Number(d?.confidence || 0), 0) / detectionCount) : 0;
  const hasColorAnalysis = Boolean(visualAnalysis?.color && Object.keys(visualAnalysis.color).length > 0);
  const hasTextureAnalysis = Boolean(visualAnalysis?.texture && Object.keys(visualAnalysis.texture).length > 0);
  const hasLesionAnalysis = Boolean(visualAnalysis?.lesions && visualAnalysis?.source === 'model_detection');
  const hasMlOutputSignals = Boolean(modelInfo?.type || modelInfo?.model_file) || detectionCount > 0 || Boolean(primaryDetection?.class_name || primaryDetection?.class);
  const isMlUsed = (analysisResult?.model_used ?? analysisResult?.ml_model_used ?? modelInfo?.model_used ?? hasMlOutputSignals) !== false;
  const fallbackReason = analysisResult?.fallback_reason || modelInfo?.reason || 'ML model unavailable';
  const showModelBanner = analysisResult?.model_used !== undefined || analysisResult?.ml_model_used !== undefined || modelInfo?.model_used !== undefined || Boolean(analysisResult?.fallback_reason || modelInfo?.reason || modelInfo?.model_file);
  const imageMetadata = analysisResult?.image_metadata || {};
  const isHealthy = !disease?.detected;
  const visualizationValue = analysisResult?.visualization;
  const visualizationSrc =
    typeof visualizationValue === 'string' && visualizationValue.length > 0
      ? (visualizationValue.startsWith('data:image') || visualizationValue.startsWith('http')
          ? visualizationValue : `data:image/jpeg;base64,${visualizationValue}`)
      : null;
  const hasBoxCoordinates = detectionCount > 0 && detections.some(d => Array.isArray(d?.bbox) && d.bbox.length === 4);
  const healthScore = analysisResult?.health_score || analysisResult?.healthScore || 0;
  const trunksMainConfidence = analysisResult ? Number(primaryDetection?.confidence ?? healthScore ?? 0) : null;
  const isTrunksNotDetected = trunksMainConfidence !== null && trunksMainConfidence < NOT_DETECTED_THRESHOLD;

  return (
    <>
      <UserHeader />

      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f9f5', pt: '80px', pb: '90px' }}>
        <Container maxWidth="lg">

          {/* ── HERO ── */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{
              p: { xs: 3, md: '44px 48px' }, mb: 3,
              background: 'linear-gradient(135deg, #fdf8f5 0%, #f5ede8 50%, #e8dfd8 100%)',
              color: '#3E2723', borderRadius: '20px', position: 'relative', overflow: 'hidden',
              border: '1px solid #bcaaa4',
              boxShadow: '0 8px 32px rgba(62,39,35,0.12)'
            }}>
              <Box sx={{ position: 'absolute', right: '-40px', top: '-30px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(139,69,19,0.08)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', right: '80px', bottom: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(121,85,72,0.08)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#efebe9', border: '1px solid #bcaaa4', borderRadius: '8px', px: 1.5, py: 0.5, mb: 2 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#5d4037', boxShadow: '0 0 8px #5d4037' }} />
                  <Typography sx={{ color: '#3E2723', fontWeight: 800, fontSize: '0.72rem', letterSpacing: 1.2, textTransform: 'uppercase' }}>Trunk Analysis</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: -1, lineHeight: 1, mb: 1, color: '#3E2723' }}>
                  Rubber Tree <Box component="span" sx={{ color: '#5d4037' }}>Trunk</Box> Detection
                </Typography>
                <Typography sx={{ opacity: 0.85, maxWidth: 460, lineHeight: 1.7, fontSize: '1rem', color: '#6d4c41' }}>
                  AI-powered maturity detection & disease classification system.
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* ── ALERTS ───────────────────────────────────────────────────────── */}
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

          {/* ── UPLOAD PANEL ── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Box sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: '16px', border: '1px solid #bcaaa4', bgcolor: 'white', boxShadow: '0 4px 16px rgba(62,39,35,0.08)' }}>

              {!imagePreview && (
                <Grid container spacing={2}>
                  {[
                    { icon: <FileUploadIcon sx={{ color: '#ffa726', fontSize: 28 }} />, title: 'Upload Image', sub: 'Select from your device', hint: 'JPEG · PNG · WebP · max 10 MB', onClick: () => fileInputRef.current?.click() },
                    { icon: <PhotoCameraIcon sx={{ color: '#ffa726', fontSize: 28 }} />, title: 'Take a Photo', sub: 'Use your device camera', hint: 'Capture trunk sample live', onClick: () => setCameraOpen(true) },
                  ].map(({ icon, title, sub, hint, onClick }) => (
                    <Grid item xs={12} sm={6} key={title}>
                      <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                        <Box onClick={onClick} sx={{
                          border: '1px solid #bcaaa4', borderRadius: '12px', p: 3.5,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2,
                          cursor: 'pointer', bgcolor: '#fdf8f5', transition: 'all 0.18s',
                          '&:hover': { bgcolor: '#f5ede8', borderColor: '#8d6e63', boxShadow: '0 4px 20px rgba(93,64,55,0.12)' },
                        }}>
                          <Box sx={{ width: 58, height: 58, borderRadius: '50%', bgcolor: '#efebe9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>{title}</Typography>
                          <Typography variant="body2" sx={{ color: '#6d4c41', textAlign: 'center' }}>{sub}</Typography>
                          <Typography variant="caption" sx={{ color: '#8d6e63', textAlign: 'center' }}>{hint}</Typography>
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

              {/* Tree Profile Selector */}
              <Box sx={{ mt: imagePreview ? 0 : 2.5 }}>
                <FormControl size="small" sx={{ minWidth: 300, maxWidth: 460 }}>
                  <InputLabel id="trunk-tree-select-label">Target Tree Profile</InputLabel>
                  <Select labelId="trunk-tree-select-label" value={selectedTreeId} label="Target Tree Profile"
                    onChange={e => setSelectedTreeId(e.target.value)}
                    disabled={loadingTrees || treeProfiles.length === 0}
                    sx={{ borderRadius: 2, bgcolor: '#fdf8f5', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d7ccc8' } }}
                  >
                    {treeProfiles.map(tree => (
                      <MenuItem key={tree._id} value={tree._id}>
                        {tree.treeID || tree.treeId || 'Unknown Tree'} — {tree.species || 'Rubber'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!loadingTrees && treeProfiles.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>
                    No tree profiles found. Analysis will use the latest available tree context.
                  </Typography>
                )}
              </Box>

              {imagePreview && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2.5 }}>
                  <Button variant="contained" size="large" onClick={handleAnalyze}
                    disabled={!selectedImage || analyzing}
                    startIcon={analyzing ? <CircularProgress size={18} color="inherit" /> : <AnalyticsIcon />}
                    sx={{ bgcolor: '#ffa726', color: '#000', px: 5, py: 1.4, borderRadius: '12px', fontSize: '0.95rem', fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 20px rgba(255,167,38,0.35)', '&:hover': { bgcolor: '#ffb74d', boxShadow: '0 6px 24px rgba(255,167,38,0.45)' }, '&:disabled': { bgcolor: '#ede3da', color: '#8d8075', boxShadow: 'none' } }}>
                    {analyzing ? 'Analyzing...' : 'Analyze Trunk'}
                  </Button>
                  {!analyzing && (
                    <Button variant="outlined" size="large" onClick={handleReset} startIcon={<RestartAltIcon />}
                      sx={{ borderColor: '#bcaaa4', color: '#5d4037', px: 3, py: 1.4, borderRadius: '12px', fontSize: '0.95rem', textTransform: 'none', '&:hover': { borderColor: '#8d6e63', bgcolor: '#f5ede8' } }}>
                      Reset
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </motion.div>

          {/* ── RESULTS ── */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>

                {/* ── NOT DETECTED GATE ── */}
                {isTrunksNotDetected ? (
                  <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#ffffff', borderRadius: '20px', border: '1px dashed #d7ccc8', mb: 3 }}>
                    <Box sx={{ fontSize: 72, mb: 2, opacity: 0.15 }}>🌳</Box>
                    <Typography variant="h4" sx={{ color: '#3E2723', fontWeight: 900, mb: 1 }}>Trunks Not Detected</Typography>
                    <Typography sx={{ color: '#6d4c41', maxWidth: 400, mx: 'auto', mb: 1.5, lineHeight: 1.6 }}>
                      The model's confidence is too low ({trunksMainConfidence?.toFixed(1)}%) to confirm a rubber tree trunk.
                      Please upload a clearer, well-lit photo of the trunk.
                    </Typography>
                    <Chip label={`Confidence: ${trunksMainConfidence?.toFixed(1)}%`} sx={{ bgcolor: '#ffebee', color: '#b71c1c', border: '1px solid #ef9a9a', fontWeight: 700 }} />
                  </Box>
                ) : (<>

                {/* Model banner */}
                {showModelBanner && (
                  <Alert severity={isMlUsed ? 'success' : 'warning'} icon={isMlUsed ? <ScienceIcon /> : <WarningIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
                    <Typography variant="body2">
                      {isMlUsed ? `✅ Analyzed using ML model: ${modelInfo.model_file || 'Trunks-v2.pt'}` : `⚠️ Fallback analysis: ${fallbackReason}`}
                    </Typography>
                  </Alert>
                )}

                {/* Results header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon sx={{ color: '#8B4513' }} />
                    <Typography variant="h6" sx={{ color: '#3E2723', fontWeight: 800 }}>Analysis Results</Typography>
                  </Box>
                </Box>

                {/* 1 ── Health Score Hero */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
                  <Card elevation={0} sx={{ borderRadius: 3, mb: 3, background: getHealthScoreGradient(healthScore), color: 'white', overflow: 'hidden', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -24, right: -24, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" sx={{ opacity: 0.65, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Overall Health Score</Typography>
                          <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1, mt: 0.5, letterSpacing: -1 }}>{healthScore}%</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, fontWeight: 600 }}>{getHealthScoreLabel(healthScore)}</Typography>
                          {analysisResult.all_predictions?.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7, mt: 1.5 }}>
                              {analysisResult.all_predictions.map((p, i) => (
                                <Chip key={i} label={`${p.class} ${p.confidence}%`} size="small"
                                  sx={i === 0
                                    ? { bgcolor: 'rgba(255,255,255,0.28)', color: 'white', fontWeight: 700, fontSize: '0.7rem' }
                                    : { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <Box sx={{ mb: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>Health Progress</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>{healthScore}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={healthScore}
                              sx={{ height: 10, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.22)', '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 99 } }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              {['Critical', 'Poor', 'Fair', 'Good', 'Excellent'].map(l => (
                                <Typography key={l} variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>{l}</Typography>
                              ))}
                            </Box>
                          </Box>
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.13)', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ opacity: 0.65 }}>Disease</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.3, lineHeight: 1.2, color: disease.detected ? '#ffcdd2' : 'white' }}>
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

                {/* 2 ── Maturity + Disease + Detections row */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #d7ccc8', bgcolor: 'white' }}>
                        <SectionLabel icon={getMaturityIcon(maturity.class)} label="Maturity" />
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#3E2723', lineHeight: 1, letterSpacing: -0.5 }}>
                          {maturity.class || 'Unknown'}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#6d4c41' }}>Confidence</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#fbc02d' }}>{maturity.confidence}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={maturity.confidence || 0}
                            sx={{ height: 6, borderRadius: 99, bgcolor: '#efebe9', '& .MuiLinearProgress-bar': { bgcolor: '#fbc02d', borderRadius: 99 } }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: `1px solid ${disease.detected ? '#ef9a9a' : '#d7ccc8'}`, bgcolor: disease.detected ? '#fff5f5' : 'white' }}>
                        <SectionLabel
                          icon={disease.detected ? <BugReportIcon sx={{ color: '#ef5350', fontSize: 17 }} /> : <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 17 }} />}
                          label="Disease Status"
                        />
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 2, bgcolor: disease.detected ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)', mb: 1.5 }}>
                          {disease.detected
                            ? <ErrorIcon sx={{ color: '#ef5350', fontSize: 17 }} />
                            : <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 17 }} />}
                          <Typography variant="body2" sx={{ fontWeight: 700, color: disease.detected ? '#c62828' : '#2e7d32' }}>
                            {disease.name || 'Healthy'}
                          </Typography>
                        </Box>
                        {disease.detected && (
                          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                            <Chip label={`Severity: ${disease.severity}`} size="small" sx={{ bgcolor: getSeverityColor(disease.severity), color: 'white', fontWeight: 600, fontSize: '0.7rem', border: 'none' }} />
                            <Chip label={`Urgency: ${disease.urgency}`} size="small" sx={{ bgcolor: getUrgencyColor(disease.urgency), color: 'white', fontWeight: 600, fontSize: '0.7rem', border: 'none' }} />
                          </Box>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #d7ccc8', bgcolor: 'white' }}>
                        <SectionLabel icon={<TimelineIcon sx={{ color: '#ffb74d', fontSize: 17 }} />} label="Model Detections" />
                        <Typography variant="h2" sx={{ fontWeight: 900, color: '#3E2723', lineHeight: 1, letterSpacing: -1 }}>
                          {detectionCount}
                          <Typography component="span" variant="h5" sx={{ fontWeight: 400, ml: 0.6, color: '#ffb74d' }}>
                            {detectionCount === 1 ? 'object' : 'objects'}
                          </Typography>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6d4c41', display: 'block', mt: 1.5 }}>
                          Avg confidence: {meanDetectionConfidence}%
                        </Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* 3 ── Color Analysis */}
                {hasColorAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #d7ccc8', bgcolor: 'white' }}>
                      <SectionLabel icon={<ColorLensIcon sx={{ color: '#ffb74d', fontSize: 17 }} />} label="Color Analysis" />
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 72, height: 72, borderRadius: 2, mx: 'auto', mb: 1.5,
                            bgcolor: visualAnalysis?.color?.hex || '#8B4513',
                            border: '3px solid #d7ccc8',
                            boxShadow: `0 2px 10px ${visualAnalysis?.color?.hex || '#8B4513'}55`,
                          }} />
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>{visualAnalysis?.color?.name || '—'}</Typography>
                          <Typography variant="caption" sx={{ color: '#6d4c41' }}>Dominant Color</Typography>
                        </Grid>
                        <Grid item xs={12} sm={9}>
                          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                            {visualAnalysis?.color?.rgb && (
                              [{ l: 'R', v: visualAnalysis.color.rgb.r }, { l: 'G', v: visualAnalysis.color.rgb.g }, { l: 'B', v: visualAnalysis.color.rgb.b }].map(({ l, v }) => (
                                <Grid item xs={4} key={l}>
                                  <Box sx={{ p: 1.5, bgcolor: '#fdf8f5', borderRadius: 1.5, textAlign: 'center', border: '1px solid #efebe9' }}>
                                    <Typography variant="caption" sx={{ color: '#8d6e63', fontWeight: 600, display: 'block' }}>{l}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>{v}</Typography>
                                  </Box>
                                </Grid>
                              ))
                            )}
                          </Grid>
                          {visualAnalysis?.color?.hsv && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {[{ l: 'H', v: `${visualAnalysis.color.hsv.h}°` }, { l: 'S', v: String(visualAnalysis.color.hsv.s) }, { l: 'V', v: String(visualAnalysis.color.hsv.v) }].map(({ l, v }) => (
                                <Box key={l} sx={{ flex: 1, p: 1, bgcolor: '#fdf8f5', borderRadius: 1.5, textAlign: 'center', border: '1px solid #efebe9' }}>
                                  <Typography variant="caption" sx={{ color: '#8d6e63', fontWeight: 600, display: 'block' }}>{l}</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#3E2723' }}>{v}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                          {visualAnalysis?.color?.description && (
                            <Typography variant="caption" sx={{ color: '#6d4c41', display: 'block', mt: 1.5 }}>
                              {visualAnalysis.color.description}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* 4 ── Texture Analysis */}
                {hasTextureAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #d7ccc8', bgcolor: 'white' }}>
                      <SectionLabel icon={<TextureIcon sx={{ color: '#ffb74d', fontSize: 17 }} />} label="Texture Analysis" />
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            {getTextureIcon(visualAnalysis?.texture?.type)}
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#3E2723', textTransform: 'capitalize' }}>
                              {visualAnalysis?.texture?.type || '—'}
                            </Typography>
                          </Box>
                          {visualAnalysis?.texture?.description && (
                            <Typography variant="body2" sx={{ color: '#6d4c41' }}>{visualAnalysis.texture.description}</Typography>
                          )}
                          {visualAnalysis?.texture?.health_indicator != null && (
                            <Box sx={{ mt: 1.5 }}>
                              <Chip label={`Health: ${visualAnalysis.texture.health_indicator}%`} size="small"
                                sx={{ bgcolor: visualAnalysis.texture.health_indicator > 70 ? '#2e7d32' : visualAnalysis.texture.health_indicator > 50 ? '#e65100' : '#c62828', color: 'white', fontWeight: 600, fontSize: '0.72rem', border: 'none' }}
                              />
                            </Box>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          {visualAnalysis?.texture?.metrics && (
                            [{ label: 'Contrast', value: visualAnalysis.texture.metrics.contrast, max: 100 },
                             { label: 'Roughness', value: visualAnalysis.texture.metrics.roughness, max: 100 },
                             { label: 'Entropy', value: visualAnalysis.texture.metrics.entropy, max: 8, fmt: v => Number(v).toFixed(2) }
                            ].map(({ label, value, max, fmt }) => (
                              <Box key={label} sx={{ mb: 1.8 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#6d4c41' }}>{label}</Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#3E2723' }}>{fmt ? fmt(value) : value}</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={Math.min(100, (value / max) * 100)}
                                  sx={{ height: 7, borderRadius: 99, bgcolor: '#efebe9', '& .MuiLinearProgress-bar': { bgcolor: '#ffb74d', borderRadius: 99 } }}
                                />
                              </Box>
                            ))
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* 5 ── Lesion Detection */}
                {hasLesionAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: `1px solid ${visualAnalysis.lesions.detected ? '#ef9a9a' : '#d7ccc8'}`, bgcolor: visualAnalysis.lesions.detected ? '#fff5f5' : 'white' }}>
                      <SectionLabel icon={<WarningIcon sx={{ color: visualAnalysis.lesions.detected ? '#ef5350' : '#4caf50', fontSize: 17 }} />} label="Lesion Detection" />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 2, bgcolor: visualAnalysis.lesions.detected ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)' }}>
                            {visualAnalysis.lesions.detected ? <ErrorIcon sx={{ color: '#ef5350', fontSize: 17 }} /> : <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 17 }} />}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: visualAnalysis.lesions.detected ? '#c62828' : '#2e7d32' }}>
                                {visualAnalysis.lesions.detected ? `${visualAnalysis.lesions.count} Lesions Detected` : 'No Lesions Detected'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6d4c41' }}>{visualAnalysis.lesions.description}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        {visualAnalysis.lesions.detected && (
                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, bgcolor: '#fdf8f5', borderRadius: 2, border: '1px solid #efebe9' }}>
                              <Typography variant="caption" sx={{ color: '#3E2723', fontWeight: 700, display: 'block', mb: 1 }}>Lesion Details</Typography>
                              <Typography variant="body2" sx={{ color: '#6d4c41' }}>Affected Area: {visualAnalysis.lesions.affected_area_percentage}% of trunk</Typography>
                              <Typography variant="body2" sx={{ color: '#6d4c41' }}>Severity: {visualAnalysis.lesions.severity}</Typography>
                              {visualAnalysis.lesions.types?.length > 0 && (
                                <Typography variant="body2" sx={{ color: '#6d4c41' }}>Types: {visualAnalysis.lesions.types.join(', ')}</Typography>
                              )}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* 6 ── Disease Analysis */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1px solid #d7ccc8', bgcolor: 'white' }}>
                    <SectionLabel icon={<BugReportIcon sx={{ color: '#ffb74d', fontSize: 17 }} />} label="Disease Analysis" />
                    {isHealthy ? (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1.2, borderRadius: 2, bgcolor: 'rgba(76,175,80,0.1)' }}>
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>Tree is Healthy</Typography>
                          <Typography variant="caption" sx={{ color: '#6d4c41' }}>No signs of disease detected. Continue regular monitoring.</Typography>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', mb: 2.5 }}>
                          <ErrorIcon sx={{ color: '#ef5350', fontSize: 17 }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#c62828' }}>
                            {disease.name} — Confidence: {disease.confidence}%
                          </Typography>
                        </Box>
                        {disease.description && (
                          <Typography variant="body2" sx={{ color: '#546e7a', mb: 2.5, px: 0.5 }}>{disease.description}</Typography>
                        )}
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, bgcolor: 'rgba(255,152,0,0.05)', borderRadius: 2, border: '1px solid rgba(255,152,0,0.2)', height: '100%' }}>
                              <Typography variant="caption" sx={{ color: '#ffcc80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.2 }}>
                                <WarningIcon sx={{ fontSize: 14 }} /> Symptoms
                              </Typography>
                              <List dense disablePadding>
                                {disease.symptoms?.length
                                  ? disease.symptoms.map((s, i) => (
                                    <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                                      <ListItemIcon sx={{ minWidth: 26 }}><WarningIcon sx={{ color: '#ffb74d', fontSize: 15 }} /></ListItemIcon>
                                      <ListItemText primary={s} primaryTypographyProps={{ variant: 'body2', sx: { color: '#37474f' } }} />
                                    </ListItem>
                                  ))
                                  : <ListItem disableGutters><ListItemText primary="No symptom information available" primaryTypographyProps={{ variant: 'body2', sx: { color: '#607d8b' } }} /></ListItem>
                                }
                              </List>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, bgcolor: 'rgba(33,150,243,0.05)', borderRadius: 2, border: '1px solid rgba(33,150,243,0.2)', height: '100%' }}>
                              <Typography variant="caption" sx={{ color: '#90caf9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.2 }}>
                                <HealingIcon sx={{ fontSize: 14 }} /> Treatment
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#37474f' }}>
                                {disease.treatment || 'No treatment information available.'}
                              </Typography>
                            </Box>
                          </Grid>
                          {disease.latex_impact && (
                            <Grid item xs={12}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(33,150,243,0.05)', borderRadius: 2, border: '1px solid rgba(33,150,243,0.2)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WaterDropIcon sx={{ color: '#64b5f6' }} />
                                <Typography variant="body2" sx={{ color: '#37474f' }}>
                                  <span style={{ color: '#1b5e20', fontWeight: 700 }}>Latex Impact:</span> {disease.latex_impact}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </>
                    )}
                  </Paper>
                </motion.div>

                {/* 7 ── Care Recommendations */}
                {analysisResult.care_recommendations?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #3E2723 0%, #5D3A1A 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                      <Box sx={{ position: 'absolute', right: -30, bottom: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                        <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.55)' }} />
                        <AgricultureIcon sx={{ fontSize: 18 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Care Recommendations</Typography>
                      </Box>
                      <List dense disablePadding>
                        {analysisResult.care_recommendations.map((rec, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                            <ListItem disableGutters sx={{ py: 0.9, alignItems: 'flex-start' }}>
                              <ListItemIcon sx={{ minWidth: 34, mt: 0.3 }}>
                                <Box sx={{
                                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  bgcolor: rec.priority === 'immediate' ? '#f44336' : rec.priority === 'soon' ? '#ff9800' : rec.priority === 'monitor' ? '#2196f3' : '#4caf50',
                                }}>
                                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'white' }}>{i + 1}</Typography>
                                </Box>
                              </ListItemIcon>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3, flexWrap: 'wrap' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>{rec.action}</Typography>
                                  <Chip label={rec.priority} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                                    bgcolor: rec.priority === 'immediate' ? '#f44336' : rec.priority === 'soon' ? '#ff9800' : rec.priority === 'monitor' ? '#2196f3' : '#4caf50',
                                    color: 'white' }} />
                                  {rec.timeframe && <Chip label={rec.timeframe} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }} />}
                                </Box>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>{rec.description}</Typography>
                              </Box>
                            </ListItem>
                            {i < analysisResult.care_recommendations.length - 1 && (
                              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 0.5 }} />
                            )}
                          </motion.div>
                        ))}
                      </List>
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mt: 2, mb: 1.5 }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                        Based on the tree's maturity level{disease.detected ? ', detected disease,' : ''} and overall health assessment.
                      </Typography>
                    </Paper>
                  </motion.div>
                )}

                {/* 8 ── Visualization */}
                {(visualizationSrc || hasBoxCoordinates) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #d7ccc8', bgcolor: 'white' }}>
                      <SectionLabel icon={<ScienceIcon sx={{ color: '#8B4513', fontSize: 17 }} />} label="Detection Visualization" />
                      {visualizationSrc && (
                        <Box sx={{ textAlign: 'center', mb: hasBoxCoordinates ? 2.5 : 0 }}>
                          <motion.img initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
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

                {/* 9 ── All Predictions */}
                {analysisResult.all_predictions?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 3, border: '1.5px solid #d7ccc8', bgcolor: 'white' }}>
                      <SectionLabel icon={<AnalyticsIcon sx={{ color: '#8B4513', fontSize: 17 }} />} label="All Predictions" />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResult.all_predictions.map((pred, i) => (
                          <Tooltip key={i} title={`Class ID: ${pred.class_id}`} arrow>
                            <Chip
                              label={`${pred.class} (${pred.confidence}%)`} size="small"
                              sx={i === 0
                                ? { bgcolor: '#8B4513', color: 'white', fontWeight: 700, fontSize: '0.72rem' }
                                : { bgcolor: '#efebe9', color: '#3E2723', border: '1px solid #d7ccc8', fontWeight: 500, fontSize: '0.72rem' }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </Paper>
                  </motion.div>
                )}

                {/* Metadata */}
                {imageMetadata && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 0.5, pb: 1 }}>
                    <InfoIcon sx={{ fontSize: 13, color: '#bdbdbd' }} />
                    <Typography variant="caption" color="text.disabled">
                      Analysis ID: {analysisResult.analysisId} ·
                      Analyzed: {new Date(imageMetadata.analyzed_at).toLocaleString()} ·
                      File: {imageMetadata.filename} ·
                      Size: {imageMetadata.file_size_kb} KB
                    </Typography>
                  </Box>
                )}
              </>)}
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>

      {/* ── CAMERA DIALOG ────────────────────────────────────────────────────── */}
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
      <UserFooter />
    </>
  );
};

export default TrunksDetection;
