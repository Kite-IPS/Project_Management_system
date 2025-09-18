import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  datePublished: {
    type: Date,
    required: true,
    default: Date.now
  },
  files: [fileSchema],
  isPublished: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
MeetingSchema.virtual('formattedDate').get(function() {
  return this.datePublished.toLocaleDateString();
});

// Index for better search performance
MeetingSchema.index({ title: 'text', content: 'text' });
MeetingSchema.index({ datePublished: -1 });
MeetingSchema.index({ author: 1 });

// Pre-populate author and participants when querying
MeetingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'name email role'
  }).populate({
    path: 'participants',
    select: 'name email role'
  });
  next();
});

const Meeting = mongoose.model('Meeting', MeetingSchema);

export default Meeting;