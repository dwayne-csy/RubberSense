import React, { useState, useEffect, useRef } from 'react';
import {
  formatDistanceToNow
} from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';
import {
  PersonAdd as PersonAddIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Article as ArticleIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Report as ReportIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Markunread as MarkunreadIcon,
  FilterList as FilterListIcon,
  Flag as FlagIcon,
  VisibilityOff as VisibilityOffIcon,
  Chat as ChatIcon,
  PostAdd as PostAddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Lucide icons for UI chrome (matching Mail.jsx style)
import {
  Bell, RefreshCw, CheckCheck, Filter, ChevronRight, ArrowLeft,
  Loader2, AlertTriangle, Leaf, X, Calendar, Clock,
  UserPlus, Heart, MessageCircle, FileText, Flag, EyeOff,
  MessageSquare, FileWarning, Shield, Star, Megaphone, Trash2
} from 'lucide-react';

// ── axios setup (unchanged from original) ────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Type / Priority config (mirroring Mail.jsx) ───────────────────────────────
const TYPE_CONFIG = {
  follow:           { color: '#1b4332', bg: '#d8f3dc', label: 'Follow'    },
  post_like:        { color: '#7f1d1d', bg: '#fde8e8', label: 'Like'       },
  post_comment:     { color: '#2d6a4f', bg: '#b7e4c7', label: 'Comment'   },
  comment_like:     { color: '#2d6a4f', bg: '#b7e4c7', label: 'Comment'   },
  new_post:         { color: '#1b4332', bg: '#cddabd', label: 'New Post'  },
  content_reported: { color: '#ca6702', bg: '#fff1e6', label: 'Reported'  },
  content_hidden:   { color: '#7f1d1d', bg: '#fde8e8', label: 'Hidden'    },
  default:          { color: '#344e41', bg: '#d8f3dc', label: 'Notice'    },
};

const BORDER_CONFIG = {
  follow:           '#52b788',
  post_like:        '#f87171',
  post_comment:     '#52b788',
  comment_like:     '#52b788',
  new_post:         '#74c69d',
  content_reported: '#fb923c',
  content_hidden:   '#f87171',
  default:          '#74c69d',
};

// ─────────────────────────────────────────────────────────────────────────────
const NotificationsPage = () => {
  // ── all state & logic UNCHANGED from original ────────────────────────────
  const [notifications, setNotifications]           = useState([]);
  const [loading, setLoading]                       = useState({ notifications: false, action: false });
  const [error, setError]                           = useState('');
  const [success, setSuccess]                       = useState('');
  const [anchorEl, setAnchorEl]                     = useState(null);
  const [unreadCount, setUnreadCount]               = useState(0);
  const [activeFilter, setActiveFilter]             = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [reportDialogOpen, setReportDialogOpen]     = useState(false);
  const [reportReason, setReportReason]             = useState('');
  const [reportDetails, setReportDetails]           = useState('');
  const [page, setPage]                             = useState(1);
  const [totalPages, setTotalPages]                 = useState(1);
  const [hasMore, setHasMore]                       = useState(true);
  const [selectedItem, setSelectedItem]             = useState(null);
  const [contextMenuOpen, setContextMenuOpen]       = useState(false);
  const [contextMenuNotif, setContextMenuNotif]     = useState(null);
  const [notification, setNotification]             = useState({ show: false, message: '', type: 'success' });

  const navigate  = useNavigate();
  const notificationRef = useRef(null);

  // ── toast helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => { if (success) { showToast(success); setSuccess(''); } }, [success]);
  useEffect(() => { if (error)   { showToast(error, 'error'); setError(''); } }, [error]);

  // ── all fetch / action logic UNCHANGED ───────────────────────────────────
  const fetchNotifications = async (pageNum = 1, limit = 20) => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const response = await api.get('/api/v1/notifications', { params: { page: pageNum, limit } });
      if (response.data.success) {
        if (pageNum === 1) setNotifications(response.data.data || []);
        else setNotifications(prev => [...prev, ...(response.data.data || [])]);
        setUnreadCount(response.data.unreadCount || 0);
        setTotalPages(response.data.totalPages || 1);
        setPage(pageNum);
        setHasMore(pageNum < (response.data.totalPages || 1));
      } else {
        setError('Failed to load notifications: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      if (error.response?.status === 401) setError('Please login to view notifications');
      else if (error.response?.status === 404) setError('Notifications endpoint not found.');
      else setError('Failed to load notifications: ' + (error.message || 'Network error'));
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/v1/notifications/unread-count');
      if (response.data.success) setUnreadCount(response.data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      fetchNotifications(1);
      const pollInterval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(pollInterval);
    }
  }, []);

  const loadMoreNotifications = () => {
    if (!loading.notifications && hasMore) fetchNotifications(page + 1);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread')  return !n.isRead;
    if (activeFilter === 'reports') return n.type === 'content_reported';
    if (activeFilter === 'admin')   return n.type === 'content_hidden';
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':           return <PersonAddIcon fontSize="small" sx={{ color: 'primary.main' }} />;
      case 'post_like':        return <FavoriteIcon  fontSize="small" sx={{ color: 'error.main' }} />;
      case 'post_comment':
      case 'comment_like':     return <CommentIcon   fontSize="small" sx={{ color: 'success.main' }} />;
      case 'new_post':         return <ArticleIcon   fontSize="small" sx={{ color: 'info.main' }} />;
      case 'content_reported': return <FlagIcon      fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'content_hidden':   return <VisibilityOffIcon fontSize="small" sx={{ color: 'error.main' }} />;
      default:                 return <NotificationsIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
    }
  };

  const getLucideIcon = (type) => {
    switch (type) {
      case 'follow':           return <UserPlus      size={13} />;
      case 'post_like':        return <Heart         size={13} />;
      case 'post_comment':
      case 'comment_like':     return <MessageCircle size={13} />;
      case 'new_post':         return <FileText      size={13} />;
      case 'content_reported': return <Flag          size={13} />;
      case 'content_hidden':   return <EyeOff        size={13} />;
      default:                 return <Bell          size={13} />;
    }
  };

  const getNotificationMessage = (n) => {
    if (n.type === 'content_reported') {
      if (n.contentType === 'post')    return 'Your post has been reported';
      if (n.contentType === 'comment') return 'Your comment has been reported';
      if (n.contentType === 'message') return 'Your message has been reported';
      return 'Your content has been reported';
    }
    if (n.type === 'content_hidden') {
      if (n.contentType === 'post')    return 'Your post has been hidden by Admin';
      if (n.contentType === 'comment') return 'Your comment has been hidden by Admin';
      if (n.contentType === 'message') return 'Your message has been hidden by Admin';
      return 'Your content has been hidden by Admin';
    }
    return n.message || 'New notification';
  };

  const getNotificationContentType = (n) => {
    if (n.contentType) return n.contentType;
    if (n.post)        return 'post';
    if (n.comment)     return 'comment';
    if (n.messageRef)  return 'message';
    return null;
  };

  const getNotificationLink = (n) => {
    if (n.link) {
      if (n.link.startsWith('/profile/')) return `/user/${n.link.replace('/profile/', '')}`;
      return n.link;
    }
    const ct = getNotificationContentType(n);
    switch (n.type) {
      case 'follow':                      return `/user/${n.sender?._id}`;
      case 'post_like': case 'post_comment':
      case 'new_post':  case 'comment_like': return `/community-blogspot`;
      case 'content_reported': case 'content_hidden':
        if (ct === 'post'    && n.post)       return `/community-blogspot?highlight=${n.post}`;
        if (ct === 'comment' && n.comment)    return `/community-blogspot`;
        if (ct === 'message' && n.messageRef) return `/messages`;
        return '/community-blogspot';
      default: return '#';
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markAsRead(n._id);
    const link = getNotificationLink(n);
    if (link && link !== '#') {
      navigate(link);
      const ct = getNotificationContentType(n);
      if (n.type === 'content_reported' || n.type === 'content_hidden') {
        if (ct === 'post'    && n.post)       sessionStorage.setItem('highlightedPostId',    n.post);
        if (ct === 'comment' && n.comment)    sessionStorage.setItem('highlightedCommentId', n.comment);
        if (ct === 'message' && n.messageRef) sessionStorage.setItem('highlightedMessageId', n.messageRef);
      } else if (n.post && ['post_like','post_comment','new_post','comment_like'].includes(n.type)) {
        sessionStorage.setItem('highlightedPostId', n.post);
      }
    }
  };

  const markAsRead = async (notificationId) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await api.put('/api/v1/notifications/read', { notificationId });
      if (response.data.success) {
        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setSuccess('Notification marked as read');
        if (selectedItem?._id === notificationId) setSelectedItem(prev => ({ ...prev, isRead: true }));
      }
    } catch { setError('Failed to mark as read'); }
    finally  { setLoading(prev => ({ ...prev, action: false })); }
  };

  const markAllAsRead = async () => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await api.put('/api/v1/notifications/read', {});
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        setSuccess('All notifications marked as read');
      }
    } catch { setError('Failed to mark all as read'); }
    finally  { setLoading(prev => ({ ...prev, action: false })); }
  };

  const deleteNotification = async (notificationId) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await api.delete(`/api/v1/notifications/${notificationId}`);
      if (response.data.success) {
        const n = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (n && !n.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
        if (selectedItem?._id === notificationId) setSelectedItem(null);
        setSuccess('Notification deleted');
      }
    } catch { setError('Failed to delete notification'); }
    finally  { setLoading(prev => ({ ...prev, action: false })); setContextMenuOpen(false); }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await api.delete('/api/v1/notifications/clear/all');
      if (response.data.success) {
        setNotifications([]); setUnreadCount(0); setSelectedItem(null);
        setSuccess('All notifications cleared');
      }
    } catch { setError('Failed to clear notifications'); }
    finally  { setLoading(prev => ({ ...prev, action: false })); }
  };

  const followBack = async (senderId, notificationId) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await api.post('/api/v1/notifications/follow-back', { senderId });
      if (response.data.success) {
        setNotifications(prev => prev.map(n =>
          n._id === notificationId
            ? { ...n, isRead: true, message: `You are now following ${n.sender?.name || 'this user'}`, followStatus: { isFollowing: true, canFollowBack: false } }
            : n
        ));
        if (selectedItem?._id === notificationId) {
          setSelectedItem(prev => ({ ...prev, isRead: true, followStatus: { isFollowing: true, canFollowBack: false } }));
        }
        setSuccess('Followed back successfully!');
      }
    } catch { setError('Failed to follow back'); }
    finally  { setLoading(prev => ({ ...prev, action: false })); }
  };

  const isUserFollowing = (n) => n.type === 'follow' && (n.followStatus?.isFollowing || false);
  const canFollowBack   = (n) => n.type === 'follow' && n.followStatus?.canFollowBack !== false;
  const isReportNotification = (n) => n.type === 'content_reported' || n.type === 'content_hidden';

  const getReportContentType = (n) => {
    const ct = getNotificationContentType(n);
    return ct === 'post' ? 'Post' : ct === 'comment' ? 'Comment' : ct === 'message' ? 'Message' : 'Content';
  };

  const getReportContentIcon = (n) => {
    const ct = getNotificationContentType(n);
    if (ct === 'post')    return <PostAddIcon fontSize="small" />;
    if (ct === 'comment') return <CommentIcon fontSize="small" />;
    if (ct === 'message') return <ChatIcon    fontSize="small" />;
    return <WarningIcon fontSize="small" />;
  };

  const submitReport = async () => {
    if (!contextMenuNotif) return;
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const ct = getNotificationContentType(contextMenuNotif);
      if (ct === 'message') {
        const response = await api.post(`/api/v1/messages/${contextMenuNotif.messageRef}/report`, { reason: reportReason, details: reportDetails });
        if (response.data.success) { setSuccess('Message reported successfully'); setReportDialogOpen(false); setReportReason(''); setReportDetails(''); }
        return;
      }
      const itemType = ct === 'post' ? 'post' : ct === 'comment' ? 'comment' : '';
      const itemId   = ct === 'post' ? contextMenuNotif.post : ct === 'comment' ? contextMenuNotif.comment : '';
      if (!itemType || !itemId) { setError('Cannot determine content type to report'); return; }
      const response = await api.post('/api/v1/community/report', { itemType, itemId, reason: reportReason, description: reportDetails });
      if (response.data.success) { setSuccess('Content reported successfully'); setReportDialogOpen(false); setReportReason(''); setReportDetails(''); }
    } catch (err) { setError('Failed to report content: ' + (err.response?.data?.message || err.message)); }
    finally { setLoading(prev => ({ ...prev, action: false })); }
  };

  // ── formatting helpers ────────────────────────────────────────────────────
  const formatDate = (ds) => {
    if (!ds) return '';
    const d = new Date(ds), now = new Date();
    const diff = Math.floor(Math.abs(now - d) / 86400000);
    if (diff === 0) return 'Today, ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Yesterday';
    if (diff < 7)  return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const formatFullDate = (ds) => {
    if (!ds) return '';
    return new Date(ds).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── LIST ITEM renderer ────────────────────────────────────────────────────
  const renderListItem = (n) => {
    const typeConf   = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
    const borderCol  = BORDER_CONFIG[n.type] || BORDER_CONFIG.default;
    const isActive   = selectedItem?._id === n._id;
    const hasUnread  = !n.isRead;
    const dateObj    = new Date(n.createdAt);

    return (
      <div
        key={n._id}
        onClick={() => { setSelectedItem(n); if (!n.isRead) markAsRead(n._id); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 0,
          backgroundColor: isActive ? '#e8f5ee' : hasUnread ? '#f7fdf9' : 'white',
          borderBottom: '1px solid #e9f0eb',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          fontFamily: "'DM Sans', sans-serif",
          borderLeft: isActive ? `3px solid ${borderCol}` : hasUnread ? `3px solid ${borderCol}` : '3px solid transparent',
          position: 'relative',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f0faf3'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? '#e8f5ee' : hasUnread ? '#f7fdf9' : 'white'; }}
      >
        {/* Date column */}
        <div style={{
          width: '64px', minWidth: '64px', padding: '16px 12px 16px 14px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          borderRight: '1px solid #e9f0eb',
        }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {dateObj.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#1b4332', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>
            {dateObj.getDate()}
          </span>
          <span style={{ fontSize: '10px', color: '#a3b18a', marginTop: '1px' }}>
            {dateObj.getFullYear()}
          </span>
        </div>

        {/* Type badge icon */}
        <div style={{ width: '42px', minWidth: '42px', display: 'flex', justifyContent: 'center', padding: '0 4px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            backgroundColor: typeConf.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: typeConf.color }}>{getLucideIcon(n.type)}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '14px 10px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '13.5px', fontWeight: hasUnread ? '700' : '600',
              color: '#1b4332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {n.sender?.name || (n.type === 'content_reported' || n.type === 'content_hidden' ? 'Admin' : 'System')}
            </span>
            {hasUnread && (
              <span style={{
                backgroundColor: '#2d6a4f', color: 'white',
                fontSize: '9px', fontWeight: '700', padding: '1px 6px',
                borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
              }}>NEW</span>
            )}
          </div>
          <p style={{
            fontSize: '12px', color: '#6b705c', margin: '0 0 6px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {getNotificationMessage(n)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px', fontWeight: '600', padding: '1px 7px',
              borderRadius: '5px', textTransform: 'capitalize',
              backgroundColor: typeConf.bg, color: typeConf.color,
            }}>
              {typeConf.label}
            </span>
            {n.reportReason && (
              <span style={{
                fontSize: '10px', fontWeight: '600', padding: '1px 7px',
                borderRadius: '5px', backgroundColor: '#dde8ff', color: '#2d3b8e',
              }}>
                {n.reportReason.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <ChevronRight size={14} color={isActive ? '#2d6a4f' : '#a3b18a'} />
        </div>
      </div>
    );
  };

  // ── DETAIL PANEL renderer ─────────────────────────────────────────────────
  const renderDetailContent = (n) => {
    const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
    const isFollow = n.type === 'follow';
    const isFollowing = isUserFollowing(n);
    const canFollow   = canFollowBack(n);
    const isReport    = isReportNotification(n);

    return (
      <div style={{ padding: '28px', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header card */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fdf9 0%, #e8f5ee 100%)',
          border: '1px solid #b7e4c7', borderRadius: '14px',
          padding: '20px 24px', marginBottom: '24px',
        }}>
          {/* Badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '3px 10px',
              borderRadius: '6px', backgroundColor: typeConf.bg, color: typeConf.color,
              textTransform: 'capitalize',
            }}>{typeConf.label}</span>
            {n.reportReason && (
              <span style={{
                fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                borderRadius: '6px', backgroundColor: '#dde8ff', color: '#2d3b8e',
              }}>{n.reportReason.replace('_', ' ')}</span>
            )}
            {n.isRead && (
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                borderRadius: '6px', backgroundColor: '#d8f3dc', color: '#2d6a4f',
                display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto',
              }}>
                <CheckCheck size={10} /> Read
              </span>
            )}
          </div>

          {/* Sender row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {n.sender?.avatar?.url || n.sender?.profilePicture?.url
                ? <img src={n.sender.avatar?.url || n.sender.profilePicture?.url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: "'Lora', serif" }}>
                    {(n.sender?.name?.[0] || 'S').toUpperCase()}
                  </span>
              }
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1b4332', fontFamily: "'Lora', serif" }}>
                {n.sender?.name || (isReport ? 'System' : 'Notification')}
              </div>
              <div style={{ fontSize: '12px', color: '#6b705c', marginTop: '2px' }}>
                {getNotificationMessage(n)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b705c' }}>
            <Calendar size={11} color="#2d6a4f" />
            {formatFullDate(n.createdAt)}
          </div>
        </div>

        {/* Follow back action */}
        {isFollow && (
          <div style={{
            background: 'white', border: '1px solid #e9f0eb',
            borderRadius: '12px', padding: '18px 22px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: '#1b4332', fontSize: '14px', fontFamily: "'Lora', serif" }}>
                {n.sender?.name || 'This user'} started following you
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b705c' }}>
                {isFollowing ? 'You are already following them back.' : 'Would you like to follow back?'}
              </p>
            </div>
            <button
              onClick={() => { if (!isFollowing && canFollow) followBack(n.sender?._id, n._id); }}
              disabled={isFollowing || !canFollow || loading.action}
              style={{
                padding: '9px 18px',
                background: isFollowing ? 'none' : 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                border: isFollowing ? '1.5px solid #b7e4c7' : 'none',
                borderRadius: '9px', cursor: isFollowing ? 'default' : 'pointer',
                fontSize: '13px', fontWeight: '600',
                color: isFollowing ? '#2d6a4f' : 'white',
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: loading.action ? 0.65 : 1,
                fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
              }}
            >
              {isFollowing
                ? <><CheckCheck size={13} /> Following</>
                : <><UserPlus size={13} /> Follow Back</>
              }
            </button>
          </div>
        )}

        {/* Report / Admin notice */}
        {isReport && (
          <div style={{
            background: n.type === 'content_reported'
              ? 'linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%)'
              : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            border: `1px solid ${n.type === 'content_reported' ? '#ffcc02' : '#f87171'}`,
            borderRadius: '12px', padding: '18px 22px', marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: n.type === 'content_reported' ? '#ca6702' : '#7f1d1d' }}>
                {n.type === 'content_reported' ? <Flag size={18} /> : <EyeOff size={18} />}
              </span>
              <p style={{ margin: 0, fontWeight: '700', color: n.type === 'content_reported' ? '#92400e' : '#7f1d1d', fontSize: '14px', fontFamily: "'Lora', serif" }}>
                {n.type === 'content_reported' ? `Your ${getReportContentType(n)} was reported` : `Your ${getReportContentType(n)} was hidden by Admin`}
              </p>
            </div>
            {n.adminAction && (
              <p style={{ margin: 0, fontSize: '13px', color: '#6b4f2e' }}>
                Admin action: <strong>{n.adminAction}</strong>
              </p>
            )}
            {/* Only show "View Content" for reported content — hidden content cannot be viewed */}
            {n.type === 'content_reported' && (
              <button
                onClick={() => { navigate(getNotificationLink(n)); }}
                style={{
                  marginTop: '14px', padding: '8px 16px',
                  background: '#ca6702',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '600', color: 'white',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <MessageSquare size={12} /> View Content
              </button>
            )}
          </div>
        )}

        {/* Delete action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          {!n.isRead && (
            <button
              onClick={() => markAsRead(n._id)}
              disabled={loading.action}
              style={{
                padding: '8px 16px', background: 'none',
                border: '1.5px solid #b7e4c7', borderRadius: '8px',
                cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                color: '#2d6a4f', fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <CheckCheck size={12} /> Mark as Read
            </button>
          )}
          <button
            onClick={() => deleteNotification(n._id)}
            disabled={loading.action}
            style={{
              padding: '8px 16px', background: 'none',
              border: '1.5px solid #fca5a5', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              color: '#7f1d1d', fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  const isLoading = loading.notifications;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes heroFloat { 0%,100% { transform: translateY(0px) rotate(-2deg) } 50% { transform: translateY(-8px) rotate(2deg) } }
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f4f9f4; }
        ::-webkit-scrollbar-thumb { background: #b7e4c7; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #74c69d; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f9f4', fontFamily: "'DM Sans', sans-serif" }}>
        <UserHeader />

        {/* ── Toast notification ─────────────────────────────────────── */}
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          transform: notification.show ? 'translateY(0)' : 'translateY(-120%)',
          opacity: notification.show ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 18px', borderRadius: '10px',
          backgroundColor: notification.type === 'success' ? '#1b4332' : '#7f1d1d',
          color: 'white', fontSize: '14px', fontWeight: '500',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontFamily: "'Lora', serif",
        }}>
          {notification.type === 'success' ? <Leaf size={16} /> : <AlertTriangle size={16} />}
          {notification.message}
        </div>

        {/* ── Hero Banner ────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2818 0%, #1b4332 55%, #2d6a4f 100%)',
          padding: '48px 24px 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-40px', top: '-30px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(82,183,136,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '80px',  bottom: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(52,143,96,0.1)',   pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '-20px',  bottom: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(163,209,141,0.06)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.15)',
                animation: 'heroFloat 4s ease-in-out infinite',
              }}>
                <Bell size={28} color="#74c69d" strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0, fontFamily: "'Lora', serif" }}>
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#74c69d', color: '#0d2818',
                      fontSize: '12px', fontWeight: '700', padding: '3px 11px',
                      borderRadius: '20px', letterSpacing: '0.3px',
                    }}>{unreadCount} Unread</span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: '#74c69d', margin: '5px 0 0', letterSpacing: '0.2px' }}>
                  Stay updated with your latest activity.
                </p>
              </div>
            </div>

            {/* Stats + Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { icon: Bell,        value: unreadCount,           label: 'Unread',       color: '#b7e4c7' },
                  { icon: Flag,        value: notifications.filter(n => n.type === 'content_reported').length, label: 'Reports', color: '#ffd166' },
                  { icon: Megaphone,   value: notifications.length,  label: 'Total',        color: '#74c69d' },
                ].map(({ icon: Icon, value, label, color }) => (
                  <div key={label} style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: '12px', minWidth: '120px',
                  }}>
                    <Icon size={18} color={color} />
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>{value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Filter chips */}
                {[
                  { key: 'all',     label: 'All'          },
                  { key: 'unread',  label: 'Unread'       },
                  { key: 'reports', label: 'Reports'      },
                  { key: 'admin',   label: 'Admin Actions'},
                ].map(f => (
                  <button key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: activeFilter === f.key ? '#74c69d' : 'rgba(255,255,255,0.1)',
                      color: activeFilter === f.key ? '#0d2818' : 'white',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: '600',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >{f.label}</button>
                ))}

                <button
                  onClick={markAllAsRead}
                  disabled={loading.action || unreadCount === 0}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: 'white', border: '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: (loading.action || unreadCount === 0) ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                >
                  <CheckCheck size={13} /> Mark All Read
                </button>

                <button
                  onClick={clearAllNotifications}
                  disabled={loading.action || notifications.length === 0}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    color: '#fca5a5', border: '1.5px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: (loading.action || notifications.length === 0) ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <Trash2 size={13} /> Clear All
                </button>

                <button
                  onClick={() => { setSelectedItem(null); fetchNotifications(1); }}
                  disabled={isLoading}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: 'white', border: '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                >
                  <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                  {isLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content panel ─────────────────────────────────────── */}
        <main style={{
          flex: 1, maxWidth: '1200px', margin: '-24px auto 40px',
          padding: '0 24px', width: '100%', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '18px',
            boxShadow: '0 4px 24px rgba(27,67,50,0.1)',
            overflow: 'hidden', border: '1px solid #e0ede4',
            display: 'flex', minHeight: '600px',
            animation: 'slideUp 0.4s ease both',
          }}>

            {/* ── LEFT LIST PANEL ──────────────────────────────────────── */}
            <div style={{
              width: '340px', minWidth: '340px',
              borderRight: '1px solid #e9f0eb',
              display: 'flex', flexDirection: 'column',
              backgroundColor: 'white',
            }}>
              {/* List header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #e9f0eb',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h2 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#6b705c', fontFamily: "'DM Sans', sans-serif" }}>
                  {activeFilter === 'all'     ? 'All Notifications'  :
                   activeFilter === 'unread'  ? 'Unread'             :
                   activeFilter === 'reports' ? 'Reports'            : 'Admin Actions'}
                </h2>
                {filteredNotifications.length > 0 && (
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    backgroundColor: '#d8f3dc', color: '#1b4332',
                    padding: '2px 8px', borderRadius: '20px',
                  }}>{filteredNotifications.length}</span>
                )}
              </div>

              {/* List body */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading && notifications.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
                    <Loader2 size={30} color="#2d6a4f" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: '#6b705c' }}>Loading notifications…</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '14px',
                      backgroundColor: '#f0faf3', border: '1.5px solid #b7e4c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bell size={26} color="#52b788" strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>
                      No Notifications
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b705c', margin: 0, textAlign: 'center' }}>
                      {activeFilter === 'unread'  ? 'You have no unread notifications'  :
                       activeFilter === 'reports' ? 'No report notifications'           :
                       activeFilter === 'admin'   ? 'No admin action notifications'     :
                       "You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredNotifications.map(renderListItem)}
                    {hasMore && (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={loadMoreNotifications}
                          disabled={loading.notifications}
                          style={{
                            padding: '9px 20px', background: 'none',
                            border: '1.5px solid #b7e4c7', borderRadius: '9px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            color: '#2d6a4f', fontFamily: "'DM Sans', sans-serif",
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          {loading.notifications
                            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                            : 'Load More'
                          }
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── RIGHT DETAIL PANEL ───────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fafcfa', minWidth: 0 }}>
              {selectedItem ? (
                <>
                  {/* Detail header bar */}
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid #e9f0eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: 'white',
                  }}>
                    <button
                      onClick={() => setSelectedItem(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '7px 14px',
                        background: 'none', border: '1.5px solid #e0ede4',
                        borderRadius: '8px', cursor: 'pointer',
                        fontSize: '13px', color: '#2d6a4f', fontWeight: '600',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0faf3'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ArrowLeft size={13} /> Back
                    </button>
                    <span style={{ fontSize: '12px', color: '#a3b18a' }}>
                      {formatDate(selectedItem.createdAt)}
                    </span>
                  </div>

                  {/* Scrollable detail */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {renderDetailContent(selectedItem)}
                  </div>
                </>
              ) : (
                // Empty state
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '14px', padding: '40px',
                }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '20px',
                    backgroundColor: '#f0faf3', border: '1.5px solid #b7e4c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'heroFloat 4s ease-in-out infinite',
                  }}>
                    <Bell size={36} color="#52b788" strokeWidth={1.5} />
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>
                    Select a Notification
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b705c', margin: 0, textAlign: 'center', maxWidth: '260px', lineHeight: 1.6 }}>
                    Choose a notification from the list to view its details and take action.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <UserFooter />
      </div>
    </>
  );
};

export default NotificationsPage;