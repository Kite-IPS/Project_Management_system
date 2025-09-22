import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Paper name is required'],
    trim: true,
    maxlength: [200, 'Paper name cannot exceed 200 characters']
  },
  dateUpdate: {
    type: Date,
    required: [true, 'Date updated is required'],
    default: Date.now
  },
  assignee: {
    type: String,
    required: [true, 'Assignee is required'],
    trim: true,
    maxlength: [100, 'Assignee name cannot exceed 100 characters']
  },
  paperWork: {
    filename: {
      type: String,
      default: null
    },
    originalName: {
      type: String,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: null
    },
    path: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
paperSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
paperSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual for formatted file size
paperSchema.virtual('formattedSize').get(function() {
  if (!this.paperWork || !this.paperWork.size) return '0 MB';
  return this.paperWork.size;
});

// Ensure virtual fields are serialized
paperSchema.set('toJSON', {
  virtuals: true
});

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;