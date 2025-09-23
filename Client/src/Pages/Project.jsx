import React, { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../Components/Sidebar.jsx";
import {
  FolderOpen,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Edit,
  Save,
  X,
  Eye,
  ExternalLink,
  Calendar,
} from "lucide-react";
import axios from "axios";

const Project = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectData, setProjectData] = useState([]);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    onHold: 0,
    planning: 0,
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [userRole, setUserRole] = useState("Member"); // Default to Member
  const [currentUserId, setCurrentUserId] = useState(null); // Track current user ID

  // Form state for adding/editing projects
  const [formData, setFormData] = useState({
    projectName: "",
    status: "Planning",
    teamMembers: [], // Array of user IDs
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 7 days from now
    paperWork: "",
    projectTrack: "",
    repository: "",
  });

  // Error state
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL = "http://localhost:5000/api";

  // Configure axios with auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Enhanced role-based permissions
  const permissions = {
    Admin: { read: true, write: true, update: true, delete: true, view: true },
    Manager: {
      read: true,
      write: true,
      update: true,
      delete: false,
      view: true,
    },
    Member: {
      read: false,
      write: false,
      update: false,
      delete: false,
      view: true,
    },
  };

  const userPermissions = permissions[userRole] || permissions.Member;

  // Get current user information and set role correctly
  const fetchCurrentUserRole = async () => {
    try {

      const response = await axios.get(
        `${API_BASE_URL}/auth/profile`,
        getAuthHeaders()
      );

      console.table("User API response:", response.data.user);

      if (response.data.success && response.data.user) {
        const user = response.data.user;
        const role = user.role || "Member";
        const userId = user._id || user.id;

        setUserRole(role);
        setCurrentUserId(userId);

        return { role, userId };
      }
    } catch (error) {
      console.error("Error fetching current user role from API:", error);

      // Fallback to token parsing if API call fails
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));

          // Try different possible field names for role and user ID
          const role =
            payload.role || payload.userRole || payload.user?.role || "Member";
          const userId =
            payload.userId ||
            payload.id ||
            payload.user?.id ||
            payload.user?._id ||
            payload.sub;

          setUserRole(role);
          setCurrentUserId(userId);

          return { role, userId };
        } catch (tokenError) {
          console.error("Error parsing token:", tokenError);
          setUserRole("Member");
          setCurrentUserId(null);
        }
      }
    }

    return { role: "Member", userId: null };
  };

  // Fetch users for the dropdown (only show relevant users based on role)
  const fetchUsers = async () => {
    try {

      const response = await axios.get(
        `${API_BASE_URL}/auth/users`,
        getAuthHeaders()
      );

      console.table("Users API response:", response.data.users);

      if (response.data.success && Array.isArray(response.data.users)) {
        const processedUsers = response.data.users.map((user) => ({
          ...user,
          _id: user._id || user.id,
          displayName:
            user.displayName ||
            user.name ||
            user.email?.split("@")[0] ||
            "Unknown User",
        }));

        setUsers(processedUsers);
      } else {
        console.error("Invalid users response structure:", response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 403) {
        console.log("User does not have permission to fetch users list");
      }
      setUsers([]);
    }
  };

  // Fetch project data
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/projects`,
        getAuthHeaders()
      );

      console.table("Projects API response:", response.data.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        setProjectData(response.data.data);
      } else {
        console.error("Invalid projects response structure:", response.data);
        setProjectData([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjectData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle form submission for adding/editing projects
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);

      // Basic validation
      if (!formData.projectName.trim()) {
        setError("Project name is required");
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        setError("Start and end dates are required");
        return;
      }

      // Client-side date validation using string comparison (more reliable for YYYY-MM-DD format)
      if (formData.endDate <= formData.startDate) {
        setError("End date must be after start date");
        return;
      }

      // Prepare the payload - send dates as YYYY-MM-DD format (don't add time zones)
      const payload = {
        ...formData,
        // Keep dates in YYYY-MM-DD format - let the backend handle timezone conversion
        startDate: formData.startDate,
        endDate: formData.endDate,
        teamMembers: formData.teamMembers.map((id) => id.toString()),
      };


      let response;
      if (editingRecord) {
        response = await axios.put(
          `${API_BASE_URL}/projects/update/${editingRecord._id}`,
          payload,
          getAuthHeaders()
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/projects`,
          payload,
          getAuthHeaders()
        );
      }

      if (response.data.success) {
        await fetchProjects();
        setShowAddForm(false);
        setEditingRecord(null);
        setFormData({
          projectName: "",
          status: "Planning",
          teamMembers: [],
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          paperWork: "",
          projectTrack: "",
          repository: "",
        });
      } else {
        setError(response.data.message || "Failed to save project");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      const errorMessage = error.response?.data?.message;
      setError(
        errorMessage ||
          error.message ||
          "Error saving project. Please try again."
      );
    }
  };
  // Handle edit button click
  // Handle edit button click
  const handleEdit = (record) => {
    if (!userPermissions.update) {
      setError("You do not have permission to edit projects.");
      return;
    }

    // Helper function to format date for input (ensures YYYY-MM-DD format)
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      try {
        // Handle both ISO string and date object
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn("Invalid date:", dateString);
          return "";
        }

        // Get the date in local timezone and format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error("Error formatting date:", error);
        return "";
      }
    };

    const formattedStartDate = formatDateForInput(record.startDate);
    const formattedEndDate = formatDateForInput(record.endDate);

    setEditingRecord(record);
    setFormData({
      projectName: record.projectName || "",
      status: record.status || "Planning",
      teamMembers:
        record.teamMembers?.map(
          (member) => member._id || member.id || member
        ) || [],
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      paperWork: record.paperWork || "",
      projectTrack: record.projectTrack || "",
      repository: record.repository || "",
    });
    setShowAddForm(true);
  };

  // Handle view button click
  const handleView = (record) => {
    setViewingProject(record);
    setShowViewModal(true);
  };

  // Handle cancel edit/add
  const handleCancel = () => {
    setFormData({
      projectName: "",
      status: "Planning",
      teamMembers: [],
      startDate: "",
      endDate: "",
      paperWork: "",
      projectTrack: "",
      repository: "",
    });
    setEditingRecord(null);
    setShowAddForm(false);
    setError(null);
  };

  // Handle add project button click
  const handleAddProject = () => {
    if (!userPermissions.write) {
      setError("You do not have permission to add projects.");
      return;
    }
    setShowAddForm(true);
  };

  // Filter project data based on search and status filter
  const filteredProjects = useMemo(() => {
    return projectData.filter((project) => {
      const matchesSearch =
        project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.teamMembers?.some((member) =>
          (member.displayName || member.name || member.email || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        filterStatus === "all" ||
        project.status?.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [projectData, searchTerm, filterStatus]);

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "In Progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "On Hold":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "Planning":
        return <Clock className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {

      // Fetch user role first
      const { role, userId } = await fetchCurrentUserRole();

      // Then fetch other data
      if (role === "Admin" || role === "Manager") {
        await fetchUsers();
      }
      await fetchProjects();
    };

    initializeData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

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
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Role:{" "}
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {userRole}
              </span>
              {!userPermissions.write && (
                <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                  (Read Only)
                </span>
              )}
            </div>
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
          {/* Summary Stats */}
          {!loading && filteredProjects.length > 0 && (
            <div className="py-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FolderOpen className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Projects
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {filteredProjects.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {
                        filteredProjects.filter((p) => p.status === "Completed")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      In Progress
                    </p>
                    <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {
                        filteredProjects.filter(
                          (p) => p.status === "In Progress"
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      On Hold
                    </p>
                    <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                      {
                        filteredProjects.filter((p) => p.status === "On Hold")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Projects
              </h2>

              {userPermissions.write && (
                <button
                  onClick={handleAddProject}
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
                  placeholder="Search by project name or team member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on hold">On Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && userPermissions.write && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingRecord ? "Edit Project" : "Add Project"}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) =>
                      setFormData({ ...formData, projectName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name..."
                    required
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Team Members *{" "}
                    {users.length === 0 && (
                      <span className="text-red-500 text-xs">
                        (No users available)
                      </span>
                    )}
                  </label>
                  {users.length > 0 ? (
                    <select
                      multiple
                      value={formData.teamMembers}
                      onChange={(e) => {
                        const selectedValues = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        );
                        console.table("Selected team members:", selectedValues);
                        setFormData({
                          ...formData,
                          teamMembers: selectedValues,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                      required
                    >
                      {users.map((user) => {
                        const userId = user._id || user.id;
                        return (
                          <option key={userId} value={userId}>
                            {user.displayName} ({user.email}) -{" "}
                            {user.role || "Member"}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 min-h-[100px] flex items-center justify-center">
                      No users available. Please contact an administrator.
                    </div>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Hold Ctrl/Cmd to select multiple members
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={formData.startDate}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Paper Work (Link)
                  </label>
                  <input
                    type="url"
                    value={formData.paperWork}
                    onChange={(e) =>
                      setFormData({ ...formData, paperWork: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Track (Link)
                  </label>
                  <input
                    type="url"
                    value={formData.projectTrack}
                    onChange={(e) =>
                      setFormData({ ...formData, projectTrack: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Repository (Link)
                  </label>
                  <input
                    type="url"
                    value={formData.repository}
                    onChange={(e) =>
                      setFormData({ ...formData, repository: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={users.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                  >
                    <Save className="h-4 w-4" />
                    {editingRecord ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Projects Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Loading projects...
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Links
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          No projects found
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr
                          key={project._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {project.projectName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(project.status)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {project.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {project.teamMembers &&
                            project.teamMembers.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {project.teamMembers.map((member, index) => (
                                  <span
                                    key={member._id || index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                                  >
                                    {member.displayName ||
                                      member.email ||
                                      "Unknown User"}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                No team members
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {formatDate(project.startDate)} -{" "}
                                {formatDate(project.endDate)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {project.paperWork && (
                                <a
                                  href={project.paperWork}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <ExternalLink
                                    className="h-4 w-4"
                                    title="Paper Work"
                                  />
                                </a>
                              )}
                              {project.projectTrack && (
                                <a
                                  href={project.projectTrack}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <ExternalLink
                                    className="h-4 w-4"
                                    title="Project Track"
                                  />
                                </a>
                              )}
                              {project.repository && (
                                <a
                                  href={project.repository}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <ExternalLink
                                    className="h-4 w-4"
                                    title="Repository"
                                  />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleView(project)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-gray-500" />
                              </button>
                              {userPermissions.update && (
                                <button
                                  onClick={() => handleEdit(project)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                  title="Edit Project"
                                >
                                  <Edit className="h-4 w-4 text-gray-500" />
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
            )}
          </div>
        </div>
      </main>

      {/* View Modal */}
      {showViewModal && viewingProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Project Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Project Name
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {viewingProject.projectName}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </h4>
                  <div className="flex items-center">
                    {getStatusIcon(viewingProject.status)}
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {viewingProject.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Timeline
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(viewingProject.startDate)} -{" "}
                    {formatDate(viewingProject.endDate)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Team Members
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingProject.teamMembers?.map((member, index) => (
                      <div
                        key={member._id || index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {member.displayName || member.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Links
                  </h4>
                  <div className="flex gap-4 mt-2">
                    {viewingProject.paperWork && (
                      <a
                        href={viewingProject.paperWork}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Paper Work
                      </a>
                    )}
                    {viewingProject.projectTrack && (
                      <a
                        href={viewingProject.projectTrack}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Project Track
                      </a>
                    )}
                    {viewingProject.repository && (
                      <a
                        href={viewingProject.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Repository
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Project;
