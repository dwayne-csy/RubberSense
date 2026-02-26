const mongoose = require('mongoose');

const trunkAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  imagePublicId: {
    type: String,
    required: [true, 'Image public ID is required']
  },
  primaryDetection: {
    class: {
      type: String,
      required: true,
      index: true
    },
    class_id: Number,
    class_name: String,
    display_name: String,
    name: String,
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    health_status: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'none', 'mild', 'moderate', 'severe', 
             'mild to moderate', 'moderate to severe', 'Mild to Moderate', 'Moderate to Severe']
    }
  },
  allDetections: [{
    class: String,
    class_id: Number,
    class_name: String,
    display_name: String,
    name: String,
    confidence: Number,
    bbox: [Number],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'none', 'mild', 'moderate', 'severe',
             'mild to moderate', 'moderate to severe', 'Mild to Moderate', 'Moderate to Severe']
    }
  }],
  maturity: {
    class: {
      type: String,
      enum: ['immature', 'mature', 'unknown', 'Immature', 'Mature']
    },
    confidence: Number,
    estimatedAge: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        default: 'years'
      }
    }
  },
  colorAnalysis: {
    primaryColor: String,
    barkCondition: {
      type: String,
      enum: ['healthy', 'rough', 'cracked', 'peeling', 'unknown', 'Excellent', 'Good', 'Fair', 'Poor', 'Critical']
    },
    discoloration: Number,
    uniformity: String,
    variability: Number
  },
  textureAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  healthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  ageEstimate: {
    type: Number,
    min: 0,
    max: 100
  },
  age_estimation: {
    estimated_years: Number,
    range: String,
    confidence: Number,
    basis: String
  },
  disease: {
    name: String,
    class: String,
    severity: String,
    confidence: Number,
    description: String,
    treatment: String,
    symptoms: [String],
    latex_impact: String,
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    detected: Boolean
  },
  visual_analysis: {
    color: mongoose.Schema.Types.Mixed,
    texture: mongoose.Schema.Types.Mixed,
    lesions: mongoose.Schema.Types.Mixed,
    bark_condition: mongoose.Schema.Types.Mixed
  },
  careRecommendations: [{
    priority: {
      type: String,
      enum: ['immediate', 'soon', 'monitor', 'routine', 'low', 'medium', 'high', 'critical']
    },
    action: String,
    description: String,
    timeframe: String
  }],
  fullAnalysis: {
    type: mongoose.Schema.Types.Mixed
  },
  processingTime: String,
  mlModelUsed: {
    type: Boolean,
    default: true
  },
  model_info: mongoose.Schema.Types.Mixed,
  image_metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
trunkAnalysisSchema.index({ userId: 1, createdAt: -1 });
trunkAnalysisSchema.index({ 'primaryDetection.class': 1, createdAt: -1 });
trunkAnalysisSchema.index({ healthScore: -1 });
trunkAnalysisSchema.index({ 'maturity.class': 1 });

// Virtual for formatted date
trunkAnalysisSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for health status
trunkAnalysisSchema.virtual('healthStatus').get(function() {
  if (this.healthScore >= 80) return 'Excellent';
  if (this.healthScore >= 60) return 'Good';
  if (this.healthScore >= 40) return 'Fair';
  if (this.healthScore >= 20) return 'Poor';
  return 'Critical';
});

// Virtual for priority level
trunkAnalysisSchema.virtual('priority').get(function() {
  if (this.healthScore <= 30) return 'high';
  if (this.healthScore <= 50) return 'medium';
  return 'low';
});

// Method to check if tree needs immediate attention
trunkAnalysisSchema.methods.needsImmediateAttention = function() {
  return this.healthScore <= 30 || 
         (this.primaryDetection && this.primaryDetection.severity === 'critical') ||
         (this.disease && this.disease.urgency === 'critical');
};

// Method to get urgent recommendations
trunkAnalysisSchema.methods.getUrgentRecommendations = function() {
  return this.careRecommendations.filter(rec => 
    rec.priority === 'immediate' || rec.priority === 'critical' || rec.priority === 'high'
  );
};

// Method to check if tree is mature
trunkAnalysisSchema.methods.isMature = function() {
  const maturityClass = this.maturity?.class?.toLowerCase();
  return maturityClass === 'mature' || maturityClass === 'mature';
};

module.exports = mongoose.model('TrunksAnalysis', trunkAnalysisSchema);