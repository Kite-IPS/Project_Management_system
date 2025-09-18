import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
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

  // Form state for adding/editing event reports
  const [formData, setFormData] = useState({
    name: '',
    dateUpdated: new Date().toISOString().split('T')[0],
    createdBy: '',
    eventWork: null
  });

  // Mock team members for dropdown
  const teamMembers = [
    { id: 1, name: 'John Doe', email: 'john@company.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com' },
    { id: 3, name: 'Mike Wilson', email: 'mike@company.com' },
    { id: 4, name: 'Sarah Johnson', email: 'sarah@company.com' },
    { id: 5, name: 'David Brown', email: 'david@company.com' }
  ];

  // Mock data for event reports
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        sNo: 1,
        name: 'Annual Tech Conference Report',
        dateUpdated: '2025-09-15',
        createdBy: 'John Doe',
        eventWork: { name: 'tech_conference_report.pdf', size: '2.1 MB' },
        createdDate: '2025-09-01'
      },
      {
        id: 2,
        sNo: 2,
        name: 'Q3 Team Building Event',
        dateUpdated: '2025-09-10',
        createdBy: 'Jane Smith',
        eventWork: { name: 'team_building_summary.docx', size: '1.5 MB' },
        createdDate: '2025-09-05'
      },
      {
        id: 3,
        sNo: 3,
        name: 'Product Launch Event Analysis',
        dateUpdated: '2025-09-08',
        createdBy: 'Mike Wilson',
        eventWork: { name: 'product_launch_analysis.xlsx', size: '3.2 MB' },
        createdDate: '2025-08-20'
      },
      {
        id: 4,
        sNo: 4,
        name: 'Client Workshop Report',
        dateUpdated: '2025-09-12',
        createdBy: 'Sarah Johnson',
        eventWork: { name: 'client_workshop.pptx', size: '4.7 MB' },
        createdDate: '2025-09-02'
      },
      {
        id: 5,
        sNo: 5,
        name: 'Quarterly Review Meeting',
        dateUpdated: '2025-09-14',
        createdBy: 'David Brown',
        eventWork: { name: 'quarterly_review.pdf', size: '1.8 MB' },
        createdDate: '2025-09-10'
      }
    ];

    // Simulate loading
    const timer = setTimeout(() => {
      setEventReports(mockData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.createdBy) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingReport) {
      // Update existing report
      setEventReports(eventReports.map(report =>
        report.id === editingReport.id
          ? {
              ...report,
              name: formData.name,
              dateUpdated: formData.dateUpdated,
              createdBy: formData.createdBy,
              eventWork: formData.eventWork || report.eventWork
            }
          : report
      ));
    } else {
      // Add new report
      const newReport = {
        id: Math.max(...eventReports.map(r => r.id)) + 1,
        sNo: eventReports.length + 1,
        name: formData.name,
        dateUpdated: formData.dateUpdated,
        createdBy: formData.createdBy,
        eventWork: formData.eventWork || { name: 'No file attached', size: '0 MB' },
        createdDate: new Date().toISOString().split('T')[0]
      };
      setEventReports([...eventReports, newReport]);
    }

    // Reset form
    handleCancel();
  };

  // Handle edit
  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      dateUpdated: report.dateUpdated,
      createdBy: report.createdBy,
      eventWork: report.eventWork
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = (reportId) => {
    if (window.confirm('Are you sure you want to delete this event report?')) {
      setEventReports(eventReports.filter(report => report.id !== reportId));
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

  // Handle file upload simulation
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        eventWork: {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        }
      });
    }
  };

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
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
                  >
                    <option value="">Select Creator</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
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
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formData.eventWork.size}</p>
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
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Save className="h-4 w-4" />
                    {editingReport ? 'Update' : 'Save'} Report
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
                      filteredEventReports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {report.sNo}
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
                              <span className="text-lg">{getFileIcon(report.eventWork.name)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {report.eventWork.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {report.eventWork.size}
                                </div>
                              </div>
                              <button className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200">
                                <Download className="h-4 w-4 text-gray-500" />
                              </button>
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
                                onClick={() => handleDelete(report.id)}
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

          {/* Summary Stats */}
          {!loading && filteredEventReports.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </main>
    </div>
  );
};

export default EventReport;