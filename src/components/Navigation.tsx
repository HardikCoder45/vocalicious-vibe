
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, Users, Search, UserCircle, Settings, LogOut } from "lucide-react";
import ThemeSelector from './ThemeSelector';
import { useUser } from '@/context/UserContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useUser();
  
  const isActive = (path: string) => {
    return location.pathname === path;
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
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 w-full border-t bg-background md:relative md:w-auto md:border-r md:border-t-0 md:h-screen z-20">
      <div className="flex justify-around py-3 px-2 md:flex-col md:h-full md:justify-start md:py-8 md:px-4">
        <div className="hidden md:flex md:justify-center md:mb-8">
          <Link to="/" className="font-bold text-2xl gradient-purple">Vibe</Link>
        </div>
        
        <div className="flex justify-around w-full md:flex-col md:gap-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
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
          
          {currentUser && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="relative group"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
              
              {/* Desktop tooltip */}
              <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                Logout
              </div>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
