'use client';

import { authService } from '@/lib/services/auth-service';
import { Role, User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Use User type from lib/types
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<any>;
  verifyEmail: (data: { email: string; otp: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check auth on mount
  // Check auth on mount & listen for storage events (cross-tab sync)
  useEffect(() => {
    checkAuth();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === 'probd_user') {
        // If token/user removed -> Logout
        if (!event.newValue) {
           setUser(null);
           router.push('/login');
        } else {
           // If updated -> Re-check auth
           checkAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkAuth = async () => {
    try {
      // 1. Optimistic Hydration
      const storedUser = authService.getSession();
      if (storedUser) {
        setUser(storedUser);
      }

      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // 2. Verify with Backend
        const res = await authService.getProfile();
        
        if (res.success && res.data) {
           setUser(res.data.user || res.data);
        }
      }
    } catch (error: any) {
      console.error('Session validation failed:', error);
      // Only logout if it's an authentication error (401)
      if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('probd_user');
          setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: any) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      if (res.success) {
        setUser(res.data.user);
        if (res.data.user.role === Role.USER) {
           router.push('/');
        } else {
           router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error; // Let UI handle error display
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    // Just initiates the OTP flow
    return await authService.register(data); 
  };

  const verifyEmail = async (data: { email: string; otp: string }) => {
    setLoading(true);
    try {
      const res = await authService.verify(data);
      if (res.success) {
        setUser(res.data.user);
        // Smart Redirect
        if (res.data.user.role === Role.USER) {
           router.push('/');
        } else {
           router.push('/dashboard');
        }
      }
    } catch (error: any) {
       console.error('Verification failed:', error);
       throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    router.push('/');
    setTimeout(() => setUser(null), 100);
  };

  const switchRole = async (role: Role) => {
    const updatedUser = await authService.switchRole(role);
    setUser(updatedUser);
  };

  const refreshSession = () => {
    const session = authService.getSession();
    setUser(session);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  // Return default values during SSR or if provider is missing
  if (context === undefined) {
    return {
      user: null,
      loading: false,
      login: async () => {},
      register: async () => {},
      verifyEmail: async () => {},
      logout: () => {},
      checkAuth: async () => {},
    };
  }
  
  return context;
}
