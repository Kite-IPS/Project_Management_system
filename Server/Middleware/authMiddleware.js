import jwt from 'jsonwebtoken';
import User from '../Models/UserModel.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (you may need to configure this)
let admin;
try {
  admin = getAuth();
} catch (error) {
  console.log('Firebase Admin not initialized, falling back to JWT verification');
}

// Middleware to verify JWT token or Firebase token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    let user;

    // First try Firebase token verification
    if (admin) {
      try {
        const decodedToken = await admin.verifyIdToken(token);
        user = await User.findOne({ email: decodedToken.email });
        
        if (!user) {
          // Create user if doesn't exist (for Firebase users)
          user = await User.create({
            uid: decodedToken.uid,
            email: decodedToken.email,
            displayName: decodedToken.name,
            emailVerified: decodedToken.email_verified,
            authProvider: 'google'
          });
        }
        
        req.user = user;
        return next();
      } catch (firebaseError) {
        console.log('Firebase token verification failed, trying JWT');
      }
    }

    // Fallback to JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Add user to request object
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Middleware to check if user is admin or moderator
export const requireModerator = (req, res, next) => {
  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Moderator or admin access required'
    });
  }
  next();
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};