import React, { useState, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';
import {
  Calendar,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  X,
  Save,
  Upload,
  Eye,
  User
} from 'lucide-react';

const EventReport = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [eventReports, setEventReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]); // Changed from static to state
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for users

  // Form state for adding/editing event reports
  const [formData, setFormData] = useState({
    name: '',
    dateUpdated: new Date().toISOString().split('T')[0],
    createdBy: '',
    eventWork: null
  });

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch users from existing auth API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('accessToken'); // Assuming you store token in localStorage
      
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match the expected format
        const transformedUsers = data.users.map(user => ({
          _id: user._id || user.id,
          name: user.displayName || user.email.split('@')[0],
          email: user.email
        }));
        setTeamMembers(transformedUsers);
      } else {
        console.error('Failed to fetch users:', data.message);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setTeamMembers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch event reports from API
  const fetchEventReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/event-reports`);
      const data = await response.json();
      
      if (data.success) {
        setEventReports(data.data);
      } else {
        console.error('Failed to fetch event reports:', data.message);
        alert('Failed to fetch event reports');
      }
    } catch (error) {
      console.error('Error fetching event reports:', error);
      alert('Error fetching event reports');
    } finally {
      setLoading(false);
    }
  };

  // Load event reports and users on component mount
  useEffect(() => {
    fetchEventReports();
    fetchUsers();
  }, []);

  // Filter event reports based on search and filter
  const filteredEventReports = eventReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.createdBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'recent' && new Date(report.dateUpdated) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesFilter;
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.createdBy) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('dateUpdated', formData.dateUpdated);
      formDataToSend.append('createdBy', formData.createdBy);
      
      if (formData.eventWork && formData.eventWork instanceof File) {
        formDataToSend.append('eventWork', formData.eventWork);
      }

      let response;
      if (editingReport) {
        // Update existing report
        response = await fetch(`${API_BASE_URL}/event-reports/${editingReport._id}`, {
          method: 'PUT',
          body: formDataToSend
        });
      } else {
        // Create new report
        response = await fetch(`${API_BASE_URL}/event-reports`, {
          method: 'POST',
          body: formDataToSend
        });
      }

      const data = await response.json();
      
      if (data.success) {
        alert(editingReport ? 'Event report updated successfully!' : 'Event report created successfully!');
        handleCancel();
        fetchEventReports(); // Refresh the list
      } else {
        alert(data.message || 'Failed to save event report');
      }
    } catch (error) {
      console.error('Error saving event report:', error);
      alert('Error saving event report');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      dateUpdated: report.dateUpdated.split('T')[0], // Format date for input
      createdBy: report.createdBy,
      eventWork: null // Reset file input for editing
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this event report?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/event-reports/${reportId}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Event report deleted successfully!');
          fetchEventReports(); // Refresh the list
        } else {
          alert(data.message || 'Failed to delete event report');
        }
      } catch (error) {
        console.error('Error deleting event report:', error);
        alert('Error deleting event report');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      name: '',
      dateUpdated: new Date().toISOString().split('T')[0],
      createdBy: '',
      eventWork: null
    });
    setEditingReport(null);
    setShowAddForm(false);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        eventWork: file
      });
    }
  };

  // Handle file download
  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/event-reports/download/${fileUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
    if (!fileName) return '📎';
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📋';
      default:
        return '📎';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Event Reports
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
          {!loading && filteredEventReports.length > 0 && (
            <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filteredEventReports.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {filteredEventReports.filter(r => new Date(r.dateUpdated).getMonth() === new Date().getMonth()).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contributors</p>
                    <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                      {new Set(filteredEventReports.map(r => r.createdBy)).size}
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
                Event Reports Management
              </h2>

              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Event Report
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search event reports..."
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
                  <option value="all">All Reports</option>
                  <option value="recent">Recent (Last 7 days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingReport ? 'Edit Event Report' : 'Add New Event Report'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Report Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter event report name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Updated *
                  </label>
                  <input
                    type="date"
                    value={formData.dateUpdated}
                    onChange={(e) => setFormData({...formData, dateUpdated: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created By *
                  </label>
                  <select
                    value={formData.createdBy}
                    onChange={(e) => setFormData({...formData, createdBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loadingUsers}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading users...' : 'Select Creator'}
                    </option>
                    {teamMembers.map(member => (
                      <option key={member._id} value={member.name}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                  {teamMembers.length === 0 && !loadingUsers && (
                    <p className="text-xs text-red-500 mt-1">
                      No users found. Please add users to the system.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Work File
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    {formData.eventWork && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-lg">{getFileIcon(formData.eventWork.name)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.eventWork.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(formData.eventWork.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? 'Saving...' : (editingReport ? 'Update' : 'Save') + ' Report'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Event Reports Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading event reports...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Event Work
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEventReports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No event reports found
                        </td>
                      </tr>
                    ) : (
                      filteredEventReports.map((report, index) => (
                        <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {report.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(report.dateUpdated).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {report.createdBy}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getFileIcon(report.eventWork?.originalName)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {report.eventWork?.originalName || 'No file attached'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {report.eventWork?.size || '0 MB'}
                                </div>
                              </div>
                              {report.eventWork?.filename && (
                                <button 
                                  onClick={() => handleDownload(report.eventWork.filename, report.eventWork.originalName)}
                                  className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                                >
                                  <Download className="h-4 w-4 text-gray-500" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(report)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(report._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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
    </div>
  );
};

export default EventReport;