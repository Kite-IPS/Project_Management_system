import Meeting from '../Models/MeetingModel.js';
import Role from '../Models/RoleModel.js';
import { createActivity } from './activityController.js';
import mongoose from 'mongoose';  // Added: For readyState check
import fs from 'fs';  // Added: For fs ops
import path from 'path';  // Added: For path.join
import os from 'os';  // Added: For /tmp in serverless

// Helper to await DB connection (up to 10s)
const awaitDBConnect = async () => {
  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 10) {
    console.log('MeetingController - Waiting for DB connect...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  if (mongoose.connection.readyState !== 1) {
    throw new Error('DB not ready after wait');
  }
};

// Helper for uploads dir in /tmp (Vercel writable)
const getUploadsDir = () => path.join(os.tmpdir(), 'uploads', 'meetings');

// Get all meetings with pagination and filtering
const getAllMeetings = async (req, res) => {
  try {
    await awaitDBConnect();  // Wait for connection

    const {
      page = 1,
      limit = 10,
      search = '',
      filter = 'all',
      author = '',
      sortBy = 'datePublished',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by date
    if (filter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.datePublished = { $gte: sevenDaysAgo };
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Only show published blogs (optional filter)
    query.isPublished = true;

    // Sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const meetings = await Meeting.find(query)
      .populate('author', 'name email role batch') // Populate author with selected fields
      .populate('participants', 'name email role batch') // Populate participants
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalMeetings = await Meeting.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalMeetings / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      message: 'Meetings retrieved successfully',
      data: meetings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalMeetings,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
      error: error.message
    });
  }
};

// Get single meeting by ID
const getMeetingById = async (req, res) => {
  try {
    await awaitDBConnect();  // Wait for connection

    const { id } = req.params;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Increment views
    meeting.views += 1;
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting retrieved successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting',
      error: error.message
    });
  }
};

// Create new meeting
const createMeeting = async (req, res) => {
  try {
    await awaitDBConnect();  // Wait for connection

    const { title, content, author, participants, datePublished, tags } = req.body;

    // Parse participants if it's a string (from FormData)
    let parsedParticipants = participants;
    if (typeof participants === 'string') {
      try {
        parsedParticipants = JSON.parse(participants);
      } catch (e) {
        parsedParticipants = [];
      }
    }

    // Validate required fields
    if (!title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and author are required'
      });
    }

    // Verify author exists in Role collection
    const authorExists = await Role.findById(author);
    if (!authorExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID. Author must exist in the system.'
      });
    }

    // Verify participants exist in Role collection (if provided)
    if (parsedParticipants && parsedParticipants.length > 0) {
      const participantExists = await Role.find({ _id: { $in: parsedParticipants } });
      if (participantExists.length !== parsedParticipants.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid participant IDs. All participants must exist in the system.'
        });
      }
    }

    // Process uploaded files (use /tmp for Vercel)
    let files = [];
    if (req.files && req.files.length > 0) {
      const uploadsDir = getUploadsDir();
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      files = req.files.map(file => {
        const newPath = path.join(uploadsDir, file.filename);
        fs.renameSync(file.path, newPath);  // Move to /tmp subdir
        return {
          filename: file.filename,
          originalName: file.originalname,
          url: `/api/uploads/meetings/${file.filename}`,  // Relative for serving
          size: file.size,
          mimeType: file.mimetype
        };
      });
    }

    // Create new meeting
    const newMeeting = new Meeting({
      title: title.trim(),
      content: content.trim(),
      author,
      participants: parsedParticipants || [],
      datePublished: datePublished || new Date(),
      files: files,
      tags: tags || []
    });

    const savedMeeting = await newMeeting.save();

    // Log activity
    await createActivity(
      author,
      'created',
      'meeting',
      savedMeeting._id,
      title.trim(),
      `Created meeting notes: "${title.trim()}"`
    );

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: savedMeeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message
    });
  }
};

// Update existing meeting
const updateMeeting = async (req, res) => {
  try {
    await awaitDBConnect();  // Wait for connection

    const { id } = req.params;
    const { title, content, author, participants, datePublished, existingFiles, tags, isPublished } = req.body;

    // Parse participants if it's a string (from FormData)
    let parsedParticipants = participants;
    if (typeof participants === 'string') {
      try {
        parsedParticipants = JSON.parse(participants);
      } catch (e) {
        parsedParticipants = undefined; // Keep existing if parsing fails
      }
    }

    // Check if meeting exists
    const existingMeeting = await Meeting.findById(id);
    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // If author is being updated, verify it exists
    if (author && author !== existingMeeting.author.toString()) {
      const authorExists = await Role.findById(author);
      if (!authorExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid author ID. Author must exist in the system.'
        });
      }
    }

    // If participants are being updated, verify they exist
    if (parsedParticipants) {
      const participantExists = await Role.find({ _id: { $in: parsedParticipants } });
      if (participantExists.length !== parsedParticipants.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid participant IDs. All participants must exist in the system.'
        });
      }
    }

    // Handle files: combine existing files with new uploads (use /tmp)
    let files = [];
    let parsedExistingFiles = existingFiles;
    if (typeof existingFiles === 'string') {
      try {
        parsedExistingFiles = JSON.parse(existingFiles);
      } catch (e) {
        parsedExistingFiles = [];
      }
    }
    if (parsedExistingFiles && Array.isArray(parsedExistingFiles)) {
      files = parsedExistingFiles; // Keep existing files
    }

    // Add new uploaded files
    if (req.files && req.files.length > 0) {
      const uploadsDir = getUploadsDir();
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const newFiles = req.files.map(file => {
        const newPath = path.join(uploadsDir, file.filename);
        fs.renameSync(file.path, newPath);  // Move to /tmp subdir
        return {
          filename: file.filename,
          originalName: file.originalname,
          url: `/api/uploads/meetings/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype
        };
      });
      files = [...files, ...newFiles];
    }

    // Update meeting
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(author && { author }),
        ...(parsedParticipants && { participants: parsedParticipants }),
        ...(datePublished && { datePublished }),
        ...(files && { files }),
        ...(tags && { tags }),
        ...(isPublished !== undefined && { isPublished })
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Log activity
    const userId = req.user ? req.user._id : updatedMeeting.author; // Use authenticated user or meeting author
    await createActivity(
      userId,
      'updated',
      'meeting',
      id,
      updatedMeeting.title,
      `Updated meeting notes: "${updatedMeeting.title}"`
    );

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting
    });
  } catch (error) {
    console.error('Error updating meeting:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    await awaitDBConnect();  // Wait for connection

    const { id } = req.params;

    const deletedMeeting = await Meeting.findByIdAndDelete(id);

    if (!deletedMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Log activity before deletion
    const userId = req.user ? req.user._id : deletedMeeting.author; // Use authenticated user or meeting author
    await createActivity(
      userId,
      'deleted',
      'meeting',
      id,
      deletedMeeting.title,
      `Deleted meeting notes: "${deletedMeeting.title}"`
    );

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully',
      data: deletedMeeting
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting',
      error: error.message
    });
  }
};

// Get authors (from Role collection) for dropdown
const getAuthors = async (req, res) => {
  try {
    await awaitDBConnect();  // Wait for connection

    const authors = await Role.find({}, 'name email role batch').sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Authors retrieved successfully',
      data: authors
    });
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch authors',
      error: error.message
    });
  }
};

// Get meeting statistics
const getMeetingStats = async (req, res) => {
  try {
    await awaitDBConnect();  // Wait for connection

    const totalMeetings = await Meeting.countDocuments({ isPublished: true });

    // Meetings published this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthMeetings = await Meeting.countDocuments({
      isPublished: true,
      datePublished: { $gte: thisMonth }
    });

    // Total authors (unique)
    const authorsCount = await Meeting.distinct('author').then(authors => authors.length);

    // Total views
    const totalViews = await Meeting.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Meeting statistics retrieved successfully',
      data: {
        totalMeetings,
        thisMonthMeetings,
        authorsCount,
        totalViews: totalViews[0]?.totalViews || 0
      }
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog statistics',
      error: error.message
    });
  }
};

export {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getAuthors,
  getMeetingStats
};