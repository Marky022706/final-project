// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';

export interface User {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  role: 'member' | 'admin';
  phone?: string;
  address?: string;
  member_since?: string;
  password?: string;
  stats?: {
    active_loans: number;
    total_loans: number;
    unpaid_fines: number;
    unread_notifications: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Initialize: Load user from storage and check session freshness
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('balingasag_user');
      const accessToken = localStorage.getItem('balingasag_access_token');

      if (storedUser && accessToken) {
        try {
          setUser(JSON.parse(storedUser));
          
          // Verify with server and fetch latest stats/fines
          const response = await api.get('/users/get');
          if (response.data && response.data.success) {
            const freshUser = response.data.data;
            setUser(freshUser);
            localStorage.setItem('balingasag_user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          // Don't log out immediately here; interceptor will handle token refreshes.
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen to expiration events from api.ts
    const handleAuthExpired = () => {
      setUser(null);
    };
    
    window.addEventListener('balingasag_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('balingasag_auth_expired', handleAuthExpired);
    };
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.success) {
        const { accessToken, refreshToken, user: loggedUser } = response.data.data;
        
        localStorage.setItem('balingasag_access_token', accessToken);
        localStorage.setItem('balingasag_refresh_token', refreshToken);
        localStorage.setItem('balingasag_user', JSON.stringify(loggedUser));
        
        setUser(loggedUser);
      } else {
        throw new Error(response.data.message || 'Login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoggingOut(true);
    const refreshToken = localStorage.getItem('balingasag_refresh_token');
    
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('Backend logout failed:', err);
    } finally {
      localStorage.removeItem('balingasag_access_token');
      localStorage.removeItem('balingasag_refresh_token');
      localStorage.removeItem('balingasag_user');
      setUser(null);
      setIsLoggingOut(false);
    }
  };

  // Re-fetch latest profile stats
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const response = await api.get('/users/get');
      if (response.data && response.data.success) {
        const freshUser = response.data.data;
        setUser(freshUser);
        localStorage.setItem('balingasag_user', JSON.stringify(freshUser));
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  // Update profile handler
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const response = await api.post('/users/update', { id: user.id, ...data });
      if (response.data && response.data.success) {
        await refreshProfile();
      } else {
        throw new Error(response.data.message || 'Profile update failed.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isLoggingOut,
        login,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
