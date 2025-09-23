import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    sparse: true, // Allow null values, but ensure uniqueness when present
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true
  },
  photoURL: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    enum: ['email', 'google', 'facebook', 'github'],
    default: 'email'
  },
  providerData: [{
    providerId: String,
    uid: String,
    displayName: String,
    email: String,
    photoURL: String
  }],
  role: {
    type: String,
    enum: ['Admin', 'Member', 'SPOC'],
    default: 'Member'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Additional fields for project management
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ authProvider: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Virtual for full name (if you want to split displayName)
userSchema.virtual('firstName').get(function() {
  return this.displayName ? this.displayName.split(' ')[0] : '';
});

userSchema.virtual('lastName').get(function() {
  return this.displayName ? this.displayName.split(' ').slice(1).join(' ') : '';
});

// Instance method to check if password matches
userSchema.methods.isValidPassword = async function(password) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, this.password);
};

// Static method to find user by email or uid
userSchema.statics.findByEmailOrUid = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier },
      { uid: identifier }
    ]
  });
};

// Static method to create user from OAuth data
userSchema.statics.createFromOAuth = function(oauthData) {
  return this.create({
    uid: oauthData.uid,
    email: oauthData.email,
    displayName: oauthData.displayName,
    photoURL: oauthData.photoURL,
    emailVerified: oauthData.emailVerified,
    phoneNumber: oauthData.phoneNumber,
    authProvider: oauthData.authProvider || 'google',
    providerData: oauthData.providerData
  });
};

const User = mongoose.model('User', userSchema);

export default User;