import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { updateAvatarCache, clearAvatarCache } from '@/utils/avatarUtils';

// Token refresh interval (15 minutes)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;

// Internal functions for auth management
// Internal connection check function
const checkConnection = async () => {
  if (!supabase) return false;
  
  try {
    // Try a simple query to check connection
    const { error } = await supabase.from('user_profiles').select('count').limit(1);
    return !error;
  } catch (err) {
    console.error('Connection check failed:', err);
    return false;
  }
};

// Function to manually refresh token if needed
const refreshToken = async () => {
  try {
    if (!supabase) {
      console.warn('Cannot refresh token: Supabase client not connected');
      return false;
    }
    
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
    return !!data.session;
  } catch (err) {
    console.error('Token refresh exception:', err);
    return false;
  }
};

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
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username?: string, avatarFile?: File) => Promise<void>;
  updateProfile: (userData: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
  updateAvatar: (url: string) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  register: async () => {},
  updateProfile: async () => {},
  uploadAvatar: async () => { return ''; },
  refreshProfile: async () => {},
  updateAvatar: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [lastAuthError, setLastAuthError] = useState<Date | null>(null);

  // Separate profile fetch to handle any errors without breaking authentication
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            const userData = user.data.user;
            
            // Create default profile using email or name
            const defaultUsername = userData.email ? userData.email.split('@')[0] : `user_${Math.random().toString(36).substring(2, 8)}`;
            const defaultName = userData.user_metadata?.full_name || null;
            const defaultAvatar = userData.user_metadata?.avatar_url || null;
            
            const newProfile: Partial<Profile> = {
              id: userData.id,
              username: defaultUsername,
              name: defaultName,
              avatar_url: defaultAvatar,
              bio: null,
            };
            
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert(newProfile);
              
            if (insertError) {
              console.error('Error creating profile:', insertError);
              return;
            }
            
            setProfile(newProfile as Profile);
            return;
          }
        }
        return;
      }
      
      if (data) {
        // Check if we need to fetch avatar from storage
        if (!data.avatar_url && data.id) {
          try {
            // Try to fetch avatar directly from storage using our utility
            const avatarPath = `avatars/${data.id}/profile.png`;
            
            // Check if the file exists by getting the public URL
            const { data: urlData } = await supabase.storage
              .from('user-content')
              .getPublicUrl(avatarPath);
              
            if (urlData?.publicUrl) {
              // Update the profile with the new avatar URL
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ avatar_url: urlData.publicUrl })
                .eq('id', data.id);
                
              if (!updateError) {
                data.avatar_url = urlData.publicUrl;
                console.log('Updated profile with avatar from storage:', urlData.publicUrl);
              }
            }
          } catch (err) {
            console.error('Error checking for avatar in storage:', err);
          }
        }
        
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Initial session check
  useEffect(() => {
    console.log('Checking initial session');
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          
          // Try to refresh the token if there's an error
          const refreshed = await refreshToken();
          
          if (!refreshed) {
            if (isMounted) {
              setIsLoading(false);
              setAuthChecked(true);
            }
            return;
          }
          
          // Try getting the session again after refresh
          const { data: refreshedData } = await supabase.auth.getSession();
          
          if (isMounted) {
            const hasSession = !!refreshedData.session;
            console.log('Session refreshed: session exists =', hasSession);
            
            setSession(refreshedData.session);
            setCurrentUser(refreshedData.session?.user ?? null);
            setIsAuthenticated(hasSession);
            
            if (refreshedData.session?.user) {
              fetchProfile(refreshedData.session.user.id).catch(console.error);
            }
            
            setIsLoading(false);
            setAuthChecked(true);
          }
          return;
        }
        
        if (isMounted) {
          const hasSession = !!data.session;
          console.log('Initial session check: session exists =', hasSession);
          
          setSession(data.session);
          setCurrentUser(data.session?.user ?? null);
          setIsAuthenticated(hasSession);
          
          if (data.session?.user) {
            fetchProfile(data.session.user.id).catch(console.error);
          }
          
          // Always end loading state
          setIsLoading(false);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (isMounted) {
          setIsLoading(false);
          setAuthChecked(true);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (!isAuthenticated || !session) return;
    
    console.log('Setting up token refresh interval');
    
    // Refresh token every 15 minutes to prevent expiration
    const refreshInterval = setInterval(async () => {
      console.log('Executing scheduled token refresh');
      await refreshToken();
    }, TOKEN_REFRESH_INTERVAL);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, session]);

  // Auth state listener
  useEffect(() => {
    if (!authChecked) return;
    
    console.log('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          fetchProfile(session.user.id).catch(console.error);
        } else {
          setProfile(null);
        }
        
        // Ensure loading is false after auth state changes
        setIsLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [authChecked]);

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.id);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Check connection status first
      const isConnected = await checkConnection();
      if (!isConnected) {
        toast.error('Connection issue detected', {
          description: 'Please check your internet connection and try again',
          duration: 5000
        });
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success('Logged in successfully');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases with more friendly messages
      if (error.message === 'Failed to fetch') {
        toast.error('Network connection issue', {
          description: 'Please check your internet connection and try again',
          action: {
            label: 'Retry',
            onClick: () => login(email, password)
          }
        });
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Login failed', { 
          description: 'Invalid email or password. Please try again.'
        });
      } else {
        toast.error('Login failed', {
          description: error.message || 'An error occurred during login'
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    
    try {
      // Check connection status first
      const isConnected = await checkConnection();
      if (!isConnected) {
        toast.error('Connection issue detected', {
          description: 'Please check your internet connection and try again',
          duration: 5000
        });
        setIsLoading(false);
        return;
      }
      
      // Store current location to redirect back after login
      const redirectPath = window.location.pathname !== '/auth' ? window.location.pathname : '/';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            redirect_uri: `${window.location.origin}/auth/callback`,
            hd: redirectPath // Use the hosted domain parameter to pass the path
          }
        }
      });
      
      if (error) throw error;
      
      // The success toast will be shown after redirect in the callback page
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Handle specific error cases with more friendly messages
      if (error.message === 'Failed to fetch') {
        toast.error('Network connection issue', {
          description: 'Please check your internet connection and try again',
          duration: 5000
        });
      } else {
        toast.error('Google login failed', {
          description: error.message || 'Failed to login with Google',
          duration: 5000
        });
      }
      
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, username?: string, avatarFile?: File) => {
    setIsLoading(true);
    
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Registration failed: No user data');
      
      // Generate a username if not provided
      const userUsername = username || email.split('@')[0];
      
      // Create profile in a single transaction
      let avatarUrl = null;
      
      // Upload avatar if provided
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(avatarFile);
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError);
          // Continue with registration even if avatar upload fails
        }
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          username: userUsername,
          avatar_url: avatarUrl,
          bio: null,
        });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        toast.error('Account created but profile setup failed. Please update your profile later.');
      } else {
        // Set profile in state so it's immediately available
        const newProfile: Profile = {
          id: data.user.id,
          username: userUsername,
          name: null,
          avatar_url: avatarUrl,
          bio: null,
          created_at: new Date().toISOString(),
        };
        setProfile(newProfile);
      }
      
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear all avatar caches when logging out
      clearAvatarCache();
      toast('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      if (!currentUser) {
        throw new Error('Must be logged in to upload avatar');
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      
      // Use consistent path structure for all avatars
      const filePath = `avatars/${currentUser.id}/profile.png`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
      
      // Convert the file to base64 for cache
      const fileReader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        fileReader.onloadend = () => {
          const base64 = fileReader.result as string;
          resolve(base64);
        };
      });
      
      fileReader.readAsDataURL(file);
      const base64 = await base64Promise;
      
      // Update the cache with the new avatar
      updateAvatarCache(currentUser.id, base64);
      
      return data.publicUrl;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  };

  const updateProfile = async (userData: Partial<Profile>): Promise<void> => {
    if (!currentUser) {
      toast.error('You must be logged in to update your profile');
      throw new Error('Not authenticated');
    }
    
    try {
      // Make sure id is included for the update
      const dataWithId = {
        ...userData,
        id: currentUser.id,
      };
      
      // Update user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .update(dataWithId)
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      // Update local state
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, ...userData };
      });
      
      // Also update the user metadata in auth
      if (userData.name) {
        await supabase.auth.updateUser({
          data: { full_name: userData.name }
        });
      }
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const updateAvatar = async (url: string): Promise<void> => {
    if (!currentUser) {
      toast.error('You must be logged in to update your avatar');
      throw new Error('Not authenticated');
    }
    
    try {
      // Update user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: url })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      // Update local state
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, avatar_url: url };
      });
      
      // Clear the avatar cache for this user to ensure it gets refreshed
      clearAvatarCache(currentUser.id);
      
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(error.message || 'Failed to update avatar');
      throw error;
    }
  };

  // When there's an auth error, prevent repeated toasts/redirects
  const handleAuthError = (error: any) => {
    const now = new Date();
    
    // Only show error toast if we haven't shown one in the last minute
    const showToast = !lastAuthError || 
      (now.getTime() - lastAuthError.getTime() > 60000);
    
    if (showToast) {
      toast.error(error.message || 'Authentication error', {
        description: 'Please try again or check your connection',
        action: {
          label: 'Retry',
          onClick: () => refreshToken()
        }
      });
      setLastAuthError(now);
    }
    
    return error;
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      profile,
      isLoading,
      isAuthenticated,
      login,
      loginWithGoogle,
      logout,
      register,
      updateProfile,
      uploadAvatar,
      refreshProfile,
      updateAvatar,
    }}>
      {children}
    </UserContext.Provider>
  );
};
