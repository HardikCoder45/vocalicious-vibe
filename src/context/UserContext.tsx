
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface UserContextType {
  currentUser: SupabaseUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateProfile: (userData: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  updateProfile: async () => {},
  uploadAvatar: async () => { return ''; },
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success('Logged in successfully');
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
      
      toast.success('Registration successful!');
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${currentUser.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      throw uploadError;
    }
    
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const updateProfile = async (userData: Partial<Profile>) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(userData)
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...userData } : null);
      
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      profile,
      isLoading,
      isAuthenticated,
      login,
      logout,
      register,
      updateProfile,
      uploadAvatar,
    }}>
      {children}
    </UserContext.Provider>
  );
};
