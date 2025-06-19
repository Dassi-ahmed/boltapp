import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  rating: number;
  totalRides: number;
  joinDate: string;
  isVerified: boolean;
  blockedUsers: string[];
  preferences: {
    allowMessages: boolean;
    allowCalls: boolean;
    maxRideDistance: number;
    preferredGender?: 'male' | 'female' | 'any';
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from your backend
      const userData: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        rating: 5.0,
        totalRides: 0,
        joinDate: new Date().toISOString(),
        isVerified: true,
        blockedUsers: [],
        preferences: {
          allowMessages: true,
          allowCalls: true,
          maxRideDistance: 500,
          preferredGender: 'any',
        },
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData: User = {
        id: Date.now().toString(),
        email,
        name,
        phone,
        rating: 5.0,
        totalRides: 0,
        joinDate: new Date().toISOString(),
        isVerified: false,
        blockedUsers: [],
        preferences: {
          allowMessages: true,
          allowCalls: true,
          maxRideDistance: 500,
          preferredGender: 'any',
        },
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'userProfile', 'currentMatches', 'currentRideRequest']);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const blockUser = async (userId: string) => {
    if (!user) return;
    
    const updatedBlockedUsers = [...user.blockedUsers, userId];
    await updateUser({ blockedUsers: updatedBlockedUsers });
  };

  const unblockUser = async (userId: string) => {
    if (!user) return;
    
    const updatedBlockedUsers = user.blockedUsers.filter(id => id !== userId);
    await updateUser({ blockedUsers: updatedBlockedUsers });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      updateUser,
      blockUser,
      unblockUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}