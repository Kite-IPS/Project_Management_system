import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContent';
import { useTheme } from '../Context/ThemeContext';
import { logOut } from '../Config/firebase';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, User, Settings, Bell, Home, Clock, CheckCircle, AlertTriangle, Target, TrendingUp, Activity } from 'lucide-react';
import Sidebar from '../Components/Sidebar.jsx';
import axios from 'axios';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [userRole, setUserRole] = useState("Member"); // Default to Member
  const [currentUserId, setCurrentUserId] = useState(null); // Track current user ID

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

  useEffect(() => {
    const initializeData = async () => {
      // Fetch user role first
      await fetchCurrentUserRole();
      
      // Then fetch other data
      await fetchActivities();
      await fetchProjects();
    };

    initializeData();
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Fetch recent activities from API
  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await axios.get(`${API_BASE_URL}/activities/recent?limit=8`, getAuthHeaders());
      
      if (response.data.success) {
        setActivities(response.data.data);
      } else {
        console.error("Invalid activities response structure:", response.data);
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Fallback to basic mock data if API fails
      setActivities([
        {
          id: 1,
          description: 'Project "Website Redesign" was updated',
          timeAgo: '2 hours ago',
          action: 'updated'
        },
        {
          id: 2,
          description: 'Task "Setup database" completed',
          timeAgo: '4 hours ago',
          action: 'completed'
        },
        {
          id: 3,
          description: 'New team member added to "Mobile App"',
          timeAgo: '1 day ago',
          action: 'created'
        }
      ]);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch projects from API using same pattern as Project.jsx
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await axios.get(`${API_BASE_URL}/projects`, getAuthHeaders());
      
      console.table("Projects API response:", response.data.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        setProjects(response.data.data);
      } else {
        console.error("Invalid projects response structure:", response.data);
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Calculate project statistics from real data
  const calculateProjectStats = () => {
    if (!Array.isArray(projects)) {
      return {
        total: 0,
        ongoing: 0,
        pending: 0,
        completed: 0,
        review: 0,
        overdue: 0
      };
    }

    const stats = {
      total: projects.length,
      ongoing: 0,
      pending: 0,
      completed: 0,
      review: 0,
      overdue: 0
    };

    const currentDate = new Date();
    
    projects.forEach(project => {
      const status = project.status || project.projectStatus || 'Planning';
      const endDate = new Date(project.endDate || project.dueDate);
      
      // Count by status
      switch (status.toLowerCase()) {
        case 'in progress':
          stats.ongoing++;
          break;
        case 'to do':
        case 'planning':
          stats.pending++;
          break;
        case 'done':
        case 'completed':
          stats.completed++;
          break;
        case 'review':
        case 'in review':
          stats.review++;
          break;
      }
      
      // Count overdue projects (not completed and past due date)
      if (status.toLowerCase() !== 'done' && status.toLowerCase() !== 'completed' && endDate < currentDate) {
        stats.overdue++;
      }
    });

    return stats;
  };

  const projectStats = calculateProjectStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>

              {/* Notifications */}
              <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Settings */}
              <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* User Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt="Profile"
                      className="h-8 w-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userProfile?.displayName || userProfile?.email?.split('@')[0] || 'User'}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main Content */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userProfile?.displayName?.split(' ')[0] || userProfile?.email?.split('@')[0] || 'User'}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your projects today.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                  {loadingProjects ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{projectStats.total}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ongoing</p>
                  {loadingProjects ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{projectStats.ongoing}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  {loadingProjects ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{projectStats.pending}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  {loadingProjects ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{projectStats.completed}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Review</p>
                  {loadingProjects ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{projectStats.review}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                  {loadingProjects ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{projectStats.overdue}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{userProfile?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{userProfile?.displayName || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email Verified</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {userProfile?.emailVerified ? (
                      <span className="text-green-600 dark:text-green-400">Verified</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Not verified</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Last Sign In</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {userProfile?.lastSignInTime ? new Date(userProfile.lastSignInTime).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              {loadingActivities ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                      <div className="h-4 bg-gray-300 rounded flex-1"></div>
                      <div className="h-3 w-16 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${
                        activity.action === 'created' ? 'bg-green-500' :
                        activity.action === 'updated' ? 'bg-blue-500' :
                        activity.action === 'deleted' ? 'bg-red-500' :
                        activity.action === 'completed' ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {activity.timeAgo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;