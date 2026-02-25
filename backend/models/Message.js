const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'accepted', 'rejected', 'pending'],
    default: 'sent'
  },
  isRequest: {
    type: Boolean,
    default: false
  },
  isDeletedBySender: {
    type: Boolean,
    default: false
  },
  isDeletedByRecipient: {
    type: Boolean,
    default: false
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'offensive', 'other']
    },
    details: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
      default: 'pending'
    }
  }],
  adminAction: {
    type: String,
    enum: ['none', 'warning_sent', 'message_hidden', 'user_warned', 'user_suspended'],
    default: 'none'
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  hiddenReason: {
    type: String
  },
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hiddenAt: {
    type: Date
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries.
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, isRead: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ isRequest: 1, recipient: 1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ 'reportedBy.status': 1 });
MessageSchema.index({ sender: 1, recipient: 1, status: 1 });
MessageSchema.index({ isHidden: 1 });
MessageSchema.index({ reportCount: -1 });

// Static method for cleaner queries
MessageSchema.statics.findForUser = function(userId, additionalQuery = {}) {
  return this.find({
    $or: [
      { 
        $and: [
          { sender: userId },
          { isDeletedBySender: false },
          ...Object.entries(additionalQuery).map(([key, value]) => ({ [key]: value }))
        ]
      },
      { 
        $and: [
          { recipient: userId },
          { isDeletedByRecipient: false },
          ...Object.entries(additionalQuery).map(([key, value]) => ({ [key]: value }))
        ]
      }
    ]
  });
};

// Virtual for checking if message is deleted for current user
MessageSchema.virtual('isDeletedForCurrentUser').get(function() {
  return false;
});

// Method to report a message
MessageSchema.methods.reportMessage = async function(userId, reason, details) {
  const existingReport = this.reportedBy.find(report => 
    report.user.toString() === userId.toString()
  );
  
  if (existingReport) {
    throw new Error('You have already reported this message');
  }
  
  this.reportedBy.push({
    user: userId,
    reason: reason || 'other',
    details: details || '',
    status: 'pending'
  });
  
  this.reportCount += 1;
  
  return this.save();
};

// Method to check if message is reported by user
MessageSchema.methods.isReportedByUser = function(userId) {
  return this.reportedBy.some(report => 
    report.user.toString() === userId.toString()
  );
};

// Static method to check for inappropriate content
MessageSchema.statics.checkInappropriateContent = function(content) {
  const inappropriateWords = [
    'hate', 'attack', 'harass', 'abuse', 'offensive',
    'racist', 'sexist', 'violent', 'threat', 'kill'
  ];
  
  const lowerContent = content.toLowerCase();
  return inappropriateWords.some(word => lowerContent.includes(word));
};

// Static method to check if conversation is accepted
MessageSchema.statics.isConversationAccepted = async function(user1Id, user2Id) {
  const acceptedMessage = await this.findOne({
    $or: [
      { sender: user1Id, recipient: user2Id, status: 'accepted' },
      { sender: user2Id, recipient: user1Id, status: 'accepted' }
    ]
  });
  return !!acceptedMessage;
};

// Static method to mark thread as accepted
MessageSchema.statics.markThreadAsAccepted = async function(user1Id, user2Id) {
  await this.updateMany(
    {
      $or: [
        { sender: user1Id, recipient: user2Id },
        { sender: user2Id, recipient: user1Id }
      ],
      isRequest: true,
      status: 'pending'
    },
    {
      $set: {
        status: 'accepted',
        isRequest: false,
        isRead: true,
        readAt: new Date()
      }
    }
  );
  
  return true;
};

// Static method to get reported messages for admin
MessageSchema.statics.getReportedMessagesForAdmin = async function() {
  return this.find({
    reportCount: { $gt: 0 },
    'reportedBy.status': 'pending'
  })
  .populate('sender', 'name email profilePicture')
  .populate('recipient', 'name email profilePicture')
  .populate('reportedBy.user', 'name email')
  .sort('-createdAt');
};

module.exports = mongoose.model('Message', MessageSchema);