import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addComment,
  getTeamMembers
} from '../Controllers/ProjectController.js';
import { authenticateToken, requireAdmin, requireModerator } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/projects/team-members - Get team members for project assignment
// Access: Admin and Moderator only
router.get('/team-members', requireModerator, getTeamMembers);

// GET /api/projects - Get all projects with statistics
// Access: Admin (all projects), Moderator/Member (assigned projects only)
router.get('/', getProjects);

// GET /api/projects/:id - Get single project by ID
// Access: Admin (any project), Moderator/Member (assigned projects only)
router.get('/:id', getProject);

// POST /api/projects - Create new project
// Access: Admin and Moderator only
router.post('/', requireModerator, createProject);

// PUT /api/projects/:id - Update project
// Access: Admin (any project), Moderator (assigned projects only)
router.put('/:id', requireModerator, updateProject);

// DELETE /api/projects/:id - Delete project
// Access: Admin only
router.delete('/:id', requireAdmin, deleteProject);

// POST /api/projects/:id/comments - Add comment to project
// Access: All authenticated users with project access
router.post('/:id/comments', addComment);

export default router;