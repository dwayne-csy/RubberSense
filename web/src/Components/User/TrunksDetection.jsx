// RubberSense/web/src/Components/User/ImageProcessing.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Science,
  Agriculture,
  LocalFlorist,
  WaterDrop,
  Assessment,
  Analytics,
  Park,
  Engineering,
  HealthAndSafety,
  Visibility,
  Download,
  AddAPhoto
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Custom styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadArea = styled(Paper)(({ theme, isdragover }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  border: '2px dashed',
  borderColor: isdragover === 'true' ? theme.palette.primary.main : theme.palette.divider,
  backgroundColor: isdragover === 'true' ? 'rgba(25, 118, 210, 0.04)' : theme.palette.background.paper,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minHeight: '350px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(25, 118, 210, 0.04)',
  },
}));

const ResultsCard = styled(Card)(({ theme, severity }) => ({
  borderLeft: `6px solid ${
    severity === 'high' ? '#f44336' :
    severity === 'medium' ? '#ff9800' :
    severity === 'low' ? '#4caf50' : '#2196f3'
  }`,
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ImagePreview = styled('img')(({ theme }) => ({
  width: '100%',
  height: '300px',
  objectFit: 'contain',
  borderRadius: theme.spacing(1),
  backgroundColor: '#f5f5f5',
}));

const ImageProcessing = () => {
  const theme = useTheme();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
      setResults(null);
    }
  };

  const validateFile = (file) => {
    if (file.size > 5 * 1024 * 1024) { // Match your multer limit (5MB)
      setError('File size must be less than 5MB');
      return false;
    }
    
    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return false;
    }
    
    return true;
  };

const handleUpload = async () => {
  if (!selectedImage) {
    setError('Please select an image first');
    return;
  }

  const formData = new FormData();
  formData.append('image', selectedImage); // This is correct - must match multer field name

  console.log('Uploading file:', selectedImage.name);
  console.log('File type:', selectedImage.type);
  console.log('File size:', selectedImage.size);

  setUploading(true);
  setScanProgress(0);
  setError('');

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
    console.log('API URL:', `${API_BASE_URL}/api/ml/process-rubber-tree`);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    const response = await axios.post(
      `${API_BASE_URL}/api/ml/process-rubber-tree`,
      formData,
      { 
        headers: { 
          'Content-Type': 'multipart/form-data' 
        }, 
        timeout: 120000 // Increased timeout to 2 minutes
      }
    );

    clearInterval(progressInterval);
    setScanProgress(100);
    
    setTimeout(() => {
      setUploading(false);
      setResults(response.data.results);
      setActiveTab('overview');
      console.log('Response received:', response.data);
      
      if (response.data.image_url) {
        console.log('Image URL:', response.data.image_url);
      }
    }, 500);

  } catch (err) {
    setUploading(false);
    setScanProgress(0);
    
    let errorMessage = 'Failed to upload image. ';
    
    if (err.code === 'ECONNABORTED') {
      errorMessage += 'Request timeout. The server is taking too long to respond.';
    } else if (err.response) {
      // Server responded with error status
      console.error('Server error response:', err.response.data);
      console.error('Status:', err.response.status);
      
      if (err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage += err.response.data;
        } else if (err.response.data.error) {
          errorMessage += typeof err.response.data.error === 'string' 
            ? err.response.data.error 
            : JSON.stringify(err.response.data.error);
        } else if (err.response.data.message) {
          errorMessage += err.response.data.message;
        } else {
          errorMessage += `Server error: ${err.response.status}`;
        }
      } else {
        errorMessage += `Server error: ${err.response.status}`;
      }
    } else if (err.request) {
      // Request was made but no response
      console.error('No response received:', err.request);
      errorMessage += 'No response from server. Please check if the backend is running.';
    } else {
      // Something else happened
      console.error('Request setup error:', err.message);
      errorMessage += err.message;
    }
    
    setError(errorMessage);
    console.error('Full error details:', err);
  }
};

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
        setError('');
        setResults(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setResults(null);
    setError('');
    setScanProgress(0);
  };

  const renderHealthStatus = (healthScore) => {
    if (healthScore >= 80) return { label: 'Excellent', color: 'success' };
    if (healthScore >= 60) return { label: 'Good', color: 'info' };
    if (healthScore >= 40) return { label: 'Fair', color: 'warning' };
    return { label: 'Poor', color: 'error' };
  };

  const renderTappabilityStatus = (status) => {
    const statusMap = {
      'Fully Tappable': { icon: <CheckCircle color="success" />, color: 'success' },
      'Conditionally Tappable': { icon: <Warning color="warning" />, color: 'warning' },
      'Not Tappable': { icon: <ErrorIcon color="error" />, color: 'error' },
    };
    return statusMap[status] || { icon: <Info color="info" />, color: 'info' };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <Agriculture fontSize="large" />
          RubberSense AI Analyzer
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upload a rubber tree image for comprehensive AI analysis
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <UploadArea
            isdragover={isDragOver.toString()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Analyzing Image...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {scanProgress}% Complete
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={scanProgress} 
                  sx={{ width: '100%', mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Detecting diseases and analyzing tree characteristics
                </Typography>
              </Box>
            ) : previewUrl ? (
              <Box sx={{ position: 'relative', width: '100%' }}>
                <ImagePreview src={previewUrl} alt="Preview" />
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                    }
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom color="text.primary">
                  Drag & Drop Image Here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  or click to browse files
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddAPhoto />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Select Image
                </Button>
                <VisuallyHiddenInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  Supports: JPG, PNG, JPEG | Max: 5MB
                </Typography>
              </>
            )}
          </UploadArea>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mt: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setError('')}
                >
                  Dismiss
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleUpload}
              disabled={!selectedImage || uploading}
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <Science />}
              sx={{ py: 1.5 }}
            >
              {uploading ? 'Processing...' : 'Start AI Analysis'}
            </Button>
            
            {selectedImage && !uploading && (
              <Button
                variant="outlined"
                onClick={handleRemoveImage}
                startIcon={<Delete />}
              >
                Clear
              </Button>
            )}
          </Box>
          
          {!uploading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Analysis may take 30-60 seconds as it uploads to Cloudinary and processes with AI.
              </Typography>
            </Alert>
          )}
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          {results ? (
            <Box>
              {/* Results Header */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light', color: 'success.dark' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircle fontSize="large" />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Analysis Complete
                      </Typography>
                      <Typography variant="body2">
                        Comprehensive analysis generated successfully
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={renderHealthStatus(results.disease_detection.health_score).label}
                    color={renderHealthStatus(results.disease_detection.health_score).color}
                    size="small"
                  />
                </Box>
              </Paper>

              {/* Tabs Navigation */}
              <Paper sx={{ mb: 3, p: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { id: 'overview', label: 'Overview', icon: <Visibility /> },
                    { id: 'health', label: 'Health', icon: <HealthAndSafety /> },
                    { id: 'productivity', label: 'Productivity', icon: <Analytics /> },
                  ].map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'contained' : 'outlined'}
                      onClick={() => setActiveTab(tab.id)}
                      startIcon={tab.icon}
                      size="small"
                    >
                      {tab.label}
                    </Button>
                  ))}
                </Box>
              </Paper>

              {/* Tab Content */}
              <Box sx={{ minHeight: 400 }}>
                {activeTab === 'overview' && (
                  <Grid container spacing={2}>
                    {/* Tree Identification */}
                    <Grid item xs={12} md={6}>
                      <ResultsCard severity="low">
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Park /> Tree Identification
                          </Typography>
                          {results.tree_identification?.types?.length > 0 ? (
                            <List dense>
                              {results.tree_identification.types.map((type, idx) => (
                                <ListItem key={idx} sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 40 }}>
                                    <LocalFlorist />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={type.type || 'Unknown'}
                                    secondary={`Confidence: ${type.confidence || '0'}%`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              No tree types identified
                            </Typography>
                          )}
                        </CardContent>
                      </ResultsCard>
                    </Grid>

                    {/* Trunk Analysis */}
                    <Grid item xs={12} md={6}>
                      <ResultsCard severity="medium">
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Engineering /> Trunk Analysis
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Age:</strong> {results.trunk_analysis?.age_estimate || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Diameter:</strong> {results.trunk_analysis?.diameter_estimate || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Bark:</strong> {results.trunk_analysis?.bark_texture || 'Unknown'} | {results.trunk_analysis?.bark_color || 'Unknown'}
                          </Typography>
                        </CardContent>
                      </ResultsCard>
                    </Grid>

                    {/* Disease Detection */}
                    <Grid item xs={12}>
                      <ResultsCard severity={results.disease_detection?.diseases?.length > 0 ? 'high' : 'low'}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HealthAndSafety /> Disease Detection
                            <Chip 
                              label={`${results.disease_detection?.diseases?.length || 0} detected`}
                              size="small"
                              color={results.disease_detection?.diseases?.length > 0 ? 'error' : 'success'}
                              sx={{ ml: 2 }}
                            />
                          </Typography>
                          
                          {results.disease_detection?.diseases?.length > 0 ? (
                            <List dense>
                              {results.disease_detection.diseases.map((disease, idx) => (
                                <ListItem key={idx} sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Warning color="warning" />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={disease.disease || 'Unknown Disease'}
                                    secondary={`Severity: ${disease.severity || 'Unknown'} | Confidence: ${disease.confidence || '0'}%`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                              <CheckCircle color="success" />
                              <Typography>No diseases detected. Tree appears healthy.</Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" gutterBottom>
                              Health Score: {(results.disease_detection?.health_score || 0)}/100
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={results.disease_detection?.health_score || 0}
                              sx={{ height: 8, borderRadius: 4 }}
                              color={
                                (results.disease_detection?.health_score || 0) >= 80 ? 'success' :
                                (results.disease_detection?.health_score || 0) >= 60 ? 'info' :
                                (results.disease_detection?.health_score || 0) >= 40 ? 'warning' : 'error'
                              }
                            />
                          </Box>
                        </CardContent>
                      </ResultsCard>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 'health' && (
                  <ResultsCard>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HealthAndSafety /> Health Assessment
                      </Typography>
                      
                      <Alert 
                        severity={
                          results.disease_detection?.overall_health === 'Healthy' ? 'success' :
                          results.disease_detection?.overall_health === 'Moderate' ? 'warning' : 'error'
                        }
                        sx={{ mb: 3 }}
                      >
                        <Typography variant="subtitle1">
                          Overall Health: <strong>{results.disease_detection?.overall_health || 'Unknown'}</strong>
                        </Typography>
                      </Alert>

                      <Typography variant="subtitle1" gutterBottom>
                        Maintenance Tips:
                      </Typography>
                      {results.productivity_status?.maintenance_tips?.length > 0 ? (
                        <List>
                          {results.productivity_status.maintenance_tips.map((tip, idx) => (
                            <ListItem key={idx} sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <CheckCircle color="success" />
                              </ListItemIcon>
                              <ListItemText primary={tip} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No specific maintenance tips available
                        </Typography>
                      )}
                    </CardContent>
                  </ResultsCard>
                )}

                {activeTab === 'productivity' && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <ResultsCard>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {renderTappabilityStatus(results.tappability_assessment?.status).icon}
                            Tappability
                          </Typography>
                          <Typography variant="h5" color="primary" gutterBottom>
                            {results.tappability_assessment?.status || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            {results.tappability_assessment?.recommendation || 'No recommendation available'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Method:</strong> {results.tappability_assessment?.suitable_tapping_method || 'Unknown'}
                          </Typography>
                        </CardContent>
                      </ResultsCard>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <ResultsCard>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WaterDrop /> Latex Quality
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: '#4CAF50' }}>
                              <WaterDrop />
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                {results.latex_quality_prediction?.quality || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Flow: {results.latex_quality_prediction?.predicted_flow || 'Unknown'}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2">
                            <strong>Expected Yield:</strong> {results.latex_quality_prediction?.expected_yield || 'Unknown'}
                          </Typography>
                        </CardContent>
                      </ResultsCard>
                    </Grid>

                    <Grid item xs={12}>
                      <ResultsCard>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Info /> Recommendations
                          </Typography>
                          {results.productivity_status?.recommendations?.length > 0 ? (
                            <List>
                              {results.productivity_status.recommendations.map((rec, idx) => (
                                <ListItem key={idx} sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Info color="info" />
                                  </ListItemIcon>
                                  <ListItemText primary={rec} />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              No specific recommendations available
                            </Typography>
                          )}
                        </CardContent>
                      </ResultsCard>
                    </Grid>
                  </Grid>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => {
                    const dataStr = JSON.stringify(results, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const link = document.createElement('a');
                    link.href = dataUri;
                    link.download = 'rubber-tree-analysis.json';
                    link.click();
                  }}
                >
                  Export Results
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRemoveImage}
                  startIcon={<Delete />}
                >
                  New Analysis
                </Button>
              </Box>
            </Box>
          ) : (
            <Paper sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Analysis Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload a rubber tree image to see detailed analysis here
                </Typography>
                {uploading && (
                  <Box sx={{ mt: 3 }}>
                    <CircularProgress size={30} sx={{ mb: 2 }} />
                    <Typography variant="caption" color="text.secondary">
                      Processing your image...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ImageProcessing;