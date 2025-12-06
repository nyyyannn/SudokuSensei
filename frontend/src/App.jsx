import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Game from './components/Game';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (retryCount = 0) => {
    try {
      console.log('Checking authentication...');
      const response = await fetch(`${API_BASE}/api/auth/check`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Auth check failed with status:', response.status);
        if (retryCount < 2) {
          console.log(`Retrying auth check (${retryCount + 1}/2)...`);
          setTimeout(() => checkAuth(retryCount + 1), 1000);
          return;
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('Auth check response:', data);

      if (data.authenticated && data.user) {
        console.log('User authenticated:', data.user.name);
        setUser(data.user);
      } else {
        console.log('User not authenticated');
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      if (retryCount < 2) {
        console.log(`Retrying auth check due to error (${retryCount + 1}/2)...`);
        setTimeout(() => checkAuth(retryCount + 1), 1000);
        return;
      }
      // Don't set user to null on network errors, just stop loading
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return <Game user={user} onLogout={handleLogout} />;
}

export default App;
