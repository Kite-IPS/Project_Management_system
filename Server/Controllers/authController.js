import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Models/UserModel.js';
import Role from '../Models/RoleModel.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Login with email and password
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user registered with OAuth
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This email is associated with Google sign-in. Please use Google to login.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has authorized role
    let roleDoc = await Role.findOne({ email: email.toLowerCase() });
    if (!roleDoc) {
      // Create default role for new users
      // roleDoc = new Role({
      //   email: email.toLowerCase(),
      //   role: 'Member',
      //   assignedBy: 'system'
      // });
      // await roleDoc.save();
      user.role = 'Member'; // Default role
    } else {
      user.role = roleDoc.role;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate access token
    const accessToken = generateToken(user._id);

    // Return user data without password
    const userResponse = {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      authProvider: user.authProvider,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      accessToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// OAuth login (Google) - Save or update user
export const OAuthLogin = async (req, res) => {
  try {
    console.log('OAuth Login - Received request body:', JSON.stringify(req.body, null, 2));
    
    const {
      uid,
      email,
      displayName,
      photoURL,
      emailVerified,
      phoneNumber,
      authProvider = 'google',
      providerData
    } = req.body;

    // Validate required fields
    if (!uid || !email) {
      console.log('OAuth Login - Missing required fields:', { uid, email });
      return res.status(400).json({
        success: false,
        message: 'User ID and email are required'
      });
    }

    console.log('OAuth Login - Checking authorization for email:', email);
    
    // First, check if the email is authorized
    const normalizedEmail = (email || '').toLowerCase().trim();
    console.log('OAuth Login - Email processing:', {
      originalEmail: email,
      normalizedEmail: normalizedEmail
    });
    
    const roleDoc = await Role.findOne({ email: normalizedEmail });
    console.log('OAuth Login - Role search result:', {
      searchEmail: normalizedEmail,
      roleFound: !!roleDoc,
      roleDoc: roleDoc
    });

    // Log all roles for comparison
    const allRoles = await Role.find({});
    console.log('OAuth Login - All roles:', allRoles.map(r => ({
      email: r.email,
      role: r.role
    })));

    if (!roleDoc) {
      console.log('OAuth Login - Authorization failed:', {
        searchedEmail: normalizedEmail,
        allEmails: allRoles.map(r => r.email)
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Email not authorized for this portal.',
        debug: {
          searchedEmail: normalizedEmail,
          availableEmails: allRoles.map(r => r.email)
        }
      });
    }    console.log('OAuth Login - Role authorized, checking for existing user');
    // Then, check if user exists by email
    let user = await User.findOne({ email });
    console.log('OAuth Login - Existing user found:', user ? 'Yes' : 'No');

    if (user) {
      // Update existing user with OAuth data
      user.uid = uid;
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      user.emailVerified = emailVerified;
      user.role = roleDoc.role; // Assign role from roleDoc
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.authProvider = authProvider;
      user.providerData = providerData;
      user.lastLoginAt = new Date();
      
      await user.save();
    } else {
      // Create new user from OAuth data
      user = new User({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL,
        emailVerified,
        role: roleDoc.role, // Assign role from roleDoc
        phoneNumber,
        authProvider,
        providerData,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      await user.save();
    }

    // Fetch role from Role collection


    // Generate access token
    const accessToken = generateToken(user._id);

    // Return user data
    const userResponse = {
      id: user._id,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      authProvider: user.authProvider,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    res.status(200).json({
      success: true,
      message: 'OAuth login successful',
      user: userResponse,
      accessToken
    });

  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user profile
export const GetProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT middleware

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Refresh token
export const RefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      accessToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Check if email is authorized
export const CheckEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('CheckEmail - Email processing:', {
      originalEmail: email,
      normalizedEmail: normalizedEmail
    });

    const roleDoc = await Role.findOne({ email: normalizedEmail });
    console.log('CheckEmail - Role search result:', {
      searchEmail: normalizedEmail,
      roleFound: !!roleDoc,
      roleDoc: roleDoc
    });

    // Log all roles for comparison
    const allRoles = await Role.find({});
    console.log('CheckEmail - All roles:', allRoles.map(r => ({
      email: r.email,
      role: r.role
    })));

    if (roleDoc) {
      res.status(200).json({
        success: true,
        authorized: true,
        role: roleDoc.role
      });
    } else {
      res.status(200).json({
        success: true,
        authorized: false
      });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all users for attendance management
export const GetUsers = async (req, res) => {
  try {
    // Get all users with basic information needed for attendance
    const users = await User.find({}, {
      _id: 1,
      email: 1,
      displayName: 1,
      photoURL: 1,
      role: 1,
      createdAt: 1
    }).sort({ displayName: 1 });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      users: users
    });

  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};