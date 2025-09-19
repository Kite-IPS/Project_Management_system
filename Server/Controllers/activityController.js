import Activity from '../Models/ActivityModel.js';
import { successResponse, errorResponse, asyncHandler } from '../Config/responseHandler.js';

// Get recent activities
const getRecentActivities = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const activities = await Activity.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  // Format activities for frontend
  const formattedActivities = activities.map(activity => ({
    id: activity._id,
    user: activity.user,
    action: activity.action,
    entityType: activity.entityType,
    entityTitle: activity.entityTitle,
    description: activity.description,
    createdAt: activity.createdAt,
    timeAgo: getTimeAgo(activity.createdAt)
  }));

  successResponse(res, 'Recent activities retrieved successfully', formattedActivities);
});

// Create a new activity (internal function for other controllers to use)
export const createActivity = async (userId, action, entityType, entityId, entityTitle, description, metadata = {}) => {
  try {
    const activity = new Activity({
      user: userId,
      action,
      entityType,
      entityId,
      entityTitle,
      description,
      metadata
    });

    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    // Don't throw error to avoid breaking main functionality
    return null;
  }
};

// Helper function to get time ago string
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
};

// Get activities by entity type
const getActivitiesByEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { limit = 20 } = req.query;

  const activities = await Activity.find({ entityType, entityId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  const formattedActivities = activities.map(activity => ({
    id: activity._id,
    user: activity.user,
    action: activity.action,
    description: activity.description,
    createdAt: activity.createdAt,
    timeAgo: getTimeAgo(activity.createdAt)
  }));

  successResponse(res, `Activities for ${entityType} retrieved successfully`, formattedActivities);
});

// Get user activities
const getUserActivities = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 20 } = req.query;

  const activities = await Activity.find({ user: userId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  const formattedActivities = activities.map(activity => ({
    id: activity._id,
    action: activity.action,
    entityType: activity.entityType,
    entityTitle: activity.entityTitle,
    description: activity.description,
    createdAt: activity.createdAt,
    timeAgo: getTimeAgo(activity.createdAt)
  }));

  successResponse(res, 'User activities retrieved successfully', formattedActivities);
});

export {
  getRecentActivities,
  getActivitiesByEntity,
  getUserActivities
};