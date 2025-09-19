import express from 'express';
import {
  getRecentActivities,
  getActivitiesByEntity,
  getUserActivities
} from '../Controllers/activityController.js';

const router = express.Router();

// Get recent activities
router.get('/recent', getRecentActivities);

// Get activities by entity type and ID
router.get('/entity/:entityType/:entityId', getActivitiesByEntity);

// Get activities by user
router.get('/user/:userId', getUserActivities);

export default router;