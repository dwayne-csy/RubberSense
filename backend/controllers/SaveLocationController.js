const SaveLocation = require('../models/SaveLocation');
const User = require('../models/User');

// ========== SAVE A NEW LOCATION ==========
exports.saveLocation = async (req, res) => {
  try {
    console.log('📍 Save location request received for user:', req.user.id);
    console.log('Request body:', req.body);

    // Get user from request
    const userId = req.user._id;

    // Validate required fields
    const { name, latitude, longitude, address } = req.body;
    
    if (!name || !latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, latitude, longitude, and address'
      });
    }

    // Create location data
    const locationData = {
      name: name.trim(),
      type: req.body.type || 'plantation',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address.trim(),
      details: req.body.details || {},
      accuracy: req.body.accuracy || null,
      user: userId
    };

    console.log('Location data to save:', locationData);

    // Save to database
    const location = await SaveLocation.create(locationData);
    console.log('✅ Location saved to database:', location._id);

    // Populate user data for response
    const savedLocation = await SaveLocation.findById(location._id)
      .populate({
        path: 'user',
        select: 'name email avatar contact',
        model: 'User'
      })
      .lean();

    res.status(201).json({
      success: true,
      message: 'Location saved successfully',
      location: {
        id: savedLocation._id,
        name: savedLocation.name,
        type: savedLocation.type,
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        address: savedLocation.address,
        details: savedLocation.details,
        accuracy: savedLocation.accuracy,
        createdAt: savedLocation.createdAt,
        user: savedLocation.user ? {
          id: savedLocation.user._id,
          name: savedLocation.user.name,
          email: savedLocation.user.email,
          avatar: savedLocation.user.avatar,
          contact: savedLocation.user.contact
        } : null
      }
    });

  } catch (error) {
    console.error('❌ SAVE LOCATION ERROR:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle duplicate location coordinates for same user
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already saved a location with these coordinates'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while saving location'
    });
  }
};

// ========== GET USER'S SAVED LOCATIONS ==========
exports.getUserLocations = async (req, res) => {
  try {
    console.log('📍 Fetching locations for user:', req.user._id);
    
    const userId = req.user._id;
    const { type, limit = 50, page = 1 } = req.query;
    
    // Build query - only locations for current user
    const query = { user: userId };
    
    if (type && ['plantation', 'collection'].includes(type)) {
      query.type = type;
    }

    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = Math.min(parseInt(limit), 100);
    const skip = (pageNumber - 1) * pageSize;

    // Get total count
    const totalLocations = await SaveLocation.countDocuments(query);
    console.log(`📊 Found ${totalLocations} locations for user ${userId}`);

    // Get locations with pagination
    const locations = await SaveLocation.find(query)
      .select('-__v')
      .populate({
        path: 'user',
        select: 'name email avatar contact',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Format response
    const formattedLocations = locations.map(loc => ({
      id: loc._id,
      name: loc.name,
      type: loc.type,
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address,
      details: loc.details,
      accuracy: loc.accuracy,
      createdAt: loc.createdAt,
      user: loc.user ? {
        id: loc.user._id,
        name: loc.user.name,
        email: loc.user.email,
        avatar: loc.user.avatar,
        contact: loc.user.contact
      } : null
    }));

    console.log(`✅ Returning ${formattedLocations.length} locations`);

    res.status(200).json({
      success: true,
      count: formattedLocations.length,
      total: totalLocations,
      page: pageNumber,
      pages: Math.ceil(totalLocations / pageSize),
      locations: formattedLocations
    });

  } catch (error) {
    console.error('❌ GET LOCATIONS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching locations'
    });
  }
};

// ========== GET SINGLE LOCATION ==========
exports.getLocationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const locationId = req.params.id;

    console.log(`📍 User ${userId} requesting location ${locationId}`);

    const location = await SaveLocation.findOne({
      _id: locationId,
      user: userId
    })
    .select('-__v')
    .populate({
      path: 'user',
      select: 'name email avatar contact',
      model: 'User'
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      location: {
        id: location._id,
        name: location.name,
        type: location.type,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        details: location.details,
        accuracy: location.accuracy,
        createdAt: location.createdAt,
        user: location.user ? {
          id: location.user._id,
          name: location.user.name,
          email: location.user.email,
          avatar: location.user.avatar,
          contact: location.user.contact
        } : null
      }
    });

  } catch (error) {
    console.error('❌ GET LOCATION BY ID ERROR:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching location'
    });
  }
};

// ========== UPDATE LOCATION ==========
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const locationId = req.params.id;

    console.log(`📍 User ${userId} updating location ${locationId}`);

    // Find location owned by user
    let location = await SaveLocation.findOne({
      _id: locationId,
      user: userId
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or access denied'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'type', 'address', 'details'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'name' || field === 'address') {
          updates[field] = req.body[field].trim();
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Apply updates
    Object.keys(updates).forEach(key => {
      location[key] = updates[key];
    });

    // Save updated location
    await location.save();

    // Get updated location with user data
    const updatedLocation = await SaveLocation.findById(location._id)
      .populate({
        path: 'user',
        select: 'name email avatar contact',
        model: 'User'
      })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: {
        id: updatedLocation._id,
        name: updatedLocation.name,
        type: updatedLocation.type,
        latitude: updatedLocation.latitude,
        longitude: updatedLocation.longitude,
        address: updatedLocation.address,
        details: updatedLocation.details,
        accuracy: updatedLocation.accuracy,
        createdAt: updatedLocation.createdAt,
        updatedAt: updatedLocation.updatedAt,
        user: updatedLocation.user ? {
          id: updatedLocation.user._id,
          name: updatedLocation.user.name,
          email: updatedLocation.user.email,
          avatar: updatedLocation.user.avatar,
          contact: updatedLocation.user.contact
        } : null
      }
    });

  } catch (error) {
    console.error('❌ UPDATE LOCATION ERROR:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating location'
    });
  }
};

// ========== DELETE LOCATION ==========
exports.deleteLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const locationId = req.params.id;

    console.log(`📍 User ${userId} deleting location ${locationId}`);

    const location = await SaveLocation.findOneAndDelete({
      _id: locationId,
      user: userId
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
      deletedLocation: {
        id: location._id,
        name: location.name,
        type: location.type
      }
    });

  } catch (error) {
    console.error('❌ DELETE LOCATION ERROR:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting location'
    });
  }
};