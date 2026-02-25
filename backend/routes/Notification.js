const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  followBack,
  triggerContentReportedNotification,
  triggerContentHiddenNotification
} = require('../controllers/Notification');

const { isAuthenticatedUser } = require('../middlewares/auth');

// ================= PROTECTED ROUTES =================
// GET /api/v1/notifications - Get user notifications
router.get('/', isAuthenticatedUser, getUserNotifications);

// PUT /api/v1/notifications/read - Mark notification(s) as read
router.put('/read', isAuthenticatedUser, markAsRead);

// GET /api/v1/notifications/unread-count - Get unread count
router.get('/unread-count', isAuthenticatedUser, getUnreadCount);

// DELETE /api/v1/notifications/:notificationId - Delete single notification
router.delete('/:notificationId', isAuthenticatedUser, deleteNotification);

// DELETE /api/v1/notifications/clear/all - Clear all notifications
router.delete('/clear/all', isAuthenticatedUser, clearAllNotifications);

// POST /api/v1/notifications/follow-back - Follow back user.
router.post('/follow-back', isAuthenticatedUser, followBack);

router.post('/trigger-reported-notification', isAuthenticatedUser, triggerContentReportedNotification);
router.post('/trigger-hidden-notification', isAuthenticatedUser, triggerContentHiddenNotification);

module.exports = router;