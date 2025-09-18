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

  // Form state for adding/editing papers
  const [formData, setFormData] = useState({
    name: '',
    dateUpdate: new Date().toISOString().split('T')[0],
    assignee: '',
    paperWork: null
  });

  // Mock team members for assignee dropdown
  const teamMembers = [
    { id: 1, name: 'John Doe', email: 'john@company.com', avatar: 'JD', color: 'bg-blue-500' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', avatar: 'JS', color: 'bg-green-500' },
    { id: 3, name: 'Mike Wilson', email: 'mike@company.com', avatar: 'MW', color: 'bg-purple-500' },
    { id: 4, name: 'Sarah Johnson', email: 'sarah@company.com', avatar: 'SJ', color: 'bg-pink-500' },
    { id: 5, name: 'David Brown', email: 'david@company.com', avatar: 'DB', color: 'bg-indigo-500' },
    { id: 6, name: 'Lisa Anderson', email: 'lisa@company.com', avatar: 'LA', color: 'bg-yellow-500' },
    { id: 7, name: 'Alex Rodriguez', email: 'alex@company.com', avatar: 'AR', color: 'bg-red-500' }
  ];

  // Mock data for papers
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPapers([
        {
          id: 1,
          name: 'Research Paper - AI Implementation',
          dateUpdate: '2025-09-16',
          assignee: 'John Doe',
          paperWork: { name: 'ai_implementation_research.pdf', size: '3.2 MB' },
          createdDate: '2025-09-01'
        },
        {
          id: 2,
          name: 'Technical Documentation - Database Design',
          dateUpdate: '2025-09-14',
          assignee: 'Jane Smith',
          paperWork: { name: 'database_design_doc.docx', size: '2.1 MB' },
          createdDate: '2025-09-02'
        },
        {
          id: 3,
          name: 'Project Proposal - Mobile Application',
          dateUpdate: '2025-09-12',
          assignee: 'Mike Wilson',
          paperWork: { name: 'mobile_app_proposal.pdf', size: '1.8 MB' },
          createdDate: '2025-08-25'
        },
        {
          id: 4,
          name: 'Analysis Report - Market Research',
          dateUpdate: '2025-09-15',
          assignee: 'Sarah Johnson',
          paperWork: { name: 'market_research_analysis.xlsx', size: '4.5 MB' },
          createdDate: '2025-09-05'
        },
        {
          id: 5,
          name: 'White Paper - Security Best Practices',
          dateUpdate: '2025-09-13',
          assignee: 'David Brown',
          paperWork: { name: 'security_whitepaper.pdf', size: '2.7 MB' },
          createdDate: '2025-08-30'
        },
        {
          id: 6,
          name: 'Case Study - User Experience Design',
          dateUpdate: '2025-09-10',
          assignee: 'Lisa Anderson',
          paperWork: { name: 'ux_case_study.pdf', size: '2.9 MB' },
          createdDate: '2025-08-28'
        },
        {
          id: 7,
          name: 'Presentation - Project Kickoff',
          dateUpdate: '2025-09-11',
          assignee: 'Alex Rodriguez',
          paperWork: { name: 'kickoff_presentation.pptx', size: '5.1 MB' },
          createdDate: '2025-09-03'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // Filtered papers
  const filteredPapers = papers.filter(paper => {
    const matchesSearch =
      paper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paper.paperWork?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee =
      filterAssignee === 'all' || paper.assignee === filterAssignee;
    return matchesSearch && matchesAssignee;
  });

  // Handle add/edit form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.assignee || !formData.paperWork) {
      alert('Please fill all required fields.');
      return;
    }
    if (editingPaper) {
      setPapers(papers.map(p =>
        p.id === editingPaper.id
          ? {
              ...p,
              name: formData.name,
              dateUpdate: formData.dateUpdate,
              assignee: formData.assignee,
              paperWork: formData.paperWork
            }
          : p
      ));
    } else {
      setPapers([
        ...papers,
        {
          id: papers.length + 1,
          name: formData.name,
          dateUpdate: formData.dateUpdate,
          assignee: formData.assignee,
          paperWork: formData.paperWork,
          createdDate: new Date().toISOString().split('T')[0]
        }
      ]);
    }
    setShowAddForm(false);
    setEditingPaper(null);
    setFormData({
      name: '',
      dateUpdate: new Date().toISOString().split('T')[0],
      assignee: '',
      paperWork: null
    });
  };

  // Handle edit
  const handleEdit = (paper) => {
    setEditingPaper(paper);
    setFormData({
      name: paper.name,
      dateUpdate: paper.dateUpdate,
      assignee: paper.assignee,
      paperWork: paper.paperWork
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = (paperId) => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      setPapers(papers.filter(p => p.id !== paperId));
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        paperWork: {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        }
      });
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
    !latest || paper.dateUpdate > latest ? paper.dateUpdate : latest, null
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
                    <option key={member.id} value={member.name}>{member.name}</option>
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
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPaper(null);
                    setFormData({
                      name: '',
                      dateUpdate: new Date().toISOString().split('T')[0],
                      assignee: '',
                      paperWork: null
                    });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Paper Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Updated
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
                    Assignee
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Assignee</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name} ({member.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload File
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData.paperWork && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.paperWork.name} ({formData.paperWork.size})
                      </span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPaper(null);
                      setFormData({
                        name: '',
                        dateUpdate: new Date().toISOString().split('T')[0],
                        assignee: '',
                        paperWork: null
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Save className="h-4 w-4" />
                    {editingPaper ? 'Update' : 'Save'}
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
                        <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {paper.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Created: {paper.createdDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-900 dark:text-white">{paper.dateUpdate}</span>
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
                            {paper.paperWork ? (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-blue-600 dark:text-blue-400">{paper.paperWork.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">({paper.paperWork.size})</span>
                                <button
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
                              onClick={() => handleDelete(paper.id)}
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

          {/* Summary Stats */}
          {!loading && filteredPapers.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </main>
    </div>
  );
};

export default Paper;