import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  
  // Function to check database connection
  const checkDatabaseConnection = async () => {
    if (!supabase) return false;
    
    try {
      // Try a simple query to check connection
      const { error } = await supabase.from('user_profiles').select('count').limit(1);
      const isConnected = !error;
      return isConnected;
    } catch (err) {
      console.error('Connection check failed:', err);
      return false;
    }
  };
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online', {
        description: 'Your connection has been restored'
      });
      // Check connection to backend after a short delay
      setTimeout(() => {
        checkDatabaseConnection().catch(() => {});
      }, 1000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      toast.error('Connection lost', {
        description: 'Please check your internet connection'
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    checkDatabaseConnection()
      .then(isConnected => {
        if (!isConnected && isOnline) {
          // We're online but can't reach the backend
          setShowBanner(true);
        }
      })
      .catch(() => {
        setShowBanner(true);
      });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleRetry = async () => {
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
      refreshIcon.classList.add('animate-spin');
    }
    
    try {
      const isConnected = await checkDatabaseConnection();
      if (isConnected) {
        setShowBanner(false);
        toast.success('Connection restored!');
      } else {
        toast.error('Still having connection issues', {
          description: 'Please check your internet or try again later'
        });
      }
    } catch (error) {
      toast.error('Connection check failed');
    } finally {
      if (refreshIcon) {
        refreshIcon.classList.remove('animate-spin');
      }
    }
  };
  
  if (!showBanner) return null;
  
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-2 transition-transform ${showBanner ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="bg-card/90 backdrop-blur-sm mx-auto max-w-md rounded-lg border border-destructive/20 shadow-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-yellow-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isOnline ? 'Server connection issue' : 'You are offline'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isOnline 
                ? 'We\'re having trouble connecting to our servers' 
                : 'Please check your internet connection'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleRetry}>
            <RefreshCw id="refresh-icon" className="h-4 w-4 mr-1" />
            Retry
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowBanner(false)}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus; 