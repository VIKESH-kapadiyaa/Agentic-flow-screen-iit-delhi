import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';

// ─── Context ────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ───────────────────────────────────────────────
export const AuthProvider = ({ children, adapter }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true by default to prevent flash

  // Bootstrap: check for existing session on mount
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { session } = await adapter.getSession();
        if (!cancelled) {
          setUser(session?.user || null);
        }
      } catch (err) {
        console.error('[AuthProvider] bootstrap error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();

    // Listen for auth state changes (login/logout in other tabs, token refresh)
    const { unsubscribe } = adapter.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [adapter]);

  // ─── Auth Methods (pass-through to adapter, with state sync) ───

  const signUp = useCallback(async (data) => {
    const result = await adapter.signUp(data);
    if (result.user && !result.error) {
      setUser(result.user);
    }
    return result;
  }, [adapter]);

  const signIn = useCallback(async (credentials) => {
    const result = await adapter.signIn(credentials);
    if (result.user && !result.error) {
      setUser(result.user);
    }
    return result;
  }, [adapter]);

  const signInWithProvider = useCallback(async (provider) => {
    return adapter.signInWithProvider(provider);
  }, [adapter]);

  const signOut = useCallback(async () => {
    const result = await adapter.signOut();
    if (!result.error) {
      setUser(null);
    }
    return result;
  }, [adapter]);

  const getProfile = useCallback(async (userId) => {
    return adapter.getProfile(userId);
  }, [adapter]);

  const updateProfile = useCallback(async (userId, data) => {
    return adapter.updateProfile(userId, data);
  }, [adapter]);

  const getAccessToken = useCallback(async () => {
    return adapter.getAccessToken();
  }, [adapter]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    getProfile,
    updateProfile,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used within an <AuthProvider>');
  }
  return context;
};

// ─── Protected Route ────────────────────────────────────────
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Verifying Session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};
