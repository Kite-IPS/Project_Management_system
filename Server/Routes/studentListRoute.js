import express from 'express';
import {
  getAllStudents,
  addMember,
  removeMember,
  updateMemberRole
} from '../Controllers/studentListController.js';
import { authenticateToken } from '../Middleware/authMiddleware.js';
import { body, validationResult } from 'express-validator';

const studentListRoute = express.Router();

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

// Validation rules for adding member
const addMemberValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('batch')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Please provide a valid batch year'),
  body('role')
    .isIn(['Admin', 'Member', 'SPOC'])
    .withMessage('Role must be Admin, Member, or SPOC')
];

// Validation for role update
const roleUpdateValidation = [
  body('role')
    .isIn(['Admin', 'Member', 'SPOC'])
    .withMessage('Role must be Admin, Member, or SPOC')
];

// Student/Member routes (temporarily without authentication for testing)
studentListRoute.get('/', getAllStudents);
studentListRoute.post('/add', addMemberValidation, handleValidationErrors, addMember);
studentListRoute.delete('/remove/:email', removeMember);
studentListRoute.put('/role/:email', roleUpdateValidation, handleValidationErrors, updateMemberRole);

export default studentListRoute;