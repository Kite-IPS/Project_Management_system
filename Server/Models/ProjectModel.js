import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxLength: [200, 'Project name cannot exceed 200 characters']
  },
  status: {
    type: String,
    required: [true, 'Project status is required'],
    enum: {
      values: ['Planning', 'In Progress', 'Completed', 'On Hold'],
      message: 'Status must be one of: Planning, In Progress, Completed, On Hold'
    },
    default: 'Planning'
  },
  teamMembers: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    required: [true, 'At least one team member is required'],
    validate: {
      validator: function(value) {
        return value && value.length > 0;
      },
      message: 'At least one team member is required'
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  paperWork: {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Paper work must be a valid URL if provided'
    }
  },
  projectTrack: {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Project track must be a valid URL if provided'
    }
  },
  repository: {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Repository must be a valid URL if provided'
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
  }
}, {
  timestamps: true
});

// Indexes for better performance
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ teamMembers: 1 });
projectSchema.index({ createdBy: 1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Virtual for project progress (based on dates)
projectSchema.virtual('progress').get(function() {
  if (this.status === 'Completed') return 100;
  if (this.status === 'Planning') return 0;
  
  const now = new Date();
  const total = this.endDate - this.startDate;
  const elapsed = now - this.startDate;
  
  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;
  
  return Math.round((elapsed / total) * 100);
});

// Ensure virtual fields are included in JSON output
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;