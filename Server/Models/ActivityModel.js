import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'completed', 'assigned', 'joined', 'left']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['project', 'meeting', 'blog', 'attendance', 'user']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  entityTitle: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;