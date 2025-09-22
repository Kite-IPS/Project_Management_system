import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllPapers,
  getPaper,
  createPaper,
  updatePaper,
  deletePaper,
  downloadPaperFile
} from '../Controllers/PaperController.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/papers';
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
    cb(null, 'paper-' + uniqueSuffix + extension);
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

// @route   GET /api/papers
// @desc    Get all papers
// @access  Public
router.get('/', getAllPapers);

// @route   GET /api/papers/download/:filename
// @desc    Download paper file
// @access  Public
router.get('/download/:filename', downloadPaperFile);

// @route   GET /api/papers/:id
// @desc    Get single paper
// @access  Public
router.get('/:id', getPaper);

// @route   POST /api/papers
// @desc    Create new paper
// @access  Public
router.post('/', upload.single('paperWork'), createPaper);

// @route   PUT /api/papers/:id
// @desc    Update paper
// @access  Public
router.put('/:id', upload.single('paperWork'), updatePaper);

// @route   DELETE /api/papers/:id
// @desc    Delete paper
// @access  Public
router.delete('/:id', deletePaper);

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