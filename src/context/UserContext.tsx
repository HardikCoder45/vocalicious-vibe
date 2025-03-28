
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  interests: string[];
}

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

// Mock user data
const mockUser: User = {
  id: 'user-1',
  name: 'Jamie Smith',
  username: 'jamie_speaks',
  avatar: '/placeholder.svg',
  bio: 'Voice enthusiast | Tech lover | Coffee addict',
  followers: 245,
  following: 187,
  interests: ['Technology', 'Music', 'Design', 'Books'],
};

const UserContext = createContext<UserContextType>({
  currentUser: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateProfile: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('vibe-user');
    
    // Simulate loading
    setTimeout(() => {
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } else {
        // Auto-login with mock user for demo purposes
        setCurrentUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem('vibe-user', JSON.stringify(mockUser));
      }
      setIsLoading(false);
    }, 1000);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCurrentUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('vibe-user', JSON.stringify(mockUser));
    setIsLoading(false);
    toast.success('Logged in successfully');
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('vibe-user');
    toast('Logged out successfully');
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newUser = {
      ...mockUser,
      username,
      name: username.split('_').join(' '),
    };
    
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('vibe-user', JSON.stringify(newUser));
    setIsLoading(false);
    toast.success('Registered successfully');
  };

  const updateProfile = async (userData: Partial<User>) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        ...userData,
      };
      
      setCurrentUser(updatedUser);
      localStorage.setItem('vibe-user', JSON.stringify(updatedUser));
    }
    
    setIsLoading(false);
    toast.success('Profile updated');
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      isLoading,
      isAuthenticated,
      login,
      logout,
      register,
      updateProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
};
