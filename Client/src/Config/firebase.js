// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Your Firebase config object (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyCoWi-yR8MzgaG7pNIZRiOqnat2ld7E134",
  authDomain: "project-management-c479f.firebaseapp.com",
  projectId: "project-management-c479f",
  storageBucket: "project-management-c479f.firebasestorage.app",
  messagingSenderId: "676315094347",
  appId: "1:676315094347:web:f240d8007bf5e802041cce",
  measurementId: "G-NE7BSHH6E5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider (optional)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Backend API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    console.log('Attempting Google sign-in with popup...');
    
    // Step 1: Firebase authentication
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Popup sign-in successful');
    
    const user = result.user;
    console.log('Google auth successful, checking email authorization');

    // Step 2: Check if email is authorized BEFORE proceeding
    try {
      await apiCall('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      });

      // If we get here, the email is authorized
      console.log('Email authorized, proceeding with OAuth backend registration');
    } catch (apiError) {
      console.error('Error checking email authorization:', apiError);
      // Sign out from Firebase if email check fails
      await signOut(auth);
      
      // Re-throw the specific error message from the server
      if (apiError.message) {
        throw apiError;
      }
      throw new Error('Failed to verify email authorization. Please try again later.');
    }

    // Step 3: Email is authorized, proceed with backend registration
    const oauthData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      authProvider: 'google',
      providerData: user.providerData
    };

    console.log('Sending OAuth data to backend:', {
      uid: oauthData.uid,
      email: oauthData.email,
      displayName: oauthData.displayName
    });
    
    // Save/update user in backend
    const backendResponse = await apiCall('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify(oauthData)
    });

    // Store access token
    if (backendResponse.accessToken) {
      localStorage.setItem('accessToken', backendResponse.accessToken);
      console.log('Authentication complete, token stored');
    } else {
      console.error('No access token received from backend');
      await signOut(auth);
      localStorage.removeItem('accessToken');
      throw new Error('Authentication failed: No access token received');
    }

    return {
      firebaseResult: result,
      backendData: backendResponse
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    // Ensure user is signed out and no token exists if any error occurs
    if (error.message && error.message.includes('Access denied')) {
      await signOut(auth);
      localStorage.removeItem('accessToken');
    }
    throw error;
  }
};

export const logOut = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth);
    
    // Clear stored tokens
    localStorage.removeItem('accessToken');
    
    // Optional: Call backend logout endpoint
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await apiCall('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch {
        console.log('Backend logout failed, but continuing with client logout');
      }
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get user profile from backend
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await apiCall('/auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await apiCall('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }

    return response.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export default app;