
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { RoomProvider } from "@/context/RoomContext";
import { AudioProvider } from "@/context/AudioContext";
import { UserProvider } from "@/context/UserContext";
import Navigation from "@/components/Navigation";

// Pages
import Index from "./pages/Index";
import RoomPage from "./pages/RoomPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import PeoplePage from "./pages/PeoplePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/room/:roomId" element={<RoomPage />} />
                      <Route path="/create-room" element={<CreateRoomPage />} />
                      <Route path="/explore" element={<ExplorePage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/people" element={<PeoplePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
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
