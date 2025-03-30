import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const handleAuthCallback = async () => {
    try {
      // Check if we're online first
      if (!navigator.onLine) {
        throw new Error('Network connection unavailable. Please check your internet and try again.');
      }
      
      // Get the URL hash and search params
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const authCode = searchParams.get('code');
      
      if (hash && hash.includes('access_token')) {
        console.log('Processing OAuth callback with access_token in hash');
        // Get state from URL and parse
        const state = searchParams.get('state');
        let redirectPath = '/';
        
        // If state exists and is a valid JSON, extract redirectTo
        if (state) {
          try {
            const stateObj = JSON.parse(decodeURIComponent(state));
            if (stateObj.redirectTo) {
              redirectPath = stateObj.redirectTo;
            }
          } catch (e) {
            console.error('Failed to parse state:', e);
          }
        }
        
        // Exchange auth code (in URL) for session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          toast.success('Successfully logged in!');
          navigate(redirectPath, { replace: true });
        } else {
          throw new Error('Failed to get session');
        }
      } else if (authCode) {
        console.log('Processing OAuth callback with code parameter');
        // Exchange the authorization code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          toast.success('Successfully logged in!');
          navigate('/', { replace: true });
        } else {
          throw new Error('Failed to get session from code');
        }
      } else {
        // If no hash with access token or code, redirect back to auth page
        console.log('No access_token or code found in URL, redirecting to auth page');
        navigate('/auth', { replace: true });
      }
    } catch (err: any) {
      console.error('Auth callback error:', err);
      if (err.message === 'Failed to fetch' || !navigator.onLine) {
        setError('Connection error: Unable to complete authentication. Please check your internet connection.');
      } else {
        setError(err.message || 'Authentication failed');
      }
      
      // Wait a bit before redirect on error
      setTimeout(() => {
        if (!retrying) {
          navigate('/auth', { replace: true });
        }
      }, 5000);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    handleAuthCallback();
  }, [navigate]);

  // If still processing after 15 seconds, show a timeout message
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (processing) {
        setError('Authentication is taking longer than expected. Please try again.');
        setTimeout(() => {
          if (!retrying) {
            navigate('/auth', { replace: true });
          }
        }, 5000);
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [processing, navigate, retrying]);

  const handleRetry = () => {
    setRetrying(true);
    setProcessing(true);
    setError(null);
    
    // Small delay before retrying
    setTimeout(() => {
      handleAuthCallback();
      setRetrying(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      {error ? (
        <div className="text-center max-w-md w-full bg-card p-6 rounded-xl shadow-sm border">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="default" 
              onClick={handleRetry} 
              disabled={retrying}
              className="w-full"
            >
              {retrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full"
            >
              Back to login
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center max-w-md w-full bg-card p-6 rounded-xl shadow-sm border">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Completing login...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we log you in</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback; 