// RubberSense/backend/routes/contact.js
const express = require('express');
const {
  sendContactMessage,
  getUserMessages,
  getAllMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage,
  getUserReplies,
  userReplyToAdmin,
  markMessageAsRead,
  replyToUserMessage,
  getUnreadMessagesCount,
  getUserUnreadMessages,
  markAdminReplyAsRead,
  markAllRepliesAsRead
} = require('../controllers/Contact');

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// ================= PUBLIC ROUTES ================
// POST /api/v1/contact - Anyone can send a message
router.post('/', sendContactMessage);

// ================= USER ROUTES =================
// GET /api/v1/contact/my-messages - Get authenticated user's own messages
router.get('/my-messages', isAuthenticatedUser, getUserMessages);

// GET /api/v1/contact/user/replies - Get admin replies to user's messages
router.get('/user/replies', isAuthenticatedUser, getUserReplies);

// GET /api/v1/contact/user/unread/count - Get unread messages count
router.get('/user/unread/count', isAuthenticatedUser, getUnreadMessagesCount);

// GET /api/v1/contact/user/unread - Get user's unread messages
router.get('/user/unread', isAuthenticatedUser, getUserUnreadMessages);

// POST /api/v1/contact/user/reply - User replies to admin message
router.post('/user/reply', isAuthenticatedUser, userReplyToAdmin);

// PUT /api/v1/contact/user/:id/read - Mark message as read
router.put('/user/:id/read', isAuthenticatedUser, markMessageAsRead);

// PUT /api/v1/contact/user/mark-reply-read - Mark specific admin reply as read
router.put('/user/mark-reply-read', isAuthenticatedUser, markAdminReplyAsRead);

// PUT /api/v1/contact/user/mark-all-read - Mark all admin replies as read
router.put('/user/mark-all-read', isAuthenticatedUser, markAllRepliesAsRead);

// ================= ADMIN ROUTES =================
// GET /api/v1/contact/admin - Get all messages (admin only)
router.get('/admin', isAuthenticatedUser, isAdmin, getAllMessages);

// GET /api/v1/contact/admin/:id - Get single message (admin only)
router.get('/admin/:id', isAuthenticatedUser, isAdmin, getMessageById);

// PUT /api/v1/contact/admin/:id/status - Update message status (admin only)
router.put('/admin/:id/status', isAuthenticatedUser, isAdmin, updateMessageStatus);

// DELETE /api/v1/contact/admin/:id - Delete message (admin only)
router.delete('/admin/:id', isAuthenticatedUser, isAdmin, deleteMessage);

// POST /api/v1/contact/admin/:id/reply-to-user - Admin replies to user message
router.post('/admin/:id/reply-to-user', isAuthenticatedUser, isAdmin, replyToUserMessage);

module.exports = router;