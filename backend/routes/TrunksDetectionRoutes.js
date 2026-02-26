const express = require('express');
const router = express.Router();
const {
  analyzeTrunk,
  getAnalysisHistory,
  getAnalysisStats,
  getAnalysisById,
  deleteAnalysis,
  batchDeleteAnalyses,
  getTrunksInfo
} = require('../controllers/TrunksDetectionController');

// Import your existing middleware
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// ================= PUBLIC ROUTES =================
router.get('/info', getTrunksInfo);

// ================= PROTECTED ROUTES (Require Authentication) =================
// ANALYSIS
router.post('/analyze', isAuthenticatedUser, analyzeTrunk);
router.get('/history', isAuthenticatedUser, getAnalysisHistory);
router.get('/stats', isAuthenticatedUser, getAnalysisStats);
router.get('/analysis/:id', isAuthenticatedUser, getAnalysisById);

// DELETE OPERATIONS
router.delete('/analysis/:id', isAuthenticatedUser, deleteAnalysis);
router.delete('/history/batch', isAuthenticatedUser, batchDeleteAnalyses);

module.exports = router;