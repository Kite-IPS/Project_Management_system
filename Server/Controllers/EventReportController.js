import EventReport from '../Models/EventModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(1) + ' MB';
};

// @desc    Get all event reports
// @route   GET /api/event-reports
// @access  Public
export const getAllEventReports = async (req, res) => {
  try {
    const eventReports = await EventReport.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: eventReports.length,
      data: eventReports
    });
  } catch (error) {
    console.error('Error fetching event reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event reports',
      error: error.message
    });
  }
};

// @desc    Get single event report
// @route   GET /api/event-reports/:id
// @access  Public
export const getEventReport = async (req, res) => {
  try {
    const eventReport = await EventReport.findById(req.params.id);

    if (!eventReport) {
      return res.status(404).json({
        success: false,
        message: 'Event report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: eventReport
    });
  } catch (error) {
    console.error('Error fetching event report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event report',
      error: error.message
    });
  }
};

// @desc    Create new event report
// @route   POST /api/event-reports
// @access  Public
export const createEventReport = async (req, res) => {
  try {
    const { name, dateUpdated, createdBy } = req.body;

    // Validate required fields
    if (!name || !dateUpdated || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, dateUpdated, and createdBy fields'
      });
    }

    // Prepare event report data
    const eventReportData = {
      name: name.trim(),
      dateUpdated: new Date(dateUpdated),
      createdBy: createdBy.trim()
    };

    // Handle file upload if present
    if (req.file) {
      eventReportData.eventWork = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: formatFileSize(req.file.size),
        path: req.file.path
      };
    }

    const eventReport = await EventReport.create(eventReportData);

    res.status(201).json({
      success: true,
      message: 'Event report created successfully',
      data: eventReport
    });
  } catch (error) {
    console.error('Error creating event report:', error);
    
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating event report',
      error: error.message
    });
  }
};

// @desc    Update event report
// @route   PUT /api/event-reports/:id
// @access  Public
export const updateEventReport = async (req, res) => {
  try {
    const { name, dateUpdated, createdBy } = req.body;

    // Find existing event report
    const existingReport = await EventReport.findById(req.params.id);
    if (!existingReport) {
      // Delete uploaded file if report doesn't exist
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Event report not found'
      });
    }

    // Prepare update data
    const updateData = {
      name: name?.trim() || existingReport.name,
      dateUpdated: dateUpdated ? new Date(dateUpdated) : existingReport.dateUpdated,
      createdBy: createdBy?.trim() || existingReport.createdBy
    };

    // Handle file upload if present
    if (req.file) {
      // Delete old file if exists
      if (existingReport.eventWork?.path) {
        fs.unlink(existingReport.eventWork.path, (err) => {
          if (err) console.error('Error deleting old file:', err);
        });
      }

      updateData.eventWork = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: formatFileSize(req.file.size),
        path: req.file.path
      };
    }

    const eventReport = await EventReport.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Event report updated successfully',
      data: eventReport
    });
  } catch (error) {
    console.error('Error updating event report:', error);
    
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating event report',
      error: error.message
    });
  }
};

// @desc    Delete event report
// @route   DELETE /api/event-reports/:id
// @access  Public
export const deleteEventReport = async (req, res) => {
  try {
    const eventReport = await EventReport.findById(req.params.id);

    if (!eventReport) {
      return res.status(404).json({
        success: false,
        message: 'Event report not found'
      });
    }

    // Delete associated file if exists
    if (eventReport.eventWork?.path) {
      fs.unlink(eventReport.eventWork.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    await EventReport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event report',
      error: error.message
    });
  }
};

// @desc    Download event report file
// @route   GET /api/event-reports/download/:filename
// @access  Public
export const downloadEventReportFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Find the event report with this filename
    const eventReport = await EventReport.findOne({
      'eventWork.filename': filename
    });

    if (!eventReport || !eventReport.eventWork?.path) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = eventReport.eventWork.path;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${eventReport.eventWork.originalName}"`);
    res.setHeader('Content-Type', eventReport.eventWork.mimetype || 'application/octet-stream');

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file',
      error: error.message
    });
  }
};