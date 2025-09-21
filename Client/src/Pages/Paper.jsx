import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
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
  User,
  Calendar,
  Eye
} from 'lucide-react';

const Paper = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state for adding/editing papers
  const [formData, setFormData] = useState({
    name: '',
    dateUpdate: new Date().toISOString().split('T')[0],
    assignee: '',
    paperWork: null
  });

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch users from existing auth API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match the expected format with avatar colors
        const transformedUsers = data.users.map((user, index) => {
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500'];
          const displayName = user.displayName || user.email.split('@')[0];
          return {
            _id: user._id || user.id,
            name: displayName,
            email: user.email,
            avatar: displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            color: colors[index % colors.length]
          };
        });
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

  // Fetch papers from API
  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/papers`);
      const data = await response.json();
      
      if (data.success) {
        setPapers(data.data);
      } else {
        console.error('Failed to fetch papers:', data.message);
        alert('Failed to fetch papers');
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      alert('Error fetching papers');
    } finally {
      setLoading(false);
    }
  };

  // Load papers and users on component mount
  useEffect(() => {
    fetchPapers();
    fetchUsers();
  }, []);

  // Filtered papers
  const filteredPapers = papers.filter(paper => {
    const matchesSearch =
      paper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paper.paperWork?.originalName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee =
      filterAssignee === 'all' || paper.assignee === filterAssignee;
    return matchesSearch && matchesAssignee;
  });

  // Handle add/edit form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.assignee) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('dateUpdate', formData.dateUpdate);
      formDataToSend.append('assignee', formData.assignee);
      
      if (formData.paperWork && formData.paperWork instanceof File) {
        formDataToSend.append('paperWork', formData.paperWork);
      }

      let response;
      if (editingPaper) {
        // Update existing paper
        response = await fetch(`${API_BASE_URL}/papers/${editingPaper._id}`, {
          method: 'PUT',
          body: formDataToSend
        });
      } else {
        // Create new paper
        response = await fetch(`${API_BASE_URL}/papers`, {
          method: 'POST',
          body: formDataToSend
        });
      }

      const data = await response.json();
      
      if (data.success) {
        alert(editingPaper ? 'Paper updated successfully!' : 'Paper created successfully!');
        handleCancel();
        fetchPapers(); // Refresh the list
      } else {
        alert(data.message || 'Failed to save paper');
      }
    } catch (error) {
      console.error('Error saving paper:', error);
      alert('Error saving paper');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (paper) => {
    setEditingPaper(paper);
    setFormData({
      name: paper.name,
      dateUpdate: paper.dateUpdate.split('T')[0], // Format date for input
      assignee: paper.assignee,
      paperWork: null // Reset file input for editing
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (paperId) => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/papers/${paperId}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Paper deleted successfully!');
          fetchPapers(); // Refresh the list
        } else {
          alert(data.message || 'Failed to delete paper');
        }
      } catch (error) {
        console.error('Error deleting paper:', error);
        alert('Error deleting paper');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      name: '',
      dateUpdate: new Date().toISOString().split('T')[0],
      assignee: '',
      paperWork: null
    });
    setEditingPaper(null);
    setShowAddForm(false);
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        paperWork: file
      });
    }
  };

  // Handle file download
  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/papers/download/${fileUrl}`);
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

  // Get assignee avatar
  const getAssigneeAvatar = (assignee) => {
    const member = teamMembers.find(m => m.name === assignee);
    if (member) {
      return (
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${member.color}`}>
          <span className="text-sm font-medium text-white">{member.avatar}</span>
        </div>
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
        <User className="h-5 w-5 text-gray-500" />
      </div>
    );
  };

  // Summary stats
  const totalPapers = filteredPapers.length;
  const lastUpdated = filteredPapers.reduce((latest, paper) =>
    !latest || paper.dateUpdate > latest ? new Date(paper.dateUpdate).toLocaleDateString() : latest, null
  );
  const uniqueAssignees = [...new Set(filteredPapers.map(p => p.assignee))].length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Paper Management
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
          {!loading && filteredPapers.length > 0 && (
            <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Papers</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalPapers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Assignees</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{uniqueAssignees}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                      {lastUpdated || '-'}
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
                Papers
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingPaper(null);
                  setFormData({
                    name: '',
                    dateUpdate: new Date().toISOString().split('T')[0],
                    assignee: '',
                    paperWork: null
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Paper
              </button>
            </div>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, assignee, or file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Assignees</option>
                  {teamMembers.map(member => (
                    <option key={member._id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingPaper ? 'Edit Paper' : 'Add Paper'}
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
                    Paper Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter paper name..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Updated *
                  </label>
                  <input
                    type="date"
                    value={formData.dateUpdate}
                    onChange={e => setFormData({ ...formData, dateUpdate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignee *
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loadingUsers}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading users...' : 'Select Assignee'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload File
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData.paperWork && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.paperWork.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(formData.paperWork.size / (1024 * 1024)).toFixed(1)} MB
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
                    {submitting ? 'Saving...' : (editingPaper ? 'Update' : 'Save')} Paper
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Papers Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading papers...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPapers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No papers found.
                        </td>
                      </tr>
                    ) : (
                      filteredPapers.map((paper) => (
                        <tr key={paper._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {paper.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Created: {new Date(paper.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {new Date(paper.dateUpdate).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getAssigneeAvatar(paper.assignee)}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{paper.assignee}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {teamMembers.find(m => m.name === paper.assignee)?.email || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {paper.paperWork?.originalName ? (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                  {paper.paperWork.originalName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({paper.paperWork.size})
                                </span>
                                <button
                                  onClick={() => handleDownload(paper.paperWork.filename, paper.paperWork.originalName)}
                                  className="ml-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No file</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(paper)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(paper._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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

export default Paper;