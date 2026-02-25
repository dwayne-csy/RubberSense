const express = require('express');
const router = express.Router();

const {
  analyzeLeaf,
  getAnalysisHistory,
  getAnalysisStats,
  getAnalysisById,
  deleteAnalysis,
  batchDeleteAnalyses,
  getLeafInfo
} = require('../controllers/LeafDetectionController');

const { isAuthenticatedUser } = require('../middlewares/auth');

// ================= PUBLIC ROUTES =================
router.get('/info', getLeafInfo);

// ================= PROTECTED ROUTES =================
router.post('/analyze', isAuthenticatedUser, analyzeLeaf);
router.get('/history', isAuthenticatedUser, getAnalysisHistory);
router.get('/stats', isAuthenticatedUser, getAnalysisStats);
router.get('/analysis/:analysisId', isAuthenticatedUser, getAnalysisById);
router.delete('/history/:analysisId', isAuthenticatedUser, deleteAnalysis);
router.delete('/history/batch', isAuthenticatedUser, batchDeleteAnalyses);

module.exports = router;