const express = require('express');
const {
  getAllReports,
  getReportStats,
  updateReport,
  deleteReport,
  hidePost,
  hideComment,
  getPendingReports,
  getResolvedReports,
  getPostForAdmin,
  getCommentForAdmin,
  getMessageForAdmin,
  hideMessage
} = require('../controllers/adminReportController');

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// ================= ADMIN REPORT ROUTES =================

// GET /api/v1/admin/reports - Get all reports (admin only)
router.get('/', isAuthenticatedUser, isAdmin, getAllReports);

// GET /api/v1/admin/reports/stats - Get report statistics (admin only)
router.get('/stats', isAuthenticatedUser, isAdmin, getReportStats);

// GET /api/v1/admin/reports/pending - Get pending reports (admin only)
router.get('/pending', isAuthenticatedUser, isAdmin, getPendingReports);

// GET /api/v1/admin/reports/resolved - Get resolved reports (admin only)
router.get('/resolved', isAuthenticatedUser, isAdmin, getResolvedReports);

// PUT /api/v1/admin/reports/:id - Update report status (admin only)
router.put('/:id', isAuthenticatedUser, isAdmin, updateReport);

// DELETE /api/v1/admin/reports/:id - Delete report (admin only)
router.delete('/:id', isAuthenticatedUser, isAdmin, deleteReport);

// PUT /api/v1/admin/posts/:id/hide - Hide a post (admin only)
router.put('/posts/:id/hide', isAuthenticatedUser, isAdmin, hidePost);

// PUT /api/v1/admin/comments/:id/hide - Hide a comment (admin only)
router.put('/comments/:id/hide', isAuthenticatedUser, isAdmin, hideComment);

// PUT /api/v1/admin/messages/:id/hide - Hide a message (admin only)
router.put('/messages/:id/hide', isAuthenticatedUser, isAdmin, hideMessage);

// GET post for admin
router.get('/posts/:id', isAuthenticatedUser, isAdmin, getPostForAdmin);

// GET comment for admin
router.get('/comments/:id', isAuthenticatedUser, isAdmin, getCommentForAdmin);

// GET message for admin.
router.get('/messages/:id', isAuthenticatedUser, isAdmin, getMessageForAdmin);

module.exports = router;