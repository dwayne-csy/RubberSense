// RubberSense/backend/controllers/ManageUser.js
const User = require('../models/User');

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

// Toggle user active/inactive status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const oldStatus = user.isActive;
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed from ${oldStatus ? 'Active' : 'Inactive'} to ${user.isActive ? 'Active' : 'Inactive'}`,
      isActive: user.isActive,
      userId: user._id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
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

// Get user's current status (online/offline) - FIXED
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

    // FIXED: Proper online status calculation
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

