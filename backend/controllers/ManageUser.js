// RubberSense/backend/controllers/ManageUser.js
const User = require('../models/User');

// Helper function to get reason message
const getDeactivationReasonMessage = (reason, customText) => {
  const messages = {
    'inappropriate_content': 'Your account has been deactivated due to posting or sending messages that contain inappropriate or offensive words.',
    'offensive_comments': 'Posting Offensive Comments - Your account was deactivated because you commented content that violates our community guidelines.',
    'inappropriate_messages': 'Sending Inappropriate Messages - Your account has been disabled after sending messages that contain offensive, abusive, or harmful language.',
    'community_violation': 'Violation of Community Standards - Your account was deactivated for behavior that does not follow our platform\'s rules and guidelines.',
    'harassment': 'Harassment or Abusive Behavior - Your account has been suspended due to repeated inappropriate comments or messages toward other users.',
    'other': customText || 'Your account has been deactivated. Please contact support for more information.'
  };
  
  return messages[reason] || messages.other;
};

// Get ALL users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ lastLogin: -1, createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('❌ Error fetching all users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Get only VERIFIED users
exports.getVerifiedUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: true, isDeleted: false })
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ lastLogin: -1, createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('❌ Error fetching verified users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Get only UNVERIFIED users
exports.getUnverifiedUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: false, isDeleted: false })
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ lastLogin: -1, createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('❌ Error fetching unverified users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Get ACTIVE users
exports.getActiveUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true, isDeleted: false })
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ lastLogin: -1, createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('❌ Error fetching active users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Get INACTIVE users
exports.getInactiveUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: false, isDeleted: false })
      .select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ lastLogin: -1, createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('❌ Error fetching inactive users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Toggle user active/inactive status with reason
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, reasonText } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const oldStatus = user.isActive;
    
    // If deactivating, save the reason
    if (user.isActive) {
      // Deactivating user
      user.isActive = false;
      user.deactivationReason = reason || 'other';
      user.deactivationReasonText = reasonText || null;
      user.deactivatedAt = new Date();
      user.deactivatedBy = req.user.id; // The admin who deactivated
    } else {
      // Reactivating user - clear deactivation info
      user.isActive = true;
      user.deactivationReason = null;
      user.deactivationReasonText = null;
      user.deactivatedAt = null;
      user.deactivatedBy = null;
    }
    
    await user.save();

    // Get reason message for response
    const reasonMessage = getDeactivationReasonMessage(user.deactivationReason, user.deactivationReasonText);

    res.status(200).json({
      success: true,
      message: `User status changed from ${oldStatus ? 'Active' : 'Inactive'} to ${user.isActive ? 'Active' : 'Inactive'}`,
      isActive: user.isActive,
      userId: user._id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
      deactivationReason: user.deactivationReason,
      deactivationReasonMessage: !user.isActive ? reasonMessage : null
    });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Get deactivation reason for a specific user
exports.getDeactivationReason = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('isActive deactivationReason deactivationReasonText deactivatedAt deactivatedBy');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const reasonMessage = getDeactivationReasonMessage(user.deactivationReason, user.deactivationReasonText);

    res.status(200).json({
      success: true,
      isActive: user.isActive,
      deactivationReason: user.deactivationReason,
      deactivationReasonMessage: !user.isActive ? reasonMessage : null,
      deactivatedAt: user.deactivatedAt,
      deactivatedBy: user.deactivatedBy
    });
  } catch (error) {
    console.error('❌ Error getting deactivation reason:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Verify user endpoint
exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already verified' 
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      userId: user._id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};

// Get user's current status (online/offline)
exports.getUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('lastLogin isActive');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Calculate online status
    let isOnline = false;
    if (user.lastLogin) {
      const lastLoginTime = new Date(user.lastLogin).getTime();
      const currentTime = Date.now();
      const fifteenMinutesInMs = 15 * 60 * 1000;
      
      isOnline = (currentTime - lastLoginTime) < fifteenMinutesInMs;
    }

    res.status(200).json({
      success: true,
      isOnline,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      userId: user._id,
      lastLoginTimestamp: user.lastLogin ? new Date(user.lastLogin).getTime() : null,
      currentTimestamp: Date.now(),
      timeDiff: user.lastLogin ? Date.now() - new Date(user.lastLogin).getTime() : null
    });
  } catch (error) {
    console.error('❌ Error getting user status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
};