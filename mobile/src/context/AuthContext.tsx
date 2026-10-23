import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  getMe as apiGetMe,
  clearAuthToken,
  initApiHost,
} from '../api/client';

export interface UserProfile {
  id: number;
  phone: string;
  created_at?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<{ message: string; mockOtp?: string }>;
  submitOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from stored token
  useEffect(() => {
    async function loadAuth() {
      try {
        await initApiHost();
        const storedToken = await AsyncStorage.getItem('@miniledger_jwt_token');
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await apiGetMe();
          setUser(currentUser);
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err);
        await clearAuthToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadAuth();
  }, []);

  const requestOtp = async (phone: string) => {
    const res = await apiSendOtp(phone);
    return {
      message: res.message || 'OTP sent successfully',
      mockOtp: res.mockOtp,
    };
  };

  const submitOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      const { token: receivedToken, user: receivedUser } = await apiVerifyOtp(phone, otp);
      setToken(receivedToken);
      setUser(receivedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const currentUser = await apiGetMe();
      setUser(currentUser);
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        requestOtp,
        submitOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
