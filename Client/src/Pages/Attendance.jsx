import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Components/Sidebar.jsx';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Save,
  X
} from 'lucide-react';
import axios from 'axios';

const Attendance = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state for adding/editing attendance
  const [formData, setFormData] = useState({
    userId: '',
    status: 'Present',
    dailyTask: '',
    taskStatus: 'Not Started',
    notes: ''
  });

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Check if selected date is today
  const isToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  }, [selectedDate]);

  // Configure axios with auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // Fetch users for the dropdown
  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/auth/users`,
        getAuthHeaders()
      );

      if (response.data.success) {
        console.log('Users from API:', response.data.users);
        // Ensure users have proper id format
        const processedUsers = response.data.users.map(user => {
          // Log each user to inspect format
          console.log('Processing user:', user);
          return {
            ...user,
            _id: user._id || user.id // Ensure _id is available
          };
        });
        setUsers(processedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      // Show user-friendly error message
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to view users.');
      } else {
        alert('Failed to load users. Please try again.');
      }
    }
  };

  // Fetch attendance data for selected date
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/attendance?date=${selectedDate}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        // Transform API data to match frontend expectations
        const transformedData = response.data.data.map(record => ({
          _id: record.id,
          user: record.user,
          userName: record.userName || record.user?.displayName || 'Unknown User',
          userEmail: record.userEmail || record.user?.email || '',
          date: record.date,
          status: record.status,
          dailyTask: record.dailyTask,
          taskStatus: record.taskStatus,
          notes: record.notes || '',
          createdAt: record.createdAt,
          markedBy: record.markedBy
        }));
        setAttendanceData(transformedData);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData([]);
      // Show user-friendly error message
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to view attendance records.');
      } else {
        alert('Failed to load attendance data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Handle form submission for adding/editing attendance
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if attendance is being marked for today
    if (!isToday()) {
      alert('Attendance can only be marked for the current date.');
      return;
    }
    
    // Validate required fields
    if (!formData.userId) {
      alert('Please select an employee.');
      return;
    }
    if (!formData.dailyTask.trim()) {
      alert('Please enter a daily task.');
      return;
    }
    
    try {
      // Format date as ISO string (YYYY-MM-DD)
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      
      console.log('Form data before submission:', formData);
      
      const attendancePayload = {
        userId: formData.userId, // We trust that this is a valid MongoDB ID from the select element
        date: formattedDate,
        status: formData.status,
        dailyTask: formData.dailyTask.trim(),
        taskStatus: formData.taskStatus,
        notes: formData.notes || ''
      };

      console.log('Submitting attendance payload:', attendancePayload);

      let response;
      
      if (editingRecord) {
        // Update existing record - using the same endpoint as create, the backend will update based on userId and date
        console.log('Updating record:', editingRecord);
        
        // The backend controller already handles updates by looking up existing records by userId and date
        response = await axios.post(
          `${API_BASE_URL}/attendance`,
          attendancePayload,
          getAuthHeaders()
        );
      } else {
        // Create new record - same endpoint
        response = await axios.post(
          `${API_BASE_URL}/attendance`,
          attendancePayload,
          getAuthHeaders()
        );
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // Refresh data
      fetchAttendance();

      // Reset form
      setFormData({
        userId: '',
        status: 'Present',
        dailyTask: '',
        taskStatus: 'Not Started',
        notes: ''
      });
      setEditingRecord(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      
      // More detailed error handling
      let errorMessage = 'Error saving attendance record. Please try again.';
      
      if (error.response) {
        console.log('Error response data:', error.response.data);
        
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.errors) {
          // Handle validation errors
          const errorDetails = error.response.data.errors.map(err => `${err.param}: ${err.msg}`).join(', ');
          errorMessage = `Validation errors: ${errorDetails}`;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid input data. Please check the form and try again.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (error.response.status === 404) {
          errorMessage = 'Record not found. It may have been deleted.';
        } else if (error.response.status === 409) {
          errorMessage = 'An attendance record already exists for this user on this date.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  // Handle edit button click
  const handleEdit = (record) => {
    console.log('Editing record:', record);
    setEditingRecord(record);
    
    // Make sure we have a valid user ID, checking different possible formats
    const userId = record.user?._id || record.user?.id || record.userId;
    
    if (!userId) {
      console.error('No valid user ID found in record:', record);
    }
    
    setFormData({
      userId: userId || '',
      status: record.status || 'Present',
      dailyTask: record.dailyTask || '',
      taskStatus: record.taskStatus || 'Not Started',
      notes: record.notes || ''
    });
    setShowAddForm(true);
  };

  // Handle cancel edit/add
  const handleCancel = () => {
    setFormData({
      userId: '',
      status: 'Present',
      dailyTask: '',
      taskStatus: 'Not Started',
      notes: ''
    });
    setEditingRecord(null);
    setShowAddForm(false);
  };

  // Filter attendance data based on search and status filter
  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.dailyTask.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || record.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get task status icon and color
  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch attendance when date changes
  useEffect(() => {
    if (users.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, users, fetchAttendance]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Attendance Management
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main Content */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Summary Stats */}
          {!loading && filteredAttendance.length > 0 && (
            <div className="py-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filteredAttendance.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {filteredAttendance.filter(r => r.status === 'Present').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                      {filteredAttendance.filter(r => r.status === 'Absent').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Completed</p>
                    <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                      {filteredAttendance.filter(r => r.taskStatus === 'Completed').length}
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
                Daily Attendance
              </h2>

              <div className="flex items-center gap-4">
                {/* Date Picker */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {!isToday() && (
                    <p className="text-amber-500 text-sm mt-1 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Attendance can only be marked for today
                    </p>
                  )}
                </div>

                {/* Add Attendance Button */}
                <button
                  onClick={() => setShowAddForm(true)}
                  disabled={!isToday()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isToday()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                  }`}
                  title={isToday() ? 'Add Attendance' : 'Attendance can only be marked for today'}
                >
                  <Plus className="h-4 w-4" />
                  Mark Attendance
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or task..."
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
                  <option key="all-status" value="all">All Status</option>
                  <option key="present-status" value="present">Present</option>
                  <option key="absent-status" value="absent">Absent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => {
                      console.log('Selected user ID:', e.target.value);
                      setFormData({...formData, userId: e.target.value});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option key="select-employee" value="">Select Employee</option>
                    {users.map(user => {
                      // Make sure user has _id property
                      const userId = user._id || user.id;
                      if (!userId) {
                        console.error('User missing ID:', user);
                        return null;
                      }
                      return (
                        <option key={userId} value={userId}>
                          {user.displayName || user.name} ({user.email})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option key="present" value="Present">Present</option>
                    <option key="absent" value="Absent">Absent</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Daily Task
                  </label>
                  <input
                    type="text"
                    value={formData.dailyTask}
                    onChange={(e) => setFormData({...formData, dailyTask: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter today's task..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Status
                  </label>
                  <select
                    value={formData.taskStatus}
                    onChange={(e) => setFormData({...formData, taskStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option key="not-started" value="Not Started">Not Started</option>
                    <option key="in-progress" value="In Progress">In Progress</option>
                    <option key="completed" value="Completed">Completed</option>
                    <option key="blocked" value="Blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes..."
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
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Save className="h-4 w-4" />
                    {editingRecord ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Attendance Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading attendance data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Daily Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Task Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No attendance records found for {new Date(selectedDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {record.userName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {record.userName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {record.userEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(record.status)}
                              <span className={`ml-2 text-sm font-medium ${
                                record.status === 'Present'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {record.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {record.dailyTask}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTaskStatusIcon(record.taskStatus)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {record.taskStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {record.notes || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
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
    </div>
  );
};

export default Attendance;
