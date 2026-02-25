// RubberSense/Web/src/Components/Admin/AdminContactMessages.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LeftNavigationBar from '../layouts/LeftNavigationBar'; // Add this import

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null); // For first-time replies
  const [selectedReply, setSelectedReply] = useState(null); // For replying to user replies
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [viewingConversation, setViewingConversation] = useState(false);
  const [conversationMessage, setConversationMessage] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchMessages();
  }, [filter]);

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

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/v1/contact/admin`);
      
      if (response.data.success) {
        let filteredMessages = response.data.data;
        
        if (filter !== 'all') {
          filteredMessages = filteredMessages.filter(msg => msg.status === filter);
        }
        
        setMessages(filteredMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to reply to user's specific reply
  const replyToUserMessage = async (messageId, userReplyId, replyText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/contact/admin/${messageId}/reply-to-user`,
        { 
          userReplyId,
          replyText 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchMessages();
        return true;
      }
    } catch (error) {
      console.error('Error replying to user message:', error);
    }
    return false;
  };

  const handleReplyToUser = async () => {
    if (!selectedReply || !replyText.trim()) {
      showNotification('Please enter a reply message', 'error');
      return;
    }

    setReplying(true);
    
    const success = await replyToUserMessage(
      selectedReply.messageId,
      selectedReply.userReplyId,
      replyText
    );
    
    if (success) {
      showNotification('Reply sent successfully');
      setSelectedReply(null);
      setReplyText('');
      if (viewingConversation) {
        setViewingConversation(false);
        setConversationMessage(null);
      }
    } else {
      showNotification('Failed to send reply', 'error');
    }
    setReplying(false);
  };

  const updateMessageStatus = async (messageId, status, reply = '', isConversation = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/contact/admin/${messageId}/status`,
        { 
          status, 
          reply,
          isConversation
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchMessages();
        return true;
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
    return false;
  };

  const handleMarkAsRead = async (messageId) => {
    const success = await updateMessageStatus(messageId, 'read');
    if (success) {
      showNotification('Message marked as read');
    }
  };

  const handleFirstTimeReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      showNotification('Please enter a reply message', 'error');
      return;
    }

    setReplying(true);
    const success = await updateMessageStatus(selectedMessage._id, 'replied', replyText);
    
    if (success) {
      showNotification('Reply sent successfully');
      setSelectedMessage(null);
      setReplyText('');
    } else {
      showNotification('Failed to send reply', 'error');
    }
    setReplying(false);
  };

  const handleArchiveMessage = async (messageId) => {
    const success = await updateMessageStatus(messageId, 'archived');
    if (success) {
      showNotification('Message archived');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/contact/admin/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showNotification('Message deleted successfully');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showNotification('Failed to delete message', 'error');
    }
  };

  const handleViewConversation = (message) => {
    setConversationMessage(message);
    setViewingConversation(true);
  };

  const handleReplyToUserReply = (messageId, userReplyId, userName) => {
    setSelectedReply({
      messageId,
      userReplyId,
      userName
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'unread': return { backgroundColor: '#dc3545', color: 'white' };
      case 'read': return { backgroundColor: '#17a2b8', color: 'white' };
      case 'replied': return { backgroundColor: '#28a745', color: 'white' };
      case 'conversation': return { backgroundColor: '#ffc107', color: '#212529' };
      case 'archived': return { backgroundColor: '#6c757d', color: 'white' };
      default: return { backgroundColor: '#6c757d', color: 'white' };
    }
  };

  const renderConversationView = () => {
    if (!conversationMessage) return null;

    return (
      <div className="conversation-modal" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Conversation with {conversationMessage.name}</h2>
            <button 
              onClick={() => {
                setViewingConversation(false);
                setConversationMessage(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {/* Original Message */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{conversationMessage.name}</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{conversationMessage.email}</p>
              </div>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {formatDate(conversationMessage.createdAt)}
              </span>
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{conversationMessage.message}</p>
          </div>

          {/* Admin's First Reply */}
          {conversationMessage.reply && (
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              marginLeft: '40px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>Admin Reply</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>You</p>
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {formatDate(conversationMessage.repliedAt)}
                </span>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{conversationMessage.reply}</p>
            </div>
          )}

          {/* User's Replies */}
          {conversationMessage.userReplies && conversationMessage.userReplies.map((userReply, index) => (
            <div key={index} style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{conversationMessage.name}</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{conversationMessage.email}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {formatDate(userReply.date)}
                  </span>
                  <button 
                    onClick={() => handleReplyToUserReply(conversationMessage._id, userReply._id || index, conversationMessage.name)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Reply
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{userReply.text}</p>
              
              {/* Show admin replies to this specific user reply if they exist */}
              {userReply.adminReplies && userReply.adminReplies.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  {userReply.adminReplies.map((adminReply, adminIndex) => (
                    <div key={adminIndex} style={{
                      backgroundColor: '#e3f2fd',
                      padding: '15px',
                      borderRadius: '6px',
                      marginTop: '10px',
                      marginLeft: '20px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 3px 0', color: '#1976d2', fontSize: '14px' }}>Admin Reply</h5>
                          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>You</p>
                        </div>
                        <span style={{ fontSize: '11px', color: '#666' }}>
                          {formatDate(adminReply.date)}
                        </span>
                      </div>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '13px' }}>{adminReply.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Reply Form */}
          {selectedReply && selectedReply.messageId === conversationMessage._id && (
            <div style={{ 
              marginTop: '30px', 
              padding: '20px', 
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #28a745'
            }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Replying to {selectedReply.userName}</h4>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                placeholder="Type your reply here..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => {
                    setSelectedReply(null);
                    setReplyText('');
                  }}
                  disabled={replying}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReplyToUser}
                  disabled={replying}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {replying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Left Navigation Bar */}
      <LeftNavigationBar />
      
      {/* Main Content Area */}
      <div style={{ 
        marginLeft: '250px', // Same as sidebar width
        padding: '20px',
        width: 'calc(100% - 250px)',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        {/* Notification */}
        {notification.show && (
          <div className={`notification ${notification.type}`} style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '4px',
            zIndex: 1000,
            backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545',
            color: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            {notification.message}
          </div>
        )}

        {/* Main Content */}
        <div className="admin-messages-container" style={{ 
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ 
            marginBottom: '25px',
            color: '#333',
            borderBottom: '2px solid #2e7d32',
            paddingBottom: '10px'
          }}>Contact Messages</h1>
          
          {/* Filter Section */}
          <div className="filter-section" style={{ 
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '6px'
          }}>
            <label htmlFor="statusFilter" style={{ 
              fontWeight: '500',
              color: '#333'
            }}>Filter by status:</label>
            <select 
              id="statusFilter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ 
                padding: '8px 15px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="conversation">Conversation</option>
              <option value="archived">Archived</option>
            </select>
            
            <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
              Showing {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Messages Table */}
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: '#666'
            }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px'
            }}>
              No messages found.
            </div>
          ) : (
            <div className="messages-table">
              {messages.map((message) => (
                <div key={message._id} className="message-card" style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  backgroundColor: message.status === 'unread' ? '#f8f9fa' : 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderColor: '#2e7d32'
                  }
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ 
                        margin: '0 0 8px 0',
                        color: '#333',
                        fontSize: '18px'
                      }}>{message.name}</h3>
                      <p style={{ 
                        margin: '0 0 5px 0', 
                        color: '#666',
                        fontSize: '14px'
                      }}>{message.email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'inline-block',
                        marginBottom: '8px',
                        ...getStatusBadgeStyle(message.status)
                      }}>
                        {message.status.toUpperCase()}
                        {message.userReplies && message.userReplies.length > 0 && (
                          <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
                            ({message.userReplies.length})
                          </span>
                        )}
                      </span>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#888',
                        margin: 0
                      }}>
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: '15px 0', 
                    fontSize: '15px',
                    lineHeight: '1.5',
                    color: '#444',
                    whiteSpace: 'pre-wrap'
                  }}>{message.message}</p>
                  
                  {/* Show conversation preview */}
                  {message.reply && (
                    <div style={{
                      backgroundColor: '#f0f7ff',
                      padding: '15px',
                      borderRadius: '6px',
                      margin: '15px 0',
                      border: '1px solid #d1e7ff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#1976d2' }}>Admin Reply:</strong>
                          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#333' }}>
                            {message.reply.substring(0, 120)}...
                          </p>
                        </div>
                        <span style={{ fontSize: '11px', color: '#666' }}>
                          {formatDate(message.repliedAt)}
                        </span>
                      </div>
                      
                      {message.userReplies && message.userReplies.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #b3d4ff' }}>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            <strong>User replied {message.userReplies.length} time(s)</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                              Last reply: {formatDate(message.userReplies[message.userReplies.length - 1].date)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginTop: '20px',
                    flexWrap: 'wrap'
                  }}>
                    {message.status !== 'read' && message.status !== 'archived' && (
                      <button 
                        onClick={() => handleMarkAsRead(message._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#138496'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
                      >
                        Mark as Read
                      </button>
                    )}
                    
                    {/* For messages that already have admin reply - show View Conversation */}
                    {(message.status === 'replied' || message.status === 'conversation') && (
                      <button 
                        onClick={() => handleViewConversation(message)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0a800'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffc107'}
                      >
                        View Conversation
                      </button>
                    )}
                    
                    {/* For NEW messages without admin reply. - show Reply button */}
                    {(message.status !== 'replied' && message.status !== 'conversation' && message.status !== 'archived') && (
                      <button 
                        onClick={() => setSelectedMessage(message)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                      >
                        Reply
                      </button>
                    )}
                    
                    {message.status !== 'archived' && (
                      <button 
                        onClick={() => handleArchiveMessage(message._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                      >
                        Archive
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDeleteMessage(message._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* First-time Reply Modal (for new messages) */}
          {selectedMessage && (
            <div className="reply-modal" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(2px)'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '600px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                <h2 style={{ 
                  margin: '0 0 20px 0',
                  color: '#333',
                  borderBottom: '2px solid #2e7d32',
                  paddingBottom: '10px'
                }}>Reply to {selectedMessage.name}</h2>
                
                <div style={{ 
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  <strong style={{ color: '#2e7d32' }}>Original Message:</strong>
                  <p style={{ 
                    margin: '10px 0 0 0',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>{selectedMessage.message}</p>
                </div>
                
                <div style={{ margin: '20px 0' }}>
                  <label htmlFor="replyText" style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Your Reply:
                  </label>
                  <textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    placeholder="Type your reply here..."
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => {
                      setSelectedMessage(null);
                      setReplyText('');
                    }}
                    disabled={replying}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => !replying && (e.currentTarget.style.backgroundColor = '#5a6268')}
                    onMouseOut={(e) => !replying && (e.currentTarget.style.backgroundColor = '#6c757d')}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleFirstTimeReply}
                    disabled={replying}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: replying ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => !replying && (e.currentTarget.style.backgroundColor = '#218838')}
                    onMouseOut={(e) => !replying && (e.currentTarget.style.backgroundColor = '#28a745')}
                  >
                    {replying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reply Modal for replying to specific user reply */}
          {selectedReply && !viewingConversation && !selectedMessage && (
            <div className="reply-modal" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(2px)'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '600px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                <h2 style={{ 
                  margin: '0 0 20px 0',
                  color: '#333',
                  borderBottom: '2px solid #2e7d32',
                  paddingBottom: '10px'
                }}>Reply to {selectedReply.userName}</h2>
                
                <div style={{ margin: '20px 0' }}>
                  <label htmlFor="replyText" style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Your Reply:
                  </label>
                  <textarea
                    id="replyText"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    placeholder="Type your reply here..."
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => {
                      setSelectedReply(null);
                      setReplyText('');
                    }}
                    disabled={replying}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => !replying && (e.currentTarget.style.backgroundColor = '#5a6268')}
                    onMouseOut={(e) => !replying && (e.currentTarget.style.backgroundColor = '#6c757d')}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReplyToUser}
                    disabled={replying}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: replying ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => !replying && (e.currentTarget.style.backgroundColor = '#218838')}
                    onMouseOut={(e) => !replying && (e.currentTarget.style.backgroundColor = '#28a745')}
                  >
                    {replying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conversation View Modal */}
          {viewingConversation && renderConversationView()}
        </div>
      </div>
    </div>
  );
};

export default AdminContactMessages;