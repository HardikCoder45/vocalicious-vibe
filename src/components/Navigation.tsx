
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, Users, Search, UserCircle, Settings, LogOut, LogIn } from "lucide-react";
import ThemeSelector from './ThemeSelector';
import { useUser } from '@/context/UserContext';
import Avatar from './Avatar';
import { toast } from "sonner";

const Navigation: React.FC = () => {
  const location = useLocation();
  const { currentUser, profile, logout, isAuthenticated, isLoading } = useUser();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };
  
  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/explore',
      label: 'Explore',
      icon: Search,
    },
    {
      path: '/people',
      label: 'People',
      icon: Users,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: UserCircle,
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
  
  return (
    <nav className="fixed bottom-0 left-0 w-full border-t bg-background md:relative md:w-auto md:border-r md:border-t-0 md:h-screen z-20">
      <div className="flex justify-around py-3 px-2 md:flex-col md:h-full md:justify-start md:py-8 md:px-4">
        <div className="hidden md:flex md:justify-center md:mb-8">
          <Link to="/" className="font-bold text-2xl gradient-purple">Vibe</Link>
        </div>
        
        <div className="flex justify-around w-full md:flex-col md:gap-2">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={(e) => {
                if (item.protected && !isAuthenticated) {
                  e.preventDefault();
                  navigate('/auth');
                  toast('Please login to access this feature');
                }
              }}
            >
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                size="icon"
                className={`relative group ${isActive(item.path) ? 'bg-primary text-primary-foreground animate-scale-in' : ''}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
                
                {/* Desktop tooltip */}
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.label}
                </div>
                
                {/* Mobile Label */}
                <span className="absolute top-full mt-1 text-[10px] md:hidden">
                  {item.label}
                </span>
              </Button>
            </Link>
          ))}
        </div>
        
        <div className="hidden md:flex md:flex-col md:gap-2 md:mt-auto">
          <ThemeSelector />
          
          {isLoading ? (
            <div className="flex justify-center p-2">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : isAuthenticated ? (
            <div className="flex flex-col items-center gap-2 pt-4 border-t">
              <Link to="/profile" className="w-full">
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                  <Avatar 
                    src={profile?.avatar_url || '/placeholder.svg'} 
                    alt={profile?.name || profile?.username || 'User'} 
                    size="sm" 
                  />
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {profile?.name || profile?.username || 'User'}
                  </span>
                </div>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="relative group"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
                
                {/* Desktop tooltip */}
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  Logout
                </div>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogin}
              className="relative group"
            >
              <LogIn className="h-5 w-5" />
              <span className="sr-only">Login</span>
              
              {/* Desktop tooltip */}
              <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                Login
              </div>
            </Button>
          )}
        </div>
        
        {/* Mobile auth buttons */}
        <div className="fixed top-2 right-2 md:hidden">
          {isAuthenticated ? (
            <Link to="/profile">
              <Avatar 
                src={profile?.avatar_url || '/placeholder.svg'} 
                alt={profile?.name || profile?.username || 'User'} 
                size="sm" 
              />
            </Link>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogin}
              className="flex items-center gap-1"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
