import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  validateProject
} from '../Controllers/ProjectController.js';
import { authenticateToken } from '../Middleware/authMiddleware.js'; // Updated import path

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes

// GET /api/projects - Get all projects
router.get('/', getProjects);

// GET /api/projects/stats - Get project statistics
router.get('/stats', getProjectStats);

// GET /api/projects/:id - Get single project by ID
router.get('/:id', getProjectById);

// POST /api/projects - Create new project (Admin only)
router.post('/', validateProject, createProject);

// PUT /api/projects/:id - Update project (Admin and SPOC)
router.put('/:id', validateProject, updateProject);

// DELETE /api/projects/:id - Delete project (Admin only)
router.delete('/:id', deleteProject);

export default router;