import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { RoomProvider } from "@/context/RoomContext";
import { AudioProvider } from "@/context/AudioContext";
import { VoiceCommandProvider } from "@/context/VoiceCommandContext";
import { UserProvider, useUser } from "@/context/UserContext";
import Navigation from "@/components/Navigation";
import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import NetworkStatus from '@/components/NetworkStatus';
import PlatformLogo from '@/components/PlatformLogo';
import { cn } from '@/lib/utils';
 
// Pages
const Index = lazy(() => import("./pages/Index"));
const RoomPage = lazy(() => import("./pages/RoomPage"));
const CreateRoomPage = lazy(() => import("./pages/CreateRoomPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Protected route wrapper with loading state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();
  
  console.log('ProtectedRoute check:', { isAuthenticated, isLoading, path: location.pathname });
  
  // Show loading indicator only for a reasonable time (3 seconds max)
  const [showFallback, setShowFallback] = useState(true);
  
  useEffect(() => {
    // After 3 seconds, stop showing the fallback even if still loading
    // This prevents endless loading screens
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached for', location.pathname);
        setShowFallback(false);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isLoading, location.pathname]);
  
  // When loading finishes, update fallback state
  useEffect(() => {
    if (!isLoading) {
      setShowFallback(false);
    }
  }, [isLoading]);
  
  if (isLoading && showFallback) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <PlatformLogo size="lg" className="mb-4" />
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to landing page instead of auth page
    console.log('User not authenticated, redirecting to / from', location.pathname);
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Authentication route wrapper for redirecting logged in users
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();
  
  console.log('AuthRoute check:', { isAuthenticated, isLoading, path: location.pathname });
  
  // Show loading indicator only for a reasonable time (3 seconds max)
  const [showFallback, setShowFallback] = useState(true);
  
  useEffect(() => {
    // After 3 seconds, stop showing the fallback even if still loading
    // This prevents endless loading screens
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached for', location.pathname);
        setShowFallback(false);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isLoading, location.pathname]);
  
  // When loading finishes, update fallback state
  useEffect(() => {
    if (!isLoading) {
      setShowFallback(false);
    }
  }, [isLoading]);
  
  if (isLoading && showFallback) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <PlatformLogo size="lg" className="mb-4" />
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Always redirect to dashboard after authentication
    console.log('User already authenticated, redirecting from /auth to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Public layout with navigation
const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const [navState, setNavState] = useState<'collapsed' | 'expanded'>('collapsed');

  // This function will be passed to Navigation component
  const handleNavStateChange = (isExpanded: boolean) => {
    setNavState(isExpanded ? 'expanded' : 'collapsed');
  };

  return (
    <div className="flex min-h-screen">
      <div className={cn(
        "fixed top-0 left-0 h-full transition-all duration-300 z-40",
        navState === 'expanded' ? "w-64" : "w-16"
      )}>
        <Navigation onStateChange={handleNavStateChange} />
      </div>
      <div className={cn(
        "flex-1 transition-all duration-300",
        navState === 'expanded' ? "ml-64" : "ml-16"
      )}>
        {children}
      </div>
    </div>
  );
};

// Full screen layout without navigation (for auth pages)
const FullScreenLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen">
    {children}
  </div>
);

// Routes configuration
const routes = [
  // Public landing page - default entry point for all users
  {
    path: "/",
    element: (
      <FullScreenLayout>
        <LandingPage />
      </FullScreenLayout>
    ),
  },
  
  // Auth routes
  {
    path: "/auth",
    element: (
      <FullScreenLayout>
        <AuthRoute>
          <AuthPage />
        </AuthRoute>
      </FullScreenLayout>
    ),
  },
  {
    path: "/auth/callback",
    element: (
      <FullScreenLayout>
        <AuthCallback />
      </FullScreenLayout>
    ),
  },
  
  // Dashboard route - entry point after authentication
  {
    path: "/dashboard",
    element: (
      <PublicLayout>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </PublicLayout>
    ),
  },
  
  // Redirect /home to /dashboard
  {
    path: "/home",
    element: <Navigate to="/dashboard" replace />,
  },
  
  // Protected routes with navigation
  {
    path: "/room/:roomId",
    element: (
      <PublicLayout>
        <ProtectedRoute>
          <RoomPage />
        </ProtectedRoute>
      </PublicLayout>
    ),
  },
  {
    path: "/create-room",
    element: (
      <PublicLayout>
        <ProtectedRoute>
          <CreateRoomPage />
        </ProtectedRoute>
      </PublicLayout>
    ),
  },
  {
    path: "/profile",
    element: (
      <PublicLayout>
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </PublicLayout>
    ),
  },
  {
    path: "/settings",
    element: (
      <PublicLayout>
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </PublicLayout>
    ),
  },
  
  // Semi-public routes - also protected
  {
    path: "/explore",
    element: (
      <PublicLayout>
        <ProtectedRoute>
          <ExplorePage />
        </ProtectedRoute>
      </PublicLayout>
    ),
  },
  {
    path: "/people",
    element: (
      <PublicLayout>
        <ProtectedRoute>
          <PeoplePage />
        </ProtectedRoute>
      </PublicLayout>
    ),
  },
  
  // Fallback route
  {
    path: "*",
    element: (
      <PublicLayout>
        <NotFound />
      </PublicLayout>
    ),
  }
];

// Preload critical components to avoid loading states
const preloadComponents = () => {
  // These imports will trigger the components to load in parallel
  const preloads = [
    import("./pages/Index"),
    import("./pages/AuthPage"),
    import("./pages/Dashboard"),
    import("./pages/LandingPage")
  ];
  
  return Promise.all(preloads).catch(err => {
    console.warn('Preloading components failed:', err);
  });
};

const App = () => {
  // Add a timeout for the suspense fallback
  const [showSuspenseFallback, setShowSuspenseFallback] = useState(true);
  
  useEffect(() => {
    // After 5 seconds, force rendering even if suspense is still resolving
    const timer = setTimeout(() => {
      setShowSuspenseFallback(false);
      console.log('Suspense fallback timeout reached');
    }, 5000);
    
    // Start preloading components
    preloadComponents();
    
    return () => clearTimeout(timer);
  }, []);
  
  // Custom fallback with timeout
  const SuspenseFallback = () => {
    if (!showSuspenseFallback) {
      return <></>;
    }
    
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <PlatformLogo size="lg" className="mb-4" />
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <AudioProvider>
            <RoomProvider>
              <VoiceCommandProvider>
                <TooltipProvider>
                  <BrowserRouter>
                    <Suspense fallback={<SuspenseFallback />}>
                      <Routes>
                        {routes.map((route, index) => (
                          <Route 
                            key={index}
                            path={route.path}
                            element={route.element}
                          />
                        ))}
                      </Routes>
                    </Suspense>
                    <NetworkStatus />
                    <Toaster />
                    <Sonner position="top-right" closeButton richColors />
                  </BrowserRouter>
                </TooltipProvider>
              </VoiceCommandProvider>
            </RoomProvider>
          </AudioProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;