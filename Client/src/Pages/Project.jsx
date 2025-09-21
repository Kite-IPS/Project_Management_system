import React, { useState, useEffect, useMemo } from "react";
import {
  FolderOpen,
  Search,
  Plus,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  MoreHorizontal,
  Target,
  Activity,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  X,
  Link,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

// API utility functions
const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:5000/api";

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle unauthorized responses
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("tokenExpiry");
      
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: data
    };

  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

const fetchUserProfile = async () => {
  try {
    const response = await apiCall("/auth/profile");
    
    if (response.success && response.data && response.data.user) {
      const user = response.data.user;
      
      // Store user details in localStorage
      localStorage.setItem("userId", user.id || user._id);
      localStorage.setItem("userRole", user.role || "member");
      localStorage.setItem("userName", user.displayName || user.email);
      localStorage.setItem("userEmail", user.email);
      
      return user;
    } else {
      throw new Error("Failed to get user profile");
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Add this temporary debug component to check authentication status
const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("accessToken"); // Changed from "authToken" to "accessToken"
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const expiry = localStorage.getItem("tokenExpiry");

    setDebugInfo({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      userRole,
      userId,
      expiry,
      isExpired: expiry ? new Date().getTime() > parseInt(expiry) : null,
      currentTime: new Date().getTime(),
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg z-50">
      <h3 className="font-bold mb-2">Auth Debug Info:</h3>
      <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
      >
        Clear & Reload
      </button>
    </div>
  );
};
const Project = () => {
  // Add this with your other state declarations
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewType, setViewType] = useState('kanban');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // API data states
  const [ projectStats, setProjectStats] = useState({
    total: 0,
    ongoing: 0,
    pending: 0,
    completed: 0,
    review: 0,
    overdue: 0
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 50,
  });
  const [userPermissions, setUserPermissions] = useState({
    canCreate: false,
    canEdit: false,
    canDelete: false,
  });

  // Add this to your state declarations at the top
const [userProfile, setUserProfile] = useState(null);

  // Form state for adding/editing projects
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignees: [],
    startDate: "",
    dueDate: "",
    status: "To Do",
    paperwork: "",
    projectTrack: "",
    repoLink: "",
    priority: "Medium",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Kanban columns
  const columns = [
    { id: "To Do", title: "To Do", color: "bg-gray-100 dark:bg-gray-700" },
    {
      id: "In Progress",
      title: "In Progress",
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "Review",
      title: "Review",
      color: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    { id: "Done", title: "Done", color: "bg-green-50 dark:bg-green-900/20" },
  ];

  process.env.NODE_ENV === "development" && <AuthDebug />;
  // Fetch projects from API
  const fetchProjects = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...params,
      });

      if (searchTerm) queryParams.append("search", searchTerm);
      if (filterStatus && filterStatus !== "all")
        queryParams.append("status", filterStatus);

      const response = await apiCall(`/projects?${queryParams}`);

      if (response.success && response.data) {
        setProjects(response.data.projects || []);
        // Make sure we have default values if statistics are missing
        setProjectStats({
          total: response.data.statistics?.total || 0,
          ongoing: response.data.statistics?.ongoing || 0,
          pending: response.data.statistics?.pending || 0,
          completed: response.data.statistics?.completed || 0,
          review: response.data.statistics?.review || 0,
          overdue: response.data.statistics?.overdue || 0
        });
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalProjects: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 50,
        });
      }
    } catch (error) {
      setError(error.message);
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team members for assignment dropdown
  const fetchTeamMembers = async () => {
    try {
      const response = await apiCall("/projects/team-members");
      setTeamMembers(response.data.teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Non-critical error, don't show to user
    }
  };

  // Updated getUserPermissions function to handle role variations
const getUserPermissions = async () => {
  try {
    const user = await fetchUserProfile();
    setUserProfile(user);
    
    const normalizedRole = (user.role || 'member').toLowerCase();

    return {
      canCreate: ['admin', 'moderator'].includes(normalizedRole),
      canEdit: ['admin', 'moderator'].includes(normalizedRole),
      canDelete: normalizedRole === 'admin'
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false
    };
  }
};


  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      try {
        const permissions = await getUserPermissions();
        setUserPermissions(permissions);

        if (permissions.canCreate) {
          await fetchTeamMembers();
        }
        
        await fetchProjects();
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load initial data');
      }
    };

    initializeData();
  }, []);

  // Refresh projects when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProjects();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  // Filter and sort projects (client-side for current page)
  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    
    return projects
      .filter(project => {
        if (filterStatus === 'all') return true;
        return project.status === filterStatus;
      })
      .filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        return a[sortConfig.key] > b[sortConfig.key] ? direction : -direction;
      });
  }, [projects, filterStatus, searchTerm, sortConfig]);

  // Get assignee info
  const getAssigneeInfo = (assigneeName) => {
    return (
      teamMembers.find((member) => member.name === assigneeName) || {
        name: assigneeName,
        avatar: assigneeName.charAt(0),
        color: "bg-gray-500",
      }
    );
  };

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case "Done":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "In Progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "Review":
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "Low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Project title is required";
    }

    if (formData.assignees.length === 0) {
      errors.assignees = "At least one team member must be assigned";
    }

    if (
      formData.startDate &&
      formData.dueDate &&
      new Date(formData.startDate) > new Date(formData.dueDate)
    ) {
      errors.dueDate = "Due date must be after start date";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle drag start
  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (
      draggedProject &&
      draggedProject.status !== newStatus &&
      userPermissions.canEdit
    ) {
      try {
        await apiCall(`/projects/${draggedProject._id}`, {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        });

        // Update local state
        setProjects(
          projects.map((project) =>
            project._id === draggedProject._id
              ? { ...project, status: newStatus }
              : project
          )
        );
      } catch (error) {
        setError("Failed to update project status");
        console.error("Error updating project status:", error);
      }
    }
    setDraggedProject(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const projectData = {
        ...formData,
        assignees: formData.assignees, // Send as array of user IDs
      };

      if (editingProject) {
        await apiCall(`/projects/${editingProject._id}`, {
          method: "PUT",
          body: JSON.stringify(projectData),
        });
      } else {
        await apiCall("/projects", {
          method: "POST",
          body: JSON.stringify(projectData),
        });
      }

      // Refresh projects list
      await fetchProjects();
      handleCancel();
    } catch (error) {
      setError(error.message);
      console.error("Error saving project:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (project) => {
    if (!userPermissions.canEdit) {
      setError("You do not have permission to edit projects");
      return;
    }

    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      assignees: project.assignees.map((assignee) => assignee.userId),
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().split("T")[0]
        : "",
      dueDate: project.dueDate
        ? new Date(project.dueDate).toISOString().split("T")[0]
        : "",
      status: project.status,
      paperwork: project.paperwork || "",
      projectTrack: project.projectTrack || "",
      repoLink: project.repoLink || "",
      priority: project.priority || "Medium",
    });
    setFormErrors({});
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (projectId) => {
    if (!userPermissions.canDelete) {
      setError("You do not have permission to delete projects");
      return;
    }

    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await apiCall(`/projects/${projectId}`, {
          method: "DELETE",
        });

        // Refresh projects list
        await fetchProjects();
      } catch (error) {
        setError(error.message);
        console.error("Error deleting project:", error);
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      assignees: [],
      startDate: "",
      dueDate: "",
      status: "To Do",
      paperwork: "",
      projectTrack: "",
      repoLink: "",
      priority: "Medium",
    });
    setEditingProject(null);
    setShowAddForm(false);
    setFormErrors({});
  };

  // Handle project click to show details
  const handleProjectClick = async (project) => {
    try {
      const response = await apiCall(`/projects/${project._id}`);
      setSelectedProject(response.data.project);
      setShowProjectDetails(true);
    } catch (error) {
      setError("Failed to fetch project details");
      console.error("Error fetching project details:", error);
    }
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    await fetchProjects();
  };

  // Kanban Card Component
  const KanbanCard = ({ project }) => (
    <div
      draggable={userPermissions.canEdit}
      onDragStart={(e) => handleDragStart(e, project)}
      onClick={() => handleProjectClick(project)}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      {/* Card Header */}
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {project.title}
        </h4>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {project.description}
      </p>

      {/* Card Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {project.assignees.slice(0, 3).map((assignee) => (
            <div
              key={assignee.userId}
              className={`h-6 w-6 ${assignee.color} rounded-full flex items-center justify-center`}
              title={assignee.name}
            >
              <span className="text-white text-xs font-medium">
                {assignee.avatar}
              </span>
            </div>
          ))}
          {project.assignees.length > 3 && (
            <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                +{project.assignees.length - 3}
              </span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(project.dueDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  const tableColumns = [
    { key: "title", label: "Project Name" },
    { key: "status", label: "Status" },
    { key: "assignees", label: "Team Members" },
    { key: "startDate", label: "Start Date" },
    { key: "dueDate", label: "End Date" },
    { key: "paperwork", label: "Paper Work" },
    { key: "projectTrack", label: "Project Track" },
    { key: "repoLink", label: "Repository" },
    { key: "actions", label: "Actions" },
  ];

  // Error display component
  const ErrorMessage = ({ message, onClose }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700 dark:text-red-400">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Project Management
              </h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <ErrorMessage message={error} onClose={() => setError(null)} />
          )}

          {/* Controls Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewType("kanban")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    viewType === "kanban"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setViewType("table")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    viewType === "table"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <TableIcon className="h-5 w-5" />
                  <span>Table</span>
                </button>
              </div>
              {userPermissions.canCreate && (
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingProject(null);
                    setFormData({
                      title: "",
                      description: "",
                      assignees: [],
                      startDate: "",
                      dueDate: "",
                      status: "To Do",
                      paperwork: "",
                      projectTrack: "",
                      repoLink: "",
                      priority: "Medium",
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Project
                </button>
              )}
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading projects...
              </span>
            </div>
          )}

          {/* Statistics Cards */}
          {!loading ? (
            <div className="py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Projects
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {projectStats.total}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ongoing
                    </p>
                    <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {projectStats.ongoing}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-gray-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending
                    </p>
                    <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                      {projectStats.pending}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {projectStats.completed}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      In Review
                    </p>
                    <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                      {projectStats.review}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Overdue
                    </p>
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                      {projectStats.overdue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="animate-pulse flex items-center">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="ml-3 space-y-2">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kanban Board View */}
          {!loading && viewType === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className={`${column.color} rounded-lg p-4 min-h-[500px]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {column.title}
                    </h3>
                    <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full px-2 py-1 text-xs font-medium">
                      {
                        filteredProjects.filter(
                          (project) => project.status === column.id
                        ).length
                      }
                    </span>
                  </div>
                  <div className="space-y-3">
                    {filteredProjects
                      .filter((project) => project.status === column.id)
                      .map((project) => (
                        <KanbanCard key={project._id} project={project} />
                      ))}
                  </div>
                  {filteredProjects.filter(
                    (project) => project.status === column.id
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-sm">
                        No projects in {column.title.toLowerCase()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {!loading && viewType === "table" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                    <tr>
                      {tableColumns.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                          onClick={() =>
                            column.key !== "actions" && handleSort(column.key)
                          }
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.label}</span>
                            {column.key !== "actions" && (
                              <div className="flex flex-col">
                                {sortConfig.key === column.key &&
                                sortConfig.direction === "asc" ? (
                                  <ChevronUp className="h-3 w-3 text-blue-500" />
                                ) : sortConfig.key === column.key &&
                                  sortConfig.direction === "desc" ? (
                                  <ChevronDown className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <div className="h-3 w-3 opacity-30">
                                    <ChevronUp className="h-2 w-2 -mb-1" />
                                    <ChevronDown className="h-2 w-2" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                              No projects found
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                              Try adjusting your search or filter criteria
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr
                          key={project._id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => handleProjectClick(project)}
                        >
                          {/* Project Name */}
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.title}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getStatusIcon(project.status)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {project.status}
                              </span>
                            </div>
                          </td>

                          {/* Team Members */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {project.assignees.slice(0, 2).map((assignee) => (
                                <div
                                  key={assignee.userId}
                                  className={`h-6 w-6 ${assignee.color} rounded-full flex items-center justify-center`}
                                  title={assignee.name}
                                >
                                  <span className="text-white text-xs font-bold">
                                    {assignee.avatar}
                                  </span>
                                </div>
                              ))}
                              {project.assignees.length > 2 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{project.assignees.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Start Date */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(project.startDate).toLocaleDateString()}
                            </div>
                          </td>

                          {/* End Date */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(project.dueDate).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Paper Work */}
                          <td
                            className="px-6 py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.paperwork ? (
                              <a
                                href={project.paperwork}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                <span>View</span>
                              </a>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">
                                No document
                              </span>
                            )}
                          </td>

                          {/* Project Track */}
                          <td
                            className="px-6 py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.projectTrack ? (
                              <a
                                href={project.projectTrack}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                <span>Track</span>
                              </a>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">
                                No tracking
                              </span>
                            )}
                          </td>

                          {/* Repository */}
                          <td
                            className="px-6 py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.repoLink ? (
                              <a
                                href={project.repoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                <Link className="h-4 w-4 mr-2" />
                                <span>Repo</span>
                              </a>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">
                                No repository
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="px-6 py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              {userPermissions.canEdit && (
                                <button
                                  onClick={() => handleEdit(project)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Edit project"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {userPermissions.canDelete && (
                                <button
                                  onClick={() => handleDelete(project._id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete project"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add/Edit Project Modal */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingProject ? "Edit Project" : "Add Project"}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 rounded-md border ${
                        formErrors.title ? "border-red-500" : "border-gray-300"
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter project title"
                    />
                    {formErrors.title && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter project description"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assignees *
                    </label>
                    <select
                      multiple
                      value={formData.assignees}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assignees: Array.from(
                            e.target.selectedOptions,
                            (opt) => opt.value
                          ),
                        })
                      }
                      className={`w-full px-3 py-2 rounded-md border ${
                        formErrors.assignees
                          ? "border-red-500"
                          : "border-gray-300"
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                      size={Math.min(teamMembers.length, 5)}
                    >
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Hold Ctrl/Cmd to select multiple members
                    </p>
                    {formErrors.assignees && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.assignees}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-md border ${
                          formErrors.dueDate
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                      />
                      {formErrors.dueDate && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.dueDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Paper Work Link
                    </label>
                    <input
                      type="url"
                      value={formData.paperwork}
                      onChange={(e) =>
                        setFormData({ ...formData, paperwork: e.target.value })
                      }
                      placeholder="https://docs.google.com/..."
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Track Link
                    </label>
                    <input
                      type="url"
                      value={formData.projectTrack}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          projectTrack: e.target.value,
                        })
                      }
                      placeholder="https://trello.com/..."
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Repository Link
                    </label>
                    <input
                      type="url"
                      value={formData.repoLink}
                      onChange={(e) =>
                        setFormData({ ...formData, repoLink: e.target.value })
                      }
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={submitting}
                      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {submitting
                        ? "Saving..."
                        : editingProject
                        ? "Save Changes"
                        : "Create Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Project Details Modal */}
          {showProjectDetails && selectedProject && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Overlay */}
                <div
                  className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                  onClick={() => setShowProjectDetails(false)}
                ></div>

                {/* Modal */}
                <div className="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6 max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Project Details
                    </h3>
                    <button
                      onClick={() => setShowProjectDetails(false)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Project Title & Priority */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedProject.title}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                        selectedProject.priority
                      )}`}
                    >
                      {selectedProject.priority}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedProject.description}
                    </p>
                  </div>

                  {/* Status & Progress */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </h4>
                      <div className="flex items-center">
                        {getStatusIcon(selectedProject.status)}
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {selectedProject.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Progress
                      </h4>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${selectedProject.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedProject.progress || 0}% Complete
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </h4>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(
                          selectedProject.startDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Due Date
                      </h4>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedProject.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Members
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.assignees.map((assignee) => (
                        <div
                          key={assignee.userId}
                          className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full"
                        >
                          <div
                            className={`h-6 w-6 ${assignee.color} rounded-full flex items-center justify-center`}
                          >
                            <span className="text-white text-xs font-bold">
                              {assignee.avatar}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {assignee.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Links & Documents */}
                  {(selectedProject.repoLink ||
                    selectedProject.paperwork ||
                    selectedProject.projectTrack) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {selectedProject.repoLink && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Repository
                          </h4>
                          <a
                            href={selectedProject.repoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Link className="w-4 h-4 mr-2" />
                            View Repository
                          </a>
                        </div>
                      )}
                      {selectedProject.paperwork && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Documentation
                          </h4>
                          <a
                            href={selectedProject.paperwork}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Documents
                          </a>
                        </div>
                      )}
                      {selectedProject.projectTrack && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Tracking
                          </h4>
                          <a
                            href={selectedProject.projectTrack}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            View Progress
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activity Timeline */}
                  {selectedProject.activities &&
                    selectedProject.activities.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Recent Activity
                        </h4>
                        <div className="space-y-4 max-h-48 overflow-y-auto">
                          {selectedProject.activities
                            .slice(0, 10)
                            .map((activity) => (
                              <div
                                key={activity._id}
                                className="flex items-start space-x-3"
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    <span className="font-medium">
                                      {activity.userName}
                                    </span>{" "}
                                    {activity.description}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(
                                      activity.timestamp
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Comments Section */}
                  {selectedProject.comments &&
                    selectedProject.comments.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Comments
                        </h4>
                        <div className="space-y-4 max-h-48 overflow-y-auto">
                          {selectedProject.comments
                            .slice(0, 10)
                            .map((comment) => (
                              <div
                                key={comment._id}
                                className="flex items-start space-x-3"
                              >
                                <div
                                  className={`w-8 h-8 rounded-full ${
                                    comment.userColor || "bg-gray-500"
                                  } flex items-center justify-center`}
                                >
                                  <span className="text-white text-sm font-medium">
                                    {comment.userAvatar}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {comment.userName}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {comment.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(
                                      comment.timestamp
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Modal Footer */}
                  <div className="flex justify-end gap-3 mt-8">
                    <button
                      onClick={() => setShowProjectDetails(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                    {userPermissions.canEdit && (
                      <button
                        onClick={() => {
                          handleEdit(selectedProject);
                          setShowProjectDetails(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Edit Project
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Project;
