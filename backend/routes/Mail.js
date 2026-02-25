// RubberSense/backend/routes/Mail.js
const express = require('express');
const {
  createAnnouncement,
  getAllAnnouncements,
  getUserAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  togglePublishStatus,
  getAnnouncementStats,
  markAnnouncementAsRead,
  getUnreadAnnouncementsCount,
  getUserUnreadAnnouncements,
  markAllAnnouncementsAsRead
} = require('../controllers/Mail');

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// ================= USER ROUTES =================
// GET /api/v1/mail/announcements - Get all active announcements for user
router.get('/announcements', isAuthenticatedUser, getUserAnnouncements);

// GET /api/v1/mail/announcements/:id - Get single announcement
router.get('/announcements/:id', isAuthenticatedUser, getAnnouncementById);

// GET /api/v1/mail/unread/count - Get unread announcements count
router.get('/unread/count', isAuthenticatedUser, getUnreadAnnouncementsCount);

// GET /api/v1/mail/unread - Get user's unread announcements
router.get('/unread', isAuthenticatedUser, getUserUnreadAnnouncements);

// PUT /api/v1/mail/announcements/:id/read - Mark announcement as read
router.put('/announcements/:id/read', isAuthenticatedUser, markAnnouncementAsRead);

// PUT /api/v1/mail/mark-all-read - Mark all announcements as read
router.put('/mark-all-read', isAuthenticatedUser, markAllAnnouncementsAsRead);

// ================= ADMIN ROUTES =================
// POST /api/v1/mail/admin/announcements - Create new announcement
router.post('/admin/announcements', isAuthenticatedUser, isAdmin, createAnnouncement);

// GET /api/v1/mail/admin/announcements - Get all announcements (admin)
router.get('/admin/announcements', isAuthenticatedUser, isAdmin, getAllAnnouncements);

// GET /api/v1/mail/admin/announcements/stats - Get announcement statistics
router.get('/admin/announcements/stats', isAuthenticatedUser, isAdmin, getAnnouncementStats);

// GET /api/v1/mail/admin/announcements/:id - Get single announcement (admin)
router.get('/admin/announcements/:id', isAuthenticatedUser, isAdmin, getAnnouncementById);

// PUT /api/v1/mail/admin/announcements/:id - Update announcement
router.put('/admin/announcements/:id', isAuthenticatedUser, isAdmin, updateAnnouncement);

// DELETE /api/v1/mail/admin/announcements/:id - Delete announcement
router.delete('/admin/announcements/:id', isAuthenticatedUser, isAdmin, deleteAnnouncement);

// PUT /api/v1/mail/admin/announcements/:id/toggle-publish - Toggle publish status.
router.put('/admin/announcements/:id/toggle-publish', isAuthenticatedUser, isAdmin, togglePublishStatus);

module.exports = router;