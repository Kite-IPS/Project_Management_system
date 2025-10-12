import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar.jsx';
import {
  BookOpen,
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
  User,
  Link,
  ExternalLink
} from 'lucide-react';

const Meeting = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  // Form state for adding/editing meetings
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    participants: [],
    datePublished: new Date().toISOString().split('T')[0],
    files: [],
    existingFiles: []
  });

  // Mock authors for dropdown
  const [authors, setAuthors] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // For participants selection

  // API base URL
  const API_BASE_URL = 'http://localhost:3000/api';

  // Fetch authors from API
  const fetchAuthors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/meetings/authors`);
      if (response.data.success) {
        setAuthors(response.data.data);
        setAllUsers(response.data.data); // Use same data for participants
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/meetings`, {
        params: {
          search: searchTerm,
          filter: filterStatus,
          limit: 100 // Get all meetings for now
        }
      });

      if (response.data.success) {
        // Transform API data to match frontend expectations
        const transformedData = response.data.data.map((meeting, index) => ({
          id: meeting._id,
          sNo: index + 1,
          title: meeting.title,
          content: meeting.content,
          author: meeting.author?.name || 'Unknown Author',
          authorId: meeting.author?._id || null,
          participants: meeting.participants || [],
          datePublished: meeting.datePublished.split('T')[0], // Format date
          files: meeting.files || [],
          createdDate: meeting.createdAt?.split('T')[0] || meeting.datePublished.split('T')[0]
        }));
        setMeetings(transformedData);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else {
        alert('Failed to load meetings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAuthors();
    fetchMeetings();
  }, []);

  // Refetch when search or filter changes
  useEffect(() => {
    fetchMeetings();
  }, [searchTerm, filterStatus]);

  // Filter meetings based on search and filter
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'recent' && new Date(meeting.datePublished) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesFilter;
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.author) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('author', formData.author);
      formDataToSend.append('participants', JSON.stringify(formData.participants));
      formDataToSend.append('datePublished', formData.datePublished);

      // Add existing files for updates
      if (editingMeeting && formData.existingFiles) {
        formDataToSend.append('existingFiles', JSON.stringify(formData.existingFiles));
      }

      // Add new files
      if (formData.files && formData.files.length > 0) {
        formData.files.forEach((file, index) => {
          formDataToSend.append('files', file);
        });
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingMeeting) {
        // Update existing meeting
        const response = await axios.put(`${API_BASE_URL}/meetings/${editingMeeting.id}`, formDataToSend, config);

        if (response.data.success) {
          fetchMeetings(); // Refresh the list
          handleCancel();
          alert('Meeting updated successfully!');
        }
      } else {
        // Add new meeting
        const response = await axios.post(`${API_BASE_URL}/meetings`, formDataToSend, config);

        if (response.data.success) {
          fetchMeetings(); // Refresh the list
          handleCancel();
          alert('Meeting created successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving meeting:', error);

      let errorMessage = 'Error saving meeting. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  // Handle edit
  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      content: meeting.content,
      author: meeting.authorId || meeting.author, // Use authorId if available, fallback to author name
      participants: meeting.participants ? meeting.participants.map(p => p._id) : [],
      datePublished: meeting.datePublished,
      files: [],
      existingFiles: meeting.files || []
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting notes?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/meetings/${meetingId}`);
        
        if (response.data.success) {
          fetchMeetings(); // Refresh the list
          alert('Meeting notes deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting meeting notes:', error);
        alert('Error deleting meeting notes. Please try again.');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      title: '',
      content: '',
      author: '',
      participants: [],
      datePublished: new Date().toISOString().split('T')[0],
      files: [],
      existingFiles: []
    });
    setEditingMeeting(null);
    setShowAddForm(false);
  };

  // Handle adding a participant
  const handleAddParticipant = (participantId) => {
    if (!formData.participants.includes(participantId)) {
      setFormData({
        ...formData,
        participants: [...formData.participants, participantId]
      });
    }
  };

  // Handle removing a participant
  const handleRemoveParticipant = (participantId) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter(id => id !== participantId)
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFormData({
      ...formData,
      files: selectedFiles
    });
  };

  // Handle removing an existing file
  const handleRemoveExistingFile = (fileIndex) => {
    const updatedFiles = formData.existingFiles.filter((_, index) => index !== fileIndex);
    setFormData({
      ...formData,
      existingFiles: updatedFiles
    });
  };


  return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Meeting Notes
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
          {!loading && filteredMeetings.length > 0 && (
            <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Notes</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filteredMeetings.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {filteredMeetings.filter(m => new Date(m.datePublished).getMonth() === new Date().getMonth()).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Authors</p>
                    <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                      {new Set(filteredMeetings.map(m => m.author)).size}
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
                Meeting Notes Management
              </h2>

              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Meeting Notes
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search meeting notes..."
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
                  <option value="all">All Notes</option>
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
                  {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter meeting title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter meeting content..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Author *
                    </label>
                    <select
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Author</option>
                      {authors.map(author => (
                        <option key={author._id} value={author._id}>
                          {author.name} ({author.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Published *
                    </label>
                    <input
                      type="date"
                      value={formData.datePublished}
                      onChange={(e) => setFormData({...formData, datePublished: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Participants Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Participants
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddParticipant(e.target.value);
                          e.target.value = ''; // Reset select
                        }
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Add Participant</option>
                      {allUsers.filter(user => !formData.participants.includes(user._id)).map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.participants.map(participantId => {
                      const participant = allUsers.find(user => user._id === participantId);
                      return (
                        <span
                          key={participantId}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded"
                        >
                          {participant?.name || 'Unknown'} ({participant?.role || 'Unknown'})
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(participantId)}
                            className="ml-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Files Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Meeting Files (PDF only)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {/* Existing Files */}
                  {formData.existingFiles && formData.existingFiles.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Files:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.existingFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{file.originalName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingFile(index)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Files */}
                  {formData.files && formData.files.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Files to Upload:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.files.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <span className="text-sm text-green-700 dark:text-green-300">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
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
                    {editingMeeting ? 'Update' : 'Save'} Meeting
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Meeting Notes Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading Meeting Notes...</span>
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
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date Published
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMeetings.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No Meeting Notes found
                        </td>
                      </tr>
                    ) : (
                      filteredMeetings.map((meeting) => (
                        <tr key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {meeting.sNo}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                {meeting.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                                {meeting.content}
                              </div>
                            </div>
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
                                  {meeting.author}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {meeting.participants && meeting.participants.length > 0 ? (
                                meeting.participants.slice(0, 3).map((participant, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded"
                                  >
                                    {participant.name || 'Unknown'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No participants</span>
                              )}
                              {meeting.participants && meeting.participants.length > 3 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{meeting.participants.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(meeting.datePublished).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {meeting.files && meeting.files.length > 0 ? (
                                meeting.files.slice(0, 2).map((file, index) => (
                                  <a
                                    key={index}
                                    href={`http://localhost:3000${file.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                                  >
                                    <Download className="h-3 w-3" />
                                    {file.originalName || 'File'}
                                  </a>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No files</span>
                              )}
                              {meeting.files && meeting.files.length > 2 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{meeting.files.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(meeting)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(meeting.id)}
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
  )
}

export default Meeting