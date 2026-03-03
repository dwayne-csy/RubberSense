const express = require('express');
const mongoose = require('mongoose');
const Tree = require('../models/Tree');
const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

const getUserId = (req) => req.user?._id || req.user?.id || null;

router.get('/', isAuthenticatedUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const trees = await Tree.find({ owner: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trees.length,
      data: trees
    });
  } catch (error) {
    console.error('Get trees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trees',
      error: error.message
    });
  }
});

router.get('/stats/summary', isAuthenticatedUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const [totalTrees, healthyTrees, diseasedTrees, tappableTrees] = await Promise.all([
      Tree.countDocuments({ owner: userId }),
      Tree.countDocuments({ owner: userId, healthStatus: 'healthy' }),
      Tree.countDocuments({ owner: userId, healthStatus: 'diseased' }),
      Tree.countDocuments({ owner: userId, isTappable: true })
    ]);

    const healthPercentage = totalTrees > 0
      ? Number(((healthyTrees / totalTrees) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalTrees,
        healthyTrees,
        diseasedTrees,
        tappableTrees,
        healthPercentage
      }
    });
  } catch (error) {
    console.error('Get tree stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tree statistics',
      error: error.message
    });
  }
});

router.get('/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, owner: userId }
      : { treeID: id, owner: userId };

    const tree = await Tree.findOne(query);
    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get tree by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tree profile',
      error: error.message
    });
  }
});

router.post('/', isAuthenticatedUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const payload = { ...req.body };

    const requestedTreeID = String(payload.treeID || '').trim();
    payload.treeID = requestedTreeID || `TREE-${Date.now()}`;
    payload.owner = userId;

    if (typeof payload.location === 'string') {
      payload.location = { address: payload.location };
    }
    if (!payload.species) {
      payload.species = 'Rubber';
    }

    const existing = await Tree.findOne({ owner: userId, treeID: payload.treeID });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Tree ID already exists for this user'
      });
    }

    const tree = await Tree.create(payload);
    res.status(201).json({
      success: true,
      message: 'Tree profile created successfully',
      data: tree
    });
  } catch (error) {
    console.error('Create tree profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating tree profile',
      error: error.message
    });
  }
});

router.put('/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = { ...req.body };

    if (typeof updates.location === 'string') {
      updates.location = { address: updates.location };
    }
    delete updates.owner;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, owner: userId }
      : { treeID: id, owner: userId };

    const tree = await Tree.findOneAndUpdate(query, updates, {
      new: true,
      runValidators: true
    });

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tree profile updated successfully',
      data: tree
    });
  } catch (error) {
    console.error('Update tree profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating tree profile',
      error: error.message
    });
  }
});

router.delete('/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, owner: userId }
      : { treeID: id, owner: userId };

    const tree = await Tree.findOneAndDelete(query);
    if (!tree) {
      return res.status(404).json({
        success: false,
        message: 'Tree profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tree profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete tree profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting tree profile',
      error: error.message
    });
  }
});

module.exports = router;
