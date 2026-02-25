// RubberSense/backend/controllers/Contact.js
const Contact = require('../models/Contact');

// ========== SEND CONTACT MESSAGE ========== 
exports.sendContactMessage = async (req, res) => {
  try {
    console.log('📝 Contact message request received');
    
    // If user is logged in, use their info, otherwise use form data
    let { name, email, subject, message } = req.body;

    // For logged-in users, override with their profile data
    if (req.user) {
      console.log('User is authenticated, using profile data');
      name = req.user.name;
      email = req.user.email;
      console.log(`Using user data: ${name} (${email})`);
    }

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    console.log('✅ Basic validation passed');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create contact message
    const contactMessage = await Contact.create({
      name,
      email,
      subject,
      message,
      userId: req.user ? req.user.id : null,
      userIP: req.ip,
      status: 'unread',
      readByUser: false,
      isRead: false
    });

    console.log('✅ Contact message saved to database');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will respond to you soon.',
      data: {
        id: contactMessage._id,
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        createdAt: contactMessage.createdAt
      }
    });

  } catch (error) {
    console.error('❌ CONTACT MESSAGE ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again.' 
    });
  }
};

// ========== GET USER'S MESSAGES ==========
exports.getUserMessages = async (req, res) => {
  try {
    console.log('📨 Fetching messages for user:', req.user.email);
    
    const messages = await Contact.find({ email: req.user.email })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('❌ GET USER MESSAGES ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};


// ========== GET ALL MESSAGES (ADMIN) ==========
exports.getAllMessages = async (req, res) => {
  try {
    console.log('👑 Admin fetching all contact messages');
    
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const messages = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: messages
    });

  } catch (error) {
    console.error('❌ GET ALL MESSAGES ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// ========== GET SINGLE MESSAGE (ADMIN) ==========
exports.getMessageById = async (req, res) => {
  try {
    console.log('👑 Admin fetching message:', req.params.id);
    
    const message = await Contact.findById(req.params.id);
    
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
    console.error('❌ GET MESSAGE BY ID ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message'
    });
  }
};

// ========== UPDATE MESSAGE STATUS (ADMIN) ==========
exports.updateMessageStatus = async (req, res) => {
  try {
    console.log('👑 Updating message status:', req.params.id);
    
    const { status, reply } = req.body;
    
    const updateData = { status };
    
    if (reply && status === 'replied') {
      updateData.reply = reply;
      updateData.repliedAt = new Date();
      updateData.repliedBy = req.user.id;
      // When admin replies, mark as unread for user
      updateData.readByUser = false;
      updateData.readByUserAt = null;
    }

    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

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
    console.error('❌ UPDATE MESSAGE STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message'
    });
  }
};

// ========== DELETE MESSAGE (ADMIN) ==========
exports.deleteMessage = async (req, res) => {
  try {
    console.log('👑 Admin deleting message:', req.params.id);
    
    const message = await Contact.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('❌ DELETE MESSAGE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// ========== GET USER REPLIES ==========
exports.getUserReplies = async (req, res) => {
  try {
    console.log('📨 Fetching admin replies for user:', req.user.email);
    
    // Find messages where user is the sender AND admin has replied
    const messages = await Contact.find({
      email: req.user.email,
      $or: [
        { status: 'replied' },
        { status: 'conversation' }
      ]
    })
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('❌ GET USER REPLIES ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replies'
    });
  }
};

// ========== USER REPLY TO ADMIN ==========
exports.userReplyToAdmin = async (req, res) => {
  try {
    console.log('📤 User replying to admin message:', req.body.originalMessageId);
    
    const { originalMessageId, reply } = req.body;
    
    if (!originalMessageId || !reply) {
      return res.status(400).json({
        success: false,
        message: 'Original message ID and reply text are required'
      });
    }

    // Find the original message
    const originalMessage = await Contact.findById(originalMessageId);
    
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    // Verify this user owns the message
    if (originalMessage.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this message'
      });
    }

    // Check if this is a reply chain (message already has admin reply)
    if (!originalMessage.reply && (!originalMessage.userReplies || originalMessage.userReplies.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reply to a message without admin response'
      });
    }

    // Initialize userReplies array if it doesn't exist
    if (!originalMessage.userReplies) {
      originalMessage.userReplies = [];
    }

    // Mark any unread admin replies as read when user replies
    if (originalMessage.userReplies) {
      for (const userReply of originalMessage.userReplies) {
        if (userReply.adminReplies) {
          for (const adminReply of userReply.adminReplies) {
            if (!adminReply.readByUser) {
              adminReply.readByUser = true;
              adminReply.readByUserAt = new Date();
            }
          }
        }
        userReply.lastSeenByUser = new Date();
      }
    }
    
    // Mark main reply as read if it exists
    if (originalMessage.reply && !originalMessage.readByUser) {
      originalMessage.readByUser = true;
      originalMessage.readByUserAt = new Date();
    }

    // Add user's reply to the conversation
    originalMessage.userReplies.push({
      text: reply,
      date: new Date(),
      userId: req.user.id
    });

    // Update status to indicate ongoing conversation
    originalMessage.status = 'conversation';
    originalMessage.updatedAt = new Date();

    await originalMessage.save();

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: originalMessage
    });

  } catch (error) {
    console.error('❌ USER REPLY TO ADMIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
};

// ========== MARK MESSAGE AS READ ==========
exports.markMessageAsRead = async (req, res) => {
  try {
    console.log('👤 Marking message as read:', req.params.id);
    
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify this user owns the message
    if (message.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this message'
      });
    }

    // Mark as read (if not already read)
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('❌ MARK AS READ ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
};

// ========== MARK ADMIN REPLY AS READ =========
exports.markAdminReplyAsRead = async (req, res) => {
  try {
    console.log('👤 Marking admin reply as read');
    
    const { messageId, userReplyIndex, adminReplyIndex } = req.body;
    
    const message = await Contact.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify this user owns the message
    if (message.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this message'
      });
    }

    let updated = false;
    
    // If marking the main reply as read
    if (userReplyIndex === undefined && adminReplyIndex === undefined) {
      if (!message.readByUser) {
        message.readByUser = true;
        message.readByUserAt = new Date();
        updated = true;
      }
    }
    // If marking a specific admin reply in userReplies as read
    else if (message.userReplies && message.userReplies[userReplyIndex]) {
      const userReply = message.userReplies[userReplyIndex];
      
      if (userReply.adminReplies && userReply.adminReplies[adminReplyIndex]) {
        const adminReply = userReply.adminReplies[adminReplyIndex];
        
        if (!adminReply.readByUser) {
          adminReply.readByUser = true;
          adminReply.readByUserAt = new Date();
          
          // Also update lastSeenByUser for this userReply
          userReply.lastSeenByUser = new Date();
          updated = true;
        }
      }
    }

    if (updated) {
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Reply marked as read',
      data: { updated }
    });

  } catch (error) {
    console.error('❌ MARK ADMIN REPLY AS READ ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark reply as read'
    });
  }
};

// ========== ADMIN REPLY TO USER MESSAGE ==========
exports.replyToUserMessage = async (req, res) => {
  try {
    console.log('👑 Admin replying to user message:', req.params.id);
    
    const { userReplyId, replyText } = req.body;
    
    if (!replyText || !replyText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find the specific user reply
    if (!message.userReplies || message.userReplies.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No user replies found'
      });
    }

    // If userReplyId is provided, find that specific reply
    let targetUserReply = null;
    if (userReplyId) {
      // Try to find by _id first
      targetUserReply = message.userReplies.id(userReplyId);
      
      // If not found by _id, try by index
      if (!targetUserReply && !isNaN(userReplyId)) {
        const index = parseInt(userReplyId);
        if (index >= 0 && index < message.userReplies.length) {
          targetUserReply = message.userReplies[index];
        }
      }
    }
    
    // If no specific reply found, use the latest one
    if (!targetUserReply) {
      targetUserReply = message.userReplies[message.userReplies.length - 1];
    }

    // Initialize adminReplies array if it doesn't exist
    if (!targetUserReply.adminReplies) {
      targetUserReply.adminReplies = [];
    }

    // Add admin's reply to this specific user reply
    targetUserReply.adminReplies.push({
      text: replyText,
      date: new Date(),
      adminId: req.user.id,
      readByUser: false // Mark as unread for user
    });

    // Update message status to conversation
    message.status = 'conversation';
    message.updatedAt = new Date();
    // Mark as unread for user when admin replies
    message.readByUser = false;
    message.readByUserAt = null;

    await message.save();

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: message
    });

  } catch (error) {
    console.error('❌ ADMIN REPLY TO USER MESSAGE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
};

// ========== GET UNREAD MESSAGES COUNT ==========
exports.getUnreadMessagesCount = async (req, res) => {
  try {
    console.log('📊 Getting unread messages count for user:', req.user.email);
    
    // Find all messages for this user
    const messages = await Contact.find({ 
      email: req.user.email,
      $or: [
        { status: 'replied' },
        { status: 'conversation' }
      ]
    });
    
    let unreadCount = 0;
    
    for (const message of messages) {
      // First check if main reply is unread
      if (message.reply && !message.readByUser) {
        unreadCount++;
        continue; // Count message once
      }
      
      // Check for unread admin replies in userReplies
      if (message.userReplies && message.userReplies.length > 0) {
        let hasUnreadInThisMessage = false;
        
        for (const userReply of message.userReplies) {
          if (userReply.adminReplies && userReply.adminReplies.length > 0) {
            for (const adminReply of userReply.adminReplies) {
              if (!adminReply.readByUser) {
                hasUnreadInThisMessage = true;
                break;
              }
            }
          }
          if (hasUnreadInThisMessage) break;
        }
        
        if (hasUnreadInThisMessage) {
          unreadCount++;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        unreadMessages: unreadCount,
        totalMessages: messages.length
      }
    });

  } catch (error) {
    console.error('❌ GET UNREAD MESSAGES COUNT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// ========== GET USER'S UNREAD MESSAGES ==========
exports.getUserUnreadMessages = async (req, res) => {
  try {
    console.log('📨 Fetching unread messages for user:', req.user.email);
    
    // Find messages where user is the sender
    const messages = await Contact.find({
      email: req.user.email,
      $or: [
        { status: 'replied' },
        { status: 'conversation' }
      ]
    });
    
    // Filter to get only unread messages
    const unreadMessages = messages.filter(message => {
      // Check if main reply is unread
      if (message.reply && !message.readByUser) {
        return true;
      }
      
      // Check for unread admin replies in userReplies
      if (message.userReplies && message.userReplies.length > 0) {
        for (const userReply of message.userReplies) {
          if (userReply.adminReplies && userReply.adminReplies.length > 0) {
            for (const adminReply of userReply.adminReplies) {
              if (!adminReply.readByUser) {
                return true;
              }
            }
          }
        }
      }
      
      return false;
    });

    res.status(200).json({
      success: true,
      count: unreadMessages.length,
      data: unreadMessages
    });

  } catch (error) {
    console.error('❌ GET USER UNREAD MESSAGES ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread messages'
    });
  }
};

// ========== MARK ALL REPLIES AS READ ==========
exports.markAllRepliesAsRead = async (req, res) => {
  try {
    console.log('👤 Marking all admin replies as read for user:', req.user.email);
    
    // Find all messages for this user
    const messages = await Contact.find({
      email: req.user.email,
      $or: [
        { status: 'replied' },
        { status: 'conversation' }
      ]
    });
    
    let updatedCount = 0;
    
    for (const message of messages) {
      let messageUpdated = false;
      
      // Mark main reply as read if unread
      if (message.reply && !message.readByUser) {
        message.readByUser = true;
        message.readByUserAt = new Date();
        messageUpdated = true;
      }
      
      // Mark all admin replies in userReplies as read
      if (message.userReplies && message.userReplies.length > 0) {
        for (const userReply of message.userReplies) {
          if (userReply.adminReplies && userReply.adminReplies.length > 0) {
            for (const adminReply of userReply.adminReplies) {
              if (!adminReply.readByUser) {
                adminReply.readByUser = true;
                adminReply.readByUserAt = new Date();
                messageUpdated = true;
              }
            }
          }
          userReply.lastSeenByUser = new Date();
        }
      }
      
      if (messageUpdated) {
        await message.save();
        updatedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Marked ${updatedCount} messages as read`,
      data: { updatedCount }
    });

  } catch (error) {
    console.error('❌ MARK ALL REPLIES AS READ ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all replies as read'
    });
  }
};