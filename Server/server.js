import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import authRouter from './Routes/authRoute.js';
import attendanceRouter from './Routes/attendanceRoute.js';
import studentListRouter from './Routes/studentListRoute.js';
import blogRouter from './Routes/blogRoute.js';
import meetingRouter from './Routes/meetingRoute.js';
import activityRouter from './Routes/activityRoute.js';
import projectRouter from './Routes/projectRoute.js';
import eventReportRouter from './Routes/eventReportRoute.js';
import paperRouter from './Routes/PaperRoute.js'; // Add this line

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// --- Middleware Configuration ---

// 1. CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://ipstech-management.netlify.app'
    : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// 2. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Fix CORS policy issue
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:5173", "https://ipstech-management.netlify.app", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// 3. Rate Limiting with different limits for different routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes for auth routes
  message: {
    success: false,
    message: 'Too many authentication requests, please try again later.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for other routes
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// Apply stricter rate limiting to auth routes
app.use('/api/auth/', authLimiter);

// Apply standard rate limiting to other API routes
app.use('/api/', apiLimiter);

// 4. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// --- Database Connection ---
let retryCount = 0;
const maxRetries = 5;
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log('MongoDB already connected');
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 60000,  // 60s for server selection
      socketTimeoutMS: 60000,  // 60s for socket operations
      connectTimeoutMS: 60000,  // 60s for initial connect
      bufferMaxEntries: 0,  // Disable buffering for serverless
      bufferCommands: false,  // No query queueing—fail fast if no connect
      maxPoolSize: 10,  // Balanced pool
      retryWrites: true,
      w: 'majority',
      family: 4  // IPv4 only for speed
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    retryCount = 0;
  } catch (error) {
    retryCount++;
    const delay = Math.pow(2, retryCount) * 1000;  // Exponential backoff
    console.error(`DB Connect Error (Attempt ${retryCount}):`, error.message);
    if (retryCount < maxRetries) {
      console.log(`Retrying in ${delay/1000}s...`);
      setTimeout(connectDB, delay);
    } else {
      console.error('Max retries reached - DB connection failed');
      throw error;
    }
  }
};

// Await initial connection (blocks startup until ready)
await connectDB();

// Unhandled rejection handler (logs without crashing in serverless)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit—let Vercel retry the function
});

// Request middleware (await connect if not ready per request)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log('Request - DB not ready, awaiting connect...');
    await connectDB();
  }
  next();
});

// --- Static File Serving ---
app.use('/uploads', express.static('uploads'));

// --- Routes ---
app.use('/api/auth', authRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/students', studentListRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/meetings', meetingRouter);
app.use('/api/activities', activityRouter);
app.use('/api/projects', projectRouter);
app.use('/api/event-reports', eventReportRouter);
app.use('/api/papers', paperRouter); // Add this line

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Project Management API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      eventReports: '/api/event-reports',
      papers: '/api/papers', // Add this line
      health: '/api/health'
    }
  });
});

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// --- Vercel Serverless Export ---
// Added: Export app for serverless (replaces listen/shutdown below)
// Removed: app.listen