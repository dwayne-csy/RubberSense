import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  InputBase,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Tooltip,
  Fade,
  Container
} from '@mui/material';
import {
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Delete as DeleteIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Info as InfoIcon,
  MarkChatRead as MarkChatReadIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
  LockOpen as UnblockIcon,
  VisibilityOff as HiddenIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

// Import UserHeader component
import UserHeader from '../layouts/UserHeader';
// Import UserFooter component
import UserFooter from '../layouts/UserFooter';

// Create axios instance with base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to get current user ID from JWT token
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.userId || payload.sub;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }
  return null;
};

// Helper function to get avatar URL
const getAvatarUrl = (userData) => {
  if (!userData) return null;
  
  const possiblePaths = [
    userData.profilePicture?.url,
    userData.avatar?.url,
    userData.avatar,
    userData.profilePicture,
    userData.imageUrl,
    userData.profileImage,
    userData.photoURL
  ];
  
  for (const avatarPath of possiblePaths) {
    if (avatarPath) {
      if (typeof avatarPath === 'string' && avatarPath.startsWith('http')) {
        return avatarPath;
      }
      if (avatarPath.url && avatarPath.url.startsWith('http')) {
        return avatarPath.url;
      }
      if (typeof avatarPath === 'string' && avatarPath.startsWith('/')) {
        return `${API_BASE_URL}${avatarPath}`;
      }
      if (typeof avatarPath === 'string') {
        return `${API_BASE_URL}/${avatarPath}`;
      }
    }
  }
  
  return null;
};

// ─── Global styles ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  @keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp   { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes spin      { to { transform: rotate(360deg) } }
  @keyframes heroFloat { 0%,100% { transform: translateY(0px) rotate(-2deg) } 50% { transform: translateY(-8px) rotate(2deg) } }
  .msg-sidebar-row:hover { background-color: #f0faf3 !important; }
  *, *::before, *::after { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f4f9f4; }
  ::-webkit-scrollbar-thumb { background: #b7e4c7; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #74c69d; }
`;

const MessageComponent = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [messageRequests, setMessageRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState('');
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [messageToReport, setMessageToReport] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState({
    conversations: false,
    messages: false,
    sending: false,
    requests: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [userToUnblock, setUserToUnblock] = useState(null);
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [infoBannerMessage, setInfoBannerMessage] = useState('');
  const [isRequestConversation, setIsRequestConversation] = useState(false);
  const [conversationStatus, setConversationStatus] = useState(null);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // ─── All original logic (unchanged) ──────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError('Please login to access messages');
      navigate('/login');
      return;
    }
    const userIdFromToken = getCurrentUserId();
    setCurrentUserId(userIdFromToken);
    fetchAllConversations();
    fetchUnreadCount();
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      loadUserConversation(userId);
    } else {
      const searchParams = new URLSearchParams(location.search);
      const requestId = searchParams.get('request');
      if (requestId) {
        handleMessageRequestNotification(requestId);
      }
    }
  }, [userId, location.search]);

  useEffect(() => {
    if (selectedUser) {
      checkIfUserIsBlocked(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (selectedUser) {
        fetchMessages(selectedUser);
      }
      fetchUnreadCount();
      if (activeTab === 1) {
        fetchMessageRequests();
      }
    }, 15000);
    return () => clearInterval(pollInterval);
  }, [selectedUser, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  const checkIfUserIsBlocked = async (targetUserId) => {
    console.log(`🔍 [BLOCK CHECK] Checking block status between current user and ${targetUserId}`);
    try {
      const currentUserResponse = await api.get('/api/v1/users/me');
      if (currentUserResponse.data.success && currentUserResponse.data.data) {
        const currentUserProfile = currentUserResponse.data.data;
        const blockedUsers = currentUserProfile.blockedUsers || [];
        console.log('🚫 [BLOCK CHECK] Current user has blocked:', blockedUsers);
        const hasCurrentUserBlocked = blockedUsers.some(blockedUserId => 
          blockedUserId?.toString() === targetUserId.toString()
        );
        if (hasCurrentUserBlocked) {
          console.log(`✅ [BLOCK CHECK] Current user has blocked ${targetUserId}`);
          setIsUserBlocked(true);
          return;
        }
        try {
          const targetUserResponse = await api.get(`/api/v1/users/${targetUserId}`);
          if (targetUserResponse.data.success && targetUserResponse.data.data) {
            const targetUserProfile = targetUserResponse.data.data;
            const targetBlockedUsers = targetUserProfile.blockedUsers || [];
            console.log(`🚫 [BLOCK CHECK] Target user ${targetUserId} has blocked:`, targetBlockedUsers);
            const currentUserId = currentUserProfile._id || currentUserProfile.id;
            const hasTargetUserBlocked = targetBlockedUsers.some(blockedUserId => 
              blockedUserId?.toString() === currentUserId.toString()
            );
            if (hasTargetUserBlocked) {
              console.log(`✅ [BLOCK CHECK] Target user ${targetUserId} has blocked current user`);
              setIsUserBlocked(true);
              return;
            }
          }
        } catch (targetUserError) {
          console.error('❌ [BLOCK CHECK] Error getting target user profile:', targetUserError);
        }
        console.log(`✅ [BLOCK CHECK] No blocking relationship found`);
        setIsUserBlocked(false);
      }
    } catch (error) {
      console.error('❌ [BLOCK CHECK] Error getting current user profile:', error);
      setIsUserBlocked(false);
    }
  };

  const handleMessageRequestNotification = async (requestId) => {
    try {
      const response = await api.get(`/api/v1/messages/requests/${requestId}`);
      if (response.data.success && response.data.data) {
        const request = response.data.data;
        setSelectedUser(request.sender?._id || request.sender);
        setSelectedUserName(request.sender?.name || 'User');
        setSelectedUserAvatar(getAvatarUrl(request.sender));
        setSelectedUserData(request.sender);
        setIsRequestConversation(true);
        setConversationStatus('pending');
        setActiveTab(1);
        fetchMessages(request.sender?._id || request.sender);
      }
    } catch (error) {
      console.error('Error loading message request:', error);
    }
  };

  const loadUserConversation = async (targetUserId) => {
    try {
      const userResponse = await api.get(`/api/v1/users/${targetUserId}`);
      if (userResponse.data.success) {
        const userData = userResponse.data.data;
        setSelectedUserData(userData);
        setSelectedUserName(userData?.name || 'User');
        setSelectedUserAvatar(getAvatarUrl(userData) || '');
        setSelectedUser(targetUserId);
        fetchMessages(targetUserId);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setSelectedUserName('User');
      setSelectedUser(targetUserId);
      fetchMessages(targetUserId);
    }
  };

  const fetchAllConversations = async () => {
    setLoading(prev => ({ ...prev, conversations: true }));
    try {
      const response = await api.get('/api/v1/messages/conversations');
      console.log('📊 Conversations API Response:', response.data);
      if (response.data.success) {
        const acceptedConvs = response.data.acceptedConversations || [];
        console.log('✅ Accepted conversations:', acceptedConvs.length);
        setConversations(acceptedConvs);
        setPendingRequestsCount(response.data.requestsCount || 0);
        const totalUnread = acceptedConvs.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
        if (selectedUser) {
          const isInConversations = acceptedConvs.some(conv => conv.userId === selectedUser);
          if (isInConversations) {
            setIsRequestConversation(false);
            setConversationStatus('accepted');
            setActiveTab(0);
          }
        }
      } else {
        setError('Failed to load conversations: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error fetching all conversations:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load conversations. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, conversations: false }));
    }
  };

  const fetchMessageRequests = async () => {
    setLoading(prev => ({ ...prev, requests: true }));
    try {
      const response = await api.get('/api/v1/messages/requests');
      console.log('📨 Message requests response:', response.data);
      if (response.data.success) {
        const requests = response.data.data || [];
        console.log('📨 Fetched', requests.length, 'message requests');
        setMessageRequests(requests);
        setPendingRequestsCount(response.data.count || requests.length);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load message requests');
      }
    } finally {
      setLoading(prev => ({ ...prev, requests: false }));
    }
  };

  const fetchMessages = async (targetUserId) => {
    if (!targetUserId) return;
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      const response = await api.get(`/api/v1/messages/conversation/${targetUserId}`);
      if (response.data.success) {
        const fetchedMessages = response.data.data || [];
        setMessages(fetchedMessages);
        const status = response.data.conversationStatus || 'pending';
        setConversationStatus(status);
        if (status === 'accepted') {
          setIsRequestConversation(false);
          setShowInfoBanner(false);
        } else {
          const hasPendingRequests = fetchedMessages.some(
            msg => msg.isRequest && msg.status === 'pending'
          );
          if (hasPendingRequests) {
            setIsRequestConversation(true);
            setShowInfoBanner(true);
            setInfoBannerMessage('This is a message request. Wait for the User to Accept the Message Request to start chatting.');
          } else {
            setIsRequestConversation(false);
            setShowInfoBanner(false);
          }
        }
      } else {
        setError('Failed to load messages: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.status === 403) {
        const errorMsg = error.response.data?.message || 'You cannot view this conversation';
        setError(errorMsg);
        setShowInfoBanner(true);
        setInfoBannerMessage(errorMsg);
      }
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/v1/messages/unread-count');
      if (response.data.success) {
        const data = response.data.data || response.data;
        setUnreadCount(data.unreadCount || 0);
        setPendingRequestsCount(data.pendingRequestsCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || loading.sending) return;
    setLoading(prev => ({ ...prev, sending: true }));
    setError('');
    try {
      const response = await api.post('/api/v1/messages/send', {
        recipientId: selectedUser,
        content: newMessage
      });
      if (response.data.success) {
        const message = response.data.data;
        setNewMessage('');
        if (response.data.isRequest) {
          setSuccess('Message request sent! The user needs to accept it first.');
          setIsRequestConversation(true);
          setConversationStatus('pending');
          setShowInfoBanner(true);
          setInfoBannerMessage('Message request sent. You can chat once the user accepts your request.');
          const hasPendingRequest = messageRequests.some(req => 
            req.sender?._id === selectedUser || 
            req.sender === selectedUser ||
            req.userId === selectedUser
          );
          if (!hasPendingRequest) {
            const newRequest = {
              _id: message._id,
              sender: message.sender || { _id: message.sender, name: selectedUserName },
              recipient: message.recipient,
              content: message.content,
              isRequest: true,
              status: 'pending',
              createdAt: new Date().toISOString()
            };
            setMessageRequests(prev => [newRequest, ...prev]);
            setPendingRequestsCount(prev => prev + 1);
          }
        } else {
          setSuccess('Message sent!');
          setIsRequestConversation(false);
          setConversationStatus('accepted');
          setShowInfoBanner(false);
        }
        setMessages(prev => [...prev, message]);
        fetchAllConversations();
        fetchUnreadCount();
        setTimeout(scrollToBottom, 100);
      } else {
        setError(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      const errorData = error.response?.data;
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.status === 403) {
        const errorMsg = errorData?.message || 'You cannot message this user';
        setError(errorMsg);
        setShowInfoBanner(true);
        setInfoBannerMessage(errorMsg);
      } else if (error.response?.status === 400) {
        setError(errorData?.message || 'Invalid message');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  const acceptMessageRequest = async (messageId, senderId, senderName, senderAvatar) => {
    if (!messageId) {
      setError('Invalid message request');
      console.error('No message ID provided for acceptance');
      return;
    }
    try {
      const response = await api.put(`/api/v1/messages/requests/${messageId}/accept`);
      if (response.data.success) {
        setSuccess('Message request accepted! You can now chat normally.');
        setIsRequestConversation(false);
        setConversationStatus('accepted');
        setShowInfoBanner(false);
        setMessageRequests(prev => prev.filter(req => {
          const reqId = req._id || req.id || req.messageId;
          const reqSenderId = req.sender?._id || req.sender || req.userId;
          return !(reqId === messageId || reqSenderId === senderId);
        }));
        const newConversation = {
          userId: senderId,
          name: senderName,
          avatar: senderAvatar,
          lastMessage: { content: 'Message request accepted', createdAt: new Date().toISOString() },
          unreadCount: 0,
          pendingRequests: 0,
          lastActivity: new Date().toISOString(),
          isAccepted: true
        };
        setConversations(prev => [newConversation, ...prev]);
        setPendingRequestsCount(prev => Math.max(0, prev - 1));
        setActiveTab(0);
        await fetchMessages(senderId);
        setSelectedUserName(senderName);
        if (senderAvatar) setSelectedUserAvatar(senderAvatar);
        setTimeout(() => { fetchAllConversations(); fetchUnreadCount(); }, 500);
      } else {
        setError(response.data.message || 'Failed to accept message request');
      }
    } catch (error) {
      console.error('Accept message request error:', error);
      if (error.response?.status === 404) {
        setError('Message request not found or already processed');
        setMessageRequests(prev => prev.filter(req => {
          const reqId = req._id || req.id || req.messageId;
          return reqId !== messageId;
        }));
      } else {
        setError('Failed to accept message request. Please try again.');
      }
    }
  };

  const rejectMessageRequest = async (messageId, blockUser = false) => {
    try {
      const response = await api.put(`/api/v1/messages/requests/${messageId}/reject`, { blockUser });
      if (response.data.success) {
        const message = `Message request rejected${blockUser ? ' and user blocked' : ''}`;
        setSuccess(message);
        const request = messageRequests.find(req => req._id === messageId);
        if (request && selectedUser === (request.sender?._id || request.sender || request.userId)) {
          goBackToConversations();
        }
        fetchAllConversations();
        fetchUnreadCount();
      } else {
        setError(response.data.message || 'Failed to reject message request');
      }
    } catch (error) {
      console.error('Reject message request error:', error);
      setError('Failed to reject message request. Please try again.');
    }
  };

  const unblockUser = async () => {
    if (!userToUnblock) return;
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const response = await api.put(`/api/v1/messages/unblock/${userToUnblock.id}`);
      if (response.data.success) {
        setSuccess(`${userToUnblock.name} has been unblocked`);
        setUnblockDialogOpen(false);
        setUserToUnblock(null);
        setIsUserBlocked(false);
        fetchAllConversations();
        fetchUnreadCount();
        if (selectedUser === userToUnblock.id) {
          await fetchMessages(selectedUser);
        }
      } else {
        setError(response.data.message || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Unblock user error:', error);
      setError(error.response?.data?.message || 'Failed to unblock user');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  const handleReportClick = (message) => {
    setMessageToReport(message);
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!messageToReport || !reportReason) return;
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const response = await api.post(`/api/v1/messages/${messageToReport._id}/report`, {
        reason: reportReason,
        details: reportDetails
      });
      if (response.data.success) {
        setSuccess('Message reported successfully! An admin will review it.');
        setReportDialogOpen(false);
        setReportReason('');
        setReportDetails('');
        if (selectedUser) { fetchMessages(selectedUser); }
      } else {
        setError(response.data.message || 'Failed to report message');
      }
    } catch (error) {
      console.error('Report message error:', error);
      setError(error.response?.data?.message || 'Failed to report message. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await api.delete(`/api/v1/messages/${messageId}`);
      if (response.data.success) {
        setSuccess('Message deleted');
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        setError(response.data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      setError('Failed to delete message');
    }
  };

  const handleMessageMenuOpen = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMessageMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleBlockUser = () => {
    if (!selectedUser) return;
    setUserToBlock({ id: selectedUser, name: selectedUserName });
    setBlockDialogOpen(true);
  };

  const handleUnblockUser = () => {
    if (!selectedUser) return;
    setUserToUnblock({ id: selectedUser, name: selectedUserName });
    setUnblockDialogOpen(true);
  };

  const confirmBlockUser = async () => {
    if (!userToBlock) return;
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const response = await api.put(`/api/v1/users/${userToBlock.id}/block`);
      if (response.data.success) {
        setSuccess(`${userToBlock.name} has been blocked`);
        setBlockDialogOpen(false);
        setUserToBlock(null);
        setIsUserBlocked(true);
        goBackToConversations();
        fetchAllConversations();
      } else {
        setError(response.data.message || 'Failed to block user');
      }
    } catch (error) {
      console.error('Block user error:', error);
      setError('Failed to block user');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  const goBackToConversations = () => {
    setSelectedUser(null);
    setMessages([]);
    setSelectedUserName('');
    setSelectedUserAvatar('');
    setSelectedUserData(null);
    setIsRequestConversation(false);
    setConversationStatus(null);
    setShowInfoBanner(false);
    navigate('/messages');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const selectConversation = async (conversation) => {
    const userId = conversation.userId || conversation.sender?._id || conversation.sender;
    const userName = conversation.name || conversation.sender?.name || 'User';
    const userAvatar = conversation.avatar?.url || getAvatarUrl(conversation.sender) || '';
    setSelectedUser(userId);
    setSelectedUserName(userName);
    setSelectedUserAvatar(userAvatar);
    setSelectedUserData(conversation);
    if (conversation.isAccepted) {
      setIsRequestConversation(false);
      setConversationStatus('accepted');
      setShowInfoBanner(false);
      setActiveTab(0);
    } else if (conversation.pendingRequests > 0) {
      setIsRequestConversation(true);
      setConversationStatus('pending');
      setShowInfoBanner(true);
      setInfoBannerMessage('This conversation has pending message requests.');
      setActiveTab(1);
    } else {
      setIsRequestConversation(false);
      setConversationStatus('none');
      setShowInfoBanner(false);
      setActiveTab(0);
    }
    await fetchMessages(userId);
    navigate(`/messages/${userId}`, { replace: true });
  };

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const AvatarCircle = ({ src, name, size = 32, border = '2px solid #b7e4c7' }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', border, flexShrink: 0,
    }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: 'white', fontWeight: '700', fontSize: size * 0.38, fontFamily: "'Lora', serif" }}>
            {name?.charAt(0) || 'U'}
          </span>
      }
    </div>
  );

  const DateCol = ({ dateStr }) => {
    if (!dateStr) return (
      <div style={{ width: 64, minWidth: 64, padding: '16px 12px 16px 14px', borderRight: '1px solid #e9f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChatIcon sx={{ fontSize: 20, color: '#a3b18a' }} />
      </div>
    );
    const d = new Date(dateStr);
    return (
      <div style={{ width: 64, minWidth: 64, padding: '16px 12px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid #e9f0eb' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {d.toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span style={{ fontSize: '18px', fontWeight: '700', color: '#1b4332', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>
          {d.getDate()}
        </span>
        <span style={{ fontSize: '10px', color: '#a3b18a', marginTop: 1 }}>{d.getFullYear()}</span>
      </div>
    );
  };

  const renderMessageItem = (message) => {
    const isCurrentUser = message.sender?._id?.toString() === currentUserId?.toString();
    const canAcceptRequest = message.isRequest &&
      message.status === 'pending' &&
      message.recipient?._id?.toString() === currentUserId?.toString();
    const senderAvatar = getAvatarUrl(message.sender);
    const isHiddenByAdmin = message.isHidden === true;

    return (
      <div
        key={message._id}
        style={{
          display: 'flex',
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 10,
          marginBottom: 18,
          opacity: isHiddenByAdmin ? 0.6 : 1,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <AvatarCircle src={senderAvatar} name={message.sender?.name} size={32} />

        <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
          {/* Bubble */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: isCurrentUser ? '#1b4332' : 'white',
            color: isCurrentUser ? 'white' : '#1b4332',
            borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            border: message.isRequest ? '1.5px dashed #ca6702' : isCurrentUser ? 'none' : '1px solid #e0ede4',
            boxShadow: '0 2px 8px rgba(27,67,50,0.08)',
            position: 'relative',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {isHiddenByAdmin && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit',
                backgroundColor: 'rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <HiddenIcon sx={{ color: 'text.secondary', fontSize: 15 }} />
                <span style={{ fontSize: '11px', color: '#6b705c' }}>Hidden by admin</span>
              </div>
            )}
            <p style={{
              margin: 0, fontSize: '14px', lineHeight: 1.6,
              filter: isHiddenByAdmin ? 'blur(3px)' : 'none',
              userSelect: isHiddenByAdmin ? 'none' : 'auto',
            }}>
              {isHiddenByAdmin
                ? 'This message has been hidden due to violations of our community guidelines.'
                : message.content}
            </p>
            {message.isRequest && !isHiddenByAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{
                  fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                  backgroundColor: message.status === 'pending' ? '#fff1e6' : '#d8f3dc',
                  color: message.status === 'pending' ? '#ca6702' : '#1b4332',
                }}>
                  {message.status === 'pending' ? 'Request Pending' : 'Request Accepted'}
                </span>
                {message.status === 'pending' && <LockIcon sx={{ fontSize: 13, color: '#ca6702' }} />}
              </div>
            )}
            {isHiddenByAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{
                  fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                  backgroundColor: '#fde8e8', color: '#bc4749',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <WarningIcon sx={{ fontSize: 11 }} /> Hidden by Admin
                </span>
                {message.hiddenReason && (
                  <Tooltip title={`Reason: ${message.hiddenReason}`}>
                    <InfoIcon sx={{ fontSize: 13, color: '#6b705c' }} />
                  </Tooltip>
                )}
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }}>
            <span style={{ fontSize: '11px', color: '#a3b18a', fontFamily: "'DM Sans', sans-serif" }}>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              {isHiddenByAdmin && message.hiddenAt && (
                <span> • Hidden {formatDistanceToNow(new Date(message.hiddenAt), { addSuffix: true })}</span>
              )}
            </span>
            {message.isRead && isCurrentUser && !isHiddenByAdmin && (
              <MarkChatReadIcon sx={{ fontSize: 13, color: '#52b788' }} />
            )}
            {!isCurrentUser && !isHiddenByAdmin && (
              <IconButton size="small" onClick={(e) => handleMessageMenuOpen(e, message)} sx={{ width: 22, height: 22, '&:hover': { backgroundColor: '#f0faf3' } }}>
                <MoreVertIcon sx={{ fontSize: 14, color: '#6b705c' }} />
              </IconButton>
            )}
            {canAcceptRequest && !isHiddenByAdmin && (
              <button
                onClick={() => acceptMessageRequest(message._id, message.sender._id, message.sender.name, getAvatarUrl(message.sender))}
                style={{
                  marginLeft: 6, padding: '4px 12px',
                  background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                  color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <CheckIcon sx={{ fontSize: 13 }} /> Accept
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRequestItem = (request) => {
    const isSelected = selectedUser === (request.sender?._id || request.sender || request.userId);
    const messageId = request._id || request.id || request.messageId;
    const isRecipient = currentUserId && request.recipient?._id?.toString() === currentUserId.toString();
    const senderAvatar = getAvatarUrl(request.sender);
    const isHiddenByAdmin = request.isHidden === true;

    return (
      <div
        key={messageId || request.userId}
        className="msg-sidebar-row"
        onClick={() => {
          const uid = request.sender?._id || request.sender || request.userId;
          const uname = request.sender?.name || request.name || 'User';
          const uav = senderAvatar || request.avatar?.url || '';
          setSelectedUser(uid);
          setSelectedUserName(uname);
          setSelectedUserAvatar(uav);
          setIsRequestConversation(true);
          setConversationStatus('pending');
          setActiveTab(1);
          fetchMessages(uid);
        }}
        style={{
          display: 'flex', alignItems: 'stretch', gap: 0,
          backgroundColor: isSelected ? '#e8f5ee' : 'white',
          borderBottom: '1px solid #e9f0eb',
          cursor: 'pointer',
          borderLeft: isSelected ? '3px solid #2d6a4f' : '3px solid transparent',
          transition: 'background-color 0.15s ease',
        }}
      >
        {/* Icon */}
        <div style={{ width: 42, minWidth: 42, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 4px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '7px',
            backgroundColor: isHiddenByAdmin ? '#fde8e8' : '#d8f3dc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isHiddenByAdmin
              ? <WarningIcon sx={{ fontSize: 13, color: '#bc4749' }} />
              : <MessageIcon sx={{ fontSize: 13, color: '#2d6a4f' }} />
            }
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '14px 10px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1b4332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {request.sender?.name || request.name || 'Unknown User'}
            </span>
            {!isHiddenByAdmin && (
              <span style={{ backgroundColor: '#fff1e6', color: '#ca6702', fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>
                REQUEST
              </span>
            )}
            {isHiddenByAdmin && (
              <span style={{ backgroundColor: '#fde8e8', color: '#bc4749', fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>
                HIDDEN
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#6b705c', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', filter: isHiddenByAdmin ? 'blur(2px)' : 'none' }}>
            {isHiddenByAdmin
              ? 'This message has been hidden due to violations.'
              : (request.content || request.lastMessage?.content || 'New message request')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PendingIcon sx={{ fontSize: 12, color: isHiddenByAdmin ? '#bc4749' : '#ca6702' }} />
            <span style={{ fontSize: '10px', fontWeight: '600', color: isHiddenByAdmin ? '#bc4749' : '#ca6702' }}>
              {isHiddenByAdmin ? 'Hidden by Admin' : (isRecipient ? 'Awaiting your response' : 'Awaiting acceptance')}
            </span>
          </div>

          {isRecipient && !isHiddenByAdmin && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
              {[
                {
                  label: 'Accept',
                  icon: <CheckIcon sx={{ fontSize: 13 }} />,
                  bg: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                  color: 'white',
                  border: 'none',
                  action: () => {
                    if (!messageId) { setError('Cannot accept (missing ID)'); return; }
                    acceptMessageRequest(
                      messageId,
                      request.sender?._id || request.sender || request.userId,
                      request.sender?.name || request.name,
                      senderAvatar || request.avatar?.url
                    );
                  }
                },
                {
                  label: 'Accept & Chat',
                  icon: <ChatIcon sx={{ fontSize: 13 }} />,
                  bg: 'white',
                  color: '#2d6a4f',
                  border: '1.5px solid #2d6a4f',
                  action: () => {
                    if (!messageId) { setError('Cannot accept (missing ID)'); return; }
                    acceptMessageRequest(
                      messageId,
                      request.sender?._id || request.sender || request.userId,
                      request.sender?.name || request.name,
                      senderAvatar || request.avatar?.url
                    );
                  }
                },
                {
                  label: 'Block',
                  icon: <BlockIcon sx={{ fontSize: 13 }} />,
                  bg: 'white',
                  color: '#6b705c',
                  border: '1.5px solid #e0ede4',
                  action: () => {
                    if (!messageId) { setError('Cannot block (missing ID)'); return; }
                    rejectMessageRequest(messageId, true);
                  }
                },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} style={{
                  padding: '5px 12px', background: btn.bg, color: btn.color,
                  border: btn.border || 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          )}

          {isHiddenByAdmin && (
            <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: '#fde8e8', borderRadius: '8px', border: '1px solid #f5c6c6', fontSize: '11px', color: '#bc4749', display: 'flex', alignItems: 'center', gap: 5 }}>
              <WarningIcon sx={{ fontSize: 12 }} />
              Hidden for violating community guidelines{request.hiddenReason ? `: ${request.hiddenReason}` : '.'}
            </div>
          )}
        </div>

        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: isSelected ? '#2d6a4f' : '#a3b18a', fontSize: 20, lineHeight: 1 }}>›</span>
        </div>
      </div>
    );
  };

  const renderConversationItem = (conversation, index) => {
    const convUserId = conversation.userId || conversation.sender?._id || conversation.sender;
    const isSelected = selectedUser === convUserId;
    const userName = conversation.name || conversation.sender?.name || 'Unknown User';
    const lastMsgDate = conversation.lastMessage?.createdAt || conversation.lastActivity;
    const hasUnread = (conversation.unreadCount || 0) > 0;

    return (
      <div
        key={convUserId || index}
        className="msg-sidebar-row"
        onClick={() => selectConversation(conversation)}
        style={{
          display: 'flex', alignItems: 'stretch', gap: 0,
          backgroundColor: isSelected ? '#e8f5ee' : 'white',
          borderBottom: '1px solid #e9f0eb',
          cursor: 'pointer',
          borderLeft: isSelected ? '3px solid #2d6a4f' : hasUnread ? '3px solid #52b788' : '3px solid transparent',
          transition: 'background-color 0.15s ease',
        }}
      >
        <DateCol dateStr={lastMsgDate} />

        {/* Avatar col */}
        <div style={{ width: 42, minWidth: 42, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 4px' }}>
          <div style={{ position: 'relative' }}>
            <AvatarCircle src={getAvatarUrl(conversation) || getAvatarUrl(conversation.sender)} name={userName} size={30} />
            {hasUnread && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: '#bc4749', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: '700', color: 'white',
              }}>
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '14px 10px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: '13.5px', fontWeight: hasUnread ? '700' : '600', color: '#1b4332', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </span>
            {hasUnread && (
              <span style={{ backgroundColor: '#2d6a4f', color: 'white', fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>
                NEW
              </span>
            )}
            {conversation.isAccepted && <CheckIcon sx={{ fontSize: 13, color: '#52b788', flexShrink: 0 }} />}
          </div>
          <p style={{ fontSize: '12px', color: '#6b705c', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conversation.lastMessage?.content || conversation.content || 'No messages yet'}
            {conversation.pendingRequests > 0 && ' • Request pending'}
          </p>
          {conversation.isAccepted && (
            <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 7px', borderRadius: '5px', backgroundColor: '#d8f3dc', color: '#1b4332' }}>
              Accepted
            </span>
          )}
        </div>

        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: isSelected ? '#2d6a4f' : '#a3b18a', fontSize: 20, lineHeight: 1 }}>›</span>
        </div>
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f9f4', fontFamily: "'DM Sans', sans-serif" }}>
        <UserHeader />

        {/* Snackbars */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
        </Snackbar>

        {/* ─── Hero Banner ─────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2818 0%, #1b4332 55%, #2d6a4f 100%)',
          padding: '48px 24px 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -40, top: -30, width: 260, height: 260, borderRadius: '50%', background: 'rgba(82,183,136,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 80, bottom: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(52,143,96,0.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: -20, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(163,209,141,0.06)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 58, height: 58, borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.15)',
                animation: 'heroFloat 4s ease-in-out infinite',
              }}>
                <ChatIcon sx={{ fontSize: 28, color: '#74c69d' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0, fontFamily: "'Lora', serif" }}>Messages</h1>
                  {(unreadCount + pendingRequestsCount) > 0 && (
                    <span style={{ backgroundColor: '#74c69d', color: '#0d2818', fontSize: 12, fontWeight: 700, padding: '3px 11px', borderRadius: 20, letterSpacing: 0.3 }}>
                      {unreadCount + pendingRequestsCount} Unread
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: '#74c69d', margin: '5px 0 0', letterSpacing: 0.2 }}>
                  Your conversations and message requests.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { Icon: ChatIcon,          value: conversations.length,   label: 'Conversations',    color: '#b7e4c7' },
                  { Icon: NotificationsIcon, value: pendingRequestsCount,    label: 'Pending Requests', color: '#ffd166' },
                  { Icon: MessageIcon,       value: unreadCount,            label: 'Unread Messages',  color: '#74c69d' },
                ].map(({ Icon, value, label, color }) => (
                  <div key={label} style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: 12, minWidth: 140,
                  }}>
                    <Icon sx={{ fontSize: 18, color }} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>{value}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { fetchAllConversations(); fetchUnreadCount(); }}
                disabled={loading.conversations}
                style={{
                  padding: '10px 18px', backgroundColor: 'rgba(255,255,255,0.12)',
                  color: 'white', border: '1.5px solid rgba(255,255,255,0.2)',
                  borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: loading.conversations ? 0.6 : 1, transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
              >
                <RefreshIcon sx={{ fontSize: 14, animation: loading.conversations ? 'spin 1s linear infinite' : 'none' }} />
                {loading.conversations ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Panel ──────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, maxWidth: 1200, margin: '-24px auto 40px', padding: '0 24px', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{
            backgroundColor: 'white', borderRadius: 18,
            boxShadow: '0 4px 24px rgba(27,67,50,0.1)',
            overflow: 'hidden', border: '1px solid #e0ede4',
            display: 'flex', minHeight: 600,
            animation: 'slideUp 0.4s ease both',
          }}>

            {/* ─── LEFT SIDEBAR ──────────────────────────────────────────────── */}
            {(!selectedUser || window.innerWidth > 900) && (
              <div style={{ width: 340, minWidth: 340, borderRight: '1px solid #e9f0eb', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9f0eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#6b705c', fontFamily: "'DM Sans', sans-serif" }}>
                    {activeTab === 0 ? 'All Conversations' : 'Message Requests'}
                  </h2>
                  {activeTab === 0 && conversations.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#d8f3dc', color: '#1b4332', padding: '2px 8px', borderRadius: 20 }}>
                      {conversations.length}
                    </span>
                  )}
                  {activeTab === 1 && pendingRequestsCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#fff1e6', color: '#ca6702', padding: '2px 8px', borderRadius: 20 }}>
                      {pendingRequestsCount}
                    </span>
                  )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e9f0eb' }}>
                  {[
                    { label: 'Chats', Icon: ChatIcon, badge: unreadCount, badgeColor: '#bc4749' },
                    { label: 'Requests', Icon: NotificationsIcon, badge: pendingRequestsCount, badgeColor: '#ca6702' },
                  ].map((tab, i) => (
                    <button
                      key={tab.label}
                      onClick={() => { setActiveTab(i); if (i === 1) fetchMessageRequests(); }}
                      style={{
                        flex: 1, padding: '12px 8px', background: 'none', border: 'none',
                        borderBottom: activeTab === i ? '2px solid #2d6a4f' : '2px solid transparent',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        color: activeTab === i ? '#1b4332' : '#6b705c',
                        fontFamily: "'DM Sans', sans-serif",
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.15s',
                      }}
                    >
                      <tab.Icon sx={{ fontSize: 15 }} />
                      {tab.label}
                      {tab.badge > 0 && (
                        <span style={{ backgroundColor: tab.badgeColor, color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {activeTab === 0 ? (
                    loading.conversations ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12 }}>
                        <CircularProgress size={30} sx={{ color: '#2d6a4f' }} />
                        <span style={{ fontSize: 13, color: '#6b705c' }}>Loading conversations…</span>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#f0faf3', border: '1.5px solid #b7e4c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageIcon sx={{ fontSize: 30, color: '#52b788' }} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>No Conversations Yet</p>
                        <p style={{ fontSize: 13, color: '#6b705c', margin: 0, textAlign: 'center' }}>Start a conversation by messaging someone.</p>
                        <button
                          onClick={() => navigate('/community-blogspot')}
                          style={{
                            marginTop: 8, padding: '9px 18px',
                            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                            color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          <PersonAddIcon sx={{ fontSize: 15 }} /> Find Users
                        </button>
                      </div>
                    ) : (
                      conversations.map((conv, i) => renderConversationItem(conv, i))
                    )
                  ) : (
                    loading.requests ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12 }}>
                        <CircularProgress size={30} sx={{ color: '#2d6a4f' }} />
                        <span style={{ fontSize: 13, color: '#6b705c' }}>Loading requests…</span>
                      </div>
                    ) : messageRequests.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#f0faf3', border: '1.5px solid #b7e4c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PersonAddIcon sx={{ fontSize: 30, color: '#52b788' }} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>No Message Requests</p>
                        <p style={{ fontSize: 13, color: '#6b705c', margin: 0, textAlign: 'center' }}>Requests from unknown users appear here.</p>
                      </div>
                    ) : (
                      messageRequests.map(renderRequestItem)
                    )
                  )}
                </div>
              </div>
            )}

            {/* ─── CHAT AREA ─────────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fafcfa', minWidth: 0 }}>
              {selectedUser ? (
                <>
                  {/* Chat header */}
                  <div style={{
                    padding: '14px 20px', borderBottom: '1px solid #e9f0eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: 'white',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {window.innerWidth <= 900 && (
                        <button
                          onClick={goBackToConversations}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', background: 'none',
                            border: '1.5px solid #e0ede4', borderRadius: 8, cursor: 'pointer',
                            fontSize: 13, color: '#2d6a4f', fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          <ArrowBackIcon sx={{ fontSize: 14 }} /> Back
                        </button>
                      )}
                      <AvatarCircle src={selectedUserAvatar} name={selectedUserName} size={42} border="2.5px solid #b7e4c7" />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1b4332', fontFamily: "'Lora', serif" }}>
                          {selectedUserName || 'Unknown User'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          {isUserBlocked && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: '#fde8e8', color: '#bc4749', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <BlockIcon sx={{ fontSize: 11 }} /> Blocked
                            </span>
                          )}
                          {isRequestConversation && conversationStatus === 'pending' && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: '#fff1e6', color: '#ca6702', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <LockIcon sx={{ fontSize: 11 }} /> Request Pending
                            </span>
                          )}
                          {conversationStatus === 'accepted' && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: '#d8f3dc', color: '#1b4332', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckIcon sx={{ fontSize: 11 }} /> Accepted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isUserBlocked ? (
                      <button onClick={handleUnblockUser} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                        <UnblockIcon sx={{ fontSize: 15 }} /> Unblock
                      </button>
                    ) : (
                      <button onClick={handleBlockUser} style={{ padding: '8px 16px', background: 'white', color: '#bc4749', border: '1.5px solid #bc4749', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                        <BlockIcon sx={{ fontSize: 15 }} /> Block
                      </button>
                    )}
                  </div>

                  {/* Info banner */}
                  {showInfoBanner && infoBannerMessage && conversationStatus === 'pending' && (
                    <div style={{ margin: '12px 20px 0', padding: '12px 16px', backgroundColor: '#f0faf3', border: '1px solid #b7e4c7', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <InfoIcon sx={{ fontSize: 16, color: '#2d6a4f', flexShrink: 0, mt: 0.2 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#1b4332', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{infoBannerMessage}</p>
                        {isRequestConversation && conversationStatus === 'pending' && currentUserId && (() => {
                          const hasPending = messages.some(m => m.isRequest && m.status === 'pending' && m.recipient?._id?.toString() === currentUserId.toString() && !m.isHidden);
                          return hasPending && (
                            <button
                              style={{ marginTop: 8, padding: '6px 14px', background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif" }}
                              onClick={() => {
                                const pr = messages.find(m => m.isRequest && m.status === 'pending' && m.recipient?._id?.toString() === currentUserId.toString() && !m.isHidden);
                                if (pr) acceptMessageRequest(pr._id, selectedUser, selectedUserName, selectedUserAvatar);
                              }}
                            >
                              <CheckIcon sx={{ fontSize: 13 }} /> Accept Request
                            </button>
                          );
                        })()}
                      </div>
                      <button onClick={() => setShowInfoBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b705c', padding: 2, display: 'flex' }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                  )}

                  {/* Messages */}
                  <div
                    ref={scrollContainerRef}
                    style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f9f4' }}
                  >
                    {loading.messages ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 12 }}>
                        <CircularProgress size={30} sx={{ color: '#2d6a4f' }} />
                        <span style={{ fontSize: 13, color: '#6b705c' }}>Loading messages…</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 14 }}>
                        <div style={{ width: 70, height: 70, borderRadius: 18, backgroundColor: '#f0faf3', border: '1.5px solid #b7e4c7', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'heroFloat 4s ease-in-out infinite' }}>
                          <ChatIcon sx={{ fontSize: 36, color: '#52b788' }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>
                          {isRequestConversation && conversationStatus === 'pending' ? 'Message Request' : 'No messages yet'}
                        </p>
                        <p style={{ fontSize: 13, color: '#6b705c', margin: 0, textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
                          {isRequestConversation && conversationStatus === 'pending' ? 'Accept the request to start chatting.' : 'Start the conversation by sending a message!'}
                        </p>
                        {isUserBlocked && (
                          <button onClick={handleUnblockUser} style={{ marginTop: 8, padding: '9px 20px', background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans', sans-serif" }}>
                            <UnblockIcon sx={{ fontSize: 15 }} /> Unblock to Message
                          </button>
                        )}
                        {isRequestConversation && conversationStatus === 'pending' && !isUserBlocked && currentUserId && (() => {
                          const pr = messages.find(m => m.isRequest && m.status === 'pending' && m.recipient?._id?.toString() === currentUserId.toString() && !m.isHidden);
                          return pr && (
                            <button onClick={() => acceptMessageRequest(pr._id, selectedUser, selectedUserName, selectedUserAvatar)} style={{ marginTop: 8, padding: '9px 20px', background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans', sans-serif" }}>
                              <CheckIcon sx={{ fontSize: 15 }} /> Accept Request to Chat
                            </button>
                          );
                        })()}
                      </div>
                    ) : (
                      <>
                        {messages.map(renderMessageItem)}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  {!isUserBlocked && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #e9f0eb', backgroundColor: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '8px 12px', backgroundColor: '#f4f9f4', border: '1.5px solid #dde8df', borderRadius: 14, transition: 'border-color 0.15s' }}>
                        <textarea
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          placeholder={isRequestConversation && conversationStatus === 'pending' ? 'Send a message request (requires acceptance)…' : 'Type your message…'}
                          rows={1}
                          disabled={loading.sending}
                          style={{ flex: 1, border: 'none', background: 'none', outline: 'none', resize: 'none', fontSize: 14, color: '#1b4332', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", maxHeight: 100, overflowY: 'auto' }}
                          onFocus={e => e.target.closest('div').style.borderColor = '#2d6a4f'}
                          onBlur={e => e.target.closest('div').style.borderColor = '#dde8df'}
                          onKeyPress={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || loading.sending}
                          style={{
                            width: 38, height: 38, flexShrink: 0,
                            background: !newMessage.trim() || loading.sending ? '#a3b18a' : 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                            border: 'none', borderRadius: 10,
                            cursor: !newMessage.trim() || loading.sending ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s',
                          }}
                        >
                          {loading.sending
                            ? <CircularProgress size={18} sx={{ color: 'white' }} />
                            : isRequestConversation && conversationStatus === 'pending'
                              ? <PendingIcon sx={{ fontSize: 18, color: 'white' }} />
                              : <SendIcon sx={{ fontSize: 18, color: 'white' }} />
                          }
                        </button>
                      </div>
                      {isRequestConversation && conversationStatus === 'pending' && (
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#ca6702', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif" }}>
                          <InfoIcon sx={{ fontSize: 13 }} />
                          This will be sent as a message request. The user needs to accept it first.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Empty state */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#f0faf3', border: '1.5px solid #b7e4c7', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'heroFloat 4s ease-in-out infinite' }}>
                    <ChatIcon sx={{ fontSize: 38, color: '#52b788' }} />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#1b4332', margin: 0, fontFamily: "'Lora', serif" }}>
                    {activeTab === 0 ? 'Select a Conversation' : 'Message Requests'}
                  </p>
                  <p style={{ fontSize: 14, color: '#6b705c', margin: 0, textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
                    {activeTab === 0 ? 'Choose a conversation from the list or start a new one.' : "Manage message requests from users who don't follow you."}
                  </p>
                  {activeTab === 1 && pendingRequestsCount > 0 && (
                    <button onClick={() => setActiveTab(1)} style={{ marginTop: 4, padding: '10px 20px', background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans', sans-serif" }}>
                      <NotificationsIcon sx={{ fontSize: 15 }} />
                      View {pendingRequestsCount} Request{pendingRequestsCount !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <UserFooter />

        {/* ─── Report Dialog ───────────────────────────────────────────────── */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: '14px', border: '1px solid #e0ede4' } }}>
          <DialogTitle sx={{ fontFamily: "'Lora', serif", color: '#1b4332', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon color="error" /> Report Message
          </DialogTitle>
          <DialogContent>
            {messageToReport && (
              <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#f7fdf9', border: '1px solid #d8f3dc', borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: '#6b705c', margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>Message to report:</p>
                <p style={{ fontSize: 14, color: '#344e41', margin: '0 0 6px', fontStyle: 'italic', fontFamily: "'Lora', serif" }}>"{messageToReport.content}"</p>
                <p style={{ fontSize: 11, color: '#a3b18a', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>From: {messageToReport.sender?.name || 'Unknown User'}</p>
              </div>
            )}
            <TextField select fullWidth label="Reason for reporting" value={reportReason} onChange={(e) => setReportReason(e.target.value)} margin="normal" required disabled={loading.sending} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
              <MenuItem value="spam">Spam</MenuItem>
              <MenuItem value="harassment">Harassment</MenuItem>
              <MenuItem value="inappropriate">Inappropriate Content</MenuItem>
              <MenuItem value="offensive">Offensive Language</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField fullWidth multiline rows={3} label="Additional details (optional)" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} margin="normal" placeholder="Please provide more details…" disabled={loading.sending} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', gap: 1 }}>
            <Button onClick={() => setReportDialogOpen(false)} disabled={loading.sending} variant="outlined" sx={{ borderRadius: '10px', color: '#6b705c', border: '1.5px solid #e0ede4' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={submitReport} disabled={!reportReason || loading.sending} startIcon={loading.sending ? <CircularProgress size={16} /> : <WarningIcon />} sx={{ borderRadius: '10px' }}>
              Submit Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Block Dialog ───────────────────────────────────────────────── */}
        <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)} PaperProps={{ sx: { borderRadius: '14px', border: '1px solid #e0ede4' } }}>
          <DialogTitle sx={{ fontFamily: "'Lora', serif", color: '#1b4332', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BlockIcon color="error" /> Block User
          </DialogTitle>
          <DialogContent>
            <p style={{ margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif", color: '#344e41' }}>
              Are you sure you want to block <strong>{userToBlock?.name}</strong>?
            </p>
            {["You won't be able to message each other", "You won't see each other's posts", "This action can be reversed later"].map(t => (
              <p key={t} style={{ margin: '4px 0', fontSize: 13, color: '#6b705c', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                <InfoIcon sx={{ fontSize: 13, color: '#a3b18a' }} /> {t}
              </p>
            ))}
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', gap: 1 }}>
            <Button onClick={() => setBlockDialogOpen(false)} disabled={loading.sending} variant="outlined" sx={{ borderRadius: '10px', color: '#6b705c', border: '1.5px solid #e0ede4' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmBlockUser} disabled={loading.sending} startIcon={loading.sending ? <CircularProgress size={16} /> : <BlockIcon />} sx={{ borderRadius: '10px' }}>
              Block User
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Unblock Dialog ─────────────────────────────────────────────── */}
        <Dialog open={unblockDialogOpen} onClose={() => setUnblockDialogOpen(false)} PaperProps={{ sx: { borderRadius: '14px', border: '1px solid #e0ede4' } }}>
          <DialogTitle sx={{ fontFamily: "'Lora', serif", color: '#1b4332', display: 'flex', alignItems: 'center', gap: 1 }}>
            <UnblockIcon color="success" /> Unblock User
          </DialogTitle>
          <DialogContent>
            <p style={{ margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif", color: '#344e41' }}>
              Are you sure you want to unblock <strong>{userToUnblock?.name}</strong>?
            </p>
            {["You will be able to message each other again", "You will see each other's posts", "You can block them again if needed"].map(t => (
              <p key={t} style={{ margin: '4px 0', fontSize: 13, color: '#6b705c', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon sx={{ fontSize: 13, color: '#52b788' }} /> {t}
              </p>
            ))}
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', gap: 1 }}>
            <Button onClick={() => setUnblockDialogOpen(false)} disabled={loading.sending} variant="outlined" sx={{ borderRadius: '10px', color: '#6b705c', border: '1.5px solid #e0ede4' }}>Cancel</Button>
            <Button variant="contained" color="success" onClick={unblockUser} disabled={loading.sending} startIcon={loading.sending ? <CircularProgress size={16} /> : <UnblockIcon />} sx={{ borderRadius: '10px', backgroundColor: '#2d6a4f', '&:hover': { backgroundColor: '#1b4332' } }}>
              Unblock User
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Message Context Menu ───────────────────────────────────────── */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMessageMenuClose}
          PaperProps={{ sx: { borderRadius: '12px', border: '1px solid #e0ede4', boxShadow: '0 4px 20px rgba(27,67,50,0.12)' } }}>
          <MenuItem onClick={() => { handleReportClick(selectedMessage); handleMessageMenuClose(); }} sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#344e41', gap: 1.5 }}>
            <ReportIcon sx={{ fontSize: 16, color: '#bc4749' }} /> Report Message
          </MenuItem>
          <MenuItem onClick={() => { deleteMessage(selectedMessage?._id); handleMessageMenuClose(); }} sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#344e41', gap: 1.5 }}>
            <DeleteIcon sx={{ fontSize: 16, color: '#6b705c' }} /> Delete Message
          </MenuItem>
        </Menu>
      </div>
    </>
  );
};

export default MessageComponent;