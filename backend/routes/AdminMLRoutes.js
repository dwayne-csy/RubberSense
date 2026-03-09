const express = require('express');
const router = express.Router();
const {isAuthenticatedUser, isAdmin } = require('../middlewares/auth');
const{
    analyzeLatex,
    getLatexInfo,
    analyzeLeaf,
    getLeafInfo,
    analyzeTrunk,
    getTrunksInfo
} = require('../controllers/AdminMLController');

// ============================================
// LATEX ANALYSIS ROUTES
// ============================================

/**
 * @route   POST /api/v1/admin/ml/latex/analyze
 * @desc    Analyze latex image (admin version - no history)
 * @access  Private/Admin
 */
router.post('/latex/analyze',isAuthenticatedUser, isAdmin , analyzeLatex);

/**
 * @route   GET /api/v1/admin/ml/latex/info
 * @desc    Get latex ML system information
 * @access  Private/Admin
 */
router.get('/latex/info',isAuthenticatedUser, isAdmin , getLatexInfo);

// ============================================
// LEAF ANALYSIS ROUTES
// ============================================

/**
 * @route   POST /api/v1/admin/ml/leaf/analyze
 * @desc    Analyze leaf image (admin version - no history)
 * @access  Private/Admin
 */
router.post('/leaf/analyze', isAuthenticatedUser, isAdmin ,analyzeLeaf);

/**
 * @route   GET /api/v1/admin/ml/leaf/info
 * @desc    Get leaf ML system information
 * @access  Private/Admin
 */
router.get('/leaf/info', isAuthenticatedUser, isAdmin , getLeafInfo);

// ============================================
// TRUNK ANALYSIS ROUTES
// ============================================

/**
 * @route   POST /api/v1/admin/ml/trunks/analyze
 * @desc    Analyze trunk image (admin version - no history)
 * @access  Private/Admin
 */
router.post('/trunks/analyze',isAuthenticatedUser, isAdmin , analyzeTrunk);

/**
 * @route   GET /api/v1/admin/ml/trunks/info
 * @desc    Get trunk ML system information
 * @access  Private/Admin
 */
router.get('/trunks/info', isAuthenticatedUser, isAdmin , getTrunksInfo);



module.exports = router;