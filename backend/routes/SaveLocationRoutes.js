const express = require('express');
const router = express.Router();
const SaveLocationController = require('../controllers/SaveLocationController');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

// All routes require authentication
router.use(isAuthenticatedUser);

// Save a new location (user-specific)
router.post('/', SaveLocationController.saveLocation);

// Get all locations for the current user ONLY
router.get('/', SaveLocationController.getUserLocations);

// Get single location by ID (user-specific)
router.get('/:id', SaveLocationController.getLocationById);

// Update a location (user-specific)
router.put('/:id', SaveLocationController.updateLocation);

// Delete a location (user-specific)
router.delete('/:id', SaveLocationController.deleteLocation);

module.exports = router;