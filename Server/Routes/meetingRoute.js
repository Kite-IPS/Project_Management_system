import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getAuthors,
  getMeetingStats
} from '../Controllers/meetingController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/meetings/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'meeting-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Public routes (no authentication required for reading meetings)
router.get('/', getAllMeetings);
router.get('/stats', getMeetingStats);
router.get('/authors', getAuthors);
router.get('/:id', getMeetingById);

// Protected routes (authentication required for creating/editing meetings)
// Note: Add authentication middleware here when implementing auth
router.post('/', upload.array('files', 5), createMeeting); // Allow up to 5 files
router.put('/:id', upload.array('files', 5), updateMeeting); // Allow up to 5 files
router.delete('/:id', deleteMeeting);

export default router;