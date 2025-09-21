import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Review', 'Done'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    avatar: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
    }
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Due date must be after start date'
    }
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  paperwork: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty values
        try {
          new URL(v);
          return true;
        } catch (err) {
          return false;
        }
      },
      message: 'Paperwork must be a valid URL'
    }
  },
  projectTrack: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        try {
          new URL(v);
          return true;
        } catch (err) {
          return false;
        }
      },
      message: 'Project track must be a valid URL'
    }
  },
  repoLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        try {
          new URL(v);
          return true;
        } catch (err) {
          return false;
        }
      },
      message: 'Repository link must be a valid URL'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Additional fields for project details
  milestones: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: [100, 'Milestone title cannot exceed 100 characters']
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    dueDate: {
      type: Date,
      required: true
    },
    completedDate: Date,
    description: {
      type: String,
      trim: true,
      maxLength: [300, 'Milestone description cannot exceed 300 characters']
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    userAvatar: String,
    userColor: String,
    message: {
      type: String,
      required: true,
      maxLength: [1000, 'Comment cannot exceed 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  activities: [{
    type: {
      type: String,
      enum: ['status_change', 'assignment', 'comment', 'milestone', 'progress_update'],
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed // For storing additional activity data
  }],
  risks: [{
    description: {
      type: String,
      required: true,
      maxLength: [200, 'Risk description cannot exceed 200 characters']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    mitigation: {
      type: String,
      required: true,
      maxLength: [300, 'Mitigation cannot exceed 300 characters']
    },
    status: {
      type: String,
      enum: ['open', 'mitigated', 'closed'],
      default: 'open'
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxLength: [30, 'Tag cannot exceed 30 characters']
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if project is overdue
projectSchema.virtual('isOverdue').get(function() {
  return this.status !== 'Done' && new Date() > this.dueDate;
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'Done') return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Indexes for better query performance
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ 'assignees.userId': 1 });
projectSchema.index({ startDate: 1, dueDate: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ isArchived: 1 });
projectSchema.index({ createdAt: -1 });

// Pre-save middleware to update progress based on status
projectSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    switch (this.status) {
      case 'To Do':
        this.progress = 0;
        break;
      case 'In Progress':
        this.progress = Math.max(25, this.progress);
        break;
      case 'Review':
        this.progress = Math.max(75, this.progress);
        break;
      case 'Done':
        this.progress = 100;
        break;
    }
  }

  // Update archivedAt when isArchived changes to true
  if (this.isModified('isArchived') && this.isArchived) {
    this.archivedAt = new Date();
  }

  next();
});

// Static method to get project statistics
projectSchema.statics.getStatistics = async function(userId, userRole) {
  let matchQuery = { isArchived: false };
  
  // If not admin, only show projects where user is assigned or created
  if (userRole !== 'admin') {
    matchQuery.$or = [
      { createdBy: userId },
      { 'assignees.userId': userId }
    ];
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        toDo: { $sum: { $cond: [{ $eq: ['$status', 'To Do'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
        review: { $sum: { $cond: [{ $eq: ['$status', 'Review'] }, 1, 0] } },
        done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'Done'] },
                  { $lt: ['$dueDate', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    toDo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    overdue: 0,
    highPriority: 0
  };
};

// Instance method to add activity
projectSchema.methods.addActivity = function(type, user, description, metadata = {}) {
  this.activities.unshift({
    type,
    user: user.userId || user._id,
    userName: user.displayName || user.name,
    description,
    metadata
  });
  
  // Keep only last 50 activities
  if (this.activities.length > 50) {
    this.activities = this.activities.slice(0, 50);
  }
};

// Instance method to add comment
projectSchema.methods.addComment = function(user, message) {
  // First add the comment
  this.comments.unshift({
    user: user.userId || user._id,
    userName: user.displayName || user.name,
    userAvatar: user.avatar,
    userColor: user.color,
    message
  });
  
  // Truncate message for activity log
  const truncatedMessage = message.length > 50 
    ? message.substring(0, 50) + '...'
    : message;
    
  // Add activity for comment with proper error handling
  try {
    this.addActivity('comment', user, `added a comment: "${truncatedMessage}"`, {
      commentId: this.comments[0]._id, // Reference to the newly added comment
      truncated: message.length > 50
    });
  } catch (error) {
    console.error('Error adding comment activity:', error);
  }
};

// Add method to calculate project health

projectSchema.methods.getProjectHealth = function() {
  if (this.status === 'Done') return 'completed';
  if (this.isOverdue) return 'at_risk';
  
  const daysRemaining = this.daysRemaining;
  const progressExpected = (1 - (daysRemaining / (
    (new Date(this.dueDate) - new Date(this.startDate)) / (1000 * 60 * 60 * 24)
  ))) * 100;
  
  if (this.progress >= progressExpected) return 'on_track';
  if (this.progress >= progressExpected - 20) return 'needs_attention';
  return 'at_risk';
};

const Project = mongoose.model('Project', projectSchema);

export default Project;