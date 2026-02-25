const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const CommunityPost = require('../models/CommunityPost');
const Message = require('../models/Message');
const { triggerFollowNotification } = require('./Notification');

// Helper function to get user profile data
const getUserProfileData = async (userId, currentUserId = null) => {
  const user = await User.findById(userId).lean();
  
  if (!user) {
    return null;
  }

  let userProfile = await UserProfile.findOne({ user: userId })
    .populate('followers', 'name email avatar')
    .populate('following', 'name email avatar')
    .lean();

  if (!userProfile) {
    userProfile = new UserProfile({
      user: userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      address: user.address
    });
    await userProfile.save();
    
    userProfile = await UserProfile.findOne({ user: userId })
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar')
      .lean();
  }

  // Get user's posts
  const posts = await CommunityPost.find({ user: userId })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  const postsWithCounts = posts.map(post => ({
    ...post,
    likesCount: post.likes ? post.likes.length : 0,
    commentsCount: post.comments ? post.comments.length : 0
  }));

  const isOwnProfile = currentUserId && currentUserId.toString() === userId.toString();

  // Prepare response data
  const responseData = {
    _id: userProfile._id,
    userId: userProfile.user,
    name: userProfile.name || user.name,
    bio: userProfile.bio || '',
    profilePicture: userProfile.profilePicture || user.avatar,
    avatar: userProfile.avatar || user.avatar,
    followers: userProfile.followers || [],
    following: userProfile.following || [],
    posts: postsWithCounts,
    stats: {
      totalPosts: postsWithCounts.length,
      totalFollowers: userProfile.followers?.length || 0,
      totalFollowing: userProfile.following?.length || 0
    },
    lastActive: userProfile.lastActive,
    createdAt: userProfile.createdAt,
    updatedAt: userProfile.updatedAt
  };

  // Add contact info based on privacy settings
  if (isOwnProfile || userProfile.privacySettings?.showEmail) {
    responseData.email = userProfile.email || user.email;
  }
  
  if (isOwnProfile || userProfile.privacySettings?.showPhone) {
    responseData.phone = userProfile.phone || user.contact;
  }
  
  if (isOwnProfile || userProfile.privacySettings?.showAddress) {
    responseData.address = userProfile.address || user.address;
  }

  // Add social links and privacy settings for own profile
  if (isOwnProfile) {
    responseData.socialLinks = userProfile.socialLinks;
    responseData.privacySettings = userProfile.privacySettings;
  }

  return responseData;
};

// ========== GET USER PROFILE ==========
exports.getUserProfile = async (req, res) => {
  try {
    console.log('👤 Fetching user profile:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    
    const userProfileData = await getUserProfileData(userId, currentUserId);
    
    if (!userProfileData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: userProfileData
    });

  } catch (error) {
    console.error('❌ GET USER PROFILE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};

// ========== UPDATE USER PROFILE ==========
exports.updateUserProfile = async (req, res) => {
  try {
    console.log('👤 Updating user profile for user:', req.user.id);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Check if user is updating their own profile
    if (currentUserId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    const updates = req.body;
    
    // Find or create profile
    let userProfile = await UserProfile.findOne({ user: userId });
    
    if (!userProfile) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      userProfile = new UserProfile({
        user: userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        address: user.address
      });
    }

    // Update fields
    const allowedUpdates = [
      'name', 'bio', 'phone', 'profilePicture', 'avatar',
      'address', 'socialLinks', 'privacySettings'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        userProfile[field] = updates[field];
      }
    });

    // Update last active
    userProfile.lastActive = new Date();
    
    await userProfile.save();

    // Update stats
    await userProfile.updateStats();

    // Get updated profile data
    const updatedProfileData = await getUserProfileData(userId, currentUserId);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfileData
    });

  } catch (error) {
    console.error('❌ UPDATE USER PROFILE ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// ========== GET USER FOLLOWERS ==========
exports.getUserFollowers = async (req, res) => {
  try {
    console.log('👥 Fetching followers for user:', req.params.userId);
    
    const { userId } = req.params;
    
    const userProfile = await UserProfile.findOne({ user: userId })
      .populate('followers', 'name email avatar contact address')
      .lean();

    if (!userProfile) {
      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: userProfile.followers || []
    });

  } catch (error) {
    console.error('❌ GET USER FOLLOWERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followers'
    });
  }
};

// ========== GET USER FOLLOWING ==========
exports.getUserFollowing = async (req, res) => {
  try {
    console.log('👥 Fetching following for user:', req.params.userId);
    
    const { userId } = req.params;
    
    const userProfile = await UserProfile.findOne({ user: userId })
      .populate('following', 'name email avatar contact address')
      .lean();

    if (!userProfile) {
      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: userProfile.following || []
    });

  } catch (error) {
    console.error('❌ GET USER FOLLOWING ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch following'
    });
  }
};

// ========== FOLLOW USER ==========
exports.followUser = async (req, res) => {
  try {
    console.log('➕ User following:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Prevent self-following
    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create current user's profile
    let currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    if (!currentUserProfile) {
      const currentUser = await User.findById(currentUserId);
      currentUserProfile = new UserProfile({
        user: currentUserId,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        address: currentUser.address
      });
      await currentUserProfile.save();
    }

    // Get or create target user's profile
    let targetUserProfile = await UserProfile.findOne({ user: userId });
    if (!targetUserProfile) {
      targetUserProfile = new UserProfile({
        user: userId,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar,
        address: targetUser.address
      });
      await targetUserProfile.save();
    }

    // Check if already following
    if (currentUserProfile.isFollowing(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Follow the user
    await currentUserProfile.followUser(userId);

    // Trigger follow notification
    await triggerFollowNotification(currentUserId, userId);

    // Update stats
    await currentUserProfile.updateStats();
    await targetUserProfile.updateStats();

    res.status(200).json({
      success: true,
      message: 'User followed successfully'
    });

  } catch (error) {
    console.error('❌ FOLLOW USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow user'
    });
  }
};

// ========== UNFOLLOW USER ==========
exports.unfollowUser = async (req, res) => {
  try {
    console.log('➖ User unfollowing:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Get current user's profile
    const currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    if (!currentUserProfile) {
      return res.status(404).json({
        success: false,
        message: 'Your profile not found'
      });
    }

    // Check if currently following
    if (!currentUserProfile.isFollowing(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Not following this user'
      });
    }

    // Unfollow the user
    await currentUserProfile.unfollowUser(userId);

    // Get target user's profile and update stats
    const targetUserProfile = await UserProfile.findOne({ user: userId });
    if (targetUserProfile) {
      await targetUserProfile.updateStats();
    }

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully'
    });

  } catch (error) {
    console.error('❌ UNFOLLOW USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow user'
    });
  }
};

// ========== CHECK FOLLOW STATUS ==========
exports.checkFollowStatus = async (req, res) => {
  try {
    console.log('🔍 Checking follow status for user:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    
    if (!currentUserProfile) {
      return res.status(200).json({
        success: true,
        isFollowing: false
      });
    }

    const isFollowing = currentUserProfile.isFollowing(userId);

    res.status(200).json({
      success: true,
      isFollowing
    });

  } catch (error) {
    console.error('❌ CHECK FOLLOW STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check follow status'
    });
  }
};

// ========== GET CURRENT USER PROFILE ==========
exports.getCurrentUserProfile = async (req, res) => {
  try {
    console.log('👤 Fetching current user profile:', req.user.id);
    
    const currentUserId = req.user.id;
    
    const userProfileData = await getUserProfileData(currentUserId, currentUserId);
    
    if (!userProfileData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: userProfileData
    });

  } catch (error) {
    console.error('❌ GET CURRENT USER PROFILE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current user profile'
    });
  }
};

// ========== SEND MESSAGE ==========
exports.sendMessage = async (req, res) => {
  try {
    console.log('💬 Sending message to:', req.body.recipientId);
    
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    // Validation
    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and content are required'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Prevent sending to self
    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Create message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content: content.trim()
    });

    await message.save();

    // Populate sender info for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('recipient', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('❌ SEND MESSAGE ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// ========== GET USER POSTS ==========
exports.getUserPosts = async (req, res) => {
  try {
    console.log('📝 Fetching posts for user:', req.params.userId);
    
    const { userId } = req.params;
    
    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const posts = await CommunityPost.find({ user: userId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Add virtual counts
    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0
    }));

    res.status(200).json({
      success: true,
      count: postsWithCounts.length,
      data: postsWithCounts
    });

  } catch (error) {
    console.error('❌ GET USER POSTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts'
    });
  }
};

// ========== GET USER STATS ==========
exports.getUserStats = async (req, res) => {
  try {
    console.log('📊 Getting stats for user:', req.params.userId);
    
    const { userId } = req.params;

    // Get or create profile
    let userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      userProfile = new UserProfile({
        user: userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        address: user.address
      });
      await userProfile.save();
    }

    // Update stats
    await userProfile.updateStats();

    res.status(200).json({
      success: true,
      data: {
        totalPosts: userProfile.stats.totalPosts,
        totalFollowers: userProfile.stats.totalFollowers,
        totalFollowing: userProfile.stats.totalFollowing,
        lastActive: userProfile.lastActive
      }
    });

  } catch (error) {
    console.error('❌ GET USER STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats'
    });
  }
};

// ========== BLOCK USER ==========
exports.blockUser = async (req, res) => {
  try {
    console.log('🚫 Blocking user:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself'
      });
    }

    const currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    if (!currentUserProfile) {
      return res.status(404).json({
        success: false,
        message: 'Your profile not found'
      });
    }

    await currentUserProfile.blockUser(userId);

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('❌ BLOCK USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user'
    });
  }
};

// ========== UNBLOCK USER ==========
exports.unblockUser = async (req, res) => {
  try {
    console.log('✅ Unblocking user:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    if (!currentUserProfile) {
      return res.status(404).json({
        success: false,
        message: 'Your profile not found'
      });
    }

    if (!currentUserProfile.isBlocking(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not blocked'
      });
    }

    await currentUserProfile.unblockUser(userId);

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('❌ UNBLOCK USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user'
    });
  }
};

// ========== GET BLOCKED USERS ==========
exports.getBlockedUsers = async (req, res) => {
  try {
    console.log('📋 Getting blocked users for:', req.user.id);
    
    const currentUserId = req.user.id;
    
    const userProfile = await UserProfile.findOne({ user: currentUserId })
      .populate('blockedUsers', 'name email avatar')
      .lean();

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: userProfile.blockedUsers || []
    });

  } catch (error) {
    console.error('❌ GET BLOCKED USERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked users'
    });
  }
};