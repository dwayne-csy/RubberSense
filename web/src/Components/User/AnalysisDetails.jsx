// RubberSense/web/src/Components/User/AnaysisDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  LinearProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const AnalysisDetails = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  
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

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch analysis');

      const result = await response.json();
      setAnalysis(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/analysis/history')}
        sx={{ mb: 3 }}
      >
        Back to History
      </Button>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          {type.charAt(0).toUpperCase() + type.slice(1)} Analysis Details
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Analyzed on {format(new Date(analysis.createdAt), 'MMMM dd, yyyy hh:mm a')}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <img 
              src={analysis.imageUrl} 
              alt="Analysis" 
              style={{ width: '100%', borderRadius: '8px' }} 
            />
          </Grid>

          <Grid item xs={12} md={6}>
            {type === 'latex' && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Latex Analysis Results</Typography>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Quality Class</Typography>
                    <Chip 
                      label={analysis.qualityClass} 
                      color={
                        analysis.qualityClass === 'High' ? 'success' :
                        analysis.qualityClass === 'Medium' ? 'warning' : 'error'
                      }
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Quality Score</Typography>
                    <Box display="flex" alignItems="center">
                      <LinearProgress 
                        variant="determinate" 
                        value={analysis.qualityScore} 
                        sx={{ flex: 1, mr: 1, height: 10, borderRadius: 5 }}
                      />
                      <Typography>{analysis.qualityScore}%</Typography>
                    </Box>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Dry Rubber Content</Typography>
                    <Typography variant="h6">{analysis.dryRubberContent}%</Typography>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Contamination</Typography>
                    <Chip 
                      label={analysis.contaminationDetected ? 'Detected' : 'None'} 
                      color={analysis.contaminationDetected ? 'error' : 'success'}
                      size="small"
                    />
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Color Score</Typography>
                    <Typography>{analysis.colorScore}</Typography>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Consistency Score</Typography>
                    <Typography>{analysis.consistencyScore}</Typography>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Impurities Detected</Typography>
                    <Typography>{analysis.impuritiesDetected?.length || 0}</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {type === 'leaf' && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Leaf Analysis Results</Typography>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Disease Detected</Typography>
                    <Chip 
                      label={analysis.diseaseDetected} 
                      color={analysis.diseaseDetected?.toLowerCase().includes('healthy') ? 'success' : 'warning'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Confidence</Typography>
                    <Box display="flex" alignItems="center">
                      <LinearProgress 
                        variant="determinate" 
                        value={analysis.confidence} 
                        sx={{ flex: 1, mr: 1, height: 10, borderRadius: 5 }}
                      />
                      <Typography>{analysis.confidence}%</Typography>
                    </Box>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Severity</Typography>
                    <Typography>{analysis.severity}/10</Typography>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Spots Count</Typography>
                    <Typography>{analysis.spotsCount}</Typography>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Treatment Recommendations</Typography>
                    <ul>
                      {analysis.treatmentRecommendations?.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </Box>
                </CardContent>
              </Card>
            )}

            {type === 'trunk' && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Trunk Analysis Results</Typography>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Primary Detection</Typography>
                    <Chip 
                      label={analysis.primaryDetection?.display_name || analysis.primaryDetection?.class} 
                      color={
                        analysis.primaryDetection?.class === 'healthy' ? 'success' :
                        analysis.primaryDetection?.class?.includes('pest') ? 'error' : 'warning'
                      }
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Confidence</Typography>
                    <Box display="flex" alignItems="center">
                      <LinearProgress 
                        variant="determinate" 
                        value={analysis.primaryDetection?.confidence} 
                        sx={{ flex: 1, mr: 1, height: 10, borderRadius: 5 }}
                      />
                      <Typography>{analysis.primaryDetection?.confidence}%</Typography>
                    </Box>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Health Score</Typography>
                    <Box display="flex" alignItems="center">
                      <LinearProgress 
                        variant="determinate" 
                        value={analysis.healthScore} 
                        sx={{ flex: 1, mr: 1, height: 10, borderRadius: 5 }}
                      />
                      <Typography>{analysis.healthScore}%</Typography>
                    </Box>
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Maturity</Typography>
                    <Chip 
                      label={analysis.maturity?.class} 
                      size="small"
                      color={analysis.maturity?.class === 'Mature' ? 'primary' : 'default'}
                    />
                  </Box>
                  <Box my={2}>
                    <Typography variant="body2" color="textSecondary">Age Estimate</Typography>
                    <Typography>{analysis.ageEstimate} years</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AnalysisDetails;