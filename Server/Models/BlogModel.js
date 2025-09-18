import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please enter a valid URL starting with http:// or https://'
    }
  }
}, { _id: false });

const blogSchema = new mongoose.Schema({
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
  datePublished: {
    type: Date,
    required: true,
    default: Date.now
  },
  links: [linkSchema],
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
blogSchema.virtual('formattedDate').get(function() {
  return this.datePublished.toLocaleDateString();
});

// Index for better search performance
blogSchema.index({ title: 'text', content: 'text' });
blogSchema.index({ datePublished: -1 });
blogSchema.index({ author: 1 });

// Pre-populate author when querying
blogSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'name email role'
  });
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;