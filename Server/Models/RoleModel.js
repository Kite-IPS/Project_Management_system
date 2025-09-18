import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    set: (v) => v.toLowerCase().trim()  // Ensure consistent email format on save
  },
  role: {
    type: String,
    enum: ['Admin', 'Member', 'SPOC'],
    default: 'Member',
    required: true
  },
  batch:{
    type: Number,
    required: true,
  },
  assignedBy: {
    type: String,
    default: 'system'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to ensure email is always normalized
roleSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

const Role = mongoose.model('Role', roleSchema);

export default Role;
