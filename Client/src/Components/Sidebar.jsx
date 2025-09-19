import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FolderOpen,
  Users,
  FileText,
  Calendar,
  BookOpen,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  UserSearch,
} from 'lucide-react';

export default function Sidebar({ onToggle }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      description: 'Overview and stats'
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: Users,
      description: 'Track attendance'
    },
    {
      name: 'Studentlist',
      path: '/students',
      icon: UserSearch,
      description: 'Student details of IPS'
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: FolderOpen,
      description: 'Manage projects'
    },
    {
      name: 'Event Reports',
      path: '/event-reports',
      icon: BarChart3,
      description: 'View event analytics'
    },
    {
      name: 'Papers',
      path: '/papers',
      icon: FileText,
      description: 'Research papers'
    },
    {
      name: 'Meeting Notes',
      path: '/meeting-notes',
      icon: MessageSquare,
      description: 'Meeting documentation'
    },
    {
      name: 'Blogs',
      path: '/blogs',
      icon: BookOpen,
      description: 'Blog posts'
    }
  ];

  return (
    <aside className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-64'}
      bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      shadow-sm
    `}>
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Navigation
          </h2>
        )}
        <button
          onClick={handleToggle}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700
                     text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
                           (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    group flex items-center px-3 py-2.5 transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className={`
                    h-5 w-5 flex-shrink-0 transition-colors duration-200
                    ${isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                    }
                  `} />

                  {!isCollapsed && (
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Project Management System
          </div>
        </div>
      )}
    </aside>
  );
}
