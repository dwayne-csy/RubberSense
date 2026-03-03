// RubberSense/web/src/Components/User/AnalysisDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
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
  BugReport as BugReportIcon,
  Agriculture as AgricultureIcon,
  Timeline as TimelineIcon,
  Forest as ForestIcon,
  Grass as GrassIcon,
  WaterDrop as WaterDropIcon,
  MonetizationOn as MonetizationOnIcon,
  Factory as FactoryIcon,
  PriceCheck as PriceCheckIcon,
  BubbleChart as BubbleChartIcon,
  Biotech as BiotechIcon,
  LocalHospital as LocalHospitalIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

const AnalysisDetails = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    visual: true,
    disease: true,
    recommendations: true
  });
  
  // API Base URL - using environment variable or fallback to localhost:4001
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchAnalysis();
  }, [type, id]);

  const fetchAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint;

      switch (type) {
        case 'latex':
          endpoint = `${API_BASE_URL}/api/v1/latex/analysis/${id}`;
          break;
        case 'leaf':
          endpoint = `${API_BASE_URL}/api/v1/leaf/analysis/${id}`;
          break;
        case 'trunk':
          endpoint = `${API_BASE_URL}/api/v1/trunks/analysis/${id}`;
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAnalysis(response.data.data);
      } else {
        throw new Error('Failed to fetch analysis');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const downloadReport = () => {
    if (!analysis) return;

    const reportData = {
      ...analysis,
      generatedAt: new Date().toISOString(),
      analysisId: id,
      analysisType: type
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-analysis-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper functions for styling
  const getQualityColor = (qualityClass) => {
    switch (qualityClass?.toLowerCase()) {
      case 'high': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'low': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getQualityGradient = (qualityClass) => {
    switch (qualityClass?.toLowerCase()) {
      case 'high': return 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)';
      case 'medium': return 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)';
      case 'low': return 'linear-gradient(135deg, #b71c1c 0%, #f44336 100%)';
      default: return 'linear-gradient(135deg, #616161 0%, #9e9e9e 100%)';
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return '#4caf50';
      case 'diseased': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getHealthGradient = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
      case 'diseased': return 'linear-gradient(135deg, #f44336 0%, #b71c1c 100%)';
      default: return 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'none':
      case 'low': return '#4caf50';
      case 'moderate': return '#ff9800';
      case 'high':
      case 'severe':
      case 'critical': return '#f44336';
      default: return '#757575';
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

  const getTextureIcon = (texture) => {
    switch (texture?.toLowerCase()) {
      case 'smooth': return <SpaIcon sx={{ color: '#4caf50' }} />;
      case 'moderate': return <TextureIcon sx={{ color: '#ff9800' }} />;
      default: return <WarningIcon sx={{ color: '#f44336' }} />;
    }
  };

  if (loading) {
    return (
      <>
        <UserHeader />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f5f5f5', pt: '80px', pb: '90px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <CircularProgress size={60} thickness={4} sx={{ color: type === 'latex' ? '#2e7d32' : type === 'leaf' ? '#2e7d32' : '#8B4513' }} />
          </motion.div>
          <Typography variant="h6" sx={{ mt: 3, color: type === 'latex' ? '#2e7d32' : type === 'leaf' ? '#2e7d32' : '#8B4513', fontWeight: 500 }}>
            Loading {type.charAt(0).toUpperCase() + type.slice(1)} Analysis Details...
          </Typography>
        </Box>
        <UserFooter />
      </>
    );
  }

  if (error) {
    return (
      <>
        <UserHeader />
        <Container maxWidth="lg" sx={{ py: 4, pt: '80px', pb: '90px', minHeight: '100vh' }}>
          <Alert severity="error">{error}</Alert>
        </Container>
        <UserFooter />
      </>
    );
  }

  const getHeaderColor = () => {
    switch (type) {
      case 'latex': return '#2e7d32';
      case 'leaf': return '#2e7d32';
      case 'trunk': return '#8B4513';
      default: return '#2e7d32';
    }
  };

  const getHeaderGradient = () => {
    switch (type) {
      case 'latex': return 'linear-gradient(135deg, #00695c 0%, #2e7d32 55%, #4caf50 100%)';
      case 'leaf': return 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 55%, #388e3c 100%)';
      case 'trunk': return 'linear-gradient(135deg, #3E2723 0%, #5D3A1A 55%, #8B4513 100%)';
      default: return 'linear-gradient(135deg, #00695c 0%, #2e7d32 55%, #4caf50 100%)';
    }
  };

  return (
    <>
      <UserHeader />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pt: '80px', pb: '90px' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/analysis/history')}
            sx={{ mb: 3 }}
          >
            Back to History
          </Button>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper elevation={3} sx={{
              p: { xs: 3, md: 5 },
              mb: 4,
              background: getHeaderGradient(),
              color: 'white',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <Box sx={{ position: 'absolute', bottom: -40, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {type === 'latex' && '🧪 Latex Analysis Details'}
                  {type === 'leaf' && '🌿 Leaf Analysis Details'}
                  {type === 'trunk' && '🌳 Trunk Analysis Details'}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.85, mb: 2.5 }}>
                  Analyzed on {format(new Date(analysis.createdAt), 'MMMM dd, yyyy hh:mm a')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Analysis Complete"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.18)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                  {analysis.model_info && (
                    <Chip
                      icon={analysis.model_info.fallback ? <WarningIcon /> : <ScienceIcon />}
                      label={analysis.model_info.fallback ? 'Fallback Analysis' : 'ML Model Analysis'}
                      sx={{
                        bgcolor: analysis.model_info.fallback ? 'rgba(255,152,0,0.22)' : 'rgba(76,175,80,0.22)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Download Button */}
              <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }}>
                <Tooltip title="Download Report">
                  <IconButton
                    onClick={downloadReport}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.18)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </motion.div>

          {/* Image and Analysis Grid */}
          <Grid container spacing={3}>
            {/* Image Section */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Paper elevation={3} sx={{ p: 2, borderRadius: 4, border: `2px solid ${getHeaderColor()}` }}>
                  <img 
                    src={analysis.image?.url || analysis.imageUrl} 
                    alt="Analysis" 
                    style={{ width: '100%', borderRadius: '8px' }} 
                  />
                  {analysis.image_metadata && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        File: {analysis.image_metadata.filename} · Size: {analysis.image_metadata.file_size_kb} KB
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            </Grid>

            {/* Results Section */}
            <Grid item xs={12} md={6}>
              {/* LATEX ANALYSIS RESULTS */}
              {type === 'latex' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Quality Hero Card */}
                  <Card elevation={3} sx={{ borderRadius: 3, mb: 3, background: getQualityGradient(analysis.quality_class), color: 'white' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                        Latex Quality
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                        {analysis.quality_class || 'Unknown'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>Quality Score</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{analysis.quality_score}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={analysis.quality_score || 0}
                          sx={{
                            height: 16,
                            borderRadius: 99,
                            bgcolor: 'rgba(255,255,255,0.25)',
                            '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 99 }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Key Metrics */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Card elevation={2} sx={{ borderRadius: 2, border: `2px solid ${getHeaderColor()}`, height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <OpacityIcon sx={{ color: getHeaderColor() }} />
                            <Typography variant="body2" sx={{ color: getHeaderColor(), fontWeight: 700 }}>DRC</Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>{analysis.dry_rubber_content}%</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card elevation={2} sx={{ borderRadius: 2, border: `2px solid ${getHeaderColor()}`, height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ColorLensIcon sx={{ color: getHeaderColor() }} />
                            <Typography variant="body2" sx={{ color: getHeaderColor(), fontWeight: 700 }}>Color</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: getColorSwatch(analysis.color_analysis?.hex), border: '2px solid #e0e0e0' }} />
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{analysis.color_analysis?.name || analysis.colorScore}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Contamination */}
                  <Card elevation={2} sx={{ borderRadius: 2, mb: 2, border: `1px solid ${analysis.contamination_detected ? '#f44336' : '#4caf50'}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WarningIcon sx={{ color: analysis.contamination_detected ? '#f44336' : '#4caf50' }} />
                        <Typography variant="h6">Contamination</Typography>
                      </Box>
                      <Chip 
                        label={analysis.contamination_detected ? 'Detected' : 'None'} 
                        color={analysis.contamination_detected ? 'error' : 'success'}
                        sx={{ fontWeight: 600 }}
                      />
                      {analysis.contamination?.probability && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Probability: {analysis.contamination.probability}%
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  {/* Physical Properties */}
                  <Accordion 
                    expanded={expandedSections.visual} 
                    onChange={() => toggleSection('visual')}
                    sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BubbleChartIcon sx={{ color: getHeaderColor() }} />
                        <Typography variant="h6">Physical Properties</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><TextureIcon /></ListItemIcon>
                          <ListItemText primary="Consistency" secondary={analysis.consistency || analysis.consistencyScore} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><WarningIcon /></ListItemIcon>
                          <ListItemText primary="Impurities" secondary={`${analysis.impurities_detected?.length || 0} detected`} />
                        </ListItem>
                        {analysis.impurities && (
                          <ListItem>
                            <ListItemText 
                              secondary={analysis.impurities.description} 
                              sx={{ pl: 4 }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* Market Analysis */}
                  {analysis.market_analysis && (
                    <Card elevation={2} sx={{ borderRadius: 2, mt: 2, background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', color: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <MonetizationOnIcon />
                          <Typography variant="h6">Market Analysis</Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Price/kg</Typography>
                            <Typography variant="h5">₱{analysis.market_analysis.price_per_kg}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Value</Typography>
                            <Typography variant="h5">₱{analysis.market_analysis.estimated_total_value}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* LEAF ANALYSIS RESULTS */}
              {type === 'leaf' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Health Status Hero */}
                  <Card elevation={3} sx={{ borderRadius: 3, mb: 3, background: getHealthGradient(analysis.health_status), color: 'white' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                        Health Status
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.1, textTransform: 'capitalize' }}>
                        {analysis.health_status || 'Unknown'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>Confidence</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{analysis.confidence}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={analysis.confidence || 0}
                          sx={{
                            height: 16,
                            borderRadius: 99,
                            bgcolor: 'rgba(255,255,255,0.25)',
                            '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 99 }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Disease Info */}
                  <Card elevation={2} sx={{ borderRadius: 2, mb: 2, border: `2px solid ${analysis.disease_detected?.toLowerCase().includes('healthy') ? '#4caf50' : '#f44336'}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <BugReportIcon sx={{ color: analysis.disease_detected?.toLowerCase().includes('healthy') ? '#4caf50' : '#f44336' }} />
                        <Typography variant="h6">Disease Detection</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{analysis.disease_detected}</Typography>
                      <Chip
                        label={`Severity: ${analysis.severity}/10`}
                        sx={{ bgcolor: getSeverityColor(analysis.severity >= 7 ? 'severe' : analysis.severity >= 4 ? 'moderate' : 'low'), color: 'white', fontWeight: 600 }}
                      />
                    </CardContent>
                  </Card>

                  {/* Visual Analysis */}
                  <Accordion 
                    expanded={expandedSections.visual} 
                    onChange={() => toggleSection('visual')}
                    sx={{ borderRadius: 2, mb: 2, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ColorLensIcon sx={{ color: getHeaderColor() }} />
                        <Typography variant="h6">Visual Analysis</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                          <Box sx={{ width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 1, bgcolor: analysis.visual_metrics?.dominant_color_hex || '#4caf50', border: '2px solid #e0e0e0' }} />
                          <Typography variant="body2" fontWeight={600}>{analysis.visual_metrics?.dominant_color || 'Unknown'}</Typography>
                          <Typography variant="caption" color="text.secondary">Dominant Color</Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <List dense>
                            <ListItem>
                              <ListItemText primary="Spot Count" secondary={analysis.spots_count || 0} />
                            </ListItem>
                            <ListItem>
                              <ListItemText primary="Texture" secondary={analysis.visual_metrics?.texture || '—'} />
                            </ListItem>
                            <ListItem>
                              <ListItemText primary="Leaf Coverage" secondary={`${analysis.visual_metrics?.leaf_coverage || 0}%`} />
                            </ListItem>
                          </List>
                        </Grid>
                      </Grid>

                      {analysis.visual_metrics?.color_distribution && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Color Distribution</Typography>
                          {Object.entries(analysis.visual_metrics.color_distribution).map(([color, pct]) => (
                            <Box key={color} sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{color}</Typography>
                                <Typography variant="caption" fontWeight={600}>{pct}%</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3 }} />
                            </Box>
                          ))}
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  {/* Disease Analysis */}
                  {!analysis.health_status?.toLowerCase().includes('healthy') && (
                    <Accordion 
                      expanded={expandedSections.disease} 
                      onChange={() => toggleSection('disease')}
                      sx={{ borderRadius: 2, mb: 2, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalHospitalIcon sx={{ color: getHeaderColor() }} />
                          <Typography variant="h6">Disease Analysis</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {analysis.symptoms && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#e65100', mb: 1 }}>Symptoms</Typography>
                            <List dense>
                              {analysis.symptoms.map((s, i) => (
                                <ListItem key={i}>
                                  <ListItemIcon><WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} /></ListItemIcon>
                                  <ListItemText primary={s} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                        {analysis.causes && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#1565c0', mb: 1 }}>Causes</Typography>
                            <List dense>
                              {analysis.causes.map((c, i) => (
                                <ListItem key={i}>
                                  <ListItemIcon><InfoIcon sx={{ color: '#2196f3', fontSize: 16 }} /></ListItemIcon>
                                  <ListItemText primary={c} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Treatment & Recommendations */}
                  <Accordion 
                    expanded={expandedSections.recommendations} 
                    onChange={() => toggleSection('recommendations')}
                    sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HealingIcon sx={{ color: getHeaderColor() }} />
                        <Typography variant="h6">Treatment & Recommendations</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {analysis.treatment && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: '#2e7d32', mb: 1 }}>Treatment</Typography>
                          <List dense>
                            {analysis.treatment.map((t, i) => (
                              <ListItem key={i}>
                                <ListItemIcon><CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} /></ListItemIcon>
                                <ListItemText primary={t} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      {analysis.recommendations && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#8B4513', mb: 1 }}>Care Recommendations</Typography>
                          <List dense>
                            {analysis.recommendations.map((r, i) => (
                              <ListItem key={i}>
                                <ListItemIcon><AgricultureIcon sx={{ color: '#8B4513', fontSize: 16 }} /></ListItemIcon>
                                <ListItemText primary={r} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </motion.div>
              )}

              {/* TRUNK ANALYSIS RESULTS */}
              {type === 'trunk' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Health Score Hero */}
                  <Card elevation={3} sx={{ borderRadius: 3, mb: 3, background: `linear-gradient(135deg, ${analysis.health_score >= 80 ? '#4caf50' : analysis.health_score >= 60 ? '#ff9800' : analysis.health_score >= 40 ? '#f44336' : '#b71c1c'} 0%, ${getHeaderColor()} 100%)`, color: 'white' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                        Overall Health Score
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                        {analysis.health_score}%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, fontWeight: 600 }}>
                        {analysis.health_score >= 80 ? 'Excellent' : analysis.health_score >= 60 ? 'Good' : analysis.health_score >= 40 ? 'Fair' : 'Critical'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Card elevation={2} sx={{ borderRadius: 2, border: `2px solid ${getHeaderColor()}`, height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {analysis.maturity?.class?.toLowerCase() === 'immature' ? <GrassIcon sx={{ color: getHeaderColor() }} /> : <ForestIcon sx={{ color: getHeaderColor() }} />}
                            <Typography variant="body2" sx={{ color: getHeaderColor(), fontWeight: 700 }}>Maturity</Typography>
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>{analysis.maturity?.class || 'Unknown'}</Typography>
                          <Typography variant="caption">Confidence: {analysis.maturity?.confidence}%</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card elevation={2} sx={{ borderRadius: 2, border: `2px solid ${getHeaderColor()}`, height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TimelineIcon sx={{ color: getHeaderColor() }} />
                            <Typography variant="body2" sx={{ color: getHeaderColor(), fontWeight: 700 }}>Age</Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>{analysis.age_estimation?.estimated_years}</Typography>
                          <Typography variant="caption">years</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Primary Detection */}
                  <Card elevation={2} sx={{ borderRadius: 2, mb: 2, border: `2px solid ${analysis.primary_detection?.class === 'healthy' ? '#4caf50' : '#f44336'}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {analysis.primary_detection?.class === 'healthy' ? <CheckCircleIcon sx={{ color: '#4caf50' }} /> : <BugReportIcon sx={{ color: '#f44336' }} />}
                        <Typography variant="h6">Primary Detection</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{analysis.primary_detection?.display_name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={analysis.primary_detection?.confidence} 
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography>{analysis.primary_detection?.confidence}%</Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Visual Analysis Accordion */}
                  <Accordion 
                    expanded={expandedSections.visual} 
                    onChange={() => toggleSection('visual')}
                    sx={{ borderRadius: 2, mb: 2, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ColorLensIcon sx={{ color: getHeaderColor() }} />
                        <Typography variant="h6">Visual Analysis</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                          <Box sx={{ width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 1, bgcolor: analysis.visual_analysis?.color?.hex || '#8B4513', border: '2px solid #e0e0e0' }} />
                          <Typography variant="body2" fontWeight={600}>{analysis.visual_analysis?.color?.name || 'Unknown'}</Typography>
                          <Typography variant="caption" color="text.secondary">Dominant Color</Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <List dense>
                            <ListItem>
                              <ListItemIcon><TextureIcon /></ListItemIcon>
                              <ListItemText primary="Texture" secondary={analysis.visual_analysis?.texture?.type || '—'} />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><WaterDropIcon /></ListItemIcon>
                              <ListItemText primary="Moisture" secondary={analysis.visual_analysis?.moisture || '—'} />
                            </ListItem>
                          </List>
                        </Grid>
                      </Grid>

                      {analysis.visual_analysis?.texture?.metrics && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Texture Metrics</Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption">Contrast</Typography>
                                <Typography variant="body2" fontWeight={600}>{analysis.visual_analysis.texture.metrics.contrast}</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption">Roughness</Typography>
                                <Typography variant="body2" fontWeight={600}>{analysis.visual_analysis.texture.metrics.roughness}</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="caption">Entropy</Typography>
                                <Typography variant="body2" fontWeight={600}>{analysis.visual_analysis.texture.metrics.entropy?.toFixed(2)}</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  {/* Disease Analysis */}
                  {analysis.disease && analysis.disease.detected && (
                    <Accordion 
                      expanded={expandedSections.disease} 
                      onChange={() => toggleSection('disease')}
                      sx={{ borderRadius: 2, mb: 2, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalHospitalIcon sx={{ color: getHeaderColor() }} />
                          <Typography variant="h6">Disease Analysis</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">{analysis.disease.name}</Typography>
                          <Typography variant="caption">Severity: {analysis.disease.severity} · Urgency: {analysis.disease.urgency}</Typography>
                        </Alert>
                        {analysis.disease.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{analysis.disease.description}</Typography>
                        )}
                        {analysis.disease.symptoms && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#e65100', mb: 1 }}>Symptoms</Typography>
                            <List dense>
                              {analysis.disease.symptoms.map((s, i) => (
                                <ListItem key={i}>
                                  <ListItemIcon><WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} /></ListItemIcon>
                                  <ListItemText primary={s} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                        {analysis.disease.treatment && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#2e7d32', mb: 1 }}>Treatment</Typography>
                            <Typography variant="body2">{analysis.disease.treatment}</Typography>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Care Recommendations */}
                  {analysis.care_recommendations?.length > 0 && (
                    <Accordion 
                      expanded={expandedSections.recommendations} 
                      onChange={() => toggleSection('recommendations')}
                      sx={{ borderRadius: 2, '&:before': { display: 'none' }, background: 'linear-gradient(135deg, #3E2723 0%, #5D3A1A 100%)', color: 'white' }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AgricultureIcon />
                          <Typography variant="h6">Care Recommendations</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {analysis.care_recommendations.map((rec, i) => (
                            <ListItem key={i} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: rec.priority === 'immediate' ? '#f44336' : rec.priority === 'soon' ? '#ff9800' : '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'white' }}>{i + 1}</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>{rec.action}</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', pl: 3 }}>{rec.description}</Typography>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </motion.div>
              )}
            </Grid>
          </Grid>

          {/* All Predictions */}
          {analysis.all_predictions && analysis.all_predictions.length > 0 && (
            <Fade in={true}>
              <Paper elevation={1} sx={{ p: 2, mt: 3, borderRadius: 3, bgcolor: '#fafafa' }}>
                <Typography variant="subtitle2" sx={{ color: getHeaderColor(), fontWeight: 700, mb: 1 }}>
                  All Predictions
                </Typography>
                <Grid container spacing={1}>
                  {analysis.all_predictions.map((pred, i) => (
                    <Grid item xs={6} sm={4} md={2.4} key={i}>
                      <Box sx={{ 
                        p: 1, 
                        bgcolor: i === 0 ? '#f5f0e6' : 'white',
                        borderRadius: 2,
                        border: i === 0 ? `2px solid ${getHeaderColor()}` : '1px solid #e0e0e0',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                          {pred.class}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pred.confidence}%
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Fade>
          )}

          {/* Metadata */}
          {analysis.image_metadata && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 3, px: 1, flexWrap: 'wrap' }}>
              <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                Analysis ID: {id} · 
                Analyzed: {format(new Date(analysis.createdAt), 'MMM dd, yyyy hh:mm a')} ·
                Model: {analysis.model_info?.model_used || analysis.model_info?.model_file || 'N/A'}
              </Typography>
            </Box>
          )}
        </Container>
      </Box>
      <UserFooter />
    </>
  );
};

export default AnalysisDetails;