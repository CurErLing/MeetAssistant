
import React, { useState, useEffect } from 'react';
import AuthenticatedApp from './AuthenticatedApp';
import { LoginPage } from './components/views/auth/LoginPage';
import { authService } from './services/authService';
import { Loader2 } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Define Guest User Object
  const guestUser = {
    id: '2025000001',
    email: 'guest@mock.com',
    user_metadata: {
      full_name: '访客用户'
    }
  };

  useEffect(() => {
    // 1. Check for existing session on mount
    const initSession = async () => {
      try {
        const { data: { session } } = await authService.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null); // No session -> Show Login Page
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Listen for auth state changes (login/logout)
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else if (!user || user.email !== guestUser.email) {
        // Only reset to null if we are not already in explicit guest mode
        // (This prevents auth state change from clearing guest mode unnecessarily)
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGuestLogin = () => {
    setUser(guestUser);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(session) => setUser(session.user)} onGuestLogin={handleGuestLogin} />;
  }

  return <AuthenticatedApp user={user} onLogout={handleLogout} />;
};

export default App;
