import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../services/api';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (adminData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Ensure token is set in apiService
          apiService.setToken(storedToken);
          setToken(storedToken);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Try hospital management login first
      try {
        const response = await apiService.hospitalLogin(email, password);
        
        if (response.data && response.data.token && response.data.user) {
          const token = response.data.token;
          const userData = response.data.user;
          
          // Set state
          setToken(token);
          setUser(userData);
          
          // Store in localStorage
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(userData));
          return;
        }
      } catch (hospitalError: any) {
        // If hospital login fails, try admin login
        console.log('Hospital login failed, trying admin login...');
      }
      
      // Try admin login (super admin from User model)
      const response = await apiService.login(email, password);
      
      if (response.data && response.data.token && response.data.admin) {
        const token = response.data.token;
        const userData = response.data.admin;
        
        // Set token in apiService
        apiService.setToken(token);
        
        // Set state
        setToken(token);
        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Provide user-friendly error messages
      if (error.message) {
        // If the error message contains "Invalid credentials" or similar, make it more user-friendly
        if (error.message.toLowerCase().includes('invalid credentials') || 
            error.message.toLowerCase().includes('invalid email') ||
            error.message.toLowerCase().includes('invalid password')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        throw error;
      }
      
      throw new Error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (adminData: { name: string; email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await apiService.register(adminData);
      
      if (response.data && response.data.token && response.data.admin) {
        const token = response.data.token;
        const userData = response.data.admin;
        
        // Set token in apiService
        apiService.setToken(token);
        
        // Set state
        setToken(token);
        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Provide user-friendly error messages
      if (error.message) {
        if (error.message.toLowerCase().includes('email') || 
            error.message.toLowerCase().includes('already exists')) {
          throw new Error('An account with this email already exists. Please use a different email or sign in.');
        }
        throw error;
      }
      
      throw new Error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state
      setUser(null);
      setToken(null);
      
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
