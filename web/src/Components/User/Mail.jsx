// RubberSense/Web/src/Components/User/Mail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Inbox, RefreshCw, CheckCheck, Mail as MailIcon, Megaphone, Star, AlertTriangle,
  Leaf, ChevronRight, ArrowLeft, Send, X, Clock, Calendar,
  MessageSquare, Eye, Loader2, Bell, Filter
} from 'lucide-react';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

const Mail = () => {
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [combinedItems, setCombinedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    announcements: 0,
    total: 0
  });
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchMessages();
    fetchAnnouncements();
    fetchUnreadCounts();
  }, []);

  useEffect(() => {
    if (!loading && !announcementsLoading) {
      combineMessagesAndAnnouncements();
    }
  }, [messages, announcements, loading, announcementsLoading, showUnreadOnly]);

  const combineMessagesAndAnnouncements = () => {
    const announcementItems = announcements.map(announcement => ({
      ...announcement,
      _id: `announcement_${announcement._id}`,
      isAnnouncement: true,
      sender: 'Admin',
      subject: announcement.title,
      message: announcement.content,
      createdAt: announcement.publishDate || announcement.createdAt,
      updatedAt: announcement.publishDate || announcement.updatedAt,
      isRead: announcement.readBy && announcement.readBy.some(read => read.userId),
      type: announcement.type,
      priority: announcement.priority || 'medium',
      isImportant: announcement.isImportant,
      views: announcement.views || 0,
      expiryDate: announcement.expiryDate,
      readBy: announcement.readBy || [],
      viewedBy: announcement.viewedBy || []
    }));

    const messageItems = messages.map(message => ({
      ...message,
      isAnnouncement: false,
      sender: 'Admin',
      subject: message.subject || 'Your inquiry',
      priority: 'medium'
    }));

    let combined = [...messageItems, ...announcementItems];

    if (showUnreadOnly) {
      combined = combined.filter(item => {
        if (item.isAnnouncement) {
          return !item.isRead;
        } else {
          return !item.readByUser || hasUnreadAdminReplies(item);
        }
      });
    }

    combined.sort((a, b) => {
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    setCombinedItems(combined);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please login to view messages', 'error');
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/v1/contact/user/replies`);
      if (response.data.success) {
        const sortedMessages = response.data.data.sort((a, b) => {
          if (!a.isRead && b.isRead) return -1;
          if (a.isRead && !b.isRead) return 1;
          const aHasNewReplies = hasUnreadAdminReplies(a);
          const bHasNewReplies = hasUnreadAdminReplies(b);
          if (aHasNewReplies && !bHasNewReplies) return -1;
          if (!aHasNewReplies && bHasNewReplies) return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        showNotification('Session expired. Please login again.', 'error');
        navigate('/login');
      } else {
        showNotification('Failed to load messages', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setAnnouncementsLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/v1/mail/announcements`);
      if (response.data.success) {
        setAnnouncements(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const messagesRes = await axios.get(
        `${API_BASE_URL}/api/v1/contact/user/unread/count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const announcementsRes = await axios.get(
        `${API_BASE_URL}/api/v1/mail/unread/count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (messagesRes.data.success && announcementsRes.data.success) {
        setUnreadCounts({
          messages: messagesRes.data.data.unreadMessages || 0,
          announcements: announcementsRes.data.data.unreadCount || 0,
          total: (messagesRes.data.data.unreadMessages || 0) + (announcementsRes.data.data.unreadCount || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const hasUnreadAdminReplies = (message) => {
    if (!message.userReplies || message.userReplies.length === 0) {
      return message.reply && !message.readByUser;
    }
    return message.userReplies.some(userReply =>
      userReply.adminReplies && userReply.adminReplies.some(adminReply => !adminReply.readByUser)
    );
  };

  const getLatestReplyDate = (message) => {
    if (!message.userReplies || message.userReplies.length === 0) {
      return message.repliedAt || message.updatedAt;
    }
    let latestDate = new Date(message.repliedAt || message.updatedAt);
    message.userReplies.forEach(userReply => {
      const userReplyDate = new Date(userReply.date);
      if (userReplyDate > latestDate) latestDate = userReplyDate;
      if (userReply.adminReplies) {
        userReply.adminReplies.forEach(adminReply => {
          const adminReplyDate = new Date(adminReply.date);
          if (adminReplyDate > latestDate) latestDate = adminReplyDate;
        });
      }
    });
    return latestDate;
  };

  const handleSendReply = async () => {
    if (!selectedItem || !replyText.trim() || selectedItem.isAnnouncement) {
      showNotification('Please enter your reply message', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please login to send reply', 'error');
      navigate('/login');
      return;
    }
    setSending(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/contact/user/reply`,
        { originalMessageId: selectedItem._id, reply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        showNotification('Reply sent successfully');
        setReplyText('');
        const updatedMessage = response.data.data;
        setSelectedItem(updatedMessage);
        setMessages(prev => prev.map(msg =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ));
        fetchUnreadCounts();
      } else {
        showNotification(response.data.message || 'Failed to send reply', 'error');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showNotification('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return 'Today, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const markMessageAsRead = async (messageId) => {
    if (messageId.startsWith('announcement_')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/v1/contact/user/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
      if (selectedItem && selectedItem._id === messageId) {
        setSelectedItem(prev => ({ ...prev, isRead: true }));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAnnouncementAsRead = async (announcementId) => {
    const realAnnouncementId = announcementId.replace('announcement_', '');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/v1/mail/announcements/${realAnnouncementId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnouncements(prev => prev.map(ann => {
        if (ann._id === realAnnouncementId) {
          return { ...ann, readBy: [...(ann.readBy || []), { userId: 'current-user', readAt: new Date() }] };
        }
        return ann;
      }));
      setUnreadCounts(prev => ({
        ...prev,
        announcements: Math.max(0, prev.announcements - 1),
        total: Math.max(0, prev.total - 1)
      }));
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const markAdminReplyAsRead = async (messageId, userReplyIndex, adminReplyIndex) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/v1/contact/user/mark-reply-read`,
        { messageId, userReplyIndex, adminReplyIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCounts(prev => ({
        ...prev,
        messages: Math.max(0, prev.messages - 1),
        total: Math.max(0, prev.total - 1)
      }));
    } catch (error) {
      console.error('Error marking admin reply as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.put(`${API_BASE_URL}/api/v1/contact/user/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await axios.put(`${API_BASE_URL}/api/v1/mail/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchMessages();
      fetchAnnouncements();
      fetchUnreadCounts();
      showNotification('All items marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showNotification('Failed to mark all as read', 'error');
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    if (item.isAnnouncement) {
      if (!item.isRead) markAnnouncementAsRead(item._id);
    } else {
      if (!item.isRead) markMessageAsRead(item._id);
      if (item.userReplies) {
        item.userReplies.forEach((userReply, userIndex) => {
          if (userReply.adminReplies) {
            userReply.adminReplies.forEach((adminReply, adminIndex) => {
              if (!adminReply.readByUser) markAdminReplyAsRead(item._id, userIndex, adminIndex);
            });
          }
        });
      }
      if (item.reply && !item.readByUser) markAdminReplyAsRead(item._id);
    }
  };

  // ─── Priority & Type configs (matching GetAnnouncement style) ────────────────
  const TYPE_CONFIG = {
    announcement: { color: '#2d6a4f', bg: '#d8f3dc' },
    update:       { color: '#1b4332', bg: '#b7e4c7' },
    maintenance:  { color: '#6b705c', bg: '#e9edc9' },
    news:         { color: '#386641', bg: '#cddabd' },
    alert:        { color: '#bc4749', bg: '#fde8e8' },
    message:      { color: '#2d6a4f', bg: '#d8f3dc' },
  };

  const PRIORITY_CONFIG = {
    urgent: { color: '#bc4749', bg: '#fde8e8', label: 'Urgent' },
    high:   { color: '#ca6702', bg: '#fff1e6', label: 'High'   },
    medium: { color: '#2d6a4f', bg: '#d8f3dc', label: 'Medium' },
    low:    { color: '#386641', bg: '#cddabd', label: 'Low'    },
  };

  // ─── List Item ─────────────────────────────────────────────────────────────
  const renderListItem = (item) => {
    const isAnnouncement = item.isAnnouncement;
    const latestDate = isAnnouncement ? item.updatedAt || item.createdAt : getLatestReplyDate(item);
    const hasUnreadContent = isAnnouncement
      ? !item.isRead
      : (!item.readByUser || hasUnreadAdminReplies(item));
    const isActive = selectedItem?._id === item._id;
    const totalReplies = isAnnouncement ? 0 : (item.userReplies ? item.userReplies.length : 0);
    const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.message;
    const priorityConf = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
    const dateObj = new Date(latestDate);

    return (
      <div
        key={item._id}
        onClick={() => handleSelectItem(item)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          backgroundColor: isActive ? '#e8f5ee' : hasUnreadContent ? '#f7fdf9' : 'white',
          borderBottom: '1px solid #e9f0eb',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          fontFamily: "'DM Sans', sans-serif",
          borderLeft: isActive ? '3px solid #2d6a4f' : hasUnreadContent ? '3px solid #52b788' : '3px solid transparent',
          position: 'relative',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f0faf3'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? '#e8f5ee' : hasUnreadContent ? '#f7fdf9' : 'white'; }}
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

        {/* Type badge */}
        <div style={{ width: '42px', minWidth: '42px', display: 'flex', justifyContent: 'center', padding: '0 4px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            backgroundColor: typeConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isAnnouncement
              ? <Megaphone size={13} color={typeConf.color} strokeWidth={2} />
              : <MailIcon size={13} color={typeConf.color} strokeWidth={2} />
            }
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '14px 10px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '13.5px', fontWeight: hasUnreadContent ? '700' : '600',
              color: '#1b4332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isAnnouncement ? (item.subject || item.title) : `Admin`}
            </span>
            {hasUnreadContent && (
              <span style={{
                backgroundColor: '#2d6a4f', color: 'white',
                fontSize: '9px', fontWeight: '700', padding: '1px 6px',
                borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
              }}>NEW</span>
            )}
            {item.isImportant && <Star size={11} color="#ca6702" fill="#ca6702" style={{ flexShrink: 0 }} />}
          </div>
          <p style={{
            fontSize: '12px', color: '#6b705c', margin: '0 0 6px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isAnnouncement
              ? (item.content || item.message)?.substring(0, 55) + '...'
              : `Re: ${item.subject || 'Your inquiry'}`
            }
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isAnnouncement && (
              <span style={{
                fontSize: '10px', fontWeight: '600', padding: '1px 7px',
                borderRadius: '5px', textTransform: 'capitalize',
                backgroundColor: typeConf.bg, color: typeConf.color,
              }}>{item.type}</span>
            )}
            <span style={{
              fontSize: '10px', fontWeight: '600', padding: '1px 7px',
              borderRadius: '5px',
              backgroundColor: priorityConf.bg, color: priorityConf.color,
            }}>{priorityConf.label}</span>
            {!isAnnouncement && totalReplies > 0 && (
              <span style={{ fontSize: '10px', color: '#6b705c', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MessageSquare size={10} /> {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
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

  // ─── Message Detail Content ────────────────────────────────────────────────
  const renderMessageContent = (item) => {
    if (item.isAnnouncement) return renderAnnouncementContent(item);
    return (
      <div style={{ padding: '28px', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header card */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fdf9 0%, #e8f5ee 100%)',
          border: '1px solid #b7e4c7', borderRadius: '14px',
          padding: '20px 24px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: "'Lora', serif" }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1b4332', fontFamily: "'Lora', serif" }}>Admin</div>
              <div style={{ fontSize: '12px', color: '#6b705c', marginTop: '2px' }}>
                Re: {item.subject || 'Your inquiry'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b705c' }}>
            <Calendar size={11} color="#2d6a4f" />
            {formatFullDate(item.repliedAt || item.updatedAt)}
          </div>
        </div>

        {/* Original message */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b705c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            Your original message
          </p>
          <div style={{
            background: '#f7fdf9', border: '1px solid #d8f3dc',
            borderRadius: '12px', padding: '16px 20px',
          }}>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#344e41', margin: 0 }}>{item.message}</p>
            <p style={{ fontSize: '11px', color: '#a3b18a', marginTop: '10px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} /> Sent: {formatFullDate(item.createdAt)}
            </p>
          </div>
        </div>

        {/* Admin first reply */}
        {item.reply && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b705c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Admin's reply
            </p>
            <div style={{
              background: 'linear-gradient(135deg, #e8f5ee 0%, #d8f3dc 100%)',
              border: '1px solid #b7e4c7', borderRadius: '12px', padding: '16px 20px',
            }}>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1b4332', margin: 0 }}>{item.reply}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <p style={{ fontSize: '11px', color: '#52b788', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} /> {formatFullDate(item.repliedAt)}
                </p>
                {item.readByUser && (
                  <span style={{ fontSize: '11px', color: '#2d6a4f', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCheck size={11} /> Read
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversation thread */}
        {item.userReplies && item.userReplies.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b705c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
              Conversation
            </p>
            {item.userReplies.map((userReply, index) => (
              <React.Fragment key={index}>
                {/* User reply bubble */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{
                      background: '#f0faf3', border: '1px solid #d8f3dc',
                      borderRadius: '12px 12px 2px 12px', padding: '14px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          backgroundColor: '#d8f3dc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ color: '#1b4332', fontWeight: '700', fontSize: '12px' }}>Y</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1b4332' }}>You</span>
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#344e41', margin: 0 }}>{userReply.text}</p>
                      <p style={{ fontSize: '11px', color: '#a3b18a', marginTop: '8px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {formatFullDate(userReply.date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin replies */}
                {userReply.adminReplies && userReply.adminReplies.map((adminReply, adminIndex) => (
                  <div key={adminIndex} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #e8f5ee 0%, #d8f3dc 100%)',
                        border: '1px solid #b7e4c7',
                        borderRadius: '12px 12px 12px 2px', padding: '14px 18px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ color: 'white', fontWeight: '700', fontSize: '12px' }}>A</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1b4332' }}>Admin</span>
                          {adminReply.readByUser && (
                            <span style={{ fontSize: '10px', color: '#2d6a4f', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <CheckCheck size={10} /> Read
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#1b4332', margin: 0 }}>{adminReply.text}</p>
                        <p style={{ fontSize: '11px', color: '#52b788', marginTop: '8px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={10} /> {formatFullDate(adminReply.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAnnouncementContent = (announcement) => {
    const typeConf = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.announcement;
    const priorityConf = PRIORITY_CONFIG[announcement.priority] || PRIORITY_CONFIG.medium;
    const isRead = announcement.readBy && announcement.readBy.length > 0;

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
              borderRadius: '6px', backgroundColor: typeConf.bg, color: typeConf.color, textTransform: 'capitalize',
            }}>{announcement.type}</span>
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '3px 10px',
              borderRadius: '6px', backgroundColor: priorityConf.bg, color: priorityConf.color,
            }}>{priorityConf.label} Priority</span>
            {announcement.isImportant && (
              <span style={{
                fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                borderRadius: '6px', backgroundColor: '#fff1e6', color: '#ca6702',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <Star size={10} fill="#ca6702" color="#ca6702" /> Important
              </span>
            )}
            {isRead && (
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                borderRadius: '6px', backgroundColor: '#d8f3dc', color: '#2d6a4f',
                display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto',
              }}>
                <CheckCheck size={10} /> Read
              </span>
            )}
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1b4332', margin: '0 0 12px', lineHeight: 1.35, fontFamily: "'Lora', serif" }}>
            {announcement.title}
          </h2>

          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b705c', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={11} color="#2d6a4f" />
              {formatFullDate(announcement.publishDate || announcement.createdAt)}
            </span>
            {announcement.createdBy?.name && (
              <span>By: {announcement.createdBy.name}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={11} color="#2d6a4f" /> {announcement.views || 0} views
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{
          background: 'white', border: '1px solid #e9f0eb', borderRadius: '12px', padding: '24px',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '15px', lineHeight: '1.85', color: '#344e41', margin: 0, whiteSpace: 'pre-wrap' }}>
            {announcement.content || announcement.message}
          </p>
        </div>

        {/* Expiry */}
        {announcement.expiryDate && (
          <div style={{
            padding: '13px 18px', backgroundColor: '#f0faf3',
            borderRadius: '10px', border: '1px solid #b7e4c7',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '13px', color: '#2d6a4f',
          }}>
            <Calendar size={14} color="#2d6a4f" />
            <span>Expires on <strong>{formatFullDate(announcement.expiryDate)}</strong></span>
          </div>
        )}

        {/* Read timestamp */}
        {isRead && announcement.readBy?.[0]?.readAt && (
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#a3b18a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCheck size={11} /> Read by you on {formatDate(announcement.readBy[0].readAt)}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const isLoading = loading || announcementsLoading;

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

        {/* Toast notification */}
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

        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2818 0%, #1b4332 55%, #2d6a4f 100%)',
          padding: '48px 24px 60px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', right: '-40px', top: '-30px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(82,183,136,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '80px', bottom: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(52,143,96,0.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '-20px', bottom: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(163,209,141,0.06)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.15)',
                animation: 'heroFloat 4s ease-in-out infinite',
              }}>
                <Inbox size={28} color="#74c69d" strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0, fontFamily: "'Lora', serif" }}>
                    Inbox
                  </h1>
                  {unreadCounts.total > 0 && (
                    <span style={{
                      backgroundColor: '#74c69d', color: '#0d2818',
                      fontSize: '12px', fontWeight: '700', padding: '3px 11px',
                      borderRadius: '20px', letterSpacing: '0.3px',
                    }}>
                      {unreadCounts.total} Unread
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: '#74c69d', margin: '5px 0 0', letterSpacing: '0.2px' }}>
                  Messages & announcements from the plantation.
                </p>
              </div>
            </div>

            {/* Stats + Actions row */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { icon: MailIcon,     value: unreadCounts.messages,      label: 'Unread Messages',      color: '#b7e4c7' },
                  { icon: Bell,     value: unreadCounts.announcements,  label: 'Unread Announcements', color: '#ffd166' },
                  { icon: Inbox,    value: combinedItems.length,        label: 'Total Items',          color: '#74c69d' },
                ].map(({ icon: Icon, value, label, color }) => (
                  <div key={label} style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: '12px', minWidth: '140px',
                  }}>
                    <Icon size={18} color={color} />
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>{value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons in hero */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  disabled={isLoading}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: showUnreadOnly ? '#74c69d' : 'rgba(255,255,255,0.1)',
                    color: showUnreadOnly ? '#0d2818' : 'white',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s', opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  <Filter size={13} />
                  {showUnreadOnly ? 'Show All' : 'Unread Only'}
                </button>

                {unreadCounts.total > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      color: 'white', border: '1.5px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '7px',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.2s', opacity: isLoading ? 0.6 : 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                  >
                    <CheckCheck size={13} /> Mark All Read
                  </button>
                )}

                <button
                  onClick={() => { fetchMessages(); fetchAnnouncements(); fetchUnreadCounts(); }}
                  disabled={isLoading}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: 'white', border: '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s', opacity: isLoading ? 0.6 : 1,
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

        {/* Main content panel */}
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

            {/* ─── LEFT LIST PANEL ──────────────────────────────── */}
            <div style={{
              width: '340px', minWidth: '340px',
              borderRight: '1px solid #e9f0eb',
              display: 'flex', flexDirection: 'column',
              backgroundColor: 'white',
            }}>
              {/* List header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e9f0eb',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h2 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#6b705c', fontFamily: "'DM Sans', sans-serif" }}>
                  {showUnreadOnly ? 'Unread Items' : 'Messages & Announcements'}
                </h2>
                {combinedItems.length > 0 && (
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    backgroundColor: '#d8f3dc', color: '#1b4332',
                    padding: '2px 8px', borderRadius: '20px',
                  }}>
                    {combinedItems.length}
                  </span>
                )}
              </div>

              {/* List body */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
                    <Loader2 size={30} color="#2d6a4f" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: '#6b705c' }}>Loading messages…</span>
                  </div>
                ) : combinedItems.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
                    <div style={{ fontSize: '40px', lineHeight: 1 }}>🌿</div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>
                      {showUnreadOnly ? 'No Unread Items' : 'No Messages Yet'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b705c', margin: 0, textAlign: 'center' }}>
                      {showUnreadOnly ? 'All caught up!' : 'Admin replies will appear here.'}
                    </p>
                  </div>
                ) : (
                  combinedItems.map(renderListItem)
                )}
              </div>
            </div>

            {/* ─── RIGHT DETAIL PANEL ───────────────────────────── */}
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
                  </div>

                  {/* Scrollable detail content */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {renderMessageContent(selectedItem)}
                  </div>

                  {/* Reply section (messages only) */}
                  {!selectedItem.isAnnouncement && (
                    <div style={{
                      padding: '20px 28px', borderTop: '1px solid #e9f0eb',
                      backgroundColor: 'white',
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b705c', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', marginTop: 0 }}>
                        Reply to Admin
                      </p>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply…"
                        rows="3"
                        style={{
                          width: '100%', padding: '14px 16px',
                          border: '1.5px solid #dde8df', borderRadius: '10px',
                          fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
                          resize: 'vertical', marginBottom: '12px',
                          backgroundColor: '#f7fdf9', color: '#1b4332',
                          outline: 'none', transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#2d6a4f'}
                        onBlur={e => e.target.style.borderColor = '#dde8df'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          onClick={() => { setReplyText(''); setSelectedItem(null); }}
                          disabled={sending}
                          style={{
                            padding: '9px 20px', background: 'none',
                            border: '1.5px solid #dde8df', borderRadius: '9px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            color: '#6b705c', fontFamily: "'DM Sans', sans-serif",
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          <X size={13} /> Cancel
                        </button>
                        <button
                          onClick={handleSendReply}
                          disabled={sending || !replyText.trim()}
                          style={{
                            padding: '9px 20px',
                            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                            border: 'none', borderRadius: '9px',
                            cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '13px', fontWeight: '600', color: 'white',
                            fontFamily: "'DM Sans', sans-serif",
                            display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: sending || !replyText.trim() ? 0.65 : 1,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          {sending
                            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                            : <><Send size={13} /> Send Reply</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
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
                    <MailIcon size={36} color="#52b788" strokeWidth={1.5} />
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>
                    {showUnreadOnly ? 'No Unread Items Selected' : 'Select a Message'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b705c', margin: 0, textAlign: 'center', maxWidth: '260px', lineHeight: 1.6 }}>
                    {showUnreadOnly
                      ? 'All unread items have been read.'
                      : 'Choose a message or announcement from the list to view details.'}
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

export default Mail;