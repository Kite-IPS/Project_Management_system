import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  Target,
  TrendingUp,
  Activity,
  X,
  Save
} from 'lucide-react';

const Project = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Form state for adding/editing projects
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [],
    dueDate: '',
    status: 'To Do'
  });

  // Mock data for projects
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern UI/UX design',
      status: 'In Progress',
      assignees: ['John Doe', 'Jane Smith'],
      dueDate: '2025-10-15',
      createdDate: '2025-09-01'
    },
    {
      id: 2,
      title: 'Mobile App Development',
      description: 'Develop iOS and Android mobile application',
      status: 'To Do',
      assignees: ['Jane Smith', 'Mike Wilson', 'Alex Rodriguez'],
      dueDate: '2025-12-01',
      createdDate: '2025-09-10'
    },
    {
      id: 3,
      title: 'Database Optimization',
      description: 'Improve database performance and implement caching',
      status: 'Done',
      assignees: ['Mike Wilson'],
      dueDate: '2025-09-30',
      createdDate: '2025-08-15'
    },
    {
      id: 4,
      title: 'API Documentation',
      description: 'Create comprehensive API documentation for developers',
      status: 'In Progress',
      assignees: ['Sarah Johnson', 'David Brown'],
      dueDate: '2025-10-20',
      createdDate: '2025-09-05'
    },
    {
      id: 5,
      title: 'Security Audit',
      description: 'Conduct comprehensive security audit of all systems',
      status: 'To Do',
      assignees: ['David Brown', 'Chris Taylor'],
      dueDate: '2025-11-15',
      createdDate: '2025-09-12'
    },
    {
      id: 6,
      title: 'User Training Materials',
      description: 'Develop training materials and user guides',
      status: 'Review',
      assignees: ['Lisa Anderson', 'Emma Thompson', 'Maya Patel'],
      dueDate: '2025-10-25',
      createdDate: '2025-08-20'
    }
  ]);

  // Mock team members for assignee dropdown
  const teamMembers = [
    { id: 1, name: 'John Doe', email: 'john@company.com', avatar: 'JD', color: 'bg-blue-500' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', avatar: 'JS', color: 'bg-green-500' },
    { id: 3, name: 'Mike Wilson', email: 'mike@company.com', avatar: 'MW', color: 'bg-purple-500' },
    { id: 4, name: 'Sarah Johnson', email: 'sarah@company.com', avatar: 'SJ', color: 'bg-pink-500' },
    { id: 5, name: 'David Brown', email: 'david@company.com', avatar: 'DB', color: 'bg-indigo-500' },
    { id: 6, name: 'Lisa Anderson', email: 'lisa@company.com', avatar: 'LA', color: 'bg-yellow-500' },
    { id: 7, name: 'Alex Rodriguez', email: 'alex@company.com', avatar: 'AR', color: 'bg-red-500' },
    { id: 8, name: 'Emma Thompson', email: 'emma@company.com', avatar: 'ET', color: 'bg-teal-500' },
    { id: 9, name: 'Ryan Kim', email: 'ryan@company.com', avatar: 'RK', color: 'bg-orange-500' },
    { id: 10, name: 'Sophia Martinez', email: 'sophia@company.com', avatar: 'SM', color: 'bg-cyan-500' },
    { id: 11, name: 'Chris Taylor', email: 'chris@company.com', avatar: 'CT', color: 'bg-lime-500' },
    { id: 12, name: 'Maya Patel', email: 'maya@company.com', avatar: 'MP', color: 'bg-rose-500' }
  ];

  // Kanban columns
  const columns = [
    { id: 'To Do', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'In Progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'Review', title: 'Review', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'Done', title: 'Done', color: 'bg-green-50 dark:bg-green-900/20' }
  ];

  // Calculate project statistics
  const projectStats = {
    total: projects.length,
    ongoing: projects.filter(p => p.status === 'In Progress').length,
    pending: projects.filter(p => p.status === 'To Do').length,
    completed: projects.filter(p => p.status === 'Done').length,
    review: projects.filter(p => p.status === 'Review').length,
    overdue: projects.filter(p => new Date(p.dueDate) < new Date() && p.status !== 'Done').length
  };

  // Filter projects based on search and filter
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.assignees.some(assignee => assignee.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === 'all' || 
                         project.status.toLowerCase() === filterStatus.toLowerCase() ||
                         (filterStatus === 'overdue' && new Date(project.dueDate) < new Date() && project.status !== 'Done');

    return matchesSearch && matchesFilter;
  });

  // Get assignee info
  const getAssigneeInfo = (assigneeName) => {
    return teamMembers.find(member => member.name === assigneeName);
  };

  // Handle drag start
  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedProject && draggedProject.status !== newStatus) {
      setProjects(projects.map(project =>
        project.id === draggedProject.id
          ? { ...project, status: newStatus }
          : project
      ));
    }
    setDraggedProject(null);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || formData.assignees.length === 0) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingProject) {
      // Update existing project
      setProjects(projects.map(project =>
        project.id === editingProject.id
          ? {
              ...project,
              ...formData
            }
          : project
      ));
    } else {
      // Add new project
      const newProject = {
        id: Math.max(...projects.map(p => p.id)) + 1,
        ...formData,
        createdDate: new Date().toISOString().split('T')[0],
        progress: 0
      };
      setProjects([...projects, newProject]);
    }

    // Reset form
    handleCancel();
  };

  // Handle edit
  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      assignees: project.assignees,
      dueDate: project.dueDate,
      status: project.status
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(project => project.id !== projectId));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      assignees: [],
      dueDate: '',
      status: 'To Do'
    });
    setEditingProject(null);
    setShowAddForm(false);
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
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main Content */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{projectStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ongoing</p>
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{projectStats.ongoing}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{projectStats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{projectStats.completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Review</p>
                  <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{projectStats.review}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{projectStats.overdue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Project Board
              </h2>

              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </button>
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
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Projects</option>
                  <option value="to do">To Do</option>
                  <option value="in progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add/Edit Project Form */}
          {showAddForm && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
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
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project title..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project description..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Team Members * (Select multiple)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700">
                    {teamMembers.map(member => (
                      <label key={member.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.assignees.includes(member.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, assignees: [...formData.assignees, member.name]});
                            } else {
                              setFormData({...formData, assignees: formData.assignees.filter(name => name !== member.name)});
                            }
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className={`h-8 w-8 ${member.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-sm font-medium">{member.avatar}</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">{member.email}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {formData.assignees.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Selected Team Members ({formData.assignees.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.assignees.map(assigneeName => {
                          const member = teamMembers.find(m => m.name === assigneeName);
                          return member ? (
                            <div key={assigneeName} className="flex items-center space-x-2 bg-white dark:bg-gray-700 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm">
                              <div className={`h-6 w-6 ${member.color} rounded-full flex items-center justify-center`}>
                                <span className="text-white text-xs font-bold">{member.avatar}</span>
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">{member.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({...formData, assignees: formData.assignees.filter(name => name !== member.name)});
                                }}
                                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {formData.assignees.length === 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Please select at least one team member
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    {columns.map(column => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
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
                    {editingProject ? 'Update' : 'Create'} Project
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map(column => (
              <div
                key={column.id}
                className={`${column.color} rounded-lg p-4 min-h-96`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {column.title}
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                    {filteredProjects.filter(p => p.status === column.id).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredProjects
                    .filter(project => project.status === column.id)
                    .map(project => (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, project)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {project.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEdit(project)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                            >
                              <Edit className="h-3 w-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {project.description}
                        </p>

                        {/* Enhanced Assignees Display */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Team ({project.assignees.length})
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {project.assignees.slice(0, 3).map(assigneeName => {
                              const assigneeInfo = getAssigneeInfo(assigneeName);
                              return assigneeInfo ? (
                                <div
                                  key={assigneeName}
                                  className={`h-6 w-6 ${assigneeInfo.color} rounded-full flex items-center justify-center`}
                                  title={assigneeInfo.name}
                                >
                                  <span className="text-white text-xs font-medium">
                                    {assigneeInfo.avatar}
                                  </span>
                                </div>
                              ) : (
                                <div
                                  key={assigneeName}
                                  className="h-6 w-6 bg-gray-500 rounded-full flex items-center justify-center"
                                  title={assigneeName}
                                >
                                  <span className="text-white text-xs font-medium">
                                    {assigneeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                              );
                            })}
                            
                            {project.assignees.length > 3 && (
                              <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  +{project.assignees.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Show all assignee names */}
                          {/* <div className="mt-1">
                            <div className="flex flex-wrap gap-1">
                              {project.assignees.map(assigneeName => (
                                <span
                                  key={assigneeName}
                                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                                >
                                  {assigneeName}
                                </span>
                              ))}
                            </div>
                          </div> */}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created</span>
                          </div>
                          {project.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span className={new Date(project.dueDate) < new Date() && project.status !== 'Done' ? 'text-red-500' : ''}>
                                Due {new Date(project.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Project;