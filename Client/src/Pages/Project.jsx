import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, Search, Plus, Filter, LayoutGrid, Table as TableIcon,
  ChevronUp, ChevronDown, Edit, Trash2, MoreHorizontal, Target, Activity, Clock, CheckCircle, TrendingUp, AlertTriangle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Project = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewType, setViewType] = useState('kanban');
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Form state for adding/editing projects
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [],
    startDate: '',
    dueDate: '',
    status: 'To Do',
    paperwork: '',
    repoLink: '',
    priority: 'Medium'
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Mock data for projects with additional fields
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern UI/UX design',
      status: 'In Progress',
      assignees: ['John Doe', 'Jane Smith'],
      startDate: '2025-09-01',
      dueDate: '2025-10-15',
      createdDate: '2025-09-01',
      paperwork: 'Project Charter Approved',
      repoLink: 'https://github.com/company/website-redesign',
      priority: 'High',
      progress: 65
    },
    {
      id: 2,
      title: 'Mobile App Development',
      description: 'Develop iOS and Android mobile application',
      status: 'To Do',
      assignees: ['Jane Smith', 'Mike Wilson', 'Alex Rodriguez'],
      startDate: '2025-10-01',
      dueDate: '2025-12-01',
      createdDate: '2025-09-10',
      paperwork: '',
      repoLink: 'https://github.com/company/mobile-app',
      priority: 'High',
      progress: 0
    },
    {
      id: 3,
      title: 'Database Optimization',
      description: 'Improve database performance and implement caching',
      status: 'Done',
      assignees: ['Mike Wilson'],
      startDate: '2025-08-15',
      dueDate: '2025-09-30',
      createdDate: '2025-08-15',
      paperwork: 'Performance Report Submitted',
      repoLink: 'https://github.com/company/db-optimization',
      priority: 'Medium',
      progress: 100
    },
    {
      id: 4,
      title: 'API Documentation',
      description: 'Create comprehensive API documentation for developers',
      status: 'In Progress',
      assignees: ['Sarah Johnson', 'David Brown'],
      startDate: '2025-09-05',
      dueDate: '2025-10-20',
      createdDate: '2025-09-05',
      paperwork: 'Documentation Plan',
      repoLink: 'https://github.com/company/api-docs',
      priority: 'Medium',
      progress: 45
    },
    {
      id: 5,
      title: 'Security Audit',
      description: 'Conduct comprehensive security audit of all systems',
      status: 'To Do',
      assignees: ['David Brown', 'Chris Taylor'],
      startDate: '2025-10-15',
      dueDate: '2025-11-15',
      createdDate: '2025-09-12',
      paperwork: '',
      repoLink: '',
      priority: 'High',
      progress: 0
    },
    {
      id: 6,
      title: 'User Training Materials',
      description: 'Develop training materials and user guides',
      status: 'Review',
      assignees: ['Lisa Anderson', 'Emma Thompson', 'Maya Patel'],
      startDate: '2025-08-20',
      dueDate: '2025-10-25',
      createdDate: '2025-08-20',
      paperwork: 'Training Outline Approved',
      repoLink: 'https://github.com/company/training-materials',
      priority: 'Low',
      progress: 85
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

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.assignees.some(assignee => assignee.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = filterStatus === 'all' || 
                           project.status.toLowerCase() === filterStatus.toLowerCase() ||
                           (filterStatus === 'overdue' && new Date(project.dueDate) < new Date() && project.status !== 'Done');

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const key = sortConfig.key;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      if (key === 'assignees') {
        return direction * a[key].join(', ').localeCompare(b[key].join(', '));
      }
      if (key === 'startDate' || key === 'dueDate') {
        const dateA = new Date(a[key] || '9999-12-31');
        const dateB = new Date(b[key] || '9999-12-31');
        return direction * (dateA - dateB);
      }
      return direction * String(a[key]).localeCompare(String(b[key]));
    });

  // Get assignee info
  const getAssigneeInfo = (assigneeName) => {
    return teamMembers.find(member => member.name === assigneeName);
  };

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'Review':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Project title is required';
    }
    
    if (formData.assignees.length === 0) {
      errors.assignees = 'At least one team member must be assigned';
    }
    
    if (formData.startDate && formData.dueDate && new Date(formData.startDate) > new Date(formData.dueDate)) {
      errors.dueDate = 'Due date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
    
    if (!validateForm()) {
      return;
    }

    if (editingProject) {
      setProjects(projects.map(project =>
        project.id === editingProject.id
          ? { ...project, ...formData }
          : project
      ));
    } else {
      const newProject = {
        id: Math.max(...projects.map(p => p.id)) + 1,
        ...formData,
        createdDate: new Date().toISOString().split('T')[0],
        progress: 0
      };
      setProjects([...projects, newProject]);
    }

    handleCancel();
  };

  // Handle edit
  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      assignees: project.assignees,
      startDate: project.startDate,
      dueDate: project.dueDate,
      status: project.status,
      paperwork: project.paperwork || '',
      repoLink: project.repoLink || '',
      priority: project.priority || 'Medium'
    });
    setFormErrors({});
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
      startDate: '',
      dueDate: '',
      status: 'To Do',
      paperwork: '',
      repoLink: '',
      priority: 'Medium'
    });
    setEditingProject(null);
    setShowAddForm(false);
    setFormErrors({});
  };

  // Handle project click for details
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Kanban Card Component
  const KanbanCard = ({ project }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, project)}
      onClick={() => handleProjectClick(project)}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200 mb-3"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
          {project.title}
        </h4>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(project);
            }}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(project.id);
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {project.description}
      </p>
      
      {project.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
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
      </div>
    </div>
  );

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
          {/* Controls Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewType('kanban')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    viewType === 'kanban' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setViewType('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    viewType === 'table' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <TableIcon className="h-5 w-5" />
                  <span>Table</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingProject(null);
                  setFormData({
                    title: '',
                    description: '',
                    assignees: [],
                    startDate: '',
                    dueDate: '',
                    status: 'To Do',
                    paperwork: '',
                    repoLink: '',
                    priority: 'Medium'
                  });
                }}
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
                <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{projectStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ongoing</p>
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{projectStats.ongoing}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{projectStats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{projectStats.completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Review</p>
                  <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{projectStats.review}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{projectStats.overdue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kanban Board View */}
          {viewType === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {columns.map(column => (
                <div
                  key={column.id}
                  className={`${column.color} rounded-lg p-4 min-h-[500px]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {column.title}
                    </h3>
                    <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full px-2 py-1 text-xs font-medium">
                      {filteredProjects.filter(project => project.status === column.id).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {filteredProjects
                      .filter(project => project.status === column.id)
                      .map(project => (
                        <KanbanCard key={project.id} project={project} />
                      ))}
                  </div>
                  {filteredProjects.filter(project => project.status === column.id).length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-sm">No projects in {column.title.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewType === 'table' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {[ 
                        { key: 'title', label: 'Project Title' },
                        { key: 'status', label: 'Status' },
                        { key: 'priority', label: 'Priority' },
                        { key: 'assignees', label: 'Team Members' },
                        { key: 'startDate', label: 'Start Date' },
                        { key: 'dueDate', label: 'Due Date' },
                        { key: 'progress', label: 'Progress' },
                        { key: 'actions', label: 'Actions' }
                      ].map(column => (
                        <th
                          key={column.key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => column.key !== 'actions' && handleSort(column.key)}
                        >
                          <div className="flex items-center">
                            {column.label}
                            {column.key !== 'actions' && sortConfig.key === column.key && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No projects found
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map(project => (
                        <tr key={project.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            <span
                              className="cursor-pointer underline"
                              onClick={() => handleProjectClick(project)}
                            >
                              {project.title}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex items-center text-gray-900 dark:text-white">{getStatusIcon(project.status)}<span className="ml-1">{project.status}</span></td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                              {project.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            <div className="flex items-center gap-1">
                              {project.assignees.slice(0, 2).map(a => {
                                const assignee = getAssigneeInfo(a);
                                return assignee ? (
                                  <div key={a} className={`h-6 w-6 ${assignee.color} rounded-full flex items-center justify-center`} title={assignee.name}>
                                    <span className="text-white text-xs font-bold">{assignee.avatar}</span>
                                  </div>
                                ) : null;
                              })}
                              {project.assignees.length > 2 && (
                                <span className="text-xs text-gray-400">+{project.assignees.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{project.startDate}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{project.dueDate}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{project.progress}%</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(project)} className="text-blue-500 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDelete(project.id)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                              <button onClick={() => handleProjectClick(project)} className="text-gray-500 hover:text-gray-600"><MoreHorizontal className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add/Edit Project Modal */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingProject ? 'Edit Project' : 'Add Project'}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 rounded-md border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignees</label>
                    <select
                      multiple
                      value={formData.assignees}
                      onChange={e => setFormData({ ...formData, assignees: Array.from(e.target.selectedOptions, opt => opt.value) })}
                      className={`w-full px-3 py-2 rounded-md border ${formErrors.assignees ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    {formErrors.assignees && <p className="text-xs text-red-500 mt-1">{formErrors.assignees}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className={`w-full px-3 py-2 rounded-md border ${formErrors.dueDate ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                      />
                      {formErrors.dueDate && <p className="text-xs text-red-500 mt-1">{formErrors.dueDate}</p>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paperwork</label>
                    <input
                      type="text"
                      value={formData.paperwork}
                      onChange={e => setFormData({ ...formData, paperwork: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repository Link</label>
                    <input
                      type="url"
                      value={formData.repoLink}
                      onChange={e => setFormData({ ...formData, repoLink: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
                      {editingProject ? 'Save Changes' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Project Details Modal */}
          {showProjectDetails && selectedProject && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowProjectDetails(false)}></div>
                
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {selectedProject.title}
                      </h3>
                      <button
                        onClick={() => setShowProjectDetails(false)}
                        className="rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedProject.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</h4>
                          <div className="flex items-center">
                            {getStatusIcon(selectedProject.status)}
                            <span className="ml-2 text-sm">{selectedProject.status}</span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedProject.priority)}`}>
                            {selectedProject.priority}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</h4>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedProject.dueDate ? new Date(selectedProject.dueDate).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedProject.progress !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress</h4>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${selectedProject.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedProject.progress}% complete</p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Members</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.assignees.map(assigneeName => {
                            const member = teamMembers.find(m => m.name === assigneeName);
                            return member ? (
                              <div key={assigneeName} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full">
                                <div className={`h-6 w-6 ${member.color} rounded-full flex items-center justify-center`}>
                                  <span className="text-white text-xs font-bold">{member.avatar}</span>
                                </div>
                                <span className="text-sm text-gray-900 dark:text-white">{member.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      
                      {(selectedProject.paperwork || selectedProject.repoLink) && (
                        <div className="grid grid-cols-1 gap-4">
                          {selectedProject.paperwork && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paperwork</h4>
                              <p className="text-sm text-gray-900 dark:text-white">{selectedProject.paperwork}</p>
                            </div>
                          )}
                          
                          {selectedProject.repoLink && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repository</h4>
                              <a
                                href={selectedProject.repoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Link className="h-4 w-4 mr-1" />
                                View Repository
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={() => {
                        handleEdit(selectedProject);
                        setShowProjectDetails(false);
                      }}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                    >
                      Edit Project
                    </button>
                    <button
                      onClick={() => setShowProjectDetails(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                    >
                      Close
                    </button>
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

export default Project;
