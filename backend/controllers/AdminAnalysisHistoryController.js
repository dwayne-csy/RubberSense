const LatexAnalysis = require('../models/LatexAnalysis');
const LeafAnalysis = require('../models/LeafAnalysis');
const TrunksAnalysis = require('../models/TrunksAnalysis');
const User = require('../models/User');

// ============================================
// ADMIN ANALYSIS HISTORY CONTROLLER
// ============================================

/**
 * @desc    Get all analyses across all users with filtering and pagination
 * @route   GET /api/v1/admin/analyses
 * @access  Private/Admin
 */
exports.getAllAnalyses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      userId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get analyses from each collection
    let latexAnalyses = [];
    let leafAnalyses = [];
    let trunksAnalyses = [];

    // Fetch based on type filter
    if (!type || type === 'latex') {
      latexAnalyses = await LatexAnalysis.find({
        ...(userId && { userId }),
        ...dateFilter
      })
      .populate('userId', 'name email')
      .lean();
      
      latexAnalyses = latexAnalyses.map(a => ({
        ...a,
        analysisType: 'latex',
        displayName: 'Latex Analysis',
        resultSummary: {
          qualityClass: a.qualityClass,
          qualityScore: a.qualityScore,
          dryRubberContent: a.dryRubberContent
        }
      }));
    }

    if (!type || type === 'leaf') {
      leafAnalyses = await LeafAnalysis.find({
        ...(userId && { userId }),
        ...dateFilter
      })
      .populate('userId', 'name email')
      .lean();
      
      leafAnalyses = leafAnalyses.map(a => ({
        ...a,
        analysisType: 'leaf',
        displayName: 'Leaf Disease Detection',
        resultSummary: {
          disease: a.diseaseDetected,
          severity: a.severity,
          severityLevel: a.severityLevel,
          confidence: a.confidence
        }
      }));
    }

    if (!type || type === 'trunk') {
      trunksAnalyses = await TrunksAnalysis.find({
        ...(userId && { userId }),
        ...dateFilter
      })
      .populate('userId', 'name email')
      .lean();
      
      trunksAnalyses = trunksAnalyses.map(a => ({
        ...a,
        analysisType: 'trunk',
        displayName: 'Trunk Analysis',
        resultSummary: {
          primaryDetection: a.primaryDetection,
          healthScore: a.healthScore,
          maturity: a.maturity?.class
        }
      }));
    }

    // Combine all analyses
    let allAnalyses = [...latexAnalyses, ...leafAnalyses, ...trunksAnalyses];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allAnalyses = allAnalyses.filter(analysis => {
        const userName = analysis.userId?.name?.toLowerCase() || '';
        const userEmail = analysis.userId?.email?.toLowerCase() || '';
        
        if (analysis.analysisType === 'latex') {
          return userName.includes(searchLower) ||
                 userEmail.includes(searchLower) ||
                 analysis.qualityClass?.toLowerCase().includes(searchLower);
        } else if (analysis.analysisType === 'leaf') {
          return userName.includes(searchLower) ||
                 userEmail.includes(searchLower) ||
                 analysis.diseaseDetected?.toLowerCase().includes(searchLower);
        } else if (analysis.analysisType === 'trunk') {
          return userName.includes(searchLower) ||
                 userEmail.includes(searchLower) ||
                 analysis.primaryDetection?.display_name?.toLowerCase().includes(searchLower);
        }
        return false;
      });
    }

    // Sort analyses
    allAnalyses.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (order === 'desc') {
        return new Date(bVal) - new Date(aVal);
      } else {
        return new Date(aVal) - new Date(bVal);
      }
    });

    // Paginate
    const total = allAnalyses.length;
    const paginatedAnalyses = allAnalyses.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedAnalyses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      filters: {
        type: type || 'all',
        userId: userId || null,
        dateRange: { startDate, endDate },
        search: search || null
      }
    });
  } catch (error) {
    console.error('❌ Get all analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analyses',
      error: error.message
    });
  }
};

/**
 * @desc    Get comprehensive statistics across all analysis types
 * @route   GET /api/v1/admin/statistics
 * @access  Private/Admin
 */
exports.getComprehensiveStatistics = async (req, res) => {
  try {
    const { timeRange = '30days' } = req.query;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: startDate }
    });
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get analysis counts
    const [
      totalLatex,
      totalLeaf,
      totalTrunks,
      latexStats,
      leafStats,
      trunksStats,
      recentActivity
    ] = await Promise.all([
      LatexAnalysis.countDocuments(),
      LeafAnalysis.countDocuments(),
      TrunksAnalysis.countDocuments(),
      
      // Latex statistics
      LatexAnalysis.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgQualityScore: { $avg: '$qualityScore' },
            avgDRC: { $avg: '$dryRubberContent' },
            highQuality: {
              $sum: { $cond: [{ $eq: ['$qualityClass', 'High'] }, 1, 0] }
            },
            mediumQuality: {
              $sum: { $cond: [{ $eq: ['$qualityClass', 'Medium'] }, 1, 0] }
            },
            lowQuality: {
              $sum: { $cond: [{ $eq: ['$qualityClass', 'Low'] }, 1, 0] }
            }
          }
        }
      ]),

      // Leaf statistics
      LeafAnalysis.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
            avgSeverity: { $avg: '$severity' },
            criticalCases: {
              $sum: { $cond: [{ $gte: ['$severity', 70] }, 1, 0] }
            }
          }
        }
      ]),

      // Trunks statistics
      TrunksAnalysis.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgHealthScore: { $avg: '$healthScore' },
            avgConfidence: { $avg: '$primaryDetection.confidence' },
            healthyTrees: {
              $sum: { $cond: [{ $gte: ['$healthScore', 70] }, 1, 0] }
            },
            criticalTrees: {
              $sum: { $cond: [{ $lte: ['$healthScore', 30] }, 1, 0] }
            }
          }
        }
      ]),

      // Recent activity (last 7 days daily counts)
      Promise.all([
        LatexAnalysis.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              type: { $first: 'latex' }
            }
          }
        ]),
        LeafAnalysis.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              type: { $first: 'leaf' }
            }
          }
        ]),
        TrunksAnalysis.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              type: { $first: 'trunk' }
            }
          }
        ])
      ])
    ]);

    // Get top diseases from leaf analysis
    const topDiseases = await LeafAnalysis.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$diseaseDetected',
          count: { $sum: 1 },
          avgSeverity: { $avg: '$severity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get top trunk conditions
    const topTrunkConditions = await TrunksAnalysis.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$primaryDetection.display_name',
          count: { $sum: 1 },
          avgHealthScore: { $avg: '$healthScore' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get user activity ranking
    const topUsers = await Promise.all([
      LatexAnalysis.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, type: { $first: 'latex' } } }
      ]),
      LeafAnalysis.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, type: { $first: 'leaf' } } }
      ]),
      TrunksAnalysis.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, type: { $first: 'trunk' } } }
      ])
    ]);

    // Combine user activities
    const userActivityMap = new Map();
    [...topUsers[0], ...topUsers[1], ...topUsers[2]].forEach(item => {
      const userId = item._id?.toString();
      if (userId) {
        const current = userActivityMap.get(userId) || { total: 0, latex: 0, leaf: 0, trunk: 0 };
        current.total += item.count;
        current[item.type] = (current[item.type] || 0) + item.count;
        userActivityMap.set(userId, current);
      }
    });

    // Get top 10 users by activity
    const topUserIds = Array.from(userActivityMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([id]) => id);

    const topUserDetails = await User.find(
      { _id: { $in: topUserIds } },
      'name email'
    ).lean();

    const topUserActivity = topUserDetails.map(user => ({
      ...user,
      activity: userActivityMap.get(user._id.toString()) || { total: 0, latex: 0, leaf: 0, trunk: 0 }
    }));

    // Combine recent activity
    const combinedRecentActivity = recentActivity.flat().reduce((acc, curr) => {
      const existing = acc.find(item => item.date === curr._id);
      if (existing) {
        existing[curr.type] = curr.count;
        existing.total += curr.count;
      } else {
        acc.push({
          date: curr._id,
          latex: curr.type === 'latex' ? curr.count : 0,
          leaf: curr.type === 'leaf' ? curr.count : 0,
          trunk: curr.type === 'trunk' ? curr.count : 0,
          total: curr.count
        });
      }
      return acc;
    }, []);

    res.status(200).json({
      success: true,
      data: {
        timeRange: {
          from: startDate,
          to: endDate,
          label: timeRange
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          activityRate: totalUsers ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
        },
        analyses: {
          total: totalLatex + totalLeaf + totalTrunks,
          byType: {
            latex: totalLatex,
            leaf: totalLeaf,
            trunks: totalTrunks
          }
        },
        latex: {
          total: latexStats[0]?.total || 0,
          avgQualityScore: latexStats[0]?.avgQualityScore?.toFixed(1) || 0,
          avgDRC: latexStats[0]?.avgDRC?.toFixed(1) || 0,
          qualityDistribution: {
            high: latexStats[0]?.highQuality || 0,
            medium: latexStats[0]?.mediumQuality || 0,
            low: latexStats[0]?.lowQuality || 0
          }
        },
        leaf: {
          total: leafStats[0]?.total || 0,
          avgConfidence: leafStats[0]?.avgConfidence?.toFixed(1) || 0,
          avgSeverity: leafStats[0]?.avgSeverity?.toFixed(1) || 0,
          criticalCases: leafStats[0]?.criticalCases || 0,
          topDiseases
        },
        trunks: {
          total: trunksStats[0]?.total || 0,
          avgHealthScore: trunksStats[0]?.avgHealthScore?.toFixed(1) || 0,
          avgConfidence: trunksStats[0]?.avgConfidence?.toFixed(1) || 0,
          healthyTrees: trunksStats[0]?.healthyTrees || 0,
          criticalTrees: trunksStats[0]?.criticalTrees || 0,
          topConditions: topTrunkConditions
        },
        recentActivity: combinedRecentActivity.sort((a, b) => a.date.localeCompare(b.date)),
        topUsers: topUserActivity,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Get comprehensive statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get detailed analysis by ID (any type)
 * @route   GET /api/v1/admin/analyses/:type/:id
 * @access  Private/Admin
 */
exports.getAnalysisById = async (req, res) => {
  try {
    const { type, id } = req.params;

    let analysis = null;
    let Model;

    switch (type) {
      case 'latex':
        Model = LatexAnalysis;
        break;
      case 'leaf':
        Model = LeafAnalysis;
        break;
      case 'trunk':
        Model = TrunksAnalysis;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis type'
        });
    }

    analysis = await Model.findById(id).populate('userId', 'name email').lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    analysis.analysisType = type;

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('❌ Get analysis by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis',
      error: error.message
    });
  }
};

/**
 * @desc    Delete analysis (any type)
 * @route   DELETE /api/v1/admin/analyses/:type/:id
 * @access  Private/Admin
 */
exports.deleteAnalysis = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { deleteFromCloudinary } = require('../utils/Cloudinary');

    let Model;

    switch (type) {
      case 'latex':
        Model = LatexAnalysis;
        break;
      case 'leaf':
        Model = LeafAnalysis;
        break;
      case 'trunk':
        Model = TrunksAnalysis;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis type'
        });
    }

    const analysis = await Model.findById(id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Delete image from Cloudinary
    if (analysis.imagePublicId) {
      try {
        await deleteFromCloudinary(analysis.imagePublicId);
        console.log(`✅ Deleted image from Cloudinary: ${analysis.imagePublicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    await Model.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting analysis',
      error: error.message
    });
  }
};

/**
 * @desc    Export analyses data
 * @route   GET /api/v1/admin/analyses/export
 * @access  Private/Admin
 */
exports.exportAnalyses = async (req, res) => {
  try {
    const { format = 'json', type, startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let latexData = [];
    let leafData = [];
    let trunksData = [];

    if (!type || type === 'latex') {
      latexData = await LatexAnalysis.find(dateFilter)
        .populate('userId', 'name email')
        .lean();
    }

    if (!type || type === 'leaf') {
      leafData = await LeafAnalysis.find(dateFilter)
        .populate('userId', 'name email')
        .lean();
    }

    if (!type || type === 'trunk') {
      trunksData = await TrunksAnalysis.find(dateFilter)
        .populate('userId', 'name email')
        .lean();
    }

    const exportData = {
      generatedAt: new Date().toISOString(),
      filters: { type, startDate, endDate },
      statistics: {
        total: latexData.length + leafData.length + trunksData.length,
        byType: {
          latex: latexData.length,
          leaf: leafData.length,
          trunks: trunksData.length
        }
      },
      data: {
        latex: latexData,
        leaf: leafData,
        trunks: trunksData
      }
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=rubbersense-analytics-${Date.now()}.json`);
      return res.status(200).json(exportData);
    } else if (format === 'csv') {
      // Simplified CSV export - you might want to implement proper CSV conversion
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=rubbersense-analytics-${Date.now()}.csv`);
      
      // Create CSV header
      let csv = 'Type,User,Date,Result,Confidence\n';
      
      latexData.forEach(item => {
        csv += `Latex,${item.userId?.email || 'Unknown'},${item.createdAt},${item.qualityClass || 'Unknown'},${item.qualityScore || 0}\n`;
      });
      
      leafData.forEach(item => {
        csv += `Leaf,${item.userId?.email || 'Unknown'},${item.createdAt},${item.diseaseDetected || 'Unknown'},${item.confidence || 0}\n`;
      });
      
      trunksData.forEach(item => {
        csv += `Trunk,${item.userId?.email || 'Unknown'},${item.createdAt},${item.primaryDetection?.display_name || 'Unknown'},${item.primaryDetection?.confidence || 0}\n`;
      });
      
      return res.status(200).send(csv);
    }

    res.status(200).json(exportData);
  } catch (error) {
    console.error('❌ Export analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting analyses',
      error: error.message
    });
  }
};