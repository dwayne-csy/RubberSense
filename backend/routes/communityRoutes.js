const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  getTrendingPosts,
  getUserPosts,
  getPopularTags,
  search,
  reportContent,
  getUserReports
} = require('../controllers/communityController');

// Import your existing middleware
const { isAuthenticatedUser } = require('../middlewares/auth');

// ================= PUBLIC ROUTES =================
router.get('/posts', getPosts);
router.get('/posts/:id', getPost);
router.get('/posts/:id/comments', getComments);
router.get('/trending', getTrendingPosts);
router.get('/tags', getPopularTags);
router.get('/search', search);

// ================= PROTECTED ROUTES (Require Authentication) =================
// POSTS
router.post('/posts', isAuthenticatedUser, createPost);
router.put('/posts/:id', isAuthenticatedUser, updatePost);
router.delete('/posts/:id', isAuthenticatedUser, deletePost);
router.put('/posts/:id/like', isAuthenticatedUser, likePost);

// COMMENTS
router.post('/posts/:id/comments', isAuthenticatedUser, addComment);
router.put('/comments/:id', isAuthenticatedUser, updateComment);
router.delete('/comments/:id', isAuthenticatedUser, deleteComment);
router.put('/comments/:id/like', isAuthenticatedUser, likeComment);

// REPORTS
router.post('/report', isAuthenticatedUser, reportContent);
router.get('/user/reports', isAuthenticatedUser, getUserReports);

// USER SPECIFIC
router.get('/user/posts', isAuthenticatedUser, getUserPosts);

module.exports = router;