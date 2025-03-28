
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { RoomProvider } from "@/context/RoomContext";
import { AudioProvider } from "@/context/AudioContext";
import { UserProvider, useUser } from "@/context/UserContext";
import Navigation from "@/components/Navigation";
import { Suspense, lazy, useEffect } from "react";

// Pages
import Index from "./pages/Index";
import RoomPage from "./pages/RoomPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import PeoplePage from "./pages/PeoplePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";

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
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Log the redirect for debugging
      console.log(`Redirecting from ${location.pathname} to /auth because user is not authenticated`);
    }
  }, [isLoading, isAuthenticated, location.pathname]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Save the location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Authentication route wrapper for redirecting logged in users
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Redirect to saved location or home
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <RoomProvider>
          <AudioProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <div className="flex min-h-screen">
                  <Navigation />
                  <div className="flex-1 min-h-screen relative">
                    <Suspense fallback={
                      <div className="flex min-h-screen items-center justify-center">
                        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    }>
                      <Routes>
                        <Route path="/auth" element={
                          <AuthRoute>
                            <AuthPage />
                          </AuthRoute>
                        } />
                        <Route path="/" element={<Index />} />
                        <Route path="/room/:roomId" element={
                          <ProtectedRoute>
                            <RoomPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/create-room" element={
                          <ProtectedRoute>
                            <CreateRoomPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        } />
                        <Route path="/people" element={<PeoplePage />} />
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </div>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </AudioProvider>
        </RoomProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
