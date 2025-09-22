import mongoose from 'mongoose';

const eventReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event report name is required'],
    trim: true,
    maxlength: [200, 'Event report name cannot exceed 200 characters']
  },
  dateUpdated: {
    type: Date,
    required: [true, 'Date updated is required'],
    default: Date.now
  },
  createdBy: {
    type: String,
    required: [true, 'Creator name is required'],
    trim: true,
    maxlength: [100, 'Creator name cannot exceed 100 characters']
  },
  eventWork: {
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
eventReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
eventReportSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual for formatted file size
eventReportSchema.virtual('formattedSize').get(function() {
  if (!this.eventWork || !this.eventWork.size) return '0 MB';
  return this.eventWork.size;
});

// Ensure virtual fields are serialized
eventReportSchema.set('toJSON', {
  virtuals: true
});

const EventReport = mongoose.model('EventReport', eventReportSchema);

export default EventReport;