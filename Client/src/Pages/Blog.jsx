import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
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

const Blog = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Form state for adding/editing blog posts
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    datePublished: new Date().toISOString().split('T')[0],
    links: []
  });

  // Mock authors for dropdown
  const [authors, setAuthors] = useState([]);

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch authors from API
  const fetchAuthors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/blogs/authors`);
      if (response.data.success) {
        setAuthors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  // Fetch blog posts from API
  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/blogs`, {
        params: {
          search: searchTerm,
          filter: filterStatus,
          limit: 100 // Get all posts for now
        }
      });

      if (response.data.success) {
        // Transform API data to match frontend expectations
        const transformedData = response.data.data.map((post, index) => ({
          id: post._id,
          sNo: index + 1,
          title: post.title,
          content: post.content,
          author: post.author?.name || 'Unknown Author',
          authorId: post.author?._id || null,
          datePublished: post.datePublished.split('T')[0], // Format date
          links: post.links || [],
          createdDate: post.createdAt?.split('T')[0] || post.datePublished.split('T')[0]
        }));
        setBlogPosts(transformedData);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else {
        alert('Failed to load blog posts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAuthors();
    fetchBlogPosts();
  }, []);

  // Refetch when search or filter changes
  useEffect(() => {
    fetchBlogPosts();
  }, [searchTerm, filterStatus]);

  // Filter blog posts based on search and filter
  const filteredBlogPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'recent' && new Date(post.datePublished) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

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
      const blogData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        author: formData.author,
        datePublished: formData.datePublished,
        links: formData.links.filter(link => link.title && link.url) // Filter out empty links
      };

      if (editingPost) {
        // Update existing post
        const response = await axios.put(`${API_BASE_URL}/blogs/${editingPost.id}`, blogData);
        
        if (response.data.success) {
          fetchBlogPosts(); // Refresh the list
          handleCancel();
          alert('Blog post updated successfully!');
        }
      } else {
        // Add new post
        const response = await axios.post(`${API_BASE_URL}/blogs`, blogData);
        
        if (response.data.success) {
          fetchBlogPosts(); // Refresh the list
          handleCancel();
          alert('Blog post created successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      
      let errorMessage = 'Error saving blog post. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  // Handle edit
  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      author: post.authorId || post.author, // Use authorId if available, fallback to author name
      datePublished: post.datePublished,
      links: post.links || []
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/blogs/${postId}`);
        
        if (response.data.success) {
          fetchBlogPosts(); // Refresh the list
          alert('Blog post deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting blog post:', error);
        alert('Error deleting blog post. Please try again.');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      title: '',
      content: '',
      author: '',
      datePublished: new Date().toISOString().split('T')[0],
      links: []
    });
    setEditingPost(null);
    setShowAddForm(false);
  };

  // Handle adding a link
  const handleAddLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { title: '', url: '' }]
    });
  };

  // Handle updating a link
  const handleUpdateLink = (index, field, value) => {
    const updatedLinks = formData.links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    setFormData({
      ...formData,
      links: updatedLinks
    });
  };

  // Handle removing a link
  const handleRemoveLink = (index) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index)
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
                Blog Management
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
          {!loading && filteredBlogPosts.length > 0 && (
            <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filteredBlogPosts.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {filteredBlogPosts.filter(p => new Date(p.datePublished).getMonth() === new Date().getMonth()).length}
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
                      {new Set(filteredBlogPosts.map(p => p.author)).size}
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
                Blog Posts Management
              </h2>

              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Blog Post
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blog posts..."
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
                  <option value="all">All Posts</option>
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
                  {editingPost ? 'Edit Blog Post' : 'Add New Blog Post'}
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
                    Blog Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter blog post title..."
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
                    placeholder="Enter blog post content..."
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

                {/* Links Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Related Links
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors duration-200"
                    >
                      <Plus className="h-3 w-3" />
                      Add Link
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Link title"
                            value={link.title}
                            onChange={(e) => handleUpdateLink(index, 'title', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={link.url}
                            onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(index)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                    {editingPost ? 'Update' : 'Save'} Post
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Blog Posts Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading blog posts...</span>
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
                        Date Published
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Links
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredBlogPosts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No blog posts found
                        </td>
                      </tr>
                    ) : (
                      filteredBlogPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {post.sNo}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                {post.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                                {post.content}
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
                                  {post.author}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(post.datePublished).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {post.links && post.links.length > 0 ? (
                                post.links.slice(0, 2).map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {link.title || 'Link'}
                                  </a>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No links</span>
                              )}
                              {post.links && post.links.length > 2 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{post.links.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(post)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(post.id)}
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

export default Blog;