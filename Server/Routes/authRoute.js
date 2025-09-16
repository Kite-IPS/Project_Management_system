import express from 'express';
import { 
  Login, 
  OAuthLogin, 
  GetProfile, 
  RefreshToken,
  CheckEmail,
  GetUsers 
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

const oauthValidation = [
  body('uid')
    .notEmpty()
    .withMessage('User ID is required'),
  body('email')
    .isEmail()
    .trim()
    .normalizeEmail({ gmail_remove_dots: false })  // Preserve dots in Gmail addresses
    .withMessage('Please provide a valid email'),
  body('authProvider')
    .optional()
    .isIn(['google', 'facebook', 'github'])
    .withMessage('Invalid auth provider')
];

// Auth routes
authRouter.post('/login', loginValidation, handleValidationErrors, Login);
authRouter.post('/oauth', oauthValidation, handleValidationErrors, OAuthLogin);
authRouter.post('/check-email', CheckEmail);

// Protected routes
authRouter.get('/profile', authenticateToken, GetProfile);
authRouter.post('/refresh-token', RefreshToken);
authRouter.get('/users', authenticateToken, GetUsers);

// Logout route (optional - mainly for clearing server-side sessions if you implement them)
authRouter.post('/logout', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default authRouter;