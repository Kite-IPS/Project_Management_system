import express from 'express';
import {
  getAttendance,
  getAttendanceByDate,
  createOrUpdateAttendance,
  bulkCreateAttendance,
  deleteAttendance,
  getAttendanceSummary
} from '../Controllers/attendanceController.js';
import { authenticateToken } from '../Middleware/authMiddleware.js';
import { body, param, query, validationResult } from 'express-validator';

const attendanceRouter = express.Router();

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
const attendanceValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('status')
    .isIn(['Present', 'Absent'])
    .withMessage('Status must be Present or Absent'),
  body('dailyTask')
    .isLength({ min: 1, max: 500 })
    .withMessage('Daily task is required and must be less than 500 characters'),
  body('taskStatus')
    .isIn(['Not Started', 'In Progress', 'Completed', 'Blocked'])
    .withMessage('Task status must be one of: Not Started, In Progress, Completed, Blocked'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

const bulkAttendanceValidation = [
  body('attendanceRecords')
    .isArray({ min: 1 })
    .withMessage('attendanceRecords must be a non-empty array'),
  body('attendanceRecords.*.userId')
    .isMongoId()
    .withMessage('Valid user ID is required for each record'),
  body('attendanceRecords.*.date')
    .isISO8601()
    .withMessage('Valid date is required for each record'),
  body('attendanceRecords.*.status')
    .isIn(['Present', 'Absent'])
    .withMessage('Status must be Present or Absent for each record'),
  body('attendanceRecords.*.dailyTask')
    .isLength({ min: 1, max: 500 })
    .withMessage('Daily task is required and must be less than 500 characters for each record'),
  body('attendanceRecords.*.taskStatus')
    .isIn(['Not Started', 'In Progress', 'Completed', 'Blocked'])
    .withMessage('Task status must be valid for each record'),
  body('attendanceRecords.*.notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters for each record')
];

// Apply authentication to all routes
attendanceRouter.use(authenticateToken);

// Get all attendance records with optional filters
attendanceRouter.get('/',
  [
    query('date').optional().isISO8601().withMessage('Invalid date format'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  getAttendance
);

// Get attendance for a specific date
attendanceRouter.get('/date/:date',
  [
    param('date').isISO8601().withMessage('Invalid date format')
  ],
  handleValidationErrors,
  getAttendanceByDate
);

// Create or update attendance record
attendanceRouter.post('/',
  attendanceValidation,
  handleValidationErrors,
  createOrUpdateAttendance
);

// Bulk create/update attendance records
attendanceRouter.post('/bulk',
  bulkAttendanceValidation,
  handleValidationErrors,
  bulkCreateAttendance
);

// Delete attendance record
attendanceRouter.delete('/:id',
  [
    param('id').isMongoId().withMessage('Valid attendance ID is required')
  ],
  handleValidationErrors,
  deleteAttendance
);

// Get attendance summary for date range
attendanceRouter.get('/summary',
  [
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required')
  ],
  handleValidationErrors,
  getAttendanceSummary
);

export default attendanceRouter;