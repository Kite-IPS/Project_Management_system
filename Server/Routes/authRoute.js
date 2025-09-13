import express from 'express';
import { 
  Login, 
  Register, 
  OAuthLogin, 
  GetProfile, 
  RefreshToken 
} from '../Controllers/authController.js';
import { authenticateToken } from '../Middleware/authMiddleware.js';
import { body, validationResult } from 'express-validator';

const authRouter = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
];

const oauthValidation = [
  body('uid')
    .notEmpty()
    .withMessage('User ID is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('authProvider')
    .optional()
    .isIn(['google', 'facebook', 'github'])
    .withMessage('Invalid auth provider')
];

// Auth routes
authRouter.post('/login', loginValidation, handleValidationErrors, Login);
authRouter.post('/register', registerValidation, handleValidationErrors, Register);
authRouter.post('/oauth', oauthValidation, handleValidationErrors, OAuthLogin);

// Protected routes
authRouter.get('/profile', authenticateToken, GetProfile);
authRouter.post('/refresh-token', RefreshToken);

// Logout route (optional - mainly for clearing server-side sessions if you implement them)
authRouter.post('/logout', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default authRouter;