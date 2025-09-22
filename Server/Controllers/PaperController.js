import Paper from '../Models/PaperModel.js';
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

// @desc    Get all papers
// @route   GET /api/papers
// @access  Public
export const getAllPapers = async (req, res) => {
  try {
    const papers = await Paper.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: papers.length,
      data: papers
    });
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching papers',
      error: error.message
    });
  }
};

// @desc    Get single paper
// @route   GET /api/papers/:id
// @access  Public
export const getPaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    res.status(200).json({
      success: true,
      data: paper
    });
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching paper',
      error: error.message
    });
  }
};

// @desc    Create new paper
// @route   POST /api/papers
// @access  Public
export const createPaper = async (req, res) => {
  try {
    const { name, dateUpdate, assignee } = req.body;

    // Validate required fields
    if (!name || !dateUpdate || !assignee) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, dateUpdate, and assignee fields'
      });
    }

    // Prepare paper data
    const paperData = {
      name: name.trim(),
      dateUpdate: new Date(dateUpdate),
      assignee: assignee.trim()
    };

    // Handle file upload if present
    if (req.file) {
      paperData.paperWork = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: formatFileSize(req.file.size),
        path: req.file.path
      };
    }

    const paper = await Paper.create(paperData);

    res.status(201).json({
      success: true,
      message: 'Paper created successfully',
      data: paper
    });
  } catch (error) {
    console.error('Error creating paper:', error);
    
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating paper',
      error: error.message
    });
  }
};

// @desc    Update paper
// @route   PUT /api/papers/:id
// @access  Public
export const updatePaper = async (req, res) => {
  try {
    const { name, dateUpdate, assignee } = req.body;

    // Find existing paper
    const existingPaper = await Paper.findById(req.params.id);
    if (!existingPaper) {
      // Delete uploaded file if paper doesn't exist
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // Prepare update data
    const updateData = {
      name: name?.trim() || existingPaper.name,
      dateUpdate: dateUpdate ? new Date(dateUpdate) : existingPaper.dateUpdate,
      assignee: assignee?.trim() || existingPaper.assignee
    };

    // Handle file upload if present
    if (req.file) {
      // Delete old file if exists
      if (existingPaper.paperWork?.path) {
        fs.unlink(existingPaper.paperWork.path, (err) => {
          if (err) console.error('Error deleting old file:', err);
        });
      }

      updateData.paperWork = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: formatFileSize(req.file.size),
        path: req.file.path
      };
    }

    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Paper updated successfully',
      data: paper
    });
  } catch (error) {
    console.error('Error updating paper:', error);
    
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating paper',
      error: error.message
    });
  }
};

// @desc    Delete paper
// @route   DELETE /api/papers/:id
// @access  Public
export const deletePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // Delete associated file if exists
    if (paper.paperWork?.path) {
      fs.unlink(paper.paperWork.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    await Paper.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Paper deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting paper:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting paper',
      error: error.message
    });
  }
};

// @desc    Download paper file
// @route   GET /api/papers/download/:filename
// @access  Public
export const downloadPaperFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Find the paper with this filename
    const paper = await Paper.findOne({
      'paperWork.filename': filename
    });

    if (!paper || !paper.paperWork?.path) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = paper.paperWork.path;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${paper.paperWork.originalName}"`);
    res.setHeader('Content-Type', paper.paperWork.mimetype || 'application/octet-stream');

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