// ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContent';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [tokenReady, setTokenReady] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('accessToken');
      console.log('ProtectedRoute: Checking token...', !!token);
      
      if (currentUser && token) {
        setTokenReady(true);
        setCheckingToken(false);
      } else if (currentUser && !token) {
        // User is authenticated with Firebase but no backend token yet
        // Wait a bit more for the OAuth flow to complete
        setTimeout(checkToken, 500);
      } else {
        setCheckingToken(false);
      }
    };

    if (!loading) {
      checkToken();
    }

    // Listen for storage events (when token is stored)
    const handleStorageChange = () => {
      const token = localStorage.getItem('accessToken');
      if (token && currentUser) {
        setTokenReady(true);
        setCheckingToken(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser, loading]);

  if (loading || checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {loading ? 'Loading...' : 'Completing authentication...'}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!tokenReady) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;