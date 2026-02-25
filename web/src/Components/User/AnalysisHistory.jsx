// RubberSense/web/src/Components/User/AnaysisHistory.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Badge,
  Avatar,
  LinearProgress,
  Stack,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  Science as ScienceIcon,
  Park as ParkIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// API Base URL - using environment variable or fallback to localhost:4001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const AnalysisImage = styled('img')({
  width: '60px',
  height: '60px',
  objectFit: 'cover',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)'
  }
});

const StatusChip = styled(Chip)(({ theme, status }) => {
  const colors = {
    high: { bg: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main },
    medium: { bg: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main },
    low: { bg: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main },
    healthy: { bg: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main },
    diseased: { bg: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }
  };
  const colorSet = colors[status] || colors.medium;
  
  return {
    backgroundColor: colorSet.bg,
    color: colorSet.color,
    fontWeight: 600,
    '& .MuiChip-label': {
      px: 2
    }
  };
});

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AnalysisHistory = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [latexData, setLatexData] = useState([]);
  const [leafData, setLeafData] = useState([]);
  const [trunkData, setTrunkData] = useState([]);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    latex: { qualityClass: '', startDate: '', endDate: '' },
    leaf: { disease: '', severity: '', startDate: '', endDate: '' },
    trunk: { disease: '', maturity: '', minHealthScore: '', startDate: '', endDate: '' }
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, type: null });
  const [batchDeleteDialog, setBatchDeleteDialog] = useState({ open: false, ids: [] });
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [stats, setStats] = useState({
    latex: null,
    leaf: null,
    trunk: null
  });
  
  const [imagePreview, setImagePreview] = useState({ open: false, url: '' });
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', order: 'desc' });

  // Load data based on active tab
  useEffect(() => {
    fetchData();
    fetchStats();
  }, [tabValue, page, rowsPerPage, sortConfig]);

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        sortBy: sortConfig.field,
        order: sortConfig.order,
        ...getFiltersForTab()
      });

      let endpoint;
      switch (tabValue) {
        case 0:
          endpoint = `${API_BASE_URL}/api/v1/latex/history?${queryParams}`;
          break;
        case 1:
          endpoint = `${API_BASE_URL}/api/v1/leaf/history?${queryParams}`;
          break;
        case 2:
          endpoint = `${API_BASE_URL}/api/v1/trunks/history?${queryParams}`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      
      switch (tabValue) {
        case 0:
          setLatexData(result.data || []);
          setTotalCount(result.pagination?.total || 0);
          break;
        case 1:
          setLeafData(result.data || []);
          setTotalCount(result.pagination?.total || 0);
          break;
        case 2:
          setTrunkData(result.data || []);
          setTotalCount(result.pagination?.total || 0);
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [latexStats, leafStats, trunkStats] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/latex/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${API_BASE_URL}/api/v1/leaf/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${API_BASE_URL}/api/v1/trunks/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ]);

      setStats({
        latex: latexStats.data,
        leaf: leafStats.data,
        trunk: trunkStats.data
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Get filters for current tab
  const getFiltersForTab = () => {
    switch (tabValue) {
      case 0:
        return {
          ...(filters.latex.qualityClass && { qualityClass: filters.latex.qualityClass }),
          ...(filters.latex.startDate && { startDate: filters.latex.startDate }),
          ...(filters.latex.endDate && { endDate: filters.latex.endDate })
        };
      case 1:
        return {
          ...(filters.leaf.disease && { disease: filters.leaf.disease }),
          ...(filters.leaf.severity && { severity: filters.leaf.severity }),
          ...(filters.leaf.startDate && { startDate: filters.leaf.startDate }),
          ...(filters.leaf.endDate && { endDate: filters.leaf.endDate })
        };
      case 2:
        return {
          ...(filters.trunk.disease && { disease: filters.trunk.disease }),
          ...(filters.trunk.maturity && { maturity: filters.trunk.maturity }),
          ...(filters.trunk.minHealthScore && { minHealthScore: filters.trunk.minHealthScore }),
          ...(filters.trunk.startDate && { startDate: filters.trunk.startDate }),
          ...(filters.trunk.endDate && { endDate: filters.trunk.endDate })
        };
      default:
        return {};
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint;
      
      switch (deleteDialog.type) {
        case 0:
          endpoint = `${API_BASE_URL}/api/v1/latex/history/${deleteDialog.id}`;
          break;
        case 1:
          endpoint = `${API_BASE_URL}/api/v1/leaf/history/${deleteDialog.id}`;
          break;
        case 2:
          endpoint = `${API_BASE_URL}/api/v1/trunks/analysis/${deleteDialog.id}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete analysis');

      setSuccess('Analysis deleted successfully');
      fetchData();
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteDialog({ open: false, id: null, type: null });
    }
  };

  // Handle batch delete
  const handleBatchDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint;
      
      switch (tabValue) {
        case 0:
          endpoint = `${API_BASE_URL}/api/v1/latex/history/batch`;
          break;
        case 1:
          endpoint = `${API_BASE_URL}/api/v1/leaf/history/batch`;
          break;
        case 2:
          endpoint = `${API_BASE_URL}/api/v1/trunks/history/batch`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysisIds: batchDeleteDialog.ids })
      });

      if (!response.ok) throw new Error('Failed to delete analyses');

      setSuccess(`Successfully deleted ${batchDeleteDialog.ids.length} analyses`);
      setSelectedAnalyses([]);
      fetchData();
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setBatchDeleteDialog({ open: false, ids: [] });
    }
  };

  // Export data
  const handleExport = () => {
    const data = getCurrentTabData();
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${new Date().toISOString()}.csv`;
    a.click();
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).filter(key => 
      !['fullAnalysis', '__v', 'userId'].includes(key)
    ).join(',');
    
    const rows = data.map(item => 
      headers.split(',').map(key => 
        JSON.stringify(item[key] || '').replace(/,/g, ';')
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  };

  // Render statistics cards
  const renderStats = () => {
    const currentStats = tabValue === 0 ? stats.latex : tabValue === 1 ? stats.leaf : stats.trunk;
    
    if (!currentStats) return null;

    const metrics = tabValue === 0 ? [
      { label: 'Total Analyses', value: currentStats.summary?.totalAnalyses || 0, icon: <AssessmentIcon /> },
      { label: 'Avg Quality Score', value: `${(currentStats.summary?.avgQualityScore || 0).toFixed(1)}%`, icon: <ScienceIcon /> },
      { label: 'Avg DRC', value: `${(currentStats.summary?.avgDryRubberContent || 0).toFixed(1)}%`, icon: <TimelineIcon /> },
      { label: 'Contamination', value: currentStats.summary?.totalContaminationDetected || 0, icon: <WarningIcon /> }
    ] : tabValue === 1 ? [
      { label: 'Total Analyses', value: currentStats.summary?.totalAnalyses || 0, icon: <AssessmentIcon /> },
      { label: 'Avg Confidence', value: `${(currentStats.summary?.avgConfidence || 0).toFixed(1)}%`, icon: <ScienceIcon /> },
      { label: 'Avg Severity', value: (currentStats.summary?.avgSeverity || 0).toFixed(1), icon: <WarningIcon /> },
      { label: 'Avg Spots', value: Math.round(currentStats.summary?.avgSpotsCount || 0), icon: <ParkIcon /> }
    ] : [
      { label: 'Total Analyses', value: currentStats.summary?.totalAnalyses || 0, icon: <AssessmentIcon /> },
      { label: 'Avg Health Score', value: `${(currentStats.summary?.avgHealthScore || 0).toFixed(1)}%`, icon: <ScienceIcon /> },
      { label: 'Avg Confidence', value: `${(currentStats.summary?.avgConfidence || 0).toFixed(1)}%`, icon: <TimelineIcon /> },
      { label: 'Avg Age', value: `${Math.round(currentStats.summary?.avgAgeEstimate || 0)} years`, icon: <ParkIcon /> }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MetricCard>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {metric.label}
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="bold">
                      {metric.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                    {metric.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Get current tab data
  const getCurrentTabData = () => {
    switch (tabValue) {
      case 0: return latexData;
      case 1: return leafData;
      case 2: return trunkData;
      default: return [];
    }
  };

  // Render latex table
  const renderLatexTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
            <TableCell padding="checkbox">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAnalyses(latexData.map(d => d._id));
                  } else {
                    setSelectedAnalyses([]);
                  }
                }}
                checked={selectedAnalyses.length === latexData.length && latexData.length > 0}
              />
            </TableCell>
            <TableCell>Image</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Quality</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>DRC (%)</TableCell>
            <TableCell>Contamination</TableCell>
            <TableCell>Color Score</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {latexData.map((row) => (
            <TableRow key={row._id} hover>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAnalyses([...selectedAnalyses, row._id]);
                    } else {
                      setSelectedAnalyses(selectedAnalyses.filter(id => id !== row._id));
                    }
                  }}
                  checked={selectedAnalyses.includes(row._id)}
                />
              </TableCell>
              <TableCell>
                <AnalysisImage 
                  src={row.imageUrl} 
                  alt="latex"
                  onClick={() => setImagePreview({ open: true, url: row.imageUrl })}
                />
              </TableCell>
              <TableCell>{format(new Date(row.createdAt), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <StatusChip 
                  label={row.qualityClass?.toUpperCase() || 'N/A'} 
                  status={row.qualityClass?.toLowerCase()}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={row.qualityScore || 0} 
                    sx={{ 
                      width: 60, 
                      mr: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: 
                          row.qualityScore >= 70 ? theme.palette.success.main :
                          row.qualityScore >= 40 ? theme.palette.warning.main :
                          theme.palette.error.main
                      }
                    }}
                  />
                  <Typography variant="body2">{row.qualityScore || 0}%</Typography>
                </Box>
              </TableCell>
              <TableCell>{row.dryRubberContent?.toFixed(1) || 'N/A'}</TableCell>
              <TableCell>
                {row.contaminationDetected ? (
                  <Chip 
                    icon={<ErrorIcon />} 
                    label="Detected" 
                    size="small" 
                    color="error"
                    variant="outlined"
                  />
                ) : (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="None" 
                    size="small" 
                    color="success"
                    variant="outlined"
                  />
                )}
              </TableCell>
              <TableCell>{row.colorScore?.toFixed(1) || 'N/A'}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => navigate(`/analysis/latex/${row._id}`)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, id: row._id, type: 0 })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render leaf table
  const renderLeafTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
            <TableCell padding="checkbox">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAnalyses(leafData.map(d => d._id));
                  } else {
                    setSelectedAnalyses([]);
                  }
                }}
                checked={selectedAnalyses.length === leafData.length && leafData.length > 0}
              />
            </TableCell>
            <TableCell>Image</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Disease</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Spots</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leafData.map((row) => (
            <TableRow key={row._id} hover>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAnalyses([...selectedAnalyses, row._id]);
                    } else {
                      setSelectedAnalyses(selectedAnalyses.filter(id => id !== row._id));
                    }
                  }}
                  checked={selectedAnalyses.includes(row._id)}
                />
              </TableCell>
              <TableCell>
                <AnalysisImage 
                  src={row.imageUrl} 
                  alt="leaf"
                  onClick={() => setImagePreview({ open: true, url: row.imageUrl })}
                />
              </TableCell>
              <TableCell>{format(new Date(row.createdAt), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <Chip 
                  label={row.diseaseDetected || 'Unknown'} 
                  size="small"
                  color={row.diseaseDetected?.toLowerCase().includes('healthy') ? 'success' : 'warning'}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={row.confidence || 0} 
                    sx={{ width: 60, mr: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2">{row.confidence?.toFixed(1) || 0}%</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={row.severity?.toFixed(1) || 'N/A'} 
                  size="small"
                  color={
                    row.severity >= 7 ? 'error' :
                    row.severity >= 4 ? 'warning' : 'success'
                  }
                />
              </TableCell>
              <TableCell>{row.spotsCount || 0}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => navigate(`/analysis/leaf/${row._id}`)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, id: row._id, type: 1 })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render trunk table
  const renderTrunkTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
            <TableCell padding="checkbox">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAnalyses(trunkData.map(d => d._id));
                  } else {
                    setSelectedAnalyses([]);
                  }
                }}
                checked={selectedAnalyses.length === trunkData.length && trunkData.length > 0}
              />
            </TableCell>
            <TableCell>Image</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Detection</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Health Score</TableCell>
            <TableCell>Maturity</TableCell>
            <TableCell>Age</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trunkData.map((row) => (
            <TableRow key={row._id} hover>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAnalyses([...selectedAnalyses, row._id]);
                    } else {
                      setSelectedAnalyses(selectedAnalyses.filter(id => id !== row._id));
                    }
                  }}
                  checked={selectedAnalyses.includes(row._id)}
                />
              </TableCell>
              <TableCell>
                <AnalysisImage 
                  src={row.imageUrl} 
                  alt="trunk"
                  onClick={() => setImagePreview({ open: true, url: row.imageUrl })}
                />
              </TableCell>
              <TableCell>{format(new Date(row.createdAt), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <Chip 
                  label={row.primaryDetection?.display_name || row.primaryDetection?.class || 'Unknown'} 
                  size="small"
                  color={
                    row.primaryDetection?.class === 'healthy' ? 'success' :
                    row.primaryDetection?.class?.includes('pest') ? 'error' : 'warning'
                  }
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={row.primaryDetection?.confidence || 0} 
                    sx={{ width: 60, mr: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2">{row.primaryDetection?.confidence?.toFixed(1) || 0}%</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={row.healthScore || 0} 
                    sx={{ 
                      width: 60, 
                      mr: 1, 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: 
                          row.healthScore >= 70 ? theme.palette.success.main :
                          row.healthScore >= 40 ? theme.palette.warning.main :
                          theme.palette.error.main
                      }
                    }}
                  />
                  <Typography variant="body2">{row.healthScore || 0}%</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={row.maturity?.class || 'Unknown'} 
                  size="small"
                  color={row.maturity?.class === 'Mature' ? 'primary' : 'default'}
                />
              </TableCell>
              <TableCell>{row.ageEstimate || 'N/A'}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => navigate(`/analysis/trunk/${row._id}`)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, id: row._id, type: 2 })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Analysis History
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and manage your rubber tree analysis history
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={handleExport} sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          {selectedAnalyses.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setBatchDeleteDialog({ open: true, ids: selectedAnalyses })}
            >
              Delete Selected ({selectedAnalyses.length})
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <StyledPaper>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => {
            setTabValue(v);
            setPage(0);
            setSelectedAnalyses([]);
          }}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<ScienceIcon />} 
            label="LATEX ANALYSIS" 
            iconPosition="start"
          />
          <Tab 
            icon={<ParkIcon />} 
            label="LEAF ANALYSIS" 
            iconPosition="start"
          />
          <Tab 
            icon={<TimelineIcon />} 
            label="TRUNK ANALYSIS" 
            iconPosition="start"
          />
        </Tabs>

        {/* Filter Toggle */}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            variant="outlined"
            size="small"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        {/* Filters */}
        {showFilters && (
          <Box mt={2} p={2} bgcolor={alpha(theme.palette.primary.main, 0.02)} borderRadius={2}>
            <Grid container spacing={2} alignItems="center">
              {tabValue === 0 && (
                <>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Quality Class</InputLabel>
                      <Select
                        value={filters.latex.qualityClass}
                        onChange={(e) => setFilters({
                          ...filters,
                          latex: { ...filters.latex, qualityClass: e.target.value }
                        })}
                        label="Quality Class"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {tabValue === 1 && (
                <>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Disease"
                      value={filters.leaf.disease}
                      onChange={(e) => setFilters({
                        ...filters,
                        leaf: { ...filters.leaf, disease: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Severity</InputLabel>
                      <Select
                        value={filters.leaf.severity}
                        onChange={(e) => setFilters({
                          ...filters,
                          leaf: { ...filters.leaf, severity: e.target.value }
                        })}
                        label="Severity"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {tabValue === 2 && (
                <>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Disease"
                      value={filters.trunk.disease}
                      onChange={(e) => setFilters({
                        ...filters,
                        trunk: { ...filters.trunk, disease: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Maturity</InputLabel>
                      <Select
                        value={filters.trunk.maturity}
                        onChange={(e) => setFilters({
                          ...filters,
                          trunk: { ...filters.trunk, maturity: e.target.value }
                        })}
                        label="Maturity"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Immature">Immature</MenuItem>
                        <MenuItem value="Mature">Mature</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Min Health Score"
                      value={filters.trunk.minHealthScore}
                      onChange={(e) => setFilters({
                        ...filters,
                        trunk: { ...filters.trunk, minHealthScore: e.target.value }
                      })}
                      InputProps={{ inputProps: { min: 0, max: 100 } }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={filters[tabValue === 0 ? 'latex' : tabValue === 1 ? 'leaf' : 'trunk'].startDate}
                  onChange={(e) => {
                    const type = tabValue === 0 ? 'latex' : tabValue === 1 ? 'leaf' : 'trunk';
                    setFilters({
                      ...filters,
                      [type]: { ...filters[type], startDate: e.target.value }
                    });
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={filters[tabValue === 0 ? 'latex' : tabValue === 1 ? 'leaf' : 'trunk'].endDate}
                  onChange={(e) => {
                    const type = tabValue === 0 ? 'latex' : tabValue === 1 ? 'leaf' : 'trunk';
                    setFilters({
                      ...filters,
                      [type]: { ...filters[type], endDate: e.target.value }
                    });
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={fetchData}
                  disabled={loading}
                >
                  Apply Filters
                </Button>
                <Button
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    const type = tabValue === 0 ? 'latex' : tabValue === 1 ? 'leaf' : 'trunk';
                    setFilters({
                      ...filters,
                      [type]: { qualityClass: '', disease: '', severity: '', maturity: '', minHealthScore: '', startDate: '', endDate: '' }
                    });
                  }}
                  sx={{ ml: 1 }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </StyledPaper>

      {/* Statistics */}
      {renderStats()}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success State */}
      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      )}

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderLatexTable()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderLeafTable()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderTrunkTable()}
      </TabPanel>

      {/* Pagination */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, type: null })}
      >
        <DialogTitle>Delete Analysis</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this analysis? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null, type: null })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog
        open={batchDeleteDialog.open}
        onClose={() => setBatchDeleteDialog({ open: false, ids: [] })}
      >
        <DialogTitle>Delete Multiple Analyses</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {batchDeleteDialog.ids.length} selected analyses? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDeleteDialog({ open: false, ids: [] })}>
            Cancel
          </Button>
          <Button onClick={handleBatchDelete} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreview.open}
        onClose={() => setImagePreview({ open: false, url: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <img 
            src={imagePreview.url} 
            alt="Preview" 
            style={{ width: '100%', height: 'auto', borderRadius: '8px' }} 
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AnalysisHistory;