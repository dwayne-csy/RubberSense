const Notification = require('../models/Notification');
const User = require('../models/User');
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const UserProfile = require('../models/UserProfile');
const Message = require('../models/Message');

// Helper function to create notification
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// ========== GET USER NOTIFICATIONS ==========
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get notifications
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name email profilePicture avatar')
      .populate({
        path: 'post',
        select: 'title content media user',
        populate: {
          path: 'user',
          select: 'name profilePicture avatar'
        }
      })
      .populate({
        path: 'comment',
        select: 'content post',
        populate: {
          path: 'post',
          select: 'title'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get current user's profile to check follow status
    const currentUserProfile = await UserProfile.findOne({ user: userId });
    
    // Add follow status to each notification
    const notificationsWithFollowStatus = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.type === 'follow' && notification.sender) {
          // Check if current user is already following the sender
          let isFollowing = false;
          if (currentUserProfile) {
            isFollowing = currentUserProfile.following.includes(notification.sender._id);
          }
          
          return {
            ...notification,
            followStatus: {
              isFollowing,
              canFollowBack: !isFollowing // If not following, can follow back
            }
          };
        }
        return notification;
      })
    );

    // Get total count
    const total = await Notification.countDocuments({ recipient: userId });
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      unreadCount,
      data: notificationsWithFollowStatus
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// ========== MARK NOTIFICATIONS AS READ ==========
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;

    if (notificationId) {
      // Mark single notification as read
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      // Mark all notifications as read
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } }
      );

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    }

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

// ========== DELETE NOTIFICATION ==========
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// ========== CLEAR ALL NOTIFICATIONS ==========
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ recipient: userId });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared'
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
};

// ========== GET UNREAD COUNT ==========
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// ========== FOLLOW BACK FUNCTION ==========
exports.followBack = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: 'Sender ID is required'
      });
    }

    // Check if sender exists
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current user's profile
    let currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    if (!currentUserProfile) {
      const currentUser = await User.findById(currentUserId);
      currentUserProfile = new UserProfile({
        user: currentUserId,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar
      });
      await currentUserProfile.save();
    }

    // Check if already following
    const isAlreadyFollowing = currentUserProfile.following.includes(senderId);
    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Follow back the sender
    await currentUserProfile.followUser(senderId);

    // Create notification for the sender that they've been followed back
    await createNotification({
      recipient: senderId,
      sender: currentUserId,
      type: 'follow',
      message: `${currentUserProfile.name || 'Someone'} followed you back`,
      link: `/profile/${currentUserId}`
    });

    res.status(200).json({
      success: true,
      message: 'Followed back successfully',
      isFollowing: true
    });

  } catch (error) {
    console.error('Follow back error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow back'
    });
  }
};

// ========== GET FOLLOW STATUS FOR SPECIFIC USER ==========
exports.getFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    // Get current user's profile
    const currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    
    let isFollowing = false;
    if (currentUserProfile) {
      isFollowing = currentUserProfile.following.includes(userId);
    }

    res.status(200).json({
      success: true,
      isFollowing,
      userId
    });

  } catch (error) {
    console.error('Get follow status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get follow status'
    });
  }
};

// ========== NOTIFICATION TRIGGERS (These would be called from other controllers) ==========

// Trigger when someone follows a user
exports.triggerFollowNotification = async (followerId, followedUserId) => {
  try {
    const follower = await User.findById(followerId).select('name profilePicture');
    const followedUser = await User.findById(followedUserId);

    if (!follower || !followedUser) return;

    const message = `${follower.name || 'Someone'} started following you`;
    
    await createNotification({
      recipient: followedUserId,
      sender: followerId,
      type: 'follow',
      message: message,
      link: `/profile/${followerId}`
    });

  } catch (error) {
    console.error('Trigger follow notification error:', error);
  }
};

// Trigger when someone likes a post
exports.triggerPostLikeNotification = async (likerId, postId) => {
  try {
    const post = await CommunityPost.findById(postId).populate('user', '_id');
    const liker = await User.findById(likerId).select('name profilePicture');

    if (!post || !liker || post.user._id.toString() === likerId.toString()) {
      return; // Don't notify if user likes their own post
    }

    const message = `${liker.name || 'Someone'} liked your post`;
    
    await createNotification({
      recipient: post.user._id,
      sender: likerId,
      type: 'post_like',
      post: postId,
      message: message,
      link: `/post/${postId}`
    });

  } catch (error) {
    console.error('Trigger post like notification error:', error);
  }
};

// Trigger when someone comments on a post
exports.triggerPostCommentNotification = async (commenterId, postId, commentId) => {
  try {
    const post = await CommunityPost.findById(postId).populate('user', '_id');
    const commenter = await User.findById(commenterId).select('name profilePicture');

    if (!post || !commenter || post.user._id.toString() === commenterId.toString()) {
      return; // Don't notify if user comments on their own post
    }

    const message = `${commenter.name || 'Someone'} commented on your post`;
    
    await createNotification({
      recipient: post.user._id,
      sender: commenterId,
      type: 'post_comment',
      post: postId,
      comment: commentId,
      message: message,
      link: `/post/${postId}`
    });

  } catch (error) {
    console.error('Trigger post comment notification error:', error);
  }
};

// Trigger when someone likes a comment
exports.triggerCommentLikeNotification = async (likerId, commentId) => {
  try {
    const comment = await CommunityComment.findById(commentId)
      .populate('user', '_id')
      .populate('post', '_id');
    
    const liker = await User.findById(likerId).select('name profilePicture');

    if (!comment || !liker || comment.user._id.toString() === likerId.toString()) {
      return; // Don't notify if user likes their own comment
    }

    const message = `${liker.name || 'Someone'} liked your comment`;
    
    await createNotification({
      recipient: comment.user._id,
      sender: likerId,
      type: 'comment_like',
      post: comment.post?._id,
      comment: commentId,
      message: message,
      link: `/post/${comment.post?._id}`
    });

  } catch (error) {
    console.error('Trigger comment like notification error:', error);
  }
};

// Trigger for new posts from followed users
exports.triggerNewPostNotification = async (postId) => {
  try {
    const post = await CommunityPost.findById(postId)
      .populate('user', '_id name profilePicture');
    
    if (!post) return;

    // Get the user's profile to find followers
    const userProfile = await UserProfile.findOne({ user: post.user._id });
    
    if (!userProfile || userProfile.followers.length === 0) return;

    const message = `${post.user.name || 'Someone'} posted something new`;
    
    // Create notifications for each follower
    const notificationPromises = userProfile.followers.map(async (followerId) => {
      // Don't notify the post creator
      if (followerId.toString() === post.user._id.toString()) return null;

      return createNotification({
        recipient: followerId,
        sender: post.user._id,
        type: 'new_post',
        post: postId,
        message: message,
        link: `/post/${postId}`
      });
    });

    await Promise.all(notificationPromises);

  } catch (error) {
    console.error('Trigger new post notification error:', error);
  }
};

// Trigger when content is reported
exports.triggerContentReportedNotification = async (reportedItemType, reportedItemId, reporterId, reason, description) => {
  try {
    console.log(`🔔 [triggerContentReportedNotification] Starting for ${reportedItemType}: ${reportedItemId}`);
    
    let contentOwnerId = null;
    let contentDetails = {};
    let contentTypeName = '';
    
    // Get content owner based on type
    if (reportedItemType === 'post') {
      const post = await CommunityPost.findById(reportedItemId).populate('user', '_id name');
      if (post && post.user) {
        contentOwnerId = post.user._id;
        contentTypeName = 'post';
        console.log(`📝 Found post owner: ${contentOwnerId}`);
      } else {
        console.log(`❌ Post not found or has no owner: ${reportedItemId}`);
      }
    } else if (reportedItemType === 'comment') {
      const comment = await CommunityComment.findById(reportedItemId).populate('user', '_id name');
      if (comment && comment.user) {
        contentOwnerId = comment.user._id;
        contentTypeName = 'comment';
        console.log(`📝 Found comment owner: ${contentOwnerId}`);
      } else {
        console.log(`❌ Comment not found or has no owner: ${reportedItemId}`);
      }
    } else if (reportedItemType === 'message') {
      const message = await Message.findById(reportedItemId).populate('sender', '_id name');
      if (message && message.sender) {
        contentOwnerId = message.sender._id;
        contentTypeName = 'message';
        console.log(`📝 Found message sender: ${contentOwnerId}`);
      } else {
        console.log(`❌ Message not found or has no sender: ${reportedItemId}`);
      }
    }
    
    if (!contentOwnerId) {
      console.log(`❌ No content owner found for ${reportedItemType} ${reportedItemId}`);
      return false;
    }
    
    // Don't create notification if reporter is the content owner
    if (contentOwnerId.toString() === reporterId.toString()) {
      console.log(`ℹ️ Reporter is the content owner, skipping notification`);
      return false;
    }
    
    const reporter = await User.findById(reporterId).select('name profilePicture');
    
    const message = `Your ${contentTypeName} has been reported by ${reporter?.name || 'a user'}`;
    
    // Prepare notification data
    const notificationData = {
      recipient: contentOwnerId,
      sender: reporterId,
      type: 'content_reported',
      message: message,
      link: reportedItemType === 'message' ? '/messages' : '/community-blogspot',
      reportReason: reason,
      contentType: contentTypeName,
      isRead: false
    };
    
    // Add the content reference - IMPORTANT: use messageRef for messages
    if (reportedItemType === 'post') {
      notificationData.post = reportedItemId;
    } else if (reportedItemType === 'comment') {
      notificationData.comment = reportedItemId;
    } else if (reportedItemType === 'message') {
      notificationData.messageRef = reportedItemId; // Use messageRef instead of message
    }
    
    console.log(`📨 Creating reported notification data:`, JSON.stringify(notificationData, null, 2));
    
    // Create the notification
    const notification = await createNotification(notificationData);
    
    if (notification) {
      console.log(`✅ ${contentTypeName} reported notification sent to user ${contentOwnerId}`);
      return true;
    } else {
      console.log(`❌ Failed to create reported notification for user ${contentOwnerId}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Trigger content reported notification error:', error);
    console.error('Error stack:', error.stack);
    return false;
  }
};

// Trigger when content is hidden by admin
exports.triggerContentHiddenNotification = async (contentType, contentId, adminId, reason) => {
  try {
    console.log(`🔔 [triggerContentHiddenNotification] Starting for ${contentType}: ${contentId}`);
    
    let contentOwnerId = null;
    let contentDetails = {};
    let contentTypeName = contentType;
    
    // Get content owner based on type
    if (contentType === 'post') {
      const post = await CommunityPost.findById(contentId).populate('user', '_id name');
      if (post && post.user) {
        contentOwnerId = post.user._id;
        contentDetails = {
          title: 'Your post has been hidden by Admin',
          content: `Your post has been hidden by an admin. Reason: ${reason || 'Violation of community guidelines'}`
        };
        console.log(`📝 Found post owner: ${contentOwnerId}`);
      } else {
        console.log(`❌ Post not found or has no owner: ${contentId}`);
      }
    } else if (contentType === 'comment') {
      const comment = await CommunityComment.findById(contentId).populate('user', '_id name');
      if (comment && comment.user) {
        contentOwnerId = comment.user._id;
        contentDetails = {
          title: 'Your comment has been hidden by Admin',
          content: `Your comment has been hidden by an admin. Reason: ${reason || 'Violation of community guidelines'}`
        };
        console.log(`📝 Found comment owner: ${contentOwnerId}`);
      } else {
        console.log(`❌ Comment not found or has no owner: ${contentId}`);
      }
    } else if (contentType === 'message') {
      const message = await Message.findById(contentId).populate('sender', '_id name');
      if (message && message.sender) {
        contentOwnerId = message.sender._id;
        contentDetails = {
          title: 'Your message has been hidden by Admin',
          content: `Your message has been hidden by an admin. Reason: ${reason || 'Violation of community guidelines'}`
        };
        console.log(`📝 Found message sender: ${contentOwnerId}`);
      } else {
        console.log(`❌ Message not found or has no sender: ${contentId}`);
      }
    }
    
    if (!contentOwnerId) {
      console.log(`❌ No content owner found for ${contentType} ${contentId}`);
      return false;
    }
    
    // Don't send notification if admin is hiding their own content
    if (contentOwnerId.toString() === adminId.toString()) {
      console.log(`ℹ️ Admin hiding their own content, skipping notification`);
      return false;
    }
    
    const admin = await User.findById(adminId).select('name profilePicture');
    
    // Use the more specific title from contentDetails
    const messageText = contentDetails.title;
    
    // Prepare notification data
    const notificationData = {
      recipient: contentOwnerId,
      sender: adminId,
      type: 'content_hidden',
      message: messageText,
      link: contentType === 'message' ? '/messages' : '/community-blogspot',
      adminAction: 'hidden',
      reportReason: 'admin_action', // Use the valid enum value
      contentType: contentTypeName,
      isRead: false
    };
    
    // Add the content reference - IMPORTANT: use messageRef for messages
    if (contentType === 'post') {
      notificationData.post = contentId;
    } else if (contentType === 'comment') {
      notificationData.comment = contentId;
    } else if (contentType === 'message') {
      notificationData.messageRef = contentId; // Use messageRef instead of message
    }
    
    console.log(`📨 Creating notification data:`, JSON.stringify(notificationData, null, 2));
    
    // Create the notification
    const notification = await createNotification(notificationData);
    
    if (notification) {
      console.log(`✅ ${contentTypeName} hidden notification sent to user ${contentOwnerId}`);
      return true;
    } else {
      console.log(`❌ Failed to create notification for user ${contentOwnerId}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Trigger content hidden notification error:', error);
    console.error('Error stack:', error.stack);
    return false;
  }
};