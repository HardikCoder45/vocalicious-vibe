import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, Users, Search, UserCircle, Settings, LogOut, LogIn, UserRound, Mic, Menu, ChevronLeft, Music } from "lucide-react";
import ThemeSelector from './ThemeSelector';
import { useUser } from '@/context/UserContext';
import Avatar from './Avatar';
import { toast } from "sonner";
import VoiceCommandToggle from './VoiceCommandToggle';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PlatformLogo from './PlatformLogo';
import { motion, AnimatePresence } from 'framer-motion';
import AudioControls from './AudioControls';
import { useAudio } from '@/context/AudioContext';
import { fetchAvatarAsBase64, clearAvatarCache } from '@/utils/avatarUtils';

interface NavigationProps {
  onStateChange?: (isExpanded: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ onStateChange }) => {
  const location = useLocation();
  const { currentUser, profile, logout, isAuthenticated, isLoading } = useUser();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  
  // Add event listener for avatar updates
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (profile?.id && profile.id === userId) {
        // Fetch fresh avatar
      fetchAvatarAsBase64(profile.id)
        .then(base64 => {
          if (base64) {
            setAvatarBase64(base64);
          }
        })
        .catch(err => {
            console.error('Error refreshing avatar in navigation:', err);
          });
      }
    };

    // Add event listener
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, [profile?.id]);

  // Modify the existing useEffect to always fetch on profile changes
  useEffect(() => {
    if (profile?.id) {
      // Always fetch the latest avatar
      fetchAvatarAsBase64(profile.id)
        .then(base64 => {
          if (base64) {
            setAvatarBase64(base64);
          }
        })
        .catch(err => {
          console.error('Error fetching avatar in navigation:', err);
        });
    }
  }, [profile?.id, profile?.avatar_url]); // Add avatar_url as dependency
  
  // Call the onStateChange callback whenever expanded changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(expanded);
    }
  }, [expanded, onStateChange]);
  
  const isActive = (path: string) => {
    // For Home, check if we're on dashboard path
    if (path === '/home' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname === path;
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleLogin = () => {
    navigate('/auth', { state: { from: location.pathname } });
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const navItems = [
    {
      path: '/home',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/explore',
      label: 'Explore',
      icon: Search,
    },
    {
      path: '/create-room',
      label: 'Create Room',
      icon: Mic,
    },
    {
      path: '/people',
      label: 'People',
      icon: Users,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: UserRound,
      protected: true,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      protected: true,
    },
  ];
  
  // Filter out protected routes if not authenticated
  const filteredNavItems = navItems.filter(item => 
    !item.protected || isAuthenticated
  );
  
  if (!isAuthenticated) return null;
  
  return (
    <>
      {/* Desktop Navigation */}
    <motion.div 
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r hidden md:flex flex-col items-center py-4 z-10",
        expanded ? "w-56" : "w-16"
      )}
      initial={false}
      animate={{ width: expanded ? 224 : 64 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Platform Logo at the top */}
      <div className={cn("mb-8 mt-2 flex items-center", expanded && "justify-between w-full px-4")}>
        <motion.div 
          className="flex items-center"
          initial={false}
          animate={{ justifyContent: expanded ? "flex-start" : "center", width: expanded ? "auto" : "100%" }}
        >
          <motion.div 
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <PlatformLogo size="md" />
          </motion.div>
          {!expanded && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="mt-2"
                  onClick={toggleExpanded}
                >
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-4 w-4" />
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expand Menu
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
          <AnimatePresence>
            {expanded && (
              <motion.span 
                className="ml-2 font-bold text-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                Vibe
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: expanded ? 1 : 0, scale: expanded ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
          style={{ display: expanded ? "block" : "none" }}
        >
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 transition-colors hover:bg-accent"
            onClick={toggleExpanded}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
      
      <nav className="flex-1 flex flex-col items-center gap-2 w-full overflow-hidden">
        {expanded ? (
          // Expanded navigation items
          <AnimatePresence>
            {filteredNavItems.map((item) => (
              <motion.div
                key={item.path}
                className="w-full px-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={item.path} className="w-full">
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start pl-4 transition-all",
                      isActive(item.path) && "bg-primary text-primary-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          // Collapsed navigation items with tooltips
          <TooltipProvider>
            {filteredNavItems.map((item) => (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <div className="my-1">
                    <Link to={item.path}>
                      <Button 
                        size="icon" 
                        variant={isActive(item.path) ? "default" : "ghost"}
                        className={cn(
                          "h-10 w-10 transition-all duration-200",
                          isActive(item.path) && "bg-primary text-primary-foreground",
                          !isActive(item.path) && "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>
                      </Button>
                    </Link>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        )}
      </nav>
        
      {/* Bottom controls */}
      <div className={cn(
        "mt-auto pt-4 flex flex-col items-center gap-2",
        expanded ? "w-full px-3" : "w-auto"
      )}>
        <ThemeSelector expanded={expanded} />
        <VoiceCommandToggle className="my-2" />
        
        {/* Add AudioControls */}
        <div className={cn(
          "my-2",
          expanded ? "w-full" : "w-auto"
        )}>
          {expanded ? (
            <AudioControls showTooltips={false} />
          ) : (
            <AudioControls minimized showTooltips />
          )}
        </div>
        
        {expanded ? (
          <Button
            variant="outline" 
            className="w-full justify-start pl-4 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LogOut className="h-4 w-4" />
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Button to expand when collapsed */}
        
        
        {/* User profile at bottom (optional) */}
        {profile && (
          <div className={cn(
            "mt-4 w-full flex items-center", 
            expanded ? "justify-start px-3" : "justify-center"
          )}>
            <Link to="/profile" className={cn("flex items-center", expanded && "w-full")}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Avatar 
                  src={avatarBase64}
                  alt={profile.name || profile.username || 'Profile'} 
                  size="sm"
                  className={cn(
                    "border-2 border-background",
                    isActive('/profile') && "ring-2 ring-primary"
                  )}
                  userId={profile.id}
                />
              </motion.div>
              
              <AnimatePresence>
                {expanded && (
                  <motion.div 
                    className="ml-2 truncate"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-sm font-medium truncate">
                      {profile.name || profile.username || 'User'}
                    </p>
                    {profile.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{profile.username}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>
        )}
      </div>
    </motion.div>

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden flex justify-around items-center p-2 z-10">
        {filteredNavItems.slice(0, 5).map((item) => (
          <Link key={item.path} to={item.path} className="flex flex-col items-center py-1">
            <Button 
              variant={isActive(item.path) ? "default" : "ghost"}
              size="icon"
              className={cn(
                "h-10 w-10",
                isActive(item.path) && "bg-primary text-primary-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Button>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="flex flex-col items-center"
                onClick={() => navigate('/profile')}
              >
                <Avatar 
                  src={avatarBase64}
                  alt={profile?.name || profile?.username || 'Profile'} 
                  size="sm"
                  className={cn(
                    "border-2 border-background h-10 w-10",
                    isActive('/profile') && "ring-2 ring-primary"
                  )}
                  userId={profile?.id}
                />
                <span className="text-xs mt-1">Profile</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Profile
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};

export default Navigation;
