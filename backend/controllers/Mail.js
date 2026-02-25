// RubberSense/backend/controllers/Mail.js
const Announcement = require('../models/Announcement');
const User = require('../models/User');

// ========== CREATE ANNOUNCEMENT (ADMIN) ==========
exports.createAnnouncement = async (req, res) => {
  try {
    console.log('👑 Admin creating announcement');
    
    const { title, content, type, priority, expiryDate, targetAudience, isImportant } = req.body;

    // Basic validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Parse targetAudience if it's a string
    let audience = ['all'];
    if (targetAudience) {
      if (Array.isArray(targetAudience)) {
        audience = targetAudience;
      } else if (typeof targetAudience === 'string') {
        audience = targetAudience.split(',').map(item => item.trim());
      }
    }

    // Parse expiryDate
    let expiry = null;
    if (expiryDate) {
      expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expiry date format'
        });
      }
    }

    const announcement = await Announcement.create({
      title,
      content,
      type: type || 'announcement',
      priority: priority || 'medium',
      expiryDate: expiry,
      targetAudience: audience,
      isImportant: isImportant || false,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id
    });

    console.log('✅ Announcement created:', announcement._id);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });

  } catch (error) {
    console.error('❌ CREATE ANNOUNCEMENT ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
};

// ========== GET ALL ANNOUNCEMENTS (ADMIN) ==========
exports.getAllAnnouncements = async (req, res) => {
  try {
    console.log('👑 Admin fetching all announcements');
    
    const { 
      type, 
      priority, 
      isPublished, 
      page = 1, 
      limit = 20,
      search,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    // Filter by published status
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }
    
    // Search by title or content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const announcements = await Announcement.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');
    
    const total = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      count: announcements.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: announcements
    });

  } catch (error) {
    console.error('❌ GET ALL ANNOUNCEMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
};

// ========== GET USER ANNOUNCEMENTS ==========
exports.getUserAnnouncements = async (req, res) => {
  try {
    console.log('📢 Fetching announcements for user:', req.user.email);
    
    const user = await User.findById(req.user.id);
    const userType = user.role === 'admin' ? 'admin' : 'user';
    const userSubscription = user.subscriptionType || 'free';
    
    // Build query for announcements visible to this user
    const query = {
      isPublished: true,
      publishDate: { $lte: new Date() },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: userType },
        { targetAudience: userSubscription }
      ]
    };
    
    // Filter out expired announcements
    query.$or.push(
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    );
    
    const announcements = await Announcement.find(query)
      .sort({ 
        isImportant: -1,
        priority: -1,
        publishDate: -1 
      })
      .populate('createdBy', 'name')
      .limit(50); // Limit to 50 most recent announcements
    
    // Add user to viewedBy if not already there and update view count
    if (announcements.length > 0) {
      for (const announcement of announcements) {
        const alreadyViewed = announcement.viewedBy.some(
          view => view.userId.toString() === req.user.id
        );
        
        if (!alreadyViewed) {
          announcement.viewedBy.push({
            userId: req.user.id,
            viewedAt: new Date()
          });
          announcement.views += 1;
          await announcement.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });

  } catch (error) {
    console.error('❌ GET USER ANNOUNCEMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
};

// ========== GET SINGLE ANNOUNCEMENT ==========
exports.getAnnouncementById = async (req, res) => {
  try {
    console.log('📢 Fetching announcement:', req.params.id);
    
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    // Increment view count and add to viewedBy if user is authenticated
    if (req.user) {
      const alreadyViewed = announcement.viewedBy.some(
        view => view.userId.toString() === req.user.id
      );
      
      if (!alreadyViewed) {
        announcement.viewedBy.push({
          userId: req.user.id,
          viewedAt: new Date()
        });
        announcement.views += 1;
        await announcement.save();
      }
    } else {
      // For non-authenticated users, just increment view count
      announcement.views += 1;
      await announcement.save();
    }

    res.status(200).json({
      success: true,
      data: announcement
    });

  } catch (error) {
    console.error('❌ GET ANNOUNCEMENT BY ID ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement'
    });
  }
};

// ========== UPDATE ANNOUNCEMENT (ADMIN) ==========
exports.updateAnnouncement = async (req, res) => {
  try {
    console.log('👑 Admin updating announcement:', req.params.id);
    
    const { title, content, type, priority, expiryDate, targetAudience, isPublished, isImportant } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }
    if (targetAudience !== undefined) {
      let audience = ['all'];
      if (Array.isArray(targetAudience)) {
        audience = targetAudience;
      } else if (typeof targetAudience === 'string') {
        audience = targetAudience.split(',').map(item => item.trim());
      }
      updateData.targetAudience = audience;
    }
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isImportant !== undefined) updateData.isImportant = isImportant;
    
    updateData.lastUpdatedBy = req.user.id;

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastUpdatedBy', 'name email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });

  } catch (error) {
    console.error('❌ UPDATE ANNOUNCEMENT ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement'
    });
  }
};

// ========== DELETE ANNOUNCEMENT (ADMIN) ==========
exports.deleteAnnouncement = async (req, res) => {
  try {
    console.log('👑 Admin deleting announcement:', req.params.id);
    
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('❌ DELETE ANNOUNCEMENT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    });
  }
};

// ========== TOGGLE PUBLISH STATUS (ADMIN) ==========
exports.togglePublishStatus = async (req, res) => {
  try {
    console.log('👑 Admin toggling publish status:', req.params.id);
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    announcement.isPublished = !announcement.isPublished;
    announcement.lastUpdatedBy = req.user.id;
    
    await announcement.save();

    res.status(200).json({
      success: true,
      message: `Announcement ${announcement.isPublished ? 'published' : 'unpublished'} successfully`,
      data: announcement
    });

  } catch (error) {
    console.error('❌ TOGGLE PUBLISH STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle publish status'
    });
  }
};

// ========== GET ANNOUNCEMENT STATS (ADMIN) ==========
exports.getAnnouncementStats = async (req, res) => {
  try {
    console.log('📊 Getting announcement statistics');
    
    const total = await Announcement.countDocuments();
    const published = await Announcement.countDocuments({ isPublished: true });
    const urgent = await Announcement.countDocuments({ priority: 'urgent' });
    const important = await Announcement.countDocuments({ isImportant: true });
    
    // Get announcement types count
    const types = await Announcement.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get announcements by priority
    const priorities = await Announcement.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        published,
        urgent,
        important,
        types,
        priorities
      }
    });

  } catch (error) {
    console.error('❌ GET ANNOUNCEMENT STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get announcement statistics'
    });
  }
};

// ========== MARK ANNOUNCEMENT AS READ ==========
exports.markAnnouncementAsRead = async (req, res) => {
  try {
    console.log('👤 Marking announcement as read:', req.params.id);
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user already marked as read
    const alreadyRead = announcement.readBy.some(
      read => read.userId.toString() === req.user.id
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        userId: req.user.id,
        readAt: new Date()
      });
      
      // Also add to viewedBy if not already there
      const alreadyViewed = announcement.viewedBy.some(
        view => view.userId.toString() === req.user.id
      );
      
      if (!alreadyViewed) {
        announcement.viewedBy.push({
          userId: req.user.id,
          viewedAt: new Date()
        });
      }
      
      await announcement.save();
    }

    res.status(200).json({
      success: true,
      message: 'Announcement marked as read'
    });

  } catch (error) {
    console.error('❌ MARK ANNOUNCEMENT AS READ ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark announcement as read'
    });
  }
};

// ========== GET UNREAD ANNOUNCEMENTS COUNT ==========
exports.getUnreadAnnouncementsCount = async (req, res) => {
  try {
    console.log('📊 Getting unread announcements count for user:', req.user.email);
    
    const user = await User.findById(req.user.id);
    const userType = user.role === 'admin' ? 'admin' : 'user';
    const userSubscription = user.subscriptionType || 'free';
    
    // Build query for announcements visible to this user
    const query = {
      isPublished: true,
      publishDate: { $lte: new Date() },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: userType },
        { targetAudience: userSubscription }
      ]
    };
    
    // Filter out expired announcements
    query.$or.push(
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    );
    
    // Get all visible announcements
    const allAnnouncements = await Announcement.find(query);
    
    // Count unread announcements
    let unreadCount = 0;
    for (const announcement of allAnnouncements) {
      const hasRead = announcement.readBy.some(
        read => read.userId.toString() === req.user.id
      );
      if (!hasRead) {
        unreadCount++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
        totalCount: allAnnouncements.length
      }
    });

  } catch (error) {
    console.error('❌ GET UNREAD ANNOUNCEMENTS COUNT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// ========== GET USER'S UNREAD ANNOUNCEMENTS ==========
exports.getUserUnreadAnnouncements = async (req, res) => {
  try {
    console.log('📢 Fetching unread announcements for user:', req.user.email);
    
    const user = await User.findById(req.user.id);
    const userType = user.role === 'admin' ? 'admin' : 'user';
    const userSubscription = user.subscriptionType || 'free';
    
    // Build query for announcements visible to this user
    const query = {
      isPublished: true,
      publishDate: { $lte: new Date() },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: userType },
        { targetAudience: userSubscription }
      ]
    };
    
    // Filter out expired announcements
    query.$or.push(
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    );
    
    const announcements = await Announcement.find(query)
      .sort({ 
        isImportant: -1,
        priority: -1,
        publishDate: -1 
      })
      .populate('createdBy', 'name')
      .limit(50);
    
    // Filter to get only unread announcements
    const unreadAnnouncements = announcements.filter(announcement => {
      return !announcement.readBy.some(
        read => read.userId.toString() === req.user.id
      );
    });

    res.status(200).json({
      success: true,
      count: unreadAnnouncements.length,
      data: unreadAnnouncements
    });

  } catch (error) {
    console.error('❌ GET USER UNREAD ANNOUNCEMENTS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread announcements'
    });
  }
};

// ========== MARK ALL ANNOUNCEMENTS AS READ =========
exports.markAllAnnouncementsAsRead = async (req, res) => {
  try {
    console.log('👤 Marking all announcements as read for user:', req.user.email);
    
    const user = await User.findById(req.user.id);
    const userType = user.role === 'admin' ? 'admin' : 'user';
    const userSubscription = user.subscriptionType || 'free';
    
    // Build query for announcements visible to this user
    const query = {
      isPublished: true,
      publishDate: { $lte: new Date() },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: userType },
        { targetAudience: userSubscription }
      ]
    };
    
    // Filter out expired announcements
    query.$or.push(
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    );
    
    const announcements = await Announcement.find(query);
    
    let updatedCount = 0;
    
    for (const announcement of announcements) {
      const alreadyRead = announcement.readBy.some(
        read => read.userId.toString() === req.user.id
      );
      
      if (!alreadyRead) {
        announcement.readBy.push({
          userId: req.user.id,
          readAt: new Date()
        });
        
        // Also add to viewedBy if not already there
        const alreadyViewed = announcement.viewedBy.some(
          view => view.userId.toString() === req.user.id
        );
        
        if (!alreadyViewed) {
          announcement.viewedBy.push({
            userId: req.user.id,
            viewedAt: new Date()
          });
        }
        
        await announcement.save();
        updatedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Marked ${updatedCount} announcements as read`,
      data: { updatedCount }
    });

  } catch (error) {
    console.error('❌ MARK ALL ANNOUNCEMENTS AS READ ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all announcements as read'
    });
  }
};