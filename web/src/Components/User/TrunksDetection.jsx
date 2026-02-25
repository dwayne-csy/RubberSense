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
  Zoom,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge
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
  AddPhotoAlternate as AddPhotoAlternateIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  Opacity as OpacityIcon,
  Grain as GrainIcon,
  Biotech as BiotechIcon,
  LocalHospital as LocalHospitalIcon,
  WaterDrop as WaterDropIcon,
  PestControl as PestControlIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    color: true,
    texture: true,
    disease: true,
    recommendations: true
  });

  // Source chooser
  const [chooserOpen, setChooserOpen] = useState(false);

  // Camera states
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // History states
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Analysis steps for stepper
  const analysisSteps = [
    {
      label: 'Image Upload',
      description: 'Select or capture a clear image of the rubber tree trunk',
      icon: <CloudUploadIcon />
    },
    {
      label: 'ML Processing',
      description: 'AI model analyzes trunk features and detects diseases',
      icon: <BiotechIcon />
    },
    {
      label: 'Results Analysis',
      description: 'Review comprehensive health assessment',
      icon: <AssessmentIcon />
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (response.data.success) {
          setUser(response.data.user);
          fetchRecentAnalyses(response.data.user.id);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    const fetchSystemInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/trunks/info`);
        if (response.data.success) {
          setSystemInfo(response.data.data);
          console.log('System info:', response.data.data);
        }
      } catch (err) {
        console.error('Error fetching system info:', err);
      }
    };

    checkAuth();
    fetchSystemInfo();
  }, [navigate, API_BASE_URL]);

  const fetchRecentAnalyses = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/trunks/history?limit=5`);
      if (response.data.success) {
        setRecentAnalyses(response.data.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching recent analyses:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (cameraOpen) {
      startCamera();
    } else if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [cameraOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
      console.error('Camera error:', err);
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
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      setCameraOpen(false);
      setCapturing(false);
      setAnalysisResult(null);
      setSuccessMessage(null);
      setError(null);
      setActiveStep(1);
    }, 'image/jpeg', 0.95);
  };

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
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
    setActiveStep(1);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
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

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/trunks/analyze`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data.success) {
        console.log('Analysis result:', response.data.data);
        setAnalysisResult(response.data.data);
        setSuccessMessage(`Analysis completed successfully! ID: ${response.data.data.analysisId}`);
        setActiveStep(2);
        
        // Refresh recent analyses
        if (user) {
          fetchRecentAnalyses(user.id);
        }
      } else {
        setError(response.data.message || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Analysis timed out. Please try again.');
      } else if (err.response?.status === 413) {
        setError('File too large. Please upload a smaller image.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid image format.');
      } else if (err.response?.status === 404) {
        setError('ML service unavailable. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Error analyzing image. Please try again.');
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
    setActiveStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper functions for styling and formatting
  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    if (score >= 40) return '#f44336';
    return '#b71c1c';
  };

  const getHealthScoreGradient = (score) => {
    if (score >= 80) return 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)';
    if (score >= 40) return 'linear-gradient(135deg, #f44336 0%, #b71c1c 100%)';
    return 'linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)';
  };

  const getHealthScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Critical';
  };

  const getMaturityIcon = (maturityClass) => {
    if (maturityClass?.toLowerCase() === 'immature') {
      return <GrassIcon sx={{ color: '#8B4513' }} />;
    }
    return <ForestIcon sx={{ color: '#8B4513' }} />;
  };

  const getDiseaseIcon = (diseaseName) => {
    if (diseaseName === 'Healthy') {
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    }
    return <BugReportIcon sx={{ color: '#f44336' }} />;
  };

  const getTextureIcon = (textureType) => {
    switch (textureType?.toLowerCase()) {
      case 'smooth':
        return <SpaIcon sx={{ color: '#4caf50' }} />;
      case 'moderately rough':
        return <TextureIcon sx={{ color: '#ff9800' }} />;
      case 'rough':
        return <TextureIcon sx={{ color: '#ff9800' }} />;
      case 'very rough / cracked':
        return <WarningIcon sx={{ color: '#f44336' }} />;
      default:
        return <TextureIcon sx={{ color: '#8B4513' }} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'none':
        return '#4caf50';
      case 'low':
      case 'mild to moderate':
        return '#2196f3';
      case 'moderate':
        return '#ff9800';
      case 'moderate to severe':
        return '#f44336';
      case 'severe':
      case 'critical':
        return '#b71c1c';
      default:
        return '#757575';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'low':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'high':
        return '#f44336';
      case 'critical':
        return '#b71c1c';
      default:
        return '#757575';
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;

    const reportData = {
      ...analysisResult,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.email,
      reportId: `TRUNK-${Date.now()}`,
      analysisId: analysisResult.analysisId,
      summary: {
        healthStatus: analysisResult.primary_detection?.health_status,
        diseaseName: analysisResult.disease?.name,
        confidence: analysisResult.primary_detection?.confidence,
        healthScore: analysisResult.health_score
      }
    };

    const blob = new Blob(
      [JSON.stringify(reportData, null, 2)],
      { type: 'application/json' }
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trunk-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        bgcolor: '#f5f5f5' 
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CircularProgress size={60} thickness={4} sx={{ color: '#8B4513' }} />
        </motion.div>
        <Typography variant="h6" sx={{ mt: 3, color: '#8B4513', fontWeight: 500 }}>
          Loading Trunk Detection System...
        </Typography>
      </Box>
    );
  }

  // Extract data with proper null checks
  const image = analysisResult?.image || {};
  const primaryDetection = analysisResult?.primary_detection || {};
  const maturity = analysisResult?.maturity || {};
  const visualAnalysis = analysisResult?.visual_analysis || {};
  const disease = analysisResult?.disease || {};
  const ageEstimation = analysisResult?.age_estimation || {};
  const modelInfo = analysisResult?.model_info || {};
  const imageMetadata = analysisResult?.image_metadata || {};
  const isHealthy = !disease?.detected;

  return (
    <>
      <UserHeader />

      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: '80px', pb: '90px' }}>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper 
              elevation={3} 
              sx={{
                p: { xs: 3, md: 5 },
                mb: 4,
                background: 'linear-gradient(135deg, #3E2723 0%, #5D3A1A 55%, #8B4513 100%)',
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ 
                position: 'absolute', 
                top: -20, 
                right: -20, 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.07)' 
              }} />
              <Box sx={{ 
                position: 'absolute', 
                bottom: -40, 
                left: -40, 
                width: 300, 
                height: 300, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.04)' 
              }} />

              {/* History/Stats Buttons */}
              <Box sx={{ 
                position: 'absolute', 
                top: 20, 
                right: 20, 
                zIndex: 2, 
                display: 'flex', 
                gap: 1.5 
              }}>
                <Button 
                  component={Link} 
                  to="/trunk-history" 
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
                  to="/trunk-stats" 
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
                  🌳 Rubber Tree Trunk Analysis
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.85, mb: 2.5 }}>
                  AI-Powered Maturity Detection & Disease Classification System
                </Typography>
                {systemInfo && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                    {systemInfo.mlModel?.status === 'Active' && (
                      <Chip
                        icon={<ScienceIcon />}
                        label={`${systemInfo.mlModel?.name} (${systemInfo.mlModel?.sizeKB} KB)`}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.12)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* Stepper */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Stepper activeStep={activeStep} orientation="horizontal" sx={{ flexWrap: 'wrap' }}>
              {analysisSteps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel StepIconComponent={() => (
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      bgcolor: index <= activeStep ? '#8B4513' : '#e0e0e0',
                      color: index <= activeStep ? 'white' : '#757575',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1
                    }}>
                      {step.icon}
                    </Box>
                  )}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{step.description}</Typography>
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Alerts */}
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

          {/* Upload Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 3, md: 4 }, 
                mb: 4, 
                borderRadius: 4, 
                border: '2px solid #8B4513', 
                bgcolor: 'white' 
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#8B4513', 
                  mb: 3, 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                }}
              >
                <CloudUploadIcon /> Upload or Capture Trunk Image
              </Typography>

              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <motion.img
                    src={imagePreview}
                    alt="Trunk preview"
                    style={{ 
                      width: '100%', 
                      maxHeight: 400, 
                      objectFit: 'contain', 
                      borderRadius: 16, 
                      border: '3px solid #8B4513', 
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
                      border: '3px dashed #8B4513',
                      borderRadius: 4,
                      p: { xs: 5, md: 8 },
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: '#f5f0e6',
                      transition: 'all 0.25s',
                      '&:hover': {
                        bgcolor: '#efe4d8',
                        borderColor: '#5D3A1A'
                      }
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <AddPhotoAlternateIcon sx={{ fontSize: 90, color: '#8B4513', mb: 2 }} />
                    </motion.div>
                    <Typography variant="h6" sx={{ color: '#8B4513', fontWeight: 700, mb: 0.5 }}>
                      Add Trunk Image
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

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center', 
                mt: 3, 
                flexWrap: 'wrap' 
              }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleAnalyze}
                  disabled={!selectedImage || analyzing}
                  startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
                  sx={{
                    bgcolor: '#8B4513',
                    px: 6,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(139,69,19,0.3)',
                    '&:hover': { bgcolor: '#5D3A1A' },
                    '&:disabled': { bgcolor: '#d4b896', color: '#a0785a' }
                  }}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Trunk'}
                </Button>
                {selectedImage && !analyzing && (
                  <Button 
                    variant="outlined" 
                    size="large" 
                    onClick={handleReset} 
                    startIcon={<RestartAltIcon />}
                    sx={{
                      borderColor: '#8B4513',
                      color: '#8B4513',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      '&:hover': { borderColor: '#5D3A1A', bgcolor: '#f5f0e6' }
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* Results Section */}
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
                  <Fade in={true}>
                    <Alert 
                      severity="info" 
                      icon={<InfoIcon />} 
                      sx={{ mb: 3, borderRadius: 2 }}
                    >
                      <Typography variant="body2">
                        ✅ Image stored securely in cloud. Analysis ID: {analysisResult.analysisId}
                      </Typography>
                    </Alert>
                  </Fade>
                )}

                {/* Image Preview in Results */}
                {image && image.url && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ color: '#8B4513', mb: 1 }}>
                      Analyzed Image:
                    </Typography>
                    <img 
                      src={image.url} 
                      alt="Analyzed trunk" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '150px', 
                        borderRadius: 8,
                        border: '2px solid #8B4513'
                      }} 
                    />
                  </Box>
                )}

                {/* ML Model Info Banner */}
                {modelInfo && (
                  <Fade in={true}>
                    <Alert 
                      severity={modelInfo.model_used ? "info" : "warning"} 
                      icon={modelInfo.model_used ? <ScienceIcon /> : <WarningIcon />}
                      sx={{ mb: 3, borderRadius: 2 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {modelInfo.model_used 
                            ? `✅ Analyzed using ML model: ${modelInfo.model_file || 'Trunks.pt'}`
                            : `⚠️ Fallback analysis: ${modelInfo.reason || 'ML model unavailable'}`}
                        </Typography>
                        {primaryDetection && (
                          <Typography variant="caption" color="text.secondary">
                            Primary detection: {primaryDetection.display_name} ({primaryDetection.confidence}% confidence)
                          </Typography>
                        )}
                      </Box>
                    </Alert>
                  </Fade>
                )}

                {/* Header with Download */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 3 
                }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: '#8B4513', 
                      fontWeight: 800, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}
                  >
                    <AnalyticsIcon /> Analysis Results
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={downloadReport} 
                    startIcon={<DownloadIcon />}
                    sx={{ 
                      borderColor: '#8B4513', 
                      color: '#8B4513', 
                      borderRadius: 3, 
                      textTransform: 'none',
                      '&:hover': { borderColor: '#5D3A1A', bgcolor: '#f5f0e6' } 
                    }}
                  >
                    Download Report
                  </Button>
                </Box>

                {/* Health Score Hero */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card 
                    elevation={3} 
                    sx={{ 
                      borderRadius: 3, 
                      mb: 3, 
                      background: getHealthScoreGradient(analysisResult.health_score || analysisResult.healthScore), 
                      color: 'white' 
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: 0.8, 
                              textTransform: 'uppercase', 
                              letterSpacing: 1, 
                              mb: 0.5, 
                              fontSize: '0.75rem', 
                              fontWeight: 700 
                            }}
                          >
                            Overall Health Score
                          </Typography>
                          <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                            {analysisResult.health_score || analysisResult.healthScore}%
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, fontWeight: 600 }}>
                            {getHealthScoreLabel(analysisResult.health_score || analysisResult.healthScore)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <LinearProgress 
                            variant="determinate" 
                            value={analysisResult.health_score || analysisResult.healthScore || 0}
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
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Critical</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Poor</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Fair</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Good</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Excellent</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Maturity */}
                  <Grid item xs={12} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card 
                        elevation={2} 
                        sx={{ 
                          borderRadius: 3, 
                          border: '2px solid #8B4513', 
                          height: '100%' 
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            {getMaturityIcon(maturity.class)}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#8B4513', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                letterSpacing: 1, 
                                fontSize: '0.75rem' 
                              }}
                            >
                              Maturity
                            </Typography>
                          </Box>
                          <Typography variant="h5" sx={{ color: '#3E2723', fontWeight: 800, mb: 1 }}>
                            {maturity.class || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Confidence: {maturity.confidence}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>

                  {/* Disease Status */}
                  <Grid item xs={12} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Card 
                        elevation={2} 
                        sx={{ 
                          borderRadius: 3, 
                          border: '2px solid #8B4513', 
                          height: '100%' 
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            {getDiseaseIcon(disease.name)}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#8B4513', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                letterSpacing: 1, 
                                fontSize: '0.75rem' 
                              }}
                            >
                              Disease Status
                            </Typography>
                          </Box>
                          <Typography 
                            variant="h5" 
                            sx={{
                              color: disease.detected ? '#f44336' : '#4caf50',
                              fontWeight: 800,
                              mb: 1
                            }}
                          >
                            {disease.name || 'Unknown'}
                          </Typography>
                          {disease.detected && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={`Severity: ${disease.severity}`}
                                size="small"
                                sx={{ 
                                  bgcolor: getSeverityColor(disease.severity), 
                                  color: 'white', 
                                  fontWeight: 600 
                                }}
                              />
                              <Chip
                                label={`Urgency: ${disease.urgency}`}
                                size="small"
                                sx={{ 
                                  bgcolor: getUrgencyColor(disease.urgency), 
                                  color: 'white', 
                                  fontWeight: 600 
                                }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>

                  {/* Age Estimation */}
                  <Grid item xs={12} md={4}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card 
                        elevation={2} 
                        sx={{ 
                          borderRadius: 3, 
                          border: '2px solid #8B4513', 
                          height: '100%' 
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <TimelineIcon sx={{ color: '#8B4513' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#8B4513', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                letterSpacing: 1, 
                                fontSize: '0.75rem' 
                              }}
                            >
                              Estimated Age
                            </Typography>
                          </Box>
                          <Typography variant="h2" sx={{ color: '#3E2723', fontWeight: 900, lineHeight: 1 }}>
                            {ageEstimation.estimated_years ?? '—'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            years {ageEstimation.range ? `(${ageEstimation.range})` : ''}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Confidence: {ageEstimation.confidence}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>

                {/* Color Analysis Section */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                >
                  <Accordion 
                    expanded={expandedSections.color} 
                    onChange={() => toggleSection('color')}
                    sx={{ 
                      mb: 2, 
                      borderRadius: 3, 
                      '&:before': { display: 'none' },
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        bgcolor: '#f5f0e6', 
                        borderRadius: expandedSections.color ? '12px 12px 0 0' : '12px',
                        '&.Mui-expanded': { minHeight: 48 }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ColorLensIcon sx={{ color: '#8B4513' }} />
                        <Typography variant="h6" sx={{ color: '#3E2723', fontWeight: 700 }}>
                          Color Analysis
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      <Grid container spacing={3} alignItems="center">
                        {/* Color Swatch */}
                        <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
                          <Box sx={{
                            width: 110,
                            height: 110,
                            borderRadius: '50%',
                            mx: 'auto',
                            mb: 1.5,
                            background: visualAnalysis?.color?.hex || '#8B4513',
                            border: '4px solid #f5f0e6',
                            boxShadow: `0 4px 24px ${visualAnalysis?.color?.hex || '#8B4513'}88`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <ColorLensIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.85)' }} />
                          </Box>
                          <Typography variant="subtitle1" sx={{ color: '#8B4513', fontWeight: 700 }}>
                            {visualAnalysis?.color?.name || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Dominant Color</Typography>
                        </Grid>

                        {/* Color Details */}
                        <Grid item xs={12} sm={9}>
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            {visualAnalysis?.color?.rgb && (
                              <>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    p: 2, 
                                    bgcolor: '#f5f0e6', 
                                    borderRadius: 2, 
                                    border: '1px solid #e8d5bf', 
                                    textAlign: 'center' 
                                  }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Red
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#3E2723' }}>
                                      {visualAnalysis.color.rgb.r}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    p: 2, 
                                    bgcolor: '#f5f0e6', 
                                    borderRadius: 2, 
                                    border: '1px solid #e8d5bf', 
                                    textAlign: 'center' 
                                  }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Green
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#3E2723' }}>
                                      {visualAnalysis.color.rgb.g}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    p: 2, 
                                    bgcolor: '#f5f0e6', 
                                    borderRadius: 2, 
                                    border: '1px solid #e8d5bf', 
                                    textAlign: 'center' 
                                  }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Blue
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#3E2723' }}>
                                      {visualAnalysis.color.rgb.b}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </>
                            )}
                          </Grid>

                          {visualAnalysis?.color?.hsv && (
                            <>
                              <Typography variant="subtitle2" sx={{ color: '#8B4513', fontWeight: 700, mb: 1 }}>
                                HSV Values
                              </Typography>
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    p: 2, 
                                    bgcolor: '#f5f0e6', 
                                    borderRadius: 2, 
                                    border: '1px solid #e8d5bf', 
                                    textAlign: 'center' 
                                  }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Hue
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>
                                      {visualAnalysis.color.hsv.h}°
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    p: 2, 
                                    bgcolor: '#f5f0e6', 
                                    borderRadius: 2, 
                                    border: '1px solid #e8d5bf', 
                                    textAlign: 'center' 
                                  }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Saturation
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>
                                      {visualAnalysis.color.hsv.s}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    p: 2, 
                                    bgcolor: '#f5f0e6', 
                                    borderRadius: 2, 
                                    border: '1px solid #e8d5bf', 
                                    textAlign: 'center' 
                                  }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Value
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#3E2723' }}>
                                      {visualAnalysis.color.hsv.v}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </>
                          )}

                          {visualAnalysis?.color?.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
                              {visualAnalysis.color.description}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </motion.div>

                {/* Texture Analysis Section */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <Accordion 
                    expanded={expandedSections.texture} 
                    onChange={() => toggleSection('texture')}
                    sx={{ 
                      mb: 2, 
                      borderRadius: 3, 
                      '&:before': { display: 'none' },
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        bgcolor: '#f5f0e6', 
                        borderRadius: expandedSections.texture ? '12px 12px 0 0' : '12px',
                        '&.Mui-expanded': { minHeight: 48 }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextureIcon sx={{ color: '#8B4513' }} />
                        <Typography variant="h6" sx={{ color: '#3E2723', fontWeight: 700 }}>
                          Texture Analysis
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                          <Box sx={{ p: 3 }}>
                            <Box sx={{ 
                              fontSize: 64, 
                              mb: 1, 
                              display: 'flex', 
                              justifyContent: 'center', 
                              '& svg': { fontSize: 64 } 
                            }}>
                              {getTextureIcon(visualAnalysis?.texture?.type)}
                            </Box>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                color: '#3E2723', 
                                fontWeight: 800, 
                                mb: 1, 
                                textTransform: 'capitalize' 
                              }}
                            >
                              {visualAnalysis?.texture?.type || '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {visualAnalysis?.texture?.description}
                            </Typography>
                            {visualAnalysis?.texture?.health_indicator && (
                              <Box sx={{ mt: 2 }}>
                                <Chip
                                  label={`Health Indicator: ${visualAnalysis.texture.health_indicator}%`}
                                  size="small"
                                  sx={{ 
                                    bgcolor: visualAnalysis.texture.health_indicator > 70 ? '#4caf50' : 
                                            visualAnalysis.texture.health_indicator > 50 ? '#ff9800' : '#f44336',
                                    color: 'white'
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={8}>
                          <Typography variant="subtitle2" sx={{ color: '#8B4513', fontWeight: 700, mb: 2 }}>
                            Texture Metrics
                          </Typography>
                          
                          {visualAnalysis?.texture?.metrics && (
                            <>
                              {[
                                { 
                                  label: 'Contrast', 
                                  value: visualAnalysis.texture.metrics.contrast,
                                  max: 100,
                                  color: '#8B4513'
                                },
                                { 
                                  label: 'Roughness', 
                                  value: visualAnalysis.texture.metrics.roughness,
                                  max: 100,
                                  color: '#8B4513'
                                },
                                { 
                                  label: 'Entropy', 
                                  value: visualAnalysis.texture.metrics.entropy,
                                  max: 8,
                                  display: val => val.toFixed(2),
                                  color: '#8B4513'
                                }
                              ].map(({ label, value, max, display, color }) => (
                                <Box key={label} sx={{ mb: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#3E2723' }}>
                                      {display ? display(value) : value}
                                    </Typography>
                                  </Box>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(100, (value / max) * 100)} 
                                    sx={{ 
                                      height: 8, 
                                      borderRadius: 99, 
                                      bgcolor: '#f5f0e6',
                                      '& .MuiLinearProgress-bar': { 
                                        bgcolor: color, 
                                        borderRadius: 99 
                                      } 
                                    }} 
                                  />
                                </Box>
                              ))}
                            </>
                          )}
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </motion.div>

                {/* Lesion Detection */}
                {visualAnalysis?.lesions && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.30 }}
                  >
                    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <WarningIcon sx={{ color: visualAnalysis.lesions.detected ? '#f44336' : '#4caf50' }} />
                        <Typography variant="h6" sx={{ color: '#3E2723', fontWeight: 700 }}>
                          Lesion Detection
                        </Typography>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Alert 
                            severity={visualAnalysis.lesions.detected ? "warning" : "success"}
                            sx={{ borderRadius: 2 }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {visualAnalysis.lesions.detected 
                                ? `${visualAnalysis.lesions.count} Lesions Detected` 
                                : 'No Lesions Detected'}
                            </Typography>
                            <Typography variant="body2">
                              {visualAnalysis.lesions.description}
                            </Typography>
                          </Alert>
                        </Grid>

                        {visualAnalysis.lesions.detected && (
                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, bgcolor: '#f5f0e6', borderRadius: 2 }}>
                              <Typography variant="subtitle2" sx={{ color: '#8B4513', fontWeight: 700, mb: 1 }}>
                                Lesion Details
                              </Typography>
                              <List dense>
                                <ListItem>
                                  <ListItemText 
                                    primary="Affected Area" 
                                    secondary={`${visualAnalysis.lesions.affected_area_percentage}% of trunk`}
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Severity" 
                                    secondary={visualAnalysis.lesions.severity}
                                  />
                                </ListItem>
                                {visualAnalysis.lesions.types?.length > 0 && (
                                  <ListItem>
                                    <ListItemText 
                                      primary="Types" 
                                      secondary={visualAnalysis.lesions.types.join(', ')}
                                    />
                                  </ListItem>
                                )}
                              </List>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* Disease Analysis Section */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                >
                  <Accordion 
                    expanded={expandedSections.disease} 
                    onChange={() => toggleSection('disease')}
                    sx={{ 
                      mb: 2, 
                      borderRadius: 3, 
                      '&:before': { display: 'none' },
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        bgcolor: '#f5f0e6', 
                        borderRadius: expandedSections.disease ? '12px 12px 0 0' : '12px',
                        '&.Mui-expanded': { minHeight: 48 }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BugReportIcon sx={{ color: '#8B4513' }} />
                        <Typography variant="h6" sx={{ color: '#3E2723', fontWeight: 700 }}>
                          Disease Analysis
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      {isHealthy ? (
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Tree is Healthy
                          </Typography>
                          <Typography variant="body2">
                            No signs of disease detected. Continue regular monitoring.
                          </Typography>
                        </Alert>
                      ) : (
                        <>
                          <Alert 
                            severity="error" 
                            sx={{ mb: 3, borderRadius: 2 }}
                            icon={<BugReportIcon />}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {disease.name} Detected
                            </Typography>
                            <Typography variant="body2">
                              Confidence: {disease.confidence}% · 
                              Severity: {disease.severity} · 
                              Urgency: {disease.urgency}
                            </Typography>
                          </Alert>

                          {disease.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 0.5 }}>
                              {disease.description}
                            </Typography>
                          )}

                          <Grid container spacing={3}>
                            {/* Symptoms */}
                            <Grid item xs={12} md={6}>
                              <Box sx={{ 
                                p: 2.5, 
                                bgcolor: '#fff3e0', 
                                borderRadius: 2, 
                                border: '1px solid #ffcc80' 
                              }}>
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    color: '#e65100', 
                                    fontWeight: 700, 
                                    mb: 1, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 0.8 
                                  }}
                                >
                                  <WarningIcon sx={{ fontSize: 16 }} /> Symptoms
                                </Typography>
                                <List dense disablePadding>
                                  {disease.symptoms?.length ? (
                                    disease.symptoms.map((s, i) => (
                                      <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                          <WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} />
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={s} 
                                          primaryTypographyProps={{ variant: 'body2' }} 
                                        />
                                      </ListItem>
                                    ))
                                  ) : (
                                    <ListItem disableGutters>
                                      <ListItemText 
                                        primary="No symptom information available" 
                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} 
                                      />
                                    </ListItem>
                                  )}
                                </List>
                              </Box>
                            </Grid>

                            {/* Treatment */}
                            <Grid item xs={12} md={6}>
                              <Box sx={{ 
                                p: 2.5, 
                                bgcolor: '#e3f2fd', 
                                borderRadius: 2, 
                                border: '1px solid #90caf9' 
                              }}>
                                <Typography 
                                  variant="subtitle2" 
                                  sx={{ 
                                    color: '#1565c0', 
                                    fontWeight: 700, 
                                    mb: 1, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 0.8 
                                  }}
                                >
                                  <HealingIcon sx={{ fontSize: 16 }} /> Treatment
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {disease.treatment || 'No treatment information available.'}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Latex Impact */}
                            {disease.latex_impact && (
                              <Grid item xs={12}>
                                <Box sx={{ 
                                  p: 2, 
                                  bgcolor: '#f1f8e9', 
                                  borderRadius: 2, 
                                  border: '1px solid #a5d6a7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}>
                                  <WaterDropIcon sx={{ color: '#2e7d32' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Latex Impact:</strong> {disease.latex_impact}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </motion.div>

              {/* Care Recommendations */}
{analysisResult.care_recommendations?.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.36 }}
  >
    <Accordion 
      expanded={expandedSections.recommendations} 
      onChange={() => toggleSection('recommendations')}
      sx={{ 
        mb: 3, 
        borderRadius: 3, 
        '&:before': { display: 'none' },
        background: 'linear-gradient(135deg, #3E2723 0%, #5D3A1A 100%)',
        color: 'white'
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
        sx={{ 
          borderRadius: expandedSections.recommendations ? '12px 12px 0 0' : '12px',
          '&.Mui-expanded': { minHeight: 48 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AgricultureIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
            Care Recommendations
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            width: 150, 
            height: 150, 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.05)' 
          }} />
          
          <List dense disablePadding>
            {analysisResult.care_recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.36 + i * 0.06 }}
              >
                <ListItem disableGutters sx={{ py: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 28, mt: 0.3 }}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: rec.priority === 'immediate' ? '#f44336' : 
                                rec.priority === 'soon' ? '#ff9800' : 
                                rec.priority === 'monitor' ? '#2196f3' : '#4caf50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>
                          {i + 1}
                        </Typography>
                      </Box>
                    </ListItemIcon>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
                          {rec.action}
                        </Typography>
                        <Chip
                          label={rec.priority}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            bgcolor: rec.priority === 'immediate' ? '#f44336' : 
                                    rec.priority === 'soon' ? '#ff9800' : 
                                    rec.priority === 'monitor' ? '#2196f3' : '#4caf50',
                            color: 'white',
                            textTransform: 'uppercase'
                          }}
                        />
                        {rec.timeframe && (
                          <Chip
                            label={rec.timeframe}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.6rem',
                              bgcolor: 'rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.9)'
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
                        {rec.description}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                {i < analysisResult.care_recommendations.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
                )}
              </motion.div>
            ))}
          </List>
          
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 2 }} />
          
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
            Based on the tree's maturity level{disease.detected ? ', detected disease,' : ''} and overall health assessment.
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  </motion.div>
)}

                {/* All Predictions */}
                {analysisResult.all_predictions && analysisResult.all_predictions.length > 0 && (
                  <Fade in={true}>
                    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#fafafa' }}>
                      <Typography variant="subtitle2" sx={{ color: '#8B4513', fontWeight: 700, mb: 1 }}>
                        All Predictions
                      </Typography>
                      <Grid container spacing={1}>
                        {analysisResult.all_predictions.map((pred, i) => (
                          <Grid item xs={6} sm={4} md={2.4} key={i}>
                            <Tooltip title={`Class ID: ${pred.class_id}`} arrow>
                              <Box sx={{ 
                                p: 1, 
                                bgcolor: i === 0 ? '#f5f0e6' : 'white',
                                borderRadius: 2,
                                border: i === 0 ? '2px solid #8B4513' : '1px solid #e0e0e0',
                                textAlign: 'center'
                              }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                  {pred.class}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {pred.confidence}%
                                </Typography>
                                {pred.severity && (
                                  <Chip 
                                    label={pred.severity}
                                    size="small"
                                    sx={{ 
                                      mt: 0.5,
                                      height: 20,
                                      fontSize: '0.6rem',
                                      bgcolor: getSeverityColor(pred.severity),
                                      color: 'white'
                                    }}
                                  />
                                )}
                              </Box>
                            </Tooltip>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Fade>
                )}

                {/* Metadata */}
                {imageMetadata && (
                  <Fade in={true}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1, flexWrap: 'wrap' }}>
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        Analysis ID: {analysisResult.analysisId} · 
                        Analyzed: {new Date(imageMetadata.analyzed_at).toLocaleString()} ·
                        File: {imageMetadata.filename} ·
                        Size: {imageMetadata.file_size_kb} KB
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </Box>

      {/* Source Chooser Dialog */}
      <Dialog 
        open={chooserOpen} 
        onClose={() => setChooserOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 4, 
            overflow: 'hidden' 
          } 
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#8B4513', 
          color: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
            Add Trunk Image
          </Typography>
          <IconButton onClick={() => setChooserOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
            How would you like to add your image?
          </Typography>
          <Grid container spacing={2} alignItems="stretch">
            {[
              {
                icon: <CloudUploadIcon sx={{ fontSize: 52, color: '#8B4513' }} />,
                label: 'Upload Image',
                sub: 'From your device',
                onClick: () => {
                  setChooserOpen(false);
                  fileInputRef.current?.click();
                }
              },
              {
                icon: <PhotoCameraIcon sx={{ fontSize: 52, color: '#8B4513' }} />,
                label: 'Take a Photo',
                sub: 'Use your camera',
                onClick: () => {
                  setChooserOpen(false);
                  setCameraOpen(true);
                }
              }
            ].map(({ icon, label, sub, onClick }) => (
              <Grid item xs={6} key={label} sx={{ display: 'flex' }}>
                <motion.div 
                  whileHover={{ scale: 1.04 }} 
                  whileTap={{ scale: 0.97 }} 
                  style={{ width: '100%' }}
                >
                  <Box 
                    onClick={onClick} 
                    sx={{
                      border: '2px dashed #8B4513',
                      borderRadius: 3,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: '#f5f0e6',
                      transition: 'all 0.2s',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      '&:hover': {
                        bgcolor: '#efe4d8',
                        borderColor: '#5D3A1A'
                      }
                    }}
                  >
                    {icon}
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#3E2723' }}>
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sub}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog 
        open={cameraOpen} 
        onClose={() => setCameraOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 4, 
            overflow: 'hidden' 
          } 
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#8B4513', 
          color: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon />
            <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
              Capture Trunk Image
            </Typography>
          </Box>
          <IconButton onClick={() => setCameraOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000', position: 'relative' }}>
          {cameraError ? (
            <Box sx={{ 
              height: 400, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              bgcolor: '#f5f5f5', 
              p: 3 
            }}>
              <ErrorIcon sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
              <Typography variant="h6" color="error">Camera Error</Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {cameraError}
              </Typography>
            </Box>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  maxHeight: 500, 
                  objectFit: 'cover', 
                  display: 'block' 
                }} 
              />
              <Box sx={{ 
                position: 'absolute', 
                inset: 0, 
                border: '4px solid #8B4513', 
                pointerEvents: 'none' 
              }} />
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
                <Typography variant="body2">Position trunk in frame and tap capture</Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          gap: 2, 
          p: 2.5, 
          bgcolor: '#f5f5f5' 
        }}>
          <Button 
            variant="contained" 
            onClick={handleFlipCamera} 
            disabled={!!cameraError} 
            startIcon={<FlipCameraIcon />}
            sx={{ 
              bgcolor: '#8B4513', 
              borderRadius: 99, 
              textTransform: 'none', 
              '&:hover': { bgcolor: '#5D3A1A' }, 
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

export default TrunksDetection;