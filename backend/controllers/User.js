const User = require('../models/User');
const crypto = require('crypto');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const Mailer = require('../utils/Mailer');
const admin = require('../utils/firebaseAdmin');

// ========== REGISTER USER ========== 
exports.registerUser = async (req, res) => {
  try {
    console.log('📝 Register user request received');
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    console.log('✅ Basic validation passed');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const encodedName = encodeURIComponent(name);
    const avatarData = {
      public_id: 'avatar_' + Date.now(),
      url: `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=150`
    };

    const user = await User.create({
      name,
      email,
      password,
      avatar: avatarData,
      isVerified: false,
      isActive: true,
      authProvider: 'local'
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${verificationToken}`;

    const message = `
      <h2>Welcome to ${process.env.APP_NAME}</h2>
      <p>Click the link below to verify your email and activate your account:</p>
      <a href="${verificationUrl}" target="_blank" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Your Email</a>
      <br><br>
      <p>If you didn't request this, please ignore this email.</p>
      <p><small>Or copy this link: ${verificationUrl}</small></p>
    `;

    console.log('📨 Sending verification email to local user:', user.email);
    await Mailer({
      email: user.email,
      subject: 'Verify your email - ' + process.env.APP_NAME,
      message
    });

    res.status(201).json({
      success: true,
      message: `Registration successful! Verification email sent to ${user.email}. Please verify your email before logging in.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error('❌ REGISTER ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ========== LOGIN USER (LOCAL ONLY) ==========

// ========== LOGIN USER (LOCAL ONLY) ==========
exports.loginUser = async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // Check if account is inactive and show deactivation reason
    if (!user.isActive) {
      const reasonMessage = getDeactivationReasonMessage(user.deactivationReason, user.deactivationReasonText);
      return res.status(403).json({ 
        success: false,
        message: 'Your account is inactive',
        deactivationReason: user.deactivationReason,
        deactivationMessage: reasonMessage,
        deactivatedAt: user.deactivatedAt
      });
    }

    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first.' });

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) return res.status(401).json({ message: 'Invalid email or password' });

    // FIXED: Update last login timestamp using the model method
    await user.updateLastLogin();

    const token = user.getJwtToken();
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ Login successful for:', email);
    res.status(200).json({ 
      success: true, 
      token, 
      user: userResponse,
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// Helper function for deactivation messages (add this at the bottom of the file, before module.exports)
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

// ========== UPDATE PROFILE ==========
exports.updateProfile = async (req, res) => {
  try {
    console.log('📝 Update profile request for user:', req.user.id);
    console.log('User role:', req.user.role);
    console.log('Request body:', req.body);
    console.log('Has file:', !!req.file);

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateData = {};
    
    if (req.body.name !== undefined) {
      const name = req.body.name?.trim();
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty'
        });
      }
      updateData.name = name;
    }

    if (req.body.contact !== undefined) {
      const contact = req.body.contact?.trim() || '';
      if (contact && !/^(\+?\d{10,15})$/.test(contact)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid contact number'
        });
      }
      updateData.contact = contact;
    }

    const addressFields = {};
    
    if (req.body.city !== undefined) {
      addressFields.city = req.body.city?.trim() || '';
    }
    
    if (req.body.barangay !== undefined) {
      addressFields.barangay = req.body.barangay?.trim() || '';
    }
    
    if (req.body.street !== undefined) {
      addressFields.street = req.body.street?.trim() || '';
    }
    
    if (req.body.zipcode !== undefined) {
      const zipcode = req.body.zipcode?.trim() || '';
      if (zipcode && !/^[0-9]{4}$/.test(zipcode)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 4-digit zipcode'
        });
      }
      addressFields.zipcode = zipcode;
    }
    
    const hasAddressData = Object.values(addressFields).some(value => value !== '');
    if (hasAddressData) {
      updateData.address = addressFields;
    }

    if (req.file) {
      console.log('🖼️ Uploading avatar...');
      
      if (currentUser.avatar?.public_id && !currentUser.avatar.url.includes('ui-avatars.com')) {
        try {
          await deleteFromCloudinary(currentUser.avatar.public_id);
        } catch (err) {
          console.warn('Could not delete old avatar:', err.message);
        }
      }

      const avatarResult = await uploadToCloudinary(req.file.path, 'rubbersense/avatars');
      updateData.avatar = {
        public_id: avatarResult.public_id,
        url: avatarResult.url
      };

      const fs = require('fs');
      fs.unlink(req.file.path, err => {
        if (err) console.warn('Failed to delete temp file:', err.message);
      });
    }

    if (req.body.email !== undefined && req.body.email !== currentUser.email) {
      console.warn('⚠️ User attempted to change email from', currentUser.email, 'to', req.body.email);
      return res.status(400).json({
        success: false,
        message: 'Email cannot be changed. Please contact support if you need to update your email.'
      });
    }

    console.log('Update data:', updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data provided to update'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found after update'
      });
    }

    console.log('✅ Profile updated successfully for', updatedUser.role);
    
    res.status(200).json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('❌ UPDATE PROFILE ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Profile update failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== GOOGLE LOGIN ==========
exports.firebaseGoogleAuth = async (req, res) => {
  try {
    console.log('🔥 Firebase Google auth attempt');
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required' });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid, name, picture } = decodedToken;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: uid,
        avatar: { 
          public_id: `google_${uid}`, 
          url: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=random&color=fff&size=150` 
        },
        isVerified: true,
        isActive: true,
        firebaseUID: uid,
        authProvider: 'google'
      });
      console.log('✅ User auto-created for Google login');
    }

    if (user.isDeleted) return res.status(403).json({ message: 'Your account has been deleted. Please contact support.' });
    if (!user.isActive) return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });

    // FIXED: Update last login timestamp
    await user.updateLastLogin();

    const token = user.getJwtToken();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ 
      success: true, 
      token, 
      user: userResponse, 
      message: 'Google authentication successful',
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('❌ FIREBASE GOOGLE AUTH ERROR:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
};

// ========== FACEBOOK LOGIN ==========
exports.firebaseFacebookAuth = async (req, res) => {
  try {
    console.log('🔥 Firebase Facebook auth attempt');
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required' });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid, name, picture } = decodedToken;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: uid,
        avatar: { 
          public_id: `facebook_${uid}`, 
          url: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=random&color=fff&size=150` 
        },
        isVerified: true,
        isActive: true,
        firebaseUID: uid,
        authProvider: 'facebook'
      });
      console.log('✅ User auto-created for Facebook login');
    }

    if (user.isDeleted) return res.status(403).json({ message: 'Your account has been deleted. Please contact support.' });
    if (!user.isActive) return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });

    // FIXED: Update last login timestamp
    await user.updateLastLogin();

    const token = user.getJwtToken();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ 
      success: true, 
      token, 
      user: userResponse, 
      message: 'Facebook authentication successful',
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('❌ FIREBASE FACEBOOK AUTH ERROR:', error);
    res.status(500).json({ success: false, message: 'Facebook authentication failed', error: error.message });
  }
};

// ========== FORGOT PASSWORD ==========
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found with this email' });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      <br><br>
      <p>If you did not request this email, please ignore it.</p>
      <p><small>Or copy this link: ${resetUrl}</small></p>
    `;

    await Mailer({ email: user.email, subject: 'Password Recovery - ' + process.env.APP_NAME, message });

    res.status(200).json({ success: true, message: `Password reset email sent to: ${user.email}` });

  } catch (error) {
    console.error('❌ FORGOT PASSWORD ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RESET PASSWORD ==========
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const crypto = require('crypto');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await require('../models/User').findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('❌ RESET PASSWORD ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ========== CHANGE PASSWORD ==========
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ CHANGE PASSWORD ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ========== VERIFY EMAIL ==========
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).send('Verification token missing');

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await require('../models/User').findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).send('Invalid or expired verification token');

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${FRONTEND_URL}/email-verified`);
  } catch (error) {
    console.error('❌ EMAIL VERIFICATION ERROR:', error);
    return res.status(500).send('Server error');
  }
};

exports.updateLastLogin = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      await user.updateLastLogin();
    }
  } catch (error) {
    console.error('❌ Error updating last login:', error);
  }
};