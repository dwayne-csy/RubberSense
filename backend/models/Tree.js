const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  treeID: {
    type: String,
    required: true,
    trim: true
  },
  species: {
    type: String,
    default: 'Rubber',
    trim: true
  },
  isRubberTree: {
    type: Boolean,
    default: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: {
      type: String,
      default: ''
    }
  },
  plantedDate: {
    type: Date,
    default: null
  },
  age: {
    type: Number,
    default: null
  },
  barkTexture: {
    type: String,
    enum: ['smooth', 'rough', 'cracked', 'flaky', 'moderately rough', 'unknown'],
    default: 'unknown'
  },
  barkColor: {
    type: String,
    default: null
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'diseased', 'dying', 'dead', 'unknown'],
    default: 'unknown'
  },
  isTappable: {
    type: Boolean,
    default: false
  },
  tappabilityScore: {
    type: Number,
    default: null
  },
  lastScannedAt: {
    type: Date,
    default: null
  },
  totalScans: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

treeSchema.index({ owner: 1, treeID: 1 }, { unique: true });
treeSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Tree', treeSchema);
