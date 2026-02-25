const express = require('express');
const router = express.Router();
const {
  analyzeLatex,
  getAnalysisHistory,
  getAnalysisStats,
  getAnalysisById,
  deleteAnalysis,
  batchDeleteAnalyses,
  getLatexInfo
} = require('../controllers/LatexDetectionController');

// Import your existing middleware
const { isAuthenticatedUser } = require('../middlewares/auth');

// ================= PUBLIC ROUTES =================
router.get('/info', getLatexInfo);

// ================= PROTECTED ROUTES (Require Authentication) =================
// ANALYSIS
router.post('/analyze', isAuthenticatedUser, analyzeLatex);
router.get('/history', isAuthenticatedUser, getAnalysisHistory);
router.get('/stats', isAuthenticatedUser, getAnalysisStats);
router.get('/analysis/:analysisId', isAuthenticatedUser, getAnalysisById);

// DELETE OPERATIONS
router.delete('/history/:analysisId', isAuthenticatedUser, deleteAnalysis);
router.delete('/history/batch', isAuthenticatedUser, batchDeleteAnalyses);

module.exports = router;