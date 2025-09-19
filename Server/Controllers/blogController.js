import Blog from '../Models/BlogModel.js';
import Role from '../Models/RoleModel.js';
import { createActivity } from './activityController.js';

// Get all blogs with pagination and filtering
const getAllBlogs = async (req, res) => {
  try {
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
    const blogs = await Blog.find(query)
      .populate('author', 'name email role batch') // Populate author with selected fields
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalBlogs = await Blog.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBlogs,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
};

// Get single blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
};

// Create new blog
const createBlog = async (req, res) => {
  try {
    const { title, content, author, datePublished, links, tags } = req.body;

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

    // Create new blog
    const newBlog = new Blog({
      title: title.trim(),
      content: content.trim(),
      author,
      datePublished: datePublished || new Date(),
      links: links || [],
      tags: tags || []
    });

    const savedBlog = await newBlog.save();

    // Log activity
    await createActivity(
      author,
      'created',
      'blog',
      savedBlog._id,
      title.trim(),
      `Created blog post: "${title.trim()}"`
    );

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: savedBlog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// Update existing blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, datePublished, links, tags, isPublished } = req.body;

    // Check if blog exists
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // If author is being updated, verify it exists
    if (author && author !== existingBlog.author.toString()) {
      const authorExists = await Role.findById(author);
      if (!authorExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid author ID. Author must exist in the system.'
        });
      }
    }

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(author && { author }),
        ...(datePublished && { datePublished }),
        ...(links && { links }),
        ...(tags && { tags }),
        ...(isPublished !== undefined && { isPublished })
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// Delete blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
      data: deletedBlog
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

// Get authors (from Role collection) for dropdown
const getAuthors = async (req, res) => {
  try {
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

// Get blog statistics
const getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments({ isPublished: true });
    
    // Blogs published this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthBlogs = await Blog.countDocuments({
      isPublished: true,
      datePublished: { $gte: thisMonth }
    });

    // Total authors (unique)
    const authorsCount = await Blog.distinct('author').then(authors => authors.length);

    // Total views
    const totalViews = await Blog.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Blog statistics retrieved successfully',
      data: {
        totalBlogs,
        thisMonthBlogs,
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
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAuthors,
  getBlogStats
};