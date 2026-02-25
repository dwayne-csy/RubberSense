const express = require('express');
const {
  sendMessage,
  getConversation,
  getAllConversations,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  checkCanMessageUser,
  getMessageRequests,
  acceptMessageRequest,
  rejectMessageRequest,
  reportMessage,
  getReportedMessages,
  getConversationStatus,
  unblockUser,
} = require('../controllers/Message');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

// ================= MESSAGE ROUTES =================
// POST /api/v1/messages/send - Send a message
router.post('/send', isAuthenticatedUser, sendMessage);

// GET /api/v1/messages/conversations - Get all conversations
router.get('/conversations', isAuthenticatedUser, getAllConversations);

// GET /api/v1/messages/requests - Get message requests
router.get('/requests', isAuthenticatedUser, getMessageRequests);

// GET /api/v1/messages/conversation/:userId - Get conversation with specific user
router.get('/conversation/:userId', isAuthenticatedUser, getConversation);

// GET /api/v1/messages/conversation/:userId/status - Get conversation status.
router.get('/conversation/:userId/status', isAuthenticatedUser, getConversationStatus);

// GET /api/v1/messages/unread-count - Get unread message count
router.get('/unread-count', isAuthenticatedUser, getUnreadCount);

// GET /api/v1/messages/can-message/:userId - Check if can message user
router.get('/can-message/:userId', isAuthenticatedUser, checkCanMessageUser);

// PUT /api/v1/messages/:messageId/read - Mark message as read
router.put('/:messageId/read', isAuthenticatedUser, markAsRead);

// PUT /api/v1/messages/requests/:messageId/accept - Accept message request
router.put('/requests/:messageId/accept', isAuthenticatedUser, acceptMessageRequest);

// PUT /api/v1/messages/requests/:messageId/reject - Reject message request
router.put('/requests/:messageId/reject', isAuthenticatedUser, rejectMessageRequest);

// POST /api/v1/messages/:messageId/report - Report a message
router.post('/:messageId/report', isAuthenticatedUser, reportMessage);

// GET /api/v1/messages/reported - Get reported messages (admin only)
router.get('/reported', isAuthenticatedUser, getReportedMessages);

// DELETE /api/v1/messages/:messageId - Delete message
router.delete('/:messageId', isAuthenticatedUser, deleteMessage);

// PUT /api/v1/messages/unblock/:userId - Unblock user
router.put('/unblock/:userId', isAuthenticatedUser, unblockUser);

module.exports = router;