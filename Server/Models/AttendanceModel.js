import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true,
    default: 'Present'
  },
  dailyTask: {
    type: String,
    required: true,
    trim: true
  },
  taskStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Blocked'],
    required: true,
    default: 'Not Started'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index to ensure one attendance record per user per date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for efficient queries
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ user: 1, date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ taskStatus: 1 });

// Pre-save middleware to set userName and userEmail from user reference
attendanceSchema.pre('save', async function(next) {
  if (this.isNew && this.user) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.user);
      if (user) {
        this.userName = user.displayName || user.email.split('@')[0];
        this.userEmail = user.email;
      }
    } catch (error) {
      console.error('Error setting user details in attendance:', error);
    }
  }
  next();
});

// Static method to get attendance for a specific date
attendanceSchema.statics.getAttendanceByDate = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).populate('user', 'displayName email').populate('markedBy', 'displayName');
};

// Static method to get attendance summary for a date range
attendanceSchema.statics.getAttendanceSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': -1, '_id.status': 1 }
    }
  ]);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;