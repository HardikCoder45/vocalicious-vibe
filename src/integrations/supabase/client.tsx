import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";

// Default environment variables (use these if .env ones are not available)
const FALLBACK_SUPABASE_URL = 'https://qsuhkgafjqwlffjyktdk.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdWhrZ2FmanF3bGZmanlrdGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg2NDQ1OTksImV4cCI6MjAyNDIyMDU5OX0.3p02n_A-vjHQr-6JcGQRRJYSeeQhm1yBTH1cx_wR9Fw';

// Get environment variables with fallbacks
const supabaseUrl = FALLBACK_SUPABASE_URL;
const supabaseAnonKey = FALLBACK_SUPABASE_ANON_KEY;

// Database connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECTION_RETRY_DELAY = 3000; // 3 seconds

// Create a custom fetch implementation with timeout and error handling
const customFetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    // Add timeout to fetch calls
    const timeoutId = setTimeout(() => {
      console.warn('Request timeout', url);
      reject(new Error('Request timeout'));
    }, 15000); // 15 second timeout
    
    fetch(url, init)
      .then(response => {
        clearTimeout(timeoutId);
        // Monitor response status for connection issues
        if (!response.ok && (response.status >= 500 || response.status === 0)) {
          isConnected = false;
          console.error(`Server error: ${response.status}`, url);
          if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
            scheduleReconnect();
          }
        } else {
          isConnected = true;
        }
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error('Fetch error:', err, url);
        isConnected = false;
        
        // Show user-friendly error message for common errors
        if (err.message === 'Failed to fetch') {
          toast.error('Network connection issue', {
            description: 'Please check your internet connection and try again',
            duration: 5000
          });
        }
        
        reject(err);
      });
  });
};

// Schedule a reconnection attempt
const scheduleReconnect = () => {
  console.log(`Scheduling reconnection attempt ${connectionAttempts + 1} in ${CONNECTION_RETRY_DELAY}ms`);
  setTimeout(() => {
    initializeSupabase();
  }, CONNECTION_RETRY_DELAY);
};

// Show connection error message to user
const showConnectionError = () => {
  toast.error('Having trouble connecting to the server', {
    description: 'Please check your internet connection and refresh the page',
    duration: 5000
  });
};

// Create fallback client for when connection fails
const createFallbackClient = () => {
  return {
    auth: {
      onAuthStateChange: (callback: any) => {
        console.warn('Using fallback auth client - onAuthStateChange');
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => console.warn('Unsubscribed from fallback auth') 
            } 
          } 
        };
      },
      getSession: async () => {
        console.warn('Using fallback auth client - getSession');
        return { data: { session: null }, error: null };
      },
      signInWithPassword: async () => {
        console.warn('Using fallback auth client - signInWithPassword');
        return { error: new Error('Auth system is currently unavailable') };
      },
      signInWithOAuth: async () => {
        console.warn('Using fallback auth client - signInWithOAuth');
        return { error: new Error('Auth system is currently unavailable') };
      },
      signOut: async () => {
        console.warn('Using fallback auth client - signOut');
        return { error: null };
      },
      refreshSession: async () => {
        console.warn('Using fallback auth client - refreshSession');
        return { data: { session: null }, error: null };
      }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null })
        }),
        maybeSingle: async () => ({ data: null, error: null })
      }),
      insert: async () => ({ error: null }),
      update: async () => ({ error: null }),
      delete: async () => ({ error: null })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    removeChannel: () => {},
    channel: () => ({
      on: () => ({
        subscribe: () => {}
      })
    })
  } as unknown as SupabaseClient;
};

// Supabase client instance
let supabaseClient: SupabaseClient;

// Initialize Supabase client
const initializeSupabase = () => {
  try {
    connectionAttempts++;
    
    console.log(`Initializing Supabase client (attempt ${connectionAttempts})...`);
    
    // Define the auth configuration
    const authConfig = {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'vocalicious-auth-token',
    };
    
    // Create the Supabase client
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: authConfig,
      global: {
        fetch: customFetch,
        headers: {
          'X-Client-Info': 'vocalicious-web-app'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public'
      }
    });
    
    // Add token refresh event
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Supabase token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in');
        isConnected = true;
        connectionAttempts = 0;
      }
    });
    
    console.log('Supabase client initialized successfully');
    isConnected = true;
    connectionAttempts = 0;
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    isConnected = false;
    
    // Schedule reconnection attempt if within retry limits
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      scheduleReconnect();
    } else {
      showConnectionError();
    }
    
    // Create a fallback client that will handle auth operations gracefully
    return createFallbackClient();
  }
};

// Function to manually refresh token if needed
export const refreshToken = async () => {
  try {
    if (!isConnected || !supabaseClient) {
      console.warn('Cannot refresh token: Supabase client not connected');
      return false;
    }
    
    const { data, error } = await supabaseClient.auth.refreshSession();
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

// Function to check connection status
export const checkConnection = async () => {
  if (!supabaseClient) return false;
  if (isConnected) return true;
  
  try {
    // Try a simple query to check connection
    const { error } = await supabaseClient.from('user_profiles').select('count').limit(1);
    isConnected = !error;
    return isConnected;
  } catch (err) {
    console.error('Connection check failed:', err);
    isConnected = false;
    return false;
  }
};

// Initialize the client
supabaseClient = initializeSupabase();

export const supabase = supabaseClient; 