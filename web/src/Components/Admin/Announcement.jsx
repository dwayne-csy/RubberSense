// RubberSense/Web/src/Components/Admin/Announcement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

// Icon components
const MegaphoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z"/>
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const StarIcon = ({ filled = false }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    isImportant: false,
    isPublished: true
  });
  const [filters, setFilters] = useState({
    type: 'all',
    isPublished: 'all',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1
  });
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, [filters]);

  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.isPublished !== 'all') params.append('isPublished', filters.isPublished);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      params.append('sortBy', 'publishDate');
      params.append('sortOrder', 'desc');

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/mail/admin/announcements?${params.toString()}`
      );
      
      if (response.data.success) {
        setAnnouncements(response.data.data);
        setPagination({
          total: response.data.total,
          pages: response.data.pages,
          currentPage: response.data.currentPage
        });
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        showNotification('Failed to load announcements', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/mail/admin/announcements/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/mail/admin/announcements`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showNotification('Announcement created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchAnnouncements();
        fetchStats();
      } else {
        showNotification(response.data.message || 'Failed to create announcement', 'error');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      showNotification(error.response?.data?.message || 'Failed to create announcement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    
    if (!selectedAnnouncement) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/mail/admin/announcements/${selectedAnnouncement._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showNotification('Announcement updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchAnnouncements();
        fetchStats();
      } else {
        showNotification(response.data.message || 'Failed to update announcement', 'error');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      showNotification(error.response?.data?.message || 'Failed to update announcement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (announcement) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/mail/admin/announcements/${announcement._id}/toggle-publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showNotification(`Announcement ${announcement.isPublished ? 'unpublished' : 'published'} successfully`);
        fetchAnnouncements();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      showNotification('Failed to update status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'announcement',
      isImportant: false,
      isPublished: true
    });
    setSelectedAnnouncement(null);
  };

  const handleEditClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isImportant: announcement.isImportant,
      isPublished: announcement.isPublished
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
    window.scrollTo(0, 0);
  };

  // Rubber Tree Theme Styles
  const styles = {
    mainContainer: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#F5F3EF'
    },
    contentContainer: {
      flex: 1,
      marginLeft: '250px',
      display: 'flex',
      flexDirection: 'column'
    },
    notification: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '14px 24px',
      borderRadius: '8px',
      zIndex: 2000,
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      animation: 'slideIn 0.3s ease'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      margin: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(76, 119, 90, 0.08)',
      overflow: 'hidden',
      border: '1px solid #E8E4DD'
    },
    header: {
      padding: '28px 32px',
      borderBottom: '2px solid #E8E4DD',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #F8F6F3 0%, #FFFFFF 100%)'
    },
    headerTitle: {
      margin: 0,
      fontSize: '28px',
      fontWeight: '700',
      color: '#2C5234',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      padding: '28px 32px',
      borderBottom: '2px solid #E8E4DD',
      background: 'linear-gradient(135deg, #F5F8F6 0%, #FAFBFA 100%)'
    },
    statCard: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(76, 119, 90, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      border: '2px solid #E8F0EA',
      transition: 'all 0.3s ease',
      cursor: 'default'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #2C5234 0%, #4C775A 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    statLabel: {
      fontSize: '13px',
      color: '#6B8270',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      fontWeight: '600'
    },
    filtersContainer: {
      padding: '24px 32px',
      borderBottom: '2px solid #E8E4DD',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      alignItems: 'center',
      backgroundColor: 'white'
    },
    filterSelect: {
      padding: '12px 18px',
      border: '2px solid #D4E0D7',
      borderRadius: '10px',
      backgroundColor: 'white',
      fontSize: '14px',
      color: '#2C5234',
      minWidth: '160px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: '500'
    },
    searchInputContainer: {
      flex: 1,
      minWidth: '280px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    searchIcon: {
      position: 'absolute',
      left: '16px',
      color: '#6B8270',
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none'
    },
    searchInput: {
      flex: 1,
      padding: '12px 18px 12px 46px',
      border: '2px solid #D4E0D7',
      borderRadius: '10px',
      fontSize: '14px',
      color: '#2C5234',
      transition: 'all 0.2s ease',
      fontWeight: '500',
      backgroundColor: 'white'
    },
    tableContainer: {
      flex: 1,
      overflow: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #F5F8F6 0%, #FAFBFA 100%)',
      borderBottom: '2px solid #D4E0D7',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    tableHeaderCell: {
      padding: '20px 18px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '700',
      color: '#2C5234',
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    tableRow: {
      borderBottom: '1px solid #E8F0EA',
      transition: 'background-color 0.2s ease'
    },
    tableCell: {
      padding: '18px',
      fontSize: '14px',
      color: '#2C5234',
      verticalAlign: 'top'
    },
    loading: {
      padding: '80px',
      textAlign: 'center',
      color: '#6B8270',
      fontSize: '16px',
      fontWeight: '500'
    },
    noData: {
      padding: '80px',
      textAlign: 'center',
      color: '#6B8270',
      fontSize: '16px',
      fontWeight: '500'
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '10px 18px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      whiteSpace: 'nowrap'
    },
    createBtn: {
      background: 'linear-gradient(135deg, #4C775A 0%, #2C5234 100%)',
      color: 'white',
      padding: '14px 28px',
      fontSize: '15px',
      fontWeight: '700',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(76, 119, 90, 0.25)'
    },
    editBtn: {
      background: 'linear-gradient(135deg, #D4A574 0%, #B8935F 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(212, 165, 116, 0.2)'
    },
    publishBtn: {
      background: 'linear-gradient(135deg, #4C775A 0%, #2C5234 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(76, 119, 90, 0.2)'
    },
    unpublishBtn: {
      background: 'linear-gradient(135deg, #8A9B8E 0%, #6B8270 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(107, 130, 112, 0.2)'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(44, 82, 52, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '16px',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 24px 60px rgba(44, 82, 52, 0.3)',
      border: '2px solid #E8F0EA'
    },
    modalHeader: {
      padding: '28px 32px',
      borderBottom: '2px solid #E8E4DD',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #F5F8F6 0%, #FAFBFA 100%)',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px'
    },
    modalTitle: {
      margin: 0,
      fontSize: '24px',
      fontWeight: '700',
      color: '#2C5234'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6B8270',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'all 0.2s ease'
    },
    modalBody: {
      padding: '32px'
    },
    modalFooter: {
      padding: '24px 32px',
      borderTop: '2px solid #E8E4DD',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '16px',
      background: 'linear-gradient(135deg, #F5F8F6 0%, #FAFBFA 100%)',
      borderBottomLeftRadius: '16px',
      borderBottomRightRadius: '16px'
    },
    formGroup: {
      marginBottom: '24px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#2C5234',
      letterSpacing: '0.3px'
    },
    formInput: {
      width: '100%',
      padding: '14px 18px',
      border: '2px solid #D4E0D7',
      borderRadius: '10px',
      fontSize: '15px',
      color: '#2C5234',
      transition: 'all 0.2s ease',
      fontWeight: '500',
      backgroundColor: 'white'
    },
    formTextarea: {
      width: '100%',
      minHeight: '200px',
      padding: '14px 18px',
      border: '2px solid #D4E0D7',
      borderRadius: '10px',
      fontSize: '15px',
      color: '#2C5234',
      fontFamily: 'inherit',
      resize: 'vertical',
      lineHeight: '1.6',
      transition: 'all 0.2s ease',
      fontWeight: '500',
      backgroundColor: 'white'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '15px',
      color: '#2C5234',
      cursor: 'pointer',
      padding: '10px 0',
      fontWeight: '500'
    },
    checkbox: {
      width: '22px',
      height: '22px',
      cursor: 'pointer',
      accentColor: '#4C775A'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '28px 32px',
      borderTop: '2px solid #E8E4DD',
      background: 'linear-gradient(135deg, #F5F8F6 0%, #FAFBFA 100%)'
    },
    pageButton: {
      padding: '10px 16px',
      border: '2px solid #D4E0D7',
      borderRadius: '10px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#2C5234',
      minWidth: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      fontWeight: '600'
    },
    activePageButton: {
      background: 'linear-gradient(135deg, #4C775A 0%, #2C5234 100%)',
      color: 'white',
      borderColor: '#4C775A',
      boxShadow: '0 2px 8px rgba(76, 119, 90, 0.2)'
    }
  };

  const animationStyles = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(76, 119, 90, 0.15);
    }

    .table-row:hover {
      background-color: #F5F8F6;
    }

    .create-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 119, 90, 0.35);
    }

    .button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .close-button:hover {
      background-color: #E8F0EA;
    }

    .filter-select:hover,
    .search-input:hover,
    .form-input:hover,
    .form-textarea:hover {
      border-color: #4C775A;
    }

    .filter-select:focus,
    .search-input:focus,
    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #4C775A;
      box-shadow: 0 0 0 3px rgba(76, 119, 90, 0.1);
    }

    .page-button:hover:not(:disabled):not(.active-page) {
      background-color: #F5F8F6;
      border-color: #4C775A;
      transform: translateY(-2px);
    }

    .page-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `;

  return (
    <div style={styles.mainContainer}>
      <LeftNavigationBar />
      
      <style>{animationStyles}</style>
      
      <div style={styles.contentContainer}>
        {notification.show && (
          <div style={{
            ...styles.notification,
            background: notification.type === 'success' 
              ? 'linear-gradient(135deg, #4C775A 0%, #2C5234 100%)'
              : 'linear-gradient(135deg, #C85A54 0%, #A84642 100%)'
          }}>
            {notification.message}
          </div>
        )}

        <main style={styles.mainContent}>
          <div style={styles.header}>
            <h1 style={styles.headerTitle}>
              <MegaphoneIcon />
              <span>Announcements Management</span>
            </h1>
            <button 
              className="create-btn"
              style={styles.createBtn}
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <PlusIcon />
              <span>Create Announcement</span>
            </button>
          </div>

          {stats && (
            <div style={styles.statsContainer}>
              <div className="stat-card" style={styles.statCard}>
                <div style={styles.statValue}>{stats.total || 0}</div>
                <div style={styles.statLabel}>Total Announcements</div>
              </div>
              <div className="stat-card" style={styles.statCard}>
                <div style={styles.statValue}>{stats.published || 0}</div>
                <div style={styles.statLabel}>Published</div>
              </div>
              <div className="stat-card" style={styles.statCard}>
                <div style={styles.statValue}>{stats.important || 0}</div>
                <div style={styles.statLabel}>Important</div>
              </div>
              <div className="stat-card" style={styles.statCard}>
                <div style={styles.statValue}>{stats.unpublished || 0}</div>
                <div style={styles.statLabel}>Unpublished</div>
              </div>
            </div>
          )}

          <div style={styles.filtersContainer}>
            <select 
              className="filter-select"
              style={styles.filterSelect}
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcement</option>
              <option value="update">Update</option>
              <option value="maintenance">Maintenance</option>
              <option value="news">News</option>
              <option value="alert">Alert</option>
            </select>

            <select 
              className="filter-select"
              style={styles.filterSelect}
              value={filters.isPublished}
              onChange={(e) => handleFilterChange('isPublished', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>

            <div style={styles.searchInputContainer}>
              <div style={styles.searchIcon}>
                <SearchIcon />
              </div>
              <input
                type="text"
                className="search-input"
                style={styles.searchInput}
                placeholder="Search announcements by title or content..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div style={styles.tableContainer}>
            {loading ? (
              <div style={styles.loading}>Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div style={styles.noData}>
                No announcements found. Create your first announcement!
              </div>
            ) : (
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Title</th>
                    <th style={styles.tableHeaderCell}>Type</th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Created</th>
                    <th style={styles.tableHeaderCell}>Views</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((announcement) => (
                    <tr key={announcement._id} className="table-row" style={styles.tableRow}>
                      <td style={styles.tableCell}>
                        <div>
                          <strong style={{ 
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: '600'
                          }}>
                            {announcement.title}
                            {announcement.isImportant && (
                              <span style={{ 
                                color: '#D4A574',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}>
                                <StarIcon filled={true} />
                              </span>
                            )}
                          </strong>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#6B8270', 
                            marginTop: '6px',
                            lineHeight: '1.5'
                          }}>
                            {announcement.content.substring(0, 80)}...
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: '#E8F0EA',
                          color: '#4C775A'
                        }}>
                          {announcement.type}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: announcement.isPublished ? '#D4EDD7' : '#F5E0DE',
                          color: announcement.isPublished ? '#2C5234' : '#A84642'
                        }}>
                          {announcement.isPublished ? 'Published' : 'Unpublished'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{ color: '#6B8270', fontWeight: '500' }}>
                          {formatDate(announcement.createdAt)}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{ 
                          fontWeight: '600',
                          color: announcement.views > 0 ? '#4C775A' : '#6B8270'
                        }}>
                          {announcement.views || 0}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <button
                            className="button"
                            style={{
                              ...styles.button,
                              ...(announcement.isPublished ? styles.unpublishBtn : styles.publishBtn)
                            }}
                            onClick={() => handleTogglePublish(announcement)}
                          >
                            {announcement.isPublished ? <EyeOffIcon /> : <EyeIcon />}
                            {announcement.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            className="button"
                            style={{ ...styles.button, ...styles.editBtn }}
                            onClick={() => handleEditClick(announcement)}
                          >
                            <EditIcon />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination.pages > 1 && (
            <div style={styles.pagination}>
              <button
                className="page-button"
                style={styles.pageButton}
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
              >
                <ChevronLeftIcon />
              </button>
              
              {[...Array(pagination.pages)].map((_, index) => {
                const pageNum = index + 1;
                if (
                  pageNum === 1 ||
                  pageNum === pagination.pages ||
                  (pageNum >= filters.page - 2 && pageNum <= filters.page + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`page-button ${filters.page === pageNum ? 'active-page' : ''}`}
                      style={{
                        ...styles.pageButton,
                        ...(filters.page === pageNum ? styles.activePageButton : {})
                      }}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              <button
                className="page-button"
                style={styles.pageButton}
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.pages}
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </main>

        {/* Create Modal */}
        {showCreateModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Create New Announcement</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.closeButton}
                >
                  <CloseIcon />
                </button>
              </div>
              
              <form onSubmit={handleCreateAnnouncement}>
                <div style={styles.modalBody}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Title *</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      style={styles.formInput}
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter announcement title"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Content *</label>
                    <textarea
                      name="content"
                      className="form-textarea"
                      style={styles.formTextarea}
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter announcement content..."
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Type</label>
                    <select
                      name="type"
                      className="form-input"
                      style={styles.formInput}
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="update">Update</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="news">News</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isImportant"
                        checked={formData.isImportant}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      Mark as Important
                    </label>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      Publish immediately
                    </label>
                  </div>
                </div>

                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    className="button"
                    style={{ ...styles.button, ...styles.unpublishBtn }}
                    onClick={() => setShowCreateModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button"
                    style={{ ...styles.button, ...styles.publishBtn }}
                    disabled={saving}
                  >
                    {saving ? 'Creating...' : 'Create Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedAnnouncement && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Edit Announcement</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <CloseIcon />
                </button>
              </div>
              
              <form onSubmit={handleUpdateAnnouncement}>
                <div style={styles.modalBody}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Title *</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      style={styles.formInput}
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Content *</label>
                    <textarea
                      name="content"
                      className="form-textarea"
                      style={styles.formTextarea}
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Type</label>
                    <select
                      name="type"
                      className="form-input"
                      style={styles.formInput}
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="update">Update</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="news">News</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isImportant"
                        checked={formData.isImportant}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      Mark as Important
                    </label>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        style={styles.checkbox}
                      />
                      Published
                    </label>
                  </div>
                </div>

                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    className="button"
                    style={{ ...styles.button, ...styles.unpublishBtn }}
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button"
                    style={{ ...styles.button, ...styles.publishBtn }}
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Update Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcement;