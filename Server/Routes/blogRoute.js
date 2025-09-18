import express from 'express';
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAuthors,
  getBlogStats
} from '../Controllers/blogController.js';

const router = express.Router();

// Public routes (no authentication required for reading blogs)
router.get('/', getAllBlogs);
router.get('/stats', getBlogStats);
router.get('/authors', getAuthors);
router.get('/:id', getBlogById);

// Protected routes (authentication required for creating/editing blogs)
// Note: Add authentication middleware here when implementing auth
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;