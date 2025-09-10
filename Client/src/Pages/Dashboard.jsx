import { useAuth } from '../Context/AuthContent';
import { logOut } from '../Config/firebase';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getSignInProvider = () => {
    if (currentUser?.providerData) {
      const provider = currentUser.providerData[0]?.providerId;
      switch (provider) {
        case 'google.com':
          return 'Google';
        case 'password':
          return 'Email/Password';
        default:
          return 'Unknown';
      }
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-zinc-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              User Profile Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Picture and Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                        {userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {userProfile?.displayName || 'No name provided'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {userProfile?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      First Name:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {userProfile?.givenName || 'Not provided'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      Last Name:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {userProfile?.familyName || 'Not provided'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      Sign-in Provider:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {getSignInProvider()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      User ID:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono">
                      {userProfile?.uid}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      Email Verified:
                    </span>
                    <span className={`text-sm font-medium ${
                      userProfile?.emailVerified 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {userProfile?.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      Phone Number:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {userProfile?.phoneNumber || 'Not provided'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      Account Created:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {userProfile?.creationTime ? 
                        new Date(userProfile.creationTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      Last Sign-in:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {userProfile?.lastSignInTime ? 
                        new Date(userProfile.lastSignInTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Data (for development purposes) */}
            <div className="mt-8">
              <details className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300">
                  View Raw Profile Data (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-800 dark:text-gray-200 overflow-auto">
                  {JSON.stringify(userProfile, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;