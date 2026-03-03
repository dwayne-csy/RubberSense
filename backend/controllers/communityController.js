const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const User = require('../models/User');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { 
  triggerContentReportedNotification, 
  triggerContentHiddenNotification 
} = require('../controllers/Notification');

// Import notification triggers
const {
  triggerPostLikeNotification,
  triggerPostCommentNotification,
  triggerCommentLikeNotification,
  triggerNewPostNotification
} = require('./Notification');

// Helper function to get user from request
const getUserIdFromRequest = (req) => {
  if (req.user && req.user._id) {
    return req.user._id;
  }
  return null;
};

// @route   GET /api/v1/community/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search = '',
      tag = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { isDeleted: false, isHidden: false };

    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    // Get total count for pagination
    const total = await CommunityPost.countDocuments(query);

    // Get posts with user data
    const posts = await CommunityPost.find(query)
      .populate('user', 'name email avatar.url contact address profilePicture')
      .populate({
        path: 'comments',
        match: { isDeleted: false, parentComment: null, isHidden: false },
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: [
          {
            path: 'user',
            select: 'name email avatar.url profilePicture'
          },
          {
            path: 'replies',
            match: { isDeleted: false, isHidden: false },
            options: { limit: 2, sort: { createdAt: -1 } },
            populate: {
              path: 'user',
              select: 'name email avatar.url profilePicture'
            }
          }
        ]
      })
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get current user ID to check if they liked each post
    const currentUserId = getUserIdFromRequest(req);

    // Add liked status to each post
    const postsWithLikedStatus = posts.map(post => {
      const postObject = post.toObject();
      const userLiked = currentUserId ? 
        post.likes.some(like => like.user.toString() === currentUserId.toString()) : 
        false;
      
      return {
        ...postObject,
        userLiked,
        likesCount: post.likes.length,
        commentsCount: post.comments.length
      };
    });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: postsWithLikedStatus
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @route   GET /api/v1/community/posts/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const post = await CommunityPost.findOne({
      _id: req.params.id,
      isDeleted: false,
      isHidden: false
    })
      .populate('user', 'name email avatar.url contact address profilePicture')
      .populate({
        path: 'comments',
        match: { isDeleted: false, parentComment: null, isHidden: false },
        populate: [
          {
            path: 'user',
            select: 'name email avatar.url profilePicture'
          },
          {
            path: 'replies',
            match: { isDeleted: false, isHidden: false },
            populate: {
              path: 'user',
              select: 'name email avatar.url profilePicture'
            }
          }
        ]
      })
      .select('-__v');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new post
// @route   POST /api/v1/community/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, media } = req.body;

    // Validate input - at least one field must be present
    if (!title && !content && (!media || media.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either title, content, or media'
      });
    }

    // Get user from request
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Create post with media
    const post = await CommunityPost.create({
      user: userId,
      title: title ? title.trim() : '',
      content: content ? content.trim() : '',
      media: media || []
    });

    // Trigger new post notification for followers
    await triggerNewPostNotification(post._id);

    // Populate user data
    await post.populate('user', 'name email avatar.url contact address profilePicture');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update post
// @route   PUT /api/v1/community/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    let post = await CommunityPost.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check ownership
    const userId = getUserIdFromRequest(req);
    if (post.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { title, content, media } = req.body;

    // Update fields
    if (title !== undefined) post.title = title.trim();
    if (content !== undefined) post.content = content.trim();
    if (media !== undefined) post.media = media;
    
    post.isEdited = true;
    post.lastEdited = Date.now();

    await post.save();

    // Populate user data
    await post.populate('user', 'name email avatar.url contact address profilePicture');

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete post (soft delete)
// @route   DELETE /api/v1/community/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await CommunityPost.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check ownership or admin role
    const userId = getUserIdFromRequest(req);
    if (post.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Soft delete the post
    post.isDeleted = true;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like/Unlike post
// @route   PUT /api/v1/community/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const post = await CommunityPost.findOne({
      _id: req.params.id,
      isDeleted: false,
      isHidden: false
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === userId.toString()
    );

    if (likeIndex === -1) {
      // Add like
      post.likes.unshift({ user: userId });
      
      // Trigger like notification (only if not liking own post)
      if (post.user.toString() !== userId.toString()) {
        await triggerPostLikeNotification(userId, req.params.id);
      }
    } else {
      // Remove like
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: {
        likes: post.likes,
        likesCount: post.likes.length
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get comments for a post
// @route   GET /api/v1/community/posts/:id/comments
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    const post = await CommunityPost.findOne({
      _id: req.params.id,
      isDeleted: false,
      isHidden: false
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comments = await CommunityComment.find({ 
      post: post._id,
      parentComment: null,
      isDeleted: false,
      isHidden: false
    })
    .populate('user', 'name email avatar.url profilePicture')
    .populate({
      path: 'replies',
      match: { isDeleted: false, isHidden: false },
      populate: {
        path: 'user',
        select: 'name email avatar.url profilePicture'
      }
    })
    .select('-__v')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/v1/community/posts/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const post = await CommunityPost.findOne({
      _id: req.params.id,
      isDeleted: false,
      isHidden: false
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { content, parentComment, media } = req.body;

    // Validate input - at least one field must be present
    if (!content && !media) {
      return res.status(400).json({
        success: false,
        message: 'Comment must have either content or media'
      });
    }

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const commentData = {
      post: post._id,
      user: userId,
      content: content ? content.trim() : '',
      media: media || null
    };

    // If this is a reply to another comment
    if (parentComment) {
      const parent = await CommunityComment.findOne({
        _id: parentComment,
        isDeleted: false,
        isHidden: false
      });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
      commentData.parentComment = parent._id;
    }

    const comment = await CommunityComment.create(commentData);

    // If this is a reply, add to parent comment's replies
    if (parentComment) {
      await CommunityComment.findByIdAndUpdate(
        parentComment,
        { $push: { replies: comment._id } }
      );
    } else {
      // Add comment to post
      post.comments.push(comment._id);
      await post.save();
    }

    // Trigger comment notification (only if not commenting on own post)
    if (post.user.toString() !== userId.toString()) {
      await triggerPostCommentNotification(userId, req.params.id, comment._id);
    }

    // Populate user data
    await comment.populate('user', 'name email avatar.url profilePicture');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update comment
// @route   PUT /api/v1/community/comments/:id
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await CommunityComment.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    const userId = getUserIdFromRequest(req);
    if (comment.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please add comment content'
      });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.lastEdited = Date.now();

    await comment.save();

    // Populate user data
    await comment.populate('user', 'name email avatar.url profilePicture');

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete comment (soft delete)
// @route   DELETE /api/v1/community/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await CommunityComment.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership or admin role
    const userId = getUserIdFromRequest(req);
    if (comment.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete the comment
    comment.isDeleted = true;
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like/Unlike comment
// @route   PUT /api/v1/community/comments/:id/like
// @access  Private
exports.likeComment = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const comment = await CommunityComment.findOne({
      _id: req.params.id,
      isDeleted: false,
      isHidden: false
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const likeIndex = comment.likes.findIndex(
      like => like.user.toString() === userId.toString()
    );

    if (likeIndex === -1) {
      // Add like
      comment.likes.unshift({ user: userId });
      
      // Trigger comment like notification (only if not liking own comment)
      if (comment.user.toString() !== userId.toString()) {
        await triggerCommentLikeNotification(userId, req.params.id);
      }
    } else {
      // Remove like
      comment.likes.splice(likeIndex, 1);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: {
        likes: comment.likes,
        likesCount: comment.likes.length
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Report a post or comment
// @route   POST /api/v1/community/report
// @access  Private
exports.reportContent = async (req, res, next) => {
  try {
    const { itemType, itemId, reason, description } = req.body;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate itemType
    if (!['post', 'comment'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "post" or "comment"'
      });
    }

    // Validate reason
    const validReasons = ['spam', 'harassment', 'hate_speech', 'inappropriate_content', 'false_information', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reason for report'
      });
    }

    // Check if item exists
    let item;
    let contentOwnerId = null;
    
    if (itemType === 'post') {
      item = await CommunityPost.findOne({
        _id: itemId,
        isDeleted: false
      }).populate('user', '_id name');
      
      if (item && item.user) {
        contentOwnerId = item.user._id;
      }
    } else {
      item = await CommunityComment.findOne({
        _id: itemId,
        isDeleted: false
      }).populate('user', '_id name');
      
      if (item && item.user) {
        contentOwnerId = item.user._id;
      }
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`
      });
    }

    // Check if user has already reported this item
    const existingReport = await Report.findOne({
      reporter: userId,
      reportedItemType: itemType,
      reportedItemId: itemId
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this content'
      });
    }

    // Create report
    const report = await Report.create({
      reporter: userId,
      reportedItemType: itemType,
      reportedItemId: itemId,
      reason: reason,
      description: description || ''
    });

    // Add report to item
    if (itemType === 'post') {
      await CommunityPost.findByIdAndUpdate(itemId, {
        $push: { reports: report._id },
        $inc: { reportCount: 1 }
      });
    } else {
      await CommunityComment.findByIdAndUpdate(itemId, {
        $push: { reports: report._id },
        $inc: { reportCount: 1 }
      });
    }

    // Send notification to content owner
    if (contentOwnerId && contentOwnerId.toString() !== userId.toString()) {
      try {
        const { triggerContentReportedNotification } = require('./Notification');
        await triggerContentReportedNotification(
          itemType,
          itemId,
          userId,
          reason,
          description || ''
        );
        console.log(`✅ ${itemType === 'post' ? 'Post' : 'Comment'} reported notification sent to user ${contentOwnerId}`);
      } catch (notificationError) {
        console.error('Error sending report notification:', notificationError);
      }
    }

    // Check if item should be automatically hidden (e.g., 5 reports)
    const reportCount = await Report.countDocuments({
      reportedItemType: itemType,
      reportedItemId: itemId,
      status: 'pending'
    });

    // Auto-hide content if it receives 5 or more reports
    if (reportCount >= 5) {
      if (itemType === 'post') {
        await CommunityPost.findByIdAndUpdate(itemId, {
          isHidden: true,
          hiddenReason: 'multiple_reports',
          hiddenAt: Date.now()
        });
        console.log(`⚠️ Post ${itemId} automatically hidden due to ${reportCount} reports`);
      } else {
        await CommunityComment.findByIdAndUpdate(itemId, {
          isHidden: true,
          hiddenReason: 'multiple_reports',
          hiddenAt: Date.now()
        });
        console.log(`⚠️ Comment ${itemId} automatically hidden due to ${reportCount} reports`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Content reported successfully. Our team will review it.',
      data: report
    });
  } catch (error) {
    console.error('Report content error:', error);
    
    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this content'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's reports
// @route   GET /api/v1/community/user/reports
// @access  Private
exports.getUserReports = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const reports = await Report.find({ reporter: userId })
      .sort('-createdAt')
      .populate({
        path: 'reportedItemId',
        select: 'title content user',
        populate: {
          path: 'user',
          select: 'name profilePicture'
        }
      })
      .lean();

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get trending posts
// @route   GET /api/v1/community/trending
// @access  Public
exports.getTrendingPosts = async (req, res, next) => {
  try {
    const trendingPosts = await CommunityPost.aggregate([
      { $match: { isDeleted: false, isHidden: false } },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 2] },
              { $multiply: [{ $size: '$comments' }, 3] },
              '$views'
            ]
          }
        }
      },
      { $sort: { engagementScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          media: 1,
          tags: 1,
          likes: 1,
          comments: 1,
          views: 1,
          engagementScore: 1,
          createdAt: 1,
          'user._id': 1,
          'user.name': 1,
          'user.email': 1,
          'user.avatar.url': 1,
          'user.contact': 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: trendingPosts.length,
      data: trendingPosts
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/v1/community/user/posts
// @access  Private
exports.getUserPosts = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const posts = await CommunityPost.find({ 
      user: userId,
      isDeleted: false 
    })
      .populate('user', 'name email avatar.url contact address profilePicture')
      .select('-__v')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get popular tags
// @route   GET /api/v1/community/tags
// @access  Public
exports.getPopularTags = async (req, res, next) => {
  try {
    const tags = await CommunityPost.aggregate([
      { $match: { isDeleted: false, isHidden: false } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search posts and comments
// @route   GET /api/v1/community/search
// @access  Public
exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchQuery = q.trim();

    // Search for users by name
    const users = await User.find({
      name: { $regex: searchQuery, $options: 'i' }
    })
    .select('_id name email profilePicture avatar bio')
    .limit(10);

    // Get user IDs from found users
    const userIds = users.map(user => user._id);

    // Search in posts (including posts from found users)
    const posts = await CommunityPost.find({
      isDeleted: false,
      isHidden: false,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } },
        { user: { $in: userIds } }
      ]
    })
    .populate({
      path: 'user',
      select: 'name email profilePicture avatar bio contact address'
    })
    .select('-__v')
    .lean()
    .sort('-createdAt')
    .limit(20);

    // Get current user ID to check if they liked each post
    const currentUserId = getUserIdFromRequest(req);

    // Add liked status to each post
    const postsWithLikedStatus = posts.map(post => {
      // Ensure likes array exists
      const likes = post.likes || [];
      const userLiked = currentUserId ? 
        likes.some(like => like.user && like.user.toString() === currentUserId.toString()) : 
        false;
      
      return {
        ...post,
        userLiked,
        likesCount: likes.length || 0,
        commentsCount: post.comments ? post.comments.length : 0
      };
    });

    // Search in comments
    const comments = await CommunityComment.find({
      isDeleted: false,
      isHidden: false,
      content: { $regex: searchQuery, $options: 'i' }
    })
    .populate({
      path: 'user',
      select: 'name email profilePicture avatar bio'
    })
    .populate({
      path: 'post',
      select: 'title _id'
    })
    .select('-__v')
    .lean()
    .sort('-createdAt')
    .limit(10);

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithLikedStatus,
        comments,
        users
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};