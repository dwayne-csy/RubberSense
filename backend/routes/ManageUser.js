// RubberSense/backend/routes/ManageUser.js
const express = require('express');
const {
  getAllUsers,
  getVerifiedUsers,
  getUnverifiedUsers,
  getActiveUsers,
  getInactiveUsers,
  toggleUserStatus,
  verifyUser,
  getUserStatus
} = require('../controllers/ManageUser');

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// ================= ADMIN ROUTES =================

// GET /api/v1/users - Get all users (admin only)
router.get('/', isAuthenticatedUser, isAdmin, getAllUsers);

// GET /api/v1/users/verified - Get only verified users (admin only)
router.get('/verified', isAuthenticatedUser, isAdmin, getVerifiedUsers);

// GET /api/v1/users/unverified - Get only unverified users (admin only)
router.get('/unverified', isAuthenticatedUser, isAdmin, getUnverifiedUsers);

// GET /api/v1/users/active - Get only active users (admin only)
router.get('/active', isAuthenticatedUser, isAdmin, getActiveUsers);

// GET /api/v1/users/inactive - Get only inactive users (admin only)
router.get('/inactive', isAuthenticatedUser, isAdmin, getInactiveUsers);

// GET /api/v1/users/:id/status - Get user online status (admin only)
router.get('/:id/status', isAuthenticatedUser, isAdmin, getUserStatus);

// PUT /api/v1/users/:id/toggle-status - Toggle user active/inactive status (admin only)
router.put('/:id/toggle-status', isAuthenticatedUser, isAdmin, toggleUserStatus);

// PUT /api/v1/users/:id/verify - Verify a user (admin only)
router.put('/:id/verify', isAuthenticatedUser, isAdmin, verifyUser);

module.exports = router;