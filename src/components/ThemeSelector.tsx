import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeSelectorProps {
  expanded?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ expanded = false }) => {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { id: 'default', name: 'Default', color: 'bg-primary' },
    { id: 'neon', name: 'Neon', color: 'bg-theme-neon' },
    { id: 'pastel', name: 'Pastel', color: 'bg-theme-pastel' },
    { id: 'midnight', name: 'Midnight', color: 'bg-theme-midnight' },
    { id: 'sunset', name: 'Sunset', color: 'bg-theme-sunset' },
  ];
  
  if (expanded) {
    // Render expanded version with theme buttons inline
    return (
      <div className="w-full">
        <h4 className="font-medium text-sm mb-2 px-3">Theme</h4>
        <div className="grid grid-cols-5 gap-1 px-3">
          {themes.map((t) => (
            <motion.button
              key={t.id}
              className={cn(
                "w-6 h-6 rounded-full transition-all", 
                t.color,
                theme === t.id ? 'ring-2 ring-ring ring-offset-2' : 'hover:scale-110'
              )}
              onClick={() => setTheme(t.id as any)}
              title={t.name}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                scale: theme === t.id ? 1 : 0.9,
                boxShadow: theme === t.id ? '0 0 0 2px rgba(255,255,255,0.2)' : 'none'
              }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Collapsed version with popover
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative group"
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <Paintbrush className="h-4 w-4" />
          </motion.div>
          <span className="sr-only">Change theme</span>
          <div className="absolute inset-0 rounded-md overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-full h-1/5 bg-theme-neon" />
            <div className="w-full h-1/5 bg-theme-pastel" />
            <div className="w-full h-1/5 bg-theme-midnight" />
            <div className="w-full h-1/5 bg-theme-sunset" />
            <div className="w-full h-1/5 bg-primary" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60" align="center">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Choose a theme</h4>
          <div className="grid grid-cols-5 gap-2 py-2">
            {themes.map((t) => (
              <motion.button
                key={t.id}
                className={cn(
                  "w-8 h-8 rounded-full transition-all", 
                  t.color,
                  theme === t.id ? 'ring-2 ring-ring ring-offset-2' : ''
                )}
                onClick={() => setTheme(t.id as any)}
                title={t.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeSelector;
