import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';  // Added: For /tmp in serverless
import {
  getAllEventReports,
  getEventReport,
  createEventReport,
  updateEventReport,
  deleteEventReport,
  downloadEventReportFile
} from '../Controllers/EventReportController.js';

const router = express.Router();

// Create uploads directory in /tmp if it doesn't exist (Vercel writable dir)
const uploadsDir = path.join(os.tmpdir(), 'uploads', 'event-reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'event-report-' + uniqueSuffix + extension);
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes

// @route   GET /api/event-reports
// @desc    Get all event reports
// @access  Public
router.get('/', getAllEventReports);

// @route   GET /api/event-reports/download/:filename
// @desc    Download event report file
// @access  Public
router.get('/download/:filename', downloadEventReportFile);

// @route   GET /api/event-reports/:id
// @desc    Get single event report
// @access  Public
router.get('/:id', getEventReport);

// @route   POST /api/event-reports
// @desc    Create new event report
// @access  Public
router.post('/', upload.single('eventWork'), createEventReport);

// @route   PUT /api/event-reports/:id
// @desc    Update event report
// @access  Public
router.put('/:id', upload.single('eventWork'), updateEventReport);

// @route   DELETE /api/event-reports/:id
// @desc    Delete event report
// @access  Public
router.delete('/:id', deleteEventReport);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

export default router;