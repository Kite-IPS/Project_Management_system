import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Member'],
    default: 'Member',
    required: true
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

const Role = mongoose.model('Role', roleSchema);

export default Role;
