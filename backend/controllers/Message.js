const Message = require('../models/Message');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { 
  triggerContentReportedNotification, 
  triggerContentHiddenNotification 
} = require('../controllers/Notification');

// ========== SEND MESSAGE ==========
exports.sendMessage = async (req, res) => {
  console.log('💬 ========== SEND MESSAGE START ==========');
  
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    console.log('📤 Sender:', senderId);
    console.log('📥 Recipient:', recipientId);
    console.log('📝 Content:', content);

    // STEP 1: Validate inputs
    if (!recipientId || !content) {
      console.log('❌ Validation failed: Missing recipientId or content');
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and content are required'
      });
    }

    // STEP 2: Check recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      console.log('❌ Recipient not found');
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }
    console.log('✅ Recipient found:', recipient.name);

    // STEP 3: Check not sending to self
    if (senderId.toString() === recipientId.toString()) {
      console.log('❌ Cannot send to self');
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }
    console.log('✅ Not sending to self');

    // STEP 4: Get or create user profiles
    let senderProfile = await UserProfile.findOne({ user: senderId });
    let recipientProfile = await UserProfile.findOne({ user: recipientId });
    
    console.log('👤 Sender profile:', senderProfile ? 'Found' : 'Not found');
    console.log('👤 Recipient profile:', recipientProfile ? 'Found' : 'Not found');

    if (!senderProfile) {
      console.log('🛠️ Creating sender profile...');
      const senderUser = await User.findById(senderId);
      senderProfile = new UserProfile({
        user: senderId,
        name: senderUser.name,
        email: senderUser.email,
        avatar: senderUser.avatar,
        address: senderUser.address,
        following: [],
        followers: []
      });
      await senderProfile.save();
      console.log('✅ Sender profile created');
    }
    
    if (!recipientProfile) {
      console.log('🛠️ Creating recipient profile...');
      recipientProfile = new UserProfile({
        user: recipientId,
        name: recipient.name,
        email: recipient.email,
        avatar: recipient.avatar,
        address: recipient.address,
        following: [],
        followers: []
      });
      await recipientProfile.save();
      console.log('✅ Recipient profile created');
    }

    // STEP 5: Check if blocked
    if (recipientProfile.blockedUsers && recipientProfile.blockedUsers.includes(senderId)) {
      console.log('❌ Sender is blocked by recipient');
      return res.status(403).json({
        success: false,
        message: 'You cannot message this user'
      });
    }
    console.log('✅ Not blocked');

    // STEP 6: Check follow status
    console.log('🔍 Checking follow status...');
    
    // Make sure arrays are initialized
    if (!senderProfile.following) senderProfile.following = [];
    if (!recipientProfile.following) recipientProfile.following = [];
    
    console.log('Sender following:', senderProfile.following.length, 'users');
    console.log('Recipient following:', recipientProfile.following.length, 'users');
    
    // Check if following
    const isSenderFollowingRecipient = senderProfile.isFollowing(recipientId);
    const isRecipientFollowingSender = recipientProfile.isFollowing(senderId);
    const isMutualFollowing = isSenderFollowingRecipient && isRecipientFollowingSender;
    
    console.log('📊 Follow status:');
    console.log('  - Sender follows recipient:', isSenderFollowingRecipient);
    console.log('  - Recipient follows sender:', isRecipientFollowingSender);
    console.log('  - Mutual following:', isMutualFollowing);

    // STEP 7: Check if conversation is already accepted
    const isConversationAccepted = await Message.isConversationAccepted(senderId, recipientId);
    console.log('🔍 Conversation already accepted?', isConversationAccepted);

    // STEP 8: Create message
    console.log('📝 Creating message...');
    
    let isRequest = false;
    let status = 'sent';
    
    if (isConversationAccepted) {
      // If conversation is already accepted, send as normal message
      isRequest = false;
      status = 'sent';
    } else if (isMutualFollowing) {
      // If mutual following, send as normal message
      isRequest = false;
      status = 'sent';
    } else {
      // Send as message request
      isRequest = true;
      status = 'pending';
    }
    
    const messageData = {
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      isRequest: isRequest,
      status: status
    };
    
    console.log('📨 Message data:', messageData);

    const message = new Message(messageData);

    // Validate before saving
    try {
      await message.validate();
    } catch (validationError) {
      console.log('❌ Message validation failed:', validationError.errors);
      return res.status(400).json({
        success: false,
        message: 'Invalid message data',
        errors: validationError.errors
      });
    }

    // STEP 9: Save message
    console.log('💾 Saving message...');
    await message.save();
    console.log('✅ Message saved with ID:', message._id);

    // STEP 10: Populate message data
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('recipient', 'name email avatar');

    console.log('🎉 Message sent successfully!');
    console.log('💬 ========== SEND MESSAGE END ==========');

    res.status(201).json({
      success: true,
      message: isRequest ? 'Message request sent' : 'Message sent successfully',
      isRequest: isRequest,
      data: populatedMessage
    });

  } catch (error) {
    console.error('\n❌ ========== SEND MESSAGE ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack ? error.stack.substring(0, 500) : 'No stack');
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.name === 'CastError') {
      console.error('Cast error:', error);
      return res.status(400).json({
        success: false,
        message: `Invalid data format: ${error.message}`
      });
    }
    
    console.error('❌ ========== SEND MESSAGE ERROR END ==========');
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// ========== GET CONVERSATION WITH USER ==========
exports.getConversation = async (req, res) => {
  try {
    console.log('💬 Getting conversation with:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { 
          sender: currentUserId, 
          recipient: userId,
          isDeletedBySender: false
        },
        { 
          sender: userId, 
          recipient: currentUserId,
          isDeletedByRecipient: false
        }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('recipient', 'name avatar')
    .sort({ createdAt: 1 })
    .limit(100);

    // Check if conversation is accepted
    const isConversationAccepted = await Message.isConversationAccepted(currentUserId, userId);
    
    // If accepted, update any pending requests to accepted
    if (isConversationAccepted) {
      await Message.updateMany(
        {
          $or: [
            { sender: currentUserId, recipient: userId },
            { sender: userId, recipient: currentUserId }
          ],
          isRequest: true,
          status: 'pending'
        },
        {
          $set: {
            status: 'accepted',
            isRequest: false
          }
        }
      );
    }

    // Mark unread messages as read (only non-request messages)
    const unreadMessages = messages.filter(msg => 
      !msg.isRead && 
      msg.recipient._id.toString() === currentUserId.toString() &&
      !msg.isRequest
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: unreadMessages.map(msg => msg._id) },
          recipient: currentUserId
        },
        {
          $set: { 
            isRead: true,
            readAt: new Date()
          }
        }
      );
    }

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
      conversationStatus: isConversationAccepted ? 'accepted' : 'pending'
    });

  } catch (error) {
    console.error('❌ GET CONVERSATION ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
};

// ========== GET ALL CONVERSATIONS ==========
exports.getAllConversations = async (req, res) => {
  try {
    console.log('💬 Getting all conversations for user:', req.user.id);
    
    const currentUserId = req.user.id;
    console.log('🔍 Current user ID:', currentUserId);

    // Try to get messages without any complex query first
    console.log('🔍 Trying to find messages for user...');
    
    // First, check if we can even find any messages at all
    const testMessages = await Message.find({
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId }
      ]
    }).limit(5);
    
    console.log('🔍 Test query found:', testMessages.length, 'messages');
    
    if (testMessages.length > 0) {
      console.log('🔍 Sample message IDs:', testMessages.map(m => m._id));
    }

    // Now try the proper query but with simpler structure
    const messages = await Message.find({
      $or: [
        { 
          $and: [
            { sender: currentUserId },
            { isDeletedBySender: false }
          ]
        },
        { 
          $and: [
            { recipient: currentUserId },
            { isDeletedByRecipient: false }
          ]
        }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('recipient', 'name avatar')
    .sort({ createdAt: -1 });

    console.log(`📋 Found ${messages.length} total messages after filtering`);

    if (messages.length === 0) {
      console.log('ℹ️ No messages found for user');
      return res.status(200).json({
        success: true,
        acceptedCount: 0,
        requestsCount: 0,
        acceptedConversations: [],
        messageRequests: []
      });
    }

    // Group by other user
    const conversationsMap = new Map();
    
    messages.forEach((message, index) => {
      try {
        const isSender = message.sender._id.toString() === currentUserId.toString();
        const otherUserId = isSender ? message.recipient._id : message.sender._id;
        const otherUser = isSender ? message.recipient : message.sender;
        
        // Safely get user info
        const otherUserName = otherUser?.name || 'Unknown User';
        const otherUserAvatar = otherUser?.avatar || '';
        
        const otherUserIdStr = otherUserId.toString();
        
        if (!conversationsMap.has(otherUserIdStr)) {
          conversationsMap.set(otherUserIdStr, {
            userId: otherUserId,
            name: otherUserName,
            avatar: otherUserAvatar,
            messages: [],
            unreadCount: 0,
            pendingRequests: 0,
            lastMessage: message,
            lastActivity: message.createdAt,
            isAccepted: false
          });
        }

        const conversation = conversationsMap.get(otherUserIdStr);
        conversation.messages.push(message);

        // Check if conversation is accepted
        if (message.status === 'accepted') {
          conversation.isAccepted = true;
        }

        // Count unread messages
        if (message.recipient._id.toString() === currentUserId.toString() && 
            !message.isRead && 
            !message.isRequest) {
          conversation.unreadCount++;
        }

        // Count pending requests
        if (message.recipient._id.toString() === currentUserId.toString() && 
            message.isRequest && 
            message.status === 'pending') {
          conversation.pendingRequests++;
        }

        // Update last message if newer
        if (message.createdAt > conversation.lastActivity) {
          conversation.lastMessage = message;
          conversation.lastActivity = message.createdAt;
        }
      } catch (error) {
        console.error(`❌ Error processing message ${index}:`, error.message);
        console.error('Message data:', {
          id: message._id,
          sender: message.sender,
          recipient: message.recipient
        });
      }
    });

    // Convert map to array and sort
    const allConversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    console.log(`📊 Found ${allConversations.length} conversations`);

    // Separate into accepted conversations and message requests
    const acceptedConversations = [];
    const messageRequests = [];

    allConversations.forEach(conversation => {
      const conversationData = {
        userId: conversation.userId,
        name: conversation.name,
        avatar: conversation.avatar,
        lastMessage: {
          content: conversation.lastMessage.content,
          isRequest: conversation.lastMessage.isRequest,
          status: conversation.lastMessage.status,
          createdAt: conversation.lastMessage.createdAt
        },
        unreadCount: conversation.unreadCount,
        pendingRequests: conversation.pendingRequests,
        totalMessages: conversation.messages.length,
        lastActivity: conversation.lastActivity,
        isAccepted: conversation.isAccepted
      };

      if (conversation.pendingRequests > 0 && !conversation.isAccepted) {
        messageRequests.push(conversationData);
        console.log(`   ${conversation.name} → Message Requests (${conversation.pendingRequests} pending)`);
      } else {
        acceptedConversations.push(conversationData);
        console.log(`   ${conversation.name} → Accepted Conversations`);
      }
    });

    console.log('✅ Sending response with:', {
      acceptedCount: acceptedConversations.length,
      requestsCount: messageRequests.length
    });

    res.status(200).json({
      success: true,
      acceptedCount: acceptedConversations.length,
      requestsCount: messageRequests.length,
      acceptedConversations,
      messageRequests
    });

  } catch (error) {
    console.error('❌ GET ALL CONVERSATIONS ERROR:', error);
    console.error('Error stack:', error.stack);
    
    // Send detailed error for debugging
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ========== GET MESSAGE REQUESTS ==========
exports.getMessageRequests = async (req, res) => {
  try {
    console.log('📨 Getting message requests for user:', req.user.id);
    
    const currentUserId = req.user.id;

    const requests = await Message.find({
      recipient: currentUserId, // IMPORTANT: Only requests where current user is recipient
      isRequest: true,
      status: 'pending',
      isDeletedByRecipient: false
    })
    .populate('sender', 'name email avatar')
    .populate('recipient', 'name email avatar')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error('❌ GET MESSAGE REQUESTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message requests'
    });
  }
};

// ========== ACCEPT MESSAGE REQUEST ==========
exports.acceptMessageRequest = async (req, res) => {
  try {
    console.log('✅ Accepting message request:', req.params.messageId);
    
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      recipient: currentUserId,
      isRequest: true,
      status: 'pending'
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message request not found'
      });
    }

    // Mark the entire thread between these two users as accepted
    await Message.markThreadAsAccepted(message.sender, currentUserId);

    console.log(`✅ Accepted all pending requests between ${message.sender} and ${currentUserId}`);

    res.status(200).json({
      success: true,
      message: 'Message request accepted. You can now chat normally.'
    });

  } catch (error) {
    console.error('❌ ACCEPT MESSAGE REQUEST ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept message request'
    });
  }
};

// ========== REJECT MESSAGE REQUEST ==========
exports.rejectMessageRequest = async (req, res) => {
  try {
    console.log('❌ Rejecting message request:', req.params.messageId);
    
    const { messageId } = req.params;
    const currentUserId = req.user.id;
    const { blockUser } = req.body;

    const message = await Message.findOne({
      _id: messageId,
      recipient: currentUserId,
      isRequest: true,
      status: 'pending'
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message request not found'
      });
    }

    await Message.updateMany(
      {
        sender: message.sender,
        recipient: currentUserId,
        isRequest: true,
        status: 'pending'
      },
      {
        $set: {
          status: 'rejected',
          isDeletedByRecipient: true
        }
      }
    );

    if (blockUser) {
      const userProfile = await UserProfile.findOne({ user: currentUserId });
      if (userProfile && userProfile.blockUser) {
        await userProfile.blockUser(message.sender);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Message request rejected' + (blockUser ? ' and user blocked' : '')
    });

  } catch (error) {
    console.error('❌ REJECT MESSAGE REQUEST ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject message request'
    });
  }
};

// ========== GET CONVERSATION STATUS ==========
exports.getConversationStatus = async (req, res) => {
  try {
    console.log('🔍 Getting conversation status for user:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Check if conversation is accepted
    const isConversationAccepted = await Message.isConversationAccepted(currentUserId, userId);
    
    // Check if there are pending requests
    const pendingRequests = await Message.findOne({
      $or: [
        { sender: currentUserId, recipient: userId, isRequest: true, status: 'pending' },
        { sender: userId, recipient: currentUserId, isRequest: true, status: 'pending' }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        isAccepted: isConversationAccepted,
        hasPendingRequests: !!pendingRequests,
        status: isConversationAccepted ? 'accepted' : (pendingRequests ? 'pending' : 'none')
      }
    });

  } catch (error) {
    console.error('❌ GET CONVERSATION STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation status'
    });
  }
};


// ========== REPORT MESSAGE ==========
exports.reportMessage = async (req, res) => {
  try {
    console.log('🚨 Reporting message:', req.params.messageId);
    
    const { messageId } = req.params;
    const { reason, details } = req.body;
    const currentUserId = req.user.id;

    console.log('📋 Report details:', { messageId, reason, details, currentUserId });

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const isSender = message.sender.toString() === currentUserId.toString();
    const isRecipient = message.recipient.toString() === currentUserId.toString();

    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to report this message'
      });
    }

    console.log('📝 Step 1: Reporting message internally...');
    // First, report the message internally
    try {
      await message.reportMessage(currentUserId, reason, details);
      console.log('✅ Step 1: Internal report successful');
    } catch (error) {
      console.error('❌ Step 1: Internal report failed:', error.message);
      throw error;
    }

    console.log('📝 Step 2: Checking for existing reports...');
    // Check if a Report document already exists for this message from this user
    const existingReport = await Report.findOne({
      reporter: currentUserId,
      reportedItemType: 'message',
      reportedItemId: messageId
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this message'
      });
    }

    // Map reason to match Report schema
    const mapReportReason = (reason) => {
      const reasonMap = {
        'spam': 'spam',
        'harassment': 'harassment',
        'inappropriate': 'inappropriate_content',
        'offensive': 'hate_speech',
        'other': 'other'
      };
      return reasonMap[reason] || 'other';
    };

    console.log('📝 Step 3: Creating Report document...');
    // Create a new Report document for the admin panel
    let report;
    try {
      const reportData = {
        reporter: currentUserId,
        reportedItemType: 'message',
        reportedItemId: messageId,
        reason: mapReportReason(reason),
        description: details || '',
        status: 'pending'
      };
      console.log('📄 Report data:', reportData);
      
      report = await Report.create(reportData);
      console.log('✅ Step 3: Report created:', report._id);
    } catch (error) {
      console.error('❌ Step 3: Report creation failed:', error.message);
      console.error('Validation errors:', error.errors);
      throw error;
    }

    // ✅ STEP 4: SEND NOTIFICATION TO MESSAGE SENDER
    console.log('📝 Step 4: Sending notification to message sender...');
    try {
      // Don't send notification if user is reporting their own message
      if (!isSender) {
        // Use the already imported function
        const mappedReason = mapReportReason(reason);
        
        console.log(`📤 Calling triggerContentReportedNotification for message ${messageId}`);
        
        const notificationSent = await triggerContentReportedNotification(
          'message',
          messageId,
          currentUserId,
          mappedReason,
          details || ''
        );
        
        if (notificationSent) {
          console.log('✅ Step 4: "Your message has been reported" notification sent to message sender');
        } else {
          console.log('❌ Step 4: Failed to send notification (function returned false)');
        }
      } else {
        console.log('ℹ️ Step 4: Skipping notification (user reporting their own message)');
      }
    } catch (notificationError) {
      console.error('⚠️ Step 4: Notification sending failed (continuing anyway):', notificationError);
      console.error('Notification error stack:', notificationError.stack);
      // Don't fail the whole request if notification fails
    }

    console.log('📝 Step 5: Message reported successfully (not hidden yet - waiting for admin review)');

    console.log(`✅ Message ${messageId} reported by user ${currentUserId}`);
    console.log(`📄 Created report: ${report._id}`);

    res.status(200).json({
      success: true,
      message: 'Message reported successfully. An admin will review it shortly.',
      reportId: report._id
    });

  } catch (error) {
    console.error('❌ REPORT MESSAGE ERROR:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errors:', error.errors);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.message === 'You have already reported this message') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to report message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// ========== GET REPORTED MESSAGES ==========
exports.getReportedMessages = async (req, res) => {
  try {
    console.log('📋 Getting reported messages');
    
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get reports for messages from the Report collection
    const messageReports = await Report.find({
      reportedItemType: 'message',
      status: 'pending'
    })
    .populate('reporter', 'name email profilePicture')
    .populate({
      path: 'reportedItemId',
      select: 'content sender recipient isHidden reportCount createdAt',
      populate: [
        {
          path: 'sender',
          select: 'name email profilePicture'
        },
        {
          path: 'recipient',
          select: 'name email profilePicture'
        }
      ]
    })
    .sort({ createdAt: -1 });

    // Transform the data to match expected format
    const reportedMessages = messageReports.map(report => {
      const message = report.reportedItemId;
      return {
        _id: report._id,
        reporter: report.reporter,
        reportedItemType: 'message',
        reportedItemId: message?._id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt,
        message: message ? {
          _id: message._id,
          content: message.content,
          sender: message.sender,
          recipient: message.recipient,
          isHidden: message.isHidden,
          reportCount: message.reportCount,
          createdAt: message.createdAt
        } : null
      };
    });

    res.status(200).json({
      success: true,
      count: reportedMessages.length,
      data: reportedMessages
    });

  } catch (error) {
    console.error('❌ GET REPORTED MESSAGES ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reported messages'
    });
  }
};
// ========== MARK MESSAGE AS READ ==========
exports.markAsRead = async (req, res) => {
  try {
    console.log('📖 Marking message as read:', req.params.messageId);
    
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      recipient: currentUserId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    console.error('❌ MARK AS READ ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
};

// ========== DELETE MESSAGE ==========
exports.deleteMessage = async (req, res) => {
  try {
    console.log('🗑️ Deleting message:', req.params.messageId);
    
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const isSender = message.sender.toString() === currentUserId.toString();
    const isRecipient = message.recipient.toString() === currentUserId.toString();

    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    if (isSender) {
      message.isDeletedBySender = true;
    }
    
    if (isRecipient) {
      message.isDeletedByRecipient = true;
    }

    if (message.isDeletedBySender && message.isDeletedByRecipient) {
      await Message.findByIdAndDelete(messageId);
      return res.status(200).json({
        success: true,
        message: 'Message deleted permanently'
      });
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });

  } catch (error) {
    console.error('❌ DELETE MESSAGE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// ========== GET UNREAD MESSAGE COUNT ==========
exports.getUnreadCount = async (req, res) => {
  try {
    console.log('🔔 Getting unread message count for user:', req.user.id);
    
    const currentUserId = req.user.id;

    const unreadCount = await Message.countDocuments({
      recipient: currentUserId,
      isRead: false,
      isDeletedByRecipient: false,
      isRequest: false
    });

    const pendingRequestsCount = await Message.countDocuments({
      recipient: currentUserId,
      isRequest: true,
      status: 'pending',
      isDeletedByRecipient: false
    });

    res.status(200).json({
      success: true,
      data: { 
        unreadCount,
        pendingRequestsCount,
        totalNotifications: unreadCount + pendingRequestsCount
      }
    });

  } catch (error) {
    console.error('❌ GET UNREAD COUNT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// ========== CHECK IF CAN MESSAGE USER ==========
exports.checkCanMessageUser = async (req, res) => {
  try {
    console.log('🔍 Checking if can message user:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    const otherUserProfile = await UserProfile.findOne({ user: userId });

    if (!currentUserProfile || !otherUserProfile) {
      return res.status(200).json({
        success: true,
        canMessage: true,
        mutualFollowing: false,
        currentUserFollowsOther: false,
        otherUserFollowsCurrent: false,
        requiresRequest: true
      });
    }

    // Check if blocked
    if (otherUserProfile.blockedUsers && otherUserProfile.blockedUsers.includes(currentUserId)) {
      return res.status(200).json({
        success: true,
        canMessage: false,
        reason: 'You are blocked by this user',
        isBlocked: true
      });
    }

    // Check if conversation is already accepted
    const isConversationAccepted = await Message.isConversationAccepted(currentUserId, userId);
    
    const isMutualFollowing = 
      currentUserProfile.isFollowing(userId) && 
      otherUserProfile.isFollowing(currentUserId);

    res.status(200).json({
      success: true,
      canMessage: true,
      mutualFollowing: isMutualFollowing,
      currentUserFollowsOther: currentUserProfile.isFollowing(userId),
      otherUserFollowsCurrent: otherUserProfile.isFollowing(currentUserId),
      requiresRequest: !isMutualFollowing && !isConversationAccepted,
      isConversationAccepted: isConversationAccepted
    });

  } catch (error) {
    console.error('❌ CHECK CAN MESSAGE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check messaging permission'
    });
  }
};


// ========== UNBLOCK USER ==========
exports.unblockUser = async (req, res) => {
  try {
    console.log('🔓 Unblocking user:', req.params.userId);
    
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Get current user's profile
    const currentUserProfile = await UserProfile.findOne({ user: currentUserId });
    
    if (!currentUserProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Initialize blockedUsers array if it doesn't exist
    if (!currentUserProfile.blockedUsers) {
      currentUserProfile.blockedUsers = [];
    }

    // Check if current user has blocked the target user
    const isBlocked = currentUserProfile.blockedUsers.some(blockedUserId => 
      blockedUserId.toString() === userId.toString()
    );
    
    if (!isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'You have not blocked this user'
      });
    }

    // Unblock the user (remove from blockedUsers array)
    currentUserProfile.blockedUsers = currentUserProfile.blockedUsers.filter(
      blockedUserId => blockedUserId.toString() !== userId.toString()
    );
    
    await currentUserProfile.save();
    
    console.log(`✅ User ${userId} unblocked by ${currentUserId}`);

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