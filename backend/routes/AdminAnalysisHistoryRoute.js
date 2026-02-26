const express = require('express');
const {
  getAllAnalyses,
  getComprehensiveStatistics,  // Changed from getAnalysisStats
  getAnalysisById,
  deleteAnalysis,
  exportAnalyses,              // Added export route
  // Note: These controllers don't exist in your provided file
  // getLatexAnalyses,
  // getLeafAnalyses, 
  // getTrunkAnalyses,
  // getPendingAnalyses,
  // getCompletedAnalyses,
  // hideAnalysis,
  // restoreAnalysis,
  // getRecentAnalyses,
  // getUserAnalysisHistory
} = require('../controllers/AdminAnalysisHistoryController');

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const router = express.Router();


router.use(isAuthenticatedUser, isAdmin);

router.get('/', getAllAnalyses);
router.get('/statistics', getComprehensiveStatistics);
router.get('/export', exportAnalyses);
router.get('/:type/:id', getAnalysisById);
router.delete('/:type/:id', deleteAnalysis);


module.exports = router;