import Attendance from '../Models/AttendanceModel.js';
import User from '../Models/UserModel.js';

// Get all attendance records with optional date filter
export const getAttendance = async (req, res) => {
  try {
    const { date, userId, page = 1, limit = 50 } = req.query;

    let query = {};

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Filter by user if provided
    if (userId) {
      query.user = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .populate('user', 'displayName email')
      .populate('markedBy', 'displayName')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

// Get attendance for a specific date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const attendance = await Attendance.getAttendanceByDate(date);

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

// Create or update attendance record
export const createOrUpdateAttendance = async (req, res) => {
  try {
    const { userId, date, status, dailyTask, taskStatus, notes } = req.body;

    // Validate required fields
    if (!userId || !date || !status || !dailyTask || !taskStatus) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, date, status, dailyTask, taskStatus'
      });
    }

    // Validate status and taskStatus enums
    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Present or Absent'
      });
    }

    if (!['Not Started', 'In Progress', 'Completed', 'Blocked'].includes(taskStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Task status must be one of: Not Started, In Progress, Completed, Blocked'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Parse date and set to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Find existing attendance record or create new one
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: attendanceDate
    });

    const attendanceData = {
      user: userId,
      userName: user.displayName,
      userEmail: user.email,
      date: attendanceDate,
      status,
      dailyTask,
      taskStatus,
      notes: notes || '',
      markedBy: req.user.userId // Use correct property from auth middleware
    };

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        attendanceData,
        { new: true, runValidators: true }
      ).populate('user', 'displayName email').populate('markedBy', 'displayName');
    } else {
      // Create new record
      attendance = await Attendance.create(attendanceData);
      attendance = await Attendance.findById(attendance._id)
        .populate('user', 'displayName email')
        .populate('markedBy', 'displayName');
    }

    res.status(200).json({
      success: true,
      data: attendance,
      message: existingAttendance ? 'Attendance updated successfully' : 'Attendance created successfully'
    });
  } catch (error) {
    console.error('Error creating/updating attendance:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record already exists for this user on this date'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating/updating attendance record',
      error: error.message
    });
  }
};

// Bulk create/update attendance records
export const bulkCreateAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'attendanceRecords must be a non-empty array'
      });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      try {
        const { userId, date, status, dailyTask, taskStatus, notes } = record;

        // Validate required fields
        if (!userId || !date || !status || !dailyTask || !taskStatus) {
          errors.push({
            record,
            error: 'Missing required fields: userId, date, status, dailyTask, taskStatus'
          });
          continue;
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
          errors.push({
            record,
            error: 'User not found'
          });
          continue;
        }

        // Parse date and set to start of day
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Find existing attendance record or create new one
        const existingAttendance = await Attendance.findOne({
          user: userId,
          date: attendanceDate
        });

        const attendanceData = {
          user: userId,
          date: attendanceDate,
          status,
          dailyTask,
          taskStatus,
          notes: notes || '',
          markedBy: req.user.id
        };

        let attendance;
        if (existingAttendance) {
          attendance = await Attendance.findByIdAndUpdate(
            existingAttendance._id,
            attendanceData,
            { new: true, runValidators: true }
          );
        } else {
          attendance = await Attendance.create(attendanceData);
        }

        results.push(attendance);
      } catch (recordError) {
        errors.push({
          record,
          error: recordError.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Processed ${results.length} successful and ${errors.length} failed records`
    });
  } catch (error) {
    console.error('Error in bulk attendance creation:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk attendance records',
      error: error.message
    });
  }
};

// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record',
      error: error.message
    });
  }
};

// Get attendance summary
export const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate parameters are required'
      });
    }

    const summary = await Attendance.getAttendanceSummary(startDate, endDate);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    });
  }
};