import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  Divider,
  Badge,
  Modal,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Warning,
  Delete,
  Refresh,
  FilterList,
  Search,
  Person,
  PostAdd,
  Comment as CommentIcon,
  Chat as ChatIcon, // Added for message type
  Report,
  Done,
  Clear,
  Edit,
  MoreVert,
  OpenInNew,
  Image,
  VideoLibrary,
  ThumbUp,
  ChatBubble,
  Share,
  Flag,
  Close,
  ArrowBack,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import the LeftNavigationBar component
import LeftNavigationBar from '../layouts/LeftNavigationBar';

const UserReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openResolveDialog, setOpenResolveDialog] = useState(false);
  const [openPostModal, setOpenPostModal] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0
  });
  const [contentLoading, setContentLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
  const navigate = useNavigate();

  // Configure axios
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = API_BASE_URL;
  }, [API_BASE_URL]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Determine which endpoint to call based on current tab
      let endpoint = '/api/v1/admin/reports';
      
      if (currentTab === 1) { // Pending tab
        endpoint = '/api/v1/admin/reports/pending';
      } else if (currentTab === 2) { // Resolved tab
        endpoint = '/api/v1/admin/reports/resolved';
      }
      
      const response = await axios.get(endpoint, {
        params: {
          page: 1,
          limit: 100,
          type: typeFilter !== 'all' ? typeFilter : '',
          search: searchTerm
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setReports(response.data.data);
        // Only calculate stats if we're on the "All Reports" tab
        if (currentTab === 0) {
          calculateStats(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch reports. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.get('/api/v1/admin/reports/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Only show total, pending, and resolved stats
        setStats({
          total: response.data.data.total || 0,
          pending: response.data.data.pending || 0,
          resolved: response.data.data.resolved || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const calculateStats = (reportsData) => {
    const stats = {
      total: reportsData.length,
      pending: reportsData.filter(r => r.status === 'pending').length,
      resolved: reportsData.filter(r => r.status === 'resolved').length
    };
    setStats(stats);
  };

  const fetchPostDetails = async (postId) => {
    try {
      setContentLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.get(`/api/v1/admin/reports/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching post details:', error);
      console.error('Error details:', {
        url: `/api/v1/admin/reports/posts/${postId}`,
        status: error.response?.status,
        message: error.response?.data?.message
      });
      
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch post details',
        severity: 'error'
      });
      return null;
    } finally {
      setContentLoading(false);
    }
  };

  // Function to fetch comment details with media
  const fetchCommentDetails = async (commentId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.get(`/api/v1/admin/reports/comments/${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching comment details:', error);
      console.error('Error details:', {
        url: `/api/v1/admin/reports/comments/${commentId}`,
        status: error.response?.status,
        message: error.response?.data?.message
      });
      return null;
    }
  };

  // Function to fetch message details
  const fetchMessageDetails = async (messageId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.get(`/api/v1/admin/reports/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching message details:', error);
      return null;
    }
  };

  // Helper function to render media with type support
  const renderMedia = (media, type = 'post') => {
    if (!media || media.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: '#666', mb: 2 }}>
          <Image sx={{ verticalAlign: 'middle', mr: 1 }} />
          {type === 'comment' ? 'Comment Media' : 'Post Media'} ({media.length})
        </Typography>
        <Grid container spacing={1}>
          {media.map((item, index) => (
            <Grid item xs={6} md={4} key={index}>
              <Card>
                {item.mimetype?.startsWith('image/') ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={`${API_BASE_URL}${item.url}`}
                    alt={`${type} media ${index + 1}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => window.open(`${API_BASE_URL}${item.url}`, '_blank')}
                  />
                ) : item.mimetype?.startsWith('video/') ? (
                  <CardMedia
                    component="video"
                    height="140"
                    src={`${API_BASE_URL}${item.url}`}
                    controls
                    sx={{ maxHeight: 140 }}
                  />
                ) : (
                  <CardContent>
                    <Typography variant="caption">
                      {type === 'comment' ? 'Comment' : 'Post'} media: {item.mimetype || 'Unknown type'}
                    </Typography>
                  </CardContent>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [currentTab, typeFilter]);

  useEffect(() => {
    // Refresh stats when reports change
    if (currentTab === 0) {
      calculateStats(reports);
    }
  }, [reports, currentTab]);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setOpenDialog(true);
  };

  const handleViewPost = async (report) => {
    try {
      setContentLoading(true);
      
      if (report.reportedItemType === 'post') {
        // For post reports, fetch the post with all comments
        const postDetails = await fetchPostDetails(report.reportedItemId);
        if (postDetails) {
          const enhancedPost = {
            ...postDetails,
            reportId: report._id,
            reportReason: report.reason,
            reportDescription: report.description,
            reporter: report.reporter,
            reportStatus: report.status,
            isReportedContent: true,
            reportedItemId: report.reportedItemId
          };
          
          setViewingPost(enhancedPost);
        } else {
          // If we can't fetch the post, show a simplified view
          setViewingPost({
            _id: report.reportedItemId,
            title: report.reportedItem?.title || 'Post not available',
            content: report.reportedItem?.content || 'This post may have been deleted or is not accessible.',
            user: report.reportedItem?.user || { name: 'Unknown User' },
            media: [],
            comments: [],
            createdAt: report.createdAt,
            reportId: report._id,
            reportReason: report.reason,
            reportDescription: report.description,
            reporter: report.reporter,
            reportStatus: report.status,
            isReportedContent: true,
            isUnavailable: true,
            reportedItemId: report.reportedItemId
          });
        }
      } else if (report.reportedItemType === 'comment') {
        // For comment reports, fetch ONLY the reported comment details
        const commentDetails = await fetchCommentDetails(report.reportedItemId);
        
        if (commentDetails) {
          // Create a view with ONLY the reported comment
          const commentOnlyView = {
            _id: `comment-${report.reportedItemId}`,
            isCommentOnly: true,
            title: 'Reported Comment',
            content: '',
            user: { name: 'System' },
            reportedComment: {
              _id: report.reportedItemId,
              content: commentDetails.content || 'Comment not available',
              user: commentDetails.user || { name: 'Unknown User' },
              media: commentDetails.media || [],
              createdAt: commentDetails.createdAt || report.createdAt,
              isHidden: commentDetails.isHidden || false
            },
            postInfo: commentDetails.post ? {
              title: commentDetails.post.title || 'Related Post',
              id: commentDetails.post._id || commentDetails.post
            } : null,
            createdAt: report.createdAt,
            reportId: report._id,
            reportReason: report.reason,
            reportDescription: report.description,
            reporter: report.reporter,
            reportStatus: report.status,
            isReportedContent: true,
            isUnavailable: false,
            reportedCommentId: report.reportedItemId,
            reportedItemId: report.reportedItemId
          };
          
          setViewingPost(commentOnlyView);
        } else {
          // Fallback if we can't fetch comment details
          setViewingPost({
            _id: `comment-${report.reportedItemId}`,
            isCommentOnly: true,
            title: 'Reported Comment',
            content: '',
            user: { name: 'System' },
            reportedComment: {
              _id: report.reportedItemId,
              content: report.reportedItem?.content || 'Comment not available',
              user: report.reportedItem?.user || { name: 'Unknown User' },
              media: report.reportedItem?.media || [],
              createdAt: report.createdAt,
              isHidden: false
            },
            createdAt: report.createdAt,
            reportId: report._id,
            reportReason: report.reason,
            reportDescription: report.description,
            reporter: report.reporter,
            reportStatus: report.status,
            isReportedContent: true,
            isUnavailable: true,
            reportedCommentId: report.reportedItemId,
            reportedItemId: report.reportedItemId
          });
        }
      } else if (report.reportedItemType === 'message') {
        // For message reports, fetch the message details
        const messageDetails = await fetchMessageDetails(report.reportedItemId);
        
        if (messageDetails) {
          const messageView = {
            _id: `message-${report.reportedItemId}`,
            isMessageOnly: true,
            title: 'Reported Message',
            content: '',
            reportedMessage: {
              _id: report.reportedItemId,
              content: messageDetails.content || 'Message not available',
              sender: messageDetails.sender || { name: 'Unknown User' },
              recipient: messageDetails.recipient || { name: 'Unknown User' },
              createdAt: messageDetails.createdAt || report.createdAt,
              isHidden: messageDetails.isHidden || false,
              reportCount: messageDetails.reportCount || 1
            },
            createdAt: report.createdAt,
            reportId: report._id,
            reportReason: report.reason,
            reportDescription: report.description,
            reporter: report.reporter,
            reportStatus: report.status,
            isReportedContent: true,
            isUnavailable: false,
            reportedItemId: report.reportedItemId
          };
          
          setViewingPost(messageView);
        } else {
          // Fallback if we can't fetch message details
          setViewingPost({
            _id: `message-${report.reportedItemId}`,
            isMessageOnly: true,
            title: 'Reported Message',
            content: '',
            reportedMessage: {
              _id: report.reportedItemId,
              content: 'Message content unavailable',
              sender: { name: 'Unknown User' },
              recipient: { name: 'Unknown User' },
              createdAt: report.createdAt,
              isHidden: false,
              reportCount: 1
            },
            createdAt: report.createdAt,
            reportId: report._id,
            reportReason: report.reason,
            reportDescription: report.description,
            reporter: report.reporter,
            reportStatus: report.status,
            isReportedContent: true,
            isUnavailable: true,
            reportedItemId: report.reportedItemId
          });
        }
      }
      
      setOpenPostModal(true);
    } catch (error) {
      console.error('Error viewing content:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load content details',
        severity: 'error'
      });
    } finally {
      setContentLoading(false);
    }
  };

  const handleResolveReport = (report) => {
    setSelectedReport(report);
    setResolveStatus('resolved'); // Set default status to resolved
    setOpenResolveDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReport(null);
  };

  const handleClosePostModal = () => {
    setOpenPostModal(false);
    setViewingPost(null);
  };

  const handleCloseResolveDialog = () => {
    setOpenResolveDialog(false);
    setSelectedReport(null);
    setResolveStatus('');
  };

  const handleUpdateReport = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.put(
        `/api/v1/admin/reports/${selectedReport._id}`,
        {
          status: resolveStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Refresh the reports list
        fetchReports();
        fetchStats(); // Refresh stats
        
        setSnackbar({
          open: true,
          message: 'Report resolved successfully',
          severity: 'success'
        });
        
        handleCloseResolveDialog();
        handleClosePostModal();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error updating report:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to resolve report. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.delete(`/api/v1/admin/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Update local state
        setReports(prev => prev.filter(report => report._id !== reportId));
        
        setSnackbar({
          open: true,
          message: 'Report deleted successfully',
          severity: 'success'
        });
        
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete report. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleHideContent = async (report) => {
  let confirmMessage = '';
  
  // Set appropriate confirmation message based on content type
  if (report.reportedItemType === 'post') {
    confirmMessage = 'Are you sure you want to hide this post? This will hide it from all users.';
  } else if (report.reportedItemType === 'comment') {
    confirmMessage = 'Are you sure you want to hide this comment? This will hide it from all users.';
  } else if (report.reportedItemType === 'message') {
    confirmMessage = 'Are you sure you want to hide this message? This will hide it from all users in the conversation.';
  }
  
  if (!window.confirm(confirmMessage)) {
    return;
  }

  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    let endpoint;
    let data = {};
    
    if (report.reportedItemType === 'post') {
      endpoint = `/api/v1/admin/reports/posts/${report.reportedItemId}/hide`;
      data = { reason: 'admin_action' };
    } else if (report.reportedItemType === 'comment') {
      endpoint = `/api/v1/admin/reports/comments/${report.reportedItemId}/hide`;
      data = { reason: 'admin_action' };
    } else if (report.reportedItemType === 'message') {
      endpoint = `/api/v1/admin/reports/messages/${report.reportedItemId}/hide`;
      data = { reason: 'admin_action' };
    } else {
      throw new Error('Unsupported content type');
    }
    
    console.log('Hiding content:', { endpoint, data });
    
    const response = await axios.put(
      endpoint,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      // Automatically mark report as resolved after hiding content
      try {
        await handleUpdateReportStatus(report._id, 'resolved');
      } catch (statusError) {
        console.error('Error updating report status:', statusError);
      }
      
      // Show appropriate success message.
      let successMessage = '';
      if (report.reportedItemType === 'post') {
        successMessage = 'Post hidden and report resolved';
      } else if (report.reportedItemType === 'comment') {
        successMessage = 'Comment hidden and report resolved';
      } else if (report.reportedItemType === 'message') {
        successMessage = 'Message hidden from conversation and report resolved';
      }
      
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      });
      
      // Refresh data
      fetchReports();
      fetchStats();
      
      // Close modals if open
      if (openPostModal) {
        handleClosePostModal();
      }
      if (openDialog) {
        handleCloseDialog();
      }
    } else {
      setSnackbar({
        open: true,
        message: response.data.message || 'Failed to hide content',
        severity: 'error'
      });
    }
  } catch (error) {
    console.error('Error hiding content:', error);
    setSnackbar({
      open: true,
      message: error.response?.data?.message || 'Failed to hide content. Please try again.',
      severity: 'error'
    });
  }
};

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.put(
        `/api/v1/admin/reports/${reportId}`,
        {
          status: status
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        fetchReports();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      spam: 'Spam',
      harassment: 'Harassment',
      hate_speech: 'Hate Speech',
      inappropriate_content: 'Inappropriate',
      false_information: 'False Info',
      inappropriate: 'Inappropriate', // For messages
      offensive: 'Offensive', // For messages
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedItem?.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedItem?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.reportedItemType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 0) {
      setStatusFilter('all');
    } else if (newValue === 1) {
      setStatusFilter('pending');
    } else if (newValue === 2) {
      setStatusFilter('resolved');
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Left Navigation Bar */}
      <LeftNavigationBar />

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          marginLeft: '250px', // Match sidebar width
          width: 'calc(100% - 250px)'
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#228B22', fontWeight: 'bold' }}>
          User Reports Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Review and manage user-reported content. Take appropriate actions to maintain community guidelines.
        </Typography>

        {/* Stats Cards - Only show total, pending, and resolved */}
        <Grid container spacing={3} sx={{ mb: 4, mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ border: stats.pending > 0 ? '2px solid #ff9800' : 'none' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#ff9800' }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
                {stats.pending > 0 && (
                  <LinearProgress 
                    color="warning" 
                    variant="determinate" 
                    value={Math.min((stats.pending / stats.total) * 100, 100)} 
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#4caf50' }}>
                  {stats.resolved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resolved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="All Reports" />
            <Tab label="Pending" />
            <Tab label="Resolved" />
          </Tabs>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <TextField
            placeholder="Search reports..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Content Type</InputLabel>
            <Select
              value={typeFilter}
              label="Content Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="post">Posts</MenuItem>
              <MenuItem value="comment">Comments</MenuItem>
              <MenuItem value="message">Messages</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchReports}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Reports Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : filteredReports.length === 0 ? (
          <Alert severity="info">
            No reports found matching your criteria.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Reporter</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Reason</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Reported Date</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow 
                    key={report._id}
                    hover
                    sx={{ 
                      '&:hover': { backgroundColor: '#f9f9f9' },
                      backgroundColor: report.status === 'pending' ? '#fff8e1' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {report._id?.substring(0, 8) || 'N/A'}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          src={report.reporter?.profilePicture ? `${API_BASE_URL}${report.reporter.profilePicture}` : undefined}
                          sx={{ width: 30, height: 30 }}
                        >
                          {report.reporter?.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.reporter?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.reporter?.email || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          report.reportedItemType === 'post' ? <PostAdd /> : 
                          report.reportedItemType === 'comment' ? <CommentIcon /> : 
                          <ChatIcon />
                        }
                        label={
                          report.reportedItemType === 'post' ? 'Post' : 
                          report.reportedItemType === 'comment' ? 'Comment' : 
                          'Message'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getReasonLabel(report.reason)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status ? report.status.charAt(0).toUpperCase() + report.status.slice(1) : 'Unknown'}
                        color={getStatusColor(report.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(report.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Report Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewReport(report)}
                            color="primary"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* View Report Dialog - Simplified */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#228B22', color: 'white' }}>
            Report Details
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 3 }}>
            {selectedReport && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      REPORT INFORMATION
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Report ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {selectedReport._id}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Report Type
                      </Typography>
                      <Chip
                        icon={
                          selectedReport.reportedItemType === 'post' ? <PostAdd /> : 
                          selectedReport.reportedItemType === 'comment' ? <CommentIcon /> : 
                          <ChatIcon />
                        }
                        label={
                          selectedReport.reportedItemType === 'post' ? 'Post' : 
                          selectedReport.reportedItemType === 'comment' ? 'Comment' : 
                          'Message'
                        }
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Report Reason
                      </Typography>
                      <Chip
                        label={getReasonLabel(selectedReport.reason)}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={selectedReport.status ? selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1) : 'Unknown'}
                        color={getStatusColor(selectedReport.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Reported Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedReport.createdAt)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      REPORTER INFORMATION
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Reporter Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.reporter?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Reporter Email
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.reporter?.email || 'No email provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      REPORT DESCRIPTION
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                      <Typography variant="body1">
                        {selectedReport.description || 'No description provided'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                handleCloseDialog();
                handleViewPost(selectedReport);
              }}
              color="primary"
            >
              View Content
            </Button>
            {selectedReport?.status === 'pending' && (
              <Button 
                variant="contained" 
                onClick={() => handleResolveReport(selectedReport)}
                color="success"
              >
                Mark as Resolved
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* View Content Modal - Updated for Comment and Message Reports */}
        <Modal
          open={openPostModal}
          onClose={handleClosePostModal}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
        >
          <Box sx={{
            width: '100%',
            maxWidth: 800,
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 0
          }}>
            {/* Header */}
            <Box sx={{
              p: 3,
              bgcolor: '#228B22',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {viewingPost?.isCommentOnly ? 'Reported Comment' : 
                   viewingPost?.isMessageOnly ? 'Reported Message' : 'Reported Post'}
                  <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
                    {viewingPost?.isCommentOnly ? 'Comment Report' : 
                     viewingPost?.isMessageOnly ? 'Message Report' : 'Post Report'}
                  </Typography>
                </Typography>
              </Box>
              <IconButton onClick={handleClosePostModal} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>

            {/* Loading State */}
            {contentLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : viewingPost ? (
              <>
                {/* Report Info Banner */}
                <Alert 
                  severity="warning" 
                  sx={{ mx: 3, mt: 3 }}
                >
                  <Typography variant="subtitle2">
                    Reported for: <strong>{getReasonLabel(viewingPost.reportReason)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    {viewingPost.reportDescription || 'No additional details provided'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Reported by: {viewingPost.reporter?.name || 'Unknown'} • {formatRelativeTime(viewingPost.createdAt)}
                  </Typography>
                </Alert>

                {/* For Message Reports - Show only the reported message */}
                {viewingPost.isMessageOnly ? (
                  <Box sx={{ p: 3 }}>
                    {/* Reported Message Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          Reported Message
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(viewingPost.reportedMessage.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label="REPORTED MESSAGE"
                        color="warning"
                        icon={<Flag />}
                      />
                    </Box>

                    {/* Message Content */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f9f9f9' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {viewingPost.reportedMessage.content}
                      </Typography>
                    </Paper>

                    {/* Message Participants */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Sender
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={viewingPost.reportedMessage.sender?.profilePicture ? `${API_BASE_URL}${viewingPost.reportedMessage.sender.profilePicture}` : undefined}
                            sx={{ width: 40, height: 40 }}
                          >
                            {viewingPost.reportedMessage.sender?.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="body1">
                            {viewingPost.reportedMessage.sender?.name || 'Unknown User'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Recipient
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={viewingPost.reportedMessage.recipient?.profilePicture ? `${API_BASE_URL}${viewingPost.reportedMessage.recipient.profilePicture}` : undefined}
                            sx={{ width: 40, height: 40 }}
                          >
                            {viewingPost.reportedMessage.recipient?.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="body1">
                            {viewingPost.reportedMessage.recipient?.name || 'Unknown User'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Report Count */}
                    <Box sx={{ mb: 3 }}>
                      <Chip
                        icon={<Flag />}
                        label={`${viewingPost.reportedMessage.reportCount || 1} Report(s)`}
                        color="warning"
                        size="small"
                      />
                      {viewingPost.reportedMessage.isHidden && (
                        <Chip
                          icon={<Warning />}
                          label="Hidden"
                          color="error"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>

                    {/* Hidden Status */}
                    {viewingPost.reportedMessage.isHidden && (
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          This message has been hidden from users.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                ) : viewingPost.isCommentOnly ? (
                  /* For Comment Reports - Show only the reported comment */
                  <Box sx={{ p: 3 }}>
                    {/* Post Context Info */}
                    {viewingPost.postInfo && (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="subtitle2">
                          This comment is from the post:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          "{viewingPost.postInfo.title}"
                        </Typography>
                      </Alert>
                    )}

                    {/* Reported Comment Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar 
                        src={viewingPost.reportedComment.user?.profilePicture ? `${API_BASE_URL}${viewingPost.reportedComment.user.profilePicture}` : undefined}
                        sx={{ width: 50, height: 50, mr: 2 }}
                      >
                        {viewingPost.reportedComment.user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {viewingPost.reportedComment.user?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(viewingPost.reportedComment.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label="REPORTED COMMENT"
                        color="warning"
                        sx={{ ml: 'auto' }}
                        icon={<Flag />}
                      />
                    </Box>

                    {/* Comment Content */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f9f9f9' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {viewingPost.reportedComment.content}
                      </Typography>
                    </Paper>

                    {/* Comment Media */}
                    {viewingPost.reportedComment.media && viewingPost.reportedComment.media.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#666', mb: 2 }}>
                          <Image sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Comment Media ({viewingPost.reportedComment.media.length})
                        </Typography>
                        {renderMedia(viewingPost.reportedComment.media, 'comment')}
                      </Box>
                    )}

                    {/* Hidden Status */}
                    {viewingPost.reportedComment.isHidden && (
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          This comment has been hidden from users.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                ) : (
                  /* For Post Reports - Show the post */
                  <Box sx={{ p: 3 }}>
                    {/* Post Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar 
                        src={viewingPost.user?.profilePicture ? `${API_BASE_URL}${viewingPost.user.profilePicture}` : undefined}
                        sx={{ width: 50, height: 50, mr: 2 }}
                      >
                        {viewingPost.user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {viewingPost.user?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(viewingPost.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label="REPORTED POST"
                        color="warning"
                        sx={{ ml: 'auto' }}
                        icon={<Flag />}
                      />
                    </Box>

                    {/* Post Title */}
                    {viewingPost.title && (
                      <Typography variant="h5" gutterBottom sx={{ color: '#228B22', fontWeight: 'bold' }}>
                        {viewingPost.title}
                      </Typography>
                    )}

                    {/* Post Content */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f9f9f9' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {viewingPost.content}
                      </Typography>
                    </Paper>

                    {/* Post Media */}
                    {viewingPost.media && viewingPost.media.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#666', mb: 2 }}>
                          <Image sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Post Media ({viewingPost.media.length})
                        </Typography>
                        {renderMedia(viewingPost.media, 'post')}
                      </Box>
                    )}

                    {/* Post Stats */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                      <Chip
                        icon={<ThumbUp />}
                        label={`${viewingPost.likesCount || 0} Likes`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        icon={<CommentIcon />}
                        label={`${viewingPost.commentsCount || 0} Comments`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        icon={<Flag />}
                        label={`${viewingPost.reportsCount || 1} Reports`}
                        color="warning"
                        size="small"
                      />
                    </Box>
                  </Box>
                )}

                {/* Unavailable Warning */}
                {viewingPost.isUnavailable && (
                  <Alert severity="warning" sx={{ mx: 3, mb: 3 }}>
                    <Typography variant="body2">
                      This content may have been deleted or is no longer accessible.
                    </Typography>
                  </Alert>
                )}

                <Divider sx={{ mx: 3, my: 3 }} />

                {/* Actions - Conditional based on status and content type */}
                <Box sx={{ p: 3, pt: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {/* Show Hide Content button for ALL pending reports regardless of hidden status */}
                  {viewingPost.reportStatus === 'pending' && (
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => {
                        // First try to get the report from selectedReport
                        let report = selectedReport;
                        // If not found, try to find it in the reports list
                        if (!report && viewingPost.reportId) {
                          report = reports.find(r => r._id === viewingPost.reportId);
                        }
                        // If still not found, create a minimal report object
                        if (!report && viewingPost.reportedItemId) {
                          report = {
                            _id: viewingPost.reportId,
                            reportedItemType: viewingPost.isMessageOnly ? 'message' : 
                                            viewingPost.isCommentOnly ? 'comment' : 'post',
                            reportedItemId: viewingPost.reportedItemId || 
                                          (viewingPost.isMessageOnly ? viewingPost.reportedMessage?._id : 
                                          viewingPost.isCommentOnly ? viewingPost.reportedComment?._id : 
                                          viewingPost._id)
                          };
                        }
                        
                        if (report) {
                          handleHideContent(report);
                        } else {
                          console.error('Could not find report data for hiding content');
                          setSnackbar({
                            open: true,
                            message: 'Could not find report data. Please refresh and try again.',
                            severity: 'error'
                          });
                        }
                      }}
                      startIcon={<Warning />}
                      disabled={viewingPost.isUnavailable}
                    >
                      Hide {
                        viewingPost.isMessageOnly ? 'Message' : 
                        viewingPost.isCommentOnly ? 'Comment' : 
                        'Post'
                      }
                    </Button>
                  )}

                  {/* Only show Mark as Resolved button if report is pending */}
                  {viewingPost.reportStatus === 'pending' && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => {
                        const report = selectedReport || reports.find(r => r._id === viewingPost.reportId);
                        if (report) {
                          handleResolveReport(report);
                        }
                      }}
                      startIcon={<CheckCircle />}
                    >
                      Mark as Resolved
                    </Button>
                  )}

                  {/* Show message if already resolved */}
                  {viewingPost.reportStatus === 'resolved' && (
                    <Alert severity="success" sx={{ width: '100%' }}>
                      This report has been marked as resolved.
                    </Alert>
                  )}

                  {/* Show message if content is already hidden */}
                  {viewingPost.isMessageOnly && viewingPost.reportedMessage?.isHidden && (
                    <Alert severity="info" sx={{ width: '100%' }}>
                      This message has already been hidden from the conversation.
                    </Alert>
                  )}
                  {viewingPost.isCommentOnly && viewingPost.reportedComment?.isHidden && (
                    <Alert severity="info" sx={{ width: '100%' }}>
                      This comment has already been hidden from users.
                    </Alert>
                  )}
                  {!viewingPost.isMessageOnly && !viewingPost.isCommentOnly && viewingPost.isHidden && (
                    <Alert severity="info" sx={{ width: '100%' }}>
                      This post has already been hidden from users.
                    </Alert>
                  )}
                </Box>
              </>
            ) : (
              <Alert severity="error" sx={{ m: 3 }}>
                Unable to load content details.
              </Alert>
            )}
          </Box>
        </Modal>

        {/* Resolve Report Dialog - Simplified */}
        <Dialog open={openResolveDialog} onClose={handleCloseResolveDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Resolve Report</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Are you sure you want to mark this report as resolved?
                </Typography>
              </Alert>
              
              {selectedReport && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Report Details:
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Type: {
                      selectedReport.reportedItemType === 'post' ? 'Post' : 
                      selectedReport.reportedItemType === 'comment' ? 'Comment' : 
                      'Message'
                    }
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Reason: {getReasonLabel(selectedReport.reason)}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Reporter: {selectedReport.reporter?.name || 'Unknown'}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResolveDialog}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateReport}
              color="success"
            >
              Mark as Resolved
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default UserReport;