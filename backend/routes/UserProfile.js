const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getUserFollowers,
  getUserFollowing,
  followUser,
  unfollowUser,
  checkFollowStatus,
  getCurrentUserProfile,
  sendMessage,
  getUserPosts,
  getUserStats,
  blockUser,
  unblockUser,
  getBlockedUsers
} = require('../controllers/UserProfile');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

// ================= PUBLIC ROUTES =================
// GET /api/v1/users/:userId - Get user profile (public info)
router.get('/:userId', getUserProfile);

// GET /api/v1/users/:userId/followers - Get user's followers
router.get('/:userId/followers', getUserFollowers);

// GET /api/v1/users/:userId/following - Get users the user is following
router.get('/:userId/following', getUserFollowing);

// GET /api/v1/community/posts/user/:userId - Get user's posts (from CommunityPost)
router.get('/community/posts/user/:userId', getUserPosts);

// ================= PRIVATE ROUTES =================
// GET /api/v1/users/me - Get current user's full profile
router.get('/me', isAuthenticatedUser, getCurrentUserProfile);

// PUT /api/v1/users/:userId/profile - Update user profile (owner only)
router.put('/:userId/profile', isAuthenticatedUser, updateUserProfile);

// GET /api/v1/users/:userId/follow-status - Check if current user is following
router.get('/:userId/follow-status', isAuthenticatedUser, checkFollowStatus);

// POST /api/v1/users/:userId/follow - Follow a user
router.post('/:userId/follow', isAuthenticatedUser, followUser);

// DELETE /api/v1/users/:userId/unfollow - Unfollow a user
router.delete('/:userId/unfollow', isAuthenticatedUser, unfollowUser);

// GET /api/v1/users/:userId/stats - Get user statistics
router.get('/:userId/stats', isAuthenticatedUser, getUserStats);

// ================= MESSAGE ROUTES =================
// POST /api/v1/messages/send - Send a message to a user
router.post('/messages/send', isAuthenticatedUser, sendMessage);

// PUT /api/v1/users/:userId/block - Block a user
router.put('/:userId/block', isAuthenticatedUser, blockUser);

// PUT /api/v1/users/:userId/unblock - Unblock a user.
router.put('/:userId/unblock', isAuthenticatedUser, unblockUser);

// GET /api/v1/users/blocked - Get blocked users
router.get('/blocked', isAuthenticatedUser, getBlockedUsers);

module.exports = router;