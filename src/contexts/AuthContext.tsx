import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { completeOnboarding } from '../utils/auth';

type User = {
  email: string;
  token: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session on initial load
    const checkAuth = async () => {
      try {
        const token = Cookies.get('token');
        const email = Cookies.get('email');
        
        if (token && email) {
          setUser({ email, token });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would be an API call
      // For demo, we'll just create a mock token
      const mockToken = `mock-jwt-token-${Date.now()}`;
      
      // Set cookies that expire in 1 day
      Cookies.set('token', mockToken, { expires: 1 });
      Cookies.set('email', email, { expires: 1 });
      
      setUser({ email, token: mockToken });
      
      // Check if user needs to complete onboarding
      const isNewUser = localStorage.getItem('isNewUser') === 'true';
      if (isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would be an API call
      // For demo, we'll just create a mock token
      const mockToken = `mock-jwt-token-${Date.now()}`;
      
      // Set cookies that expire in 1 day
      Cookies.set('token', mockToken, { expires: 1 });
      Cookies.set('email', email, { expires: 1 });
      // Mark as new user
      localStorage.setItem('isNewUser', 'true');
      
      setUser({ email, token: mockToken });
      // Redirect to onboarding for new users
      navigate('/onboarding');
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('email');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
