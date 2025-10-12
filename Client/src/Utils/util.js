// API utility functions for project management
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';  // Vite env + Vercel dev fallback

// Generic API call function (JSON by default)
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,  // Let options override (no forced JSON for FormData)
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Upload-specific call (for FormData—no JSON header)
export const uploadCall = async (endpoint, formData, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,  // No Content-Type—browser sets multipart/form-data
    },
    body: formData,
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// Project API functions
export const projectAPI = {
  // Get all projects with filtering and pagination
  getProjects: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const endpoint = `/projects${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await apiCall(endpoint);
  },

  // Get single project by ID
  getProject: async (id) => {
    return await apiCall(`/projects/${id}`);
  },

  // Create new project
  createProject: async (projectData) => {
    return await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Update project
  updateProject: async (id, projectData) => {
    return await apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  // Delete project
  deleteProject: async (id) => {
    return await apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Add comment to project
  addComment: async (id, message) => {
    return await apiCall(`/projects/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Get team members for assignment
  getTeamMembers: async () => {
    return await apiCall('/projects/team-members');
  }
};

// Upload API functions (for papers, event-reports, etc.)
export const uploadAPI = {
  // Create paper with file (e.g., POST /api/papers)
  createPaper: async (formData) => {  // Pass FormData from component
    return await uploadCall('/papers', formData, { method: 'POST' });
  },

  // Update paper with file (PUT /api/papers/:id)
  updatePaper: async (id, formData) => {
    return await uploadCall(`/papers/${id}`, formData, { method: 'PUT' });
  },

  // Create event report with file (similar)
  createEventReport: async (formData) => {
    return await uploadCall('/event-reports', formData, { method: 'POST' });
  },

  // Download file
  downloadFile: async (endpoint) => {  // e.g., /papers/download/filename
    return await apiCall(endpoint);  // Returns blob or redirects to file
  }
};

// Authentication API functions
export const authAPI = {
  // Login user
  login: async (credentials) => {
    return await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Register user
  register: async (userData) => {
    return await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Logout user
  logout: async () => {
    return await apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user profile
  getProfile: async () => {
    return await apiCall('/auth/profile');
  },

  // Update user profile
  updateProfile: async (userData) => {
    return await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
};

// Error handling utility
export const handleApiError = (error, setError) => {
  console.error('API Error:', error);
  
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
    return;
  }
  
  if (error.message.includes('403')) {
    setError && setError('You do not have permission to perform this action.');
    return;
  }
  
  if (error.message.includes('404')) {
    setError && setError('The requested resource was not found.');
    return;
  }
  
  if (error.message.includes('429')) {
    setError && setError('Too many requests. Please try again later.');
    return;
  }
  
  if (error.message.includes('500')) {
    setError && setError('Server error. Please try again later.');
    return;
  }
  
  // Generic error
  setError && setError(error.message || 'An unexpected error occurred.');
};

// User permissions utility
export const getUserPermissions = () => {
  const userRole = localStorage.getItem('userRole') || 'member';
  const userId = localStorage.getItem('userId');
  
  return {
    role: userRole,
    userId: userId,
    canCreate: ['admin', 'moderator'].includes(userRole),
    canEdit: ['admin', 'moderator'].includes(userRole),
    canDelete: userRole === 'admin',
    canViewAll: userRole === 'admin',
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator',
    isMember: userRole === 'member'
  };
};

// Local storage utilities
export const storage = {
  // Save authentication data
  saveAuth: (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', user._id || user.userId);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.displayName || user.name);
  },

  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
  },

  // Get authentication data
  getAuth: () => {
    return {
      token: localStorage.getItem('authToken'),
      userId: localStorage.getItem('userId'),
      role: localStorage.getItem('userRole'),
      email: localStorage.getItem('userEmail'),
      name: localStorage.getItem('userName')
    };
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

// Date formatting utilities
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

export const formatDateTime = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Date(date).toLocaleString('en-US', defaultOptions);
};

// Validation utilities
export const validateProject = (projectData) => {
  const errors = {};
  
  if (!projectData.title || projectData.title.trim().length === 0) {
    errors.title = 'Project title is required';
  }
  
  if (!projectData.description || projectData.description.trim().length === 0) {
    errors.description = 'Project description is required';
  }
  
  if (!projectData.assignees || projectData.assignees.length === 0) {
    errors.assignees = 'At least one team member must be assigned';
  }
  
  if (!projectData.startDate) {
    errors.startDate = 'Start date is required';
  }
  
  if (!projectData.dueDate) {
    errors.dueDate = 'Due date is required';
  }
  
  if (projectData.startDate && projectData.dueDate) {
    const startDate = new Date(projectData.startDate);
    const dueDate = new Date(projectData.dueDate);
    
    if (startDate >= dueDate) {
      errors.dueDate = 'Due date must be after start date';
    }
  }
  
  if (projectData.paperwork && !isValidUrl(projectData.paperwork)) {
    errors.paperwork = 'Please enter a valid URL for paperwork link';
  }
  
  if (projectData.projectTrack && !isValidUrl(projectData.projectTrack)) {
    errors.projectTrack = 'Please enter a valid URL for project track link';
  }
  
  if (projectData.repoLink && !isValidUrl(projectData.repoLink)) {
    errors.repoLink = 'Please enter a valid URL for repository link';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// URL validation utility
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Debounce utility for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Status color utilities
export const getStatusColor = (status) => {
  const colors = {
    'To Do': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Review': 'bg-yellow-100 text-yellow-800',
    'Done': 'bg-green-100 text-green-800'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority) => {
  const colors = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800'
  };
  
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export default {
  apiCall,
  uploadCall,  // Added for FormData
  projectAPI,
  uploadAPI,   // New: For file routes
  authAPI,
  handleApiError,
  getUserPermissions,
  storage,
  formatDate,
  formatDateTime,
  validateProject,
  debounce,
  getStatusColor,
  getPriorityColor
};