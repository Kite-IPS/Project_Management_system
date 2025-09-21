import Project from '../Models/ProjectModel.js';
import User from '../Models/UserModel.js';
import mongoose from 'mongoose';

// Helper function to get user access level for a project
const getUserAccessLevel = async (userId, userRole, project) => {
  if (userRole === 'admin') return 'admin';
  if (userRole === 'moderator') return 'moderator';
  
  // Check if user is assigned to the project or created it
  const isAssigned = project.assignees.some(assignee => 
    assignee.userId.toString() === userId.toString()
  );
  const isCreator = project.createdBy.toString() === userId.toString();
  
  if (isAssigned || isCreator) return 'member';
  return 'none';
};

// Helper function to build project query based on user role
const buildProjectQuery = (userId, userRole, filters = {}) => {
  let baseQuery = { isArchived: false, ...filters };
  
  // If not admin, only show projects where user is assigned or created
  if (userRole !== 'admin') {
    baseQuery.$or = [
      { createdBy: userId },
      { 'assignees.userId': userId }
    ];
  }
  
  return baseQuery;
};

// @desc    Get all projects with statistics
// @route   GET /api/projects
// @access  Private (Admin: all projects, Moderator/Member: assigned projects only)
export const getProjects = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const {
      status,
      priority,
      assignee,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filters
    const filters = {};
    if (status && status !== 'all') {
      if (status === 'overdue') {
        filters.status = { $ne: 'Done' };
        filters.dueDate = { $lt: new Date() };
      } else {
        filters.status = status;
      }
    }
    if (priority && priority !== 'all') filters.priority = priority;
    if (assignee) filters['assignees.userId'] = assignee;
    
    // Build search query
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build base query with user access control
    const query = buildProjectQuery(userId, role, filters);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get projects with pagination
    const [projects, totalProjects, statistics] = await Promise.all([
      Project.find(query)
        .populate('assignees.userId', 'displayName email')
        .populate('createdBy', 'displayName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Project.countDocuments(query),
      Project.getStatistics(userId, role)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProjects / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        projects,
        statistics: {
          total: statistics.total,
          ongoing: statistics.inProgress,
          pending: statistics.toDo,
          completed: statistics.done,
          review: statistics.review,
          overdue: statistics.overdue
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProjects,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (Admin: any project, Moderator/Member: assigned projects only)
export const getProject = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id)
      .populate('assignees.userId', 'displayName email avatar')
      .populate('createdBy', 'displayName email')
      .populate('comments.user', 'displayName email avatar')
      .populate('activities.user', 'displayName email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access level
    const accessLevel = await getUserAccessLevel(userId, role, project);
    if (accessLevel === 'none') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        project,
        accessLevel
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin and Moderator only)
export const createProject = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Check permissions
    if (!['admin', 'moderator'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can create projects'
      });
    }

    const {
      title,
      description,
      assignees,
      startDate,
      dueDate,
      status = 'To Do',
      priority = 'Medium',
      paperwork,
      projectTrack,
      repoLink,
      milestones = [],
      risks = []
    } = req.body;

    // Validate required fields
    if (!title || !description || !assignees || assignees.length === 0 || !startDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, assignees, startDate, dueDate'
      });
    }

    // Validate assignees exist
    const assigneeUsers = await User.find({
      _id: { $in: assignees }
    }).select('displayName email avatar');

    if (assigneeUsers.length !== assignees.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more assignees not found'
      });
    }

    // Format assignees with user info
    const formattedAssignees = assigneeUsers.map(user => ({
      userId: user._id,
      name: user.displayName,
      email: user.email,
      avatar: user.avatar || user.displayName?.charAt(0) || 'U',
      color: `bg-${['blue', 'green', 'purple', 'pink', 'indigo', 'yellow', 'red', 'teal', 'orange', 'cyan'][Math.floor(Math.random() * 10)]}-500`
    }));

    // Create project
    const project = await Project.create({
      title,
      description,
      assignees: formattedAssignees,
      startDate,
      dueDate,
      status,
      priority,
      paperwork,
      projectTrack,
      repoLink,
      milestones,
      risks,
      createdBy: userId
    });

    // Add creation activity
    project.addActivity('status_change', { userId, displayName: req.user.displayName }, `created the project`);
    await project.save();

    // Populate the response
    await project.populate('assignees.userId', 'displayName email');
    await project.populate('createdBy', 'displayName email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Create project error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin: any project, Moderator: assigned projects only)
export const updateProject = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions
    const accessLevel = await getUserAccessLevel(userId, role, project);
    if (!['admin', 'moderator'].includes(accessLevel)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update this project'
      });
    }

    const {
      title,
      description,
      assignees,
      startDate,
      dueDate,
      status,
      priority,
      progress,
      paperwork,
      projectTrack,
      repoLink,
      milestones,
      risks
    } = req.body;

    // Track status changes for activity log
    const oldStatus = project.status;
    const statusChanged = status && status !== oldStatus;

    // Handle assignees update
    if (assignees && Array.isArray(assignees)) {
      const assigneeUsers = await User.find({
        _id: { $in: assignees }
      }).select('displayName email avatar');

      project.assignees = assigneeUsers.map(user => ({
        userId: user._id,
        name: user.displayName,
        email: user.email,
        avatar: user.avatar || user.displayName?.charAt(0) || 'U',
        color: `bg-${['blue', 'green', 'purple', 'pink', 'indigo', 'yellow', 'red', 'teal', 'orange', 'cyan'][Math.floor(Math.random() * 10)]}-500`
      }));
    }

    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (startDate) project.startDate = startDate;
    if (dueDate) project.dueDate = dueDate;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (progress !== undefined) project.progress = progress;
    if (paperwork !== undefined) project.paperwork = paperwork;
    if (projectTrack !== undefined) project.projectTrack = projectTrack;
    if (repoLink !== undefined) project.repoLink = repoLink;
    if (milestones) project.milestones = milestones;
    if (risks) project.risks = risks;

    project.updatedBy = userId;

    // Add activity for status change
    if (statusChanged) {
      project.addActivity(
        'status_change',
        { userId, displayName: req.user.displayName },
        `changed status from ${oldStatus} to ${status}`
      );
    }

    await project.save();

    // Populate the response
    await project.populate('assignees.userId', 'displayName email');
    await project.populate('createdBy', 'displayName email');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Update project error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
export const deleteProject = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    // Only admins can delete projects
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete projects'
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await Project.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add comment to project
// @route   POST /api/projects/:id/comments
// @access  Private (All authenticated users with project access)
export const addComment = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment message is required'
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access level
    const accessLevel = await getUserAccessLevel(userId, role, project);
    if (accessLevel === 'none') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Add comment
    project.addComment({
      userId,
      displayName: req.user.displayName,
      avatar: req.user.avatar,
      color: req.user.color
    }, message);

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: { 
        comment: project.comments[0] // Return the newly added comment
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Updated getTeamMembers function in ProjectController.js
// @desc    Get team members for project assignment
// @route   GET /api/projects/team-members
// @access  Private (All authenticated users - needed for creating/editing projects)
export const getTeamMembers = async (req, res) => {
  try {
    const { role } = req.user;

    // Allow all authenticated users to see team members when creating/editing projects
    // but limit the data based on role
    let selectFields = 'displayName email role';
    
    // If user is admin, they can see more details
    if (role === 'admin') {
      selectFields += ' photoURL lastLoginAt createdAt';
    }

    const teamMembers = await User.find({ 
      isActive: { $ne: false } // Include users where isActive is not explicitly false
    }).select(selectFields).lean();

    // Format team members
    const formattedMembers = teamMembers.map((member, index) => ({
      id: member._id,
      name: member.displayName || member.email,
      email: member.email,
      avatar: member.photoURL || member.displayName?.charAt(0) || member.email?.charAt(0) || 'U',
      color: `bg-${['blue', 'green', 'purple', 'pink', 'indigo', 'yellow', 'red', 'teal', 'orange', 'cyan'][index % 10]}-500`,
      role: member.role || 'member'
    }));

    res.status(200).json({
      success: true,
      data: { teamMembers: formattedMembers }
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Also add a separate endpoint for getting all users (admin only) if needed
// @desc    Get all users (admin only)
// @route   GET /api/projects/all-users
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.user;

    // Only admins can see all users with full details
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const users = await User.find({}).select('-password').lean();

    const formattedUsers = users.map((user, index) => ({
      id: user._id,
      name: user.displayName || user.email,
      email: user.email,
      avatar: user.photoURL || user.displayName?.charAt(0) || user.email?.charAt(0) || 'U',
      color: `bg-${['blue', 'green', 'purple', 'pink', 'indigo', 'yellow', 'red', 'teal', 'orange', 'cyan'][index % 10]}-500`,
      role: user.role || 'member',
      isActive: user.isActive !== false,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    res.status(200).json({
      success: true,
      data: { users: formattedUsers }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};