const Report = require('../models/Report');
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

const { triggerContentReportedNotification, triggerContentHiddenNotification } = require('../controllers/Notification');



// @desc    Get all reports (admin only)
// @route   GET /api/v1/admin/reports
// @access  Private/Admin
exports.getAllReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = '',
      type = '',
      search = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by type
    if (type && type !== 'all') {
      query.reportedItemType = type;
    }

    // Search functionality
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(user => user._id);

      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reporter: { $in: userIds } }
      ];
    }

    // Get total count
    const total = await Report.countDocuments(query);

    // Get reports with population
    const reports = await Report.find(query)
      .populate({
        path: 'reporter',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'reportedItemId',
        select: 'content sender recipient isHidden reportCount createdAt',
        populate: [
          {
            path: 'sender',
            select: 'name profilePicture'
          },
          {
            path: 'recipient',
            select: 'name profilePicture'
          }
        ]
      })
      .populate({
        path: 'resolvedBy',
        select: 'name email'
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Process reports to ensure consistent structure
    const processedReports = reports.map(report => {
      let reportedItem = report.reportedItemId;
      
      // Handle different types of reported items
      if (!reportedItem) {
        // Create placeholder for unavailable content
        reportedItem = {
          _id: report.reportedItemId,
          content: 'Content unavailable',
          sender: { name: 'Unknown User' },
          recipient: { name: 'Unknown User' },
          isHidden: false,
          reportCount: 0,
          createdAt: report.createdAt
        };
      }

      return {
        ...report,
        reportedItem
      };
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: processedReports
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// @desc    Get pending reports (admin only)
// @route   GET /api/v1/admin/reports/pending
// @access  Private/Admin
exports.getPendingReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate({
        path: 'reporter',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'reportedItemId',
        select: 'title content user',
        populate: {
          path: 'user',
          select: 'name profilePicture'
        }
      })
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get resolved reports (admin only)
// @route   GET /api/v1/admin/reports/resolved
// @access  Private/Admin
exports.getResolvedReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ status: 'resolved' })
      .populate({
        path: 'reporter',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'reportedItemId',
        select: 'title content user',
        populate: {
          path: 'user',
          select: 'name profilePicture'
        }
      })
      .populate({
        path: 'resolvedBy',
        select: 'name email'
      })
      .sort('-resolvedAt')
      .lean();

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get resolved reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update report status (admin only)
// @route   PUT /api/v1/admin/reports/:id
// @access  Private/Admin
exports.updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report
    report.status = status || report.status;
    report.adminNotes = adminNotes !== undefined ? adminNotes : report.adminNotes;
    
    // If marking as resolved, add resolved timestamp and admin
    if (status === 'resolved' && report.status !== 'resolved') {
      report.resolvedAt = Date.now();
      report.resolvedBy = req.user._id;
    }

    await report.save();

    // Populate updated report
    await report.populate({
      path: 'reporter',
      select: 'name email profilePicture'
    });

    await report.populate({
      path: 'resolvedBy',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete report (admin only)
// @route   DELETE /api/v1/admin/reports/:id
// @access  Private/Admin
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Remove report reference from reported item
    if (report.reportedItemType === 'post') {
      await CommunityPost.findByIdAndUpdate(report.reportedItemId, {
        $pull: { reports: report._id }
      });
    } else if (report.reportedItemType === 'comment') {
      await CommunityComment.findByIdAndUpdate(report.reportedItemId, {
        $pull: { reports: report._id }
      });
    } else if (report.reportedItemType === 'message') {
      await Message.findByIdAndUpdate(report.reportedItemId, {
        $inc: { reportCount: -1 }
      });
    }

    // Delete the report
    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Hide a post (admin only)
// @route   PUT /api/v1/admin/posts/:id/hide
// @access  Private/Admin
exports.hidePost = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.isHidden = true;
    post.hiddenReason = reason || 'admin_action';
    post.hiddenBy = req.user._id;
    post.hiddenAt = Date.now();

    await post.save();

    // Send notification to post owner about admin action
    if (post.user && post.user.toString() !== req.user._id.toString()) {
      await triggerContentHiddenNotification('post', post._id, req.user._id, reason);
    }

    // Mark all related reports as resolved
    await Report.updateMany(
      {
        reportedItemType: 'post',
        reportedItemId: post._id,
        status: 'pending'
      },
      {
        $set: {
          status: 'resolved',
          resolvedAt: Date.now(),
          resolvedBy: req.user._id,
          adminNotes: `Content hidden: ${reason || 'admin_action'}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Post hidden successfully',
      data: post
    });
  } catch (error) {
    console.error('Hide post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Hide a comment (admin only)
// @route   PUT /api/v1/admin/comments/:id/hide
// @access  Private/Admin
exports.hideComment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const comment = await CommunityComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.isHidden = true;
    comment.hiddenReason = reason || 'admin_action';
    comment.hiddenBy = req.user._id;
    comment.hiddenAt = Date.now();

    await comment.save();

    // Send notification to comment owner about admin action
    if (comment.user && comment.user.toString() !== req.user._id.toString()) {
      await triggerContentHiddenNotification('comment', comment._id, req.user._id, reason);
    }

    // Mark all related reports as resolved
    await Report.updateMany(
      {
        reportedItemType: 'comment',
        reportedItemId: comment._id,
        status: 'pending'
      },
      {
        $set: {
          status: 'resolved',
          resolvedAt: Date.now(),
          resolvedBy: req.user._id,
          adminNotes: `Content hidden: ${reason || 'admin_action'}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Comment hidden successfully',
      data: comment
    });
  } catch (error) {
    console.error('Hide comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Hide a message (admin only)
// @route   PUT /api/v1/admin/messages/:id/hide
// @access  Private/Admin
exports.hideMessage = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isHidden = true;
    message.hiddenReason = reason || 'admin_action';
    message.hiddenBy = req.user._id;
    message.hiddenAt = Date.now();

    await message.save();

    // Send notification to message sender about admin action
    if (message.sender && message.sender.toString() !== req.user._id.toString()) {
      await triggerContentHiddenNotification('message', message._id, req.user._id, reason);
    }

    // Mark all related reports as resolved
    await Report.updateMany(
      {
        reportedItemType: 'message',
        reportedItemId: message._id,
        status: 'pending'
      },
      {
        $set: {
          status: 'resolved',
          resolvedAt: Date.now(),
          resolvedBy: req.user._id,
          adminNotes: `Content hidden: ${reason || 'admin_action'}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Message hidden successfully',
      data: message
    });
  } catch (error) {
    console.error('Hide message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get report statistics (admin only)
// @route   GET /api/v1/admin/reports/stats
// @access  Private/Admin
exports.getReportStats = async (req, res, next) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          reviewed: {
            $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          dismissed: {
            $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] }
          },
          posts: {
            $sum: { $cond: [{ $eq: ['$reportedItemType', 'post'] }, 1, 0] }
          },
          comments: {
            $sum: { $cond: [{ $eq: ['$reportedItemType', 'comment'] }, 1, 0] }
          },
          messages: {
            $sum: { $cond: [{ $eq: ['$reportedItemType', 'message'] }, 1, 0] }
          }
        }
      }
    ]);

    const dailyStats = await Report.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
      posts: 0,
      comments: 0,
      messages: 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get post details for admin (admin only)
// @route   GET /api/v1/admin/reports/posts/:id
// @access  Private/Admin
exports.getPostForAdmin = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('user', 'name email profilePicture')
      .populate({
        path: 'comments',
        match: { isDeleted: false, parentComment: null },
        options: { limit: 10, sort: { createdAt: -1 } },
        populate: [
          {
            path: 'user',
            select: 'name profilePicture'
          },
          {
            path: 'replies',
            match: { isDeleted: false },
            options: { limit: 5, sort: { createdAt: -1 } },
            populate: {
              path: 'user',
              select: 'name profilePicture'
            }
          }
        ]
      })
      .select('-__v')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get comment details for admin (admin only)
// @route   GET /api/v1/admin/reports/comments/:id
// @access  Private/Admin
exports.getCommentForAdmin = async (req, res, next) => {
  try {
    const comment = await CommunityComment.findById(req.params.id)
      .populate('user', 'name email profilePicture')
      .populate({
        path: 'media', // ADD THIS: populate comment media
        select: 'url mimetype thumbnailUrl'
      })
      .populate({
        path: 'post',
        select: 'title user media', // Include post media too
        populate: [
          {
            path: 'user',
            select: 'name profilePicture'
          },
          {
            path: 'media',
            select: 'url mimetype thumbnailUrl'
          }
        ]
      })
      .select('-__v')
      .lean();

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Get comment for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get message details for admin (admin only)
// @route   GET /api/v1/admin/reports/messages/
// @access  Private/Admin
exports.getMessageForAdmin = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email profilePicture')
      .populate('recipient', 'name email profilePicture')
      .populate('reportedBy.user', 'name email')
      .select('-__v')
      .lean();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Get message for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};