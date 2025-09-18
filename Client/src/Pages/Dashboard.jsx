import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContent';
import { useTheme } from '../Context/ThemeContext';
import { logOut } from '../Config/firebase';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, User, Settings, Bell, Home } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // No loading screen needed
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">P</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">12</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">C</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">8</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">P</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">3</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">O</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">1</p>
                  </div>
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
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Project "Website Redesign" was updated</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Task "Setup database" completed</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">4 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">New team member added to "Mobile App"</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;