import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Grid,
  Zoom,
  Fade,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  LocalFlorist as LeafIcon,
  Spa as LatexIcon,
  Nature as TrunkIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import LeftNavigationBar from '../layouts/LeftNavigationBar';
import { exportRowsToPdf } from '../../utils/pdfExport';

const AnalysisLog = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // State
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    userId: '',
    search: '',
    startDate: null,
    endDate: null,
    sortBy: 'createdAt',
    order: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (!response.data.success) {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate, API_BASE_URL]);

  // Fetch analyses - UPDATED: removed /analyses from endpoint
  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined
      };

      const response = await axios.get(`${API_BASE_URL}/api/v1/admin`, { params });
      
      console.log('API Response:', response.data);
      
      setAnalyses(response.data.data);
      setTotalCount(response.data.pagination.total);
    } catch (error) {
      console.error('Fetch error:', error);
      enqueueSnackbar('Error fetching analyses: ' + (error.response?.data?.message || error.message), {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchAnalyses();
    }
  }, [page, rowsPerPage, filters, authLoading]);

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      userId: '',
      search: '',
      startDate: null,
      endDate: null,
      sortBy: 'createdAt',
      order: 'desc'
    });
    setPage(0);
  };

  const handleViewDetails = (analysis) => {
    setSelectedAnalysis(analysis);
    setDetailsOpen(true);
  };

  const handleDeleteClick = (analysis) => {
    setSelectedAnalysis(analysis);
    setDeleteDialogOpen(true);
  };

  // Delete analysis - UPDATED: removed /analyses from endpoint
  const handleDeleteConfirm = async () => {
    if (!selectedAnalysis) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/admin/${selectedAnalysis.analysisType}/${selectedAnalysis._id}`);
      
      enqueueSnackbar('Analysis deleted successfully', { variant: 'success' });
      fetchAnalyses();
      setDeleteDialogOpen(false);
      setSelectedAnalysis(null);
    } catch (error) {
      enqueueSnackbar('Error deleting analysis: ' + (error.response?.data?.message || error.message), {
        variant: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export - UPDATED: removed /analyses from endpoint
  const handleExport = async (format) => {
    try {
      const params = {
        format,
        ...filters,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined
      };

      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/export`, {
        params,
        responseType: format === 'csv' ? 'text' : 'json'
      });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rubbersense-export-${Date.now()}.csv`;
        a.click();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rubbersense-export-${Date.now()}.json`;
        a.click();
      }

      enqueueSnackbar('Export successful', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error exporting data: ' + (error.response?.data?.message || error.message), {
        variant: 'error'
      });
    }
  };

  const handleExportPdf = () => {
    if (!analyses.length) {
      enqueueSnackbar('No analysis records available to export', { variant: 'error' });
      return;
    }

    try {
      setExportingPdf(true);
      const now = new Date();
      exportRowsToPdf({
        title: 'RubberSense - Analysis Logs',
        subtitleLines: [
          `Generated: ${now.toLocaleString()}`,
          `Type: ${filters.type || 'all'} | Search: ${filters.search || 'None'} | Sort: ${filters.sortBy} ${filters.order}`,
          `Page: ${page + 1} | Records in view: ${analyses.length}`,
        ],
        headers: ['Type', 'User', 'Email', 'Date', 'Result', 'Detail', 'Confidence'],
        rows: analyses.map((analysis) => {
          const resultLabel = analysis.analysisType === 'latex'
            ? analysis.resultSummary?.qualityClass || 'Unknown'
            : analysis.analysisType === 'leaf'
              ? analysis.resultSummary?.severityLevel || 'Unknown'
              : `Health: ${analysis.resultSummary?.healthScore || 0}%`;

          return [
            analysis.displayName || analysis.analysisType?.toUpperCase() || 'N/A',
            analysis.userId?.name || 'Unknown',
            analysis.userId?.email || 'N/A',
            analysis.createdAt ? format(new Date(analysis.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A',
            resultLabel,
            getDetailValue(analysis),
            analysis.confidence ? `${Math.round(analysis.confidence)}%` : 'N/A',
          ];
        }),
        fileName: `analysis-logs-${now.toISOString().slice(0, 10)}.pdf`,
      });
      enqueueSnackbar('Analysis logs exported to PDF', { variant: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      enqueueSnackbar('Failed to export PDF: ' + (error.message || 'Unknown error'), { variant: 'error' });
    } finally {
      setExportingPdf(false);
    }
  };

  // Helper functions
  const getAnalysisIcon = (type) => {
    switch (type) {
      case 'latex':
        return <LatexIcon sx={{ color: theme.palette.primary.main }} />;
      case 'leaf':
        return <LeafIcon sx={{ color: theme.palette.success.main }} />;
      case 'trunk':
        return <TrunkIcon sx={{ color: theme.palette.warning.main }} />;
      default:
        return null;
    }
  };

  const getAnalysisColor = (type) => {
    switch (type) {
      case 'latex': return 'primary';
      case 'leaf': return 'success';
      case 'trunk': return 'warning';
      default: return 'default';
    }
  };

  const getResultChip = (analysis) => {
    if (analysis.analysisType === 'latex') {
      const quality = analysis.resultSummary?.qualityClass;
      const color = quality === 'High' ? 'success' : quality === 'Medium' ? 'warning' : 'error';
      return <Chip size="small" label={quality || 'Unknown'} color={color} />;
    } else if (analysis.analysisType === 'leaf') {
      const severity = analysis.resultSummary?.severityLevel;
      const color = severity === 'Critical' ? 'error' : 
                   severity === 'High' ? 'warning' : 
                   severity === 'Medium' ? 'info' : 'success';
      return <Chip size="small" label={severity || 'Unknown'} color={color} />;
    } else {
      const health = analysis.resultSummary?.healthScore;
      const color = health >= 70 ? 'success' : health >= 40 ? 'warning' : 'error';
      return <Chip size="small" label={`Health: ${health || 0}%`} color={color} />;
    }
  };

  const getDetailValue = (analysis) => {
    if (analysis.analysisType === 'latex') {
      return `DRC: ${analysis.resultSummary?.dryRubberContent?.toFixed(1) || 'N/A'}%`;
    } else if (analysis.analysisType === 'leaf') {
      return analysis.resultSummary?.disease || 'Unknown';
    } else {
      return analysis.resultSummary?.primaryDetection?.display_name || 'Unknown';
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNavigationBar />
        <div style={{ 
          flex: 1, 
          marginLeft: '280px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <p>Loading Analysis Log...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <LeftNavigationBar />
      <div style={{ 
        flex: 1, 
        marginLeft: '280px',
        backgroundColor: '#f5f5f5'
      }}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Analysis Log
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('json')}
                sx={{ mr: 1 }}
              >
                Export JSON
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('csv')}
                sx={{ mr: 1 }}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportPdf}
                disabled={loading || exportingPdf || analyses.length === 0}
                sx={{ mr: 1 }}
              >
                {exportingPdf ? 'Exporting PDF...' : 'Export PDF'}
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchAnalyses}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search by user or result..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                sx={{ flexGrow: 1, mr: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => handleFilterChange('search', '')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </Box>

            <Fade in={showFilters}>
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Analysis Type</InputLabel>
                      <Select
                        value={filters.type}
                        label="Analysis Type"
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="latex">Latex Analysis</MenuItem>
                        <MenuItem value="leaf">Leaf Disease</MenuItem>
                        <MenuItem value="trunk">Trunk Analysis</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={filters.sortBy}
                        label="Sort By"
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      >
                        <MenuItem value="createdAt">Date</MenuItem>
                        <MenuItem value="userId">User</MenuItem>
                        <MenuItem value="analysisType">Type</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Order</InputLabel>
                      <Select
                        value={filters.order}
                        label="Order"
                        onChange={(e) => handleFilterChange('order', e.target.value)}
                      >
                        <MenuItem value="desc">Newest First</MenuItem>
                        <MenuItem value="asc">Oldest First</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={filters.startDate}
                        onChange={(date) => handleFilterChange('startDate', date)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={filters.endDate}
                        onChange={(date) => handleFilterChange('endDate', date)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button onClick={clearFilters} sx={{ mr: 1 }}>
                        Clear Filters
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          </Paper>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableCell>Type</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(rowsPerPage)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                    </TableRow>
                  ))
                ) : analyses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No analyses found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  analyses.map((analysis) => (
                    <TableRow key={analysis._id} hover>
                      <TableCell>
                        <Chip
                          icon={getAnalysisIcon(analysis.analysisType)}
                          label={analysis.displayName || analysis.analysisType.toUpperCase()}
                          size="small"
                          color={getAnalysisColor(analysis.analysisType)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                            {analysis.userId?.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{analysis.userId?.name || 'Unknown'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {analysis.userId?.email || ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(analysis.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(analysis.createdAt), 'hh:mm a')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getResultChip(analysis)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {getDetailValue(analysis)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(analysis)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(analysis)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </TableContainer>

          {/* Details Dialog */}
          <Dialog
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            maxWidth="md"
            fullWidth
            TransitionComponent={Zoom}
          >
            {selectedAnalysis && (
              <>
                <DialogTitle>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getAnalysisIcon(selectedAnalysis.analysisType)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {selectedAnalysis.displayName || 'Analysis Details'}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => setDetailsOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </DialogTitle>
                <DialogContent dividers>
                  <Grid container spacing={3}>
                    {/* User Info */}
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            User Information
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
                              {selectedAnalysis.userId?.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                {selectedAnalysis.userId?.name || 'Unknown User'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedAnalysis.userId?.email || 'No email'}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Image */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Analysis Image
                          </Typography>
                          <Box
                            sx={{
                              width: '100%',
                              height: 200,
                              backgroundColor: theme.palette.grey[100],
                              borderRadius: 1,
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {selectedAnalysis.imageUrl ? (
                              <img
                                src={selectedAnalysis.imageUrl}
                                alt="Analysis"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <ImageIcon sx={{ fontSize: 48, color: theme.palette.grey[400] }} />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Analysis Results */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Analysis Results
                          </Typography>
                          
                          {selectedAnalysis.analysisType === 'latex' && (
                            <>
                              <Typography variant="body2">
                                Quality Class: <strong>{selectedAnalysis.qualityClass || 'Unknown'}</strong>
                              </Typography>
                              <Typography variant="body2">
                                Quality Score: <strong>{selectedAnalysis.qualityScore?.toFixed(1) || 0}%</strong>
                              </Typography>
                              <Typography variant="body2">
                                Dry Rubber Content: <strong>{selectedAnalysis.dryRubberContent?.toFixed(1) || 0}%</strong>
                              </Typography>
                              <Typography variant="body2">
                                Contamination: <strong>{selectedAnalysis.contaminationDetected ? 'Yes' : 'No'}</strong>
                              </Typography>
                              {selectedAnalysis.impuritiesDetected?.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Impurities:
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                    {selectedAnalysis.impuritiesDetected.map((impurity, i) => (
                                      <Chip key={i} label={impurity} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </>
                          )}

                          {selectedAnalysis.analysisType === 'leaf' && (
                            <>
                              <Typography variant="body2">
                                Disease: <strong>{selectedAnalysis.diseaseDetected || 'Unknown'}</strong>
                              </Typography>
                              <Typography variant="body2">
                                Confidence: <strong>{selectedAnalysis.confidence?.toFixed(1) || 0}%</strong>
                              </Typography>
                              <Typography variant="body2">
                                Severity: <strong>{selectedAnalysis.severityLevel} ({selectedAnalysis.severity?.toFixed(1)}%)</strong>
                              </Typography>
                              <Typography variant="body2">
                                Spots Detected: <strong>{selectedAnalysis.spotsCount || 0}</strong>
                              </Typography>
                              {selectedAnalysis.treatmentRecommendations?.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Recommendations:
                                  </Typography>
                                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                    {selectedAnalysis.treatmentRecommendations.map((rec, i) => (
                                      <li key={i}>
                                        <Typography variant="caption">{rec}</Typography>
                                      </li>
                                    ))}
                                  </ul>
                                </Box>
                              )}
                            </>
                          )}

                          {selectedAnalysis.analysisType === 'trunk' && (
                            <>
                              <Typography variant="body2">
                                Detection: <strong>{selectedAnalysis.primaryDetection?.display_name || 'Unknown'}</strong>
                              </Typography>
                              <Typography variant="body2">
                                Confidence: <strong>{selectedAnalysis.primaryDetection?.confidence?.toFixed(1) || 0}%</strong>
                              </Typography>
                              <Typography variant="body2">
                                Health Score: <strong>{selectedAnalysis.healthScore?.toFixed(1) || 0}%</strong>
                              </Typography>
                              <Typography variant="body2">
                                Maturity: <strong>{selectedAnalysis.maturity?.class || 'Unknown'}</strong>
                              </Typography>
                              {selectedAnalysis.maturity?.confidence && (
                                <Typography variant="body2">
                                  Maturity Confidence: <strong>{selectedAnalysis.maturity.confidence?.toFixed(1)}%</strong>
                                </Typography>
                              )}
                              {selectedAnalysis.careRecommendations?.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Recommendations:
                                  </Typography>
                                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                    {selectedAnalysis.careRecommendations.map((rec, i) => (
                                      <li key={i}>
                                        <Typography variant="caption">
                                          {rec.action || rec.description || JSON.stringify(rec)}
                                        </Typography>
                                      </li>
                                    ))}
                                  </ul>
                                </Box>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Metadata */}
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Metadata
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Analysis ID:
                              </Typography>
                              <Typography variant="body2">{selectedAnalysis._id}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Created:
                              </Typography>
                              <Typography variant="body2">
                                {format(new Date(selectedAnalysis.createdAt), 'MMMM dd, yyyy hh:mm:ss a')}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Processing Time:
                              </Typography>
                              <Typography variant="body2">{selectedAnalysis.processingTime || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                ML Model Used:
                              </Typography>
                              <Typography variant="body2">{selectedAnalysis.mlModelUsed ? 'Yes' : 'No'}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this analysis? This action cannot be undone.
              </Typography>
              {selectedAnalysis && (
                <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedAnalysis.displayName || selectedAnalysis.analysisType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {format(new Date(selectedAnalysis.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>User:</strong> {selectedAnalysis.userId?.name || 'Unknown'}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleDeleteConfirm}
                color="error"
                variant="contained"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </div>
    </div>
  );
};

export default AnalysisLog;
